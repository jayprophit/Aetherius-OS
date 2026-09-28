# REQ-p27-network-hierarchy — Parent/Child/Grandchild Network Model (OS/network, never Genesis)

Status: PROVEN / COMPLETE. Owner: aetherius-os.

## Registered scope

Aetherius OS network hierarchy (isolated Parent authority, distributed Child
layer, protocols, grants/inheritance, revocation, identity linkage); belongs
to OS/network, never to Genesis identity.

Prior state: no hierarchy, parent, child, topology, or protocol concepts
existed anywhere in src. `GenesisIdentityRef` exists as reference-only
(never minted/duplicated here); the P22 `WorkerRelationship`
supervisedBy edge is a different owner, untouched.

## What was built

`src/network/hierarchy.ts` — `registerNode()`, `grantMembership()`,
`revokeGrant()`, `membershipOf()`, `levelOf()`, `childrenOf()`,
`grandchildrenOf()`, `ancestorsOf()`, `descendantsOf()`,
`validateHierarchy()`. `src/network/hierarchy.test.ts` — 32 tests.

## Binding distinctions (tested)

- AETHERIUS NETWORK HIERARCHY != GENESIS — one Genesis + temporary workers;
  no parent/child Genesis, no lineage fields (lineage-shaped keys rejected
  outright with HIERARCHY_GENESIS_REJECTED).
- Three levels DERIVED, never stored — root is Parent, children Child,
  grandchildren terminal at depth 2; depth beyond rejected.
- Grants are TOPOLOGY MEMBERSHIP only — no policy/capability/secret/approval
  conferred; per-subtree isolated authority, non-transferable across roots.
- REVOKED != DELETED; revocation detaches with reason; no removal, no
  reparenting, no cascade delete, no silent orphan repair.
- UNKNOWN PARENT != ROOT — orphans reported, never given placeholder parents.
- TOPOLOGICAL LEVEL != AUTHORIZATION; NODE ID != USER/AI/BLOCKCHAIN ID
  (identityRef opaque, never resolved); NODE REGISTERED != NODE ONLINE (no
  liveness recorded or inferred); NODE REGISTERED != NODE APPROVED.
- TOPOLOGY != TRANSPORT / PLACEMENT (no sockets, routing, or targets);
  LOGICAL PATH != NETWORK PATH; NODE RELATED != NODE REACHABLE.
- PARENT OFFLINE != CHILD INVALID (no liveness exists to go stale).
- HIERARCHY DEPTH != TRUST LEVEL (no scores, ever); PARENT != RELAY;
  PARENT != OWNER; no automatic inheritance of anything but position; no
  secret/capability/policy propagation.
- Conflicting parent claims meet as conflicts (same id + changed content),
  never silent resolution; identical re-registration idempotent.
- Cycles rejected with path evidence at registration; whole-set validation
  reports orphans + cycles; traversal cycle-safe with visited sets.
- Timestamps caller-supplied record times only (registeredAt/grantedAt/
  revokedAt); no joinedAt/lastSeen fabricated.
- Deterministic canonical ordering; scrambled-input equality; no caller
  mutation; no clock/network/timers.
- Validation precedence: authority/secret/persona/lineage violations before
  generic unknown-field errors. Strict closed shapes.
