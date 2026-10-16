"""BUILD81 CloudCompare acceptance fixtures.

Ground-truth bracket: 60 x 40 x 40 mm (matches COLMAP reality-capture target).
Produces:
  cloud_ref.ply  exact surface point cloud, 60 x 40 x 40 mm bounding box
  cloud_scan.ply simulated scan: same geometry, gaussian noise, missing -Y face,
                 plus a small rigid offset that ICP must remove
"""
from __future__ import annotations

import numpy as np

X, Y, Z = 60.0, 40.0, 40.0
RNG = np.random.default_rng(81)


def box_surface(nx: int, ny: int, nz: int, skip: str | None = None) -> np.ndarray:
    """Sample the six faces of the bracket bounding box on a regular lattice."""
    pts: list[np.ndarray] = []

    def grid(u: np.ndarray, v: np.ndarray, fixed_axis: int, fixed_val: float) -> np.ndarray:
        a = np.zeros((len(u), len(v), 3))
        a[:, :, 0] = u[:, None]
        a[:, :, 1] = v[None, :]
        a[:, :, fixed_axis] = fixed_val
        return a.reshape(-1, 3)

    ux = np.linspace(0, X, nx)
    uy = np.linspace(0, Y, ny)
    uz = np.linspace(0, Z, nz)

    if skip != "+Z":
        pts.append(grid(ux, uy, 2, Z))
    if skip != "-Z":
        pts.append(grid(ux, uy, 2, 0.0))
    if skip != "+X":
        pts.append(grid(uy, uz, 0, X))
    if skip != "-X":
        pts.append(grid(uy, uz, 0, 0.0))
    if skip != "+Y":
        pts.append(grid(ux, uz, 1, Y))
    if skip != "-Y":
        pts.append(grid(ux, uz, 1, 0.0))
    return np.vstack(pts)


def write_ply_ascii(path: str, p: np.ndarray) -> None:
    with open(path, "w", encoding="ascii") as fh:
        fh.write("ply\nformat ascii 1.0\n")
        fh.write(f"element vertex {len(p)}\n")
        fh.write("property float x\nproperty float y\nproperty float z\n")
        fh.write("end_header\n")
        for v in p:
            fh.write(f"{v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n")


def main() -> None:
    ref = box_surface(121, 81, 81)
    scan = box_surface(121, 81, 81, skip="-Y")
    scan = scan + RNG.normal(0.0, 0.12, size=scan.shape)
    scan[:, 0] += 2.5   # rigid offset for ICP to remove
    scan[:, 2] += -1.75
    write_ply_ascii("cloud_ref.ply", ref)
    write_ply_ascii("cloud_scan.ply", scan)
    print(f"ref_points={len(ref)} bbox=({np.ptp(ref[:,0]):.4f},{np.ptp(ref[:,1]):.4f},{np.ptp(ref[:,2]):.4f})")
    print(f"scan_points={len(scan)} bbox=({np.ptp(scan[:,0]):.4f},{np.ptp(scan[:,1]):.4f},{np.ptp(scan[:,2]):.4f})")


if __name__ == "__main__":
    main()
