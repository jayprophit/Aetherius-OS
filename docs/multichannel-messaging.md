# REQ-p27-multichannel-messaging — Multichannel Messaging Fabric (implemented in Agent-Bridge)

Status: PROVEN / COMPLETE. Owner: agent-bridge.

## Registered scope

Typed channel profiles, cross-channel routing, consent and provider seam
over the loopback pattern; transport and isolated adapters exist, fabric
join absent.

## Where the implementation lives

**Agent-Bridge repository**, commit `1f82a01` — not in Aetherius-OS, per the
ownership rule (PROGRAMME OWNER != IMPLEMENTATION OWNER):

- `comms/fabric.py` — `ChannelProfile` (closed kinds with existing adapters
  only), `route_message` (explicit selection with ordered gates, no ranking/
  fallback/broadcast), caller-held `ConsentLedger`, `MessageProvider` +
  `LoopbackMessageProvider` seam (records only; real sends stay
  PROVIDER_REQUIRED), normalized envelope with preserved channel data,
  per-kind inbound normalization, id-based dedup with conflict refusal.
- `tests/test_messaging_fabric.py` — 28 tests (`python -m unittest`).
- `docs/MESSAGING_FABRIC.md` — Bridge-side contract doc.

## Binding distinctions (implemented in Agent-Bridge, recorded here)

- MESSAGE != TRANSPORT; CHANNEL != TRANSPORT.
- SEND REQUEST != DELIVERY; no read/replied claims beyond provider proof.
- CHANNEL AVAILABLE != AUTHORIZED TO SEND; MESSAGE COMPOSED != SEND
  AUTHORIZED (P25 decides elsewhere; the fabric only requires the reference).
- RECIPIENT ADDRESS != VERIFIED IDENTITY; DECLARED SENDER != VERIFIED SENDER.
- CONTENT != AUTHORITY (inbound text stays data).
- CREDENTIAL REFERENCE != CREDENTIAL VALUE (refs only, never stored).
- RETRYABLE != RETRY SCHEDULED; no timers, daemons, or polling.
- SAME TEXT != SAME MESSAGE (identity dedupes, never content); same text
  across channels never merges.
- No CRM, memory, notification policy, escalation, ranking, fallback,
  broadcast, vector search, or model calls.

## Gates

- Bridge targeted 28/28; related 10/10 (comms); lint N/A (none configured).
- Bridge full suite 1193/1214 — 21 pre-existing failures (Ollama/model-
  environment + file-behavior areas), proven independent (fail identically
  without the new modules loaded, zero references to the new code).
- Aetherius bookkeeping: exact-ID mutation (3 lines, JSON re-parsed, 107
  requirements, exactly 1 match, no other ID touched), registry validation
  243/243, selector retargeted to REQ-p27-network-hierarchy.
