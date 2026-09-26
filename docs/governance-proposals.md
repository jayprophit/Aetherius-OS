# Governance Proposals (REQ-p16-governance-proposals, P16)

A governance proposal is a **requested governance change**, or a request
for governance consideration. The registered requirement describes the
chain *"proposal to review to vote to funding to milestones to evidence to
staged release"*. This module owns the **first link only**: a proposed
change, its review, and a decision recorded *by reference*.

Implementation: `src/programme/proposals.ts` (sibling of
`src/programme/inventions.ts`, the other append-only P16 registry).

The skill promotion lifecycle (`src/workflows/promotion.ts`) is the
**template** for the shape of a governed lifecycle, and is deliberately
**not reused**: a skill candidate is promoted by a promotion policy, while
a governance proposal is only ever *recorded*.

## The distinctions this module exists to hold

```
PROPOSAL        != GOVERNANCE DECISION
DECISION        != AUTHORIZATION        (P25 authorizes; a proposal never does)
APPROVAL        != EXECUTION
PROPOSER ROLE   != AUTHORITY
PROPOSAL RECORD != SIDE EFFECT
GOVERNANCE      != AUTONOMOUS AUTHORITY
ABSENCE OF A DECISION != APPROVAL
STEWARD REPORT  != GOVERNANCE DECISION
COHORT REVIEW   != GOVERNANCE APPROVAL
```

## Proposal identity

`proposalIdFor(title)` derives a deterministic `gov-<slug>` id
(`gov-define-release-scope`). Validation requires
`/^gov-[a-z0-9][a-z0-9-]*$/`, so a proposal id **structurally cannot
masquerade as** a requirement id, a decision id, a vote id, a worker id, a
user identity or an execution id. `proposalVersionRef(id, v)` yields
`gov-<slug>@<v>`; `proposalStateId(id, v)` yields the durable state id
`gov-<slug>-v<v>`.

## Lifecycle and status vocabulary

Stage names come from the **registered requirement's own chain**, not from
invention:

| Stage | Meaning |
| --- | --- |
| `PROPOSED` | A requested change is recorded. Nothing has happened to it. |
| `REVIEW` | Under review. |
| `VOTE` | A decision has been recorded **by reference** from the responsible mechanism. |
| `WITHDRAWN` | The proposer withdrew it. Retained in history. |
| `SUPERSEDED` | A later version replaced it. Retained in history. |

Deliberately **absent**: `APPROVED`, `AUTHORIZED`, `APPLIED`, `PROMOTED`,
`EXECUTED`, `GRANTED`, `FUNDED`, `RELEASED`. A proposal cannot reach a
state implying it changed anything.

The requirement's later links — `FUNDING`, `MILESTONES`, `EVIDENCE`,
`STAGED_RELEASE` — are named by the requirement but are **not
implemented and are not reachable states** here. They belong to
`REQ-p25-reward-treasury` (DEFERRED), milestone tracking,
`REQ-p16-evidence-graph` (already COMPLETE) and
`REQ-p31-release-scope` (OWNER_GATED).

## Decisions are references, not authority

A `VOTE`-stage record carries a `ProposalDecision`:

```ts
{ decisionRef, decidedByRef, decidedAt, outcome: "SUPPORTED" | "OPPOSED" | "ABSTAINED" }
```

`decidedByRef` is a *reference* to whoever actually decided (an owner
profile, a P25 record, a council record). `SUPPORTED` means that mechanism
recorded support — **not** approval, **not** authorization, **not**
permission to act. The mechanism's own gate still applies.

A decision is **required** at `VOTE` and **forbidden** at every other
stage. `proposalDecision(record)` returns `"NO_DECISION_RECORDED"` when
there is none: absence of a decision is never read as approval. A
`decidedAt` earlier than `createdAt` is rejected as a temporal conflict
(equal timestamps are fine).

## Registration, versioning, supersession

`registerProposal(records, input, knownRequirements?)` is pure — it
returns `{ records, outcome }` and never mutates its inputs. Semantics
follow the P16 invention registry:

| Situation | Outcome |
| --- | --- |
| Malformed input | `rejected` — never repaired, never stored |
| Same id + same version + same content | `identical` (idempotent) |
| Same id + same version + different content | `conflict` — history is immutable |
| Same id + higher version | `registered` as an amendment |
| Same id + lower version | `conflict` — an amendment may not move backwards |

`createdAt` is part of the compared content, because a timestamp is
evidence: re-registering the same logical proposal with a different
`createdAt` is a genuine content difference and conflicts.

**Amendment is not silent overwrite.** Version 1 survives verbatim
alongside version 2, linked by `supersedesRef`.
`supersessionChain(records, id)` returns the whole chain oldest-first.
Rejected, withdrawn and superseded proposals are never deleted:
governance history is evidence, and history is not current authority.

## Proposer semantics

`proposerRef` is a **reference only**. A proposer named `user:owner`
grants nothing: the record has no authority field to fill, and
`PROPOSER IDENTITY != PROPOSER AUTHORITY`. There is no Identity Registry
here, and authority is never inferred from a name or role string.

## Scope, targets and evidence

`scope` is free text describing the requested change's boundary.
`targetRefs`, `requirementRefs` and `evidenceRefs` are opaque,
sorted-on-read string references — never embedded canonical records.
Evidence follows the repo-wide convention of `evidenceRefs: string[]`
(as in `CapabilityNode`, `DimensionResult`, `InventionRecord`); the
`EvidenceGraph` vocabulary already provides `policy` nodes and a
`DECIDED_BY` relation, but this module does not write into the graph.

`requirementRefs` are checked against `knownRequirements` **only when a
non-empty known set is supplied**: an unchecked dimension stays silent
rather than reporting a false negative.

## Risk metadata, not authority

`risk.category` is one of `NONE`, `CREDENTIAL`, `SECURITY_POLICY`,
`FINANCE`, `DESTRUCTIVE`, `DEVICE`, `PUBLICATION`. This is triage
metadata for a reviewer. Recording that a proposal touches credentials
says nothing about whether it may.

## Validation

Rejected, never repaired: `proposal-id`, `version`, `title`, `rationale`,
`scope`, `proposer-ref`, `stage`, `supersedes` (including
self-supersession), `refs` (blank or duplicate), `requirement-refs`,
`decision`, `decision-temporal`, `risk-category`, `authority-field`,
`raw-secret`, `created-at`, `provenance`.

**No authority fields by accident.** A record carrying `authorized`,
`authorize`, `execute`, `merge_authority`, `canMerge`, `canDeploy`,
`grantApproved`, `policyBypass`, `ownerOverride`, `approvalGranted` or
`applied` is rejected — a proposal that can express its own authority is a
proposal that can grant it.

**No raw secrets.** Credential-bearing keys (`apiKey`, `token`,
`password`, `privateKey`, `secret`, `value`) are rejected, mirroring
`assertSecretReferenceShape` in `src/state/types.ts`. Free-text fields are
scanned for credential assignments, mirroring `staticSafetyScan`'s intent
in `src/workflows/promotion.ts`; those patterns are private to the
completed P19 module, so a small local subset is used rather than editing
a completed requirement.

**No fabricated timestamps.** `createdAt` and `decidedAt` are supplied by
the caller and validated as ISO-8601. This module never calls a clock.

## Queries

Deterministic, explicit, bounded, deep-copied on read. Ordering is always
`proposalId`, then `version`. `listProposals`, `proposalsByStage`,
`proposalsByProposer`, `proposalsByRequirement`, `proposalsByTarget`,
`proposalsByEvidence`, `proposalsByProtectedCategory`,
`supersessionChain`. An unknown key returns `[]`, never everything.

## Durable storage

`ProposalStore` mirrors `StewardReportStore` / `CohortReviewStore`: kind
`governance.proposal`, provenance `p16-governance-proposals`, integrity
hashes, optimistic concurrency, append-by-revision with `createdAt`
preserved, and id/version drift rejected on update. It exposes no
effect surface.

## Boundaries with neighbouring systems

- **P25 (authority plane).** Authorization stays with
  `src/policy/ownerProfile.ts` (`effectiveDecision`, default-deny). A
  proposal may *request* a policy or grant change and may *reference* the
  required approval, but it grants nothing: execution authority,
  credential access, device authority, finance authority and policy
  bypass are all unreachable.
- **Owner gates.** A proposal may reference an owner-gated decision or
  request owner action. It may **not** convert `OWNER_GATED` to
  `COMPLETE`. Storing a proposal about `REQ-p31-release-scope` is not the
  owner deciding release scope, and this unit does not decide it.
- **StewardReport.** `StewardReport` remains the canonical producer of
  readiness verdicts. A proposal may reference a report or a cohort review
  as input and never recalculates readiness.
- **CohortReview.** `CohortReview.merge_authority` stays `false`. The
  cohort layer is not elevated to governance authority.
- **Requirement Registry.** There is no runtime mechanism in this repo
  that mutates a requirement's status or `work_state`, and this module
  adds none. `Proposal Registry != Requirement Registry`.
- **Capability Graph.** `CapabilityView` stays a read-only view. A
  proposal references capability ids; it does not copy ownership, grants,
  targets or evidence into itself as new canonical data.
- **Network governance.** `REQ-p27-network-hierarchy` (Parent / Child /
  Grandchild) is untouched. Proposal representation stays separate from
  network consensus and distribution.
- **Claim registry.** The MAT claim registry is COMPLETE and may be
  referenced, but `ESTABLISHED claim != automatic policy choice`. MAT
  truth assessment is not pulled into proposal authority.

## Deliberately not built

No voting engine, tally, ballot, voter set, quorum, delegation, staking or
DAO consensus. A proposal registry can exist before all of those, and the
`VOTE` stage records a decision *reference*, never a count.

Tests: `src/programme/proposals.test.ts` (32 tests: minimal and full
validation, malformed rejection including authority fields and raw
secrets, decision required/forbidden per stage, temporal conflict,
idempotence, content conflict, amendment and supersession with retained
history, backwards-version rejection, input immutability, decision
semantics including honest undecided, deterministic id and ordering,
deep-copied reads, all query dimensions, durable round-trip, tamper
detection, and the authority/no-side-effect/owner-gate invariants).
