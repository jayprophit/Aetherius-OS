# Worker Profiles (REQ-p20-worker-profiles, P20)

Versioned worker profiles as spawn templates for the P20 pool.
HOW TO SPAWN A TEMPORARY SPECIALIST — never who a second AI person
is. ONE GENESIS + TEMPORARY WORKERS, always.

## Schema (`src/workers/profiles.ts`)

`WorkerProfile`: workerProfileId (template id, never a worker/task/
pool/target/hardware/model id), version x.y.z (immutable revisions),
role (functional label, never authority), capabilities (requested refs;
REQUESTED != AVAILABLE != AUTHORIZED), modelRequirements (subset shape:
modalities/minContext/reasoning/coding/localOnly/precision —
requirements, not selection; satisfiability stays honest while Model
Fabric is BLOCKED), skillRefs (resolved at spawn, never embedded),
toolRefs (requested, never permitted), grantRefs (required, never
approved — P25 decides at spawn), touchHints (workspace-relative safe
paths; hint != actual via `touch.ts`), budget (explicit units;
unknown != zero/unlimited), workspace (symbolic classes/scopes, no
machine paths, no absolute paths), evidenceContract (EvidenceRequirement
refs, never a second gate), targetRequirements (TaskRequirements
reused for `checkCompatibility`, never duplicated), termination
(allowlist conditions + optional maxLeaseMs; profile version != worker
lease), provenance. Sparse allowed; malformed rejected.

Structurally absent by design: identity, memory, wallet, secret
values (tested via key inventory), second registries/factories.

## Registry + spawn flow

`WorkerProfileRegistry`: validated registration, deterministic
listing; identical re-registration idempotent; same id+version with
different content conflicts (versions immutable); newer versions are
new revisions. `projectSpawnTemplate` resolves skill refs and projects
pool inputs (capabilityScope, ttlMs from maxLeaseMs, hints, refs,
evidence contract, target requirements) WITHOUT spawning — WorkerPool
remains the only spawner and still enforces bounds/leases/task
binding/P25 authorization. `profileSchedulability` delegates resource
compatibility to the target-profile check (UNDETERMINED when the
profile states no target requirements).

Tests: `src/workers/profiles.test.ts` (10 tests: minimal/full
registration, idempotence/conflict, identity separation, malformed
rejection, no-identity-fields, spawn projection with skill
resolution, grant non-approval, hint preservation, schedulability
delegation, role non-authority).
