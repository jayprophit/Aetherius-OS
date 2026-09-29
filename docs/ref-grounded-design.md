# REQ-p29-ref-grounded-design — Reference-Grounded Design Rule (implemented in Poietek)

Status: PROVEN / COMPLETE. Owner: poietek.

## Registered scope

Design outputs cite reference IDs plus deltas; composes with the creative
graph and consistency dimensions.

## Where the implementation lives

**Poietek repository**, commit `d6bd674` — not in Aetherius-OS, per the
ownership rule (PROGRAMME OWNER != IMPLEMENTATION OWNER):

- `src/poietek/design/refGroundedDesign.ts` — `validateGrounding()` checks
  every design-output citation resolves in the ref graph (node id or recorded
  edge-target key) with explicit deltas; unresolved ids reported without
  verdicts; caller evaluation refs preserved uninterrupted.
- `tests/ref-grounded-design.test.js` — 10 tests (`node --test`, via the
  core compile pipeline; `tsconfig.core.json` gains the `design` include).
- `docs/REF_GROUNDED_DESIGN.md` — Poietek-side contract doc.

## Binding distinctions (implemented in Poietek, recorded here)

- GROUNDING VALIDATION != GENERATION; INCONSISTENCY DETECTED != FIXED.
- UNKNOWN != GROUNDED; unresolved citations reported, never verdicts.
- DUPLICATE CLAIM != CONTRADICTION (identical re-citation collapses;
  differing deltas stay separate).
- DECLARED DELTA != OBSERVED DIFFERENCE (deltas recorded, never verified
  against media).
- No scores, ranking, QA, auto-repair, memory, or MAT/Aetherius graph
  duplication.

## Gates

- Poietek targeted 10/10 (one fixture correction — canonical edge-target
  keys, not bare asset names); related 46/46 (design + ref-graph +
  consistency); typecheck:core clean (= lint); format:check clean.
- Poietek full suite 367/367 clean.
- Aetherius bookkeeping: exact-ID mutation (3 lines, JSON re-parsed, 107
  requirements, exactly 1 match, no other ID touched), registry validation
  243/243, selector retargeted to REQ-p29-visual-qa.
