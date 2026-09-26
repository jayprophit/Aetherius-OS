# Context Position Robustness Scorer (REQ-p19-context-position, P19)

A **position-sensitivity scorer** and a **harness over `BenchmarkStore`**,
for lost-in-the-middle evaluation. Implementation:
`src/eval/contextPosition.ts`.

The registered requirement is the scope authority:

> Lost-in-the-middle evaluation: position-sensitivity scorer + harness over
> BenchmarkStore + compiler; keep-recent/truncate-middle heuristics are
> unmeasured.

## What the scorer measures

Given observed per-position results, `scorePositionSensitivity` reports:

| Field | Meaning |
| --- | --- |
| `perPosition` | the observations, sorted by position |
| `bestPosition` / `worstPosition` | with ties broken on the **lowest** position, so the order is total |
| `spread` | `bestScore - worstScore` — an observed spread, never an estimate |
| `edgeMean` / `middleMean` | first/last thirds vs the remainder |
| `middleDeficit` | `edgeMean - middleMean`; positive means the middle underperformed |
| `samples` | the real observation count |

Edge and middle regions are derived **from the data**, not from a
caller-supplied boundary, so the split cannot be tuned to manufacture a
deficit. At least three positions are required, because a middle cannot be
defined from one or two — reported as `min-positions` rather than silently
degrading.

```
POSITION SENSITIVITY != MODEL QUALITY
HIGHER SPREAD        != BETTER MODEL
MIDDLE DEFICIT       != CAUSAL EXPLANATION
```

A middle deficit is a **description of an observed pattern**, not an
explanation of why it happened. The profile has no `cause` or `explanation`
field, and no `winner`/`quality`/`grade`/`verdict`/`ranking`/`composite` field
at all.

## The heuristics are UNMEASURED, and stay that way

The requirement states that `keep-recent` and `truncate-middle` are
unmeasured. `declareStrategy` enforces that asymmetry:

- declaring `MEASURED` **requires** a real `measuredProfile`
- attaching a profile to an `UNMEASURED` strategy is **rejected**

So a strategy name can never be mistaken for evidence of behaviour, and
nothing here asserts that either heuristic helps.

```
UNMEASURED HEURISTIC != GOOD HEURISTIC
HEURISTIC LABEL      != MEASURED BEHAVIOUR
```

## The compiler does not exist

`REQ-p26-context-compiler` is registered and `READY` in
`src/programme/requirements.json`, but a search for `compileContext` /
`contextCompiler` across `src/` returns **only the requirement record** — no
compiler module exists. This module therefore treats a compiler as an
optional external reference and **never pretends to have compiled anything**.
No export name contains `compile`, `compiler`, `assemble`, `prompt` or
`template`.

```
CONTEXT COMPILER != AVAILABLE
```

## The shared metric vocabulary is not widened

`VALID_METRICS` in `src/providers/benchmarks.ts` holds nine
provider-benchmark metrics, none of them position sensitivity. Rather than
add a tenth for one study, results are read and recorded under the existing
**`context_handling`** metric, with the position encoded in the task name
(`<task>@pos-<n>`, optionally `<task>#<strategy>@pos-<n>`).

`BenchmarkRecord` has no position field, so the harness reads the position
from the task name the recorder already used and the score from the recorded
`value`. A record whose task name carries no position is **skipped with a
reason**, never guessed at; a `value` outside `[0,1]` is **skipped, not
clamped**.

## Thin stores report absence, not zero

If the store holds fewer than the minimum usable samples, the harness report
says `measured: false` and carries **no profile at all** — it does not
fabricate a zero-sensitivity result.

```
NO SAMPLES != ZERO SENSITIVITY
```

Models are isolated: one model's records never become another's samples.

## The dataset reuses the existing registry

`buildPositionDataset` produces a `Dataset` compatible with the existing
`DatasetRegistry` — same `id@version` identity, same `DatasetItem` shape, and
a split drawn from the reused `DATASET_SPLITS` vocabulary. It defaults to
`held-out`, because a robustness study is only meaningful on data the system
was not built against. No second registry, no new partition vocabulary.

## Boundaries

- **Not a scorer substitute.** It computes position statistics from already
  recorded results; it does not replace any `Scorer` and does not touch
  `runEvaluation`.
- **No second store.** `BenchmarkStore` is read via its own `query`; nothing
  is cached, mirrored, written or persisted here. No export contains `store`,
  `registry`, `graph`, `save`, `persist` or `record`.
- **No clock.** Timestamps come from the stored records; the report has no
  `generatedAt` or `now` field.
- **No ranking.** No export ranks, wins or combines.
- **Not clean-room.** `REQ-p20-clean-room` remains BLOCKED and untouched.

## Sibling P19 policies

Three evaluation-integrity policies now sit side by side in `src/eval/`, each
answering a different question and none rewriting another:

| Module | Question |
| --- | --- |
| `contamination.ts` | was this subject exposed to this benchmark? |
| `benchmarkFreshness.ts` | is this dataset version current, and is more measurement informative? |
| `contextPosition.ts` | does measured correctness depend on where the evidence sits? |

## Source honesty

The registered source is a `RESEARCH_NOTE` reference (*"context robustness
research"*). **No primary source document exists in this repository**, so no
citation is claimed and no paper result is reproduced.
`RESEARCH_NOTE != CITATION`.

## Release effect

**NONE.** No release gate is re-scored; public release remains
`NOT YET RELEASE-PROVEN`, scope `UNDEFINED`, `REQ-p31-release-scope`
`OWNER_GATED`.

Tests: `src/eval/contextPosition.test.ts` (31 tests).
