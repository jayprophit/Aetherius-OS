"""BUILD84 - BUILD78 real-language-model compression matrix.

Model: EleutherAI/pythia-70m (Apache-2.0), ~70M parameters, inside the
required 30M-100M band.

Every variant is written to a REAL file and measured on disk; headline
compression is never reported from code width alone. Per-component byte
accounting is produced for every artifact.

All custom variants dequantise to FP32 before inference, so they are labelled
STORAGE/RECONSTRUCTION EXPERIMENTS rather than native compressed inference.
That distinction is recorded per row.
"""
from __future__ import annotations

import hashlib
import json
import os
import platform
import struct
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import torch

ROOT = Path(__file__).resolve().parent
STORE = ROOT / "storage"
STORE.mkdir(parents=True, exist_ok=True)
RESULTS = ROOT / "results.jsonl"

MODEL = "EleutherAI/pythia-70m"
REVISION = "a39f36b100fe8a5377810d56c3f4789b9c53ac42"
SEED = 81
CORPUS_TOKENS = 1024
CORPUS_DIR = Path(r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS\docs")

torch.manual_seed(SEED)
np.random.seed(SEED)
torch.use_deterministic_algorithms(False)
torch.set_num_threads(4)


# --------------------------------------------------------------------------- utils
def write_blob(path: Path, arrays: dict[str, np.ndarray]) -> dict[str, int]:
    """Serialise components to a real file; return true per-component bytes."""
    payload = {}
    for k, v in arrays.items():
        payload[k] = np.ascontiguousarray(v)
    np.savez(path, **payload)
    return {k: int(np.asarray(v).nbytes) for k, v in payload.items()}


def file_sha256(path: Path, limit: int = 1 << 20) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        while True:
            b = fh.read(limit)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


def pack_low_bits(codes: np.ndarray, bits: int) -> np.ndarray:
    """Pack integer codes (0..2**bits-1) into a uint8 stream, bit-packed."""
    per = 8 // bits
    flat = codes.reshape(-1).astype(np.uint8)
    pad = (-len(flat)) % per
    if pad:
        flat = np.concatenate([flat, np.zeros(pad, np.uint8)])
    flat = flat.reshape(-1, per)
    out = np.zeros(len(flat), np.uint8)
    for i in range(per):
        out |= (flat[:, i] << (bits * i)).astype(np.uint8)
    return out


TRANSFORMS = {
    "identity": (lambda w: w, lambda w: w),
    "sqrt": (lambda w: np.sign(w) * np.sqrt(np.abs(w)),
             lambda w: np.sign(w) * np.square(w)),
    "cbrt": (lambda w: np.sign(w) * np.cbrt(np.abs(w)),
             lambda w: np.sign(w) * np.abs(w) ** 3),
    "fourth_root": (lambda w: np.sign(w) * np.abs(w) ** 0.25,
                    lambda w: np.sign(w) * np.abs(w) ** 4),
    "power_0.15": (lambda w: np.sign(w) * np.abs(w) ** 0.15,
                   lambda w: np.sign(w) * np.abs(w) ** (1 / 0.15)),
    "asinh": (lambda w: np.arcsinh(w / 3.0), lambda w: 3.0 * np.sinh(w)),
    "tanh": (lambda w: np.tanh(w / 3.0), lambda w: 3.0 * np.arctanh(
        np.clip(w, -0.999999, 0.999999))),
}


# --------------------------------------------------------------------------- codec
def codebook_quantise(w: np.ndarray, levels: int, fwd, inv):
    """Shared codebook ("pattern") representation, one codebook per tensor.

    PATTERN DEFINITION (reproducible, no per-weight scale or zero-point):
    a single 1-D codebook of `levels` centroids is fitted to the whole tensor
    by Lloyd iterations on the transformed weights; every weight is then
    replaced by the index of its nearest centroid. Storage = one code index
    per weight + `levels` float32 centroids for the entire tensor.

    A per-row variant was implemented first but abandoned: ~78k rows x 12
    Lloyd iterations in Python took minutes per variant, which is not viable
    on a 4-core host.
    """
    f = fwd(w.astype(np.float32)).astype(np.float32)
    flat = f.reshape(-1)
    cent = np.quantile(flat, (np.arange(levels) + 0.5) / levels).astype(np.float32)
    for _ in range(24):
        codes = np.argmin(np.abs(flat[:, None] - cent[None, :]), axis=1)
        new = np.zeros(levels, np.float32)
        for k in range(levels):
            sel = codes == k
            if sel.any():
                new[k] = flat[sel].mean()
        if np.allclose(new, cent, atol=1e-9):
            cent = new
            break
        cent = new
    codes = np.argmin(np.abs(f.reshape(-1, 1) - cent[None, :]), axis=1)
    rec = (cent[codes] * inv(np.ones_like(cent[codes])) if False else cent[codes])
    return codes.reshape(w.shape).astype(np.uint8), cent, inv(rec.reshape(w.shape))


def codebook_residual(w: np.ndarray, keep_frac: float, codes: np.ndarray,
                      cent: np.ndarray, inv):
    """Sparse residual on top of a codebook reconstruction.

    Residuals are retained for the `keep_frac` largest-magnitude weights per
    tensor and stored as int8 with a per-tensor scale, plus an int32 index map.
    """
    rec = inv(cent[codes.reshape(-1)].reshape(w.shape))
    resid = w.astype(np.float32) - rec
    n = resid.size
    k = max(1, int(round(n * keep_frac)))
    flat = resid.reshape(-1)
    idx = np.argpartition(np.abs(flat), -k)[-k:]
    idx = np.sort(idx)
    vals = flat[idx]
    mx = float(np.abs(vals).max()) if vals.size else 1.0
    mx = mx if mx > 0 else 1.0
    q = np.clip(np.round(vals / mx * 127.0), -127, 127).astype(np.int8)
    out = rec.reshape(-1).copy()
    out[idx] = q.astype(np.float32) / 127.0 * mx
    return out.reshape(w.shape), idx.astype(np.int32), q, np.float32(mx)


def sym_quantise(w: np.ndarray, levels: int):
    """Symmetric row-wise uniform quantisation with scale (+ optional zero)."""
    rows, cols = w.shape
    if levels == 2:                      # binary {+-1}
        scale = np.abs(w).max(axis=1, keepdims=True).astype(np.float32)
        scale[scale == 0] = 1.0
        codes = (w >= 0).astype(np.uint8)
        rec = (codes.astype(np.float32) * 2 - 1) * scale
        return codes, scale, None, rec
    if levels == 3:                      # ternary {-1,0,+1}
        thr = np.quantile(np.abs(w), 2.0 / 3.0, axis=1, keepdims=True).astype(np.float32)
        scale = w.max(axis=1, keepdims=True).astype(np.float32)
        scale[scale == 0] = 1.0
        c = np.zeros(w.shape, np.uint8)
        c[w > thr] = 2
        c[w < -thr] = 0
        rec = (c.astype(np.float32) - 1.0) * scale
        return c, scale, thr, rec
    lo = np.floor(-(levels - 1) / 2)
    hi = -lo
    mx = np.abs(w).max(axis=1, keepdims=True)
    scale = (mx / max(hi, 1)).astype(np.float32)
    scale[scale == 0] = 1.0
    q = np.clip(np.round(w / scale), lo, hi) - lo
    codes = q.astype(np.uint8)
    rec = (q + lo) * scale
    return codes, scale, None, rec


# --------------------------------------------------------------------------- corpus
def build_corpus(tok):
    files = sorted(CORPUS_DIR.glob("*.md"))
    text = "\n".join(f.read_text(encoding="utf-8", errors="replace") for f in files)
    return text, [f.name for f in files], tok


# --------------------------------------------------------------------------- runner
class Harness:
    def __init__(self):
        from transformers import AutoModelForCausalLM, AutoTokenizer
        t0 = time.perf_counter()
        self.tok = AutoTokenizer.from_pretrained(MODEL, revision=REVISION)
        self.model = AutoModelForCausalLM.from_pretrained(MODEL, revision=REVISION)
        self.model.eval()
        self.load_time = time.perf_counter() - t0
        cfg = self.model.config
        self.identity = {
            "model": MODEL, "revision": REVISION,
            "architecture": cfg.architectures if hasattr(cfg, "architectures") else type(self.model).__name__,
            "layers": cfg.num_hidden_layers, "hidden": cfg.hidden_size,
            "heads": cfg.num_attention_heads, "vocab": cfg.vocab_size,
            "context": cfg.max_position_embeddings,
        }
        self.params = [(n, p) for n, p in self.model.named_parameters()]
        self.n_params = int(sum(p.numel() for _, p in self.params))
        self.weight_bytes_fp32 = self.n_params * 4
        self.matrices = [(n, p) for n, p in self.params
                         if p.dim() == 2 and p.numel() >= 4096]
        self.mat_params = int(sum(p.numel() for _, p in self.matrices))
        # fixed corpus
        text, srcs, _ = build_corpus(self.tok)
        ids = self.tok(text, return_tensors="pt").input_ids[0]
        if ids.numel() < CORPUS_TOKENS:
            reps = (ids.numel() // max(CORPUS_TOKENS, 1)) + 1
            ids = ids.repeat(reps)
        self.ids = ids[:CORPUS_TOKENS].unsqueeze(0)
        self.corpus = {
            "name": "local_project_docs_markdown",
            "source": str(CORPUS_DIR), "files": srcs[:12], "n_files": len(srcs),
            "tokens_evaluated": int(self.ids.numel()),
            "sequence_length": int(self.ids.shape[1]),
            "note": "locally cached project documentation; no network dataset needed; "
                    "fixed ordering (sorted glob); identical for every variant",
        }

    def ppl(self) -> tuple[float, float, float]:
        t0 = time.perf_counter()
        with torch.inference_mode():
            out = self.model(self.ids, labels=self.ids)
            loss = float(out.loss)
        dt = time.perf_counter() - t0
        return float(np.exp(loss)), loss, dt

    def gen_speed(self, n: int = 24) -> float:
        self.tok.pad_token = self.tok.eos_token
        enc = self.tok("The engineering verification", return_tensors="pt")
        t0 = time.perf_counter()
        with torch.inference_mode():
            self.model.generate(**enc, max_new_tokens=n, do_sample=False)
        return n / (time.perf_counter() - t0)

    def record(self, rid, method, storage, pplv, loss, eval_s, extra=None,
               status="OK", notes=""):
        row = {
            "experiment_id": rid,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "model": MODEL, "model_revision": REVISION,
            "method": method, "seed": SEED,
            "corpus": self.corpus["name"], "tokens": self.corpus["tokens_evaluated"],
            "perplexity": pplv, "loss": loss, "eval_seconds": round(eval_s, 3),
            "storage": storage,
            "environment": {
                "python": platform.python_version(),
                "torch": torch.__version__, "threads": torch.get_num_threads(),
                "cuda": torch.cuda.is_available(), "platform": platform.platform(),
            },
            "status": status, "notes": notes,
        }
        if extra:
            row.update(extra)
        with open(RESULTS, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(row) + "\n")
        return row


def eff_bits(total_bytes: int, n_params: int) -> float:
    return 8.0 * total_bytes / n_params


if __name__ == "__main__":
    print("module entry; run run_matrix() from build84_experiment.py driver")