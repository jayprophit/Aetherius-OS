import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Snapshot {
  id: string;
  label: string;
  path: string;
  sizeBytes: number;
}

export interface BackupOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class BackupService {
  private readonly snapshots = new Map<string, Snapshot>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: BackupOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createSnapshot(label: string, path: string, sizeBytes: number): Snapshot {
    const snapshot: Snapshot = { id: newId("snapshot"), label, path, sizeBytes };
    this.snapshots.set(snapshot.id, snapshot);
    this.ledger.append({ type: "backup.created", actor: "backup", subject: snapshot.id });
    return snapshot;
  }

  listSnapshots(): Snapshot[] {
    return Array.from(this.snapshots.values());
  }
}
