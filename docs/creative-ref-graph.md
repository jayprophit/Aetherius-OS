# REQ-p29-creative-ref-graph — Creative Reference Graph (implemented in Poietek)

Status: PROVEN / COMPLETE. Owner: poietek.

## Registered scope

Reference-linked creative project graph (style/character/environment refs to
scenes/shots) over canonical project truth; DAW scenes are arrangement, not
visual refs.

## Where the implementation lives

**Poietek repository**, commit `1c55e2f` — not in Aetherius-OS, per the
ownership rule (PROGRAMME OWNER != IMPLEMENTATION OWNER):

- `src/poietek/refs/creativeRefGraph.ts` — scene/shot nodes with stable
  project-scoped ids; STYLE_REF/CHARACTER_REF/ENVIRONMENT_REF edges to
  scene/shot/asset/external targets; refsFor/referencedBy/nodesInProject
  queries; bounded cycle-safe deterministic traversal.
- `tests/creative-ref-graph.test.js` — 19 tests (`node --test`, via the core
  compile pipeline; `tsconfig.core.json` gains the `refs` include).
- `docs/CREATIVE_REF_GRAPH.md` — Poietek-side contract doc.

## Binding distinctions (implemented in Poietek, recorded here)

- REFERENCE GRAPH != ASSET STORE — edges carry refs, never media files.
- REFERENCE TO ASSET != COPIED ASSET; EXTERNAL REF REGISTERED != EXTERNAL
  CONTENT INGESTED.
- Arrangement entities (tracks/clips) unrepresented by design; no
  authorship/licence inference; no generation side effects.
- SAME TEXT != SAME SOURCE; DUPLICATE != CONTRADICTION.
- UNKNOWN REF != EMPTY ASSET (unknown scene/shot targets rejected).
- No scores, ranking, fetching, memory, or MAT/Aetherius graph duplication.

## Gates

- Poietek targeted 19/19; typecheck:core clean (= lint); format:check clean.
- Poietek full suite 340/340 clean.
- Aetherius bookkeeping: exact-ID mutation (3 lines, JSON re-parsed, 107
  requirements, exactly 1 match, no other ID touched), registry validation
  243/243, selector retargeted to REQ-p29-multimodal-consistency.
