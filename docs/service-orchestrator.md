# REQ-p24-service-orchestrator — OS Service Lifecycle Orchestration (planning/state, not actuation)

Status: PROVEN / COMPLETE. Owner: aetherius-os.

## Registered scope

Service install/configure/start/stop/restart/health/dependency-ordering/
recovery/registration lifecycle; P19 workflow is task orchestration, not OS
service orchestration.

Prior state: `src/apps/registry.ts` (canonical P10 app registry with
entrypoints/capabilities/permissions/healthEndpoints, no lifecycle), P22
project orchestrator (TaskGraph/WorkerRegistry/temporary workers), P30
placement, P25 authority. No shell executor, process manager, or sandbox
runner exists anywhere in src. No service lifecycle module existed.

## What was built

`src/services/serviceOrchestrator.ts` — `declareService()`,
`planStartOrder()`, `planStopOrder()`, `transitionState()`,
`effectiveStatus()`. `src/services/serviceOrchestrator.test.ts` — 32 tests.
(A prior session's banned-word tests in changeImpact/completionBenchmark/
traceCorrelation scope only their own modules' exports, so a new
`src/services/` module does not trip them.)

## Binding distinctions (tested)

- AUDITOR != ACTUATOR; ORCHESTRATION PLAN != EXECUTION — lifecycle stages are
  evidence-gated recorded transitions; no child_process, shell, network, or
  timers anywhere. COMMAND ACCEPTED != EFFECT VERIFIED.
- SERVICE ORCHESTRATION != PROJECT ORCHESTRATION — no TaskGraph,
  WorkerRegistry, scheduling, or worker lifecycle. SERVICE != TASK; SERVICE
  INSTANCE != WORKER INSTANCE; SERVICE != TEMPORARY WORKER.
- ORCHESTRATOR != REGISTRY — apps registry stays canonical; definitions
  reference (`apps:`/`toolchain:`/`repo:`) rather than copy; the definition
  set is caller-constructed, in-memory, never mutated.
- A DEPENDS ON B != B DEPENDS ON A — direction load-bearing, tested both ways.
- Cycles rejected with the cycle path as evidence (A→B→C→A tested).
- Unknown dependencies exclude dependents explicitly (blocked[] with reason),
  never silently dropped.
- STOP ORDER != START ORDER — reverse topological shutdown.
- PROCESS RUNNING != SERVICE READY; LIVENESS != READINESS — RUNNING requires
  effectObserved; READY requires readinessObserved.
- BLOCKED != FAILED — dependency failure derives a BLOCKED overlay naming
  blockers; stored state untouched; the dependent is never blamed.
- DEPENDENCY FAILURE != DEPENDENT SERVICE FAILURE (tested: dependent of a
  FAILED service is BLOCKED, with no state entry created for it).
- FAILURE != PERMISSION FOR INFINITE RETRY — maxRestarts required on every
  definition; exhaustion reported, never bypassed; zero budget means no
  recovery transition.
- NEW DEFINITION AVAILABLE != INSTANCE UPGRADED — version mismatch across a
  transition is rejected.
- SERVICE DISPLAY NAME != SERVICE ID; SERVICE PROFILE/DEFINITION != SERVICE
  INSTANCE.
- HEALTHY != AUTHORIZED; SERVICE READY != AUTHORIZED TO USE SERVICE —
  authGrantRef cites a P25 decision id only.
- SECRET REFERENCE != SECRET VALUE (values rejected by key name).
- LOCAL SERVICE ORCHESTRATION != CLUSTER ORCHESTRATION — no placement,
  discovery, upgrades, migrations, backoff, or watchdogs invented.
- No optional-dependency semantics (requirement does not mention them).
- IN-MEMORY STATE != DURABLE SERVICE STATE; timestamps caller-supplied with
  identity preserved (requested/started/ready/stopped/observed never merged).
- Validation precedence: authority/secret/persona violations before generic
  unknown-field errors. Deterministic canonical ordering; scrambled-input
  equality.

## Gates

- Targeted: 32/32 (two initial failures were wrong test paths — missing defs
  in chained calls, INSTALLED→FAILED non-edge — tests fixed, not code).
- Related 635/635 (34 files: services/apps/genesis/toolchain/programme/
  state/workflows/scheduler). Typecheck clean. Lint NOT_APPLICABLE.
- Full suite 1222/1222 CLEAN PASS (71 files, zero timeouts).
- Build clean. Registry validation 243/243.
- Requirement mutation: id-anchored surgical edit, exactly 3 lines, JSON
  re-parsed OK (107 requirements, exactly 1 match), no other ID touched.
- Selector retargeted; NEXT_EXECUTABLE_TODO = REQ-p25-reputation (P25).
