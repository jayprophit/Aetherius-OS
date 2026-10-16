"""BUILD81 Gmsh -> CalculiX structural FEA acceptance.

Controlled cantilever fixture:
  beam axis   : +X, length L = 100 mm
  section     : 10 x 10 mm square (b = h = 10)
  fixed end   : x = 0
  tip load    : P = 100 N along +Z, distributed over the x = L face

Closed-form beam-theory reference (to validate the solver, not to replace it):
  I    = b*h^3/12
  u_tip= P*L^3 / (3*E*I)          (tip deflection)
  s_max= P*L*c / I               (extreme fibre bending stress)

TEST_MATERIAL is an explicitly labelled synthetic fixture. It is NOT a MAT
material and must never be promoted into MAT.

Two mesh densities are run so mesh sensitivity can be recorded.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

import gmsh

WORK = Path(__file__).resolve().parent
CCX = Path.home() / "AetheriusTools" / "calculix" / "calculix_2.22_4win" / "ccx_static.exe"

L, B, H = 100.0, 10.0, 10.0
E, NU = 210000.0, 0.3          # TEST_MATERIAL
P_TIP = 100.0

I = B * H**3 / 12.0
C = H / 2.0
U_REF = P_TIP * L**3 / (3.0 * E * I)
S_REF = P_TIP * L * C / I


def build_inp(mesh_size: float, name: str, order: int = 2) -> Path:
    gmsh.initialize()
    try:
        gmsh.option.setNumber("General.Terminal", 0)
        gmsh.model.add(name)
        occ = gmsh.model.occ
        box = occ.addBox(0, -B / 2, -H / 2, L, B, H)
        occ.synchronize()
        gmsh.option.setNumber("Mesh.MeshSizeMax", mesh_size)
        gmsh.option.setNumber("Mesh.MeshSizeMin", mesh_size)
        gmsh.option.setNumber("Mesh.Algorithm", 6)   # Frontal-Delaunay
        gmsh.model.mesh.generate(3)
        if order == 2:
            gmsh.model.mesh.setOrder(2)               # C3D10 tets

        tags, coords, _ = gmsh.model.mesh.getNodes()
        coords = coords.reshape(-1, 3)
        remap = {t: i + 1 for i, t in enumerate(tags)}

        # gmsh element type -> nodes per element, and matching CalculiX type
        npe_map = {4: (4, "C3D4"), 11: (10, "C3D10")}
        elems: list[tuple[str, int, list[int]]] = []
        for etype, etags, enodes in zip(*gmsh.model.mesh.getElements(3)):
            npe, ccx_type = npe_map[int(etype)]
            conn = enodes.reshape(-1, npe)
            for k, tet in enumerate(conn):
                elems.append((ccx_type, int(etags[k]), [remap[n] for n in tet]))
        ccx_elem_type = elems[0][0]

        # Constraint sets must use the CalculiX node numbering (remap), not the
        # positional index into the coordinate array, or the sets point at the
        # wrong nodes and the stiffness matrix goes singular.
        fixed = [remap[tags[i]] for i, p in enumerate(coords) if abs(p[0]) < 1e-9]
        tip = [remap[tags[i]] for i, p in enumerate(coords) if abs(p[0] - L) < 1e-9]
        assert fixed and tip, "empty constraint set"
        gmsh.finalize()
    except BaseException:
        gmsh.finalize()
        raise

    per_node = P_TIP / len(tip)
    inp = WORK / f"{name}.inp"
    lines = [
        f"** BUILD81 cantilever FEA fixture ({name})",
        "** TEST_MATERIAL synthetic fixture - not a MAT material",
        "**NODE",
        f"{len(coords)}, {len(elems)}",
    ]
    for i, p in enumerate(coords, start=1):
        lines.append(f"{i}, {p[0]:.9g}, {p[1]:.9g}, {p[2]:.9g}")
    lines.append(f"*ELEMENT, TYPE={ccx_elem_type}, ELSET=EALL")
    for _, eid, nodes in elems:
        lines.append(f"{eid}, " + ", ".join(str(n) for n in nodes))
    lines += [
        "*NSET, NSET=FIXED",
        ",".join(str(n) for n in fixed),
        "*NSET, NSET=TIP",
        ",".join(str(n) for n in tip),
        "*MATERIAL, NAME=TEST_MATERIAL",
        "*ELASTIC",
        f"{E:.6g}, {NU:.6g}",
        "*SOLID SECTION, ELSET=EALL, MATERIAL=TEST_MATERIAL",
        "*BOUNDARY",
        "FIXED, 1, 3, 0.0",
        "*STEP",
        "*STATIC",
        "*CLOAD",
        "TIP, 3, %.9g" % per_node,
        "*NODE FILE",
        "U",
        "*EL FILE",
        "S",
        "*NODE PRINT, NSET=FIXED",
        "RF",
        "*NODE PRINT, NSET=NALL",
        "U",
        "*EL PRINT, ELSET=EALL",
        "S",
        "*END STEP",
    ]
    inp.write_text("\n".join(lines) + "\n", encoding="ascii")
    return inp, len(coords), len(elems)


def parse_dat(path: Path) -> dict:
    text = path.read_text(errors="replace")
    out: dict[str, float] = {}
    for m in re.finditer(
        r"\n\s*displacements \(max,min\)\s*=\s*\(\s*([-\dEe.+]+),\s*([-\dEe.+]+)\s*\)", text
    ):
        out["disp_max"] = max(out.get("disp_max", 0.0), float(m.group(1)))
    for m in re.finditer(r"stresses \(max,min\)\s*=\s*\(\s*([-\dEe.+]+),\s*([-\dEe.+]+)\s*\)", text):
        out["stress_max"] = max(out.get("stress_max", 0.0), float(m.group(1)))
    rfs = [float(x) for x in re.findall(r"reaction forces.*?=\s*\(([^)]*)\)", text, re.S)]
    if rfs:
        out["reaction_z"] = sum(abs(float(v)) for v in rfs[0].split(",")[:3])
    return out


def run(name: str, mesh_size: float) -> dict:
    inp, n_nodes, n_elems = build_inp(mesh_size, name)
    job = WORK / name
    proc = subprocess.run(
        [str(CCX), "-i", str(job)],
        cwd=str(job.parent),
        capture_output=True,
        text=True,
        timeout=900,
    )
    dat = job.with_suffix(".dat")
    stats = parse_dat(dat) if dat.exists() else {}
    return {
        "mesh_size_mm": mesh_size,
        "nodes": n_nodes,
        "elements": n_elems,
        "ccx_exit": proc.returncode,
        "dat_exists": dat.exists(),
        "displacement_max_mm": stats.get("disp_max"),
        "stress_max_MPa": stats.get("stress_max"),
        "reaction_z_N": stats.get("reaction_z"),
        "solver_tail": proc.stdout.strip().splitlines()[-1:] or [],
    }


def main() -> None:
    runs = [run("beam_coarse", 12.0), run("beam_fine", 6.0)]
    for r in runs:
        u, s = r["displacement_max_mm"], r["stress_max_MPa"]
        r["displacement_error_pct"] = None if not u else round(100.0 * (u - U_REF) / U_REF, 3)
        r["stress_error_pct"] = None if not s else round(100.0 * (s - S_REF) / S_REF, 3)

    report = {
        "experiment_id": "BUILD81-CAP-FEA-CALCULIX",
        "capability": "STRUCTURAL_FEA",
        "path": "geometry -> gmsh -> C3D10 mesh -> CalculiX input deck -> ccx 2.22 -> results",
        "fixture": {
            "object": "cantilever beam",
            "length_mm": L,
            "section_mm": [B, H],
            "second_moment_I_mm4": I,
            "material": "TEST_MATERIAL (synthetic fixture, NOT a MAT material)",
            "E_MPa": E,
            "nu": NU,
            "tip_load_N": P_TIP,
        },
        "closed_form_reference": {
            "tip_deflection_mm": round(U_REF, 6),
            "max_bending_stress_MPa": round(S_REF, 4),
        },
        "runs": runs,
        "mesh_sensitivity": {
            "coarse_elements": runs[0]["elements"],
            "fine_elements": runs[1]["elements"],
            "element_ratio": round(runs[1]["elements"] / runs[0]["elements"], 2) if runs[0]["elements"] else None,
            "displacement_change_pct": (
                round(100.0 * (runs[1]["displacement_max_mm"] - runs[0]["displacement_max_mm"])
                      / runs[0]["displacement_max_mm"], 3)
                if runs[0]["displacement_max_mm"] and runs[1]["displacement_max_mm"] else None
            ),
        },
    }
    out = WORK / "fea_acceptance.json"
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    sys.exit(main())
