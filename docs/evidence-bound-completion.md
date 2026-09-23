# Evidence-Bound Completion Gate (REQ-p19-evidence-bound-completion, P19)

Generic platform rule: a task is not proven-complete while required
evidence is missing. Skill promotion enforces this for skills only;
this module states the generic form without touching the proven
promotion rule.

## Gate (`src/workflows/evidenceGate.ts`)

`checkEvidenceGate(required, provided)`:

- Every required key needs at least one provided entry with
  `passed: true` (kinds: test-report, evaluation, verification,
  artifact, approval).
- Missing keys → `missing[]`; present-but-failing keys → `failed[]`;
  unrequired keys → `extra[]` (informational, never a failure).
- Verdict `COMPLETE` only when both lists are empty; empty requirements
  are vacuously COMPLETE (documented).
- Malformed requirement keys (empty/duplicated) and evidence (unknown
  kind, missing key/ref) throw.

The gate is classification only: its result shape is exactly
`{verdict, missing, failed, extra}` — no approve/merge/execute surface
exists (tested).

Tests: `src/workflows/evidenceGate.test.ts` (6 tests: completion,
missing/failed separation, extras, vacuity, malformed rejection,
no-authority surface).
