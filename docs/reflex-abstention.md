# Reflex Abstention (REQ-p22-reflex-abstention, P22)

The reflex may decline a fast decision under uncertainty instead of
guessing. Abstention is a decision-state (uncertainty/non-selection),
not failure, denial, authorization, escalation, approval, or missing
capability. Extends the Reflex Fabric (`reflex.ts`); no Reflex2.

## Contract (`src/genesis/abstain.ts`)

- `Abstention`: decisionId, taskType, inputFingerprint, abstained
  literal true, **required** finite 0..1 abstainProbability (never
  defaulted, never fabricated), non-empty reason list from the closed
  vocabulary (BELOW_THRESHOLD, AMBIGUOUS, CONFLICTING_EVIDENCE,
  OUT_OF_DISTRIBUTION, INSUFFICIENT_EVIDENCE, UNSUPPORTED), optional
  preserved candidates (values + optional probabilities, selection
  stays absent), `calibrated: false` until calibration evidence
  exists (none does — uncalibrated fact preserved), backend/version,
  evidenceRefs, provenance.
- `evaluateAbstention(probability, threshold)`: pure predicate with
  an EXPLICIT threshold argument (configuration/policy/calibrated
  default supplied by the caller); this module defines and defaults
  none. Invalid inputs throw.
- `escalationSignal`: downstream projection for selective-escalation
  (uncertainty, reasons, candidates, task/fingerprint) that decides
  nothing — `requiresHuman` is literally false (abstention !=
  escalation; escalation layer not implemented here).
- Structural guarantees (tested): no selectedValue/selected fields,
  no authorized/denied/escalated/requiresHuman fields, deterministic
  serialization.

Boundaries: ABSTENTION != AUTHORIZATION/DENIAL/POLICY-BLOCK/HUMAN-
ESCALATION; ABSTAIN PROBABILITY != CALIBRATED ERROR RATE; RAW SCORE
!= CALIBRATED PROBABILITY; LOW CONFIDENCE != UNSAFE; P25 still
authorizes; abstention never approves/denies action; no LLM prose
required (reason codes, not explanations).

Tests: `src/genesis/abstain.test.ts` (9 tests: explicit abstentions,
strict bounds incl. 0/1 edges and NaN/Infinity, malformed rejection,
no-selected-value, explicit thresholds, uncalibrated marking,
escalation projection, determinism, non-authority surface).
