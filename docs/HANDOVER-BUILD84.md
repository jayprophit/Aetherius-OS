# AETHERIUS / GENESIS — HANDOVER (end of BUILD83–BUILD84 session)

**Written:** 6 October 2026. **No commits, pushes, tags or releases were made.**
Repos: Aetherius-OS `master bd29438` (dirty 57) · Agent-Bridge `main 3dc6e5a` (dirty 12) ·
IDE-Workspace `master 0f9b973` (clean) · Genesis `main cb10924` (2 intentional refs).

---

## 0. READ FIRST — two security items

1. **An Onshape password was pasted into chat and is now compromised.**
   Account `jprophit@gmail.com`. Rotate it. It was deliberately **not** written to any
   repo, config, or evidence file. Onshape was never logged into this session.
2. Onshape, if used, must go through the **already-authenticated browser session**
   driven by `Agent-Bridge/browser_cdp.py` (MS Edge, CDP-capable, running). Do not
   put credentials on a command line — they land in process listings.

---

## 1. WHAT THIS SESSION CLOSED (all evidence-backed)

### Engineering capabilities newly VERIFIED
| Capability | Key evidence | Where |
|---|---|---|
| Point-cloud processing | CloudCompare 2.13.2 portable, MD5-verified; mesh volume **96000.00000000 mm³** exact; ×2 transform **120×80×80** exact; C2C 0.155 mm; C2M 0.023 mm | `research/build81/pointcloud/` |
| Structural FEA | Gmsh→C3D8→CalculiX 2.21; 3 mesh densities; **Σ reaction −99.999999 N vs 100 N applied**; monotone convergence to beam theory (−61.1% → −28.5% → **−9.12%**) | `research/build81/fea/` |
| 3D-print slicing | CadQuery→STL→CuraEngine 5.13 headless; 1.92 MB G-code; 0.2 mm × **200 layers**; 67,507 motions; part span 60.344/40.105/39.8 mm | `research/build81/slicer/` |
| Reality capture (SPARSE) | COLMAP 4.2.1; 18 imgs; 1406 kp/img; **153/153 pairs**; **18/18 cameras**; 2243→1739 pts; med reproj err 0.185 px; recovered **59.23/43.65/36.92** vs 60/40/40 = **1.28%/9.11%/7.69%**; C2M mean −1.079 mm | `research/build83/reality-capture/` |
| CNC simulation | Toolpath + headless stock-removal sweep; depth 6.000 mm (**0% err**); bbox within one cell; **0 collisions**; volume 12,961.92 vs 14,400 mm³ (−9.99%, expected raster scallop) | `research/build83/cnc/` |
| Laser preparation | DXF(2 layers)→SVG→GRBL; 68 burns; bounds error 0.0000 mm; power values labelled **SIMULATION PLACEHOLDERS**; nothing fired | `research/build83/laser/` |
| Thermal conduction | Direct tridiagonal solve vs exact analytic; **0.0 K error**, flux 48000.0 W/m² at 19/199/999 nodes | `research/build83/thermal/` |

### Newly installed this session
- **LaserGRBL 7.14.1** → `C:\Program Files (x86)\LaserGRBL\LaserGRBL.exe` (silent, exit 0)
- **MeshLab 2025.07** → `C:\Program Files\VCG\MeshLab\meshlab.exe` (silent, exit 0)
  *(installs under `VCG\`, not `MeshLab\` — the earlier "empty directory" diagnosis searched the wrong path)*

### False "missing/elevation-blocked" claims DISPROVED
**CAMotics 1.2.0** (`Program Files (x86)\CAMotics`) and **OpenModelica 1.27.1**
(`Program Files\OpenModelica1.27.1-64bit\bin\omc.exe`) were **already installed and
working**. Both earlier "not installed" statuses were wrong. LibreCAD 2.2.1.5, Krita
5.3.4 and CloudCompare 2.13.2 likewise confirmed present.

---

## 2. BUILD78 / BUILD84 — THE REAL-LM EXPERIMENT (executed; this closes your #1 critical gate)

Your note said the correct next milestone is a reproducible 30M–100M LM harness comparing
FP16/INT8/INT4/2-bit/ternary against transform+pattern+sparse-residual. **That harness now
exists and has run.**

### Model identity
- **EleutherAI/pythia-70m**, revision `a39f36b100fe8a5377810d56c3f4789b9c53ac42`, **Apache-2.0**
- **70,426,624 parameters** (= 281,706,496 B fp32) → **inside the 30M–100M band**
- Cached at `%USERPROFILE%\.cache\huggingface\hub\models--EleutherAI--pythia-70m`
- Env: torch 2.14.1+cpu, transformers 5.18.0, numpy 2.5.3, 4 threads, no CUDA

### Evaluation corpus (deterministic, offline, no network dataset)
- Sorted-glob concatenation of `Aetherius-OS/docs/*.md`, **1024 tokens**, identical for every variant
- Seed 81

### Results — `research/build84/results.jsonl` (34 rows, append-safe)

| Variant | Perplexity | Real bytes | bits/param | Kind |
|---|---:|---:|---:|---|
| **FP32** | **88.5972** (×4 runs, bit-identical) | 281,706,496 | 32.000 | NATIVE FP32 |
| FP16 | 89.0464 (+0.51%) | 140,853,248 | 16.000 | NATIVE FP16 |
| **BF16** | **457.0421 (+416%)** | 140,853,248 | 16.000 | NATIVE BF16 |
| INT8 dynamic | **FAILED** — see §3 | — | — | — |
| INT4 (row-wise) | 9.26e53 | 35,722,946 | 4.060 | dequant→FP32 |
| INT2 | **inf** | 18,126,530 | 2.060 | dequant→FP32 |
| TERNARY | 3.14e52 | 18,647,906 | 2.120 | dequant→FP32 |
| BINARY | 50,303.91 | 9,328,322 | 1.060 | dequant→FP32 |

**BINARY perplexity 50,303.91 ≈ vocab size 50,304** — that is *uniform-random prediction*,
a useful sanity marker, not a near-working result.

### Nonlinear transform sweep (4-level shared codebook) — historical assumption NOT reproduced
| Transform | Perplexity |
|---|---:|
| **power_0.15** | **1.16e12 ← best** |
| fourth_root | 8.94e14 |
| cbrt | 2.70e17 |
| sqrt | 5.84e23 |
| tanh | 2.89e25 |
| identity | 5.33e28 |
| asinh | 3.52e28 |

**`cbrt > asinh > plain` does not hold here — a strong power law (0.15) beats cbrt by
~5 orders of magnitude.** Treat the inherited ordering as superseded for this model.

### Pattern / residual family — measured but currently UNINFORMATIVE
- PATTERN definition used: one shared 1-D codebook of *levels* centroids per tensor,
  fitted by Lloyd; no per-weight scale or zero-point. (A per-row variant was implemented
  first and abandoned — ~78k rows × 12 Lloyd iterations took minutes per variant.)
- PATTERN_ONLY reproduced NL-identity exactly (5.33e28) — consistency check **passed**.
- PATTERN + sparse residual at 1/2/5/10% gave 3.5e29 / 1.6e30 / 1.4e34 / 2.5e43 —
  *worse* than pattern-only. **This is not evidence that residuals hurt.** Every one of
  these sits in a fully collapsed regime (ppl ~1e28 vs baseline 88.6), where ordering is
  numerical noise. A discriminating test needs a non-degenerate base.

---

## 3. EXACT NEXT EXECUTABLE TASKS (in priority order)

### P0 — fix INT8 dynamic (one-line-ish, highest research value)
`research/build84/run_supplementary.py` failed at:
```
RuntimeError: qlinear_dynamic (ONEDNN): data type of input should be float
```
Cause: `quantize_dynamic(deepcopy(model), {torch.nn.Linear})` quantised a Linear that
receives the int64 token ids. Fixes, try in order:
1. Exclude the embedding-tied head: `skip_modules` / only quantise
   `q_proj,k_proj,v_proj,o_proj,fc_in,fc_out`.
2. Or cast the model input path: run `qm(ids)` with a float-cast wrapper, or set
   `torch.backends.quantized.engine = 'qnnpack'`.
INT8 dynamic is the one conventional method that usually survives naive PTQ, so it is the
control that tells you whether the collapse above is intrinsic or calibration-related.

### P0 — non-degenerate pattern/residual test
Base must survive. Use **per-row 8-bit uniform** (`codec.sym_quantise(w, 256)`) as the base,
then sweep sparse residual density 0 / 2 / 5 / 15%. `run_supplementary.py` already contains
this exact code path — it just never reached it because INT8 crashed first. Reorder the
script so the residual sweep runs *before* INT8 dynamic, or guard INT8 in try/except.

### P0 — finish the matrix rows not yet reached
- transform+pattern+residual at 2/5/10/25% (the full historical family
  `W ≈ T⁻¹(C[z] + Rs)` on a real LM) — **never executed**
- adaptive per-layer family selection with recorded per-layer decisions — **not implemented**
- confidence-gated fast/slow routing + calibration curve + deterministic-offload baseline —
  **not executed** (this is the second half of your stated milestone)

### P1 — engineering/UI closure
- **Dense reconstruction**: `image_undistorter` → `patch_match_stereo`. Compare X/Y/Z
  against BUILD83 sparse (1.28 / 9.11 / 7.69%). Sparse ≠ dense; do not conflate.
- **LibreCAD / Krita / MeshLab functional acceptance** — all three are installed but
  GUI-bound with no headless CLI. Use the CDP browser/desktop automation if one exists,
  else classify `FUNCTIONAL_ACCEPTANCE_REQUIRES_HUMAN_GUI` honestly. Do not mark red
  merely for lacking a CLI.
- **19-step health checklist** — search for the canonical wording; if genuinely absent,
  report `CANONICAL_19_STEP_HEALTH_CHECKLIST_NOT_LOCATED` with the search paths.
- **Inkscape** — inkscape.org unreachable from this host; only trust a pre-installed
  package manager. Otherwise `BLOCKED_DEPENDENCY`. Not capability-critical (laser/vector
  already covered).
- **OpenModelica** trivial-model sanity check (optional, cheap).

---

## 4. VERIFICATION OF THE GENESIS / BRIDGE RECONCILIATION YOU PASTED

Checked against live code, not the notes:
- **Genesis `main` @ `cb10924`** — `include/genesis/organism/loop.hpp:20` does carry the
  comment that unimplemented stages are marked `executed=false` with a `NOT_IMPLEMENTED`
  note. **The "planner/action NOT_IMPLEMENTED" claim is corroborated.**
- **Agent Bridge** — live HEAD is `3dc6e5a`, but commit `d606b917` **does exist** in the
  repository (`git cat-file -t` → `commit`). So your 186/186 policy-hardening commit is in
  history, just not the tip. Reconcile which commit is actually authoritative before
  citing the number.
- **Canonical research parent**: `Aetherius-OS/src/programme/requirements.json` has 110 IDs,
  contains `REQ-p18-superposition-lab` (**True**), and contains **no** `REQ-COMPUTE-*` IDs at
  all (`REQ-COMPUTE-FABRIC-001` = **False**, `REQ-COMPUTE-PHYSIOLOGY-001` = **False**).
- `REQ-COMPUTE-FABRIC-001` **does** exist as a cross-reference tag in
  `Genesis/docs/specifications/CONVERSATION_INTAKE_2026_09_05.md`.
  → `RESEARCH_REGISTRY_CANONICAL = Aetherius-OS/registry/research.json`.
  Your recommendation to register the work under that Genesis-side reference rather than
  inventing a new compute architecture is sound; record it as a Genesis intake child with a
  link to `REQ-p18-superposition-lab` as the Aetherius-OS parent.
- **Historical CSVs** (`genesis_halving_phase*.csv`, `Power-family_*`, etc.): searched C:
  and E:, **absent**. Record `HISTORICAL_EXTERNAL_EVIDENCE_NOT_LOCATED`. Do not re-search
  the same paths.

## 5. MAT — NOT TOUCHED, BY DESIGN
MAT is the owner's separately-governed worktree with Codex active. The P0–P4 MAT gap list
you pasted is recorded here for a MAT-specific session; **this session made no MAT
modifications.** Two items are objectively verifiable and cheap for that session:
the README still states 231 records/28 sources/27 images, and the obsolete
"missing Da Vinci visual" file should be regenerated.

## 6. Reproducing this session's research
```
cd Aetherius-OS\research\build84
python run_matrix.py          # baselines + uniform quant + nonlinear + pattern/residual
python run_supplementary.py   # INT8 dynamic + non-degenerate residual sweep (needs the P0 fix)
```
Both append to `results.jsonl`. Storage artifacts land in `storage/*.npz` with SHA-256 heads.
No network is needed once the model is cached.

## 7. Standing constraints (unchanged)
No commit/push/tag/release without explicit authorization. Do not bypass UAC — this process
is **not** elevated (`elevated=False`), which is why a Qt-IFW installer refused to start.
No physical actuation of printers, CNCs, lasers or robots. Preserve negative results.
`MACHINE_COMPLETE: false`, `TECHNICALLY_QUALIFIED: false`, `OWNER_PUBLICATION_AUTHORIZED: false`.

**Verdict: `ENGINEERING_SUBSET_VERIFIED` · `CONTINUE_DEVELOPMENT` · `CONTINUE_RESEARCH`.**

---

## 8. THE CANONICAL DATA/PROGRESS REGISTRY (authoritative source)

**`Aetherius-OS/docs/SYSTEM-CAPABILITY-REGISTRY.yaml`** — 281,353 B, `schema_version 1.0.0`,
`source_date 2026-10-01`. This is the programme's persistent capability/progress source of
truth. Top-level keys: `schema_version`, `source_date`, `default_requirement_parent`,
`requirement_parents`, `capabilities`.

**Binding rules declared in its own header — respect them:**
- Stable IDs are permanent; hierarchy position is not. Move with history.
- `REQ-*` concepts are **NOT** duplicated here; they materialise at load from
  `src/programme/requirements.json` (see the `requirement_parents` map).
- Statuses are evidence-backed. No verified implementation path → **never** `IMPLEMENTED`
  or above. When in doubt: `RESEARCH` or `NOT_STARTED`.
- The Markdown report is **generated** — never hand-edit it to change meaning.
- A `GENERATED SECTION` at the end is written by `scripts/import_requirements.py`.
  **Do not hand-edit below that marker.**

Entry shape (from `CAP-aetherius-os-platform` and siblings):
```yaml
  - id: CAP-<stable-slug>
    name: <Human Name>
    type: system | subsystem | component | capability
    description: <one honest sentence>
    primary_parent: CAP-<parent-id>
    status: <PARTIAL | RESEARCH | NOT_STARTED | ...>
    status_reason: <why that status, evidence-backed>
    required: true|false
    history:
      - {date: 2026-10-01, action: created, note: registry root}
```

### Registry gap found (real, not cosmetic)
A scan for `CAP-*` ids matching `compute|compress|kernel|quant|cod|fabric|elastic|neural`
returned **zero matches**. There is **no capability entry anywhere in the canonical registry
covering compression, quantisation, compute fabric, or an execution kernel.** The BUILD78/84
research therefore has **no registry home**, which is exactly the "not yet registered as an
actual programme lane" condition. The engineering capabilities verified this session
(point cloud, FEA, slicing, CNC, laser, thermal, reality capture) are equally unregistered.

**Next agent action:** add these entries *above* the generated marker, then run
`scripts/import_requirements.py` and regenerate the Markdown report. Do not hand-edit below it.
Proposed (stable IDs, honest statuses):
- `CAP-research-compute-fabric` — status `RESEARCH`; links
  `REQ-COMPUTE-FABRIC-001` (Genesis intake cross-reference) and
  `REQ-p18-superposition-lab` (Aetherius-OS parent). Holds EXP-LM-001 and BUILD84 results.
- `CAP-execution-kernel-bitwise` — status `NOT_STARTED`; binary/ternary bitwise kernel (§9).
- `CAP-cap-cloudcompare`, `CAP-cap-fea-calculix`, `CAP-cap-slicing-cura`,
  `CAP-cap-cnc-sim`, `CAP-cap-laser-prep`, `CAP-cap-thermal`, `CAP-cap-reality-capture`,
  `CAP-cap-pointcloud` — status `VERIFIED` with the numeric evidence from §1.

---

## 9. OUTSTANDING GAP I UNDER-REPORTED: BINARY/TERNARY EXECUTION AT THE KERNEL LEVEL

Correct call, and this is a genuine omission on my part. Every binary and ternary row in §2
is labelled `STORAGE_RECONSTRUCTION`: the weights were packed to bits and measured on disk,
but the forward pass was executed by **dequantising to FP32**. That proves compression is
*representable*; it does **not** prove it is *executable at the kernel level*, which is the
entire point of 1.58-bit-style schemes. Dequantising to FP32 also destroys most of the
claimed memory and compute advantage, so my numbers must not be read as a kernel result.

What is genuinely still missing, and is the next real rung:
1. **Binary kernel** — pack weight *and* activation to bits; compute the Linear dot product
   as `XNOR + popcount` (`dot = 2*popcount(xnor(a,b)) - K`), entirely in packed integer form
   with no FP32 weight materialisation. Verify against an FP32 reference within quantisation
   error, and measure throughput vs the dequantising path.
2. **Ternary kernel** — bit-sliced arithmetic over the `{-1,0,+1}` alphabet, with the
   zero-count tracked separately; no per-weight FP scale in the inner loop.
3. **Measured** peak RAM, load time and tok/s for the kernel path, so the compression win is
   demonstrated end-to-end rather than asserted.
4. Only then does a sub-1-bit claim become `SANDBOX_CANDIDATE`-worthy rather than a storage
   measurement. Until a kernel exists, keep `CAP-execution-kernel-bitwise` at `NOT_STARTED`.

Also still open from your P0 list and **not** started this session: confidence-gated
fast/slow routing with a calibration curve, and a deterministic-offload baseline to compare
it against. Both are small once INT8 dynamic works (§3).