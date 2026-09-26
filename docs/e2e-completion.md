# End-to-End Completion Benchmark (REQ-p19-e2e-completion, P19)

A **controlled harness benchmark** that *extends* the existing causal
harness. Implementation: `src/eval/completionBenchmark.ts`.

The registered requirement is the scope authority:

> Controlled harness benchmark (fixed repo/task/model/permissions/tools/env/
> deliverable; success/correctness/time/calls/errors/retries/intervention/
> tokens/cost/evidence/violations/quality/recovery) EXTENDING
> benchmark-fabric/causal-harness with sealed-vault and contamination
> fairness; never a second framework.

## "Extends, never a second framework"

That clause is the governing constraint, and it is enforced structurally:

- `ControlledConditions`, `TrialObservations` and `Trial` are **imported**
  from `src/eval/harness.ts`, never redefined. No export shadows them.
- `toHarnessTrials` emits trials the **existing `compareHarness` consumes
  unchanged** — a test runs `compareHarness` over the produced trials and
  reads its own deltas.
- No second comparator, aggregator, mean, delta or confound detector. Export
  names are tested to contain none of `compare`, `aggregate`, `mean`,
  `delta`.
- No runner, executor, engine, framework, service, registry, store or graph
  surface.

## The honest core: nine of thirteen facets are real

The requirement names thirteen facets. The existing `TrialObservations`
contract backs **nine**. Four have **no backing field** and are reported
`UNAVAILABLE` with a documented reason — never proxied, never zero-filled:

| Facet | Why UNAVAILABLE |
| --- | --- |
| `correctness` | no correctness field exists; not proxied from success or verification |
| `violations` | `escalations` is **not** a violation count |
| `quality` | no field, and it is a composite — **never synthesised** from the others |
| `recovery` | no recovery field exists |

```
MISSING FACET != ZERO FACET
NO COMPOSITE  != NO QUALITY CLAIM
```

`tokens` and `cost` are `OBSERVED` only when actually recorded. An
unrecorded count is **not zero** — a "no tokens" trial is `UNAVAILABLE`.

`runCompletionBenchmark` reports per-facet `observed`/`unavailable` counts so
coverage is visible rather than implied.

## Success is verified, not claimed

The `success` facet reports **`successVerified`**, with `successClaimed` kept
distinct. A trial whose deliverable or evidence is incomplete reads
`claimed but not verified`, never a success.

```
SUCCESS CLAIMED != SUCCESS VERIFIED
```

## Fixed conditions, honestly checked

The whole `ControlledConditions` block is required — the point of the
requirement is that these are *fixed*. Trials whose conditions drift are
reported in `confoundedTrialIds` and excluded from `toHarnessTrials`. Tool
order is compared as a **set**, matching the causal harness's own rule so the
two agree on what "same conditions" means.

`startingState` is part of the fixed block and is preserved on the
completion trial, because `TrialConditions` intentionally omits it and would
otherwise drop it.

## Contamination fairness and the sealed vault

Fairness reuses the guard in `src/eval/contamination.ts` through
`independentEvidenceFor`, producing `INDEPENDENT | QUALIFIED |
NO_ASSESSMENT` per trial. A trial is independent evidence only when:

- its benchmark's assessment matches **both** the benchmark **and the
  partition**, and
- the partition is not `sealed`, and
- the partition is not `train` or `validation`.

```
SEALED LABEL != PROVEN SEALED HISTORY
```

A sealed partition is never independent on its label alone — the
contamination layer already refuses that, and this module adds defence in
depth. `train` and `validation` are expected-visible by design and can never
be independent evidence.

**One partition's assessment never vouches for another.** The fairness
lookup matches on partition as well as benchmark, because filtering on
benchmark alone would let a clean `held-out` assessment certify a `train`
trial of the same benchmark. That was a real defect, found by a test and
fixed, with a regression test.

## No composite quality figure

`runCompletionBenchmark` produces `noCompositeQuality: true` and no
`winner`, `score`, `quality`, `overall`, `ranking`, `best` or `verdict` field.
Aggregation and deltas belong to `compareHarness`, which consumes the trials
this module produces.

## Boundaries

- Not a second causal harness; it produces inputs for the real one.
- Not a second benchmark store, dataset registry or evidence graph.
- Does not touch `runEvaluation` or any `Scorer`.
- Not clean-room: `REQ-p20-clean-room` remains BLOCKED and untouched.
- No clock, no network, no model or provider call, no runner.

## Source honesty

The registered source is a `RESEARCH_NOTE` reference (*"benchmark
research"*). **No primary source document exists in this repository**, so no
citation is claimed. `RESEARCH_NOTE != CITATION`.

## Release effect

**NONE.** No release gate is re-scored; public release remains
`NOT YET RELEASE-PROVEN`, scope `UNDEFINED`, `REQ-p31-release-scope`
`OWNER_GATED`.

Tests: `src/eval/completionBenchmark.test.ts` (27 tests).
