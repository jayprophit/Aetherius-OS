# Research reconciliation report — BUILD78 (§24)

Live repositories win over handover prose. Every claim below was checked
against code, tests and registries on 2026-10-03. Nothing here invents a
requirement; genuine gaps are registered as research, not product.

## 1. Canonical parent requirement

**REQ-COMPUTE-FABRIC-001 DOES NOT EXIST** in `requirements.json` (110
requirements, zero hits). The handover's claimed parent is absent.
Closest existing, by semantic scope:
- `REQ-p18-model-fabric` (provider routing/failover, BLOCKED on credentials)
- `REQ-p22-reflex-fabric` (typed decision compute, COMPLETE)
- `REQ-p18-hardware-profiles` (measured routing profiles, COMPLETE)
- `REQ-p18-superposition-lab` (STUDY_ONLY quantization lane, COMPLETE)
Determination: register heterogeneous low-bit/elastic-compute work as a
research note under the superposition-lab lane (§25-B), not a new product
requirement. No `REQ-NEW-SUB-1-BIT-*` will be created for a naming difference.

## 2-4. Related requirements, research, capabilities

Related requirements: the four above + `REQ-p18-training-compute`
(advisory only, explicitly not training), `REQ-p20-execution-target-profile`
(schedulable targets, COMPLETE), `REQ-p19-scheduler` (routine scheduler, not
compute scheduler), `REQ-p22-selective-escalation` (typed escalation with
confidence, COMPLETE — the closest existing confidence-gating).
Research records: `docs/superposition-lab.md`, `docs/training-compute-lifecycle.md`,
`docs/hardware-profiles.md`, `docs/CAP-research-catalogue.md`.
Capability nodes: `CAP-genesis-reflex`, `CAP-genesis-escalation`, hardware/
training/superposition nodes in the platform report. All generated reports
are projections, not owners.

## 5-7. Low-bit/ternary/BitNet, compression code, benchmarks

Agent Bridge: `compute/providers.py` routes `bitnet→ternary-emu` with
`simulated=True`; `system_adaptation.py` has emulated trit packing/ternary
add; `true_gap_index.json` records "Ternary / low-bit computing" and
"Binary/ternary compiler path" as GAPS (no silicon, no compiler).
ZERO hits for: heterogeneous, elastic, adaptive, low-bit (as implemented
capability), model compression (as code), sparse AI, neural compression,
confidence routing. `REQ-p18-superposition-lab` explicitly notes NOT
BitNet/ternary compute, toy synthetic only, 1-bit dimensions rejected.
Benchmarks: `src/eval/harness.ts` (`TrialObservations`, `compareHarness`)
plus completionBenchmark consuming it unchanged — the canonical comparison
surface. No second harness will be built.

## 8. Experiment lineage schema — EXISTS, reuse it

`src/eval/harness.ts` trial/experiment IDs, controlled conditions, facet
vocabulary; TaskCenter history/evidence; TaskCenterNode amendments. No new
lineage database. Experiment IDs for BUILD78 will be recorded through these.

## 9-11. Confidence routing, heterogeneous routing, resource scheduling

Confidence routing: MISSING as model routing (only escalation confidence +
calibration exist). Heterogeneous low-bit routing: MISSING (only emulated
flags). Resource scheduling: PARTIAL (`ResourceAccounts`/`try_reserve` in
Genesis runtime, scheduler for routines, placement for cloud; no
HOT/WARM/SLEEP lifecycle — correctly deferred, not reimplemented here).

## 12. Deterministic offload — EXISTS as architecture

Checkpoints, evidence gate, P25, StateEnvelope, calculator/filesystem
semantics already keep deterministic work out of models. No new mechanism.

## 13. Reflex/decision models — EXISTS

`REQ-p22-reflex-fabric` + calibration + abstention + escalation. A System-1
router for experiments can compose these; no new identity, no new authority.

## 14. Memory/consolidation overlap — all 26 cognition areas EXIST

Identity-scoped memory, provenance, associative activation, decay, dormancy,
archival (state exists; no dedicated transition test — the single smallest
verified gap in this area), reinforcement, consolidation (+scheduler,
+retention eval), contradiction retention, supersession/retraction, source
quality, world/self/other separation, calibration (3 forms), autobiographical
continuity, causal hypotheses, predictions, outcomes, counterfactuals
(simulated=true, action_authorized=false), interference, scheduling,
retention, perception projection, immutable snapshots, corruption checks,
lineage, bounded resources — all with code paths and tests. Research terms
(dreaming, sleep, world model, experience replay) map onto these; they do
not justify reimplementation.

## 15. External reference/fork coverage

`github_repos.txt`, repo inventories and categorization files exist in
Agent Bridge; the 11 named experiment CSVs
(`genesis_halving_phase*.csv`, `genesis_math_transform_*`,
`genesis_2bit_*`, `Power-family*`, `Root___power*`,
`Optimized_nonlinear*`) were searched across all of Projects and found
NOWHERE — recorded as unavailable external artifacts. Historical numbers
(§13 of the brief) are prior evidence, not fresh measurements.

## Handover-concept classification

- EXISTING: autonomous loop (×2 tested implementations), independent review/
  critique (reviewer.py + execution contract), heartbeat/durable checkpoints,
  target-state verification (acceptance gates), plan-apply-reconcile
  (AdaptiveTaskGraph + contract), knowledge graph (depgraph.json +
  capability-graph.md), just-in-time context (prompts_lib.py), skill
  scaffolding (Aetherius skills surface — verify before extending).
- PARTIAL: always-on context injection (no measured relevance loop);
  capability generation (descriptors exist, no runtime extension path).
- MISSING (research-only): structured idea/spec generation, autonomous
  failure-driven curriculum, verified agent-trajectory RL, single agent
  across GUI/code/API, model-confidence routing, elastic compute.
- RESEARCH_ONLY: low-bit/ternary silicon paths, quantum integration,
  sub-1-bit claims, 1 GB active-intelligence target.
- SUPERSEDED: any claim that clean-room, cloud or actuator evidence exists
  (gates say otherwise).
- CONTRADICTED: "31 capabilities" (30 on disk), "62/62 node tests"
  (125/125), suite-name-based cert detection (fixed).
- FAILED_EXPERIMENT (preserved): sparse-ternary collapse, naive DCT+2-bit,
  patterns-of-patterns, low-rank/binary without retraining.
- NOT_APPLICABLE: quantum hardware, microphone capture, public listeners.

## Genuine gaps registered (research, not product)

R1. Heterogeneous low-bit/ternary compute routing beyond emulation —
  parent: superposition-lab lane; blocked on silicon/toolchain (external).
R2. Model-confidence-gated fast/slow routing — no implementation; the
  BUILD78 experiment below tests exactly this on a real small LM.
R3. Associative/external-memory offload comparison — no implementation;
  single controlled comparison authorized if cheap.
R4. Explicit `archival` transition test in Genesis MemoryGraph — tiny,
  may be closed opportunistically without touching semantics.
