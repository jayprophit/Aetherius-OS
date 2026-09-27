# REQ-p23-work-monitoring — Work Monitoring Fabric (subscribe / stream / alerts / thresholds)

Status: PROVEN / COMPLETE. Owner: ide.

## Registered scope

Continuous monitoring composing summarize/inspect/observer over P27 transport:
subscribe, progress stream, alerts, thresholds; snapshots and append-only logs
exist, streaming/alerting join absent.

Prior state: `WorkflowRuntime.summarize()` (P19), `Scheduler.inspect()`, and
`RealtimeTransport` over P27 (loopback live + declared-unavailable websocket)
all existed and tested. The streaming/alerting join did not.

## What was built

`src/monitoring/workMonitoring.ts` — `subscribe()`, `streamProgress()`,
`evaluateAlerts()`, `composeWorkView()`. `src/monitoring/workMonitoring.test.ts`
— 23 tests. Precedent followed: ide-owned `REQ-runtime-inspection` already
lives in Aetherius-OS, so this lives here too (not in the Python-scripts
IDE-Workspace repo).

## Binding distinctions (tested)

- OBSERVE ORCHESTRATOR != BECOME ORCHESTRATOR — composes summarize/inspect/
  transport; duplicates none of them.
- MONITORING VIEW != CANONICAL STATE STORE — stateless; the caller holds the
  subscription; no store, daemon, polling loop, timer, or watcher.
- MONITORING != EXECUTION / ORCHESTRATION / AUTHORIZATION / SCHEDULING —
  execution-shaped keys (spawn/terminate/schedule/dispatch/poll/timer/daemon)
  rejected by name; no completion verdict.
- NOT RUNNING != COMPLETE; NO NEW EVENTS != COMPLETE — empty streams return
  no frames, never a completion inference.
- NOT OBSERVED != FALSE; UNKNOWN != ZERO — missing summaries/inspections
  surface as UNKNOWN and never fire thresholds.
- NO INVENTED PROGRESS / ETA / TELEMETRY — closed threshold fields grounded
  in what summarize()/inspect() return; telemetry-shaped keys rejected before
  shape errors; frames never dump full payloads (secret-safe projection).
- EVENT_AT != OBSERVED_AT — both carried; observedAt caller-supplied, never
  defaulted; no freshness thresholds invented.
- Cross-type threshold comparison never coerces (string "1" does not match
  number 1).
- Channel allowlists fail closed at subscribe time.
- Validation precedence: authority/execution/persona/secret/telemetry
  violations before generic unknown-field errors.
- Deterministic canonical ordering; scrambled-input equality; no caller
  mutation.
