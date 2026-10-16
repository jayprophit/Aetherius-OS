"""EXP-LM-001 variants: post-training representation sweeps, no training.

Every variant starts from the fp32 snapshot, transforms a COPY of named
weight tensors in numpy/torch, and evaluates with the identical harness
procedure (same tokenizer, order, seed, eval set). Nothing here trains;
anything needing training is recorded BLOCKED, not faked.

Variants: int4-rtn, int2-rtn, ternary-rtn, binary-rtn, codebook(+residual),
perlayer-mixed, earlyexit-k (elastic fast path candidate).
Lineage child of EXP-LM-001 fp32/int8 runs.
"""
import copy
import json
import sys
import time

import numpy as np
import torch

sys.path.insert(0, ".")
from ppl import rss_mb, EVAL_SENTENCES  # noqa: E402

torch.manual_seed(1337)
np.random.seed(1337)


def rtn_quantize(tensor, bits, symmetric=True):
    """Round-to-nearest uniform quantization, per-tensor scale."""
    levels = 2 ** bits
    if bits == 1:
        return torch.sign(tensor) * tensor.abs().mean()
    lo, hi = tensor.min(), tensor.max()
    if symmetric:
        amax = max(abs(float(lo)), abs(float(hi)), 1e-12)
        lo, hi = -amax, amax
    scale = (hi - lo) / (levels - 1) if hi > lo else 1.0
    q = torch.round((tensor - lo) / scale).clamp(0, levels - 1)
    return q * scale + lo


def quantize_state_dict(sd, bits, keep_fp=()):
    out = {}
    for name, tensor in sd.items():
        if any(k in name for k in keep_fp) or tensor.dtype not in (
                torch.float32, torch.float16, torch.bfloat16):
            out[name] = tensor.clone()
        else:
            out[name] = rtn_quantize(tensor.float(), bits)
    return out


def codebook_state_dict(sd, n_codes=16, residual_topk=0.0):
    """Shared codebook per tensor + optional sparse residual of largest errors.
    Returns (new_sd, overhead_bytes_estimate)."""
    out, overhead = {}, 0
    for name, tensor in sd.items():
        if tensor.dtype not in (torch.float32, torch.float16, torch.bfloat16):
            out[name] = tensor.clone()
            continue
        flat = tensor.float().reshape(-1).numpy()
        lo, hi = float(flat.min()), float(flat.max())
        codes = np.linspace(lo, hi, n_codes, dtype=np.float32)
        idx = np.abs(flat[:, None] - codes[None, :]).argmin(axis=1).astype(np.uint8)
        approx = codes[idx].reshape(tensor.shape)
        overhead += n_codes * 4 + idx.size * 0.5  # codes fp32 + 4-bit indices
        if residual_topk > 0:
            err = np.abs(flat - approx.reshape(-1))
            k = max(1, int(err.size * residual_topk))
            top = np.argpartition(err, -k)[-k:]
            res_idx = np.zeros_like(idx)
            res_val = np.zeros_like(flat)
            res_idx[top] = 1
            res_val[top] = flat[top] - approx.reshape(-1)[top]
            overhead += k * (4 + 4)  # int32 index + fp32 value
            approx = (approx.reshape(-1) + res_val).reshape(tensor.shape)
            overhead += k * 0.125  # 1-bit mask
        out[name] = torch.from_numpy(approx.copy())
    return out, overhead


def evaluate(model, tok, variant, repeat, extra=None):
    from transformers import AutoTokenizer  # noqa
    import math
    model.eval()
    nll_sum, n_tokens, t_infer = 0.0, 0, 0.0
    with torch.no_grad():
        for sent in EVAL_SENTENCES:
            ids = tok(sent, return_tensors="pt").input_ids
            t0 = time.time()
            out = model(ids, labels=ids)
            t_infer += time.time() - t0
            logits = out.logits
            sl = logits[..., :-1, :].contiguous()
            lb = ids[..., 1:].contiguous()
            loss = torch.nn.functional.cross_entropy(
                sl.view(-1, sl.size(-1)), lb.view(-1), reduction="sum")
            nll_sum += loss.item()
            n_tokens += lb.numel()
    ce = nll_sum / n_tokens
    rec = {"experiment_id": "EXP-LM-001", "variant": variant, "repeat": repeat,
           "seed": 1337, "eval_set": "EVAL-SET-001", "n_tokens": n_tokens,
           "cross_entropy": round(ce, 4), "perplexity": round(math.exp(ce), 3),
           "infer_s": round(t_infer, 1),
           "tok_per_s": round(n_tokens / max(t_infer, 1e-6), 1),
           "peak_rss_mb": round(rss_mb(), 1)}
    if extra:
        rec.update(extra)
    return rec


def main():
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from safetensors.torch import load_file
    variant, repeat = sys.argv[1], int(sys.argv[2])
    out_path = sys.argv[3]
    snap = "gpt-neo-125M-fp32"
    tok = AutoTokenizer.from_pretrained(snap, trust_remote_code=False)
    t0 = time.time()
    model = AutoModelForCausalLM.from_pretrained(snap, torch_dtype="float32",
                                                 trust_remote_code=False)
    load_s = round(time.time() - t0, 1)
    sd = {k: v.float() for k, v in model.state_dict().items()}
    extra, transform_s = {}, 0.0
    t0 = time.time()
    if variant == "int4-rtn":
        model.load_state_dict(quantize_state_dict(sd, 4))
    elif variant == "int2-rtn":
        model.load_state_dict(quantize_state_dict(sd, 2))
    elif variant == "ternary-rtn":
        new_sd = {}
        for name, tensor in sd.items():
            if tensor.dtype == torch.float32 and "weight" in name and tensor.dim() == 2:
                thresh = 0.7 * tensor.abs().mean()
                new_sd[name] = torch.where(tensor > thresh, tensor.abs().mean(),
                                           torch.where(tensor < -thresh, -tensor.abs().mean(),
                                                       torch.zeros_like(tensor)))
            else:
                new_sd[name] = tensor.clone()
        model.load_state_dict(new_sd)
    elif variant == "binary-rtn":
        new_sd = {}
        for name, tensor in sd.items():
            if tensor.dtype == torch.float32 and "weight" in name and tensor.dim() == 2:
                new_sd[name] = torch.sign(tensor) * tensor.abs().mean()
            else:
                new_sd[name] = tensor.clone()
        model.load_state_dict(new_sd)
    elif variant == "codebook-16":
        new_sd, overhead = codebook_state_dict(sd, 16, 0.0)
        model.load_state_dict(new_sd)
        extra = {"overhead_bytes": int(overhead)}
    elif variant == "codebook-16-resid1pct":
        new_sd, overhead = codebook_state_dict(sd, 16, 0.01)
        model.load_state_dict(new_sd)
        extra = {"overhead_bytes": int(overhead)}
    elif variant.startswith("transform-"):
        import math
        kind = variant.split("-", 1)[1]
        k = 10.0

        def fwd(t):
            if kind == "asinh":
                return torch.asinh(k * t) / math.asinh(k)
            if kind == "cbrt":
                return torch.sign(t) * torch.abs(t) ** (1.0 / 3.0)
            raise SystemExit("bad transform")

        def inv(t):
            if kind == "asinh":
                return torch.sinh(t * math.asinh(k)) / k
            return torch.sign(t) * torch.abs(t) ** 3.0

        new_sd = {}
        for name, tensor in sd.items():
            if tensor.dtype == torch.float32 and tensor.dim() == 2:
                new_sd[name] = inv(rtn_quantize(fwd(tensor), 2))
            else:
                new_sd[name] = tensor.clone()
        model.load_state_dict(new_sd)
    elif variant == "perlayer-mixed":
        new_sd = {}
        for name, tensor in sd.items():
            if any(k in name for k in ("wte", "wpe", "ln_", ".h.0.", ".h.11.")):
                new_sd[name] = tensor.clone()
            elif tensor.dtype == torch.float32:
                new_sd[name] = rtn_quantize(tensor, 2)
            else:
                new_sd[name] = tensor.clone()
        model.load_state_dict(new_sd)
    else:
        raise SystemExit(f"unknown variant {variant}")
    transform_s = round(time.time() - t0, 1)
    rec = evaluate(model, tok, variant, repeat, {**extra, "load_s": load_s,
                                                 "transform_s": transform_s})
    with open(out_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec) + "\n")
    print(json.dumps(rec))


if __name__ == "__main__":
    main()
