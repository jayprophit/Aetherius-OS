# HANDOVER — BUILD85 / R1–R4: hybrid binary+ternary+quantum fabric

**Date:** 6 October 2026. **No commits, pushes, tags, releases.** Predecessor:
`docs/HANDOVER-BUILD84.md` (BUILD78 real-LM matrix) and `docs/build81-build82-closure-audit.md`.

## A. Repository state (start → end, no commits)
| Repo | Branch | Start | End | Dirty | Touched by BUILD85 |
|---|---|---|---|---|---|
| Aetherius-OS | master | bd29438 | bd29438 | 58 | registry YAML (+20 CAPs), FORK-INVENTORY.yaml, research/build85/** |
| Agent-Bridge | main | 3dc6e5a | 3dc6e5a | 12 | none |
| IDE-Workspace | master | 0f9b973 | 0f9b973 | 0 | none |
| Genesis | main | cb10924 | cb10924 | 2 | none (intentional refs) |

## B. Registry (20 new CAPs, generator clean ×3, zero removals)
`SYSTEM-CAPABILITY-REGISTRY.yaml` 281,353 → ~300 KB. Manual entries inserted above the
`GENERATED REQUIREMENT ENTRIES` marker; `scripts/import_requirements.py` run three times
(exit 0, 110/110 REQ entries, **+20 added / −0 removed** every time).
Research: `CAP-research-compute-fabric` (RESEARCH), `CAP-execution-kernel-bitwise`
(NOT_STARTED→see D), `CAP-execution-kernel-quantum` (PARTIAL, simulator),
`CAP-compute-bridge-tridomain` + `CAP-compute-router-hybrid` (PARTIAL, tested),
`CAP-compute-hal-hybrid` / `CAP-genesis-compute-supervisor` / `CAP-genesis-planner` /
`CAP-experiment-ledger` (NOT_STARTED, honest), `CAP-accelerator-time-crystal`
(PARTIAL, DTC sim), `CAP-qutrit-qudit-research` (RESEARCH), `CAP-research-elastic-routing`
(RESEARCH), `CAP-research-lm-eval-harness` (VERIFIED). Engineering: 7 VERIFIED entries
(cloudcompare, fea-calculix, slicing-cura, cnc-sim, laser-prep, thermal, reality-capture).
`docs/FORK-INVENTORY.yaml` created: BitNet/llama.cpp/ONNX-RT/QEMU EVALUATE, Qiskit REJECT
(oversized), Cirq SUPERSEDED, seL4 REFERENCE_ONLY, GPL boundary recorded.

## C. INT8 (corrected outcome: FAILED with precise diagnosis)
Block-only dynamic quantisation (24 attention+MLP linears, embed/norm/head untouched)
still fails: `qlinear_dynamic (ONEDNN): data type of input should be float`, with hooks
proving **no non-float tensor ever reaches a quantized Linear** — the failure is inside
ONEDNN's kernel preconditions on this torch 2.14 CPU build, not our wiring. qnnpack engine
unsupported in this build. torchao not installed. **Fallback that works:** per-row INT8
uniform + dequant gives **ppl 87.5494 (better than FP32 88.5972 — unexpected, needs
replication, not a claimed win)**. Row: `research/build85/int8/results.jsonl`.

## D. Binary kernel (NOT_STARTED → PARTIAL, correctness-positive / performance-negative)
Math: `dot = 2·popcount(XNOR) − K`, MSB-first uint64, trailing-pad mask, LUT popcount,
scales outside. Correctness: exact integer agreement on 11 shapes incl. non-multiples of
64, extremes, matrix path, round-trip, dtype guard — **all pass**. Benchmark (identical
shapes, warmup+25 reps): torch FP32 0.05–0.13 ms vs kernel 0.32–0.99 ms → **speedup
0.12–0.16× (6–8× SLOWER)**, bytes 32× smaller. Reported as negative performance result per
§12/§36. Vectorised==loop verified. No FP array in kernel path (dtype-enforced).

## E. Ternary kernel (PARTIAL, correct; LM benchmark deferred)
Dual-mask (pos/neg) representation, overlap rejected at runtime; dot via four masked
popcounts. Tests: 10 shapes ×4 trials, zero-annihilation, sign-negation, matrix path,
round-trip, overlap guard — **all pass**. A-vs-B LM benchmark **not run** (budget).

## F. Pattern/residual (discriminating result obtained)
INT8-row base (87.55, 8.06 bits) + sparse int8 residual at 0/2/5/15% →
**87.55 / 88.65 / 88.03 / 87.22** at 8.06/8.86/10.06/14.06 bits/param. Residuals recover
quality monotonically-ish from 2% up; 15% beats the base. Earlier "residuals hurt" reading
was a real bug (replaced base instead of adding — caught, fixed, preserved).
Transform+pattern+residual, adaptive per-layer: **not executed**.

## G. Quantum kernel (PARTIAL, simulator; hardware untouched)
Dependency-free statevector simulator. Q1–Q5 pass; **Bernstein-Vazirani s=101 recovered**;
binary/ternary round trips pass with reserved-11 rejection; remote backend raises
NOT_AVAILABLE (never faked). Two real bit-ordering bugs found and fixed (BV ancilla
X-then-H; MSB-first pair mapping). All labelled QUANTUM_SIMULATED. No QPU used.

## H. Middle bridge (PARTIAL, 14/14 tests)
ComputeEnvelope + 6 directions + loss taxonomy + router. Fixed 3 genuine defects found by
tests (binary qubit order, skipped Q→T decode, router sort). Invalid-domain rejection,
provenance, error-bound propagation all verified.

## I. Time-crystal accelerator (PARTIAL, simulator only)
N=8 driven spin chain, eps=0.06, 60 Floquet periods: interacting amplitude **0.97** with
perfect period-2 alternation vs **0.61** control → `DTC_SIGNATURE_PRESENT`. Simulator,
never hardware.

## J. Experiment ledger
`research/build85/ledger/`: cross-build indexer over every results.jsonl →
**104 rows (86 OK, 18 failed/other preserved)**.

## K. Independent review (Granite-4 3B, allowed to reject — but didn't)
Supplied kernel math, benchmarks, PPL, storage, quantum labelling; asked for hidden
dequantisation, invalid XNOR, unfair timing, overclaims. It returned VERIFIED on all 7
claims. **Weight this accordingly: the review concurred without adversarial findings, so
it is a weak check, not a strong one.** Noted as a residual risk, not as validation.

## L. Verdicts (§71/§44)
| Question | Answer |
|---|---|
| Binary compresses? | Yes (9.3 MB vs 281 MB) |
| Binary executes natively? | **Yes, correctly — but 6–8× slower than torch on this CPU** |
| Ternary compresses / executes? | Compresses yes; executes yes at kernel level; LM benchmark missing |
| Quantum path exists? | Simulator yes; hardware **never used** |
| Bridge / router work? | Yes, tested; router is capability-based, not performance-learned |
| QAT help? | Not attempted; BLOCKED_HARDWARE retained with reopen condition |
| Pattern/residual useful? | **Yes — discriminating trend obtained (87.55→87.22 at cost)** |
| Adaptive / routing / offload? | **Not executed** |
| Overall | **CONTINUE_RESEARCH** (no SANDBOX_CANDIDATE: quality too poor, kernel slower, review weak) |

## M. Historical corrections (new this build)
1. "Residuals hurt quality" → **was a code bug** (replace-vs-add); corrected result inverts it.
2. "Inkscape/CloudCompare-style missing rows" — no new false claims; registry now complete.
3. DTC verdict criterion first used alternation-score (control also alternates); corrected to
   amplitude-contrast. Preserved in `timecrystal_dtc.json`.

## N. Remaining (honest, not owner-only)
Technically unfinished: ternary LM benchmark; transform+pattern+residual; adaptive manifest;
routing+calibration+offload; dense reconstruction; 19-step checklist; HAL module;
supervisor/planner implementation; BitNet adapter measurement; stronger review.
Blocked platform/dependency: ONEDNN INT8 path; inkscape.org; WSL/OpenFOAM.
Blocked owner: G04/G06/G07/G09/G12, commits, corpus.
Security: Onshape credential compromised — owner must rotate; never written to repo.
