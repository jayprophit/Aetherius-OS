# REQ-p31-deployment-profile — Deployment Qualification Profile (metrics, never a score)

Status: PROVEN / COMPLETE. Owner: aetherius-os.

## Registered scope

Deployment readiness metrics (accuracy, reliability, escalation/human-review
rates, model+execution+review costs, residual risk, evidence coverage,
recovery success) as multidimensional profile; declarations exist, metrics
do not; never a universal score.

Prior state: no deployment/profile/release TS modules existed anywhere;
release-gate declarations live in docs only. The seven quantities had no
measured representation — that is the implemented gap.

## What was built

`src/release/deploymentProfile.ts` — `buildProfile()`, `derivedRates()`,
`measuredCount()`. `src/release/deploymentProfile.test.ts` — 23 tests.

## Binding distinctions (tested)

- MULTIDIMENSIONAL PROFILE != UNIVERSAL SCORE — seven slots, each
  measured-or-missing; no blended field exists anywhere in the output.
- MEASURED != ESTIMATED — caller-supplied observations with method, evidence,
  provenance, and time; the module measures nothing itself.
- MISSING != ZERO — absent dimensions report UNAVAILABLE with reasons.
- Each dimension keeps its own units (rates in [0,1] with support, costs in
  caller-declared units never converted, risk as level+rationale never a
  fabricated probability, coverage/recovery counts with derived rates).
- PROFILE != DEPLOYMENT EXECUTION / AUTHORIZATION; release scope untouched
  (OWNER_GATED); no placement (P30 untouched).
- TARGET DESCRIPTION != TARGET INSTANCE; RELEASE ARTIFACT != DEPLOYED SYSTEM.
- Timestamps caller-supplied with identity preserved. Deterministic
  canonical ordering; scrambled-input equality; no caller mutation; no
  clock/network.
- Validation precedence: authority/secret/persona violations before generic
  unknown-field errors. Strict closed shapes. Finite-number validation
  (NaN/Infinity rejected, never clamped).
