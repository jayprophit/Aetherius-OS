import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface ArchiveEntry {
  id: string;
  name: string;
  sizeBytes: number;
  compressed: boolean;
}

export interface ArchiveOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class ArchiveManager {
  private readonly entries = new Map<string, ArchiveEntry>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: ArchiveOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  add(entry: Omit<ArchiveEntry, "id">): ArchiveEntry {
    const a: ArchiveEntry = { ...entry, id: newId("archive") };
    this.entries.set(a.id, a);
    this.ledger.append({ type: "archive.added", actor: "archive", subject: a.id });
    return a;
  }

  remove(id: string): void {
    if (!this.entries.has(id)) throw new Error("archive entry not found");
    this.entries.delete(id);
    this.ledger.append({ type: "archive.removed", actor: "archive", subject: id });
  }

  list(): ArchiveEntry[] {
    return Array.from(this.entries.values());
  }
}
