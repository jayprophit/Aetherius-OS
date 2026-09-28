# REQ-p29-multimodal-consistency — Consistency Dimensions as Scorer-Registry Entries (implemented in Poietek)

Status: PROVEN / COMPLETE. Owner: poietek.

## Registered scope

Consistency dimensions across generated assets as scorer-registry entries
(never a universal score); generation routing exists, consistency scoring
does not.

## Where the implementation lives

**Poietek repository**, commit `1a376c2` — not in Aetherius-OS, per the
ownership rule (PROGRAMME OWNER != IMPLEMENTATION OWNER):

- `src/poietek/consistency/multimodalConsistency.ts` — scorer registry with
  character/style/environment dimensions grounded in the ref-graph
  vocabulary; per-dimension evaluation (agreement/conflict/unknown);
  `evaluateAll` with no universal score.
- `tests/multimodal-consistency.test.js` — 17 tests (`node --test`, via the
  core compile pipeline; `tsconfig.core.json` gains the `consistency`
  include).
- `docs/MULTIMODAL_CONSISTENCY.md` — Poietek-side contract doc.

## Binding distinctions (implemented in Poietek, recorded here)

- CONSISTENCY != SIMILARITY; SAME LOOK != SAME CANONICAL CHARACTER.
- DECLARED REF != OBSERVED MEDIA FACT (no media observation exists).
- UNKNOWN != CONSISTENT; NO CONTRADICTION OBSERVED != CONSISTENCY PROVEN.
- CONFLICT != AUTOMATIC RESOLUTION; INCONSISTENCY DETECTED != FIXED.
- SAME REFERENCE SET != SAME ASSET; ASSET ID != LATEST ASSET VERSION.
- No scores, ranking, auto-repair, generation, model judgment, memory, or
  MAT/Aetherius graph duplication.

## Gates

- Poietek targeted 17/17; typecheck:core clean (= lint); format:check clean.
- Poietek full suite 357/357 clean.
- Aetherius bookkeeping: exact-ID mutation (3 lines, JSON re-parsed, 107
  requirements, exactly 1 match, no other ID touched), registry validation
  243/243, selector retargeted to REQ-p29-ref-grounded-design.
