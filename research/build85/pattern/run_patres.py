"""BUILD85-R1 - non-degenerate pattern/residual sweep on INT8-row base.

The BUILD84 low-bit rows collapsed (ppl~1e28), making residual comparisons
meaningless. This uses a per-row INT8 base that survives (ppl~87.5), so the
sparse-residual density becomes the variable under test. If residuals help,
PPL must fall as density rises; if not, that is the honest result.
"""
from __future__ import annotations

import json
import time
from pathlib import Path

import numpy as np
import torch

import sys
sys.path.insert(0, r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS\research\build84")
from codec import Harness, eff_bits, sym_quantise  # noqa: E402

ROOT = Path(__file__).resolve().parent
STORE = ROOT / "storage"
STORE.mkdir(parents=True, exist_ok=True)


def main() -> None:
    H = Harness()
    fp32, _, _ = H.ppl()
    print(f"FP32 reference ppl={fp32:.4f}")
    pristine = {n: p.detach().clone() for n, p in H.matrices}

    for frac in (0.0, 0.02, 0.05, 0.15):
        arrays = {}
        for n, p in H.matrices:
            orig = pristine[n].numpy().astype(np.float32)
            codes, scale, zp, rec = sym_quantise(orig, 256)
            arrays[f"{n}|codes"] = codes
            arrays[f"{n}|scale"] = scale
            if frac:
                flat_res = (orig - rec).reshape(-1)
                k = max(1, int(round(flat_res.size * frac)))
                idx = np.sort(np.argpartition(np.abs(flat_res), -k)[-k:])
                vals = flat_res[idx]
                mx = float(np.abs(vals).max()) or 1.0
                q = np.clip(np.round(vals / mx * 127.0), -127, 127).astype(np.int8)
                base = rec.reshape(-1).copy()
                out = base.copy()
                out[idx] = base[idx] + q.astype(np.float32) / 127.0 * mx
                arrays[f"{n}|res_idx"] = idx.astype(np.int32)
                arrays[f"{n}|res_val"] = q
                arrays[f"{n}|res_scale"] = np.array([mx], np.float32)
                rec = out.reshape(orig.shape)
            p.data.copy_(torch.from_numpy(rec.astype(np.float32)))
        path = STORE / f"B85-PATRES-{int(frac*100)}pct.npz"
        np.savez(path, **arrays)
        total = path.stat().st_size
        pplv, loss, secs = H.ppl()
        row = {
            "experiment_id": f"B85-PATRES-{int(frac*100)}pct",
            "method": f"pattern(INT8-row base) + sparse residual {frac:.0%}",
            "storage": {"total_bytes": total,
                        "effective_bits_per_param": round(eff_bits(total, H.mat_params), 4)},
            "perplexity": pplv, "loss": loss, "eval_seconds": round(secs, 3),
            "experiment_kind": "STORAGE_RECONSTRUCTION",
            "status": "OK",
        }
        with open(ROOT / "results.jsonl", "a", encoding="utf-8") as fh:
            fh.write(json.dumps(row) + "\n")
        print(f"frac={frac:.0%} ppl={pplv:.4f} bytes={total} bits/p={row['storage']['effective_bits_per_param']:.3f}")
        for n, p in H.matrices:
            p.data.copy_(pristine[n])
    p2, _, _ = H.ppl()
    print(f"restored FP32 ppl={p2:.4f} (match={abs(p2-fp32)<1e-9})")


if __name__ == "__main__":
    main()
