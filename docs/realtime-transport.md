# Realtime Transport (REQ-p27-realtime-transport, P27)

Realtime comms transport with a durable event log. Reference: ClickClack
realtime v0.5.1 (MIT, STUDY_ONLY) — mechanics only.

## Design (`src/realtime/`)

Live delivery backed by a DURABLE per-channel event log over the P17
owned-state store (atomic writes, integrity hashes, optimistic versions):

- `log.ts` (`DurableEventLog`): monotonic per-channel sequences surviving
  restarts; `publish` appends; `replay(channel, fromSeq)` returns exactly
  the missed events. If retention moved past `fromSeq`, replay fails
  honestly (`resync required`) instead of silently skipping.
- `transport.ts`: `RealtimeTransport` interface (publish/resume/liveTail)
  with per-subscriber channel allowlists (unauthorized channels denied).
  `LoopbackTransport` (labeled simulated) fans out to in-process handlers
  over the durable log — proves reconnect/backlog/access semantics with no
  socket. `WebSocketTransport` is declared-unavailable with a reason; a
  real socket peer is owner-authorized runtime work.
- `types.ts`: channel/event/subscriber validation (channel charset,
  object-only bounded payloads, allowlist enforcement), typed errors.

Reconnect semantics: resume from `lastSeenSeq` returns the missed backlog
plus the new head; the next resume continues from there.

Tests: `src/realtime/realtime.test.ts` (7 tests: sequencing, restart
survival, retention floor honesty, malformed input, live+resume,
access control, WS unavailability).
