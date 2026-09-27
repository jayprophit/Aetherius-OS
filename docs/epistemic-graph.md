# REQ-epistemic-graph — Epistemic Status Graph (implemented in MAT)

Status: PROVEN / COMPLETE. Owner: mat.

## Registered scope

Graph traversal over claim epistemic states (depends on the claim registry);
materials knowledge-graph and associative memory graphs are wrong-domain
neighbours.

## Where the implementation lives

**MAT repository**, commit `de72b04` — not in Aetherius-OS, per the ownership
rule (PROGRAMME OWNER != IMPLEMENTATION OWNER):

- `scripts/epistemic-graph.mjs` — `EpistemicGraph` with authored
  SUPPORTS/CONTRADICTS/DERIVED_FROM edges plus registry-derived SUPERSEDES
  projection, directional queries, bounded cycle-safe deterministic traversal.
- `scripts/tests/epistemic-graph.test.mjs` — 16 tests (`node --test`).
- `docs/02-data/11-Epistemic-Graph.md` — MAT-side contract doc.

## Binding distinctions (implemented in MAT, recorded here)

- CLAIM REGISTRY != EPISTEMIC GRAPH — registry owns records/statuses/
  supersession; graph owns edges/traversal. No ClaimRegistry2.
- GRAPH EDGE != SECOND SUPERSESSION OWNER — SUPERSEDES derived from canonical
  `supersedes` fields only, never authored.
- Wrong-domain neighbours untouched: materials knowledge-graph
  (`records/*.yaml` element/isotope relationships) and Aetherius
  EvidenceGraph (execution evidence, another repo).
- No truth engine (RECORDED != VERIFIED, CONTRADICTION != RESOLVED), no
  memory/vector/RAG/compiler, no truth scores, no auto-promotion, no
  reputation-weighted resolution, no LLM arbitration, no similarity-inferred
  edges.

## Gates

- MAT targeted 16/16; MAT related 29/29 (claims + epistemic-graph).
- MAT lint/typecheck NOT_APPLICABLE (plain JS, none configured).
- MAT full suite 101/102 — one pre-existing catalog failure on dirty
  generated publication data, proven unrelated (fails identically in
  isolation, zero references to the new code).
- Aetherius bookkeeping: exact-ID mutation (3 lines, JSON re-parsed, 107
  requirements, exactly 1 match, no other ID touched), registry validation
  243/243, selector retargeted to REQ-p26-context-compiler.
