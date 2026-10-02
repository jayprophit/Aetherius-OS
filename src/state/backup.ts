/**
 * REQ-p17-owned-state: backup and restore for the canonical owned-state store.
 *
 * The store already refuses to silently lose data -- writes are atomic and
 * integrity-hashed, stale writers are rejected, and `remove` renames aside
 * rather than unlinking. What it could not do was take a restorable snapshot
 * or put one back. `migrate.ts` produced a migration backup envelope that
 * callers had to persist themselves, and nothing did.
 *
 * Boundaries:
 * - This operates on the existing OwnedStore. It is not a second store, a
 *   second serialization, or a parallel persistence path: every record it
 *   writes goes back through `save`, so it inherits the same atomicity and
 *   the same integrity hash.
 * - A restore is refused unless the backup's own manifest verifies. Restoring
 *   corrupt bytes is worse than not restoring, because it looks like success.
 * - A restore never silently overwrites newer state. If the live record has
 *   moved past the backup's recordVersion, that is a conflict to be resolved
 *   deliberately, not a rollback to be performed quietly.
 * - Backup contents are the state's own sensitivity class. A SECRET_REFERENCE
 *   record is backed up as a pointer, never expanded.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { canonicalSerialize, sha256Hex } from "./store";
import type { OwnedStore } from "./store";
import { StateError } from "./types";
import type { StateEnvelope } from "./types";

export const BACKUP_MANIFEST_VERSION = 1;
const BACKUP_DIR = "_backups";

export interface BackupManifestEntry {
  id: string;
  schemaVersion: number;
  recordVersion: number;
  integrity: string;
}

export interface BackupManifest {
  manifestVersion: number;
  storeKind: string;
  owner: string;
  createdAt: string;
  causedBy: { actor: string; source: string };
  entries: BackupManifestEntry[];
  /** Hash over the canonical serialization of `entries`. */
  entriesHash: string;
}

export interface BackupResult {
  backupId: string;
  path: string;
  recordCount: number;
  manifestHash: string;
}

function backupRoot(store: OwnedStore): string {
  return join(store.root, BACKUP_DIR);
}

function canonicalEntriesHash(entries: BackupManifestEntry[]): string {
  return sha256Hex(
    canonicalSerialize([...entries].sort((a, b) => (a.id < b.id ? -1 : 1))),
  );
}

/**
 * Take a verifiable snapshot of every record in the store.
 *
 * Records are copied verbatim and listed with their integrity hashes, so the
 * snapshot can prove later that what comes back out is what went in.
 */
export function backupStore(
  store: OwnedStore,
  backupId: string,
  causedBy: { actor: string; source: string },
  now: () => string = () => new Date().toISOString(),
): BackupResult {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(backupId)) {
    throw new StateError("STATE_VALIDATION_FAILED", `invalid backup id ${backupId}`);
  }
  const ids = store.listIds();
  const dir = join(backupRoot(store), backupId);
  mkdirSync(dir, { recursive: true });

  const entries: BackupManifestEntry[] = [];
  for (const id of ids) {
    const record = store.load(id);
    writeFileSync(join(dir, `${id}.json`), `${JSON.stringify(record, null, 2)}\n`, "utf8");
    entries.push({
      id,
      schemaVersion: record.schemaVersion,
      recordVersion: record.recordVersion,
      integrity: record.integrity,
    });
  }
  const entriesHash = canonicalEntriesHash(entries);
  const manifest: BackupManifest = {
    manifestVersion: BACKUP_MANIFEST_VERSION,
    storeKind: "owned-state",
    owner: ids.length > 0 ? store.load(ids[0]).owner : "unknown",
    createdAt: now(),
    causedBy,
    entries,
    entriesHash,
  };
  writeFileSync(
    join(dir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  return {
    backupId,
    path: dir,
    recordCount: entries.length,
    manifestHash: entriesHash,
  };
}

export type RestoreRejection =
  | "backup-not-found"
  | "backup-manifest-unreadable"
  | "backup-manifest-tampered"
  | "backup-schema-unsupported"
  | "record-content-tampered"
  | "record-newer-than-backup";

export interface RestoreRejectionDetail {
  id: string;
  reason: RestoreRejection;
  detail: string;
}

export interface RestorePlan {
  backupId: string;
  restorable: Array<{ id: string; recordVersion: number }>;
  /**
   * Records that are restorable ONLY by rolling state backwards. Kept separate
   * from `restorable` because consenting to a restore is not the same as
   * consenting to a rollback, and the caller must see the difference.
   */
  downgrades: Array<{ id: string; backupVersion: number; liveVersion: number }>;
  /** Records the backup would not restore, and exactly why. */
  rejected: RestoreRejectionDetail[];
  manifestVerified: boolean;
}

export interface RestoreResult extends RestorePlan {
  restored: string[];
  /** Records set aside before overwriting, so the refusal is reversible. */
  displaced: string[];
}

/**
 * Inspect what a restore would do, without touching anything.
 *
 * Separating the decision from the effect matters: a restore that overwrites
 * newer state is destructive, and the caller deserves to see every refusal
 * before agreeing to it rather than after.
 */
export function planRestore(
  store: OwnedStore,
  backupId: string,
  options: { allowDowngrade?: boolean } = {},
): RestorePlan {
  const dir = join(backupRoot(store), backupId);
  if (!existsSync(join(dir, "manifest.json"))) {
    throw new StateError("STATE_NOT_FOUND", `no backup ${backupId}`);
  }
  let manifest: BackupManifest;
  try {
    manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as BackupManifest;
  } catch (error) {
    throw new StateError(
      "STATE_MALFORMED",
      `backup manifest unreadable: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (manifest.manifestVersion !== BACKUP_MANIFEST_VERSION) {
    throw new StateError(
      "STATE_SCHEMA_TOO_NEW",
      `backup manifest v${manifest.manifestVersion} is not supported`,
    );
  }
  // The manifest protects its own list. Without this check an attacker -- or a
  // careless edit -- could drop a record from the list and the restore would
  // silently omit it while still reporting success.
  const entriesHash = canonicalEntriesHash(manifest.entries ?? []);
  if (entriesHash !== manifest.entriesHash) {
    return {
      backupId,
      manifestVerified: false,
      restorable: [],
      downgrades: [],
      rejected: [{
        id: "manifest",
        reason: "backup-manifest-tampered",
        detail: `entries hash ${entriesHash} does not match the recorded ${manifest.entriesHash}`,
      }],
    };
  }

  const restorable: Array<{ id: string; recordVersion: number }> = [];
  const downgrades: RestorePlan["downgrades"] = [];
  const rejected: RestoreRejectionDetail[] = [];
  for (const entry of manifest.entries ?? []) {
    const file = join(dir, `${entry.id}.json`);
    if (!existsSync(file)) {
      rejected.push({ id: entry.id, reason: "record-content-tampered", detail: "record file missing from backup" });
      continue;
    }
    let record: StateEnvelope;
    try {
      record = JSON.parse(readFileSync(file, "utf8")) as StateEnvelope;
    } catch (error) {
      rejected.push({ id: entry.id, reason: "record-content-tampered", detail: `unreadable: ${String(error)}` });
      continue;
    }
    if (sha256Hex(canonicalSerialize(record.payload)) !== entry.integrity) {
      rejected.push({ id: entry.id, reason: "record-content-tampered", detail: "payload hash does not match the backup manifest" });
      continue;
    }
    if (store.judgeSchema(record.schemaVersion) === "UNSUPPORTED_FUTURE_SCHEMA") {
      rejected.push({ id: entry.id, reason: "backup-schema-unsupported", detail: `record is schema v${record.schemaVersion}` });
      continue;
    }
    if (store.exists(entry.id)) {
      const live = store.load(entry.id);
      if (live.recordVersion > record.recordVersion) {
        if (options.allowDowngrade) {
          downgrades.push({
            id: entry.id,
            backupVersion: record.recordVersion,
            liveVersion: live.recordVersion,
          });
        } else {
          rejected.push({
            id: entry.id,
            reason: "record-newer-than-backup",
            detail: `live is v${live.recordVersion}, backup is v${record.recordVersion}`,
          });
        }
        continue;
      }
    }
    restorable.push({ id: entry.id, recordVersion: record.recordVersion });
  }
  return { backupId, manifestVerified: true, restorable, downgrades, rejected };
}

export interface RestoreOptions {
  /**
   * Replace a live record with an older one. Off by default: rolling a record
   * back over newer state is a decision a caller has to make explicitly.
   */
  allowDowngrade?: boolean;
  now?: () => string;
}

/**
 * Restore a verified backup through the store's own save path.
 *
 * Anything the plan rejected stays untouched. Records that would be replaced
 * are renamed aside first, so a restore is itself reversible rather than a
 * one-way door.
 */
export function restoreStore(
  store: OwnedStore,
  backupId: string,
  causedBy: { actor: string; source: string },
  options: RestoreOptions = {},
): RestoreResult {
  const plan = planRestore(store, backupId, { allowDowngrade: options.allowDowngrade });
  if (!plan.manifestVerified) {
    throw new StateError(
      "STATE_INTEGRITY_MISMATCH",
      `refusing to restore ${backupId}: its manifest does not verify`,
    );
  }
  const dir = join(backupRoot(store), backupId);
  const now = options.now ?? (() => new Date().toISOString());
  const restored: string[] = [];
  const displaced: string[] = [];

  // Restorable records plus any the caller explicitly consented to roll back.
  // Downgrades are listed separately by the plan so that consenting to a
  // restore is never mistaken for consenting to a rollback.
  const targets = [
    ...plan.restorable,
    ...plan.downgrades.map((d) => ({ id: d.id, recordVersion: d.backupVersion })),
  ];
  for (const item of targets) {
    const record = JSON.parse(readFileSync(join(dir, `${item.id}.json`), "utf8")) as StateEnvelope;
    if (store.exists(item.id)) {
      // Renamed aside rather than unlinked, so a restore is itself reversible.
      const aside = join(store.root, `${item.id}.json.pre-restore-${Date.now()}`);
      renameSync(join(store.root, `${item.id}.json`), aside);
      displaced.push(item.id);
    }
    store.save(record, { causedBy, now });
    restored.push(item.id);
  }

  return { ...plan, restored, displaced };
}

/** List available backups, newest last. */
export function listBackups(store: OwnedStore): string[] {
  const root = backupRoot(store);
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .filter((name) => existsSync(join(root, name, "manifest.json")))
    .sort();
}