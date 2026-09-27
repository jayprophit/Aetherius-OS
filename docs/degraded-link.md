# REQ-p27-degraded-link — Delay-Tolerant Message Semantics over the Durable Log

Status: PROVEN / COMPLETE. Owner: aetherius-os.

## Registered scope

Delay-tolerant message semantics (id/sequence/priority/TTL/compression/hash/
signature/ack/retry/dedup/fragments/delivery-state) with store-and-forward
over the durable log; live+backlog exists, DTN does not.

Prior state: live delivery + backlog (`RealtimeTransport`/`DurableEventLog`),
EventEnvelope identity conventions, `sha256HexBytes` helper, and
scheduler-level redelivery dedup (event-level, different owner/key) all
existed. No message-level semantics existed anywhere.

## What was built

`src/realtime/degradedLink.ts` — message envelope, caller-held store,
link-gated drain, send/ack/expiry/drop transitions, retry eligibility,
fragment split/reassemble, real gzip pack/unpack, digest verification.
`src/realtime/degradedLink.test.ts` — 31 tests.

## Binding distinctions (tested)

- DEGRADED-LINK HANDLING != TRANSPORT REIMPLEMENTATION — composes
  RealtimeTransport/DurableEventLog; no Transport2/Bus2/Queue2/MessageId2.
- SEND ATTEMPT != DELIVERY; DELIVERY != PROCESSING; ACK != BUSINESS SUCCESS
  (declared levels only); DUPLICATE ACK != SECOND DELIVERY; DUPLICATE DELIVERY
  != DUPLICATE INTENT (idempotent redelivery, conflict on changed content).
- RECONNECT != REPLAY ALL HISTORY — drain returns eligible lists; nothing
  resends itself.
- BUFFERED != DURABLE (bookkeeping); PERSISTED QUEUE != EVENTUAL DELIVERY
  PROOF; RETRY MECHANISM != DELIVERY GUARANTEE (no exactly-once claims ever).
- Expired mail refused, never stored; overflow rejects explicitly; no silent
  drops and no invented drop classes. LEASE TTL != MESSAGE TTL.
- OFFLINE/UNKNOWN hold everything; DEGRADED needs an explicit
  caller-supplied priority floor (no default invented); HEALTHY drains in
  priority/sequence order.
- DEGRADED != OFFLINE; REMOTE DEGRADED != LOCAL UNAVAILABLE (enqueue always
  works); NETWORK AVAILABILITY != SYSTEM AVAILABILITY; LINK QUALITY !=
  PLACEMENT; NETWORK CONDITION != AUTHORIZATION.
- RETRYABLE != RETRY SCHEDULED (eligibility computed, never scheduled);
  TEMPORARY FAILURE != PERMISSION TO RETRY FOREVER. No timers/daemons/loops —
  every transition is caller-driven and pure.
- Fragment gaps name missing indices; duplicates rejected.
- DIGEST != SIGNATURE — hashes computed and verified; signatures are claims
  with key refs, never verified or generated.
- Compression is real (gzip via node:zlib) or refused; mismatched data fails
  loudly.
- Unknown acks rejected (never fabricated); unknown messages report UNKNOWN;
  out-of-order acks accepted independently.
- Envelope metadata scanned for authority/secret/persona violations;
  payloads stay opaque. Strict closed shapes. Deterministic canonical
  ordering; no caller mutation.
