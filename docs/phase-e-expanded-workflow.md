# Expanded workflow, D4, D5 — what the realistic loop exposed

Date: 2026-10-01
State: 8/8 workflow tests green; D4+D5 fixed in the canonical layer with
regression proof; full gates green on both touched repos.

## The workflow

A disposable fixture project (buggy `calc.py`, real pytest suite, import-free
sanity pin) runs inspect → plan → baseline test (real failure observed) →
approved fix → world-state verification → rerun (real pass) → completion with
manifest/journal/byte agreement. Failure insertion covers denied correction,
tampered parameters, malformed intake, delayed results, stale approvals,
service outage and repetition. The injected model can only emit a canary file
whose appearance fails everything. Harness reasoning and the human-approval
proxy are labeled as such wherever they appear.

## D4 — cross-task action aliasing (Agent Bridge 79a6ccb)

Two different directed tasks in one session minted identical action ids
(`a-<sid>-<step>-<seq>` restarted numbering per task run), so the executor's
completed-record returned the first task's result for the second task's write
and reported SUCCEEDED without effect. The expanded workflow caught it; worse,
an existing intake test had been passing vacuously through it.

Two independent fixes, proven independent by mutation (removing either alone
keeps behavior correct; the suite pins each layer separately):
- action ids embed the task id (uniqueness at the source);
- dispatch compares the recorded action fingerprint, not just the verb
  (correctness even on id reuse; legacy entries without fingerprints always
  execute — unknown provenance fails safe).
- `protocol.action_fingerprint` is now the single canonical definition shared
  by intake replay detection and executor idempotency.

Corrected alongside: the recovery test that encoded the bug (different content
under a reused id expected suppression now executes; identical resends still
dedup), and the intake correlation test that asserted success without effects
(now asserts bytes on disk).

## D5 — payload slot smuggling (same commits)

`action["path"] = resource` followed by `action.update(payload)` let
`payload.path` silently replace the validated resource: the request said
`ok.txt` (which passed strictness) while `../evil.txt` is what would
execute. Slot keys in the payload must now agree with the assigned slot or
the request is 400; identical values merge harmlessly. Command-family actions
are explicitly exempted: the resource labels the run while the command is
opaque, and the shell profile/policy/sandbox are the real gates — a first
version of this fix wrongly applied path strictness to commands and the
workflow itself caught it before commit.

## What this changes about the programme

- The five basic scenarios remain regression gates; the expanded workflow is
  now the deeper gate for execution truth.
- Idempotency semantics are explicit: identical ids plus identical effects
  replay safely; identical ids across different world states must use
  distinct ids (enforced by tagging in the harness, by 409 at intake).
- No stale grant reuse, no silent denials, no service outage muted:
  each verified in-workflow, not just at unit level.

## Still open (unchanged, still tracked)

Security batch on the real chain, recovery/privacy/performance audits,
worker-runtime reconciliation, organism/abstraction pass, five traceability
dispositions, packaging. Selector stays empty; none of this is hidden.
