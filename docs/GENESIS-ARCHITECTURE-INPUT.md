# Genesis / Aetherius architecture input (preserved)

**Status: DESIGNED.** Owner-supplied architecture package, recorded 2026-09-30.
Nothing in this document is implemented by virtue of appearing here.

## Evidence vocabulary — applied throughout

| State | Meaning here |
| --- | --- |
| DESIGNED | specified in this document; no code |
| RESEARCHED | external material summarised; not verified for this codebase |
| PLANNED | a programme requirement exists |
| IMPLEMENTED | code exists |
| TESTED | a behavioural suite exists and passes |
| INTEGRATED | proven through the real vertical slice |

Architecture is not implementation. A component does not exist because it has
been architected. Every row in the mapping table below carries its real state
from `src/programme/requirements.json`, not an aspiration.

## Hard invariants (owner corrections — these override phrasing used earlier)

1. **ONE USER → ONE CANONICAL GENESIS.** There are no multiple Genesis clones.
   "Clone" was meant in the human/digital-counterpart sense, not duplication.
2. **GENESIS IDENTITY ≠ VERSION IDENTITY.** `G-001` persists across v1.0 →
   v1.1 → v2.0 → v8.4. Use *Genesis Version / Upgrade / Migration / Recovery /
   Instance / Session / Embodiment*. Never "Genesis clone" for versioning.
3. **GENESIS ≠ LLM ≠ OLLAMA ≠ BITNET ≠ JEV.** Genesis is the persistent entity;
   models are replaceable cognitive components.
4. **AVATAR IDENTITY ≠ AVATAR RENDERER.** One canonical avatar identity.
   IDE, mobile, Aetherius OS and any physical shell are *renderers* of it.
5. **ROLE ≠ IDENTITY.** Changing role changes context/tools/permissions, never
   `GenesisIdentity` or `GenesisAvatarIdentity`.
6. **RECOVERY ≠ DUPLICATION.** A new laptop, phone, install or shell restores
   the same Genesis ID.
7. **CONFIDENCE ≠ AUTHORIZATION.** A confident decision is still unapproved.
8. **FINANCIAL WALLET ≠ CAPABILITY WALLET.** "What may Genesis spend" and
   "what may Genesis do" are different questions.
9. **STORED ≠ PERMANENTLY ACCESSIBLE.** Vault retention is not grant duration.
10. **OWNER PRIVATE KEY ≠ GENESIS PRIVATE KEY.** Owner signs grants; Genesis
    verifies them. The owner private key is never handed to Genesis.
11. **KYC ≠ PREMIUM.** Subscription tier and identity assurance level are
    independent axes.
12. **RAW GOVERNMENT ID ≠ NETWORK IDENTITY.** On-chain representation is an
    identity commitment, not a passport number.
13. **NODE IDENTITY ≠ IP ADDRESS.** Node identity is cryptographic and survives
    a change of network.
14. **CAPABILITY ≠ AUTHORIZATION ≠ EXECUTION ≠ VERIFIED EFFECT.** Already
    enforced as a behavioural matrix in Agent Bridge
    (`tests/test_action_matrix.py`).
15. **AGENT BRIDGE IS NOT GENESIS' SPINAL CORD.** Genesis decides; Agent Bridge
    executes. It is the execution/interface layer, not identity, policy, model
    routing, memory, the project orchestrator, or worker lifecycle.
16. **APPLICATION DESIGN ≠ CORE PLATFORM COMPLETION.**

## Mapping to existing programme owners (deduplicated)

Most of this package is **already owned**. This package does not create a second
owner for any of it. States are current.

| Concept | Existing owner | State |
| --- | --- | --- |
| One Genesis identity across models/workers/modes | `REQ-genesis-identity-rule` | COMPLETE (8 C++ + 7 TS tests) |
| Genesis Reflex / System-1 fabric | `REQ-p22-reflex-fabric`, `-calibration`, `-abstention` | COMPLETE |
| Genesis project orchestration | `REQ-p22-project-orchestrator` | COMPLETE |
| Provider-neutral model fabric | `REQ-p18-model-fabric` | **BLOCKED** (cloud credentials) |
| Provider-neutral invoke + adapters | `REQ-p18-invoke`, `REQ-p19-executors` | COMPLETE |
| Authority / policy (P25) | `REQ-owner-full-control` + policy engine | COMPLETE |
| Execution target abstraction | `REQ-p20-execution-target-profile` | COMPLETE |
| Sandboxed / remote runners | `REQ-p21-sandbox-runners` | COMPLETE |
| Temporary supervised workers | `REQ-parallel-temp-workers`, `REQ-p20-spine-branch` | COMPLETE |
| Checkpoints / recovery | `REQ-p20-execution-checkpoints` | COMPLETE |
| Action attribution / contribution | `REQ-p25-reputation`, `REQ-p16-evidence-graph` | COMPLETE |
| Supply-chain / provenance receipts | `REQ-p25-supply-chain` | COMPLETE |
| Capability graph / discovery view | `REQ-p16-capability-graph` | COMPLETE |
| Context layers + compiler | `REQ-context-layers`, `REQ-p26-context-compiler` | COMPLETE |
| Token/resource budgeting (compute side) | `REQ-p26-token-context-budget` | COMPLETE |
| Memory promotion boundary | `REQ-memory-integrity-boundary` | **OWNER_GATED** |
| Transport / realtime / degraded link | `REQ-p27-realtime-transport`, `-degraded-link` | COMPLETE |
| Network hierarchy | `REQ-p27-network-hierarchy` | COMPLETE |
| Hardware profiling for placement | `REQ-p18-hardware-profiles` | COMPLETE |
| Repository relay | `REQ-p30-repo-relay` | COMPLETE |
| Release scope | `REQ-p31-release-scope` | OWNER_GATED (CORE FIRST RELEASE recorded) |

## Genuinely unowned — CANDIDATE requirements, deliberately NOT registered

None of these is registered. They are candidates to be adjudicated against
existing owners and the selector before any of them becomes a requirement.

- **Genesis Constitution** — protected first-party invariants (§7 of the
  handoff). Partially anticipated by `REQ-genesis-identity-rule`, which owns
  the *identity* invariant; a constitutional document covering authority
  ceilings, owner-controlled data, delegation limits and revocation is not
  owned.
- **Canonical avatar identity, versioning, LOD and identity bounds** — no owner.
  Distinct from `REQ-p16-capability-graph`; this is a persistent identity with
  a canonical representation contract.
- **Sovereign substrate + financial wallet / capability wallet separation** —
  no owner. `REQ-owner-full-control` owns a *grant profile*, not a resource
  substrate with capital limits, loss limits and self-limit-impossibility.
- **Personal Data Vault + Personal Data Broker + sensitivity classes +
  purpose-bound and standing authorization** — no owner. `REQ-p25-reputation`
  and `REQ-p16-capability-graph` are unrelated.
- **Credential broker where secrets are never exposed to Genesis** — no owner.
- **KYC / premium separation, network identity, selective disclosure** — no
  owner. `REQ-p31-release-scope` is about what ships, not identity assurance.
- **TransportMUX, connectivity states, offline knowledge packs, edge
  terminals, store-and-forward envelope** — no owner. `REQ-p27-*` covers
  realtime and degraded link inside the workstation, not transport-agnostic
  mesh/edge operation.
- **Attention queue and activity-state projection** — no owner. Related to
  `REQ-p23-work-monitoring` but that is monitoring, not a Genesis supervisor's
  filtered attention queue.
- **PointerBench-style computer-use grounding benchmark** — no owner;
  `REQ-p31-deployment-profile` is not a benchmark.

## Genesis Constitution — candidate invariants (DESIGNED)

1. One persistent identity. 2. One canonical Genesis per user. 3. Identity
persists across models, versions, devices, environments. 4. Canonical avatar
bound to identity. 5. Evolution within delegated authority. 6. Cannot increase
own root authority. 7. Owner/private information stays owner-controlled. 8.
Uses its own credentials and resources where possible. 9. Owner resources
require delegation. 10. Financial resources bounded. 11. Workers inherit only
delegated subsets. 12. Significant actions produce attributable receipts. 13.
Major updates versioned and recoverable. 14. Genesis may *propose*
constitutional change; protected changes need human oversight. 15. Owner
retains emergency recovery and revocation authority.

Enforcement must live **below** the model/prompt layer — the same discipline
already applied to Agent Bridge's default-deny gate.

## Authority levels (DESIGNED)

L0 automatic maintenance · L1 Genesis-controlled improvement · L2 Genesis +
automated verification · L3 human review required · L4 owner-only root,
identity and security operations.

Genesis must not be able to remove owner authority, raise its own financial
allowance, grant itself permissions, read private owner data unauthorized,
replace its root identity, disable audit, delete root safeguards, or rewrite
constitutional permissions.

## Self-evolution actions in bounds (DESIGNED)

Update approved models · benchmark models · improve skills · optimize routing ·
rebuild indexes · optimize memory · install approved dependencies · create
checkpoints · roll back failed versions · optimize resource use · update
approved components.

## Priority-order discrepancy — NEEDS OWNER RESOLUTION

Two instructions given by the owner do not agree on the order of phases:

- **BUILD54 (2026-09-30):** `AGENT BRIDGE → GENESIS → IDE-WORKSPACE → AETHERIUS OS`
- **This handoff (§1, §81):** `AGENT BRIDGE → IDE → GENESIS → real-world testing → AETHERIUS OS`

They agree on Agent Bridge first, on deferring applications, and on abstracting
only proven layers downward. They differ on whether the IDE is proven before or
after Genesis. This cycle has been executing BUILD54's order. **No work has been
done out of order yet**, and nothing depends on the resolution for the completed
Agent Bridge units. The choice changes what is built next, so it is flagged
rather than silently decided.

## Research inputs preserved, not promoted to requirements

- OpenAI "Dots" persistent-agent research (`youtu.be/V_1Vn2WfpEY`) — reinforced
  ExecutionTarget, Authority Plane, Action Review Gate, Attention Queue.
- Ghost Projects / offline computing playlist — Project NOMAD, Tails, Reticulum,
  Meshtastic, MeshCore, LoRa. Extract the *mechanisms* (offline-first,
  transport abstraction, ephemeral execution, store-and-forward), not branding.
- OS / AI-OS course batch — informs lower layers; duplicates in the submitted
  list were deduplicated.
- Aetherius-OS first-party model runtime (Ollama to become an optional
  compatibility adapter) — architectural target; `REQ-p18-model-fabric` remains
  the requirement owner and remains BLOCKED on credentials.

Research is RESEARCHED / ARCHITECTURE INPUT. It does not become PLANNED until
adjudicated against existing owners, and it never becomes IMPLEMENTED by
being written down.
