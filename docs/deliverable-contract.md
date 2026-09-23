# Deliverable Contract (REQ-p19-deliverable-contract, P19)

Generic finished-deliverable contract, platform-wide. Skill packages
and Bridge handoffs prove their scopes only; this module states what
counts as delivered anywhere.

## Contract (`src/workflows/deliverable.ts`)

A `Deliverable` declares artifacts (keys + optional sha256),
required evidence (reusing `EvidenceRequirement`), and a
`verificationState` (UNVERIFIED, EVIDENCE_COMPLETE, VERIFIED, FAILED).

`assessDeliverable` (pure, never mutates):

- artifacts present (hash-checked when both sides declare hashes) →
  `missingArtifacts` / `hashMismatches` listed otherwise;
- evidence via `checkEvidenceGate` (promotion rule untouched);
- `delivered` only when the gate passes AND artifacts check out;
- state machine per assessment: UNVERIFIED → EVIDENCE_COMPLETE on
  pass; failed gates never advance (UNVERIFIED/FAILED stay); a
  previously advanced state with newly failing inputs regresses to
  FAILED; VERIFIED persists only while still delivered.

`attestVerification`: EVIDENCE_COMPLETE → VERIFIED on explicit
attestation (verifier + method + timestamp) only. Anything else is
rejected — verification is never automatic.

Tests: `src/workflows/deliverable.test.ts` (5 tests: delivery,
missing/hash/evidence failures, regression, attestation gating,
malformed rejection).
