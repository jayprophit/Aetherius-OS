# Execution Target Profile (REQ-p20-execution-target-profile, P20)

Typed schedulable execution-target description: WHAT a target can
provide and UNDER WHAT constraints, so scheduler/placement logic can
compare task requirements against target capabilities without
provisioning anything here.

## Joins (`src/runners/targets.ts`)

Existing contracts reused, not recreated:

- `RunnerKind`/`IsolationNetwork` (runners) — target types extend the
  project vocabulary (`local-directory`, `wsl`, `docker`, `vm-b`,
  `ssh`, `container`); network reuses `none/restricted/open`.
- Placement bounds (placement) — lease/channel/isolation flow into
  placement decisions, not into the profile.
- WorkerPool leases (genesis) — `poolRef` references pools, never
  recreates them.
- Compute signals (providers) — `minCores`/`minRamBytes` are explicit
  numbers (no ambiguous `cpu: 4`).
- HardwareProfile evidence (providers) — optional `hardwareProfileRef`
  (id only); precision requirements verify against MEASURED entries
  through a caller-supplied resolver, unmeasured stays unknown.
- SECRET_REFERENCE discipline (state) — `SecretCapability` carries
  class names + injection flag only; no value field exists; P25 still
  authorizes use.

## Schema

`ExecutionTargetProfile`: targetProfileId (definition id, never a
machine/worker/pool/hardware id), targetType, persistence
(ephemeral/session/persistent — explicit, never inferred from
container/VM), optional minCores/minRamBytes (positive ints),
gpuRequired + optional hardwareProfileRef, optional
minStorageBytes/storagePersistent (scratch vs persistent),
network, optional secrets descriptor, optional workspaceQuotaBytes
(bytes, distinct from host storage), optional cost (explicit
amount+currency+basis, or `unknown`; incomparable costs never
compared as equal), optional poolRef, provenance
(LOCAL_MEASURED/CONFIGURED/PLACEMENT_METADATA/PROVIDER_DECLARED/
UNVERIFIED). Sparse allowed; malformed (NaN/Infinity/negatives/bad
enums) rejected, never normalized.

`checkCompatibility(profiles, {requirements, resolveHardware?})`
returns compatible targets plus per-target exclusion reasons (CPU/RAM/
GPU/storage/workspace/network/secrets/persistence/cost/precision) —
explainable scheduling in the rankForPrecision pattern, never bare
true/false. UNKNOWN cost is "unknown", never "affordable"; declared
types are never treated as available backends.

Boundaries: profile != instance/decision/worker/pool/hardware-profile/
provisioner/security-proof/secrets-store; no placement decisions move
to P20; isolation declarations are not clean-room proof (clean-room
stays BLOCKED); cloud types describe potential, never provisioned
targets.

Tests: `src/runners/targets.test.ts` (7 tests: valid/sparse profiles,
malformed rejection incl. NaN/Infinity, compatibility with reasons,
GPU/network/secret/persistence/cost gates, hardware-evidence
precision, no-secret-values, deterministic listing).
