# Independent Model Review Gate (REQ-p19-independent-review-gate, P19)

Composition of the existing review/verification gates into one change-pipeline
gate, plus the **model-review leg** — which exists and is `UNAVAILABLE`.
Implementation: `src/programme/independentReview.ts`.

The registered requirement is the scope authority:

> Executable independent-model reviewer composed into the change pipeline
> (impact, context, static, model review, security, verify/repair/reject);
> gates exist, model-gate and composition do not; emits clean-room-ready
> evidence without claiming fresh-env proof while clean-room is blocked.

## The two missing things were the whole scope

1. **The composition.** Individual gates already existed across the codebase;
   nothing joined them, so a change's review state could not be read as a
   whole.
2. **The model-review leg.** It exists here and is `UNAVAILABLE`, because
   `REQ-p18-model-fabric` is `BLOCKED` on cloud credentials.

## Legs, in pipeline order

`impact` · `context` · `static` · `model-review` · `security` · `verification`

Each leg keeps its **own** state from
`PASS | FAIL | BLOCKED | UNAVAILABLE | MISSING_EVIDENCE`. There is no
`SKIPPED` and no `N/A` — a state meaning "fine, we did not check" does not
exist.

## No fallback reviewer

`modelReviewLeg` requires a `blockerRef`, so unavailability always has a
traceable cause. It substitutes **nothing**: no other provider, no local model
presented as independent, no hardcoded approval, no "temporary pass".

```
MISSING REVIEWER   != REVIEW SUCCESS
MODEL REVIEW       != CLEAN-ROOM PROOF
```

## The gate cannot pass by omission

Every registered leg appears in the report even when **zero** evidence is
supplied, as `MISSING_EVIDENCE`. Omitting the model leg does not remove the
requirement to have it — it converts a stated unavailability into an
unexplained gap. And **every non-`PASS` leg must carry a reason**, or
composition throws: an unexplained failure is not reviewable.

## Outcome is derived, never weighted

| Condition | Outcome |
| --- | --- |
| any leg `FAIL` | `REVIEW_FAILED` |
| all legs `PASS` | `REVIEW_READY` |
| otherwise | `REVIEW_INCOMPLETE` |

A per-leg derived policy. There is **no** composite score, rating,
confidence percentage, rank or grade — `noCompositeScore: true` and no such
field exists.

## Clean-room-READY is never clean-room-PROVEN

`cleanRoomProven` is a **type-level literal `false`**. `REQ-p20-clean-room`
is `BLOCKED` for want of an isolated backend, and no amount of internal review
supplies one. Passing `cleanRoomProven: true` is rejected as an unknown
input field.

```
CLEAN-ROOM-READY        != CLEAN-ROOM-PROVEN
READY FOR CLEAN-ROOM    != CLEAN-ROOM EXECUTED
INTERNAL REVIEW         != FRESH-ENVIRONMENT VERIFICATION
```

## Independence is recorded, never inferred

`sameActor`, `reviewerRef` and `changeProducerRef` are all **required**. A
self-review stays labelled self-review, and running the analysis in a
different function or module does not make it an independent actor.

```
SELF REVIEW        != INDEPENDENT REVIEW
DIFFERENT FUNCTION != INDEPENDENT ACTOR
REVIEW CONTEXT     != REVIEW VERDICT
STEWARD REPORT     != INDEPENDENT REVIEW
COHORT REVIEW      != INDEPENDENT REVIEW
TEST PASS          != INDEPENDENT REVIEW
WORLD VERIFICATION != INDEPENDENT REVIEW
```

## Reuse, not duplication

The gate **composes** and **owns none** of its inputs:

| Leg input | Reused from |
| --- | --- |
| impact / touch / unresolved | `PackImpact`, `PackTouchComparison`, `PackUnresolvedRef` — `src/programme/reviewPack.ts` |
| security findings | `SecurityFinding` — `src/workflows/promotion.ts` |
| verification state | `VerificationState` — `src/workflows/deliverable.ts` |
| evidence gate | `checkEvidenceGate` — `src/workflows/evidenceGate.ts` |
| readiness verdict | `ReadinessVerdict` — `src/steward/types.ts` |
| contamination fairness | `ContaminationStatus` — `src/eval/contamination.ts` |

`evidenceLeg` **delegates** to the existing `checkEvidenceGate` and reports
what it concluded, preserving its missing-versus-failed distinction. No
`Reviewer2`, `EvidenceGraph2`, `ReviewContextPack2`, `Steward2`, `TestImpact2`
or `WorldAudit2`, and no runner, executor, engine, service, store, registry
or graph surface.

## No authority

`noMergeAuthority: true`, and no `merge`, `deploy`, `authorize`, `approve`,
`push` or `publish` surface exists. A passing review is not merge authority
and not execution authority. P25 remains the authority plane and is untouched.

```
REVIEW PASSED != MERGE AUTHORITY
REVIEW PASSED != EXECUTION AUTHORITY
```

## Boundaries

- Composes evidence; decides nothing and approves nothing.
- No clock: `assessedAt` is caller-supplied.
- Legs are ordered by pipeline position with a **real comparator**; ordering
  is asserted from deliberately scrambled input.
- Unrecognised input keys are rejected rather than silently dropped.
- `gateId` is `irev-<slug>`, structurally distinct from requirement, cohort
  (`bcont-`), governance proposal (`gov-`) and review pack (`rcp-`) ids.

## Source honesty

The registered source is a `RESEARCH_NOTE` reference (*"review research"*).
**No primary source document exists in this repository**, so no citation is
claimed. `RESEARCH_NOTE != CITATION`.

## Release effect

**NONE.** No release gate is re-scored; public release remains
`NOT YET RELEASE-PROVEN`, scope `UNDEFINED`, `REQ-p31-release-scope`
`OWNER_GATED`.

Tests: `src/programme/independentReview.test.ts` (30 tests).
