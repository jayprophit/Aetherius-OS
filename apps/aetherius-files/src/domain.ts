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
  maxEntries?: number;
  maxTotalBytes?: number;
}

function validateName(name: string): void {
  if (!name || name.trim() === "") throw new Error("invalid name: empty or whitespace-only");
  if (name.includes("/") || name.includes("\\") || name.includes("\0")) {
    throw new Error("invalid name: path separators or NUL not allowed");
  }
  if (name === "." || name === "..") throw new Error("invalid name: dot segments not allowed");
  if (name.length > 255) throw new Error("invalid name: exceeds 255 characters");
}

function validatePath(path: string): void {
  if (!path || path.trim() === "") throw new Error("invalid path: empty");
  if (!path.startsWith("/")) throw new Error("invalid path: must be absolute");
  if (path.split("/").includes("..")) throw new Error("invalid path: '..' segments not allowed");
  if (path.length > 512) throw new Error("invalid path: exceeds 512 characters");
}

export class FileSystem {
  private readonly entries = new Map<string, FileEntry>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  private readonly maxEntries: number;
  private readonly maxTotalBytes: number;

  constructor(options: FileSystemOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.maxEntries = options.maxEntries ?? 10_000;
    this.maxTotalBytes = options.maxTotalBytes ?? 50 * 1024 * 1024;
  }

  private totalBytes(): number {
    return [...this.entries.values()].reduce((sum, e) => sum + e.sizeBytes, 0);
  }

  private assertQuota(newSizeBytes: number): void {
    if (this.entries.size >= this.maxEntries) {
      throw new Error(`quota exceeded: entry limit ${this.maxEntries} reached`);
    }
    if (this.totalBytes() + newSizeBytes > this.maxTotalBytes) {
      throw new Error(`quota exceeded: byte limit ${this.maxTotalBytes} would be exceeded`);
    }
  }

  createFile(name: string, path: string, sizeBytes = 0): FileEntry {
    validateName(name);
    validatePath(path);
    if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
      throw new Error("invalid size: must be a finite non-negative number");
    }
    if (sizeBytes > this.maxTotalBytes) throw new Error(`invalid size: exceeds single-file limit ${this.maxTotalBytes}`);
    this.assertQuota(sizeBytes);
    if (this.list(path).some((e) => e.name === name)) {
      throw new Error(`already exists: '${name}' in '${path}'`);
    }
    const entry: FileEntry = { id: newId("file"), name, path, sizeBytes, isDirectory: false };
    this.entries.set(entry.id, entry);
    this.ledger.append({ type: "files.created", actor: "files", subject: entry.id });
    return entry;
  }

  createDirectory(name: string, path: string): FileEntry {
    validateName(name);
    validatePath(path);
    this.assertQuota(0);
    if (this.list(path).some((e) => e.name === name)) {
      throw new Error(`already exists: '${name}' in '${path}'`);
    }
    const entry: FileEntry = { id: newId("dir"), name, path, sizeBytes: 0, isDirectory: true };
    this.entries.set(entry.id, entry);
    this.ledger.append({ type: "files.dir.created", actor: "files", subject: entry.id });
    return entry;
  }

  list(path: string): FileEntry[] {
    return Array.from(this.entries.values()).filter((e) => e.path === path);
  }

  /** Total bytes currently stored; used by quota UI to display usage. */
  usageBytes(): number {
    return this.totalBytes();
  }

  /** Number of entries; used by quota UI to display entry usage. */
  entryCount(): number {
    return this.entries.size;
  }

  /** Quota status for UI display; never throws. */
  quotaStatus(): { entryCount: number; maxEntries: number; totalBytes: number; maxTotalBytes: number; exceeded: boolean } {
    const total = this.usageBytes();
    return {
      entryCount: this.entries.size,
      maxEntries: this.maxEntries,
      totalBytes: total,
      maxTotalBytes: this.maxTotalBytes,
      exceeded: this.entries.size >= this.maxEntries || total >= this.maxTotalBytes,
    };
  }
}
