# REQ-p22-world-model-lab — World-Model Evaluation Lab (P22 proposes, lab scores; runtime untouched)

Status: PROVEN / COMPLETE. Owner: genesis.

## Registered scope

Scenario suite + quality scoring for the Genesis world model (simulation
divergence, intervention outcomes); read-only eval preserving counterfactual
non-mutation, distinct from perf microbenchmarks.

Prior state: the runtime exists and is tested
(`Genesis/src/cognition/world_model.cpp` — `WorldDynamics` with observations,
causal hypotheses, predictions with confirmed/refuted/expired states, and a
const `simulate()`). No scoring lab existed anywhere.

## What was built

`src/genesis/worldModelLab.ts` — `scoreScenario()` scores caller-supplied
scenario traces (hypotheses, predictions, observed outcomes, interventions)
against the runtime's own digest-comparison semantics. `src/genesis/
worldModelLab.test.ts` — 21 tests.

## Binding distinctions (tested)

- SCORED TRACE != LIVE RUNTIME — no runtime import, call, or reimplementation;
  the lab reads traces and reports dimensions.
- READ-ONLY IS TESTED WITH FROZEN INPUTS — `Object.freeze` (deep) on the input
  plus a no-mutation assertion; counterfactual simulation never mutates.
- PER-DIMENSION SCORING, NO COMPOSITE — hit rate, mean confidence gap,
  intervention confirm rate, per-hypothesis support/counter; a `score`/`overall`/
  `verdict` key is asserted absent.
- NO OUTCOME != NEGATIVE OUTCOME — predictions and interventions without
  supplied outcomes stay UNRESOLVED and never enter a rate; rates are null
  (never zero-filled) when nothing resolved.
- CLAIM WITHOUT EVIDENCE != VERDICT — outcomes and half-observations lacking
  an evidence digest are malformed input, not verdicts either way.
- QUALITY EVAL != PERF MICROBENCHMARK — timing/throughput fields
  (wallMs/latencyMs/throughput/tokensPerSecond) rejected as unknown.
- Digests opaque: equality only, never parsed. Intervention CONFIRMED iff the
  observed effect equals a matched hypothesis's declared expected effect —
  the runtime's own comparison.
- Issued confidences scored as reported; not reinterpreted as abstention
  probabilities, error rates, or calibration inputs (no Brier/NLL/ECE here).

## Gates

- Targeted: 21/21. Related (genesis+programme+state): 417/417.
- Typecheck clean. Lint NOT_APPLICABLE.
- Full suite: 1167 tests — run-to-run variance (5 failed, then 1, then 2
  across runs) with ZERO assertion failures throughout; affected files
  re-run in isolation 63/65 with the same 2 known-slow cases
  (promotion owner-deny, workflows cycles-and-depth) timing out and nothing
  else. Classification: OPEN TIMING ITEM (load-dependent timeouts in
  pre-existing filesystem-heavy tests this unit never touched).
- Build clean. Registry validation 243/243.
- Requirement mutation: id-anchored surgical edit, 3-line diff
  (status/evidence/work_state), JSON re-parsed OK (107 requirements, exactly
  1 match), no other requirement ID touched.
- Selector retargeted (assertions now verify the selector moved past
  world-model-lab); NEXT_EXECUTABLE_TODO = REQ-p23-work-monitoring (P23).
