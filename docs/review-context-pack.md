# Review Context Pack (REQ-p16-review-context-pack, P16)

A **review context pack** is the bounded, deterministic, evidence-aware
context a reviewer needs to understand a change, without reconstructing
the project first.

The registered requirement names the join exactly:

> Read-only projection joining **diff, touch set, impact, tests,
> provenance, policy and verification** for reviewers; disclosure/layers/
> reports exist separately, no joined pack.

"parts exist separately, **no joined pack**" — so this is a **join**, not a
new owner. Implementation: `src/programme/reviewPack.ts`.

## The distinctions this module exists to hold

```
REVIEW CONTEXT PACK != REVIEW VERDICT
REVIEW CONTEXT PACK != MERGE AUTHORITY
REVIEW CONTEXT PACK != CONTEXT FABRIC
CONTEXT PACK        != EXECUTION
SELF-GENERATED PACK != INDEPENDENT REVIEW
EXPECTED TOUCH      != ACTUAL TOUCH
MISSING CONTEXT     != NEGATIVE FACT
NO ERROR            != COMPLETE CONTEXT
SEMANTIC SIMILARITY != DEPENDENCY
```

The pack is **input to review**, not the reviewer. A system that generated
the code may generate its own pack; that is not independent verification.

## Authoritative sources, joined not copied

| Leg | Source reused | What is projected |
| --- | --- | --- |
| `diff` | `WorkspaceDiff` (`src/runners/sync.ts`) | sorted path union of added/modified/deleted — never file content |
| `touch` | `TouchEstimate` (`src/workers/touch.ts`) | expected paths, compared against actual |
| `impact` | *none exists* | referenced, or `UNAVAILABLE` with a reason |
| `tests` | outcome records (see below) | `{ref, suite, state}` per test |
| `provenance` | caller-declared `PackSource[]` | structured `{dimension, provenance, detail}` |
| `policy` | `CapabilityNode` refs (`src/programme/capabilityGraph.ts`) | opaque `policyRefs` / `capabilityRefs` |
| `verification` | `VerificationState` (`src/workflows/deliverable.ts`) | state + opaque refs |

Path safety reuses the **exported, shared** `assertSafePath` from
`src/runners/sync.ts` rather than adding a third private copy of the
traversal rule.

## The impact leg is honestly unavailable

There is **no code-level dependency graph in this repository**:

- `registry/depgraph.json` is **system-level** — 10 nodes (`aetherius-os`,
  `agent-bridge`, `mat`, …), no file, module or symbol ids.
- There is **no `depgraph.ts` module**, so no query function exists.
- `EvidenceGraph` is an in-memory graph of caller-recorded facts and
  **never reads** `depgraph.json`; it would return `[]` for any file path.
- `REQ-p20-change-impact` owns this gap and is still `READY` with **zero**
  implementation.

So `impact` is either `REFERENCED` (refs handed over by whichever mechanism
owns impact analysis) or `UNAVAILABLE` with an explanatory reason. It is
**never computed**, and never approximated from name similarity.

## Expected vs actual touch

`touch` reports three disjoint sets: `overlap` (expected and changed),
`expectedOnly`, `unexpected`. An unexpected path is a **review signal, not
a defect** — only a reviewer can judge it. `TouchEstimate` is not
re-estimated here; its `paths` are consumed as given.

## Tests: outcomes, never a summary

`PACK_TEST_STATES` = `PASSED | FAILED | SKIPPED | BLOCKED | NOT_RUN`.

`NOT_RUN` is the honest unknown: a test that was selected but never
executed is **not** a pass, and `SKIPPED` is never reported as `PASSED`.
The pack records *outcomes*; it does not predict *selection* (that is
Agent-Bridge `REQ-p21-test-impact`) and is not the workflow `StepState`
machine. There is deliberately no "tests good" roll-up.

## Verification

Reuses the existing `VerificationState` vocabulary
(`UNVERIFIED | EVIDENCE_COMPLETE | VERIFIED | FAILED`) and defaults to
`UNVERIFIED`. The pack never advances verification state — only
`src/workflows/deliverable.ts` does, and only via a passing evidence gate
plus explicit attestation.

## Change identity

Caller-supplied and preserved verbatim: `changeRef` plus
`changeKind: "COMMIT" | "UNCOMMITTED"`. There is no first-class `Change`
type in this codebase, so no parallel change-identity system is invented
here. Uncommitted work is representable explicitly rather than being
faked as a commit.

## Pack identity

`packIdFor(title)` derives `rcp-<slug>`. Validation requires
`/^rcp-[a-z0-9][a-z0-9-]*$/`, so a pack id **structurally cannot
masquerade as** a verdict id, commit id, requirement id, governance
proposal id (`gov-…`) or evidence id. Slug normalization replaces
**every** invalid span globally, not just the first.

## Bounded context

`maxItemsPerDimension` (default **25**, mirroring the context-layer
convention) bounds each dimension; anything cut is named in
`truncated: string[]`. Requirement context is bounded by **reference**:
only requirements explicitly named in `requirementRefs` are projected, so
a whole-registry dump is structurally impossible. The pack does no
filesystem crawl, no shell, no model call and no authorization.

## Unknown, stale and completeness

`unresolved: PackUnresolvedRef[]` surfaces references that did not resolve
— a named requirement with no supplied record, or a capability ref the
projection cannot verify. Missing context is **reported, never silently
dropped**, and never converted into a negative fact.

There is deliberately **no `complete` flag**: `NO ERROR != COMPLETE
CONTEXT`. A pack can be entirely valid and still be missing context.

## Immutability and determinism

- Sources are never mutated; the pack deep-copies on every read
  (`packChangedFiles`, `packTouchComparison`, `packRequirementContext`,
  `packUnresolved`), so callers cannot reach pack state or leak live
  references to caller-owned arrays.
- Every ordered list uses a **real comparator**. Ordering is by
  `proposalId`/path/ref, never `Map` insertion order. Tests feed
  deliberately scrambled input and assert canonical output.
- `generatedAt` is **caller-supplied** and ISO-validated. No clock is
  called.

## No authority, no persistence

Validation **rejects** any input carrying `approved`, `verdict`,
`authorized`, `authorize`, `merge_authority`, `canMerge`, `canDeploy`,
`apply`, `applied`, `execute`, `executed`, `policyBypass`,
`ownerOverride` or `independentReview`. Credential keys (`apiKey`,
`token`, `password`, `privateKey`, `secret`, `value`) and
credential-looking values are rejected too, mirroring
`assertSecretReferenceShape` (`src/state/types.ts`) and the intent of
`staticSafetyScan` (`src/workflows/promotion.ts`); the repository has no
shared redaction helper.

There is **no store**. A pack is a projection, so owning durable storage
for it would make it a second registry — the exact thing this requirement
says does not yet exist. `REQ-p16-review-context-pack` therefore has no
persistence layer, by design.

## Boundaries with neighbouring systems

- **StewardReport** remains the canonical readiness verdict producer. The
  pack references report/cohort facts and never re-derives readiness.
- **CohortReview** stays advisory with `merge_authority: false`; a pack may
  reference a cohort id but is not elevated by it.
- **CapabilityView** stays a read-only view; the pack references capability
  ids and does not copy ownership, grants, targets or evidence into itself.
- **GovernanceProposal** stays a proposal, never a decision. A pack may
  reference a proposal; it adds no proposal authority.
- **EvidenceGraph** is referenced, not written into — evidence stays opaque
  `string[]` refs per repo convention.
- **TestImpact** predicts selection; this pack records outcomes. Neither is
  derived from the other.
- **WorldStateAudit**: a tool claiming success is not world verification.
  The pack references audit evidence; it never asserts external effects.
- **TokenContextBudget** (P26) owns tokenizer budgeting. The pack is a
  structured context artifact; if it later enters a model context,
  budgeting is P26's job. No tokenizer logic exists here.
- **Independent code review** is a separate concern: this pack prepares
  context, it does not review. `REQ-p19-independent-review-gate` remains
  separately registered and untouched.

Tests: `src/programme/reviewPack.test.ts` (32 tests: validation,
unsafe-path rejection via the shared guard, authority-field and
raw-secret rejection, diff projection, expected-vs-actual touch, impact
`UNAVAILABLE`-with-reason, referenced impact, distinct test outcomes,
verification vocabulary reuse, bounded requirement context, truncation,
stale-ref surfacing, source provenance, determinism from scrambled
insertion, global slug normalization, id anti-masquerade, deep-copied
reads, no live-reference leakage, and the no-authority / no-store /
no-review-execution invariants).
