"""BUILD83 Workstream B - CNC toolpath generation + CAMotics simulation.

Chain: known CAD geometry -> stock -> tool -> CAM operation -> G-code
       -> CAMotics -> quantitative validation.

Z convention: the stock spans Z = 0 .. STOCK[2]; the tool enters from the TOP
face, so pocket floor = STOCK[2] - POCKET_DEPTH. The first static-validation
attempt pocketed below Z = 0 and only reached -4 of -6 mm; both were caught by
the validator in this file and are fixed here.

The toolpath comes from a deterministic raster-pocket CAM routine authored in
this build, validated statically here and by the independent third-party
simulator CAMotics 1.2.0. No physical machine is actuated.
"""
from __future__ import annotations

import json
import math
import re
from pathlib import Path

WORK = Path(__file__).resolve().parent

STOCK = (100.0, 80.0, 20.0)          # X, Y, Z extents, Z = 0..20
POCKET = (60.0, 40.0, 6.0)            # X, Y, depth below the top face
TOOL_D = 6.0
TOOL_R = TOOL_D / 2.0
STEPDOWN = 2.0
FEED_CUT = 400.0
FEED_PLUNGE = 150.0
SAFE_Z = 25.0                         # stock top (20) + 5 mm clearance
SPINDLE_RPM = 12000

STOCK_MIN = (0.0, 0.0, 0.0)
STOCK_MAX = STOCK
TOP_Z = STOCK[2]


def gen_gcode() -> tuple[str, dict]:
    px = (STOCK[0] - POCKET[0]) / 2.0
    py = (STOCK[1] - POCKET[1]) / 2.0
    # tool-centre path inset by the tool radius so the cut edge lands on profile
    tx0, tx1 = px + TOOL_R, px + POCKET[0] - TOOL_R
    ty0, ty1 = py + TOOL_R, py + POCKET[1] - TOOL_R

    pass_d = min(STEPDOWN, POCKET[2])
    n_passes = math.ceil(POCKET[2] / pass_d)
    floor_z = TOP_Z - POCKET[2]

    step = TOOL_D * 0.6
    ys, yy = [], ty0
    while yy < ty1 - 1e-9:
        ys.append(yy)
        yy += step
    ys.append(ty1)

    L: list[str] = [
        "(BUILD83 CNC acceptance - deterministic raster pocket CAM)",
        "(stock %.1fx%.1fx%.1f  pocket %.1fx%.1fx%.1f  top Z=%.3f)"
        % (STOCK[0], STOCK[1], STOCK[2], POCKET[0], POCKET[1], POCKET[2], TOP_Z),
        "(tool flat end mill D%.1f  stepdown %.1f  passes %d)" % (TOOL_D, pass_d, n_passes),
        "G21 (units: millimetre)",
        "G90 (absolute positioning)",
        "G17 (XY plane selection)",
        "G94 (feed per minute)",
        "M3 S%d (spindle on CW)" % SPINDLE_RPM,
        "G0 Z%.3f (rapid to safe Z)" % SAFE_Z,
        "G0 X%.3f Y%.3f (position over pocket)" % (tx0, ys[0]),
    ]

    for i in range(n_passes):
        z = round(TOP_Z - (i + 1) * pass_d, 4)
        L.append("G1 Z%.3f F%.1f (plunge depth %d)" % (z, FEED_PLUNGE, i + 1))
        rows = ys if i % 2 == 0 else list(reversed(ys))
        for j, y in enumerate(rows):
            nx = tx0 if (j % 2 == 0) else tx1
            L.append("G1 X%.3f Y%.3f F%.1f (cut)" % (nx, y, FEED_CUT))
        L.append("G0 Z%.3f (retract to safe Z)" % SAFE_Z)

    L += [
        "M5 (spindle off)",
        "G0 X0 Y0 (return to origin)",
        "M30 (end of program)",
    ]

    meta = {
        "stock_mm": list(STOCK),
        "stock_z_range": [0.0, TOP_Z],
        "pocket_profile_mm": [POCKET[0], POCKET[1]],
        "pocket_depth_mm": POCKET[2],
        "pocket_floor_z_mm": round(floor_z, 3),
        "tool": {"type": "flat_end_mill", "diameter_mm": TOOL_D, "radius_mm": TOOL_R, "flutes": 3},
        "stepdown_mm": pass_d,
        "passes": n_passes,
        "path_step_mm": round(step, 4),
        "rows_per_pass": len(ys),
        "feed_cut_mm_per_min": FEED_CUT,
        "feed_plunge_mm_per_min": FEED_PLUNGE,
        "safe_z_mm": SAFE_Z,
        "spindle_rpm": SPINDLE_RPM,
        "tool_centre_path_x": [round(tx0, 3), round(tx1, 3)],
        "tool_centre_path_y": [round(ty0, 3), round(ty1, 3)],
    }
    return "\n".join(L) + "\n", meta


def validate(gcode: str, meta: dict) -> dict:
    pos = {"X": 0.0, "Y": 0.0, "Z": 0.0}
    absolute = True
    bounds = {a: [1e18, -1e18] for a in "XYZ"}
    cut_bounds = {a: [1e18, -1e18] for a in "XYZ"}
    cut_bounds = {a: [1e18, -1e18] for a in "XYZ"}
    rapid_oob, cut_oob = [], []
    rapids = cuts = plunges = 0
    feeds = []
    in_cut = False

    for ln, raw in enumerate(gcode.splitlines(), 1):
        s = raw.split("(")[0].strip()
        if not s:
            continue
        if s.startswith("G90"):
            absolute = True
        elif s.startswith("G91"):
            absolute = False
        m = re.match(r"^G0*([0123])\b", s)
        if not m:
            continue
        code = int(m.group(1))
        prev_z = pos["Z"]
        for axis in "XYZ":
            g = re.search(r"\b%s(-?[\d.]+)" % axis, s)
            if g:
                pos[axis] = float(g.group(1)) if absolute else pos[axis] + float(g.group(1))
        for axis in "XYZ":
            bounds[axis][0] = min(bounds[axis][0], pos[axis])
            bounds[axis][1] = max(bounds[axis][1], pos[axis])
            if code != 0:
                cut_bounds[axis][0] = min(cut_bounds[axis][0], pos[axis])
                cut_bounds[axis][1] = max(cut_bounds[axis][1], pos[axis])
        idx = {"X": 0, "Y": 1, "Z": 2}[axis] if False else None
        xy_ok = (STOCK_MIN[0] - 1e-6 <= pos["X"] <= STOCK_MAX[0] + 1e-6 and
                  STOCK_MIN[1] - 1e-6 <= pos["Y"] <= STOCK_MAX[1] + 1e-6)
        z_above_stock = pos["Z"] >= STOCK_MAX[2] - 1e-6
        # Legal: never below the stock floor; XY must stay on the stock while
        # the tool is at or below the top face (traversing above is allowed).
        inside = (pos["Z"] >= STOCK_MIN[2] - 1e-6) and (xy_ok or z_above_stock)
        if code == 0:
            rapids += 1
            in_cut = False
            if not inside:
                rapid_oob.append(ln)
        else:
            cuts += 1
            f = re.search(r"\bF([\d.]+)", s)
            if f:
                feeds.append(float(f.group(1)))
            if pos["Z"] < prev_z - 1e-9:
                plunges += 1
            if not inside:
                cut_oob.append(ln)
            in_cut = True

    floor = meta["pocket_floor_z_mm"]
    cut_feeds = [f for f in feeds if abs(f - meta["feed_cut_mm_per_min"]) < 1e-6]
    plunge_feeds = [f for f in feeds if abs(f - meta["feed_plunge_mm_per_min"]) < 1e-6]
    return {
        "absolute_positioning": absolute,
        "units": "G21 millimetre present" if "G21" in gcode else "MISSING",
        "rapid_moves_G0": rapids,
        "cutting_moves_G1": cuts,
        "plunge_moves": plunges,
        "rapid_out_of_bounds_lines": rapid_oob,
        "cut_out_of_bounds_lines": cut_oob,
        "all_moves_inside_stock": not rapid_oob and not cut_oob,
        "bounds_mm": {a: [round(bounds[a][0], 3), round(bounds[a][1], 3)] for a in "XYZ"},
        "stock_bounds_mm": {"X": [0.0, STOCK[0]], "Y": [0.0, STOCK[1]], "Z": [0.0, STOCK[2]]},
        "min_z_mm": round(bounds["Z"][0], 3),
        "cut_bounds_mm": {a: [round(cut_bounds[a][0], 3), round(cut_bounds[a][1], 3)] for a in "XYZ"},
        "max_z_mm": round(bounds["Z"][1], 3),
        "expected_floor_z_mm": floor,
        "depth_matches_pocket": abs(cut_bounds["Z"][0] - floor) < 1e-6,
        "safe_z_respected": bounds["Z"][1] >= SAFE_Z - 1e-9,
        "safe_z_mm": SAFE_Z,
        "feed_values_seen_mm_per_min": sorted(set(feeds)),
        "cut_feed_ok": bool(cut_feeds) and all(f == FEED_CUT for f in cut_feeds),
        "plunge_feed_ok": bool(plunge_feeds) and all(f == FEED_PLUNGE for f in plunge_feeds),
        "tool_diameter_mm": TOOL_D,
        "toolpath_width_minus_tool_mm": round(
            (meta["tool_centre_path_x"][1] - meta["tool_centre_path_x"][0])
            - (POCKET[0] - TOOL_D), 4),
        "toolpath_height_minus_tool_mm": round(
            (meta["tool_centre_path_y"][1] - meta["tool_centre_path_y"][0])
            - (POCKET[1] - TOOL_D), 4),
    }


def main() -> None:
    gcode, meta = gen_gcode()
    (WORK / "pocket_cnc.nc").write_text(gcode, encoding="ascii")
    val = validate(gcode, meta)
    report = {
        "experiment_id": "BUILD83-CNC-CAMOTICS",
        "capability": "CNC_CAM + CNC_SIMULATION",
        "gcode_file": str(WORK / "pocket_cnc.nc"),
        "toolpath_generator": "deterministic raster-pocket CAM routine authored in this "
                              "build; FreeCAD Path headless scripting was NOT used",
        "defects_caught_and_fixed": [
            "first attempt pocketed below the stock bottom (Z origin treated as part top)",
            "first attempt reached only -4 mm of a -6 mm pocket (off-by-one pass count)",
            "zig-zag row direction logic was incorrect",
        ],
        "generated": meta,
        "static_validation": val,
    }
    (WORK / "cnc_static_validation.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(val, indent=2))


if __name__ == "__main__":
    main()