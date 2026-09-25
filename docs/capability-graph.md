# Capability Graph (REQ-p16-capability-graph, P16)

Read-only cross-reference view answering "what capabilities exist, who
owns them, and what governs them". The programme depgraph
(`src/programme/depgraph.ts`) maps system→system dependencies and the
evidence graph joins evidence ids; this graph projects *capability*
identity across the registries that already own those records.

A view, not a registry. `src/programme/capabilityGraph.ts` holds no
canonical capability records, mints no capability ids, and exposes no
mutate/authorize/execute/install/provision surface. Authorization stays
with P25, execution stays with
`REQ-desktop-capability-fabric` — whose data is never read or written
here.

## Node model

`CapabilityNode` carries `capabilityId`, `owner`, optional `schemaRef`,
`risk` (`low|medium|high|critical|unknown`), and reference arrays:
`requirementRefs`, `grantRefs`, `adapterRefs`, `targetRefs`,
`verificationRefs`, `evidenceRefs`, `benchmarkRefs`. Latency is
`latencyMs` + `latencySource` and only ever appears as measured
evidence; absent stays absent.

Validation (`validateCapabilityNode`) rejects empty
`capabilityId`/`owner`/`provenance`, empty-string refs, unknown `risk`,
and a `latencyMs` that is non-finite, negative, or missing its source.

## Read model

`new CapabilityView({ nodes })` validates every node, rejects duplicate
capability ids, and deep-copies on construction and on every read, so
callers cannot mutate view state. Queries are deterministic
(capability-id sorted): `list`, `byId`, `byOwner`, `byRequirement`,
`byAdapter`, `byTarget`, `byGrant`, `withEvidence`, `withoutEvidence`.

`lintView(view, known)` reports `requirementRefs`/`adapterRefs`/
`targetRefs` that resolve against nothing supplied. A dimension not
supplied is left silent — unchecked is not the same as missing, and
nothing is dropped or auto-filled.

## Composition

`composeCapabilityView({ skills, apps, targets, hardware })` projects
authoritative registries without duplicating them:

- `skill:<skill_id>@<version>` — owner P19, risk from `risk_class`
  (anything unrecognised becomes `unknown`, never `low`), grants from
  `required_permissions`.
- `app:<id>:<capability>` — owner P10, grants from app `permissions`.
- `target:<targetProfileId>` — owner P20, `REQ-p20-execution-target-profile`.
- `hardware:<profileId>` — owner P18, `REQ-p18-hardware-profiles`, and
  the first `MEASURED` precision latency as `latencyMs`/`latencySource`.

Worker/tool/model refs pass through verbatim from their own registries.

Tests: `src/programme/capabilityGraph.test.ts` (6 tests: deterministic
projection and per-dimension query discrimination, malformed and
duplicate rejection, no mutation/authorization/execution surface,
stale-ref reporting with silent unchecked dimensions, composition from
authoritative registries without minting ids, unknown risk preserved).
