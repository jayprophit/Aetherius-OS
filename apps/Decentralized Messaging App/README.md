# Decentralized Messaging App

The messaging slice: encrypted message storage, membership and presence, notifications, attachments, call signalling and signed federation envelopes.

**Built:** the messaging core and its tests. **Not built:** a WebRTC media plane, a live federation transport, and the messaging user interface.

## What is built

- AES-256-GCM encryption at rest.
- Membership checks and presence.
- Notification fan-out and attachment metadata.
- Call signalling records (offers, answers and candidates).
- Ed25519-signed federation envelopes with tamper rejection.
- A hash-chained audit trail through the shared `app-kit` ledger.

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24 runs the TypeScript directly. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Honest limits

There is no WebRTC media plane: call records are signalling metadata, not audio or video. There is no live federation transport: envelopes are constructed and verified in-process and are not delivered between hosts. The product requirements are candidate scope derived from the Agent-Bridge communication core, not recovered owner requirements.
