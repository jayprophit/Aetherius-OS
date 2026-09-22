import type { StateEnvelope, StateErrorCode } from "./types";
import { StateError } from "./types";

export interface Migration {
  from: number;
  to: number;
  migrate: (payload: unknown) => unknown;
}

/**
 * Deterministic, testable migration chain. Rules:
 * - source and target versions are checked explicitly;
 * - the original envelope is never mutated (a migrated copy is returned,
 *   and the caller decides persistence, keeping a backup first);
 * - any failure aborts with STATE_MIGRATION_FAILED, never partial state.
 */
export function migrateEnvelope<T>(
  envelope: StateEnvelope,
  targetVersion: number,
  migrations: Migration[],
  now: () => string = () => new Date().toISOString(),
): { envelope: StateEnvelope<T>; backup: StateEnvelope } {
  if (!Number.isInteger(envelope.schemaVersion) || envelope.schemaVersion < 1) {
    throw new StateError("STATE_MIGRATION_FAILED", "source schema version is invalid");
  }
  if (envelope.schemaVersion === targetVersion) {
    return { envelope: envelope as StateEnvelope<T>, backup: envelope };
  }
  if (envelope.schemaVersion > targetVersion) {
    const err: StateErrorCode = "STATE_SCHEMA_TOO_NEW";
    throw new StateError(err, `schema v${envelope.schemaVersion} is newer than target v${targetVersion}`);
  }
  const backup: StateEnvelope = JSON.parse(JSON.stringify(envelope)) as StateEnvelope;
  let current: StateEnvelope = JSON.parse(JSON.stringify(envelope)) as StateEnvelope;
  const chain = [...migrations].sort((a, b) => a.from - b.from);
  while (current.schemaVersion < targetVersion) {
    const step = chain.find((m) => m.from === current.schemaVersion);
    if (!step) {
      throw new StateError(
        "STATE_MIGRATION_FAILED",
        `no migration registered from schema v${current.schemaVersion} to v${targetVersion}`,
      );
    }
    let payload: unknown;
    try {
      payload = step.migrate(current.payload);
    } catch (error) {
      throw new StateError(
        "STATE_MIGRATION_FAILED",
        `migration v${step.from}->v${step.to} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    current = {
      ...current,
      schemaVersion: step.to,
      payload,
      updatedAt: now(),
      migrationHistory: [
        ...(current.migrationHistory ?? []),
        { from: step.from, to: step.to, at: now() },
      ],
    };
  }
  return { envelope: current as StateEnvelope<T>, backup };
}
