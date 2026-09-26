# Reflex calibration

`REQ-p22-reflex-calibration` — P22, owner `genesis`, status PROVEN.

Implementation: `src/genesis/calibration.ts`
Tests: `src/genesis/calibration.test.ts` (44)

## Registered scope

> First-class calibration for reflex scores: Brier/NLL/ECE, reliability and
> risk/coverage curves, temperature/isotonic calibration where justified; never
> name a technique not reproduced.

Its classification is exact: *"Bridge calibration_engine is hardware tuning,
Genesis confidence is frequency-blend"*. Neither is score calibration, so neither
is reused:

```
BRIDGE calibration_engine (hardware tuning) != SCORE CALIBRATION
GENESIS confidence (frequency blend)      != SCORE CALIBRATION
```

## Never name a technique not reproduced

This is the clause that shaped the module most. Every technique named here is
implemented and measured in this file, and nothing else is listed. Both named
techniques are genuinely reproduced:

- **Temperature scaling** — a deterministic grid search over a positive scalar,
  selecting the temperature that minimises NLL. A grid rather than a gradient
  solver keeps the result reproducible with no clock, no seed and no convergence
  tolerance.
- **Isotonic regression** — the pool-adjacent-violators algorithm, pooling
  neighbouring fitted values whenever they violate monotonicity. The result is
  monotone non-decreasing by construction, and that is asserted in the tests.

There is no third technique mentioned, because there is no third technique here.

## A fitted parameter is not a proven improvement

Fitting a temperature says nothing about whether it helped. Every fit therefore
reports the metric **before and after**, and `improved` is only ever the
comparison of those two measured numbers.

```
A FITTED PARAMETER IS NOT A PROVEN IMPROVEMENT
CALIBRATED != BETTER
NO MEASURED IMPROVEMENT != CLAIMED IMPROVEMENT
```

With no fit applied, the report is uncalibrated and says so:
`UNCALIBRATED SCORE != CALIBRATED SCORE`, `RAW CONFIDENCE != POST-TEMPERATURE
CONFIDENCE`.

## Endpoints are rejected, not clamped

A calibration probability must be strictly inside (0, 1). This is deliberately
**not** `validAbstainProbability` from `./abstain`, which is inclusive of 0 and 1
— correct there, where "certainly abstain" is a legitimate value, and wrong here,
where a predicted 0 with an observed positive makes the negative log likelihood
infinite.

```
ABSTENTION PROBABILITY (INCLUSIVE) != CALIBRATION PROBABILITY (STRICT)
NEITHER ENDPOINT IS CLAMPED TO MAKE A METRIC COMPUTABLE
```

`applyTemperature` likewise reports saturation out of (0, 1) as a boundary rather
than clamping it back and presenting the result as a calibrated probability.

A **fitted** isotonic value is a different case: it is an empirical block rate
and can legitimately be exactly 0 or exactly 1. Scoring that with the strict
input validator would refuse it and make a legitimate fit unusable. So fitted
endpoints are clipped for scoring against a documented epsilon and the clip
count is **returned** as `endpointClips`:

```
DISCLOSED CLIP != SILENT CLAMP
A FITTED ENDPOINT IS NOT A SUPPLIED PROBABILITY
```

## Too little data is not a fit

Both fitters require a minimum sample size and otherwise report
`INSUFFICIENT_CALIBRATION_DATA`. This is a real constraint, not a formality: a
single observation can drive NLL to near zero for almost any temperature, so a
fit from too little data would be a confident answer to an unanswerable
question.

## Metrics and curves

- **Brier** — mean squared error of the predicted probability.
- **NLL** — mean negative log likelihood.
- **ECE** — expected calibration error over **declared** equal-width bins. The
  bin count is carried in the report because ECE depends on it, and an empty bin
  reports `null` for both mean predicted and observed rate rather than a zero
  that would plot as a confident bin nobody observed.
- **Reliability curve** — per-bin count, mean predicted and observed rate.
- **Risk/coverage curve** — selective prediction over a caller-supplied ranking
  score, reporting the error rate among the top fraction. An error is an observed
  outcome that contradicts the predicted class. With no ranking supplied the
  order is a declared tiebreak, never an arbitrary one.

`baseRate` is reported alongside, because every metric above is read against the
observed positive rate.

## What this is not

```
CALIBRATION != POLICY AUTHORITY
CALIBRATION != ROUTING DECISION
CALIBRATION != REFLEX DECISION
```

The report grants no authority, decides no reflex, and emits no verdict, score,
rank, winner or permission field. A calibrated probability is still a
probability.

Outcomes are **caller-observed and never inferred**. Observations are
canonically ordered before any summation, because floating-point addition is not
associative and scrambled input would otherwise produce metrics differing in the
last digits. No clock, no filesystem, no network.

## Defects found and fixed

1. **A reused validator was wrong for this contract.** The first implementation
   reused `validAbstainProbability`, which accepts 0 and 1. Tests caught it: a
   calibration probability of exactly 0 slipped through. Replaced with a
   deliberately strict local predicate, documented as a *different* predicate
   for a *different* reason — not a duplicate validator.
2. **Metrics were order-sensitive.** The same observations in a different order
   produced NLL differing in the final digits, because summation order changed.
   Observations are now canonically ordered before any arithmetic.
3. **A legitimate isotonic fit became unusable.** Fitted block rates of exactly
   0 or 1 were rejected by the strict input validator, so the fit threw. Fitted
   values are now scored with disclosed endpoint clipping.

Four further failures were **my own wrong test expectations**, and the tests were
corrected rather than the code: a Brier score of 0.725 written as 0.85, a
"perfect" Brier of 1e-6 asserted as exactly 0, an ECE bin-count comparison whose
data was grouping-invariant at both resolutions, and a risk/coverage case where I
had mislabelled which item was an error. A failing test is not automatically a
failing implementation.

## Gates

- `src/genesis/calibration.test.ts` — 44/44
- related (genesis, toolchain, workers, analysis, programme, state) — 520/520
- `npm run typecheck` — clean
- `npm run build` — clean, 46 modules
- `npm run registry:validate` — clean, 243
- lint — `NOT_APPLICABLE`; no lint script and no
  eslint/biome/oxlint/tslint/stylelint/prettier config in the repository. **Not
  a pass.**
- full suite — **not a clean pass**: 1100 tests, 1092 passed, 8 timeouts,
  **0 assertion failures**, in pre-existing filesystem-heavy tests this unit never
  touched. Re-running the three affected files in isolation clears 6 of the 8
  (92 tests, 90 passed, 2 timeouts, 0 assertion failures), with the scheduler
  file fully green. The machine was measurably more loaded during this run
  (`cycles and depth excess` at 13.8s under load against 2.3–3.9s in earlier
  isolation runs). Open timing item; see `native/BUILD-TODO.md`.

Source: research addendum 2026-09-23. `RESEARCH_NOTE != CITATION`.
