import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, fsyncSync, openSync, closeSync } from "node:fs";
import { join } from "node:path";
import type { SchemaJudgment, StateEnvelope } from "./types";
import { StateError, assertSecretReferenceShape } from "./types";

export function canonicalSerialize(payload: unknown): string {
  return JSON.stringify(payload);
}

export function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export interface SaveOptions {
  /** Optimistic concurrency: fail unless current recordVersion matches. */
  expectedRecordVersion?: number;
  causedBy?: { actor: string; source: string };
  now?: () => string;
}

export interface OwnedStore {
  readonly root: string;
  exists(id: string): boolean;
  load<T>(id: string): StateEnvelope<T>;
  save<T>(envelope: StateEnvelope<T>, options?: SaveOptions): StateEnvelope<T>;
  remove(id: string): void;
  judgeSchema(version: number, currentVersion: number): SchemaJudgment;
}

function fileFor(root: string, id: string): string {
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id)) {
    throw new StateError("STATE_VALIDATION_FAILED", `invalid state id ${id}`);
  }
  return join(root, `${id}.json`);
}

/**
 * Filesystem-backed owned-state store.
 *
 * - Writes are atomic: tmp file + fsync + rename. A crash mid-write leaves
 *   either the old or the new file, never a torn one.
 * - Loads verify envelope shape, integrity hash and schema version. Invalid
 *   state throws typed errors; the store never silently resets to defaults.
 * - Optimistic version checks reject stale writers (no silent last-write-wins).
 */
export class FileStateStore implements OwnedStore {
  readonly root: string;
  readonly currentVersion: number;

  constructor(root: string, currentVersion: number) {
    this.root = root;
    this.currentVersion = currentVersion;
    mkdirSync(root, { recursive: true });
  }

  judgeSchema(version: number, currentVersion: number = this.currentVersion): SchemaJudgment {
    if (!Number.isInteger(version) || version < 1) return "CORRUPT_OR_INVALID_STATE";
    if (version === currentVersion) return "CURRENT_SCHEMA";
    if (version < currentVersion) return "MIGRATABLE_SCHEMA";
    return "UNSUPPORTED_FUTURE_SCHEMA";
  }

  exists(id: string): boolean {
    return existsSync(fileFor(this.root, id));
  }

  load<T>(id: string): StateEnvelope<T> {
    const path = fileFor(this.root, id);
    if (!existsSync(path)) {
      throw new StateError("STATE_NOT_FOUND", `no state record ${id}`);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    } catch {
      throw new StateError("STATE_MALFORMED", `state record ${id} is not valid JSON`);
    }
    const env = parsed as Partial<StateEnvelope<T>>;
    for (const field of ["id", "kind", "schemaVersion", "recordVersion", "owner", "provenance", "payload", "integrity"] as const) {
      if (env[field] === undefined || env[field] === null) {
        throw new StateError("STATE_MALFORMED", `state record ${id} is missing field ${field}`);
      }
    }
    const judgment = this.judgeSchema(Number(env.schemaVersion));
    if (judgment === "CORRUPT_OR_INVALID_STATE") {
      throw new StateError("STATE_SCHEMA_UNKNOWN", `state record ${id} has an invalid schema version`);
    }
    if (judgment === "UNSUPPORTED_FUTURE_SCHEMA") {
      throw new StateError(
        "STATE_SCHEMA_TOO_NEW",
        `state record ${id} schema v${env.schemaVersion} is newer than supported v${this.currentVersion}`,
      );
    }
    if (sha256Hex(canonicalSerialize(env.payload)) !== env.integrity) {
      throw new StateError("STATE_INTEGRITY_MISMATCH", `state record ${id} failed integrity check`);
    }
    if (env.sensitivity === "SECRET_REFERENCE") {
      assertSecretReferenceShape(env.payload);
    }
    return env as StateEnvelope<T>;
  }

  save<T>(envelope: StateEnvelope<T>, options: SaveOptions = {}): StateEnvelope<T> {
    const now = options.now ?? (() => new Date().toISOString());
    if (envelope.sensitivity === "SECRET_REFERENCE") {
      assertSecretReferenceShape(envelope.payload);
    }
    const path = fileFor(this.root, envelope.id);
    if (options.expectedRecordVersion !== undefined && existsSync(path)) {
      const current = this.load(envelope.id);
      if (current.recordVersion !== options.expectedRecordVersion) {
        throw new StateError(
          "STATE_VERSION_CONFLICT",
          `stale write to ${envelope.id}: expected record v${options.expectedRecordVersion}, found v${current.recordVersion}`,
        );
      }
    }
    const stamped: StateEnvelope<T> = {
      ...envelope,
      updatedAt: now(),
      integrity: sha256Hex(canonicalSerialize(envelope.payload)),
      causedBy: options.causedBy ?? envelope.causedBy,
    };
    const tmp = `${path}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(stamped, null, 2) + "\n", "utf8");
    // Read/write handle: fsync requires a writable descriptor on Windows.
    const fd = openSync(tmp, "r+");
    try {
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    renameSync(tmp, path);
    return stamped;
  }

  remove(id: string): void {
    const path = fileFor(this.root, id);
    if (!existsSync(path)) {
      throw new StateError("STATE_NOT_FOUND", `no state record ${id}`);
    }
    // Removal goes through the same atomic path: rename aside first so a
    // crash cannot leave a half-removed record behind.
    renameSync(path, `${path}.removed-${Date.now()}`);
  }
}
