"""Perplexity harness: fixed tokenization, fixed order, fixed seed.

Usage: python ppl.py <model-dir> <out-jsonl> <repeat-index> [--int8]
--int8 applies torch dynamic quantization (CPU) to Linear layers before eval.
Peak RAM is measured via own RSS delta (psutil if present, else resource).
"""
import json
import sys
import time

import torch

from eval_set import EVAL_SENTENCES

torch.manual_seed(1337)


def rss_mb():
    try:
        import psutil
        return psutil.Process().memory_info().rss / 1e6
    except ImportError:
        import resource
        return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1e3


def main():
    model_dir, out_path, repeat = sys.argv[1], sys.argv[2], int(sys.argv[3])
    use_int8 = "--int8" in sys.argv
    from transformers import AutoModelForCausalLM, AutoTokenizer
    t0 = time.time()
    tok = AutoTokenizer.from_pretrained(model_dir, trust_remote_code=False)
    model = AutoModelForCausalLM.from_pretrained(model_dir, torch_dtype="float32",
                                                 trust_remote_code=False)
    load_s = round(time.time() - t0, 1)
    if use_int8:
        t0 = time.time()
        model = torch.quantization.quantize_dynamic(
            model, {torch.nn.Linear}, dtype=torch.qint8)
        quant_s = round(time.time() - t0, 1)
    else:
        quant_s = 0.0
    model.eval()
    base_rss = rss_mb()
    nll_sum, n_tokens, t_infer = 0.0, 0, 0.0
    with torch.no_grad():
        for sent in EVAL_SENTENCES:
            ids = tok(sent, return_tensors="pt").input_ids
            t0 = time.time()
            out = model(ids, labels=ids)
            t_infer += time.time() - t0
            # cross-entropy mean over non-shifted positions, standard LM eval
            logits = out.logits
            shift_logits = logits[..., :-1, :].contiguous()
            shift_labels = ids[..., 1:].contiguous()
            loss = torch.nn.functional.cross_entropy(
                shift_logits.view(-1, shift_logits.size(-1)),
                shift_labels.view(-1), reduction="sum")
            nll_sum += loss.item()
            n_tokens += shift_labels.numel()
    peak_rss = rss_mb()
    ce = nll_sum / n_tokens
    import math
    rec = {"experiment_id": "EXP-LM-001", "variant": "int8-dynamic" if use_int8 else "fp32",
           "repeat": repeat, "seed": 1337, "eval_set": "EVAL-SET-001",
           "n_sentences": len(EVAL_SENTENCES), "n_tokens": n_tokens,
           "cross_entropy": round(ce, 4), "perplexity": round(math.exp(ce), 3),
           "load_s": load_s, "quant_s": quant_s,
           "infer_s": round(t_infer, 1),
           "tok_per_s": round(n_tokens / max(t_infer, 1e-6), 1),
           "peak_rss_mb": round(peak_rss, 1)}
    with open(out_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec) + "\n")
    print(json.dumps(rec))


if __name__ == "__main__":
    main()
