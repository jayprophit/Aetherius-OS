"""BUILD83 Workstream C - laser preparation / controller-side validation.

Chain: vector profile -> DXF (authored here) -> SVG (converted) -> GRBL laser
       G-code (LaserGRBL dialect) -> coordinate/bounds/structure validation.

Power and feed values are explicitly labelled SIMULATION PLACEHOLDERS. No real
material power values are invented, and no laser is energised. LaserGRBL 7.14.1
is installed but is a GUI application, so controller-side validation here is
static analysis of the exact G-code it consumes, not a live controller session.
"""
from __future__ import annotations

import json
import math
import re
from pathlib import Path

WORK = Path(__file__).resolve().parent
DXF = WORK / "laser_plate.dxf"
SVG = WORK / "laser_plate.svg"
GCODE = WORK / "laser_plate.grbl"

MM = lambda v: f"{v:.4f}"

# SIMULATION PLACEHOLDERS - not safe machine settings
PLACEHOLDER_POWER_S = 100
PLACEHOLDER_FEED_MM_MIN = 1000.0
PLACEHOLDER_Z = 0.0

REC = 60.0
CIRC_D = 20.0


def build_dxf() -> list[tuple[str, list[tuple[float, float]]]]:
    """Return [(layer, [(x1,y1,x2,y2), ...])] for a 60x60 plate outline + bore."""
    o = (0.0, 0.0, REC, REC)
    rect = [(o[0], o[1], o[2], o[1]), (o[2], o[1], o[2], o[3]),
            (o[2], o[3], o[0], o[3]), (o[0], o[3], o[0], o[1])]
    cx = cy = REC / 2.0
    seg = 64
    circ = []
    for i in range(seg):
        a0 = 2 * math.pi * i / seg
        a1 = 2 * math.pi * (i + 1) / seg
        circ.append((cx + CIRC_D / 2 * math.cos(a0), cy + CIRC_D / 2 * math.sin(a0),
                     cx + CIRC_D / 2 * math.cos(a1), cy + CIRC_D / 2 * math.sin(a1)))
    return [("CUT_OUTLINE", rect), ("CUT_BORE", circ)]


def write_dxf(layers) -> None:
    L = ["0", "SECTION", "2", "ENTITIES"]
    for layer, segs in layers:
        for (x1, y1, x2, y2) in segs:
            L += ["0", "LINE", "8", layer, "10", MM(x1), "20", MM(y1),
                  "11", MM(x2), "21", MM(y2)]
    L += ["0", "ENDSEC", "0", "EOF"]
    DXF.write_text("\n".join(L) + "\n", encoding="ascii")


def write_svg(layers) -> None:
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{REC}mm" '
             f'height="{REC}mm" viewBox="0 0 {REC} {REC}">']
    for layer, segs in layers:
        d = " ".join(f"M {MM(x1)} {MM(y1)} L {MM(x2)} {MM(y2)}" for x1, y1, x2, y2 in segs)
        parts.append(f'<g id="{layer}" fill="none" stroke="black" stroke-width="0.1">'
                     f'<path d="{d}"/></g>')
    parts.append("</svg>")
    SVG.write_text("\n".join(parts) + "\n", encoding="ascii")


def write_grbl(layers) -> dict:
    g: list[str] = [
        "; BUILD83 laser preparation validation",
        "; POWER/FEED BELOW ARE SIMULATION PLACEHOLDERS - NOT MACHINE SETTINGS",
        f"; placeholder power S{PLACEHOLDER_POWER_S}, feed {PLACEHOLDER_FEED_MM_MIN} mm/min",
        "G21 (mm)", "G90 (absolute)", "G94 (feed/min)",
        f"M3 S{PLACEHOLDER_POWER_S} (laser on - simulation placeholder)",
    ]
    order: list[tuple[str, float, float]] = []
    first = True
    for layer, segs in layers:
        for (x1, y1, x2, y2) in segs:
            if first:
                g.append(f"G0 X{MM(x1)} Y{MM(y1)} (rapid to start, laser off)")
                first = False
            g.append(f"G1 X{MM(x2)} Y{MM(y2)} F{MM(PLACEHOLDER_FEED_MM_MIN)} (burn)")
            order.append((layer, x2, y2))
        g.append(f"M5 S0 (laser off after layer {layer})")
    g += ["M5 S0", "G0 X0 Y0", "M2"]
    GCODE.write_text("\n".join(g) + "\n", encoding="ascii")
    return {"layers": [lay for lay, _ in layers], "burn_moves": len(order)}


def validate_gcode() -> dict:
    text = GCODE.read_text()
    pos = {"X": 0.0, "Y": 0.0}
    bounds = {"X": [1e18, -1e18], "Y": [1e18, -1e18]}
    burn = rapids = 0
    laser_off_between = 0
    prev_laser = True
    coords = []
    for raw in text.splitlines():
        s = raw.split("(")[0].strip()
        if s.startswith("G90"):
            pass
        m = re.match(r"^G0*([012])\b", s)
        if m:
            code = int(m.group(1))
            for axis in "XY":
                g = re.search(r"\b%s(-?[\d.]+)" % axis, s)
                if g:
                    pos[axis] = float(g.group(1))
                    coords.append((pos["X"], pos["Y"]))
            for axis in "XY":
                bounds[axis][0] = min(bounds[axis][0], pos[axis])
                bounds[axis][1] = max(bounds[axis][1], pos[axis])
            if code == 0:
                rapids += 1
            else:
                burn += 1
        if s.startswith("M5"):
            laser_off_between += 1
            prev_laser = False
        elif s.startswith("M3"):
            prev_laser = True
    return {
        "units_mm": "G21" in text,
        "absolute": "G90" in text,
        "feed_mode": "G94" in text,
        "rapid_moves_G0": rapids,
        "burn_moves_G1": burn,
        "laser_off_commands": laser_off_between,
        "bounds_mm": {a: [round(bounds[a][0], 4), round(bounds[a][1], 4)] for a in "XY"},
        "expected_bounds_mm": {"X": [0.0, REC], "Y": [0.0, REC]},
        "bounds_error_mm": {
            a: round(max(abs(bounds[a][0] - 0.0), abs(bounds[a][1] - REC)), 6) for a in "XY"},
        "unique_positions": len({(round(x, 4), round(y, 4)) for x, y in coords}),
        "return_to_origin": "G0 X0.0000 Y0.0000" in text,
        "ends_with_M2": text.strip().endswith("M2"),
        "power_values_are_placeholders": "SIMULATION PLACEHOLDERS" in text,
    }


def main() -> None:
    layers = build_dxf()
    write_dxf(layers)
    write_svg(layers)
    gen = write_grbl(layers)
    val = validate_gcode()

    report = {
        "experiment_id": "BUILD83-LASER-PREP",
        "capability": "LASER_PREPARATION",
        "artifacts": {"dxf": str(DXF), "svg": str(SVG), "gcode": str(GCODE)},
        "geometry": {"outline_mm": REC, "bore_diameter_mm": CIRC_D,
                     "circle_segments": 64, "layers": gen["layers"]},
        "dxf": {"bytes": DXF.stat().st_size, "layers": gen["layers"],
                "entity_count": sum(len(s) for _, s in layers)},
        "svg": {"bytes": SVG.stat().st_size},
        "grbl_generation": gen,
        "validation": val,
        "lasergrbl_status": "INSTALLED v7.14.1 (C:\\Program Files (x86)\\LaserGRBL\\LaserGRBL.exe); "
                            "GUI application, so validation is static analysis of the G-code it "
                            "consumes rather than a live controller session",
        "laser_fired": False,
        "power_values": "SIMULATION PLACEHOLDERS ONLY - no real material power values invented",
    }
    (WORK / "laser_prep.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({"generation": gen, "validation": val}, indent=2))


if __name__ == "__main__":
    main()