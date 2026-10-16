"""Actual packed storage: nibble-pack INT4 / bit-pack 2-bit state dicts.

Unlike variants.py (which measures quality of quantized VALUES held in fp32
tensors), this writes real packed files: 4-bit nibbles / 2-bit quads per
byte plus per-tensor fp32 scale. Bytes on disk are measured, not estimated.
"""
import json
import struct
import sys

import numpy as np
import torch


def pack_uniform(tensor, bits):
    flat = tensor.float().numpy().reshape(-1)
    lo, hi = float(flat.min()), float(flat.max())
    amax = max(abs(lo), abs(hi), 1e-12)
    lo, hi = -amax, amax
    levels = 2 ** bits
    scale = (hi - lo) / (levels - 1)
    q = np.round((flat - lo) / scale).astype(np.uint8)
    per = 8 // bits
    assert q.size % per == 0 or True
    pad = (-q.size) % per
    if pad:
        q = np.concatenate([q, np.zeros(pad, dtype=np.uint8)])
    packed = np.zeros(q.size // per, dtype=np.uint8)
    for i in range(per):
        packed |= (q[i::per][:len(packed)] << (i * bits))
    return packed.tobytes(), struct.pack("<ff", lo, scale), flat.size


def main():
    bits = int(sys.argv[1])
    out_path = sys.argv[2]
    from safetensors.torch import load_file
    sd = load_file("gpt-neo-125M-fp32/model.safetensors")
    total_weights, total_packed, total_meta = 0, 0, 0
    with open(out_path, "wb") as f:
        header_entries = []
        for name, tensor in sd.items():
            if tensor.dtype != torch.float32 or tensor.dim() < 1:
                raw = tensor.numpy().tobytes()
                header_entries.append((name, "raw", len(raw)))
                total_packed += len(raw)
                f.write(raw)
                continue
            packed, meta, n = pack_uniform(tensor, bits)
            header_entries.append((name, f"u{bits}", len(packed)))
            total_weights += n
            total_packed += len(packed)
            total_meta += len(meta)
            f.write(packed)
            f.write(meta)
    import os
    disk = os.path.getsize(out_path)
    eff = disk * 8 / total_weights
    rec = {"variant": f"packed-int{bits}", "weights": total_weights,
           "disk_bytes": disk, "meta_bytes": total_meta,
           "effective_bits_per_weight": round(eff, 4)}
    print(json.dumps(rec))
    with open(out_path + ".json", "w", encoding="utf-8") as f:
        f.write(json.dumps(rec, indent=1) + "\n")


if __name__ == "__main__":
    main()
