# Change Cohort Review Batches (REQ-p16-change-cohort-review, P16)

Batch review strategy over change cohorts. Per-target steward reports
already exist; the cohort — a named batch of change targets rolled up into
one advisory summary plus a deterministic review plan — did not. This is
the cohort layer described in `docs/steward.md`; it adds no review
capability of its own.

## Read model (`src/steward/cohorts.ts`)

`summarizeCohort({ cohortId, targets, reports, maxBatchSize, generatedAt })`
returns a `CohortReview`:

- `members` — one `CohortMember` per target, keyed by the existing
  `reportStateId(target)` durable id.
- `readiness` — the rollup: `verdict`, `readyCount`, `notReadyCount`,
  `unknownCount`, `blockingCount`, `warningCount`, `reasons`, and
  `merge_authority: false`.
- `batches` — fixed-size review batches from `planCohortBatches`.

Cohort durable ids are `cohortStateId(cohortId)` →
`steward-cohort-<cohortId>`, which satisfies the P17 state-id grammar
(`store.ts` rejects anything outside `[a-z0-9][a-z0-9_-]*`).

## Verdict reuse, not re-derivation

Member verdicts are read verbatim from stored `StewardReport.readiness`.
Cohorts never call `evaluateReadiness` on findings themselves: one verdict
vocabulary, one producer. A member with no stored report is `unknown`, and
a cohort containing one is `unknown` — omission is never upgraded to
`ready`.

Rollup precedence: any `not_ready` member → `not_ready`; else any
`unknown` → `unknown`; else `ready`. So one blocking member outranks an
unreported one, and a cohort can only be `ready` when every member
actually reported ready.

## Deterministic batching

`planCohortBatches` orders members by triage rank (`not_ready`, then
`unknown`, then `ready`) with the report id as tie-break, then chunks by
`maxBatchSize`. The same member set always yields the same plan, so a
cohort review is reproducible and diffable across runs.

## Hard invariant: advisory only

Every rollup carries `merge_authority: false`, matching the steward
invariant in `docs/steward.md`. The cohort surface exposes no `grant`,
`merge`, `approve` or `authorize` capability (tested on the module export
names, the `CohortReviewStore` prototype, and the rollup values).
Validation additionally rejects any input report whose readiness claims
`merge_authority` — a report asserting authority it can never hold is
hostile input, not a fact.

## Durable cohort reviews

`CohortReviewStore` mirrors `StewardReportStore`: kind `steward.cohort`,
provenance `p16-change-cohort-review`, integrity hashes, optimistic
concurrency, append-by-revision with `createdAt` preserved, and
`cohort-id` drift rejected on update. Invalid cohorts fail before any
state is written.

## Scope boundary

Cohort members are `ReviewTarget`s. Change fingerprinting, touched-path
estimation and impact analysis stay with `TouchEstimate`
(`src/workers/touch.ts`) and the pending `REQ-p20-change-impact`; a
cohort composes verdicts and does not estimate changes.

Tests: `src/steward/cohorts.test.ts` (19 tests: verdict rollup,
unknown-is-not-ready, blocking-outranks-unknown, stored verdict reused
rather than re-derived, deterministic triage batching, validation
including authority-claiming and target-drift reports, durable
round-trip with integrity and revisions, tamper detection, and the
authority invariants).
