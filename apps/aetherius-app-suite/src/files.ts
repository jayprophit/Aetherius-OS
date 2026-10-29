import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Files core.
 *
 * A deterministic virtual filesystem used by the Files app and its tests. It
 * enforces path normalisation, a quota, directory rules and safe moves. It
 * does not touch the host filesystem; the desktop host supplies a real
 * storage adapter behind the same operations.
 */

export type NodeKind = "file" | "directory";

export interface FileNode {
  id: string;
  path: string;
  kind: NodeKind;
  content: string;
  mime: string;
  bytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileOptions {
  ledger?: EventLedger;
  clock?: () => Date;
  quotaBytes?: number;
}

const MIME: Record<string, string> = {
  txt: "text/plain",
  md: "text/markdown",
  json: "application/json",
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
  ts: "text/typescript",
  csv: "text/csv",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  pdf: "application/pdf",
  zip: "application/zip",
};

export function mimeFor(path: string): string {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  return MIME[extension] ?? "application/octet-stream";
}

export function normalisePath(path: string): string {
  if (typeof path !== "string" || !path.startsWith("/")) throw new Error(`a path must be absolute: ${path}`);
  const parts = path.split("/").filter(Boolean);
  if (parts.some((part) => part === "." || part === "..")) throw new Error(`a path may not contain . or ..: ${path}`);
  return `/${parts.join("/")}`;
}

function parentOf(path: string): string {
  if (path === "/") return "/";
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return `/${parts.join("/")}`;
}

function basename(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? "";
}

export class VirtualFiles {
  private readonly nodes = new Map<string, FileNode>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  private readonly quotaBytes: number;

  constructor(options: FileOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.quotaBytes = options.quotaBytes ?? 64 * 1024 * 1024;
    const at = nowIso(this.clock);
    this.nodes.set("/", {
      id: "root",
      path: "/",
      kind: "directory",
      content: "",
      mime: "inode/directory",
      bytes: 0,
      createdAt: at,
      updatedAt: at,
    });
  }

  mkdir(path: string): FileNode {
    const target = normalisePath(path);
    if (target === "/") return this.stat("/")!;
    if (this.nodes.has(target)) throw new Error(`path already exists: ${target}`);
    this.requireDirectory(parentOf(target));
    const at = nowIso(this.clock);
    const node: FileNode = {
      id: newId("fil"),
      path: target,
      kind: "directory",
      content: "",
      mime: "inode/directory",
      bytes: 0,
      createdAt: at,
      updatedAt: at,
    };
    this.nodes.set(target, node);
    this.ledger.append({ type: "files.mkdir", actor: "files", subject: target, data: {} });
    return { ...node };
  }

  write(path: string, content: string, mime?: string): FileNode {
    const target = normalisePath(path);
    if (target === "/") throw new Error("cannot write the root directory");
    if (typeof content !== "string") throw new Error("file content must be text");
    const parent = this.requireDirectory(parentOf(target));
    void parent;
    const existing = this.nodes.get(target);
    if (existing?.kind === "directory") throw new Error(`path is a directory: ${target}`);
    const bytes = Buffer.byteLength(content, "utf8");
    const used = this.usageBytes();
    const previous = existing?.bytes ?? 0;
    if (used - previous + bytes > this.quotaBytes) {
      throw new Error(`quota exceeded: need ${bytes} bytes, ${this.quotaBytes - (used - previous)} available`);
    }
    const at = nowIso(this.clock);
    const node: FileNode = {
      id: existing?.id ?? newId("fil"),
      path: target,
      kind: "file",
      content,
      mime: mime?.trim() || mimeFor(target),
      bytes,
      createdAt: existing?.createdAt ?? at,
      updatedAt: at,
    };
    this.nodes.set(target, node);
    this.ledger.append({
      type: existing ? "files.updated" : "files.created",
      actor: "files",
      subject: target,
      data: { bytes },
    });
    return { ...node };
  }

  read(path: string): string {
    const node = this.require(normalisePath(path));
    if (node.kind !== "file") throw new Error(`path is not a file: ${node.path}`);
    return node.content;
  }

  stat(path: string): FileNode | undefined {
    const node = this.nodes.get(normalisePath(path));
    return node ? { ...node } : undefined;
  }

  list(path: string): FileNode[] {
    const directory = this.requireDirectory(normalisePath(path));
    return [...this.nodes.values()]
      .filter((node) => node.path !== "/" && parentOf(node.path) === directory.path)
      .sort((a, b) => Number(a.kind === "file") - Number(b.kind === "file") || basename(a.path).localeCompare(basename(b.path)))
      .map((node) => ({ ...node }));
  }

  search(query: string, limit = 50): FileNode[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error(`limit is out of range: ${limit}`);
    return [...this.nodes.values()]
      .filter((node) => node.kind === "file")
      .filter((node) => {
        const haystack = `${node.path}\n${node.content}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .sort((a, b) => a.path.localeCompare(b.path))
      .slice(0, limit)
      .map((node) => ({ ...node }));
  }

  move(from: string, to: string): FileNode {
    const source = normalisePath(from);
    const target = normalisePath(to);
    if (source === "/") throw new Error("cannot move the root directory");
    if (source === target) return { ...this.require(source) };
    const node = this.require(source);
    if (this.nodes.has(target)) throw new Error(`destination already exists: ${target}`);
    this.requireDirectory(parentOf(target));
    if (node.kind === "directory" && target.startsWith(`${source}/`)) {
      throw new Error("cannot move a directory into itself");
    }
    const subtree = [...this.nodes.values()]
      .filter((candidate) => candidate.path === source || candidate.path.startsWith(`${source}/`))
      .map((candidate) => ({ ...candidate }));
    for (const candidate of subtree) this.nodes.delete(candidate.path);
    const at = nowIso(this.clock);
    for (const candidate of subtree) {
      const path = `${target}${candidate.path.slice(source.length)}`;
      this.nodes.set(path, { ...candidate, path, updatedAt: at });
    }
    this.ledger.append({ type: "files.moved", actor: "files", subject: source, data: { to: target } });
    return { ...this.nodes.get(target)! };
  }

  copy(from: string, to: string): FileNode {
    const source = normalisePath(from);
    const target = normalisePath(to);
    if (source === "/") throw new Error("cannot copy the root directory");
    if (this.nodes.has(target)) throw new Error(`destination already exists: ${target}`);
    this.requireDirectory(parentOf(target));
    const node = this.require(source);
    if (node.kind === "directory" && target.startsWith(`${source}/`)) {
      throw new Error("cannot copy a directory into itself");
    }
    const subtree = [...this.nodes.values()].filter(
      (candidate) => candidate.path === source || candidate.path.startsWith(`${source}/`),
    );
    const added = subtree.reduce((total, candidate) => total + candidate.bytes, 0);
    if (this.usageBytes() + added > this.quotaBytes) throw new Error("quota exceeded by copy");
    const at = nowIso(this.clock);
    for (const candidate of subtree) {
      const path = `${target}${candidate.path.slice(source.length)}`;
      this.nodes.set(path, {
        ...candidate,
        id: newId("fil"),
        path,
        createdAt: at,
        updatedAt: at,
      });
    }
    this.ledger.append({ type: "files.copied", actor: "files", subject: source, data: { to: target } });
    return { ...this.nodes.get(target)! };
  }

  remove(path: string, options: { recursive?: boolean } = {}): void {
    const target = normalisePath(path);
    if (target === "/") throw new Error("cannot remove the root directory");
    const node = this.require(target);
    const children = [...this.nodes.values()].filter((candidate) => candidate.path.startsWith(`${target}/`));
    if (node.kind === "directory" && children.length > 0 && options.recursive !== true) {
      throw new Error(`directory is not empty: ${target}`);
    }
    for (const candidate of [...children, node]) this.nodes.delete(candidate.path);
    this.ledger.append({ type: "files.removed", actor: "files", subject: target, data: { recursive: options.recursive === true } });
  }

  usageBytes(): number {
    let total = 0;
    for (const node of this.nodes.values()) total += node.bytes;
    return total;
  }

  quota(): number {
    return this.quotaBytes;
  }

  private require(path: string): FileNode {
    const node = this.nodes.get(path);
    if (!node) throw new Error(`no such path: ${path}`);
    return node;
  }

  private requireDirectory(path: string): FileNode {
    const node = this.require(path);
    if (node.kind !== "directory") throw new Error(`not a directory: ${path}`);
    return node;
  }
}
