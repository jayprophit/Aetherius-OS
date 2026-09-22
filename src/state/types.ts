/**
 * P17/1 owned-state contracts. One shared persistence semantic for all
 * Aetherius-owned state; services must not invent their own.
 */

export type SensitivityClass =
  | "PUBLIC"
  | "USER"
  | "PRIVATE"
  | "SYSTEM"
  | "SECURITY_SENSITIVE"
  | "SECRET_REFERENCE";

export type SchemaJudgment =
  | "CURRENT_SCHEMA"
  | "OLDER_SUPPORTED_SCHEMA"
  | "MIGRATABLE_SCHEMA"
  | "UNSUPPORTED_FUTURE_SCHEMA"
  | "CORRUPT_OR_INVALID_STATE";

/** Minimal audit linkage: every mutation records who/what caused it. */
export interface StateCause {
  actor: string;
  source: string;
}

export interface StateEnvelope<T = unknown> {
  /** Stable identity, e.g. "programme". */
  id: string;
  /** State family, e.g. "registry". */
  kind: string;
  /** Schema version this envelope was written with, e.g. 1. */
  schemaVersion: number;
  /** Monotonic record version for optimistic concurrency. */
  recordVersion: number;
  createdAt: string;
  updatedAt: string;
  /** Namespace owner, e.g. project id. Never an external runtime. */
  owner: string;
  provenance: string;
  sensitivity: SensitivityClass;
  /** Hex sha256 over the canonical payload serialization. */
  integrity: string;
  causedBy?: StateCause;
  migrationHistory?: Array<{ from: number; to: number; at: string }>;
  payload: T;
}

export type StateErrorCode =
  | "STATE_NOT_FOUND"
  | "STATE_MALFORMED"
  | "STATE_SCHEMA_UNKNOWN"
  | "STATE_SCHEMA_TOO_NEW"
  | "STATE_INTEGRITY_MISMATCH"
  | "STATE_VERSION_CONFLICT"
  | "STATE_VALIDATION_FAILED"
  | "STATE_MIGRATION_FAILED"
  | "STATE_PERMISSION_DENIED";

export class StateError extends Error {
  readonly code: StateErrorCode;
  constructor(code: StateErrorCode, message: string) {
    super(message);
    this.name = "StateError";
    this.code = code;
  }
}

/** SECRET_REFERENCE envelopes may only carry a pointer, never raw secrets. */
export function assertSecretReferenceShape(payload: unknown): void {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new StateError("STATE_VALIDATION_FAILED", "SECRET_REFERENCE payload must be an object");
  }
  const keys = Object.keys(payload);
  if (!keys.includes("ref")) {
    throw new StateError("STATE_VALIDATION_FAILED", "SECRET_REFERENCE payload must contain ref");
  }
  for (const banned of ["value", "secret", "token", "password", "apiKey", "privateKey"]) {
    if (keys.includes(banned)) {
      throw new StateError(
        "STATE_VALIDATION_FAILED",
        `SECRET_REFERENCE payload must not contain raw credential field ${banned}`,
      );
    }
  }
}
