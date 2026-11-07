import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface FileEntry {
  id: string;
  name: string;
  path: string;
  sizeBytes: number;
  isDirectory: boolean;
}

export interface FileSystemOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class FileSystem {
  private readonly entries = new Map<string, FileEntry>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: FileSystemOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createFile(name: string, path: string, sizeBytes = 0): FileEntry {
    const entry: FileEntry = { id: newId("file"), name, path, sizeBytes, isDirectory: false };
    this.entries.set(entry.id, entry);
    this.ledger.append({ type: "files.created", actor: "files", subject: entry.id });
    return entry;
  }

  createDirectory(name: string, path: string): FileEntry {
    const entry: FileEntry = { id: newId("dir"), name, path, sizeBytes: 0, isDirectory: true };
    this.entries.set(entry.id, entry);
    this.ledger.append({ type: "files.dir.created", actor: "files", subject: entry.id });
    return entry;
  }

  list(path: string): FileEntry[] {
    return Array.from(this.entries.values()).filter((e) => e.path === path);
  }
}
