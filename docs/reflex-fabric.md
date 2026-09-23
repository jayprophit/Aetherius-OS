# Genesis Reflex Fabric (REQ-p22-reflex-fabric, P22)

Fast/bounded/typed probabilistic decision compute. GENESIS REFLEX !=
JEV: backends are replaceable, declared by id+version; no model is
bundled here.

## Layers (`src/genesis/reflex.ts`)

- **S0 deterministic reflex** (`S0RulesBackend`): exact fingerprint/field
  rules, first match wins, rule order is priority. No match returns
  UNRESOLVED with a reason — never a guess. Rules carrying invalid
  decisions are rejected at construction. Backend id
  `deterministic-rules`.
- **Decision contracts**: categorical, binary, ordinal, multilabel, rank
  and abstaining bodies in a versioned `DecisionEnvelope`
  (schema_version, decision_id, task_type, input_fingerprint,
  abstain_probability, backend/version, evidence_refs, provenance).
  `validateDecisionEnvelope` checks structure, distributions,
  selection consistency and ranges.
- **Backend seam** (`ReflexBackend`): S1 backends (encoders, routers,
  small models, optional providers) implement `decide()` on the same
  interface; callers never depend on a backend kind.

## Discipline

- Outputs are SCHEMA-BOUNDED: a valid envelope never claims semantic
  correctness and never mentions zero-hallucination-style guarantees.
- Confidence is data, never authority: abstain probability is advisory;
  P25 remains the only authorizer.
- Reflex references the one Genesis (`reflexGenesis`); it never mints
  identity, in line with the identity rule and temporary-worker bonds.

Tests: `src/genesis/reflex.test.ts` (8 tests: all six kinds, rejection
paths, S0 dispatch determinism, UNRESOLVED honesty, rule validation,
seam replaceability, Genesis reference).
