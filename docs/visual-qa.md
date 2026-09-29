# REQ-p29-visual-qa — Visual QA Dimension Suite (implemented in Poietek)

Status: PROVEN / COMPLETE. Owner: poietek.

## Registered scope

Visual evaluation dimensions (reference/style/character consistency,
continuity, AV sync, UI correctness) feeding promotion/eval runners.

## Where the implementation lives

**Poietek repository**, commit `232cedb` — not in Aetherius-OS, per the
ownership rule (PROGRAMME OWNER != IMPLEMENTATION OWNER):

- `src/poietek/qa/visualQa.ts` — `evaluateVisualQa()` over the six
  registered dimensions: reference/style/character consistency consumed
  from grounding reports and consistency results (never reimplemented),
  plus declared continuity/AV-sync/UI checks.
- `tests/visual-qa.test.js` — 17 tests (`node --test`, via the core
  compile pipeline; `tsconfig.core.json` gains the `qa` include).
- `docs/VISUAL_QA.md` — Poietek-side contract doc.

## Binding distinctions (implemented in Poietek, recorded here)

- AUTOMATED VISUAL QA != HUMAN VISUAL APPROVAL.
- UNKNOWN stays UNKNOWN; missing artifacts never pass or fail.
- EXPECTED vs OBSERVED always explicit; SOURCE METADATA != RENDERED STATE.
- PARTIAL OBSERVATION != COMPLETE PROOF; FRAME QA != VIDEO QA.
- No model judgement anywhere; deterministic canonical ordering; no caller
  mutation; no clock/network.

## Gates

- Poietek targeted 17/17; related 63/63 (visual-qa + ref-grounded-design +
  ref-graph + consistency); typecheck:core clean (= lint); format:check
  clean.
- Poietek full suite 384/384 clean.
- Aetherius bookkeeping: exact-ID mutation (3 lines, JSON re-parsed, 107
  requirements, exactly 1 match, no other ID touched), registry validation
  243/243, selector retargeted to REQ-p31-deployment-profile.
