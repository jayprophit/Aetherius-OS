# Unified Event Correlation Envelope (REQ-p19-event-envelope, P19)

One correlation view over five per-domain event shapes. The envelope is
additive: domain events stay valid independently with their own
validation; the envelope wraps them for cross-domain tracing without
lossy flattening. Envelope != event bus (no broker/queue/delivery;
P27 owns transport). Event occurred != evidence passed. Correlation !=
causation.

## Five domain shapes (all preserved, none rewritten)

| Domain | Shape | Identity | Timestamps |
| --- | --- | --- | --- |
| scheduler (seed) | `AetheriusEvent` | externally-supplied `event_id` | dual epoch-ms `occurred_at`/`received_at` |
| realtime | `LogEvent` | deterministic `channel:seq` | single ISO `at` |
| workflow | `HistoryEvent` | deterministic `runId:seq` | single ISO `at` |
| steward | `StewardReport` | deterministic target id | single ISO `generatedAt` |
| bridge | `BridgeActionRequest` | deterministic `runId:stepId` | caller-supplied ms (requests carry none; never invented) |

## Envelope (`src/events/envelope.ts`)

`EventEnvelope<TPayload>`: eventId, domain-qualified eventType
(`scheduler:REVIEW.PR_OPENED` — qualification preserves the original,
never renames), schemaVersion "1", domain allowlist of the five,
occurredAt (epoch ms, ISO parsed via `epochMs`), optional receivedAt
(only where the domain tracks ingress), source, optional
correlationId/causationId (distinct, absent stays absent — never
guessed), optional task/workflowRun/stepRun/worker/principal/project
ids, untouched generic payload, optional evidenceRefs, provenance.

Adapters: `envelopeSchedulerEvent` (seed semantics preserved, dual
timestamps + correlation passthrough), `envelopeRealtimeEvent`,
`envelopeWorkflowEvent` (run/step linkage), `envelopeStewardReport`
(trigger as namespaced causation class), `envelopeBridgeAction`
(explicit run/step causation + principal). `validateEnvelope`
(structural only), `canonicalEnvelope` (deterministic JSON).

Deliberately out of scope: event bus behaviour, second registry,
Evidence Graph join (envelope carries evidenceRefs for it),
deliverable merging, transport semantics.

Tests: `src/events/envelope.test.ts` (8 tests: all five adapters,
absent-correlation honesty, malformed rejection, deterministic
serialization with byte-identical payloads).
