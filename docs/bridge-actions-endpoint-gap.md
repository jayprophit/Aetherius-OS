# The `/v1/actions` gap — an executor pointed at a 404

Date: 2026-10-01
Found while implementing the Genesis action-proposal seam (Genesis `6fd5342`)
State: **Aetherius execution layer IMPLEMENTED, its target endpoint ABSENT on Agent Bridge**

## What exists

`src/workflows/bridgeAction.ts` implements a structured, tested action executor:

- `BridgeActionRequest` (`bridgeAction.ts:13`) with `actionId`, `principal`,
  `sessionId`, `workspace`, `action`, `resource`, `payload`, `ownerMode`,
  `provenance { runId, stepId, attempt }`, `timeoutMs`
- `BridgeActionResponse` (`:28`) with `outcome`, `output`, `error`,
  `approvalId`, `evidence { actionId, deduped }`
- a seven-value outcome vocabulary (`:4`): `SUCCEEDED | DENIED |
  WAITING_APPROVAL | FAILED | TIMED_OUT | CANCELLED | UNKNOWN_OUTCOME`
- `HttpBridgeTransport` (`:48`) which POSTs to **`/v1/actions`** (`:55-68`)
- `BridgeActionExecutor` (`:143`) driving it

## What does not exist

Agent Bridge has no `/v1/actions` route. Its complete inbound POST surface is
`sessions`, `sessions/{id}/tasks`, `revise`, `final`, `cancel`,
`approvals/{aid}`, `rollback`, `stop`, and `taskcenter/tasks`
(`Agent-Bridge/service.py`, `do_POST` at `:369`). `rg 'v1/actions'` over the
Agent Bridge repository returns nothing.

Its own self-documenting schema list (`service.py:709-723`) lists only
`/v1/sessions/*`, `/v1/capabilities` and `/v1/models`.

Agent Bridge's inbound task surface is **free text only**:
`POST /v1/sessions/{id}/tasks` takes `{ text, idempotency_key, parent_task_id }`
(`service.py:398-408`). Structured actions are parsed out of model JSON inside
the loop (`bridge.py:115`, `protocol.validate_action`) and are never accepted as
a typed external request.

## Why the test suite did not catch it

`src/workflows/bridgeAction.test.ts` tests `HttpBridgeTransport` against a stub
HTTP server **that the test itself defines**, which returns hand-written
outcomes (`:349-356`). So the request/response *shape* is verified while the
*endpoint it targets* is never checked against the real service. Against the real
Agent Bridge the same call returns 404, which the transport normalizes to
`FAILED` — a legitimate-looking result for an illegitimate configuration.

    MOCKED  !=  VERIFIED
    TEST RUNS  !=  TARGET CODE PATH RUNS
    GREEN TEST  !=  INTENDED INTEGRATION

The existing typed proposal in Agent Bridge is declared but unbuilt:
`docs/contracts/GENESIS_AGENT_BRIDGE_v1.md:20-31` specifies a request envelope of
`request_id, session_id, identity, capability, input, authority, resource_budget`
and its own line 30 admits the fields are "CONTRACT-DECLARED, not implemented"
(`rg 'resource_budget'` over Agent Bridge Python: zero hits).

## Consequence

The Aetherius → Agent Bridge execution path cannot work today, and the failure
would present as a generic `FAILED` rather than a missing route. Anything
claiming that path is integrated is wrong: Genesis can now propose, P25 can
decide, Agent Bridge can execute — but the executor that would carry a proposal
from the first to the third points at an endpoint that does not exist.

## What closing it must not do

`/v1/actions` must not become a second, weaker execution path. It has to route
through the *existing* gates that a model-driven action already passes:

- `protocol.validate_action` against the closed `ACTIONS` vocabulary, so an
  externally supplied action cannot name something the loop could not;
- the approval gate, so `WAITING_APPROVAL` is a real pause a human can resolve
  through the same approval endpoint, not a fabricated status;
- the policy engine, so P25 still decides and `policy_id` is returned as
  evidence;
- the executor, so the workspace sandbox and the resource grants apply exactly
  as they do for model actions;
- the journal, so `actionId` deduplication and the effect-truth fields
  (`effect_achieved`, `denied_actions`, `blocked`) are the same ones the IDE
  already reads.

A typed intake that skips any of those would be authority widening disguised as
integration.

## Related truth

`Genesis/include/genesis/agents/action_proposal.hpp` (commit `6fd5342`) is the
Genesis half of this path and is implemented and tested, including a mutation
proof that Genesis cannot authorize its own proposal. The Genesis side needs an
adapter that renders a proposal into `BridgeActionRequest`; that adapter should
be written once the endpoint exists, so it cannot be written against a fiction.