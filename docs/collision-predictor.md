# Worker Collision Prediction (REQ-p20-collision-predictor, P20)

Forecasts cross-worker collisions **before execution**. Implementation:
`src/workers/collisionPrediction.ts`.

The registered requirement is the scope authority:

> Forecast cross-worker collisions from touch sets, branches and merge order
> before execution; reactive serialization already exists, prediction does not.

## The reactive oracle is not reimplemented

`applySync` / `SyncConflictPolicy` in `src/runners/sync.ts` already detects a
conflict **when a sync actually happens**. That remains the oracle. This unit
does not reimplement, wrap or replace it — it only *forecasts*, and it names
the caller's reactive policy in `reactiveOracle` so a reader knows which
observation is the real one. Export names are tested to contain no `applySync`,
`sync`, `merge`, `lock`, `lease` or `serialize`.

```
PREDICTION            != PREVENTION
PREDICTED COLLISION   != OBSERVED COLLISION
NO PREDICTION         != NO COLLISION
```

## The three registered inputs

| Input | Used for |
| --- | --- |
| **touch sets** | each worker's `TouchEstimate`, **consumed not re-estimated** |
| **branches** | `viaBranch` on each collision, and merge-order clash detection |
| **merge order** | `mergeOrder`; two branches at one position are reported, never silently reordered |

## An unestimated plan is not a cleared plan

A worker whose `TouchEstimate.unknown` is non-empty lands in
`unpredictable[]` carrying the estimator's **own** reasons, and its paths are
**not** counted as collisions. It is not reported as collision-free either.

```
TOUCH PREDICTION != CODE DEPENDENCY
TOUCH SET        != EXECUTED COLLISION
```

## Two structural collision kinds

`SHARED_WRITE` — two plans predict the same path.
`DEPENDENT_WRITE` — one worker writes a path that a file **another worker
predicts it will touch** imports.

`DEPENDENT_WRITE` is a genuine **two-hop join**: for a path *P* written by
*W*, the graph's importing *files* of *P* are intersected with each other
worker's own predicted touch set. A worker that merely owns a similarly named
file is unaffected. With **no** graph supplied, only `SHARED_WRITE` can be
predicted — and that limitation is the honest result rather than a guess at
dependency structure.

## No probability and no score

Two plans either share a predicted path or they do not, and that is
decidable. A collision "probability" here would be an invented number, so
none is produced: `noProbability` is literal `true`, and there is no
`probability`, `confidence`, `score`, `risk`, `verdict`, `rank`, `winner`,
`rating` or `severity` field.

## Merge order is reported, not reordered

Two branches claiming the same `mergeOrder` produce a `mergeOrderClashes`
entry. Two workers on the **same** branch at the same position do **not** —
that is one branch, not a clash.

## Bounds

- Composes with `TouchEstimate` (consumed) and `ChangeImpactGraph`
  (`REQ-p20-change-impact`), without merging ownership with either.
- No store, registry, scheduler or service surface; no reimplementation of
  reactive serialization.
- Deterministic: pairs ordered by worker id then kind, from scrambled input.
- No name-similarity inference: dependency edges come only from the supplied
  graph.
- Caller-supplied inputs only; no clock, no filesystem, no network.

## A forecast is not a proof

This predicts from **estimates**, before execution. It does not claim a
collision will occur, and the absence of a prediction is not a claim that
none will. Only the reactive sync conflict is an observation of reality.

## Source honesty

The registered source is a `RESEARCH_NOTE` reference (*"spine-branch/worker
research"*). **No primary source document exists in this repository**, so no
citation is claimed. `RESEARCH_NOTE != CITATION`.

## Release effect

**NONE.** No release gate is re-scored; public release remains
`NOT YET RELEASE-PROVEN`, scope `UNDEFINED`, `REQ-p31-release-scope`
`OWNER_GATED`.

Tests: `src/workers/collisionPrediction.test.ts` (23 tests).
