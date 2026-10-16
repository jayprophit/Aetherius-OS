# Aetherius engineering fabric — BUILD79 record

Disposable demo object: `bracket` rev 1 (60×40 base + 10×40×30 rib, fused).
All demo artifacts live in Temp; this document records evidence, not the artifacts.

## Installed application audit (measured, not assumed)

| App | Version | Automation interface | Status |
|---|---|---|---|
| FreeCAD | 1.0.2 (`freecadcmd.exe`) | headless Python, FCStd/STEP/STL read-write | OPERATIONAL via `Agent-Bridge/freecad_adapter.py` |
| Blender | 5.2.2 LTS, Python 3.13.13, API (5,2,2) — Store package, owner-pinned, NOT upgraded | `blender-launcher.exe -b -P` (no stdout capture; file-based transcripts only; direct exe Access-denied) | OPERATIONAL via `Agent-Bridge/blender_adapter.py` |
| Cura | 5.13.0 + CuraEngine 5.13.0 | CLI slicing attempted | PARTIAL: engine runs, mesh loads; standalone slice fails on definition-chain resolution (`creality_base_extruder_0` unresolvable, then cascading missing settings `roofing/flooring_layer_count`). Needs the GUI's full container stack or a self-contained setting set. |
| Shapr3D | 26.170 (Store app) | none found (no CLI/alias/API) | INTERACTIVE_ONLY |
| Paint3D | absent (no package) | — | ABSENT; deprecated, Blender covers mesh |
| KiCad | not installed | — | DEFERRED (no electronics task yet) |
| CalculiX / Gmsh | 2.22 + bundled gmsh, shipped inside FreeCAD | headless meshing API present (`Fem` module) | PARTIAL: solver+mesher runnable; scripted FEM assembly blocked (`ObjectsFEM` unimportable headless — exact error preserved) |
| OpenSCAD 2021.01 | winget, hash verified | machine-wide installer | BLOCKED on UAC elevation (not bypassed); portable-zip path noted, not taken |

## Installation campaign (BUILD79, user-space only, no elevation)

Installed and verified: SolveSpace 3.2 (single 9 MB exe; GUI-only, hangs on
`--help` — INTERACTIVE_ONLY), COLMAP 4.2.1 CPU build (CLI works),
Gmsh 4.15.2 Python API (meshed bracket STL in 0.2s: 14 nodes, 24 elements),
KiCad 10.0.6 user-scope (`kicad-cli` sch/pcb surface verified; ERC runs on
shipped files with 35–38 violations reported), OrcaSlicer 2.4.2 portable
(GUI-only: `--slice`/`--export-gcode` rejected — manual fallback only),
CadQuery 2.8.0 (pip).
COLMAP feature_extractor crashes deterministically on this machine
(exit 0xC0000409, zero output, any image count/settings) while help/version/
option-parsing work — photogrammetry path PARTIAL with exact mechanism; 8
Blender bracket views preserved as ready input; next step is an older COLMAP
CPU build or a different host.
BLOCKED on UAC elevation (not bypassed): OpenSCAD machine installer,
LibreCAD, Inkscape, CloudCompare (portable URL unlocatable). KiCad was the
exception (user-scope installer exists). Not in any compatible channel:
CAMotics, LaserGRBL, OpenModelica.
Machine-readable record: `Agent-Bridge/app_registry.py` (16 apps, capability
queries, 8 tests) — a new owner only because execution_environment.py covers
runtimes, not applications.

## Interoperability matrix (tested paths only)

| Path | Result | Loss notes |
|---|---|---|
| FreeCAD → STL (binary, 24 facets) | PASS | parametric history lost (expected: STL is downstream mesh) |
| STL → CuraEngine | PARTIAL | mesh loads; slice does not complete standalone (see above) |
| CadQuery → STEP → FreeCAD | PASS | 28 KB B-Rep, 1 solid, volume 32000.0 exact match. STEP-as-master policy EVIDENCED |
| Blender → STL (cube, 12 facets) | PASS | required 5.2 API names: `wm.stl_export`, `export_selected_objects` (legacy `export_mesh.stl`/`export_selected` gone) |
| STL → FreeCAD | PASS | 12/12 facets, no loss |
| KiCad CLI → ERC on shipped files | PASS | demo 35 violations, template 38 with pins resolving — mechanism proven |
| Hand-authored minimal schematic → ERC | PARTIAL | loads after 6 format rounds (quoted RFC UUIDs, no `(sheet`, `exclude_from_sim`/`dnp`, wire `(type solid)`), but placed-symbol pins stay `[???]`: v10 strict placed-symbol form not yet replicated |
| Deterministic resistor math | VERIFIED by hand | 5V supply, 2V LED drop, 20 mA → R = 150 Ω (matches schematic value) |
| FreeCAD → Blender (via STL) | PASS | mesh only, as expected |
| CadQuery → STEP → FreeCAD | PASS | 28 KB B-Rep, 1 solid, volume 32000.0 exact match. STEP-as-master policy EVIDENCED |
| CadQuery centering | CAUTION | `box()` is center-based vs FreeCAD origin-based: my script made a 30-tall union, caught by bbox inspection. Convention mismatches are real interop hazards |

## Canonical engineering object (proposed, minimal)

```text
object_id / project_id / revision / lineage / provenance
geometry: {coord_system, units, bbox, solids[], meshes[]}   # STEP/B-Rep master
engineering: {tolerances, constraints, assemblies}
material: {MAT_REF (never copied values), density_source+status}
manufacturing: {process, profile_ref, machine_constraints}
simulation: {solver+version, mesh_ref, loads, results, assumptions[]}
reality: {photos, scale_ref, reconstruction_error}
derivatives: [{path, produced_by, app_version, verified}]
```
MAT stays the material authority: Titanium/Aluminium density records checked
are all CANDIDATE-NEEDS-REVIEW, so mass (= 36000.0 mm³ × density) is BLOCKED
on verified density — mechanism ready, value refused. Verified geometry:
volume 36000.0 mm³, CoG (21.67, 20.00, 11.67), cross-checked analytically.

## Cross-application bracket manifest (demo)

object `bracket@rev1`: bracket.FCStd (FreeCAD, dims verified) → bracket.stl
(24 facets) → CuraEngine attempt (PARTIAL, logged) → scene.blend (Blender,
5 objects verified) → preview.png (256×256 valid) + MASS.txt (volume/CoG).
One object, one revision, every derivative linked with producer + version.

## Aetherius-native decomposition (evidence-justified)

Proven reusable: app discovery, bounded script execution with timeouts,
transcript-marker verification (exit codes lie in both apps), path
containment, artifact-existence checks, definition-pinned legacy APIs.
Still app-specific: geometry kernels, parametric history, meshing, slicing
profiles, renderers. Correct next native piece: the canonical object above
backed by the existing StateEnvelope store — NOT a rewritten CAD kernel.

## Failure / incompatibility register

- FreeCADCmd exit 0 on script error; Blender crash-on-exit after valid render.
- Blender 5.2 API renames vs 4.x (`wm.stl_export`, `export_selected_objects`).
- CuraEngine standalone definition resolution (mechanism documented above).
- `Part.Compound` has `CenterOfGravity`, not `CenterOfMass`.
- Fused face-touching solids stay a Compound (volume still exact).
- OpenSCAD machine installer needs elevation (owner action).

## Resources

All app work sequential, LLM unloaded during renders/slices per policy.
No physical machine operated; no printer/CNC/laser actuation (owner
authorization required). G-code simulation and laser workflows: not started
(no machine, no verified need yet). KiCad/OpenModelica/QGIS/GIMP/Krita/
Inkscape/CAMotics/LaserGRBL/CloudCompare/COLMAP: researched, deferred —
no justified gap demonstrated this session.
