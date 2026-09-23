# Sandbox Runners (REQ-p21-sandbox-runners, P20)

Sandboxed runner contracts with workspace sync. Reference: CrabBox
runners/sync v0.64.0 (MIT, STUDY_ONLY) — mechanics only.

## What is implemented (`src/runners/`)

- `types.ts`: `Runner` interface (provision/sync/run/teardown),
  `RunnerKind` (local-directory/ssh/container), `RunSpec` (argv only, never
  shell strings), `RunRecord` with isolation labels (network
  none/restricted/open; filesystem temp-only/workspace-ro/workspace-rw),
  typed `RunnerError` codes. No adversarial-tenant assumption: runners are
  single-owner tools.
- `lifecycle.ts`: pure state machine
  DEFINED→PROVISIONING→READY→RUNNING→(SUCCEEDED|FAILED|TIMED_OUT)→
  TEARDOWN→TORN_DOWN. Only declared transitions; terminal states owe
  teardown (`teardownOwed`/`requireTornDown`) — no orphan runners.
- `sync.ts`: workspace diff-sync on explicit file maps: `manifestOf`
  (path→sha256), `diffManifests` (added/modified/deleted), `applySync`
  with conflict policies (error/incoming-wins/existing-wins). Paths
  escaping the workspace root rejected.
- `backends.ts`: `LocalDirectoryRunner` (honest-sim: proves the contract
  end to end, every record labeled `simulated:true`, outputs replayed only
  from declared `spec.simulatedResult`, temp-only isolation enforced, no
  child processes spawned) plus `SshRunner`/`ContainerRunner` as
  declared-but-unavailable (every op throws `RUNNER_UNAVAILABLE` with the
  reason instead of pretending).

Tests: `src/runners/runners.test.ts` (9 tests).

## Explicitly deferred

Real SSH/container backends: no container engine on this workstation
(Docker Desktop closed) and no registered SSH backend. They arrive as
owner-authorized runtime work, not silent simulation.
