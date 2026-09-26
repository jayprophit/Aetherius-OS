# Spine-branch worker execution

`REQ-p20-spine-branch` — P20, owner `aetherius-os`, status PROVEN.

Implementation: `src/workers/spineBranch.ts`
Tests: `src/workers/spineBranch.test.ts` (34)

## Registered scope

The registry is the scope authority:

> Canonical mutable spine state with branch worker isolates and typed
> structured-output merge-back; no naive VM-state merge; branch workers stay
> temporary.

That is three parts, and the two clauses after the semicolon are constraints on
how the third part works:

1. a **canonical, mutable** spine state,
2. **branch worker isolates** that work without touching it,
3. **typed structured-output merge-back**.

## The naive merge is what this refuses

Dumping a worker's process or VM state back over the spine would silently
overwrite whatever happened on the spine while the branch ran, would carry
unserialisable runtime handles, and would make the spine's history
unreproducible. A branch may only hand back a **declared, typed, structured**
output. `vmState`, `memory`, `heap`, `stack`, `registers`, `processState`,
`coreDump` and friends are rejected by name, at the top level and inside a
typed write.

```
BRANCH OUTPUT != VM STATE
BRANCH OUTPUT != PROCESS MEMORY DUMP
STRUCTURED OUTPUT != NAIVE STATE MERGE
```

Unknown output fields are rejected rather than discarded. A silently dropped
field is a silently changed meaning, and that is exactly how a naive merge
sneaks in through the back door.

## Merge-back is not last-write-wins

A branch is opened against a spine revision. If the spine moved on, the merge
is reported as a `CONFLICT` with both sides named, and the spine is left
**byte-for-byte unchanged, revision included**. This function never picks a
winner; the caller decides what a conflict means. Conflicts are also scoped per
slice, so a branch that only reads `TASK_QUEUE` is not blocked by unrelated
`NOTES` churn.

```
LAST WRITE WINS != MERGE-BACK
```

Merge outcomes are exactly `MERGED`, `CONFLICT`, `REJECTED`. There is no
`OVERWRITE`.

## The spine is canonical and mutable, and a branch cannot rewrite it

The spine carries a monotonic `revision` plus a per-slice `revision`, so a
conflict can be scoped to what actually moved. Declared slice kinds are
`NOTES`, `ARTIFACT_REFS` and `TASK_QUEUE`.

A branch **appends**. It never truncates and never rewrites a slice, so a branch
cannot delete spine history by omission. An empty write set is a no-op, not a
silent revision bump.

A branch is handed a revision to merge against, never the spine itself, and the
observed slice revisions are copied so mutating the handle cannot reach the
caller's arrays. The spine passed in is never mutated in place.

## Branch workers stay temporary

A branch is an execution, not an identity. It is opened, may produce output
once, and is closed. Closing returns no resident worker, no handle and no
standing authority — the result is `residentWorker: false, authority: "NONE"`,
and the closed record has no merge, deploy, approve, authorize, grant, token or
credentials surface. The spine keeps only a bounded typed merge record.

```
BRANCH != WORKER IDENTITY
BRANCH != WORKER PROFILE
CLOSED BRANCH != RESIDENT WORKER
TEMPORARY BRANCH != PERMANENT WORKER
```

The branch records the `WorkerProfile` it was spawned from as a **reference**,
plus a caller-supplied instance ref for the run. The profile is never copied
into the branch, and neither ref is a permanent identity. A branch id, an
instance ref and a profile id are all distinct.

Merging the same branch twice is refused (`BRANCH_ALREADY_MERGED`).

## What a merge-back is not

```
MERGE-BACK != TASK COMPLETION
MERGE-BACK != MERGE AUTHORITY / DEPLOY AUTHORITY
MERGE-BACK != RECOVERY
MERGE-BACK != EXECUTION CHECKPOINT
```

`src/workers/collisionPrediction.ts` remains the pre-execution forecast and
`src/runners/sync.ts` `applySync` remains the reactive serialization oracle.
Neither is reimplemented, wrapped or replaced: a collision forecast is still a
forecast, and this unit merges typed output rather than predicting or
serializing files.

## Determinism and inputs

Caller-supplied merge time only — no clock, no filesystem, no network. Writes
are processed in canonical slice order, so scrambled input yields an identical
result and an identical `appliedSlices` list. The caller's spine is never
mutated.

## Defects found and fixed in this unit

1. `appliedSlices` followed the caller's write order, so two branches writing the
   same slices in a different order produced different output. Writes are now
   processed in canonical slice order — `INSERTION ORDER != CANONICAL ORDER`.

Two further failures were wrong expectations of my own, and the tests were
corrected rather than the code: a VM-state field nested in a typed write is
reported as `BRANCH_VM_STATE_REJECTED` rather than as a generic unknown key
(banned detection deliberately outranks the unknown-field check), and the
`WorkerProfile` fixture needed an explicit cast because this unit only reads
`id`.

## Gates

- `src/workers/spineBranch.test.ts` — 34/34
- related (`src/workers`, `src/analysis`, `src/programme`, `src/state`,
  `src/runners`) — 389/389
- `npm run typecheck` — clean
- `npm run build` — clean, 46 modules
- `npm run registry:validate` — clean, 243
- lint — `NOT_APPLICABLE`; no lint script and no
  eslint/biome/oxlint/tslint/stylelint/prettier config in the repository. No
  linter introduced.
- full suite — **not a clean pass**: 983 tests, 982 passed, 1 timeout,
  **0 assertion failures**, in `src/workflows/workflows.test.ts` "cycles and
  depth excess fail honestly", a pre-existing filesystem-heavy test this unit
  never touched. It passes 38/38 in isolation at 2309ms against 7467ms under
  full-suite load. Open timing item; see `native/BUILD-TODO.md`.

Source: `RESEARCH_NOTE` "spine-branch research", research addendum 2026-09-23.
`RESEARCH_NOTE != CITATION`.
