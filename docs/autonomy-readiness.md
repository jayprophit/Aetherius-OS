# Autonomy Readiness (REQ-p16-autonomy-readiness, P16)

Machine-verifiable, per-dimension repository readiness for automated
work: can a bounded agent reliably build, test, observe and recover
here? Dimension statuses only — NO universal score, percentage,
stars, or opaque verdict anywhere (tested structurally).

## Contract (`src/programme/readiness.ts`)

- 14 canonical dimensions: WORKTREE_STATE, BUILD, LINT, TYPECHECK,
  TEST_DISCOVERY, TEST_EXECUTION, REPRO_ENV, SANDBOX, DOC_FRESHNESS,
  OBSERVABILITY, SECRET_SCAN, DEPENDENCY_SCAN, ROLLBACK, RECOVERY.
- Statuses: PASS, FAIL, BLOCKED, NOT_APPLICABLE, UNAVAILABLE,
  MISSING_EVIDENCE, STALE, HUMAN_REQUIRED.
- `ReadinessAssessment` binds repository + commit + environment +
  timestamp; dimensions carry status, evidenceRefs, reason, optional
  command/observedValue. PASS requires recorded evidenceRefs
  (DECLARED != VERIFIED); every dimension needs a reason; duplicates
  and unknown dimensions/statuses rejected.
- `attentionNeeded`: informational non-PASS/non-N/A list, never a
  score. `isCurrentFor`: a new commit invalidates currentness (old
  assessments never carried over silently). `canonicalReadiness`:
  deterministic serialization.

Boundaries: autonomy readiness != five-star maturity (quality) !=
steward PR-readiness (governance) != public release readiness
(product) — separate docs/consumers, no shared fields. NOT_APPLICABLE
is legitimate (no lint/build gate ≠ PASS). Human-only dimensions
stay in HUMAN_RELEASE_VALIDATION.

Tests: `src/programme/readiness.test.ts` (6 tests: evidenced
dimensions, malformed rejection incl. PASS-without-evidence,
attention-without-scoring, commit binding, determinism, concept
separation).
