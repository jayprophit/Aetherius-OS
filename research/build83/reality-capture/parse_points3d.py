"""Parse COLMAP points3D.bin (model_converter crashes in this build).

Format, per COLMAP src/colmap/scene/reconstruction.cc ReadPoints3DBinary:
    uint64  num_points
    per point:
        uint64 point3D_id
        double x, y, z
        uint8  r, g, b
        double error
        uint64 track_length
        track_length * (uint32 image_id, uint32 point2D_idx)
"""
from __future__ import annotations

import json
import struct
from pathlib import Path

import numpy as np

SRC = sorted(Path(r"C:\Users\jpowe\AppData\Local\Temp\opencode\rc83\sparse").rglob("points3D.bin"))[0]
OUT_PLY = Path(r"C:\Users\jpowe\AppData\Local\Temp\opencode\rc83\ply\recon_sparse.ply")
OUT_JSON = Path(r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS\research\build83\reality-capture\colmap_sparse_raw.json")


def main() -> None:
    data = SRC.read_bytes()
    off = 0
    (n,) = struct.unpack_from("<Q", data, off); off += 8

    xyz = np.empty((n, 3), dtype=np.float64)
    rgb = np.empty((n, 3), dtype=np.uint8)
    err = np.empty(n, dtype=np.float64)
    track = np.empty(n, dtype=np.uint64)
    for i in range(n):
        pid, = struct.unpack_from("<Q", data, off); off += 8
        x, y, z = struct.unpack_from("<ddd", data, off); off += 24
        r, g, b = struct.unpack_from("<BBB", data, off); off += 3
        e, = struct.unpack_from("<d", data, off); off += 8
        tl, = struct.unpack_from("<Q", data, off); off += 8
        off += 4 * 2 * tl
        xyz[i] = (x, y, z)
        rgb[i] = (r, g, b)
        err[i] = e
        track[i] = tl

    consumed = off
    print(f"points={n} bytes={len(data)} consumed={consumed} trailing={len(data)-consumed}")

    # reject statistical outliers by reprojection error, as COLMAP's own filters do
    for k in (2.0, 4.0, 8.0):
        thr = k * np.median(err)
        keep = err <= thr
        print(f"filter k={k} median_err={np.median(err):.4f} thr={thr:.4f} keep={int(keep.sum())}")

    keep = err <= 2.0 * np.median(err)
    p = xyz[keep]
    span = p.max(axis=0) - p.min(axis=0)
    print("filtered_points=%d span_raw=%s" % (len(p), np.round(span, 5)))

    OUT_PLY.parent.mkdir(parents=True, exist_ok=True)
    c = rgb[keep].astype(np.uint8)
    body = b"".join(
        b"%d %d %d %d" % (int(c[i, 0]), int(c[i, 1]), int(c[i, 2]), 255)
        for i in range(len(p))
    )
    hdr = ("ply\nformat binary_little_endian 1.0\n"
           "element vertex %d\n"
           "property float x\nproperty float y\nproperty float z\n"
           "property uchar red\nproperty uchar green\nproperty uchar blue\n"
           "end_header\n" % len(p))
    with open(OUT_PLY, "wb") as fh:
        fh.write(hdr.encode())
        for i in range(len(p)):
            fh.write(struct.pack("<fff", float(p[i, 0]), float(p[i, 1]), float(p[i, 2])))
            fh.write(bytes((int(c[i, 0]), int(c[i, 1]), int(c[i, 2]))))

    summary = {
        "raw_points": int(n),
        "filtered_points": int(len(p)),
        "median_reprojection_error": float(np.median(err)),
        "mean_track_length": float(track.mean()),
        "max_track_length": int(track.max()),
        "raw_span": [float(v) for v in span],
        "ply": str(OUT_PLY),
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()