# Change Impact Graph (REQ-p20-change-impact, P20)

A **dependency-graph join** with transitive impact and history weighting over
`TouchEstimate` inputs. Implementation: `src/programme/changeImpact.ts`.

The registered requirement is the scope authority:

> Dependency-graph join with transitive impact and history weighting over
> TouchEstimate inputs; consumes touch.ts, never re-implements estimation.

So this is a **join** — not an estimator, and not a source-code parser. Given
a dependency graph and a `TouchEstimate`, it answers: *which other paths are
affected, how directly, and how often have they changed before?*

## touch.ts is consumed, never re-implemented

`TouchEstimate` is imported as a type. Its `paths` become the changed-path
candidates, and its own `unknown[]` / `invalid[]` are carried into the result
so the estimator's uncertainty is not silently dropped by the join.
`estimateTouchSet` is **not** called, wrapped or reimplemented — asserted by
test.

```
TOUCH PREDICTION != CODE DEPENDENCY
CHANGE IMPACT   != EXPECTED TOUCH SET
CHANGE IMPACT   != TEST IMPACT
CHANGE IMPACT   != EVIDENCE GRAPH
CHANGE IMPACT   != SYSTEM DEPENDENCY GRAPH
CHANGE IMPACT   != REVIEW VERDICT
```

## Direction is explicit

An edge means **`from` imports `to`**. Impact therefore traverses
**backwards** from a changed path to its importers:

```
IF A IMPORTS B, A CHANGE TO B MAY AFFECT A
A CHANGE TO A DOES NOT AUTOMATICALLY AFFECT B
```

Both directions are asserted, so a reversed traversal cannot pass unnoticed.

## No name-similarity inference — with a dedicated regression

An edge exists only when a caller supplies **explicit structural evidence**.
Filenames, symbol names, shared prefixes, shared directories and concept
overlap **never** create an edge.

The regression test is explicit: `src/user.ts`, `src/userService.ts` and
`src/userServiceHelper.ts` with **no** structural edge produce **no** impact
relation between them; adding a real declared import produces exactly one; and
the similarly-named helper stays unrelated even after that import exists. Two
files sharing a directory are likewise unrelated.

```
SIMILARITY      != DEPENDENCY
SAME NAME       != DEPENDENCY
SAME DIRECTORY  != DEPENDENCY
IMPORTED BY     != NECESSARILY BEHAVIOURALLY AFFECTED
```

## Direct is not transitive

`depth: 0` is the changed path itself, `depth: 1` is a **direct** importer,
and deeper nodes are **transitive** with `via` naming the immediate
dependency.

```
DIRECT IMPACT != TRANSITIVE IMPACT
```

## Cycle-safe and bounded

Traversal is breadth-first with a visited set **seeded with the changed
paths**, so a cycle routing back to a changed path cannot re-add it.
Verified on a real `A → B → C → A` cycle where every node appears exactly
once. `maxDepth` is explicit and must be a positive integer (default 12).

## History weighting is not a risk score

History is **optional** caller-supplied change counts.

- Absent history → `historyState: "UNKNOWN"`, `changeCount: null`,
  `weight: null`. **Never zero** — zero changes is a measured fact and absent
  history is not.
- A path missing from supplied history is also `UNKNOWN`.
- Counts require a provenance `historySource` and reject negatives.

`weight` exists for one reason: so a frequently-changed consumer is not buried
below a never-touched one. `noVerdict` is literal `true`, and there is no
`risk`, `quality`, `verdict`, `severity` or `rating` field.

## Unknown impact stays unknown

A changed path absent from the graph is reported in `unresolved[]` with the
reason that not-found is **not** proven isolation, and is not listed as
impacted. Deleted and renamed paths work because **impact never checks
current file existence**.

```
NOT FOUND IN GRAPH != PROVEN ISOLATED
UNKNOWN IMPACT     != IRRELEVANT
```

## Edges must be explainable

Every edge carries a **reason**, so a reviewer can answer *why* a path is
impacted. Opaque "related" is not emitted. Trivial self-loops are rejected as
resolution artifacts, and edges are deduplicated by canonical identity while a
genuinely distinct **relation type** is preserved — four precise classes only:
`IMPORTS`, `RE_EXPORTS`, `REFERENCES`, `DECLARED`.

## Boundaries

- **Path safety reuses** the exported `assertSafePath` from
  `src/runners/sync.ts`; no second private traversal implementation was added.
- **In-memory and caller-constructed.** No store, registry, database, cache,
  server or service surface.
- **Construction stays separate from querying**: `buildChangeImpactGraph` and
  `queryChangeImpact`.
- **No dependency on** `EvidenceGraph`, `buildReviewContextPack` or
  `compareHarness` — all asserted by test.
- `ReviewContextPack`'s impact leg, `EvidenceGraph`, Agent-Bridge
  `TestImpact` and `registry/depgraph.json` semantics are all **unchanged** by
  this unit. Wiring the pack to this graph, if wanted, belongs to a separately
  selected integration requirement.
- A static graph is not a complete runtime causal graph: reflection, runtime
  loading, generated paths, environment config and plugin discovery are all out
  of scope and are not claimed.

## Source honesty

The registered source is a `RESEARCH_NOTE` reference (*"review research"*).
**No primary source document exists in this repository**, so no citation is
claimed. `RESEARCH_NOTE != CITATION`.

## Release effect

**NONE.** No release gate is re-scored; public release remains
`NOT YET RELEASE-PROVEN`, scope `UNDEFINED`, `REQ-p31-release-scope`
`OWNER_GATED`.

Tests: `src/programme/changeImpact.test.ts` (33 tests).
