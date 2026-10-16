"""BUILD83 Workstream B (fallback) - headless CNC stock-removal simulation.

CAMotics 1.2.0 is installed and starts, but it is GUI-bound: it opens a
rendering window and never returns in a non-interactive session, so it cannot
serve as an automated simulator here. This module therefore performs the same
class of check deterministically:

  parse G-code -> sweep a circular tool -> 2.5D heightfield stock removal
  -> removed volume, residual material, bounds, and a rendered preview

The removed volume is then compared against the analytic swept-envelope
expectation, so the simulation is quantitatively checked rather than merely
plotted. No physical machine is actuated.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import numpy as np

WORK = Path(__file__).resolve().parent
NC = WORK / "pocket_cnc.nc"
OUT = WORK / "cnc_simulation.json"

STOCK = np.array([100.0, 80.0, 20.0])
TOP_Z = 20.0
TOOL_D = 6.0
TOOL_R = TOOL_D / 2.0
CELL = 0.20                     # mm
POCKET = np.array([60.0, 40.0, 6.0])


def parse_gcode(path: Path) -> list[tuple[float, float, float, int]]:
    moves: list[tuple[float, float, float, int]] = []
    pos = {"X": 0.0, "Y": 0.0, "Z": 0.0}
    absolute = True
    for raw in path.read_text().splitlines():
        s = raw.split("(")[0].strip()
        if s.startswith("G90"):
            absolute = True
        elif s.startswith("G91"):
            absolute = False
        m = re.match(r"^G0*([0123])\b", s)
        if not m:
            continue
        code = int(m.group(1))
        nxt = dict(pos)
        for axis in "XYZ":
            g = re.search(r"\b%s(-?[\d.]+)" % axis, s)
            if g:
                v = float(g.group(1))
                nxt[axis] = v if absolute else pos[axis] + v
        moves.append((nxt["X"], nxt["Y"], nxt["Z"], code))
        pos = nxt
    return moves


def simulate(moves) -> dict:
    nx = int(round(STOCK[0] / CELL))
    ny = int(round(STOCK[1] / CELL))
    cell_area = CELL * CELL

    xs = (np.arange(nx) + 0.5) * CELL
    ys = (np.arange(ny) + 0.5) * CELL
    top = np.full((nx, ny), TOP_Z, dtype=np.float64)

    tool_cells = int(np.ceil(TOOL_R / CELL))
    rr = (np.arange(-tool_cells, tool_cells + 1) * CELL) ** 2
    disc = rr[:, None] + rr[None, :] <= TOOL_R * TOOL_R + 1e-12

    max_depth_reached = 0.0
    rapids_in_material = 0
    collisions = 0

    prev = (0.0, 0.0, 0.0, 0)
    for (x, y, z, code) in moves:
        px, py = prev[0], prev[1]
        if code != 0:
            # sample the segment densely enough that no cell is skipped
            dist = float(np.hypot(x - px, y - py))
            steps = max(1, int(np.ceil(dist / (CELL / 2))))
            for k in range(steps + 1):
                t = k / steps
                cx = px + (x - px) * t
                cy = py + (y - py) * t
                i0 = int(cx / CELL) - tool_cells
                j0 = int(cy / CELL) - tool_cells
                i1, j1 = i0 + disc.shape[0], j0 + disc.shape[1]
                si, sj = max(i0, 0), max(j0, 0)
                ei, ej = min(i1, nx), min(j1, ny)
                if si >= ei or sj >= ej:
                    continue
                sub = disc[si - i0:ei - i0, sj - j0:ej - j0]
                block = top[si:ei, sj:ej]
                np.minimum(block, z, out=block, where=sub)
                max_depth_reached = max(max_depth_reached, TOP_Z - z)
        else:
            # a rapid is a collision if it happens below the current surface
            if z < top[int(min(max(x / CELL, 0), nx - 1)),
                      int(min(max(y / CELL, 0), ny - 1))] - 1e-9:
                rapids_in_material += 1
        prev = (x, y, z, code)

    cut = (TOP_Z - top) > 1e-9
    removed_volume = float((TOP_Z - top)[cut].sum() * cell_area)

    analytic = float(POCKET[0] * POCKET[1] * POCKET[2])
    bbox = {
        "X": [float(xs[cut.any(axis=1)].min()), float(xs[cut.any(axis=1)].max())] if cut.any() else None,
        "Y": [float(ys[cut.any(axis=0)].min()), float(ys[cut.any(axis=0)].max())] if cut.any() else None,
    }

    preview = WORK / "cnc_stock_after.png"
    try:
        from PIL import Image
        img = np.clip(top / TOP_Z * 255.0, 0, 255).astype(np.uint8)
        Image.fromarray(img.T[::-1]).resize((500, 400)).save(preview)
        preview_written = True
    except Exception:
        preview_written = False

    return {
        "grid": {"cells_x": nx, "cells_y": ny, "cell_mm": CELL},
        "stock_mm": STOCK.tolist(),
        "stock_top_z_mm": TOP_Z,
        "tool_diameter_mm": TOOL_D,
        "cut_cells": int(cut.sum()),
        "removed_volume_mm3": round(removed_volume, 3),
        "analytic_swept_volume_mm3": round(analytic, 3),
        "volume_error_mm3": round(removed_volume - analytic, 3),
        "volume_error_pct": round(100.0 * (removed_volume - analytic) / analytic, 3),
        "max_depth_below_stock_top_mm": round(max_depth_reached, 4),
        "expected_pocket_depth_mm": float(POCKET[2]),
        "depth_error_pct": round(100.0 * (max_depth_reached - POCKET[2]) / POCKET[2], 4),
        "cut_bbox_mm": bbox,
        "expected_cut_bbox_mm": {
            "X": [float((STOCK[0] - POCKET[0]) / 2), float((STOCK[0] + POCKET[0]) / 2)],
            "Y": [float((STOCK[1] - POCKET[1]) / 2), float((STOCK[1] + POCKET[1]) / 2)],
        },
        "rapids_below_current_surface": rapids_in_material,
        "collisions_detected": rapids_in_material,
        "preview_png": str(preview) if preview_written else None,
        "physical_machine_actuated": False,
    }


def main() -> None:
    moves = parse_gcode(NC)
    res = simulate(moves)
    report = {
        "experiment_id": "BUILD83-CNC-SIM",
        "capability": "CNC_SIMULATION",
        "simulator": "headless 2.5D heightfield stock-removal sweep authored in this build",
        "camotics_status": "INSTALLED_AND_LAUNCHES (v1.2.0) but GUI-bound: opens a render "
                           "window and does not return in a non-interactive session, so it "
                           "cannot act as an automated simulator without a display",
        "gcode_file": str(NC),
        "moves_parsed": len(moves),
        "result": res,
    }
    OUT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()