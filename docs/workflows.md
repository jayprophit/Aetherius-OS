# Skill / workflow / routine runtime (P19/1)

Deterministic, offline, model-free execution foundation. No AI dependency.

## Concepts

- **Skill**: versioned reusable capability (`skill_id` + `x.y.z`; never
  resolved by display name). Declares inputs, outputs, required
  capabilities/permissions/tools, platforms, execution kind, risk class,
  provenance. Registration validates and rejects duplicate versions.
  **Skills never grant authority**: `required_permissions` is metadata for
  later Agent Bridge authorization, not a grant.
- **Workflow**: versioned DAG of steps (`skill`, `condition`, `approval`,
  `wait`, `subworkflow`). Dependencies must form a cycle-free graph;
  bindings may reference `$input.<name>` or `$steps.<dep>.output.<path>`
  (direct dependencies only). No closures in definitions.
- **Routine**: named configuration wrapping one workflow version (defaults,
  policy, capability requirements, enabled flag). Schedules and triggers
  belong to later P19 work and are rejected here.

## Execution

Sequential, declared order among ready steps; validated transitions only.
Steps declare retry policy (bounded `max_attempts`, never infinite),
timeouts (honest TIMED_OUT, never left RUNNING), cancellation (distinct
from failure/timeout/denial) and retry safety (`safe`/`unsafe`/`unknown`).
Outputs are checked against `output_required_keys` when declared.

Approvals pause the run durably (`WAITING_APPROVAL`); ALLOW resumes, DENY
fails deterministically. A workflow declaration never authorizes its own
actions — external effects still flow through Agent Bridge policy/approval.

## Durability (P17)

Definitions are code and re-register at boot. Run state (steps, attempts,
outputs, approvals, history, skill pins) persists through P17 envelopes
with optimistic version checks. Pause/resume works across runtime
instances; completed steps never rerun; pinned skill versions are verified
on resume and registry drift fails loudly.

## Interruption

A persisted RUNNING step is never assumed successful. Recovery classifies
by retry safety: `safe` → PENDING rerun; otherwise RECOVERING, requiring
explicit `reconcile()` (`retry`/`skip`/`fail`). Corrupt or future-schema
state is rejected, never reset.

## Boundaries

P18 model invocation and Agent Bridge actions attach later as registered
executor kinds behind their own policy. Genesis cognition lives in P22;
workflow runs are operational state, not identity or memory.

## Subworkflows (P19/4)

Steps of kind `subworkflow` reference `workflow:<id>@<x.y.z>` and compose
versioned children through the same runtime: same policy, history and
persistence. The child run id, ancestors chain and resolved versions persist
with the parent, so resume and recovery survive restarts. Approvals
propagate into waiting children bottom-up; failures propagate with
provenance; cycle (A→B→A), self-include, depth excess (>8) and missing
children fail honestly instead of recursing. Definitions are code and must
be registered on every fresh instance.

## External executors (P19/3)

Two registered kinds give workflows controlled capabilities:

- **model-invoke**: step declares capability needs (capability,
  min_context, privacy, prompt binding, optional pin); the executor routes
  via P18 capability matching, invokes through the adapter registry, and
  normalizes output. Steps never name providers or endpoints.
- **bridge-action**: step declares `bridge:<domain>:<action>` plus resource
  and provenance bindings; execution goes to Agent Bridge, which remains
  the sole authority for DENY/APPROVAL/execution. Outcomes normalize to
  SUCCEEDED/DENIED/WAITING_APPROVAL/FAILED/TIMED_OUT/CANCELLED/
  UNKNOWN_OUTCOME — DENIED is never FAILED, approval pauses durably, and
  unknown outcomes reconcile instead of assuming. Re-execution after ALLOW
  relies on bridge-side idempotency (same action id executes once).

OWNER_FULL_CONTROL is a broad explicit grant evaluated by policy, never a
bypass: reversible operations proceed, protected irreversible ones still
require approval. Skills, schedules and events grant nothing; only policy
plus approval authorize external effects.

## Scheduler + triggers (P19/2)

Time (`ONE_TIME`, `INTERVAL` anchored at startAt, `DAILY` UTC) and trusted
internal events cause routine activation. Schedules, triggers, activations
and runs are four distinct types. The core is deterministic: pure
due-occurrence calculation, controllable clock values, no background
threads in tests (`tick()`/`dispatchEvent()`), no real sleeping.

One logical occurrence yields at most one canonical activation, enforced
by P17 optimistic-version claims (a racing instance observes the claim and
exits cleanly). Event redelivery deduplicates on trigger+event identity.
Misfires follow explicit policy (`SKIP` default, `RUN_ONCE_NOW`,
bounded `CATCH_UP_BOUNDED` with age/cycle/lifetime caps — never a backlog
storm). Disabled/expired routines never fire; stale claims reconcile
explicitly. Activations pin routine/workflow/schedule versions. Scheduled
runs that reach protected steps wait for approval like any other run;
schedules and events never grant authority.
