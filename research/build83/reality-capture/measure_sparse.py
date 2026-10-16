"""BUILD83 Workstream A - dimensional metrology on the COLMAP sparse cloud.

COLMAP recovers an arbitrary similarity transform, so scale is fitted, not
assumed. Dimensions are reported from percentile extents along principal axes
because a sparse, partially-observed surface inflates the raw bounding box.

This is SPARSE reconstruction only. It is not dense reconstruction and not
certified metrology.
"""
from __future__ import annotations

import json
import struct
from pathlib import Path

import numpy as np

PLY = Path(r"C:\Users\jpowe\AppData\Local\Temp\opencode\rc83\ply\recon_sparse.ply")
OUT = Path(r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS\research\build83\reality-capture")
SCALED = Path(r"C:\Users\jpowe\AppData\Local\Temp\opencode\rc83\ply\recon_scaled.ply")

TRUE = np.array([60.0, 40.0, 40.0])  # X, Y, Z of the rendered bracket, mm


def read_ply_binary(path: Path) -> np.ndarray:
    data = path.read_bytes()
    end = data.index(b"end_header\n") + len(b"end_header\n")
    header = data[:end].decode("ascii")
    n = int([ln for ln in header.splitlines() if ln.startswith("element vertex")][0].split()[-1])
    rec = struct.Struct("<fffBBB")
    assert rec.size == 15
    body = data[end:]
    arr = np.frombuffer(body[:rec.size * n], dtype=np.dtype([("x", "<f4"), ("y", "<f4"),
                                                             ("z", "<f4"), ("r", "u1"),
                                                             ("g", "u1"), ("b", "u1")]))
    return np.stack([arr["x"], arr["y"], arr["z"]], axis=1).astype(np.float64)


def write_ply(path: Path, p: np.ndarray) -> None:
    hdr = ("ply\nformat binary_little_endian 1.0\n"
           "element vertex %d\n"
           "property float x\nproperty float y\nproperty float z\n"
           "end_header\n" % len(p))
    with open(path, "wb") as fh:
        fh.write(hdr.encode())
        for v in p:
            fh.write(struct.pack("<fff", float(v[0]), float(v[1]), float(v[2])))


def main() -> None:
    p = read_ply_binary(PLY)
    n = len(p)

    # PCA principal axes
    centre = p.mean(axis=0)
    cov = np.cov((p - centre).T)
    vals, vecs = np.linalg.eigh(cov)
    order = np.argsort(vals)[::-1]
    axes = vecs[:, order]                 # columns, largest variance first
    local = (p - centre) @ axes           # coordinates in PCA frame

    def pct_extent(q_lo: float, q_hi: float) -> np.ndarray:
        return np.array([np.percentile(local[:, i], q_hi) - np.percentile(local[:, i], q_lo)
                         for i in range(3)])

    raw_bbox = p.max(axis=0) - p.min(axis=0)
    e_1_99 = pct_extent(1, 99)
    e_2_98 = pct_extent(2, 98)
    e_0_100 = pct_extent(0, 100)

    # Axis correspondence: the bracket is 60 long and 40 x 40 square, so the
    # largest recovered extent must correspond to 60 mm.
    def fit_scale(ext: np.ndarray) -> tuple[float, np.ndarray]:
        srt = np.sort(ext)[::-1]
        tgt = np.array([60.0, 40.0, 40.0])
        # least squares over the sorted pairing
        s = float((srt * tgt).sum() / (srt * srt).sum())
        return s, tgt - s * srt

    scales = {}
    for name, ext in (("p01_99", e_1_99), ("p02_98", e_2_98), ("bbox", e_0_100),
                      ("raw_world_bbox_sorted", np.sort(raw_bbox)[::-1])):
        s, resid = fit_scale(ext)
        scales[name] = {
            "recovered_extent_mm_before_scale": [round(float(v), 5) for v in np.sort(ext)[::-1]],
            "fitted_scale": round(s, 5),
            "recovered_mm_after_scale": [round(float(v * s), 4) for v in np.sort(ext)[::-1]],
            "target_mm": [60.0, 40.0, 40.0],
            "abs_error_mm": [round(float(abs(r)), 4) for r in resid],
            "pct_error": [round(float(100.0 * abs(r) / t), 2) for r, t in zip(resid, TRUE_SORTED)]
            if (TRUE_SORTED := np.array([60.0, 40.0, 40.0])) is not None else None,
        }

    # Authoritative estimate: 1-99 percentile on PCA axes
    s_main = scales["p01_99"]["fitted_scale"]
    dims = scales["p01_99"]["recovered_mm_after_scale"]
    report = {
        "experiment_id": "BUILD83-RECON-COLMAP-SPARSE",
        "reconstruction": "SPARSE (not dense, not certified metrology)",
        "input_images": 18,
        "image_resolution": "1000 x 1000",
        "features_per_image_mean": 1406,
        "verified_image_pairs": 153,
        "registered_cameras": 18,
        "raw_points": n,
        "point_filter": "reprojection error <= 2.0 * median",
        "median_reprojection_error": 0.18469447742035344,
        "mean_track_length": 3.89389210878288,
        "world_bbox_raw_sorted_desc": [round(float(v), 5) for v in np.sort(raw_bbox)[::-1]],
        "pca_extents_before_scale": {
            "p01_99": [round(float(v), 5) for v in np.sort(e_1_99)[::-1]],
            "p02_98": [round(float(v), 5) for v in np.sort(e_2_98)[::-1]],
        },
        "ground_truth_mm": {"X": 60.0, "Y": 40.0, "Z": 40.0},
        "scale_procedure": "least-squares fit of recovered sorted extents to "
                           "sorted ground truth {60,40,40}; COLMAP scale is arbitrary",
        "scale_estimates": scales,
        "authoritative": {
            "method": "PCA axes, 1st-99th percentile extents",
            "fitted_scale": s_main,
            "recovered_mm_longest": dims[0],
            "recovered_mm_mid": dims[1],
            "recovered_mm_short": dims[2],
            "abs_error_mm": scales["p01_99"]["abs_error_mm"],
            "pct_error": scales["p01_99"]["pct_error"],
        },
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "colmap_sparse_metrology.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    # scaled cloud in millimetres, long axis aligned to +X for CloudCompare
    scaled = local * s_main
    write_ply(SCALED, scaled)
    report["scaled_cloud"] = str(SCALED)
    report["scaled_cloud_span_mm"] = [round(float(v), 4) for v in
                                      (scaled.max(axis=0) - scaled.min(axis=0))]
    (OUT / "colmap_sparse_metrology.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({k: report[k] for k in
                      ("raw_points", "registered_cameras", "scale_estimates", "authoritative",
                       "scaled_cloud_span_mm")}, indent=2))


if __name__ == "__main__":
    main()