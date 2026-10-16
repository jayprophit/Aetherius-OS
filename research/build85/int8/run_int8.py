"""BUILD85 - INT8 dynamic, corrected (handover BUILD84 §3).

Failure was: qlinear_dynamic (ONEDNN): data type of input should be float.
Fix applied here: quantise ONLY the attention+MLP Linear modules inside the
transformer blocks, leaving embed_in, final_layer_norm, rotary and the tied
lm_head untouched. Module coverage is enumerated and recorded so the claim
"whole-model INT8" is never made - it is block-linears-only INT8.
"""
from __future__ import annotations

import copy
import json
import time
from pathlib import Path

import numpy as np
import torch
from torch.ao.quantization import quantize_dynamic

from codec import Harness, eff_bits

ROOT = Path(__file__).resolve().parent


def main() -> None:
    H = Harness()
    print("FP32 reference ppl=%.6f" % H.ppl()[0])

    blocks = list(H.model.gpt_neox.layers)
    print(f"blocks={len(blocks)}")
    lin_names = []
    for bi, blk in enumerate(blocks):
        for n, m in blk.named_modules():
            if isinstance(m, torch.nn.Linear):
                lin_names.append(f"layers.{bi}.{n}")
    print(f"block Linear modules to quantise: {len(lin_names)}")
    for n in lin_names[:4]:
        print("  ", n)
    print("  ...")

    # quantise each block separately so embed/norm/head stay FP32
    t0 = time.perf_counter()
    for blk in blocks:
        quantize_dynamic(blk, {torch.nn.Linear}, dtype=torch.qint8, inplace=True)
    qtime = time.perf_counter() - t0

    n_q = 0
    n_qparams = 0
    for n, m in H.model.named_modules():
        if type(m).__name__ in ("LinearDynamic", "LinearPackedParams") or \
                "quantized" in type(m).__module__:
            n_q += 1
    for n, p in H.model.named_parameters():
        pass
    # count quantised params via packed modules
    for blk in blocks:
        for m in blk.modules():
            if hasattr(m, "_packed_params") and m._packed_params is not None:
                try:
                    n_qparams += int(m._packed_params._weight_bias()[0].numel())
                except Exception:
                    pass
    print(f"quantised_modules={n_q} quantised_params={n_qparams}")

    t1 = time.perf_counter()
    try:
        with torch.inference_mode():
            out = H.model(H.ids, labels=H.ids)
            loss = float(out.loss)
            pplv = float(np.exp(loss))
        eval_s = time.perf_counter() - t1
        print(f"INT8-DYNAMIC ppl={pplv:.6f} loss={loss:.6f} eval={eval_s:.2f}s")
        status, notes = "OK", (f"block attention+MLP Linear only ({len(lin_names)} modules); "
                               "embed/norm/rotary/lm_head remain FP32")
    except Exception as e:
        import traceback
        traceback.print_exc()
        pplv, loss, eval_s, status = None, None, None, "FAILED"
        notes = str(e)[:300]

    int8_bytes = n_qparams  # 1 byte/weight in the dynamic scheme
    row = {
        "experiment_id": "B85-INT8-DYNAMIC",
        "method": "INT8 dynamic quantisation (fbgemm), transformer-block attention+MLP Linear only",
        "block_linear_modules": len(lin_names),
        "quantised_params": n_qparams,
        "quantise_time_s": round(qtime, 3),
        "storage": {"total_bytes": int8_bytes,
                    "effective_bits_per_param": round(eff_bits(int8_bytes, n_qparams), 4)
                    if n_qparams else None,
                    "artifact": None,
                    "note": "dynamic scales not packed by the backend; 1 byte/weight"},
        "perplexity": pplv, "loss": loss, "eval_seconds": eval_s,
        "experiment_kind": "INFERENCE_NATIVE_INT8",
        "status": status, "notes": notes,
    }
    with open(ROOT / "results.jsonl", "a", encoding="utf-8") as fh:
        fh.write(json.dumps(row) + "\n")
    print("WROTE B85-INT8-DYNAMIC status=" + status)


if __name__ == "__main__":
    main()