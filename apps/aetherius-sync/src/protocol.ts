/**
 * The Aetherius sync protocol.
 *
 * One record is the smallest unit that can be replicated. A record belongs to
 * an app and a collection, and is addressed by a key that the app controls.
 * Deletes are tombstones, not disappearances: a device that has been offline
 * must be able to learn that a record was removed rather than infer it from
 * silence.
 *
 * Conflict resolution is deterministic last-writer-wins:
 *
 *   1. the later `updatedAt` wins;
 *   2. at the same millisecond a tombstone beats a value;
 *   3. then the lexicographically greater revision wins;
 *   4. then the lexicographically greater device id wins.
 *
 * Every step is total, so every pair of records has exactly one winner and
 * two devices reach the same answer without a coordinator. The loser is not
 * silently discarded: the engine keeps it as a conflict for the user to see.
 *
 * The revision is a content hash. Two identical writes from two devices
 * produce the same revision, so a retried push is idempotent.
 */

export interface SyncChange {
  appId: string;
  collection: string;
  key: string;
  /** JSON value. Null for a tombstone. */
  value: unknown;
  deleted: boolean;
  /** Client clock, milliseconds since the epoch. */
  updatedAt: number;
  deviceId: string;
  /** Content hash, computed by `revisionOf`. */
  revision: string;
}

export interface SyncPushRequest {
  deviceId: string;
  records: SyncChange[];
}

export type SyncPushSource = "incoming" | "server" | "same";

export interface SyncPushResult {
  record: SyncChange;
  source: SyncPushSource;
  /** Monotonic server sequence for the winning change. */
  seq: number;
}

export interface SyncPushResponse {
  results: SyncPushResult[];
  serverTime: number;
}

export interface SyncPullResponse {
  records: Array<SyncChange & { seq: number }>;
  /** Pass this back as `cursor` to continue. */
  cursor: number;
  hasMore: boolean;
  serverTime: number;
}

export interface SyncHealth {
  ok: boolean;
  service: string;
  version: string;
  auth: "required" | "not-configured";
  time: number;
}

export interface SyncState {
  cursor: number;
  records: number;
  collections: Array<{ appId: string; collection: string; records: number }>;
  serverTime: number;
}

export const SYNC_LIMITS = {
  maxRecordsPerPush: 100,
  maxRecordsPerPull: 500,
  maxValueBytes: 64 * 1024,
  maxKeyLength: 512,
  maxIdLength: 64,
} as const;

const ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

export function isSafeId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= SYNC_LIMITS.maxIdLength &&
    ID_PATTERN.test(value)
  );
}

export function isSafeKey(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  if (value.length > SYNC_LIMITS.maxKeyLength) return false;
  // Control characters break too many transports and logs. Everything else
  // is allowed so apps can use their own ids without a translation layer.
  return !/[\u0000-\u001f\u007f]/.test(value);
}

/**
 * Deterministic JSON. Object keys are sorted at every level, so two devices
 * that hold the same value hash it identically regardless of key order.
 */
export function canonicalJson(value: unknown, depth = 0): string {
  if (depth > 32) throw new Error("value is nested too deeply");
  if (value === null) return "null";
  const type = typeof value;
  if (type === "string") return JSON.stringify(value);
  if (type === "boolean") return value ? "true" : "false";
  if (type === "number") {
    if (!Number.isFinite(value as number)) throw new Error("value contains a non-finite number");
    return JSON.stringify(value);
  }
  if (type === "undefined" || type === "function" || type === "symbol" || type === "bigint") {
    throw new Error(`value contains a non-JSON ${type}`);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item, depth + 1)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key], depth + 1)}`)
    .join(",")}}`;
}

/** FNV-1a, 64-bit, rendered as 16 lowercase hex characters. */
export function hash64(input: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= BigInt(input.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, "0");
}

export function revisionOf(change: Omit<SyncChange, "revision">): string {
  return hash64(
    [
      change.appId,
      change.collection,
      change.key,
      change.deleted ? "1" : "0",
      String(change.updatedAt),
      change.deviceId,
      canonicalJson(change.value),
    ].join("\n"),
  );
}

export interface ChangeInput {
  appId: string;
  collection: string;
  key: string;
  value?: unknown;
  deleted?: boolean;
  updatedAt: number;
  deviceId: string;
}

/** Build a fully-formed change, or throw with a precise reason. */
export function createChange(input: ChangeInput): SyncChange {
  const change: Omit<SyncChange, "revision"> = {
    appId: input.appId,
    collection: input.collection,
    key: input.key,
    value: input.deleted ? null : input.value ?? null,
    deleted: input.deleted === true,
    updatedAt: input.updatedAt,
    deviceId: input.deviceId,
  };
  const revision = revisionOf(change);
  const problems = validateChange({ ...change, revision });
  if (problems.length > 0) throw new Error(problems.join("; "));
  return { ...change, revision };
}

/** Problems with a change, or an empty array. Never throws. */
export function validateChange(value: unknown): string[] {
  const problems: string[] = [];
  const change = value as Partial<SyncChange> | null;
  if (!change || typeof change !== "object") return ["not an object"];
  if (!isSafeId(change.appId)) problems.push("appId is invalid");
  if (!isSafeId(change.collection)) problems.push("collection is invalid");
  if (!isSafeKey(change.key)) problems.push("key is invalid");
  if (typeof change.deleted !== "boolean") problems.push("deleted must be boolean");
  if (
    typeof change.updatedAt !== "number" ||
    !Number.isFinite(change.updatedAt) ||
    change.updatedAt <= 0 ||
    !Number.isInteger(change.updatedAt)
  ) {
    problems.push("updatedAt must be a positive integer");
  }
  if (
    typeof change.deviceId !== "string" ||
    change.deviceId.length === 0 ||
    change.deviceId.length > 128 ||
    /[\u0000-\u001f\u007f]/.test(change.deviceId)
  ) {
    problems.push("deviceId is invalid");
  }
  if (typeof change.revision !== "string" || change.revision.length === 0) {
    problems.push("revision is missing");
  }
  try {
    const serialised = canonicalJson(change.value);
    if (new TextEncoder().encode(serialised).byteLength > SYNC_LIMITS.maxValueBytes) {
      problems.push("value is too large");
    }
  } catch (error) {
    problems.push(error instanceof Error ? error.message : "value is not JSON");
  }
  return problems;
}

/** True when `a` wins over `b` under the deterministic ordering. */
export function winsOver(a: SyncChange, b: SyncChange): boolean {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt;
  if (a.deleted !== b.deleted) return a.deleted;
  if (a.revision !== b.revision) return a.revision > b.revision;
  return a.deviceId > b.deviceId;
}

/** The winner of two changes. Stable when both describe the same revision. */
export function winnerOf(a: SyncChange, b: SyncChange): SyncChange {
  if (a.revision === b.revision) return a;
  return winsOver(a, b) ? a : b;
}

/** Value equality under the canonical encoding. */
export function sameValue(a: SyncChange, b: SyncChange): boolean {
  return a.revision === b.revision;
}
