"""BUILD84 driver - runs the BUILD78 compression matrix on pythia-70m."""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

import numpy as np
import torch

from codec import (CORPUS_TOKENS, MODEL, REVISION, ROOT, SEED, STORE, Harness,
                   TRANSFORMS, codebook_quantise, codebook_residual, eff_bits,
                   file_sha256, pack_low_bits, sym_quantise)

LEVELS_BITS = {4: 4, 2: 2, 3: 2, 1: 1}     # levels -> code bits
LEVEL_NAME = {4: "INT4", 2: "INT2", 3: "TERNARY", 1: "BINARY"}


def save_arrays(name: str, arrays: dict) -> dict:
    path = STORE / f"{name}.npz"
    np.savez(path, **arrays)
    total = path.stat().st_size
    comp = {k: int(np.asarray(v).nbytes) for k, v in arrays.items()}
    return {"file": str(path), "file_bytes": total,
            "component_bytes": comp,
            "sha256_head": file_sha256(path)[:16]}


def apply_uniform(H, levels, tname):
    """Uniform/ternary/binary row-wise codec across all 2-D matrices."""
    store, orig = {}, {}
    for n, p in H.matrices:
        orig[n] = p.detach().clone()
        w = p.detach().numpy().astype(np.float32)
        codes, scale, zp, rec = sym_quantise(w, levels)
        packed = pack_low_bits(codes, LEVELS_BITS[levels])
        store[n] = (packed, scale, zp)
        p.data.copy_(torch.from_numpy(rec.astype(np.float32)))
    arrays = {}
    for n, (packed, scale, zp) in store.items():
        arrays[f"{n}|packed"] = packed
        arrays[f"{n}|scale"] = scale
        if zp is not None:
            arrays[f"{n}|zp"] = zp
    return orig, arrays


def apply_codebook(H, levels, tname, inv_name, sparse_frac=None):
    fwd, inv = TRANSFORMS[inv_name]
    orig, arrays = {}, {}
    for n, p in H.matrices:
        orig[n] = p.detach().clone()
        w = p.detach().numpy().astype(np.float32)
        codes, cent, rec = codebook_quantise(w, levels, fwd, inv)
        packed = pack_low_bits(codes, LEVELS_BITS[levels])
        arrays[f"{n}|packed"] = packed
        arrays[f"{n}|centroids"] = cent
        if sparse_frac:
            w2, idx, q, mx = codebook_residual(w, sparse_frac, codes, cent, inv)
            arrays[f"{n}|res_idx"] = idx
            arrays[f"{n}|res_val"] = q
            arrays[f"{n}|res_scale"] = np.array([mx], np.float32)
            rec = w2
        p.data.copy_(torch.from_numpy(rec.astype(np.float32)))
    return orig, arrays


def restore(H, orig):
    for n, p in H.matrices:
        if n in orig:
            p.data.copy_(orig[n])


def main() -> None:
    H = Harness()
    ident = dict(H.identity)
    ident.update({
        "exact_parameter_count": H.n_params,
        "matrix_parameter_count": H.mat_params,
        "fp32_weight_bytes": H.weight_bytes_fp32,
        "in_band_30M_100M": 30e6 <= H.n_params <= 100e6,
        "licence": "Apache-2.0",
        "load_time_s": round(H.load_time, 3),
    })
    print("MODEL", json.dumps(ident))
    print("CORPUS", json.dumps(H.corpus))

    summary = {"model_identity": ident, "corpus": H.corpus, "rows": []}

    def run(rid, method, orig, arrays, n_params_ref, kind, notes=""):
        st = save_arrays(rid, arrays) if arrays else {"file_bytes": int(n_params_ref * 4),
                                                     "file": None, "component_bytes": {}}
        pplv, loss, secs = H.ppl()
        row = H.record(rid, method, {
            "total_bytes": st["file_bytes"],
            "effective_bits_per_param": round(eff_bits(st["file_bytes"], n_params_ref), 4),
            "components": st["component_bytes"], "artifact": st.get("file"),
        }, pplv, loss, secs,
            extra={"experiment_kind": kind, "target_params": n_params_ref,
                   "compute_datatype": "FP32 (dequantised) unless stated"},
            notes=notes)
        row["method"] = method
        row["ppl"] = pplv
        row["kind"] = kind
        row["total_bytes"] = st["file_bytes"]
        row["eff_bits"] = row["storage"]["effective_bits_per_param"]
        summary["rows"].append({k: row[k] for k in
                                ("method", "ppl", "total_bytes", "eff_bits", "kind", "status")})
        print(f"{rid:38s} ppl={pplv:12.4f} bytes={st['file_bytes']:>11d} "
              f"bits/p={row['eff_bits']:6.3f} {secs:6.2f}s")
        if orig is not None:
            restore(H, orig)
        return row

    # ---------- baselines ----------
    ppl0, loss0, s0 = H.ppl()
    for i in range(3):
        p, l, s = H.ppl()
        H.record(f"B84-FP32-repeat{i+1}", "FP32 dense reference", {
            "total_bytes": H.weight_bytes_fp32,
            "effective_bits_per_param": 32.0,
            "components": {"all weights fp32": H.weight_bytes_fp32}},
            p, l, s, extra={"experiment_kind": "INFERENCE_NATIVE_FP32"})
        print(f"FP32 repeat {i+1}: ppl={p:.6f} (identical={abs(p-ppl0)<1e-9})")

    H.record("B84-FP32", "FP32 dense reference", {
        "total_bytes": H.weight_bytes_fp32, "effective_bits_per_param": 32.0,
        "components": {"all weights fp32": H.weight_bytes_fp32}},
        ppl0, loss0, s0, extra={"experiment_kind": "INFERENCE_NATIVE_FP32"},
        notes=f"tokens/s={round(H.gen_speed(),3)}")
    print(f"FP32 dense: ppl={ppl0:.6f} bytes={H.weight_bytes_fp32} tok/s={H.gen_speed():.2f}")

    # FP16 / BF16
    for dt, name in ((torch.float16, "FP16"), (torch.bfloat16, "BF16")):
        try:
            snapshot = {k: v.detach().clone() for k, v in H.model.state_dict().items()}
            H.model.to(dt)
            p, l, s = H.ppl()
            H.record(f"B84-{name}", f"{name} native dtype", {
                "total_bytes": H.n_params * dt.itemsize,
                "effective_bits_per_param": 8 * dt.itemsize,
                "components": {f"all weights {name}": H.n_params * dt.itemsize}},
                p, l, s,
                extra={"experiment_kind": f"INFERENCE_NATIVE_{name}",
                       "compute_datatype": name,
                       "tokens_per_s": round(H.gen_speed(), 3)},
                notes="CPU execution of reduced-precision dtype; not hardware-accelerated")
            print(f"{name}: ppl={p:.6f}")
            H.model.load_state_dict(snapshot)
            H.model.to(torch.float32)
        except Exception as e:
            H.record(f"B84-{name}", f"{name} native dtype", {}, None, None, None,
                     status="FAILED", notes=str(e)[:200])

    # ---------- ordinary quantisation ----------
    for levels, kind in ((4, "INFERENCE_CAPABLE_VIA_DEQUANT"), (2, None),
                         (3, None), (1, None)):
        nm = LEVEL_NAME[levels]
        orig, arrays = apply_uniform(H, levels, nm)
        run(f"B84-{nm}", f"{nm} row-wise uniform (signed)", orig, arrays,
            H.mat_params, "STORAGE_RECONSTRUCTION",
            notes="per-row scale; packed codes; inference runs on dequantised FP32")
        del orig, arrays

    # ---------- nonlinear families (2-bit, matching the historical branch) ----------
    for tname in TRANSFORMS:
        orig, arrays = apply_codebook(H, 4, tname, tname, None)
        run(f"B84-NL-{tname}", f"transform {tname} + 4-level codebook", orig, arrays,
            H.mat_params, "STORAGE_RECONSTRUCTION",
            notes=f"nonlinear transform {tname} applied before codebook fit")
        del orig, arrays

    # ---------- pattern-only / pattern+residual / transform+pattern+residual ----------
    orig, arrays = apply_codebook(H, 4, "codebook", "identity", None)
    run("B84-PATTERN-ONLY", "PATTERN_ONLY: shared 4-centroid codebook, no residual",
        orig, arrays, H.mat_params, "STORAGE_RECONSTRUCTION",
        notes="pattern = shared 1-D codebook indices; no per-weight scale/zero-point")
    del orig, arrays

    for frac in (0.01, 0.02, 0.05, 0.10, 0.25, 0.50):
        orig, arrays = apply_codebook(H, 4, "codebook", "identity", frac)
        run(f"B84-PATTERN-RESIDUAL-{int(frac*100)}pct",
            f"PATTERN + SPARSE RESIDUAL density {frac:.0%}", orig, arrays,
            H.mat_params, "STORAGE_RECONSTRUCTION",
            notes=f"residual kept for largest {frac:.0%} magnitudes; int8 + int32 indices")
        del orig, arrays

    best_t = "cbrt"
    for frac in (0.02, 0.05, 0.10, 0.25):
        orig, arrays = apply_codebook(H, 4, "codebook", best_t, frac)
        run(f"B84-TRANSFORM-PATTERN-RESIDUAL-{int(frac*100)}pct",
            f"TRANSFORM({best_t}) + PATTERN + SPARSE RESIDUAL {frac:.0%}",
            orig, arrays, H.mat_params, "STORAGE_RECONSTRUCTION",
            notes="full historical family W ~ T^-1(C[z] + Rs) instantiated")
        del orig, arrays

    (ROOT / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print("\nWROTE", ROOT / "summary.json")


if __name__ == "__main__":
    main()