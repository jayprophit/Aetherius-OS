# Benchmark Freshness and Saturation Policy (REQ-p19-benchmark-freshness, P19)

A **lifecycle policy** over dataset versions: freshness, saturation, and
version deprecation. Implementation: `src/eval/benchmarkFreshness.ts`.

The registered requirement is the scope authority:

> Version/date/freshness/saturation tracking with dataset version
> deprecation for benchmarks; timestamps exist, lifecycle policy does not.

That last clause is the gap, precisely.

## What already existed, and what did not

| Already present | Missing |
| --- | --- |
| `BenchmarkRecord.timestamp` (epoch ms) | any freshness rule |
| `DatasetRegistry` keyed `<id>@<version>` | any saturation rule |
| `dataset?: string` on records | any deprecation mechanism |

A survey of `src/` found **zero** freshness, deprecation or saturation code.
The only `ttlMs` fields are in `src/genesis/workers.ts` (worker leases) and
`src/placement/placement.ts` (placement leases) — unrelated to benchmark age,
and neither reused nor conflated.

```
TIMESTAMP EXISTS != FRESHNESS POLICY EXISTS
```

## Version identity, reused

`datasetVersionRef(id, version)` returns `<id>@<version>`, the existing
`DatasetRegistry` key convention. `version` must be strict `x.y.z`:
`DATASET NAME != DATASET VERSION`.

A record is attributed to a version **only** when its `dataset` field is the
exact `<id>@<version>` ref. `BenchmarkRecord.dataset` is optional free text,
so a bare name like `"gsm8k"` attributes **nothing** rather than being
guessed into a version. A test asserts exactly that.

## Freshness

| State | Meaning |
| --- | --- |
| `FRESH` | newest observation within the aging window |
| `AGING` | past `agingMs`, within `maxAgeMs` |
| `STALE` | past `maxAgeMs` |
| `FRESHNESS_UNKNOWN` | **no usable observation timestamp** |

Two rules matter most:

- **No observation → `FRESHNESS_UNKNOWN`, never `FRESH`.** Treating
  unmeasured as fresh would silently qualify a benchmark nobody has run.
  `UNKNOWN != FRESH`, and `UNKNOWN != STALE`.
- **A future timestamp → `FRESHNESS_UNKNOWN`.** An observation dated later
  than the supplied `now` is not credible evidence of freshness, so it is
  unknown rather than maximally fresh.

`nowMs` is **caller-supplied**; this module never calls a clock. An
incoherent policy (where `agingMs >= maxAgeMs`, making `AGING`
unreachable, or `approachingObservations >= saturationObservations`) is
rejected rather than silently normalised.

## Saturation is a count, not a quality score

`SATURATION` is driven by a **real count of recorded observations** of that
exact version — never an estimate, never a score.

| State | Meaning |
| --- | --- |
| `UNSATURATED` / `APPROACHING_SATURATION` / `SATURATED` | by observation count |
| `SATURATION_UNKNOWN` | no observations — **not** zero-saturated |

```
SATURATION          != QUALITY
REPEATED MEASUREMENT != ADDED INFORMATION
```

The assessment has **no** `score`, `quality`, `accuracy`, `grade`, `value`
or `mean` field. A saturated benchmark is not a bad benchmark; it is one
measured often enough that further measurement adds little. Freshness and
saturation are also fully independent — an old, heavily-measured version
reports `STALE` and `SATURATED` separately.

## Deprecation: append-only, never deletes

`deprecateDatasetVersion` records a deprecation with a reason and an optional
replacement ref:

| Situation | Outcome |
| --- | --- |
| same version, identical content | `identical` |
| same version, different content | `conflict` — history is immutable |
| different version | `recorded`, both retained |

```
DEPRECATED  != DELETED
DEPRECATION != INVALIDATION OF HISTORY
```

A deprecated version **blocks only new evaluation**
(`newEvaluationBlocked: true`). It never removes a dataset, never deletes a
record, and never invalidates a historical result — the deprecation record is
retained verbatim on the assessment, so *why* a version was retired stays
visible.

Freshness and saturation **never** block on their own; they qualify. Only
`DEPRECATED` sets `newEvaluationBlocked`, so the policy cannot quietly
invalidate a version for being old or well-measured.

There is no `VALID` / `INVALID` / `OK` / `TRUSTED` lifecycle state: a
version is not "good", it is active or deprecated.

## Boundaries

- **No deletion surface.** No `delete`, `remove`, `purge`, `drop`,
  `invalidate`, `revoke` or `expire` export.
- **No second registry or store.** Reuses `DatasetRegistry`'s identity
  convention and reads `BenchmarkRecord` as-is; no parallel benchmark store.
- **No clock abstraction.** Time is always supplied by the caller.
- **Not a scorer.** No metric computation; it does not touch
  `runEvaluation` or any `Scorer`.
- **Not clean-room.** `REQ-p20-clean-room` remains BLOCKED and untouched.

## Relationship to the contamination guard

The two sibling policies in `src/eval/` compose without overlap:

- `contamination.ts` answers *"was this subject exposed to this benchmark?"*
- `benchmarkFreshness.ts` answers *"is this dataset version still current,
  and is further measurement informative?"*

Neither rewrites the other, and the causal harness is untouched.

## Source honesty

The registered source is a `RESEARCH_NOTE` reference (*"benchmark
research"*). **No primary source document exists in this repository**, so no
citation is claimed. `RESEARCH_NOTE != CITATION`.

## Release effect

**NONE.** No release gate is re-scored; public release remains
`NOT YET RELEASE-PROVEN`, scope `UNDEFINED`, `REQ-p31-release-scope`
`OWNER_GATED`.

Tests: `src/eval/benchmarkFreshness.test.ts` (26 tests).
