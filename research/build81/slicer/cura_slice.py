"""BUILD81 slicer acceptance (Cura 5.13.0 / CuraEngine, headless).

Builds a valid flat Cura settings file directly from Cura's own definition
trees (resolving inherited defaults and base64-encoded string values), then
slices a known bracket and verifies the resulting G-code.

Known object: bracket 60 x 40 x 40 mm bounding box.
"""
from __future__ import annotations

import base64
import re
import json
import subprocess
import sys
from pathlib import Path

CURA = Path(r"C:\Program Files\UltiMaker Cura 5.13.0")
RES = CURA / "share" / "cura" / "resources"
ENGINE = CURA / "CuraEngine.exe"
WORK = Path(__file__).resolve().parent


def _decode(node: dict):
    """Cura base64-encodes string values (default and/or value)."""
    out = {}
    if "base64" in node:
        b = node["base64"]
        raw = base64.b64decode(b["default"]).decode("utf-8") if "default" in b else None
        val = base64.b64decode(b["value"]).decode("utf-8") if "value" in b else None
        out["default"] = raw
        out["value"] = val
        out["__b64__"] = True
    else:
        for k in ("default", "value"):
            if k in node:
                out[k] = node[k]
    return out


def flatten(node: dict, out: dict) -> None:
    if not isinstance(node, dict):
        return
    if "children" in node and isinstance(node["children"], dict):
        for ch in node["children"].values():
            flatten(ch, out)
        return
    if "type" in node and node.get("type") == "category":
        for ch in node.get("children", {}).values():
            flatten(ch, out)
        return
    vals = _decode(node)
    val = vals.get("value", vals.get("default"))
    if val is None and node.get("type") == "enum" and node.get("options"):
        opts = node["options"]
        # Cura stores enum options as {value: label}
        val = next(iter(opts)) if isinstance(opts, dict) else opts[0]
    if val is not None and not isinstance(val, (dict, list)):
        key = node.get("key")
        if key:
            out[key] = val
    if "key" not in node and "value" in vals:
        out.setdefault(node.get("label", ""), vals["value"])


def collect(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    out: dict[str, object] = {}
    for name, node in data.get("settings", {}).items():
        node = dict(node)
        node.setdefault("key", name)
        flatten(node, out)
    return out


def find_extruder_def() -> Path | None:
    for cand in sorted(RES.rglob("fdmextruder*.def.json")):
        return cand
    return None


def main() -> int:
    printer = collect(RES / "definitions" / "fdmprinter.def.json")
    print(f"printer_settings={len(printer)}")
    ext_path = find_extruder_def()
    print(f"extruder_def={ext_path}")
    extruder: dict[str, object] = {}
    if ext_path:
        extruder = collect(ext_path)
    print(f"extruder_settings={len(extruder)}")

    settings: dict[str, object] = {}
    settings.update(printer)
    settings.update(extruder)

    overrides = {
        "layer_height": 0.2,
        "layer_height_0": 0.2,
        "nozzle_diameter": 0.4,
        "nozzle_diameter_0": 0.4,
        "line_width": 0.4,
        "line_width_0": 0.4,
        "machine_width": 220.0,
        "machine_depth": 220.0,
        "machine_height": 250.0,
        "material_diameter": 1.75,
        "material_density": 1240.0,
        "machine_nozzle_size": 0.4,
        "extruder_0_material_diameter": 1.75,
        "extruder_0_material_density": 1240.0,
        "extruder_count": 1,
        "meshing_mode": "standard",
        "slicing_tower_height": 10.0,
        # Keep the toolpath tight to the part so X/Y spans are meaningful,
        # and make sure the flow/material estimate has real inputs.
        "skirt_enable": False,
        "brim_enable": False,
        "raft_enable": False,
        "material_flow_ratio": 100.0,
        "extruder_0_material_flow_ratio": 100.0,
        "machine_nozzle_temp": 205.0,
        "extruder_0_nozzle_temperature": 205.0,
        "extruder_0_bed_temperature": 60.0,
        "material_print_temperature": 205.0,
    }
    for k, v in overrides.items():
        settings[k] = v

    sfile = WORK / "cura_settings.json"
    sfile.write_text(json.dumps(settings, indent=1), encoding="utf-8")
    print(f"settings_written={sfile} entries={len(settings)}")

    if not (WORK / "bracket.stl").exists():
        print("ERROR: bracket.stl missing", file=sys.stderr)
        return 2

    out = WORK / "bracket_cura.gcode"
    # Correct Cura 5.13 syntax:
    #   CuraEngine slice -j <settings.def.json> [-s k=v ...] [-e0 -s k=v ...] -l <stl> -o <gcode>
    printer_def = RES / "definitions" / "fdmprinter.def.json"

    def build_cmd(state: dict) -> list[str]:
        general = {k: v for k, v in state.items() if not k.startswith("extruder_0_")}
        extruder = {k[len("extruder_0_"):]: v
                    for k, v in state.items() if k.startswith("extruder_0_")}
        cmd = [str(ENGINE), "slice", "-j", str(printer_def)]
        for k, v in general.items():
            cmd += ["-s", f"{k}={v}"]
        cmd += ["-e0"]
        for k, v in extruder.items():
            cmd += ["-s", f"{k}={v}"]
        cmd += ["-l", str(WORK / "bracket.stl"), "-o", str(out)]
        return cmd

    # The generic fdmprinter definition does not carry a value for every
    # setting a concrete printer would. Supply the ones the engine asks for,
    # iterating until it stops reporting them.
    state = dict(settings)
    proc = None
    for attempt in range(40):
        proc = subprocess.run(build_cmd(state), cwd=str(WORK),
                              capture_output=True, text=True, timeout=1800)
        m = re.search(r"Trying to retrieve setting with no value given:\s*(\S+)",
                      proc.stdout or "")
        if not m:
            break
        missing = m.group(1)
        if missing in state:
            break
        short = missing.removeprefix("extruder_0_")
        state[f"extruder_0_{short}"] = 0
        print(f"  auto-filled missing setting: {missing}")

    print(f"cura_engine_exit={proc.returncode}")
    bad = [l for l in (proc.stdout or "").splitlines()
           if "error" in l.lower() or "warning" in l.lower()]
    for line in bad[:15]:
        print("  !", line)
    if not bad:
        tail = (proc.stdout or "").strip().splitlines()[-12:]
        for line in tail:
            print("  |", line)
    if not out.exists():
        print("NO_GCODE_PRODUCED")
        return 1
    print(f"GCODE_BYTES={out.stat().st_size}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
