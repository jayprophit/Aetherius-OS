# Context Layers (REQ-context-layers, P26)

Layered context retrieval policy (L0–L7) over existing stores — not seven
new databases. Owner: MAT-aligned; implemented against Aetherius stores.

## Layers (`src/context/layers.ts`)

| Layer | Backing |
| --- | --- |
| L0 identity | caller-provided GenesisIdentityRef |
| L1 task | caller-provided task record |
| L2 project | caller-provided project descriptor |
| L3 skill | SkillRegistry via `discoverSkills` |
| L4 memory | UNBOUND — resolves at runtime via Agent Bridge (`memory.query`) |
| L5 file | caller-provided workspace file map (500-char previews) |
| L6 doc | caller-provided doc records |
| L7 archive | OwnedStore envelopes |

`resolveLayers(request, deps)` is pure + deterministic: missing backing
data SKIPs with a reason (never fabricates); UNBOUND layers report their
route; budgets truncate explicitly (`truncated: true`); SECRET_REFERENCE
archive envelopes contribute metadata only — payloads withheld (tested:
the vault ref string never appears in output).

Tests: `src/context/layers.test.ts` (6 tests: layer table, bound
loading, skip honesty, secret withholding, budgets, request validation).
