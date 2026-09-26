# Execution checkpoint envelope

`REQ-p20-execution-checkpoints` — P20, owner `aetherius-os`, status PROVEN.

Implementation: `src/programme/executionCheckpoint.ts`
Tests: `src/programme/executionCheckpoint.test.ts` (43)

## Registered scope

The registry is the scope authority:

> Typed checkpoint envelope (task/workflow/workspace-hash/branch/artifacts/
> worker/backend/pending-irreversible/evidence) over P17 envelopes; fragments
> tested, join missing.

So this unit is a **typed envelope plus the join that was missing**. The
per-system fragments already existed and were already tested: workflow
lifecycle, runner records, steward reports and cohort reviews each persist their
own typed `StateEnvelope`. `git grep -i checkpoint -- src/` returned no
checkpoint code at all, which confirms the join — not the fragments — was the
gap. No `Checkpoint2`, `Recovery2`, `WorkerState2` or `ExecutionStore2` was
created; the existing P17 contracts are extended.

The envelope is carried in a P17 `StateEnvelope` under kind
`execution.checkpoint`, so it inherits P17's integrity hash, record version,
sensitivity and provenance discipline instead of inventing a second persistence
discipline.

## What a checkpoint joins

Every field is a reference or a bounded scalar.

| Field | Meaning |
| --- | --- |
| `checkpointId` | The checkpoint's own identity. |
| `taskId` / `workflowId` | The task, and the workflow it moves through. |
| `workspace` | `{ root, hash, branch }` — referenced and hashed, never copied. |
| `artifacts` | `{ artifactId, ref }` pointers, never artifact bytes. |
| `worker` | `{ instanceId, profileId }`. |
| `backend` | `{ backendId, targetInstanceId? }`. |
| `pendingIrreversible` | Actions whose external effect cannot be undone by re-running them. |
| `evidenceRefs` | Refs into the existing `EvidenceGraph`. |
| `sequence` / `predecessorCheckpointId` | Explicit ordering within a task. |
| `capturedAt` / `provenance` | Caller-supplied capture time and origin. |

## What a checkpoint is not

A checkpoint preserves enough bounded execution state for an authorized
execution to *potentially* continue. It is not:

- `CHECKPOINT != RECOVERY PROOF` — serialization roundtrip is not recovery.
- `CHECKPOINT != RESUME AUTHORIZATION` — P25 remains the authority plane.
- `CHECKPOINT != TASK COMPLETION` — a saved checkpoint does not mark a
  deliverable complete.
- `CHECKPOINT != PROJECT / GENESIS MEMORY` — it stores no arbitrary memory.
- `CHECKPOINT != ARTIFACT LIBRARY` — it references artifacts.
- `CHECKPOINT != EXECUTION TARGET PROFILE` and
  `CHECKPOINT TARGET REF != PLACEMENT DECISION` — P30 owns placement.
- `CHECKPOINT != LEASE / HEARTBEAT / LIVENESS` — a worker can be alive with no
  checkpoint, or hold a checkpoint while no longer alive.
- `WORKER PROFILE != WORKER INSTANCE`, and
  `CHECKPOINT ID != TASK ID != WORKER ID`.

No resume, restart or recovery execution lives in this unit. The module writes
and reads a record and reports replay risk; it never continues work.

## Irreversible actions

`pendingIrreversible` is the guard against blind replay. Each entry is `NOT_STARTED`,
`CLAIMED_UNVERIFIED` or `VERIFIED_COMPLETE`. `VERIFIED_COMPLETE` requires a
`verificationRef`: a checkpoint claim is not world state. An action that may have
taken effect but has no external verification stays `CLAIMED_UNVERIFIED` and is
never rounded down to "not done" or up to "done". `assessReplayRisk` reports
`BLOCKED_UNVERIFIED_IRREVERSIBLE_ACTION` when any such action exists, and always
reports `resumeAuthorized: false`.

## Secrets and authority

Raw `password`, `apiKey`, `token`, `privateKey`, `secret`, `credential` fields are
rejected. A secret is stored as a reference only, and
`SECRET AVAILABLE != AUTHORIZED TO USE SECRET`. Direct authority claims
(`authorized`, `canExecute`, `policyBypass`, `ownerOverride`, `merge_authority`,
`resumeAuthorized`, `approval`) are rejected; an external authorization decision
belongs in a reference, not embedded in the record.

## Validation

Validation is strict, because silently discarding a field that could change
meaning is silent repair of invalid input:

- unknown fields are rejected, at the top level and inside every fragment;
- banned-field detection outranks the unknown-field check, so an authority claim
  or a raw secret is reported as itself rather than as "an extra key";
- workspace roots go through the existing `assertSafePath`, so traversal is invalid
  without a fourth copy of that validator;
- `workspace.hash` must be a lowercase hex sha256; `branch` must be a ref name;
- ids must match the id grammar; `sequence` must be a positive integer;
- timestamps must be caller-supplied ISO-8601 values that name a real instant.
  No `new Date(0)`, no wall clock, no invented default;
- duplicate artifact, evidence and action references are rejected;
- a record written by a newer schema is rejected rather than guessed at.

## Ordering, idempotence and durability

Reference arrays are canonically ordered, so two checkpoints holding the same
facts serialize identically and the P17 integrity hash means something. Order in
the caller's arrays is irrelevant and is not mutated.

Identical content at the same sequence is a no-op, not a second record. The same
identity and sequence with *different* content is a conflict and is rejected — a
checkpoint slot is not a mutable cell that silently accepts the newest claim. An
older sequence never replaces a newer one, and a checkpoint id already holding a
different record kind is refused.

Durability is stated precisely: the record is written through the P17
`FileStateStore` with its integrity hash, so it survives a process restart. That
is still **not** recovery proof — no interruption, restart, resume or continued
execution is implemented or tested here.

## Reconciliation limitation

After a real recovery, persisted checkpoint state may disagree with the actual
workspace, artifacts, external world or current requirement state. This unit does
not define reconciliation and does not silently treat the checkpoint as truth.

## Out of scope

Resume/recovery execution, cancellation-to-resumable conversion, delivery
completion, placement, and artifact-library behaviour. Cancellation state is not
present, and a checkpoint never converts a cancelled task into a resumable one.

## Defects found and fixed in this unit

1. `persistExecutionCheckpoint` overwrote the payload's `capturedAt` with the
   write time. That destroyed idempotence and falsified capture evidence. The
   write time now stamps only the envelope.
2. Banned-field detection ran *after* the unknown-field check, so an authority
   claim or raw secret was misreported as an unknown field. Banned detection now
   outranks it, at every nesting level.
3. The ISO-8601 pattern accepted `2026-13-45T99:99:99Z`. Timestamps are now
   checked against the real calendar and a real parse.

A fourth finding was a bad test fixture rather than a code defect: a secret scan
for `sk-` also matched the `sk-` inside `task-alpha`. The test now inspects
values with credential-shaped patterns instead of substring-matching words.

## Gates

- `src/programme/executionCheckpoint.test.ts` — 43/43
- related (`src/programme`, `src/state`, `src/workers`, `src/runners`) — 297/297
- `npm run typecheck` — clean
- `npm run build` — clean
- `npm run registry:validate` — clean (243, including these 43)
- lint — `NOT_APPLICABLE`; re-verified no lint script and no
  eslint/biome/oxlint/tslint/stylelint/prettier config outside
  `node_modules`/`.git`/`dist`. No linter introduced.
- full suite — **not a clean pass**: 6 timeouts, **0 assertion failures**, in
  pre-existing filesystem-heavy tests this unit never touched. See the open
  timing item in `native/BUILD-TODO.md`.

Source: `RESEARCH_NOTE` "execution research". No primary source document exists
in this repository. `RESEARCH_NOTE != CITATION`.
