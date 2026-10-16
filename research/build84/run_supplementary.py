"""BUILD84 supplementary - get a NON-DEGENERATE signal for pattern/residual.

The main matrix showed every low-bit variant collapsed to perplexity ~1e28-1e53,
which is the expected outcome of naive post-training quantisation on a 70M LM
with no calibration. Comparing residual densities inside that regime is
meaningless, so this pass re-runs the pattern/residual family at a level count
where the model survives, plus proper calibration-free INT8 dynamic quantisation.
"""
from __future__ import annotations

import json
import time
from pathlib import Path

import numpy as np
import torch

from codec import (Harness, eff_bits, file_sha256, pack_low_bits,
                   TRANSFORMS, codebook_quantise, codebook_residual)

ROOT = Path(__file__).resolve().parent
STORE = ROOT / "storage"


def main() -> None:
    H = Harness()
    print("baseline recheck ppl=%.6f" % H.ppl()[0])

    def emit(rid, method, arrays, n_ref, kind, notes=""):
        path = STORE / f"{rid}.npz"
        np.savez(path, **arrays)
        total = path.stat().st_size
        pplv, loss, secs = H.ppl()
        st = {"total_bytes": total, "effective_bits_per_param": round(eff_bits(total, n_ref), 4),
              "components": {k: int(np.asarray(v).nbytes) for k, v in arrays.items()},
              "artifact": str(path), "sha256_head": file_sha256(path)[:16]}
        H.record(rid, method, st, pplv, loss, secs,
                 extra={"experiment_kind": kind, "target_params": n_ref,
                        "compute_datatype": "FP32 (dequantised)"},
                 notes=notes)
        print(f"{rid:44s} ppl={pplv:12.4f} bytes={total:>10d} bits/p={st['effective_bits_per_param']:.3f}")
        return pplv, st

    # 1) INT8 dynamic - calibration-free, per-channel weights
    from torch.ao.quantization import quantize_dynamic
    lin = {n: m for n, m in H.model.named_modules() if isinstance(m, torch.nn.Linear)}
    qm = quantize_dynamic(copy_model := __import__("copy").deepcopy(H.model),
                          {torch.nn.Linear}, dtype=torch.qint8)
    # evaluate the quantised copy on the same corpus
    with torch.inference_mode():
        out = qm(H.ids, labels=H.ids)
        loss = float(out.loss)
        pplv = float(np.exp(loss))
    t = time.perf_counter()
    with torch.inference_mode():
        qm(H.ids)
    secs = time.perf_counter() - t
    n_lin = sum(p.numel() for m in lin.values() for p in m.parameters(recurse=False))
    int8_bytes = n_lin  # 1 byte per weight in the dynamic scheme
    st = {"total_bytes": int8_bytes,
          "effective_bits_per_param": round(eff_bits(int8_bytes, n_lin), 4),
          "components": {"qint8 weights (Linear only)": int8_bytes},
          "artifact": None,
          "note": "torch dynamic fbgemm; no packed artifact written by the backend"}
    H.record("B84-INT8-DYNAMIC", "INT8 dynamic quantisation (fbgemm)", st, pplv, loss, secs,
             extra={"experiment_kind": "INFERENCE_NATIVE_INT8", "target_params": n_lin},
             notes="INT8_DYNAMIC is natively executable (INT8 kernels), unlike the "
                   "dequantise-to-FP32 variants; dynamic scales are not packed by fbgemm")
    print(f"B84-INT8-DYNAMIC                               ppl={pplv:12.4f} "
          f"bits/p={st['effective_bits_per_param']:.3f}")

    # 2) Non-degenerate base so the sparse-residual family can be discriminated.
#    A 256-level global codebook was tried first and rejected: 70M weights x 256
#    centroids x 24 Lloyd iterations is ~4e11 operations per variant, infeasible
#    on 4 cores. Per-row 8-bit uniform is used instead - cheap, and mild enough
#    that the model survives, so residual density becomes the variable under test.
    from codec import sym_quantise
    pristine = {n: p.detach().clone() for n, p in H.matrices}
    for frac in (0.0, 0.02, 0.05, 0.15):
        arrays = {}
        for n, p in H.matrices:
            orig = pristine[n].detach().numpy().astype(np.float32)
            codes, scale, zp, rec = sym_quantise(orig, 256)   # 8-bit per row
            arrays[f"{n}|codes"] = pack_low_bits(codes, 8)
            arrays[f"{n}|scale"] = scale
            if frac:
                flat_res = (orig - rec).reshape(-1)
                k = max(1, int(round(flat_res.size * frac)))
                idx = np.sort(np.argpartition(np.abs(flat_res), -k)[-k:])
                vals = flat_res[idx]
                mx = float(np.abs(vals).max()) or 1.0
                q = np.clip(np.round(vals / mx * 127.0), -127, 127).astype(np.int8)
                out = rec.reshape(-1).copy()
                out[idx] = q.astype(np.float32) / 127.0 * mx
                arrays[f"{n}|res_idx"] = idx.astype(np.int32)
                arrays[f"{n}|res_val"] = q
                arrays[f"{n}|res_scale"] = np.array([mx], np.float32)
                rec = out.reshape(orig.shape)
            p.data.copy_(torch.from_numpy(rec.astype(np.float32)))
        emit(f"B84-INT8ROW-RESIDUAL-{int(frac*100)}pct",
             f"per-row INT8 base + sparse residual {frac:.0%}",
             arrays, H.mat_params, "STORAGE_RECONSTRUCTION",
             notes="non-degenerate base; isolates whether sparse residual recovers quality")
        for n, p in H.matrices:
            p.data.copy_(pristine[n])
    print("done")


if __name__ == "__main__":
    main()