# Threat model — Decentralized Messaging App

Status: first version, 2026-10-29.
Scope: the in-process messaging core in `src/messaging.ts` and its tests.
Owner: Aetherius OS programme.

This document exists because `TODO-DMA-001` requires a recorded scope, a
transport decision and a threat model before any transport is implemented.
It describes what the code actually does, including the controls it does not
have. It is not a production security assessment.

## 1. What is in scope

- Conversations, membership and the owner/admin/member roles.
- Encrypted message storage, edits and deletion.
- Attachment metadata validation (name, MIME type, byte size, SHA-256).
- Presence records and read markers.
- Notification fan-out and the email outbox port.
- Call signalling records (offer, answer, ICE candidates).
- Signed federation envelopes.
- The hash-chained audit ledger.

## 2. What is out of scope

- Account authentication and identity proof. Account ids are caller-supplied
  strings; the host is expected to authenticate them.
- A live relay, socket transport, Matrix bridge or federation network.
- A WebRTC media plane. Call records are signalling metadata, not audio or
  video.
- A user interface or mobile client.
- A key-management service, OS keychain, HSM or database encryption.
- Hosted deployment, backups, operator security and physical access.

## 3. Assets

| Asset | Where it lives | Why it matters |
| --- | --- | --- |
| Message plaintext | Decrypted in process memory | Private conversation content |
| Conversation keys | `ConversationKey` records in the repository | Decrypt every message in the conversation |
| Ciphertext and auth tags | `Message.payload` | Confidentiality and integrity of stored messages |
| Membership and roles | `Conversation.members` | Who may read, send, add or remove |
| Attachment metadata | `Attachment` records | Names and sizes can reveal sensitive facts |
| Federation private keys | Caller-held PEM, passed to `FederationService.pack` | Authenticity of federation envelopes |
| Account identity | Caller-supplied account ids | Attribution and access control |
| Presence and read markers | `PresenceService`, `lastReadSeq` | Social-graph and behaviour metadata |
| Audit ledger | Shared `EventLedger` | Detection and accountability |

## 4. Actors and trust boundaries

- **Owner, admin and member.** Authenticated by the host, authorised by role
  inside the conversation.
- **Removed member.** No longer in `Conversation.members`; may retain copies of
  keys and plaintext obtained before removal.
- **Host operator.** Controls the process, repository and clock. Treated as
  trusted for availability, not for confidentiality of keys held in the same
  repository.
- **Federation peer.** Supplies an envelope and a public key. Not trusted until
  the signature verifies; not pinned to an identity.
- **Email recipient.** Receives whatever the host puts in the outbox. Outside
  the encrypted boundary.
- **Network attacker.** Out of scope today because no network transport exists.
- **Malicious member or sender.** Can send messages, attachments and call
  signals within the rules.

Trust boundaries:

1. Caller → service: every account id and role is asserted by the caller.
2. Service → repository: ciphertext and keys are stored side by side.
3. Service → notification/email ports: previews leave the encrypted store.
4. Local origin → federation peer: a signed envelope crosses an unimplemented
   transport boundary.

## 5. Transport decision

The transport is deliberately an interface, not an implementation.
`InMemoryDeliveryBus` delivers events inside one process, and `EmailOutbox` is
a port with an in-memory implementation. There is no relay, socket, Matrix
bridge, WebRTC peer connection or SMTP client.

Any future transport must be reviewed against this model before it is enabled.
In particular, it must add authenticated peers, replay protection, key custody
and metadata policy rather than relying on the in-process assumptions below.

## 6. Threats and controls

### T-01 — Message confidentiality at rest

**Control.** Messages are encrypted with AES-256-GCM using a random 96-bit IV
per encryption, a 256-bit per-conversation key and an authentication tag. The
key id is bound into the payload and checked on decrypt.

**Residual risk.** Conversation keys are stored in the same repository as the
ciphertext, encoded as base64. Anyone who can read the repository can read the
keys and decrypt every message. There is no KMS, OS keychain, HSM or
per-device wrapping. **OPEN.**

### T-02 — Message tampering

**Control.** GCM authentication rejects modified ciphertext, IV or tag.
`decrypt` also refuses a payload whose `keyId` does not match the supplied key.
Edits decrypt, replace and re-encrypt the payload.

**Residual risk.** A caller that can replace both the ciphertext and the key
record can forge a message. Repository integrity is assumed but not enforced.
**OPEN.**

### T-03 — Unauthorised read, send, edit or delete

**Control.** `requireMember` gates listing, sending, reading, editing, deleting
and read markers. Only the sender may delete a message. Only an owner or admin
may add or remove members or rotate the key. The owner cannot be removed.

**Residual risk.** Authorisation trusts the caller-supplied `actorId`. Without
host authentication, any caller that knows an account id can act as that
account. **OPEN — host responsibility.**

### T-04 — Removed member retains access

**Control.** Membership checks stop new operations after removal. Key rotation
retires the active key and creates a new one for subsequent messages.

**Residual risk.** Old keys are retained so history remains readable. Messages
are not re-encrypted, there is no forward secrecy or ratchet, and a removed
member who copied a key or plaintext can still read what they already had.
**OPEN.**

### T-05 — Forged federation envelope

**Control.** `FederationService.pack` signs a canonical body with Ed25519.
`unpack` verifies the signature and refuses an envelope whose embedded public
key differs from the expected key.

**Residual risk.** There is no trust root, key pinning, certificate, revocation
or identity binding. A caller that supplies the attacker's public key will
accept the attacker's envelope. **OPEN.**

### T-06 — Replay and reordering of federation envelopes

**Control.** Envelopes carry a signed `seq`, and changing it invalidates the
signature.

**Residual risk.** There is no replay cache, expected-sequence check, nonce,
expiry or recipient check. A captured envelope can be replayed unchanged and
accepted again. This must be fixed before a transport is enabled. **OPEN.**

### T-07 — Key custody and rotation

**Control.** Keys are 32 random bytes, base64-encoded, with an id, creation time
and retirement time. Rotation is restricted to owner/admin.

**Residual risk.** No key wrapping, no per-device keys, no secure erase, no
rotation schedule and no re-encryption of history. **OPEN.**

### T-08 — Metadata leakage

**Control.** Message bodies and attachment metadata inside the payload are
encrypted.

**Residual risk.** Conversation ids, sender ids, sequence numbers, timestamps,
membership, presence, read markers and ledger entries are stored in clear.
This is accepted for an in-process slice but must be documented in any product
privacy notice. **ACCEPTED for this slice.**

### T-09 — Notification and email leakage

**Control.** Notification previews are truncated to 140 characters. Attachment
messages use the attachment name as the preview.

**Residual risk.** Previews and attachment names leave the encrypted store and
are passed to a caller-supplied `NotificationService`. The email outbox holds
plaintext email. There is no redaction, consent check or per-channel policy.
**OPEN.**

### T-10 — Malicious or oversized attachment

**Control.** Attachment metadata is limited to 25 MiB, checked against a MIME
allowlist and required to carry a 64-hex SHA-256 digest. Message bodies are
limited to 4,000 characters.

**Residual risk.** The slice stores metadata only; it does not receive, scan,
sniff or sandbox attachment bytes. A host that later stores the bytes must add
malware scanning, content-type verification and safe rendering. **OPEN.**

### T-11 — Denial of service

**Control.** Body length, attachment size and list limits bound individual
operations.

**Residual risk.** There are no rate limits, member caps, conversation caps,
federation quotas or backpressure. A caller can create many conversations or
messages until memory is exhausted. **OPEN.**

### T-12 — Audit-ledger tampering

**Control.** Every mutation is appended to the shared hash-chained
`EventLedger`, and the chain can be verified.

**Residual risk.** The chain is in the same process and store as the data. An
operator who can rewrite the whole chain can produce a new valid chain. There
is no external anchor, WORM storage or independent witness. **OPEN.**

### T-13 — Deletion

**Control.** Deleting a message clears `payload`, so the ciphertext is removed
from the stored record and views return an empty body. Only the sender may
delete.

**Residual risk.** Backups, copies and the recipient's own device are outside
this slice. Deletion is not a guarantee of erasure. **OPEN.**

### T-14 — Call signalling

**Control.** Call records are typed signalling metadata (offer, answer, ICE).

**Residual risk.** No media is carried, so there is no media eavesdropping
claim to make. A future WebRTC integration needs its own threat model covering
DTLS-SRTP, ICE authentication and TURN privacy. **ACCEPTED for this slice.**

## 7. Security gates before any transport is enabled

1. Authenticate every account and bind it to the `actorId` used by the service.
2. Move conversation keys out of the message repository into a KMS, OS keychain
   or per-device wrapping scheme.
3. Add federation trust roots, key pinning, revocation and envelope replay
   protection (sequence, nonce or expiry).
4. Add rate limits, quota and backpressure.
5. Add attachment scanning and safe rendering, or refuse attachments.
6. Define a metadata-retention and notification-redaction policy.
7. Anchor the audit chain outside the process.
8. Define deletion and backup semantics.
9. Obtain an independent review before claiming production security.

## 8. Residual risk statement

This slice demonstrates encrypted storage, membership rules, signed federation
envelopes and an audit trail. It is not a secure messenger. The open items
above must be closed, and the transport decision revisited, before it is
deployed to real users or connected to a network.
