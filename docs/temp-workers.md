# Temporary Supervised Workers (REQ-parallel-temp-workers, P20)

Parallel agents as temporary supervised workers under one Genesis — never
permanent personalities. Reference: Saraev parallel/sub-agent patterns
(STUDY_ONLY).

## Contract (`src/genesis/workers.ts`)

`WorkerPool` builds on the P22 worker-separation contract (`relateWorker`:
distinct id, supervised-by Genesis, task scope) and adds supervision:

- **Bounded parallelism**: `maxActive` ACTIVE workers; spawning beyond the
  bound fails explicitly (no unbounded fan-out).
- **Task binding**: every worker carries its `taskId` and capability scope
  (scope entries must be non-empty strings).
- **Terminal retirement**: `retire(id, reason)` ends the worker; retiring
  twice or retiring unknown/expiry states fails. A retired id never
  reactivates — a new task spawns a new id. Retiring frees the parallel
  slot without reviving the worker.
- **Lease expiry**: optional `ttlMs` per spawn; `reap(now)` expires
  overdue ACTIVE workers (state EXPIRED, reason recorded), leaves the rest.
- **Genesis separation**: worker ids can never equal the Genesis identity
  (enforced by `relateWorker` at spawn).

Tests: `src/genesis/workers.test.ts` (6 tests: spawn/bound, terminal
retirement, bad input, lease reap, Genesis separation).
