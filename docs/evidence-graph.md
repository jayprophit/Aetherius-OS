# Evidence Graph (REQ-p16-evidence-graph, P16)

Cross-system evidence graph: unified join over task, workflow, step,
model, policy, action, verification, test, artifact, commit and
evidence ids. Programme depgraph (system dependencies) and memory
graphs (associations) are wrong-scope neighbours; this graph joins
per-system identifiers so a completion claim traces to its evidence
across systems.

## Read model (`src/programme/evidenceGraph.ts`)

Nodes (`kind:id`, 11 kinds) and edges (`from/to`, closed relation
vocabulary CHILD_OF/PRODUCED_BY/VERIFIED_BY/EVIDENCE_FOR/DECIDED_BY/
EXECUTED_BY/TESTED_BY, mandatory provenance). Recorded facts only:
validated on write (kinds, non-empty ids, known relations, no
self-loops), identical re-records idempotent. Queries: `neighbors`
(both directions, deterministic), `related` (bounded cycle-safe BFS
transitive closure), `path` (shortest BFS path, empty when
unconnected). No execution, no authority, no scoring.

Tests: `src/programme/evidenceGraph.test.ts` (5 tests: end-to-end
task→evidence join, neighbours/closure determinism, idempotence,
malformed rejection, cycle safety).
