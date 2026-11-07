import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";
import { createHash } from "node:crypto";

/**
 * Backup & Restore domain core.
 *
 * Snapshots with content checksums, a retention policy and verify/restore
 * bookkeeping. Actual copying is a host adapter concern; this layer models
 * what was snapshotted and whether it still verifies.
 */

export type SnapshotKind = "manual" | "scheduled" | "pre-update";

export interface Snapshot {
  id: string;
  kind: SnapshotKind;
  label: string;
  fileCount: number;
  totalBytes: number;
  checksum: string;
  createdAt: string;
  verifiedAt: string | null;
  restoredAt: string | null;
}

export interface RetentionPolicy {
  keepManual: number;
  keepScheduled: number;
  keepPreUpdate: number;
}

export interface BackupOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

const KINDS: SnapshotKind[] = ["manual", "scheduled", "pre-update"];

export class BackupRestore {
  private readonly snapshots = new Map<string, Snapshot>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: BackupOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(input: { kind?: string; label: string; manifest: Array<{ path: string; size: number; sha256: string }> }): Snapshot {
    const kind = (input.kind ?? "manual") as SnapshotKind;
    if (!KINDS.includes(kind)) throw new Error(`kind must be one of: ${KINDS.join(", ")}`);
    if (typeof input.label !== "string" || input.label.trim().length === 0) {
      throw new Error("a snapshot needs a label");
    }
    const manifest = Array.isArray(input.manifest) ? input.manifest : [];
    const canonical = [...manifest]
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((entry) => `${entry.path}\n${entry.size}\n${entry.sha256}`)
      .join("\n\n");
    const snapshot: Snapshot = {
      id: newId("snap"),
      kind,
      label: input.label.trim(),
      fileCount: manifest.length,
      totalBytes: manifest.reduce((sum, entry) => sum + (Number.isInteger(entry.size) ? entry.size : 0), 0),
      checksum: createHash("sha256").update(canonical, "utf8").digest("hex"),
      createdAt: nowIso(this.clock),
      verifiedAt: null,
      restoredAt: null,
    };
    this.snapshots.set(snapshot.id, snapshot);
    this.ledger.append({ type: "backup.snapshot_created", actor: "backup", subject: snapshot.id, data: { kind, files: manifest.length } });
    return structuredClone(snapshot);
  }

  verify(snapshotId: string, manifest: Array<{ path: string; size: number; sha256: string }>): boolean {
    const snapshot = this.require(snapshotId);
    const canonical = [...manifest]
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((entry) => `${entry.path}\n${entry.size}\n${entry.sha256}`)
      .join("\n\n");
    const checksum = createHash("sha256").update(canonical, "utf8").digest("hex");
    const ok = checksum === snapshot.checksum;
    snapshot.verifiedAt = nowIso(this.clock);
    this.snapshots.set(snapshotId, snapshot);
    this.ledger.append({ type: "backup.snapshot_verified", actor: "backup", subject: snapshotId, data: { ok } });
    if (!ok) throw new Error(`checksum mismatch for snapshot ${snapshotId}`);
    return true;
  }

  restore(snapshotId: string): Snapshot {
    const snapshot = this.require(snapshotId);
    if (snapshot.verifiedAt === null) {
      throw new Error("a snapshot must be verified before it can be restored");
    }
    snapshot.restoredAt = nowIso(this.clock);
    this.snapshots.set(snapshotId, snapshot);
    this.ledger.append({ type: "backup.snapshot_restored", actor: "backup", subject: snapshotId, data: {} });
    return structuredClone(snapshot);
  }

  applyRetention(policy: RetentionPolicy): string[] {
    for (const [key, value] of Object.entries(policy)) {
      if (!Number.isInteger(value) || value < 0) throw new Error(`retention ${key} must be a non-negative integer`);
    }
    const pruned: string[] = [];
    for (const kind of KINDS) {
      const keep = policy[`keep${kind[0].toUpperCase()}${kind.slice(1)}` as keyof RetentionPolicy];
      const ofKind = [...this.snapshots.values()]
        .filter((s) => s.kind === kind)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
      for (const snapshot of ofKind.slice(keep)) {
        this.snapshots.delete(snapshot.id);
        pruned.push(snapshot.id);
      }
    }
    this.ledger.append({ type: "backup.retention_applied", actor: "backup", subject: "retention", data: { pruned: pruned.length } });
    return pruned;
  }

  list(kind?: SnapshotKind): Snapshot[] {
    return [...this.snapshots.values()]
      .filter((s) => kind === undefined || s.kind === kind)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
      .map((s) => structuredClone(s));
  }

  private require(snapshotId: string): Snapshot {
    const found = this.snapshots.get(snapshotId);
    if (!found) throw new Error(`no snapshot: ${snapshotId}`);
    return structuredClone(found);
  }
}
