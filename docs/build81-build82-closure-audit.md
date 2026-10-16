# BUILD81 / BUILD82 — Engineering Closure Audit and Live-State Corrections

**Date:** 6 October 2026
**Scope:** CAD/manufacturing environment, reality capture, FEA, slicing, point cloud,
plus the research-programme items in the BUILD82 audit.
**Rule observed:** INSTALLED != WORKING. Nothing below is marked green on version
evidence alone.

---

## 1. The BUILD82 audit was written from a stale machine snapshot

Four of its findings were already false when it was written. Verified corrections:

| BUILD82 claim | Live verified state | Evidence |
|---|---|---|
| LibreCAD 2.2.1.5 — BLOCKED_OWNER (WinError 740) | **INSTALLED** at `C:\Program Files\LibreCAD\LibreCAD.exe`, launches successfully | owner completed the elevation batch |
| Krita 5.3.4 — BLOCKED_OWNER (WinError 740) | **INSTALLED** at `C:\Program Files\Krita (x64)\bin\krita.exe` | same |
| MeshLab 2025.07 desktop — BLOCKED_OWNER | Registered in uninstall registry, but install directory is **absent/empty** — unresolved partial install | registry vs filesystem mismatch |
| CloudCompare — NO WORKING INSTALLATION | **OPERATIONAL**, official Windows x64 portable 2.13.2, MD5-verified | see §2 |

The BUILD82 conclusion "were all CAD apps installed? NO" is still directionally
correct, but its per-application evidence for those four rows is wrong and must
not be reused.

---

## 2. CloudCompare — POINT_CLOUD_PROCESSING = VERIFIED

The ARM64 package remains permanently rejected (wrong architecture).

- Source: `https://www.danielgm.net/cc/release/CloudCompare_v2.13.2_bin_x64.7z`
- Expected MD5 `55F90E46BD9565907E50B49A2F5F9490` == observed MD5
- Portable, no elevation. Extracted with the already-installed 7-Zip
  (Windows `tar` cannot read LZMA; `py7zr` install was abandoned).

| Acceptance criterion | Result |
|---|---|
| launch / version | PASS — 2.13.2, 38 plugins registered |
| import point cloud | PASS — 52,326 + 42,525 point clouds |
| measure dimensions | PASS — `-MESH_VOLUME` = **96000.00000000 mm³** on the exact 60×40×40 reference (expected 96000, error 0.0) |
| scale / transform | PASS — `-APPLY_TRANS` ×2.0 gave bbox **120.000 × 80.000 × 80.000** exactly |
| point-to-point comparison | PASS — `-C2C_DIST` mean **0.154663 mm**, std 0.110719 |
| cloud-to-mesh comparison | PASS — `-C2M_DIST` mean **0.0225805 mm**, std 0.115679 |
| save output | PASS |
| reopen output | PASS |

CLI behaviours discovered (would otherwise repeat):

- `-GLOBAL_SHIFT` is rejected as a standalone global flag; omit it for small coordinates.
- `-SAVE_CLOUDS` requires exactly one filename per loaded cloud — use `-POP_CLOUDS` first.
- The default cloud output format is **BIN** regardless of the file extension;
  a `.ply` written without `-C_EXPORT_FMT PLY` is really `CCB2-` binary.
- `-STAT_TEST` is a goodness-of-fit hypothesis test (needs distribution+mean+std),
  **not** a bounding-box reporter.
- `-APPLY_TRANS` takes a matrix **file path**, not an inline matrix.
- `-COORD_TO_SF` requires an explicit `X|Y|Z`.
- CloudCompare is a GUI-subsystem binary: use `Start-Process -RedirectStandardOutput`
  to capture output, otherwise the shell sees no output and no exit code.

Evidence: `research/build81/pointcloud/cloudcompare_acceptance.json`

---

## 3. Structural FEA — STRUCTURAL_FEA = VERIFIED (was 🔴 "no complete FEA path proven")

Path: `geometry -> gmsh 4.15.2 -> structured C3D8 -> CalculiX deck -> ccx -> results`

Solver installed: **CalculiX 2.21** from the official `dhondt.de` Windows package,
portable, no elevation. (`ccx_dynamic` additionally needs `mkl_rt.2.dll`, which is
not shipped; the static build is self-contained.)

Fixture: 100 × 10 × 10 mm cantilever, `TEST_MATERIAL` E=210000 MPa, ν=0.3,
100 N tip load. `TEST_MATERIAL` is an explicitly labelled synthetic fixture and
is **not** a MAT material.

| Mesh | Nodes | Elements | max disp (mm) | error vs beam theory | max von Mises (MPa) | error | Σ reaction z (N) |
|---|---|---|---|---|---|---|---|
| 5×2×2 | 216 | 125 | 0.074052 | −61.12% | 23.27 | −61.22% | −100.00004 |
| 10×4×4 | 1,331 | 1,000 | 0.136128 | −28.53% | 39.56 | −34.07% | −99.99984 |
| 20×6×6 | 9,261 | 8,000 | 0.173114 | **−9.12%** | 51.60 | **−14.00%** | **−99.999999** |

Closed-form reference: δ_tip = PL³/3EI = 0.190476 mm, σ = Mc/I = 60.0 MPa.

- **Equilibrium is exact**: summed fixed-end reaction equals the applied 100 N
  load to within 1×10⁻⁵ N at every density.
- Convergence is monotone toward the analytical solution as elements through the
  thickness increase. Full-integration C3D8 is stiff in bending, so a −9% residual
  at 6 elements through thickness is expected behaviour, not a solver defect.
- This is a **directional validation against closed-form beam theory**, not a
  metrology-grade comparison.

CalculiX defects found and fixed while debugging (record so they are not re-hit):

1. Set/data lines may contain **at most 16 entries** — `*ERROR in splitline`.
2. `*NSET, NSET=X` with `1, 216` is read as an **explicit two-node list, not a
   range**. All-node sets must be enumerated explicitly.
3. `*NSET` must be defined **before** the card that references it.
4. `NALL` is not predefined; it must be declared or `*NODE PRINT` writes nothing.
5. gmsh 4.15.2's Python API does **not** expose `Mesh.TransfiniteMesh` /
   `Mesh.TransfiniteCurve`; use `setTransfiniteCurve/Surface/Volume` plus
   `Mesh.RecombinationAlgorithm=3`, otherwise the recombined mesh emits pyramids
   (element type 7) that CalculiX cannot represent.
6. **The original `0xC0000005` "CalculiX is broken" conclusion was wrong.** A
   4-node deck solved cleanly. The crash was an invalid deck, not a bad binary.
   Versions 2.20/2.21/2.22 all behave identically.

Evidence: `research/build81/fea/fea_acceptance.json`, harness `run_fea_hex.py`

---

## 4. 3D-print slicing — 3D_PRINT_SLICING = VERIFIED (was 🟡 "complete slicing proof absent")

Path: `CadQuery B-rep -> STL -> CuraEngine 5.13.0 headless -> G-code -> verification`

- Object: bracket with 16 mm through hole, bounding box exactly **60 × 40 × 40 mm**,
  STL independently re-measured as 60.000 × 40.000 × 40.000 at the origin.
- G-code: **1,922,052 bytes**, Marlin flavour, `G21` mm units.
- Layer height **0.2 mm**, **200 layers**, 67,507 motion commands
  (32,234 `G0` rapids, 23,420 extruding moves).
- Printed-part span (1st–99th percentile of extruding moves, which excludes the
  travel-inclusive first extrusion of each layer): **X 60.3444, Y 40.1046, Z 39.8 mm**
  → errors +0.34 / +0.10 / −0.20 mm against the nominal bracket, consistent with
  extrusion line width and layer quantisation.
- All coordinates inside the declared build volume (220 × 220 × 250 mm).
- **No physical printer was operated.**

Cura 5.13 headless CLI, established by experiment (the widely-cited
`-m -s settings.ini` form does **not** exist in this build):

```
CuraEngine slice -j <settings.def.json> [-s key=value ...] [-e0 -s key=value ...] -l <model.stl> -o <out.gcode>
```

- `-m` is not a valid command; `-g <file>` and bare `-g key=value` are both
  rejected; `-j` registers defaults, `-r` loads resolved values.
- The generic `fdmprinter.def.json` has no value for every setting a concrete
  printer would. Missing values are reported as
  `Trying to retrieve setting with no value given: <name>`; the harness
  auto-fills and retries until clean.
- `Filament used: 0m` is emitted in this headless configuration — material/time
  estimates are **not** trustworthy here and are recorded as such rather than
  reported as evidence.
- CadQuery's `box()` is centre-origin: the first attempt placed half the bracket
  below Z=0 and Cura silently clipped it to 20 mm. Use `centered=False`.

Evidence: `research/build81/slicer/slicer_acceptance.json`

---

## 5. COLMAP — prior BLOCKED_OS blocker is VOID

The earlier `feature_extractor` crash `0xC0000409` was **not** an OS problem.
The AetheriusTools COLMAP build ships the **unified `colmap.exe` CLI** (no
standalone `feature_extractor.exe`), and extraction succeeds when GPU SIFT is
disabled:

```
colmap feature_extractor --database_path db.db --image_path images \
       --FeatureExtraction.use_gpu 0 --SiftExtraction.max_num_features 4096
```

- Result: exit 0, all images processed, SIFT features extracted.
- Note the 4.2.1 option namespace is `--FeatureExtraction.*`, **not** the older
  `--SiftExtraction.use_gpu`; the old flag is rejected as unrecognised.
- `exhaustive_matcher` still hung on a synthetic fixture that yielded only 24
  features per image. That is a fixture-quality problem, not a blocker; the
  process was terminated cleanly and no orphans remain.

Reconstruction itself (multi-view capture → point cloud → measured X/Y/Z) is
**still outstanding** and needs a properly textured Blender render of the bracket.

---

## 6. Mesh processing

- `MESH_PROCESSING = VERIFIED` via PyMeshLab (repair + decimation already demonstrated).
- MeshLab desktop: uninstall registry entry present but the install directory is
  empty — **PARTIAL / unresolved**, not green.

---

## 7. Engineering capability matrix (current)

| Capability | Status | Basis |
|---|---|---|
| Parametric CAD | VERIFIED | CadQuery |
| Programmatic CAD | VERIFIED | CadQuery |
| Constraint CAD | PARTIAL | SolveSpace launches; portable build ships **no `solvespace-cli.exe`**, so no headless proof |
| Direct CAD | VERIFIED | FreeCAD 1.0.2 |
| 2D CAD | PARTIAL | LibreCAD installed + launches, but GUI-only (no batch CLI) so dimensioned-profile authoring is unproven headlessly |
| Vector graphics | NOT_APPLICABLE_BLOCKED | Inkscape not installed |
| Raster graphics | PARTIAL | Krita installed; no `--script` flag, so crop/mask/export acceptance unproven headlessly |
| Mesh processing | VERIFIED | PyMeshLab |
| Point-cloud processing | **VERIFIED** | CloudCompare 2.13.2 (this build) |
| Photogrammetry | UNBLOCKED | COLMAP extractor works |
| Reality capture | PENDING | COLMAP reconstruction + metrology not yet run |
| Metrology | PENDING | depends on reality capture |
| Meshing | VERIFIED | gmsh 4.15.2 structured hex + tetra |
| Structural FEA | **VERIFIED** | CalculiX 2.21 (this build) |
| CFD / thermal | BLOCKED | no working solver path evidenced |
| Mechatronics simulation | PENDING | OpenModelica triage not done |
| Electronics / PCB | VERIFIED | KiCad 10.0.6 authored PCB → DRC → Gerbers → drill → 3D render |
| 3D-print slicing | **VERIFIED** | Cura 5.13 headless (this build) |
| CNC CAM | PARTIAL | G-code hand-validated only |
| CNC simulation | BLOCKED | CAMotics elevation-blocked; no portable equivalent secured |
| Laser preparation | PARTIAL | CadQuery DXF demonstrated; controller-side preview not done |

---

## 8. Research programme — unchanged this build

No BUILD81 experiment was executed. Every BUILD78 finding stands as previously
reported, including:

- The 17 runs used `EleutherAI/gpt-neo-125M` = **125,198,592 parameters**, which is
  **outside** the requested 30M–100M band. Those runs must be labelled
  `PRELIMINARY_SMALL_LM_EXPERIMENT`.
- FP32 baseline ppl 113.112 (×3 identical); INT8 regression; INT4/INT2/ternary/binary/
  codebook/per-layer/transform collapse; elastic routing mechanically working but
  calibration failed; QAT/retraining blocked.
- Still outstanding and not started: 30M–100M model run, FP16/BF16 baseline,
  explicit PATTERN_ONLY / PATTERN+RESIDUAL / TRANSFORM+PATTERN+RESIDUAL,
  full storage accounting, repeatability sweep, routing calibration metrics,
  research-registry ownership reconciliation.

Recommendation remains **CONTINUE_RESEARCH**.

---

## 9. Programme verdict

**CONTINUE DEVELOPMENT.** `MACHINE_COMPLETE` remains `false`.

This build converted three previously-red or absent engineering capabilities to
VERIFIED (point-cloud processing, structural FEA, 3D-print slicing) and removed a
false blocker (COLMAP feature extraction). It did **not** reach reality-capture
metrology, CNC simulation, laser controller validation, 2D/raster functional
acceptance, or any BUILD78 research branch, and it did not touch owner-gated
items (Docker, G06/G07/G09/G12, commit authorization, chat-corpus reconciliation).