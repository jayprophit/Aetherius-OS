# REQ-p25-reputation — Contribution-Scored Reputation over Validated Actions

Status: PROVEN / COMPLETE. Owner: aetherius-os.

## Registered scope

Contribution-scored reputation over validated actions; docs-only mentions
today, no scoring code.

Prior state: no scoring code existed anywhere — the word "trust" appears only
in unrelated owners (package trust metadata, sealed-vault trust machines,
scheduler claim semantics), all untouched. The scoring unit is the
CONTRIBUTION, not a person, model, provider, or social score.

## What was built

`src/reputation/contribution.ts` — `validateAction()`, `rateSubject()`,
`rateAll()`. `src/reputation/contribution.test.ts` — 24 tests.

## Binding distinctions (tested)

- SELF-REPORTED SUCCESS != VERIFIED SUCCESS — unverified actions excluded
  from every tally; verified=true requires a verificationRef.
- TASK FAILED != SUBJECT CAUSED FAILURE, symmetrically both ways —
  attribution gates counting for successes and failures alike.
- NO HISTORY != BAD/GOOD REPUTATION; UNKNOWN != ZERO — cold subjects report
  UNKNOWN with explicitly empty tallies, never a zero rating.
- DUPLICATE REFERENCE != ADDITIONAL EVIDENCE — same actionId twice rejected;
  shared evidence refs deduplicated.
- EXPLICIT TALLY != UNIVERSAL TRUST SCORE — integer counts only (no floats
  anywhere); no 0–100, stars, grades, or composites.
- REPUTATION != AUTHORIZATION/APPROVAL/ROLE/IDENTITY/CAPABILITY — view keys
  asserted exact; no permission, grant, or policy fields.
- REPUTATION UPDATE != POLICY SIDE EFFECT — pure functions, no grants,
  revocations, spawns, bans, or lifecycle changes.
- REPUTATION SUBJECT REF != IDENTITY REGISTRY — subjects opaque, never
  owned, resolved, or transferred across identities.
- HIGH REPUTATION != CLAIM TRUE; LOW REPUTATION != CLAIM FALSE.
- Evidence stays owned elsewhere (evidenceRefs carried, never duplicated);
  no audit mutation, no completion recomputation, no calibration reuse.
- Timestamps caller-supplied (GENERATED TIME != OBSERVED TIME).
- Deterministic canonical ordering; scrambled-input equality; no caller
  mutation.
- Validation precedence: authority/secret/persona violations before generic
  unknown-field errors. Strict closed shapes.
