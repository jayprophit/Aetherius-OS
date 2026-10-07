"""BUILD86 - ternary LM benchmark (one layer, bounded) + transform+pattern+residual.

Ternary native at full-model PPL scale is infeasible with the current per-row
Python kernel (thousands of calls); the honest bounded test is one real
projection layer: FP32 vs ternary-reconstruction vs ternary native kernel,
measuring output error and latency. Full-model ternary quality is already
known-catastrophic from BUILD84 (3.1e52); this test answers execution, not quality.
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import numpy as np
import torch

sys.path.insert(0, r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS\research\build84")
sys.path.insert(0, r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS\research\build85\kernel_ternary")
sys.path.insert(0, r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS\research\build85\kernel_binary")
from codec import Harness, codebook_quantise, TRANSFORMS  # noqa: E402
from kernel_ternary import pack_ternary, ter_linear  # noqa: E402

ROOT = Path(__file__).resolve().parent
torch.set_num_threads(4)


def main() -> None:
    H = Harness()
    fp32, _, _ = H.ppl()
    print(f"FP32 reference ppl={fp32:.4f}")
    layer = H.model.gpt_neox.layers[0].attention.dense  # 512x512
    W = layer.weight.detach().numpy().astype(np.float32)
    print(f"layer weight shape {W.shape}")

    # deterministic activation batch from the real corpus prefix
    with torch.inference_mode():
        h = H.model.gpt_neox.embed_in(H.ids[:, :64])
    X = h[0].detach().numpy().astype(np.float32)  # 64 x 512 tokens
    Y_ref = X @ W.T

    # ternary reconstruction path (BUILD84 method): threshold + scale
    thr = np.quantile(np.abs(W), 2.0 / 3.0)
    sc = float(np.abs(W).max()) or 1.0
    T = np.where(W > thr, 1, np.where(W < -thr, -1, 0)).astype(np.int8)
    Wrec = T.astype(np.float32) * sc
    Y_recon = X @ Wrec.T

    # ternary NATIVE kernel path: same T, integer arithmetic only
    def ker_row(x):
        thr = np.quantile(np.abs(x), 2.0 / 3.0)
        return np.where(x > thr, 1, np.where(x < -thr, -1, 0)).astype(np.int8)

    t0 = time.perf_counter()
    Yk = np.empty_like(Y_ref)
    Wp, Wn, K, pad = pack_ternary(T)
    Ater = np.empty_like(X)
    for i in range(X.shape[0]):
        a = ker_row(X[i])
        Ater[i] = np.where(a == 1, 1.0, np.where(a == -1, -1.0, 0.0)).astype(np.float32)
        ap, an, _, _ = pack_ternary(a)
        Yk[i] = ter_linear(Wp, Wn, ap, an, K, pad).astype(np.float32) * sc
    t_ker = time.perf_counter() - t0
    # like-for-like reference: SAME ternarized activations, float arithmetic
    Y_ref2 = Ater @ Wrec.T
    t0 = time.perf_counter()
    for _ in range(3):
        _ = X @ Wrec.T
    t_fp = (time.perf_counter() - t0) / 3

    err_recon = float(np.abs(Y_recon - Y_ref).max())
    err_act = float(np.abs(Y_ref2 - Y_recon).max())
    err_ker = float(np.abs(Yk - Y_ref2).max())
    rel = float(np.abs(Yk - Y_ref2).max() / max(np.abs(Y_ref2).max(), 1e-12))
    print(f"ternary-recon vs FP32: max_abs_err={err_recon:.6f}")
    print(f"activation-quant contribution: max_abs_err={err_act:.6f}")
    print(f"ternary-NATIVE vs like-for-like float: max_abs_err={err_ker:.9f} rel={rel:.2e}")
    print(f"latency 64tok: fp-recon={t_fp*1e3:.2f}ms native-kernel={t_ker*1e3:.2f}ms")

    rep = {"experiment_id": "B86-TERNARY-LAYER",
           "execution_domain": "TERNARY_NATIVE vs TERNARY_RECONSTRUCTED",
           "layer": "pythia-70m layers.0.attention.dense 512x512",
           "ternary_recon_max_abs_err_vs_fp32": err_recon,
           "native_vs_recon_max_abs_err": err_ker,
           "native_vs_recon_rel_err": rel,
           "latency_ms_64tok_fp_recon": round(t_fp * 1e3, 3),
           "latency_ms_64tok_native": round(t_ker * 1e3, 3),
           "status": "OK"}
    (ROOT / "ternary_layer.json").write_text(json.dumps(rep, indent=1))
    with open(ROOT / "results.jsonl", "a", encoding="utf-8") as fh:
        fh.write(json.dumps(rep) + "\n")

    # ---- transform + pattern + residual (power_0.15, best nonlinear) ----
    fwd, inv = TRANSFORMS["power_0.15"]
    pristine = {n: p.detach().clone() for n, p in H.matrices}
    for frac in (0.0, 0.05, 0.15):
        arrays = {}
        for n, p in H.matrices:
            orig = pristine[n].numpy().astype(np.float32)
            codes, cent, rec = codebook_quantise(orig, 4, fwd, inv)
            if frac:
                flat = (orig - rec).reshape(-1)
                k = max(1, int(round(flat.size * frac)))
                idx = np.sort(np.argpartition(np.abs(flat), -k)[-k:])
                vals = flat[idx]
                mx = float(np.abs(vals).max()) or 1.0
                q = np.clip(np.round(vals / mx * 127.0), -127, 127).astype(np.int8)
                out = rec.reshape(-1).copy()
                out[idx] = out[idx] + q.astype(np.float32) / 127.0 * mx
                rec = out.reshape(orig.shape)
            p.data.copy_(torch.from_numpy(rec.astype(np.float32)))
        pplv, loss, secs = H.ppl()
        print(f"TPR frac={frac:.0%} ppl={pplv:.4f}")
        with open(ROOT / "results.jsonl", "a", encoding="utf-8") as fh:
            fh.write(json.dumps({"experiment_id": f"B86-TPR-{int(frac*100)}pct",
                                 "method": f"power_0.15+4-codebook+residual {frac:.0%}",
                                 "perplexity": pplv, "loss": loss,
                                 "execution_domain": "STORAGE_RECONSTRUCTION",
                                 "status": "OK"}) + "\n")
        for n, p in H.matrices:
            p.data.copy_(pristine[n])
    print("done")


if __name__ == "__main__":
    main()