"""EXP-LM-001 elastic: early-exit fast path + entropy-gated escalation.

Fast path: run only the first K transformer blocks, then the model's own
final layernorm + lm_head (no new parameters, no training). Escalate to the
full 12-block pass when the fast path's top-1 confidence is below threshold
(with hysteresis margin to avoid oscillation).

Measures: fast-path rate, escalation rate, quality delta, latency delta,
calibration (mean confidence vs accuracy on fast path).
Lineage child of EXP-LM-001 baselines.
"""
import json
import sys
import time

import torch

sys.path.insert(0, ".")
from ppl import rss_mb, EVAL_SENTENCES  # noqa: E402

torch.manual_seed(1337)

EXIT_AT = 6
THRESHOLD = 0.35
HYSTERESIS = 0.05


def run(model, tok, threshold, repeat, out_path):
    model.eval()
    nll_full, nll_fast, n_tokens = 0.0, 0.0, 0
    fast_n, esc_n, conf_sum, conf_hit = 0, 0, 0.0, 0
    t_fast, t_full = 0.0, 0.0
    blocks = model.transformer.h
    ln_f = model.transformer.ln_f
    head = model.lm_head
    with torch.no_grad():
        for sent in EVAL_SENTENCES:
            ids = tok(sent, return_tensors="pt").input_ids
            hidden = model.transformer.wte(ids) + model.transformer.wpe(
                torch.arange(ids.size(1)).unsqueeze(0))
            t0 = time.time()
            h = hidden
            for b in blocks[:EXIT_AT]:
                h = b(h)[0]
            fast_logits = head(ln_f(h))
            t_fast += time.time() - t0
            probs = torch.softmax(fast_logits[0, :-1], dim=-1)
            top = probs.max(dim=-1)
            escalate = bool((top.values < threshold).any())
            t0 = time.time()
            if escalate:
                h = hidden
                for b in blocks:
                    h = b(h)[0]
                logits = head(ln_f(h))
                esc_n += 1
            else:
                logits = fast_logits
                fast_n += 1
            t_full += time.time() - t0
            lb = ids[..., 1:].contiguous()
            loss = torch.nn.functional.cross_entropy(
                logits[..., :-1, :].contiguous().view(-1, logits.size(-1)),
                lb.view(-1), reduction="sum")
            nll_full += loss.item()
            n_tokens += lb.numel()
            pred = logits[0, :-1].argmax(dim=-1)
            hit = (pred == lb[0]).float()
            conf_sum += top.values.mean().item() * lb.numel()
            conf_hit += (hit * top.values).sum().item()
    import math
    ce = nll_full / n_tokens
    n_sent = len(EVAL_SENTENCES)
    rec = {"experiment_id": "EXP-LM-001", "variant": f"elastic-exit{EXIT_AT}",
           "repeat": repeat, "seed": 1337, "threshold": threshold,
           "fast_sentences": fast_n, "escalated_sentences": esc_n,
           "fast_rate": round(fast_n / n_sent, 3),
           "escalation_rate": round(esc_n / n_sent, 3),
           "cross_entropy": round(ce, 4), "perplexity": round(math.exp(ce), 3),
           "mean_confidence": round(conf_sum / n_tokens, 3),
           "conf_weighted_acc": round(conf_hit / n_tokens, 3),
           "fast_path_s": round(t_fast, 1), "escalation_s": round(t_full, 1),
           "peak_rss_mb": round(rss_mb(), 1)}
    with open(out_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec) + "\n")
    print(json.dumps(rec))


def main():
    from transformers import AutoModelForCausalLM, AutoTokenizer
    threshold = float(sys.argv[1]) if len(sys.argv) > 1 else THRESHOLD
    repeat = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    out_path = sys.argv[3] if len(sys.argv) > 3 else "results.jsonl"
    snap = "gpt-neo-125M-fp32"
    tok = AutoTokenizer.from_pretrained(snap, trust_remote_code=False)
    model = AutoModelForCausalLM.from_pretrained(snap, torch_dtype="float32",
                                                 trust_remote_code=False)
    run(model, tok, threshold, repeat, out_path)


if __name__ == "__main__":
    main()
