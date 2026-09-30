# Phase B — the IDE as a Genesis integration harness

Date: 2026-09-30
State: TESTED / INTEGRATED (minimum harness)
Owner: IDE-Workspace, with Agent-Bridge fixes in the canonical owning layer

This records what the minimum harness audit found, what was built because of
it, and the three defects the attempt exposed in Agent Bridge. It is a record
of measured reality, not of intent.

## The target loop

    user -> IDE -> Genesis -> capability selection -> P25 authorization
         -> Agent Bridge -> bounded action -> world-state readback
         -> Genesis -> IDE-visible task state / evidence

The IDE must be able to host, observe, control and evaluate that loop. It does
not need to be feature-complete to do so, and it must not become the owner of
anything the loop touches.

## Surface classification (from code, not docs)

| Surface | State | Evidence in the code |
| --- | --- | --- |
| Agent Bridge connectivity | IMPLEMENTED + TESTED | `bridge.ts` `fetchBridgeStatus` polls `/health`, `/v1/runtime`, `/v1/models` |
| Project / workspace state | IMPLEMENTED | `bridge.ts` workspace file CRUD, search, git; `FileExplorer`, `CodeEditor` |
| Terminal / process surface | IMPLEMENTED | `bridge.ts` terminal create/exec/cancel; `Terminal.tsx` |
| Model / runtime selection | IMPLEMENTED | `ModelCenter.tsx` |
| Read-only runtime inspection | IMPLEMENTED + TESTED | `inspection.ts` sessions + events; `REQ-runtime-inspection` |
| Task / activity state | PARTIAL | `/v1/runtime` task list only; no session/task API |
| Capability / action events | PARTIAL | events fetched for inspection, not tied to a submitted task |
| Worker visibility | PARTIAL | `/v1/runtime.workers` rendered; lifecycle control is Genesis-owned, not here |
| Artifact / evidence views | MISSING | no manifest / scorecard / export / timeline in the browser client |
| Checkpoint / resume | MISSING | present in the Python facade only |
| **P25 approval surface** | **MISSING** | approvals were rendered from `/v1/runtime` as anonymous `approval-0`, `approval-1` rows with no id and no decision control |
| **Task submission** | **MISSING** | no `/v1/sessions`, `/tasks`, `/approvals` or `/export` call existed in the TypeScript client |
| **Effect truth** | **MISSING** | the status bar's `verification` field was a hardcoded `idle` |

Two of these are the seam the harness cannot exist without: the IDE could
*display* an authority question and could never *answer* one, and it could not
start a task to raise one.

## What was built

`workspace/app/src/genesisBridge.ts` — the session / task / approval / effect
surface over the Bridge's documented `/v1` API. No policy logic, no authority
decisions, no execution. Parsers are tolerant and never inventive: an unknown
shape becomes an honest error, and a missing `effect_achieved` reads as `false`
so an unexpected payload can never be read as success.

`workspace/app/src/components/GenesisTaskBar.tsx` — the human-in-the-loop
surface. Two properties are enforced in the UI because they are what a human
would otherwise be misled by:

- a run whose actions were all denied renders as **blocked**, even when the
  Bridge status is `COMPLETED`, because that is what happened;
- approve / deny controls appear **only** when the session reports a decision
  channel, so the IDE never offers a human a decision the runtime would refuse.

`workspace/integration/bridge_service.py` — `start_injected()` serves the real
Bridge service with a scripted model, so transport, approval, policy, executor
and sandbox are all real while model behaviour cannot make the proof flaky. The
Agent Bridge repository is not modified.

## Three defects the attempt exposed (fixed in the owning layer)

These were found by trying to run the loop, not by reading the code. Each is
recorded against `REQ-bridge-gate-compat` and proved by mutation.

**D1 — a served session could never ask a human.**
`AgentRuntime.create_session` hard-coded `non_interactive=True`, so
`RuntimeApproval` was never installed and `/v1/sessions/{id}/status` never
reported a pending approval. An `ASK_*` session did not ask: every action
needing a decision was silently denied while a client polled an approval list
that stayed empty. The channel is now opt-in (`RuntimeConfig.external_approvals`
plus a per-session `interactive` flag) and is **refused with 403** when the
runtime switch is off, so authority is never widened silently.

**D2 — a denied run was reported as a success.**
A run whose every mutation was denied ended `COMPLETED` with a positive reviewer
verdict. The workspace had no file, the human was never asked, and a caller
rendering "done" showed a green task. `build_task_result` now derives
`effect_achieved`, `denied_actions` and `blocked` from the execution journal and
the recorded authority decisions. `COMPLETED` still means the run ended; these
say what it did.

**D3 — the supervised modes could not execute anything.**
`ASK_RISKY` / `ASK_ALL_WRITES` / `REQUIRE_APPROVAL` carry read/list grants only,
on the documented theory that "the approval verdict IS the authorization" — but
the executor's independent default-deny gate had no grant to match, so an
approved write was still refused as `POLICY_DENIED`. The most supervised modes
were the least functional, and the failure was buried in history. The approval
verdict is now materialized as a narrow single-action grant for exactly the
approved resource, before the same policy evaluation runs, and revoked as soon
as the dispatch returns. Globs, workspace escapes and absolute or
already-namespaced references are refused, so one approval can never become a
standing or broader capability.

A fourth, smaller defect was fixed alongside: `Executor` gated only the first
resource an action touches, so an approved `move`/`copy` could carry an
unchecked destination.

## Evidence

| Where | What it proves |
| --- | --- |
| `Agent-Bridge/tests/test_external_approvals.py` (25) | approve / deny / cancel / bad decision / token, over real HTTP, including that an approval leaves no standing grant |
| `Agent-Bridge/tests/test_approved_grant_mutations.py` (8 mutations) | each property above turns the suite red when broken — including one gap the first draft of these tests missed |
| `IDE-Workspace/workspace/integration/tests/test_bridge_vertical_slice.py` (7) | the whole loop over real HTTP: approve -> act -> world-state readback -> evidence; deny -> no effect and a blocked outcome; cancel; no channel -> refused |
| `IDE-Workspace/workspace/app/src/genesisBridge.test.ts` (22) | the client speaks the documented API and never invents state |
| `IDE-Workspace/workspace/app/src/components/GenesisTaskBar.test.tsx` (10) | the UI's two honesty properties |
| `Aetherius-OS/docs/workspace-hygiene.test.ts` (13) | the Projects folder holds projects and nothing else |

Gates at the time of writing: Agent-Bridge `pytest` 1280 passed / 1 skipped,
`unittest discover` 1271 OK (1 skipped); IDE `vitest` 80 passed, integration
`pytest` 8 passed, `tsc --noEmit` clean, `vite build` clean.

## What is still not proven

- Genesis is not yet in this loop. The harness hosts a session and a task; the
  identity, Reflex, memory and capability-selection owners have not been wired
  through it, and no Genesis-in-IDE scenario has been run.
- Worker lifecycle (startup, heartbeat, timeout, crash, cancellation, result
  reconciliation, cleanup) is unproven and remains Genesis/execution-owned.
- The live path against the real local model is covered separately by
  `test_bridge_live_loopback.py`; the deterministic path here proves the
  architecture, not model quality.
- The IDE is still not release-qualified, and this record is not a readiness
  claim.
