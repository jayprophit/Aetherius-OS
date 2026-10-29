import { createHash } from "node:crypto";

import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Genesis bridge.
 *
 * The owner asked for ecosystem apps (the trading bot and Aetherius
 * Crossplatform) to have "Genesis kernel-level access": browser automation with
 * pagination, scoped file access, front-to-back app control and input/screen
 * capabilities. This module is the policy and orchestration layer for that
 * access. It is deliberately host-neutral: a desktop, mobile or web host
 * supplies the ports, and every call is checked against an explicit grant and
 * written to a hash-chained journal.
 *
 * It is not an OS kernel, does not bypass host permissions, and does not ship a
 * real browser driver or screen-capture implementation. The tests use
 * in-memory ports so the policy, pagination, file scoping and audit behaviour
 * are real; a host adapter is still required for live automation.
 */

export const BRIDGE_CAPABILITIES = [
  "browser.navigate",
  "browser.paginate",
  "files.read",
  "files.write",
  "apps.launch",
  "apps.control",
  "input.pointer",
  "input.keyboard",
  "screen.capture",
] as const;

export type BridgeCapability = (typeof BRIDGE_CAPABILITIES)[number];

const SUBJECT = /^[a-z][a-z0-9-]*(?:\.[a-z0-9-]+)*$/;
const HOST = /^(\*\.)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/;
const KEY_NAME = /^[A-Za-z0-9+_-]{1,32}$/;

export interface GenesisGrant {
  /** The module or application receiving the grant. */
  subject: string;
  capabilities: readonly BridgeCapability[];
  /** Absolute POSIX-style roots. An empty list grants no file access. */
  fileRoots: readonly string[];
  /** Exact hosts or `*.example.com` wildcards. An empty list grants no browser access. */
  browserHosts: readonly string[];
  /** App ids the grant may control. An empty list grants no app access. */
  appIds: readonly string[];
  /** ISO instant after which every operation is denied. */
  expiresAt?: string | null;
}

export function normaliseBridgePath(path: string): string {
  if (typeof path !== "string" || !path.startsWith("/")) throw new Error(`a path must be absolute: ${path}`);
  if (path.includes("\0") || /[\u0001-\u001f]/.test(path)) throw new Error("a path contains a control character");
  const parts = path.split("/").filter(Boolean);
  if (parts.some((part) => part === "." || part === "..")) throw new Error(`a path may not contain . or ..: ${path}`);
  return `/${parts.join("/")}`;
}

function normaliseRoot(root: string): string {
  const normalised = normaliseBridgePath(root);
  return normalised === "/" ? "/" : normalised;
}

function contains(root: string, path: string): boolean {
  return root === "/" || path === root || path.startsWith(`${root}/`);
}

export class GenesisAccess {
  readonly subject: string;
  readonly capabilities: readonly BridgeCapability[];
  readonly fileRoots: readonly string[];
  readonly browserHosts: readonly string[];
  readonly appIds: readonly string[];
  readonly expiresAt: string | null;
  private readonly clock: () => Date;

  constructor(grant: GenesisGrant, clock: () => Date = () => new Date()) {
    if (!SUBJECT.test(grant.subject)) throw new Error(`invalid grant subject: ${grant.subject}`);
    if (grant.capabilities.length === 0) throw new Error("a grant needs at least one capability");
    for (const capability of grant.capabilities) {
      if (!BRIDGE_CAPABILITIES.includes(capability)) throw new Error(`unknown capability: ${capability}`);
    }
    const roots = [...new Set(grant.fileRoots.map(normaliseRoot))];
    const hosts = [...new Set(grant.browserHosts.map((host) => host.trim().toLowerCase()))];
    for (const host of hosts) {
      if (!HOST.test(host) || host.includes("..")) throw new Error(`invalid browser host: ${host}`);
    }
    const trimmedApps = grant.appIds.map((appId) => appId.trim());
    if (trimmedApps.some((appId) => !appId)) throw new Error("an app id cannot be empty");
    const apps = [...new Set(trimmedApps)];
    if (grant.expiresAt && Number.isNaN(Date.parse(grant.expiresAt))) {
      throw new Error(`grant expiry is not a date: ${grant.expiresAt}`);
    }
    const expiresAt = grant.expiresAt ? new Date(grant.expiresAt).toISOString() : null;
    this.subject = grant.subject;
    this.capabilities = [...new Set(grant.capabilities)].sort();
    this.fileRoots = roots;
    this.browserHosts = hosts;
    this.appIds = apps;
    this.expiresAt = expiresAt;
    this.clock = clock;
  }

  expired(at: Date = this.clock()): boolean {
    return this.expiresAt !== null && at.getTime() >= Date.parse(this.expiresAt);
  }

  allows(capability: BridgeCapability): boolean {
    return this.capabilities.includes(capability);
  }

  assertCapability(capability: BridgeCapability, at: Date = this.clock()): void {
    if (this.expired(at)) throw new Error(`grant expired at ${this.expiresAt}`);
    if (!this.allows(capability)) throw new Error(`capability denied: ${this.subject} -> ${capability}`);
  }

  assertHost(url: string, at: Date = this.clock()): URL {
    this.assertCapability("browser.navigate", at);
    return this.assertHostScope(url, at);
  }

  /** Validate the URL and host scope without requiring a navigation capability. */
  assertHostScope(url: string, at: Date = this.clock()): URL {
    if (this.expired(at)) throw new Error(`grant expired at ${this.expiresAt}`);
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`not a URL: ${url}`);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(`only http and https are supported: ${url}`);
    }
    if (parsed.username || parsed.password) throw new Error("a browser URL may not embed credentials");
    const host = parsed.hostname.toLowerCase();
    const allowed = this.browserHosts.some(
      (entry) => host === entry || (entry.startsWith("*.") && host.endsWith(entry.slice(1))),
    );
    if (!allowed) throw new Error(`host is not granted: ${host}`);
    return parsed;
  }

  assertPath(path: string, mode: "read" | "write", at: Date = this.clock()): string {
    this.assertCapability(mode === "read" ? "files.read" : "files.write", at);
    const normalised = normaliseBridgePath(path);
    if (!this.fileRoots.some((root) => contains(root, normalised))) {
      throw new Error(`path is outside the granted roots: ${normalised}`);
    }
    return normalised;
  }

  assertApp(appId: string, at: Date = this.clock()): string {
    this.assertCapability("apps.control", at);
    const trimmed = appId.trim();
    if (!trimmed) throw new Error("an app id is required");
    if (!this.appIds.includes(trimmed)) throw new Error(`app is not granted: ${trimmed}`);
    return trimmed;
  }

  assertLaunch(appId: string, at: Date = this.clock()): string {
    this.assertCapability("apps.launch", at);
    const trimmed = appId.trim();
    if (!trimmed) throw new Error("an app id is required");
    if (!this.appIds.includes(trimmed)) throw new Error(`app is not granted: ${trimmed}`);
    return trimmed;
  }
}

/* ------------------------------------------------------------------- journal */

export type JournalOutcome = "ok" | "denied" | "error";

export interface JournalEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  subject: string;
  outcome: JournalOutcome;
  detail: Record<string, unknown>;
}

const SECRET_KEY = /token|secret|password|passwd|api[_-]?key|authorization/i;

function sanitise(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[truncated]";
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "undefined") return null;
  if (typeof value === "function") return "[function]";
  if (Array.isArray(value)) return value.map((entry) => sanitise(entry, depth + 1));
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      result[key] = SECRET_KEY.test(key) ? "[redacted]" : sanitise(record[key], depth + 1);
    }
    return result;
  }
  return String(value);
}

export function sanitiseJournalDetail(detail: Record<string, unknown>): Record<string, unknown> {
  return sanitise(detail) as Record<string, unknown>;
}

export class AuditJournal {
  private readonly entriesList: JournalEntry[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: { ledger?: EventLedger; clock?: () => Date } = {}) {
    this.ledger = options.ledger ?? new EventLedger([], options.clock);
    this.clock = options.clock ?? (() => new Date());
  }

  record(input: Omit<JournalEntry, "id" | "at">): JournalEntry {
    if (!input.actor.trim() || !input.action.trim() || !input.subject.trim()) {
      throw new Error("a journal entry needs an actor, an action and a subject");
    }
    const entry: JournalEntry = {
      id: newId("jnl"),
      at: nowIso(this.clock),
      actor: input.actor,
      action: input.action,
      subject: input.subject,
      outcome: input.outcome,
      detail: sanitiseJournalDetail(input.detail),
    };
    this.entriesList.push(entry);
    this.ledger.append({
      type: `bridge.${entry.action}`,
      actor: entry.actor,
      subject: entry.subject,
      data: { outcome: entry.outcome, detail: entry.detail },
    });
    return structuredClone(entry);
  }

  entries(): JournalEntry[] {
    return this.entriesList.map((entry) => structuredClone(entry));
  }

  verify(): { ok: true } | { ok: false; reason: string } {
    return EventLedger.verify(this.ledger.all());
  }

  ledgerEvents() {
    return this.ledger.all();
  }
}

function guard<T>(
  journal: AuditJournal,
  actor: string,
  action: string,
  subject: string,
  checks: () => void,
  run: () => T,
  detail: (result: T) => Record<string, unknown> = () => ({}),
): T {
  try {
    checks();
  } catch (error) {
    journal.record({
      actor,
      action,
      subject,
      outcome: "denied",
      detail: { message: error instanceof Error ? error.message : String(error) },
    });
    throw error;
  }
  try {
    const result = run();
    journal.record({ actor, action, subject, outcome: "ok", detail: detail(result) });
    return result;
  } catch (error) {
    journal.record({
      actor,
      action,
      subject,
      outcome: "error",
      detail: { message: error instanceof Error ? error.message : String(error) },
    });
    throw error;
  }
}

/* --------------------------------------------------------------------- files */

export interface FileStat {
  path: string;
  kind: "file" | "directory";
  bytes: number;
}

export interface FileSystemPort {
  list(path: string): FileStat[];
  stat(path: string): FileStat | undefined;
  read(path: string): string;
  write(path: string, content: string): void;
}

export interface FileAccessLimits {
  maxReadBytes?: number;
  maxWriteBytes?: number;
  maxEntries?: number;
}

export class ScopedFileAccess {
  private readonly port: FileSystemPort;
  private readonly access: GenesisAccess;
  private readonly journal: AuditJournal;
  private readonly maxReadBytes: number;
  private readonly maxWriteBytes: number;
  private readonly maxEntries: number;

  constructor(port: FileSystemPort, access: GenesisAccess, journal: AuditJournal, limits: FileAccessLimits = {}) {
    this.port = port;
    this.access = access;
    this.journal = journal;
    this.maxReadBytes = limits.maxReadBytes ?? 1_048_576;
    this.maxWriteBytes = limits.maxWriteBytes ?? 1_048_576;
    this.maxEntries = limits.maxEntries ?? 2000;
    if (!Number.isInteger(this.maxReadBytes) || this.maxReadBytes < 1) throw new Error("maxReadBytes is invalid");
    if (!Number.isInteger(this.maxWriteBytes) || this.maxWriteBytes < 1) throw new Error("maxWriteBytes is invalid");
    if (!Number.isInteger(this.maxEntries) || this.maxEntries < 1) throw new Error("maxEntries is invalid");
  }

  list(path: string): FileStat[] {
    return guard(
      this.journal,
      this.access.subject,
      "files.list",
      path,
      () => this.access.assertPath(path, "read"),
      () => {
        const normalised = normaliseBridgePath(path);
        const entries = this.port.list(normalised);
        if (entries.length > this.maxEntries) throw new Error(`directory listing exceeds ${this.maxEntries} entries`);
        return entries.map((entry) => ({ ...entry }));
      },
      (entries) => ({ entries: entries.length }),
    );
  }

  stat(path: string): FileStat | undefined {
    return guard(
      this.journal,
      this.access.subject,
      "files.stat",
      path,
      () => this.access.assertPath(path, "read"),
      () => {
        const stat = this.port.stat(normaliseBridgePath(path));
        return stat ? { ...stat } : undefined;
      },
      (stat) => ({ exists: stat !== undefined }),
    );
  }

  read(path: string): string {
    return guard(
      this.journal,
      this.access.subject,
      "files.read",
      path,
      () => this.access.assertPath(path, "read"),
      () => {
        const normalised = normaliseBridgePath(path);
        const stat = this.port.stat(normalised);
        if (!stat) throw new Error(`no such path: ${normalised}`);
        if (stat.kind !== "file") throw new Error(`path is not a file: ${normalised}`);
        if (stat.bytes > this.maxReadBytes) throw new Error(`file exceeds the ${this.maxReadBytes}-byte read limit`);
        const content = this.port.read(normalised);
        if (Buffer.byteLength(content, "utf8") > this.maxReadBytes) {
          throw new Error(`file exceeds the ${this.maxReadBytes}-byte read limit`);
        }
        return content;
      },
      (content) => ({ bytes: Buffer.byteLength(content, "utf8") }),
    );
  }

  write(path: string, content: string): FileStat {
    return guard(
      this.journal,
      this.access.subject,
      "files.write",
      path,
      () => this.access.assertPath(path, "write"),
      () => {
        if (typeof content !== "string") throw new Error("file content must be text");
        const bytes = Buffer.byteLength(content, "utf8");
        if (bytes > this.maxWriteBytes) throw new Error(`content exceeds the ${this.maxWriteBytes}-byte write limit`);
        const normalised = normaliseBridgePath(path);
        this.port.write(normalised, content);
        return { path: normalised, kind: "file" as const, bytes };
      },
      (stat) => ({ bytes: stat.bytes }),
    );
  }

  /** Bounded depth-first search over the granted root. */
  search(root: string, query: string, limit = 50): FileStat[] {
    return guard(
      this.journal,
      this.access.subject,
      "files.search",
      root,
      () => {
        this.access.assertPath(root, "read");
        if (!query.trim()) throw new Error("a search query is required");
        if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error(`limit is out of range: ${limit}`);
      },
      () => {
        const normalisedRoot = normaliseBridgePath(root);
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        const queue = [normalisedRoot];
        const seenDirs = new Set<string>();
        const matches: FileStat[] = [];
        let visited = 0;
        outer: while (queue.length > 0) {
          const directory = queue.shift()!;
          if (seenDirs.has(directory)) continue;
          seenDirs.add(directory);
          for (const entry of this.port.list(directory)) {
            visited += 1;
            if (visited > this.maxEntries) throw new Error(`search exceeds ${this.maxEntries} entries`);
            if (entry.kind === "directory") {
              queue.push(entry.path);
              continue;
            }
            let text = "";
            if (entry.bytes <= this.maxReadBytes) {
              try {
                text = this.port.read(entry.path);
              } catch {
                // A binary or unreadable file is matched by path only.
              }
            }
            const haystack = `${entry.path}\n${text}`.toLowerCase();
            if (terms.every((term) => haystack.includes(term))) {
              matches.push({ ...entry });
              if (matches.length >= limit) break outer;
            }
          }
        }
        return matches;
      },
      (matches) => ({ matches: matches.length }),
    );
  }
}

/* ------------------------------------------------------------------- browser */

export interface BrowserPage {
  url: string;
  title: string;
  html: string;
}

export interface BrowserPort {
  open(url: string): BrowserPage;
}

export interface PaginationLinks {
  next: string | null;
  previous: string | null;
  numbered: { label: string; url: string }[];
}

/**
 * Extract rel=next/prev and numeric pagination anchors. This is a bounded
 * anchor extractor, not an HTML parser or a DOM.
 */
export function extractPagination(html: string, baseUrl: string): PaginationLinks {
  if (typeof html !== "string") throw new Error("html must be text");
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    throw new Error(`not a URL: ${baseUrl}`);
  }
  if (base.protocol !== "http:" && base.protocol !== "https:") throw new Error("pagination needs an http(s) base URL");
  const numbered = new Map<string, { label: string; url: string }>();
  let next: string | null = null;
  let previous: string | null = null;
  const anchor = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(anchor)) {
    const attributes = match[1] ?? "";
    const hrefMatch = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attributes);
    const href = hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3];
    if (!href) continue;
    let url: URL;
    try {
      url = new URL(href, base);
    } catch {
      continue;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") continue;
    const resolved = url.toString();
    const text = match[2]!.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
    const relMatch = /rel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attributes);
    const rel = (relMatch?.[1] ?? relMatch?.[2] ?? relMatch?.[3] ?? "").toLowerCase().split(/\s+/);
    const isNext = rel.includes("next") || ["next", "next page", "›", "»", ">"].includes(text);
    const isPrevious =
      rel.includes("prev") || rel.includes("previous") || ["prev", "previous", "previous page", "‹", "«", "<"].includes(text);
    if (isNext && next === null) next = resolved;
    else if (isPrevious && previous === null) previous = resolved;
    else if (/^\d+$/.test(text)) numbered.set(resolved, { label: text, url: resolved });
  }
  return {
    next,
    previous,
    numbered: [...numbered.values()].sort((a, b) => Number(a.label) - Number(b.label)),
  };
}

export interface CrawlOptions {
  maxPages?: number;
  /** Follow rel=next and fall back to numbered links, or follow numbered links only. */
  follow?: "next" | "numbered";
}

export interface CrawlResult {
  pages: BrowserPage[];
  visited: string[];
  stoppedReason: "complete" | "limit" | "cycle" | "no-next-link";
}

export interface BrowserLimits {
  maxPageBytes?: number;
  maxLinks?: number;
}

export class BrowserAutomation {
  private readonly port: BrowserPort;
  private readonly access: GenesisAccess;
  private readonly journal: AuditJournal;
  private readonly maxPageBytes: number;
  private readonly maxLinks: number;

  constructor(port: BrowserPort, access: GenesisAccess, journal: AuditJournal, limits: BrowserLimits = {}) {
    this.port = port;
    this.access = access;
    this.journal = journal;
    this.maxPageBytes = limits.maxPageBytes ?? 5_242_880;
    this.maxLinks = limits.maxLinks ?? 1000;
    if (!Number.isInteger(this.maxPageBytes) || this.maxPageBytes < 1) throw new Error("maxPageBytes is invalid");
    if (!Number.isInteger(this.maxLinks) || this.maxLinks < 1) throw new Error("maxLinks is invalid");
  }

  open(url: string): BrowserPage {
    return guard(
      this.journal,
      this.access.subject,
      "browser.open",
      url,
      () => this.access.assertHost(url),
      () => {
        const page = this.port.open(url);
        const returned = this.access.assertHost(page.url);
        const bytes = Buffer.byteLength(page.html, "utf8");
        if (bytes > this.maxPageBytes) throw new Error(`page exceeds the ${this.maxPageBytes}-byte limit`);
        return { url: returned.toString(), title: page.title, html: page.html };
      },
      (page) => ({ url: page.url, bytes: Buffer.byteLength(page.html, "utf8") }),
    );
  }

  pagination(page: BrowserPage): PaginationLinks {
    return guard(
      this.journal,
      this.access.subject,
      "browser.pagination",
      page.url,
      () => {
        this.access.assertCapability("browser.paginate");
        this.access.assertHostScope(page.url);
      },
      () => extractPagination(page.html, page.url),
      (links) => ({ next: links.next, previous: links.previous, numbered: links.numbered.length }),
    );
  }

  collectLinks(page: BrowserPage, options: { sameHost?: boolean } = {}): string[] {
    return guard(
      this.journal,
      this.access.subject,
      "browser.links",
      page.url,
      () => {
        this.access.assertCapability("browser.navigate");
        this.access.assertHostScope(page.url);
      },
      () => {
        const base = new URL(page.url);
        const links = new Set<string>();
        for (const match of page.html.matchAll(/<a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
          const href = match[1] ?? match[2] ?? match[3];
          if (!href) continue;
          let url: URL;
          try {
            url = new URL(href, base);
          } catch {
            continue;
          }
          if (url.protocol !== "http:" && url.protocol !== "https:") continue;
          if (options.sameHost === true && url.hostname !== base.hostname) continue;
          try {
            this.access.assertHost(url.toString());
          } catch {
            continue;
          }
          links.add(url.toString());
          if (links.size >= this.maxLinks) break;
        }
        return [...links];
      },
      (links) => ({ links: links.length }),
    );
  }

  crawl(startUrl: string, options: CrawlOptions = {}): CrawlResult {
    return guard(
      this.journal,
      this.access.subject,
      "browser.crawl",
      startUrl,
      () => {
        this.access.assertCapability("browser.paginate");
        this.access.assertCapability("browser.navigate");
        this.access.assertHostScope(startUrl);
        const maxPages = options.maxPages ?? 5;
        if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 50) {
          throw new Error(`maxPages is out of range: ${maxPages}`);
        }
        if (options.follow !== undefined && options.follow !== "next" && options.follow !== "numbered") {
          throw new Error(`unknown follow mode: ${options.follow}`);
        }
      },
      () => {
        const maxPages = options.maxPages ?? 5;
        const follow = options.follow ?? "next";
        const pages: BrowserPage[] = [];
        const visited: string[] = [];
        const seen = new Set<string>();
        let current: string | null = startUrl;
        let stoppedReason: CrawlResult["stoppedReason"] = "complete";
        while (current !== null) {
          if (pages.length >= maxPages) {
            stoppedReason = "limit";
            break;
          }
          if (seen.has(current)) {
            stoppedReason = "cycle";
            break;
          }
          const page = this.open(current);
          seen.add(page.url);
          visited.push(page.url);
          pages.push(page);
          const links = extractPagination(page.html, page.url);
          const numbered = links.numbered.find((link) => !seen.has(link.url));
          const candidate =
            follow === "numbered" ? (numbered?.url ?? null) : (links.next !== null && !seen.has(links.next) ? links.next : (numbered?.url ?? null));
          if (candidate === null) {
            stoppedReason = follow === "numbered" ? "complete" : links.next === null ? "complete" : "cycle";
            break;
          }
          current = candidate;
        }
        return { pages, visited, stoppedReason };
      },
      (result) => ({ pages: result.pages.length, stoppedReason: result.stoppedReason }),
    );
  }
}

/* ---------------------------------------------------------------------- apps */

export interface AppInfo {
  id: string;
  name: string;
  version: string;
  running: boolean;
}

export interface AppCommand {
  name: string;
  description: string;
}

export interface AppControlPort {
  list(): AppInfo[];
  launch(appId: string): AppInfo;
  focus(appId: string): void;
  close(appId: string): void;
  commands(appId: string): AppCommand[];
  invoke(appId: string, command: string, args: Record<string, unknown>): unknown;
}

export interface AppStep {
  command: string;
  args?: Record<string, unknown>;
}

function resultDigest(value: unknown): string {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function stableJson(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}

export class AppController {
  private readonly port: AppControlPort;
  private readonly access: GenesisAccess;
  private readonly journal: AuditJournal;

  constructor(port: AppControlPort, access: GenesisAccess, journal: AuditJournal) {
    this.port = port;
    this.access = access;
    this.journal = journal;
  }

  list(): AppInfo[] {
    return guard(
      this.journal,
      this.access.subject,
      "apps.list",
      "apps",
      () => this.access.assertCapability("apps.control"),
      () => this.port.list().map((app) => ({ ...app })),
      (apps) => ({ apps: apps.length }),
    );
  }

  launch(appId: string): AppInfo {
    return guard(
      this.journal,
      this.access.subject,
      "apps.launch",
      appId,
      () => this.access.assertLaunch(appId),
      () => ({ ...this.port.launch(appId) }),
      (app) => ({ running: app.running }),
    );
  }

  focus(appId: string): void {
    guard(
      this.journal,
      this.access.subject,
      "apps.focus",
      appId,
      () => this.access.assertApp(appId),
      () => this.port.focus(appId),
    );
  }

  close(appId: string): void {
    guard(
      this.journal,
      this.access.subject,
      "apps.close",
      appId,
      () => this.access.assertApp(appId),
      () => this.port.close(appId),
    );
  }

  commands(appId: string): AppCommand[] {
    return guard(
      this.journal,
      this.access.subject,
      "apps.commands",
      appId,
      () => this.access.assertApp(appId),
      () => this.port.commands(appId).map((command) => ({ ...command })),
      (commands) => ({ commands: commands.length }),
    );
  }

  invoke(appId: string, command: string, args: Record<string, unknown> = {}): unknown {
    return guard(
      this.journal,
      this.access.subject,
      "apps.invoke",
      appId,
      () => {
        this.access.assertApp(appId);
        if (!command.trim()) throw new Error("a command name is required");
        if (!this.port.commands(appId).some((candidate) => candidate.name === command)) {
          throw new Error(`app ${appId} does not declare command ${command}`);
        }
      },
      () => this.port.invoke(appId, command, structuredClone(args)),
      (result) => ({ command, resultType: typeof result, resultDigest: resultDigest(result) }),
    );
  }

  /**
   * Front-to-back control: bring the app forward, then run its commands in
   * order. A failure stops the sequence and is journaled.
   */
  frontToBack(appId: string, steps: readonly AppStep[]): { app: AppInfo; results: unknown[] } {
    return guard(
      this.journal,
      this.access.subject,
      "apps.frontToBack",
      appId,
      () => {
        this.access.assertLaunch(appId);
        this.access.assertCapability("apps.control");
        if (steps.length === 0) throw new Error("a front-to-back sequence needs at least one step");
      },
      () => {
        let app = this.port.list().find((candidate) => candidate.id === appId);
        if (!app) throw new Error(`no app: ${appId}`);
        if (!app.running) app = this.port.launch(appId);
        this.port.focus(appId);
        const results: unknown[] = [];
        for (const step of steps) {
          if (!step.command.trim()) throw new Error("a step needs a command");
          if (!this.port.commands(appId).some((candidate) => candidate.name === step.command)) {
            throw new Error(`app ${appId} does not declare command ${step.command}`);
          }
          results.push(this.port.invoke(appId, step.command, structuredClone(step.args ?? {})));
        }
        return { app: { ...app, running: true }, results };
      },
      (result) => ({ steps: result.results.length }),
    );
  }
}

/* -------------------------------------------------------------- input/screen */

export interface ScreenInfo {
  width: number;
  height: number;
}

export interface ScreenCapture extends ScreenInfo {
  pngBase64: string;
}

export interface ScreenPort {
  info(): ScreenInfo;
  capture(): ScreenCapture;
}

export type PointerButton = "left" | "right" | "middle";

export interface InputPort {
  move(x: number, y: number): void;
  click(x: number, y: number, button: PointerButton): void;
  type(text: string): void;
  key(name: string): void;
}

export class InputController {
  private readonly input: InputPort;
  private readonly screen: ScreenPort;
  private readonly access: GenesisAccess;
  private readonly journal: AuditJournal;
  private readonly maxTextLength: number;

  constructor(
    input: InputPort,
    screen: ScreenPort,
    access: GenesisAccess,
    journal: AuditJournal,
    options: { maxTextLength?: number } = {},
  ) {
    this.input = input;
    this.screen = screen;
    this.access = access;
    this.journal = journal;
    this.maxTextLength = options.maxTextLength ?? 10_000;
    if (!Number.isInteger(this.maxTextLength) || this.maxTextLength < 1) throw new Error("maxTextLength is invalid");
  }

  private assertPoint(x: number, y: number): void {
    if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error("screen coordinates must be integers");
    const info = this.screen.info();
    if (!Number.isInteger(info.width) || !Number.isInteger(info.height) || info.width < 1 || info.height < 1) {
      throw new Error("the screen reports an invalid size");
    }
    if (x < 0 || y < 0 || x >= info.width || y >= info.height) {
      throw new Error(`point (${x}, ${y}) is outside the ${info.width}x${info.height} screen`);
    }
  }

  move(x: number, y: number): void {
    guard(
      this.journal,
      this.access.subject,
      "input.move",
      `${x},${y}`,
      () => {
        this.access.assertCapability("input.pointer");
        this.assertPoint(x, y);
      },
      () => this.input.move(x, y),
    );
  }

  click(x: number, y: number, button: PointerButton = "left"): void {
    guard(
      this.journal,
      this.access.subject,
      "input.click",
      `${x},${y}`,
      () => {
        this.access.assertCapability("input.pointer");
        this.assertPoint(x, y);
        if (!["left", "right", "middle"].includes(button)) throw new Error(`unknown pointer button: ${button}`);
      },
      () => this.input.click(x, y, button),
      () => ({ button }),
    );
  }

  type(text: string): void {
    guard(
      this.journal,
      this.access.subject,
      "input.type",
      "keyboard",
      () => {
        this.access.assertCapability("input.keyboard");
        if (typeof text !== "string") throw new Error("typed text must be a string");
        if (text.length > this.maxTextLength) throw new Error(`typed text exceeds ${this.maxTextLength} characters`);
      },
      () => this.input.type(text),
      () => ({ chars: text.length, sha256: createHash("sha256").update(text).digest("hex") }),
    );
  }

  key(name: string): void {
    guard(
      this.journal,
      this.access.subject,
      "input.key",
      name,
      () => {
        this.access.assertCapability("input.keyboard");
        if (!KEY_NAME.test(name)) throw new Error(`invalid key name: ${name}`);
      },
      () => this.input.key(name),
    );
  }

  capture(): ScreenCapture {
    return guard(
      this.journal,
      this.access.subject,
      "screen.capture",
      "screen",
      () => this.access.assertCapability("screen.capture"),
      () => {
        const capture = this.screen.capture();
        if (!Number.isInteger(capture.width) || !Number.isInteger(capture.height) || capture.width < 1 || capture.height < 1) {
          throw new Error("the capture reports an invalid size");
        }
        if (typeof capture.pngBase64 !== "string" || capture.pngBase64.length === 0) {
          throw new Error("the capture has no image data");
        }
        return { width: capture.width, height: capture.height, pngBase64: capture.pngBase64 };
      },
      (capture) => ({
        width: capture.width,
        height: capture.height,
        bytes: Buffer.byteLength(capture.pngBase64, "base64"),
        sha256: createHash("sha256").update(capture.pngBase64).digest("hex"),
      }),
    );
  }
}

/* -------------------------------------------------------------------- bridge */

export interface GenesisPorts {
  files: FileSystemPort;
  browser: BrowserPort;
  apps: AppControlPort;
  screen: ScreenPort;
  input: InputPort;
}

export interface GenesisBridgeOptions {
  grant: GenesisGrant;
  ports: GenesisPorts;
  clock?: () => Date;
  ledger?: EventLedger;
  limits?: FileAccessLimits & BrowserLimits & { maxTextLength?: number };
}

export class GenesisBridge {
  readonly access: GenesisAccess;
  readonly journal: AuditJournal;
  readonly files: ScopedFileAccess;
  readonly browser: BrowserAutomation;
  readonly apps: AppController;
  readonly input: InputController;

  constructor(options: GenesisBridgeOptions) {
    const clock = options.clock ?? (() => new Date());
    this.access = new GenesisAccess(options.grant, clock);
    this.journal = new AuditJournal({ ledger: options.ledger, clock });
    this.files = new ScopedFileAccess(options.ports.files, this.access, this.journal, options.limits ?? {});
    this.browser = new BrowserAutomation(options.ports.browser, this.access, this.journal, options.limits ?? {});
    this.apps = new AppController(options.ports.apps, this.access, this.journal);
    this.input = new InputController(options.ports.input, options.ports.screen, this.access, this.journal, options.limits ?? {});
  }

  status(): {
    subject: string;
    capabilities: BridgeCapability[];
    expired: boolean;
    journalEntries: number;
    ledgerLength: number;
  } {
    return {
      subject: this.access.subject,
      capabilities: [...this.access.capabilities],
      expired: this.access.expired(),
      journalEntries: this.journal.entries().length,
      ledgerLength: this.journal.ledgerEvents().length,
    };
  }

  verify(): { ok: true } | { ok: false; reason: string } {
    return this.journal.verify();
  }
}
