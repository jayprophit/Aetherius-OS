# Aetherius owned-state architecture (P17/1)

One shared persistence semantic for all Aetherius-owned state. Services must
not invent their own.

## Contract (`src/state/types.ts`)

Every record is a `StateEnvelope`: id, kind, schemaVersion, recordVersion,
createdAt/updatedAt, owner (never an external runtime), provenance,
sensitivity, sha256 integrity over the canonical payload serialization,
optional cause (actor+source audit linkage) and migration history.

Sensitivity classes: PUBLIC, USER, PRIVATE, SYSTEM, SECURITY_SENSITIVE,
SECRET_REFERENCE. `SECRET_REFERENCE` payloads may only carry `{ref}` —
raw credential fields are rejected at save AND load.

## Storage (`src/state/store.ts`)

`FileStateStore` (filesystem backend; interface-first so engines stay
replaceable). Guarantees:

- atomic writes: tmp file + fsync + rename; a crash leaves old or new, never torn;
- load verifies shape, integrity hash and schema version; invalid state throws
  typed `StateError` — never silent reset to defaults;
- optimistic concurrency: `expectedRecordVersion` rejects stale writers
  (no silent last-write-wins);
- removal renames aside first (crash-safe).

## Versioning + migration (`src/state/migrate.ts`)

Judgments: CURRENT / OLDER_SUPPORTED / MIGRATABLE / UNSUPPORTED_FUTURE /
CORRUPT_OR_INVALID. Migrations are explicit, deterministic, version-checked
chains; failures abort visibly; the pre-migration envelope is always
returned as backup. Old state is never deleted by migration.

## Programme integration (`src/state/programmeState.ts`)

Canonical registry JSON stays human-inspectable and Git-diffable. The state
layer loads it through checked paths (missing/malformed fail loudly) and the
existing P16 validator remains authoritative for programme invariants; the
deterministic selector runs unchanged after reload.

## Failure behaviour

Missing, malformed, tampered, unknown-version and future-version states all
throw distinct `StateError` codes. A failed save never overwrites the last
good file (proven by test).

## Security boundary

Policy/approval boundaries are enforced by callers (Agent Bridge gates);
the store guarantees SECRET_REFERENCE shape and audit cause retention so
later credential-vault work (P25) can build on it. Never log or persist raw
secrets through this layer.
