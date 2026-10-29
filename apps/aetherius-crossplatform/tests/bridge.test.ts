import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { EventLedger } from "../../app-kit/src/index.ts";
import {
  AuditJournal,
  BRIDGE_CAPABILITIES,
  BrowserAutomation,
  GenesisAccess,
  GenesisBridge,
  ScopedFileAccess,
  extractPagination,
  normaliseBridgePath,
  sanitiseJournalDetail,
  type AppCommand,
  type AppControlPort,
  type AppInfo,
  type BrowserPage,
  type BrowserPort,
  type FileStat,
  type FileSystemPort,
  type GenesisGrant,
  type InputPort,
  type PointerButton,
  type ScreenCapture,
  type ScreenInfo,
  type ScreenPort,
} from "../src/platform.ts";

const CLOCK = () => new Date("2026-10-29T00:00:00.000Z");

/* ------------------------------------------------------------------ fakes */

class MemoryFs implements FileSystemPort {
  private readonly files = new Map<string, string>();
  private readonly dirs = new Set<string>(["/"]);
  private readonly unreadable = new Set<string>();

  constructor(seed: Record<string, string> = {}, unreadable: readonly string[] = []) {
    for (const [path, content] of Object.entries(seed)) this.write(path, content);
    for (const path of unreadable) this.unreadable.add(path);
  }

  private ensureParents(path: string): void {
    const parts = path.split("/").filter(Boolean);
    let current = "";
    for (let index = 0; index < parts.length - 1; index += 1) {
      current += `/${parts[index]}`;
      this.dirs.add(current);
    }
  }

  write(path: string, content: string): void {
    this.ensureParents(path);
    this.files.set(path, content);
  }

  read(path: string): string {
    if (this.unreadable.has(path)) throw new Error(`permission denied: ${path}`);
    const content = this.files.get(path);
    if (content === undefined) throw new Error(`no file: ${path}`);
    return content;
  }

  stat(path: string): FileStat | undefined {
    const content = this.files.get(path);
    if (content !== undefined) return { path, kind: "file", bytes: Buffer.byteLength(content, "utf8") };
    if (this.dirs.has(path)) return { path, kind: "directory", bytes: 0 };
    return undefined;
  }

  list(path: string): FileStat[] {
    if (!this.dirs.has(path)) throw new Error(`no directory: ${path}`);
    const prefix = path === "/" ? "/" : `${path}/`;
    const names = new Map<string, "file" | "directory">();
    for (const file of this.files.keys()) {
      if (!file.startsWith(prefix)) continue;
      const rest = file.slice(prefix.length);
      if (rest.includes("/")) continue;
      names.set(rest, "file");
    }
    for (const dir of this.dirs) {
      if (dir === path || !dir.startsWith(prefix)) continue;
      const rest = dir.slice(prefix.length);
      if (rest.includes("/")) continue;
      names.set(rest, "directory");
    }
    return [...names.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, kind]) => {
        const full = `${prefix}${name}`.replace(/\/+/g, "/");
        return { path: full, kind, bytes: kind === "file" ? Buffer.byteLength(this.files.get(full)!, "utf8") : 0 };
      });
  }
}

class MemoryBrowser implements BrowserPort {
  private readonly pages = new Map<string, BrowserPage>();

  constructor(pages: Record<string, BrowserPage> = {}) {
    for (const [key, page] of Object.entries(pages)) this.pages.set(key, page);
  }

  add(key: string, page: BrowserPage): void {
    this.pages.set(key, page);
  }

  open(url: string): BrowserPage {
    const page = this.pages.get(url);
    if (!page) throw new Error(`no page: ${url}`);
    return { ...page };
  }
}

interface FakeApp {
  id: string;
  name: string;
  commands: AppCommand[];
  running?: boolean;
}

class MemoryApps implements AppControlPort {
  private readonly apps = new Map<string, AppInfo>();
  private readonly declared = new Map<string, AppCommand[]>();
  readonly focused: string[] = [];
  readonly invocations: { appId: string; command: string; args: Record<string, unknown> }[] = [];

  constructor(apps: readonly FakeApp[]) {
    for (const app of apps) {
      this.apps.set(app.id, { id: app.id, name: app.name, version: "1.0.0", running: app.running ?? false });
      this.declared.set(app.id, app.commands.map((command) => ({ ...command })));
    }
  }

  private require(appId: string): AppInfo {
    const app = this.apps.get(appId);
    if (!app) throw new Error(`no app: ${appId}`);
    return app;
  }

  list(): AppInfo[] {
    return [...this.apps.values()].map((app) => ({ ...app }));
  }

  launch(appId: string): AppInfo {
    const app = this.require(appId);
    app.running = true;
    return { ...app };
  }

  focus(appId: string): void {
    this.require(appId);
    this.focused.push(appId);
  }

  close(appId: string): void {
    this.require(appId).running = false;
  }

  commands(appId: string): AppCommand[] {
    this.require(appId);
    return this.declared.get(appId)!.map((command) => ({ ...command }));
  }

  invoke(appId: string, command: string, args: Record<string, unknown>): unknown {
    this.require(appId);
    if (!this.declared.get(appId)!.some((candidate) => candidate.name === command)) {
      throw new Error(`no command ${command}`);
    }
    this.invocations.push({ appId, command, args });
    if (command === "noop") return undefined;
    if (command === "fail") throw new Error("the app failed");
    return { app: appId, command, args };
  }
}

class MemoryScreen implements ScreenPort {
  captures = 0;
  width = 1920;
  height = 1080;

  info(): ScreenInfo {
    return { width: this.width, height: this.height };
  }

  capture(): ScreenCapture {
    this.captures += 1;
    return { width: this.width, height: this.height, pngBase64: Buffer.from("fake-png").toString("base64") };
  }
}

class MemoryInput implements InputPort {
  readonly moves: [number, number][] = [];
  readonly clicks: [number, number, PointerButton][] = [];
  readonly typed: string[] = [];
  readonly keys: string[] = [];

  move(x: number, y: number): void {
    this.moves.push([x, y]);
  }

  click(x: number, y: number, button: PointerButton): void {
    this.clicks.push([x, y, button]);
  }

  type(text: string): void {
    this.typed.push(text);
  }

  key(name: string): void {
    this.keys.push(name);
  }
}

/* --------------------------------------------------------------- fixtures */

const FULL_GRANT: GenesisGrant = {
  subject: "trading-bot",
  capabilities: [...BRIDGE_CAPABILITIES],
  fileRoots: ["/work"],
  browserHosts: ["shop.example.com", "*.example.com"],
  appIds: ["notes"],
};

function grant(overrides: Partial<GenesisGrant> = {}): GenesisGrant {
  return { ...FULL_GRANT, ...overrides };
}

function pages(): Record<string, BrowserPage> {
  const page = (number: number, extra: string): BrowserPage => ({
    url: `https://shop.example.com/items?page=${number}`,
    title: `Items page ${number}`,
    html: `<html><body><h1>Page ${number}</h1>${extra}</body></html>`,
  });
  return {
    "https://shop.example.com/items?page=1": page(
      1,
      '<a rel="next" href="/items?page=2">Next</a><a href="/items?page=2">2</a><a href="/items?page=3">3</a>',
    ),
    "https://shop.example.com/items?page=2": page(
      2,
      '<a rel="prev" href="/items?page=1">Previous</a><a rel="next" href="/items?page=3">Next</a><a href="/items?page=1">1</a><a href="/items?page=3">3</a>',
    ),
    "https://shop.example.com/items?page=3": page(
      3,
      '<a rel="prev" href="/items?page=2">Previous</a><a href="/items?page=1">1</a><a href="/items?page=2">2</a>',
    ),
  };
}

function makeBridge(
  overrides: Partial<GenesisGrant> = {},
  limits: { maxReadBytes?: number; maxWriteBytes?: number; maxEntries?: number; maxPageBytes?: number; maxLinks?: number; maxTextLength?: number } = {},
) {
  const ledger = new EventLedger([], CLOCK);
  const files = new MemoryFs(
    {
      "/work/notes/a.txt": "alpha beta",
      "/work/notes/b.md": "# Beta\nsecond note",
      "/work/data.csv": "a,b\n1,2",
    },
    ["/work/secret.bin"],
  );
  files.write("/work/secret.bin", "beta but unreadable");
  const browser = new MemoryBrowser(pages());
  const apps = new MemoryApps([
    {
      id: "notes",
      name: "Notes",
      commands: [
        { name: "append", description: "Append text" },
        { name: "noop", description: "Do nothing" },
        { name: "fail", description: "Always fails" },
      ],
    },
    { id: "terminal", name: "Terminal", commands: [{ name: "run", description: "Run a command" }] },
  ]);
  const screen = new MemoryScreen();
  const input = new MemoryInput();
  const bridge = new GenesisBridge({
    grant: grant(overrides),
    ports: { files, browser, apps, screen, input },
    clock: CLOCK,
    ledger,
    limits,
  });
  return { bridge, ledger, files, browser, apps, screen, input };
}

/* ----------------------------------------------------------------- grants */

test("grants normalise, deduplicate and reject malformed input", () => {
  const access = new GenesisAccess(
    grant({
      capabilities: ["files.write", "files.read", "files.write"],
      fileRoots: ["/work/", "/work"],
      browserHosts: ["SHOP.Example.COM", "shop.example.com"],
      appIds: [" notes ", "notes"],
      expiresAt: "2026-10-30T00:00:00Z",
    }),
    CLOCK,
  );
  assert.deepEqual(access.capabilities, ["files.read", "files.write"]);
  assert.deepEqual(access.fileRoots, ["/work"]);
  assert.deepEqual(access.browserHosts, ["shop.example.com"]);
  assert.deepEqual(access.appIds, ["notes"]);
  assert.equal(access.expiresAt, "2026-10-30T00:00:00.000Z");
  assert.equal(access.expired(), false);
  assert.equal(access.allows("files.read"), true);
  assert.equal(access.allows("files.write"), true);
  assert.equal(access.allows("files.delete" as never), false);

  assert.throws(() => new GenesisAccess(grant({ subject: "Bad Subject" })), /invalid grant subject/);
  assert.throws(() => new GenesisAccess(grant({ capabilities: [] })), /at least one capability/);
  assert.throws(() => new GenesisAccess(grant({ capabilities: ["files.delete" as never] })), /unknown capability/);
  assert.throws(() => new GenesisAccess(grant({ browserHosts: ["https://example.com"] })), /invalid browser host/);
  assert.throws(() => new GenesisAccess(grant({ appIds: ["notes", " "] })), /app id cannot be empty/);
  assert.throws(() => new GenesisAccess(grant({ expiresAt: "not-a-date" })), /grant expiry is not a date/);
  assert.throws(() => normaliseBridgePath("relative/path"), /must be absolute/);
  assert.throws(() => normaliseBridgePath("/work/../etc"), /may not contain \. or \.\./);
  assert.throws(() => normaliseBridgePath("/work/\u0000evil"), /control character/);
  assert.equal(normaliseBridgePath("/work//notes/"), "/work/notes");
  assert.equal(normaliseBridgePath("/"), "/");
});

test("an expired grant denies every capability", () => {
  const access = new GenesisAccess(grant({ expiresAt: "2026-10-28T00:00:00Z" }), CLOCK);
  assert.equal(access.expired(), true);
  assert.throws(() => access.assertCapability("files.read"), /grant expired at 2026-10-28T00:00:00.000Z/);
  assert.throws(() => access.assertPath("/work/notes/a.txt", "read"), /grant expired/);
});

test("host scope enforces exact and wildcard allowlists without granting apexes", () => {
  const access = new GenesisAccess(grant(), CLOCK);
  assert.equal(access.assertHost("https://shop.example.com/items").hostname, "shop.example.com");
  assert.equal(access.assertHost("http://shop.example.com:8080/items").port, "8080");
  assert.equal(access.assertHost("https://a.example.com/page").hostname, "a.example.com");
  assert.throws(() => access.assertHost("https://example.com/"), /host is not granted: example.com/);
  assert.throws(() => access.assertHost("https://badexample.com/"), /host is not granted/);
  assert.throws(() => access.assertHost("ftp://shop.example.com/"), /only http and https/);
  assert.throws(() => access.assertHost("https://user:pass@shop.example.com/"), /may not embed credentials/);
  assert.throws(() => access.assertHost("not a url"), /not a URL/);

  const paginateOnly = new GenesisAccess(grant({ capabilities: ["browser.paginate"] }), CLOCK);
  assert.equal(paginateOnly.assertHostScope("https://shop.example.com/items").hostname, "shop.example.com");
  assert.throws(() => paginateOnly.assertHostScope("https://evil.test/"), /host is not granted/);
  assert.throws(() => paginateOnly.assertHost("https://shop.example.com/items"), /capability denied/);

  const noHosts = new GenesisAccess(grant({ browserHosts: [] }), CLOCK);
  assert.throws(() => noHosts.assertHost("https://shop.example.com/"), /host is not granted/);
});

/* ------------------------------------------------------------------ files */

test("file access is scoped to granted roots and refuses traversal", () => {
  const { bridge, ledger } = makeBridge();
  assert.equal(bridge.files.read("/work/notes/a.txt"), "alpha beta");
  assert.throws(() => bridge.files.read("/etc/passwd"), /outside the granted roots/);
  assert.throws(() => bridge.files.read("/work/../etc/passwd"), /may not contain/);
  assert.throws(() => bridge.files.read("work/notes/a.txt"), /must be absolute/);
  assert.throws(() => bridge.files.write("/tmp/escape.txt", "nope"), /outside the granted roots/);

  const denied = bridge.journal.entries().filter((entry) => entry.outcome === "denied");
  assert.equal(denied.length, 4);
  assert.deepEqual(denied.map((entry) => entry.action), ["files.read", "files.read", "files.read", "files.write"]);
  assert.equal(bridge.verify().ok, true);
  assert.deepEqual(EventLedger.verify(ledger.all()), { ok: true });

  const rootGrant = new GenesisAccess(grant({ fileRoots: ["/"] }), CLOCK);
  assert.equal(rootGrant.assertPath("/etc/passwd", "read"), "/etc/passwd");
  const noRoots = new GenesisAccess(grant({ fileRoots: [] }), CLOCK);
  assert.throws(() => noRoots.assertPath("/work/a.txt", "read"), /outside the granted roots/);
});

test("scoped files list, stat, read and write within limits", () => {
  const { bridge } = makeBridge();
  assert.deepEqual(
    bridge.files.list("/work").map((entry) => [entry.path, entry.kind]),
    [
      ["/work/data.csv", "file"],
      ["/work/notes", "directory"],
      ["/work/secret.bin", "file"],
    ],
  );
  assert.deepEqual(bridge.files.stat("/work/notes"), { path: "/work/notes", kind: "directory", bytes: 0 });
  assert.equal(bridge.files.stat("/work/missing"), undefined);
  assert.throws(() => bridge.files.read("/work/missing"), /no such path/);
  assert.throws(() => bridge.files.read("/work/notes"), /not a file/);
  assert.deepEqual(bridge.files.write("/work/notes/c.txt", "gamma"), {
    path: "/work/notes/c.txt",
    kind: "file",
    bytes: 5,
  });
  assert.equal(bridge.files.read("/work/notes/c.txt"), "gamma");
  assert.equal(bridge.files.stat("/work/notes/c.txt")?.bytes, 5);

  assert.throws(() => bridge.files.write("/work/notes/d.txt", null as never), /must be text/);
  assert.throws(() => makeBridge({}, { maxReadBytes: 5 }).bridge.files.read("/work/notes/a.txt"), /read limit/);
  assert.throws(() => makeBridge({}, { maxWriteBytes: 3 }).bridge.files.write("/work/x.txt", "four"), /write limit/);
  assert.throws(() => makeBridge({}, { maxEntries: 2 }).bridge.files.list("/work"), /exceeds 2 entries/);
  assert.throws(() => makeBridge({}, { maxReadBytes: 0 }), /maxReadBytes is invalid/);
  assert.throws(() => makeBridge({}, { maxWriteBytes: 1.5 }), /maxWriteBytes is invalid/);
  assert.throws(() => makeBridge({}, { maxEntries: 0 }), /maxEntries is invalid/);
});

test("search matches every term across the granted tree and reports limits", () => {
  const { bridge } = makeBridge();
  assert.deepEqual(
    bridge.files.search("/work", "beta").map((entry) => entry.path),
    ["/work/notes/a.txt", "/work/notes/b.md"],
  );
  assert.deepEqual(
    bridge.files.search("/work", "beta second").map((entry) => entry.path),
    ["/work/notes/b.md"],
  );
  assert.deepEqual(
    bridge.files.search("/work", "alpha", 1).map((entry) => entry.path),
    ["/work/notes/a.txt"],
  );
  assert.deepEqual(
    bridge.files.search("/work", "secret").map((entry) => entry.path),
    ["/work/secret.bin"],
    "an unreadable file is still matched by its path",
  );
  bridge.files.write("/work/notes/c.txt", "gamma");
  assert.deepEqual(
    bridge.files.search("/work/notes", "gamma").map((entry) => entry.path),
    ["/work/notes/c.txt"],
    "a file written after construction is visible to search",
  );
  assert.throws(() => bridge.files.search("/work", "  "), /search query is required/);
  assert.throws(() => bridge.files.search("/work", "beta", 0), /limit is out of range/);
  assert.throws(() => bridge.files.search("/work", "beta", 501), /limit is out of range/);
  assert.throws(() => bridge.files.search("/etc", "beta"), /outside the granted roots/);
  assert.throws(() => makeBridge({}, { maxEntries: 2 }).bridge.files.search("/work", "beta"), /search exceeds 2 entries/);
});

/* ---------------------------------------------------------------- journal */

test("the audit journal redacts secrets and stays hash-chained", () => {
  const ledger = new EventLedger([], CLOCK);
  const journal = new AuditJournal({ ledger, clock: CLOCK });
  const entry = journal.record({
    actor: "trading-bot",
    action: "test",
    subject: "subject",
    outcome: "ok",
    detail: {
      token: "abc",
      nested: { password: "hunter2", note: "kept" },
      list: [{ apiKey: "k" }, "plain"],
      authorization: "Bearer x",
      big: 12n,
      missing: undefined,
      fn: () => 1,
    },
  });
  assert.equal(entry.detail.token, "[redacted]");
  assert.deepEqual(entry.detail.nested, { password: "[redacted]", note: "kept" });
  assert.deepEqual(entry.detail.list, [{ apiKey: "[redacted]" }, "plain"]);
  assert.equal(entry.detail.authorization, "[redacted]");
  assert.equal(entry.detail.big, "12");
  assert.equal(entry.detail.missing, null);
  assert.equal(entry.detail.fn, "[function]");
  assert.match(entry.id, /^jnl_/);
  assert.equal(entry.at, "2026-10-29T00:00:00.000Z");

  assert.equal(journal.verify().ok, true);
  assert.equal(journal.ledgerEvents().length, 1);
  assert.equal(journal.ledgerEvents()[0]!.type, "bridge.test");

  const shallow = journal.entries();
  shallow[0]!.detail.token = "mutated";
  assert.equal(journal.entries()[0]!.detail.token, "[redacted]");

  assert.throws(
    () => journal.record({ actor: " ", action: "test", subject: "x", outcome: "ok", detail: {} }),
    /actor, an action and a subject/,
  );
  assert.throws(
    () => journal.record({ actor: "a", action: " ", subject: "x", outcome: "ok", detail: {} }),
    /actor, an action and a subject/,
  );

  let deep: Record<string, unknown> = { value: "bottom" };
  for (let index = 0; index < 12; index += 1) deep = { child: deep };
  const sanitised = sanitiseJournalDetail(deep);
  assert.equal(JSON.stringify(sanitised).includes("[truncated]"), true);
});

/* ---------------------------------------------------------------- browser */

test("browser navigation is host-scoped and page-size limited", () => {
  const { bridge, browser, ledger } = makeBridge();
  const page = bridge.browser.open("https://shop.example.com/items?page=1");
  assert.equal(page.title, "Items page 1");
  assert.match(page.html, /Page 1/);
  assert.throws(() => bridge.browser.open("https://evil.test/"), /host is not granted/);
  assert.equal(bridge.journal.entries().at(-1)!.outcome, "denied");

  const redirected = makeBridge();
  redirected.browser.add("https://shop.example.com/redirect", {
    url: "https://evil.test/landing",
    title: "Evil",
    html: "<html></html>",
  });
  assert.throws(
    () => redirected.bridge.browser.open("https://shop.example.com/redirect"),
    /host is not granted/,
  );
  assert.equal(redirected.bridge.journal.entries().at(-1)!.outcome, "error");
  assert.equal(ledger.ofType("bridge.browser.open").length, 2, "the allowed open and the denied open are both journaled");

  const small = makeBridge({}, { maxPageBytes: 20 });
  assert.throws(() => small.bridge.browser.open("https://shop.example.com/items?page=1"), /page exceeds the 20-byte limit/);
  assert.throws(() => makeBridge({}, { maxPageBytes: 0 }), /maxPageBytes is invalid/);
  assert.equal(browser.open("https://shop.example.com/items?page=1").title, "Items page 1");
});

test("pagination extracts next, previous and numbered links", () => {
  const html = `
    <nav>
      <a rel="prev" href="/items?page=1">Previous</a>
      <a href="?page=3" rel="next">Next</a>
      <a href="/items?page=1">1</a>
      <a href="/items?page=2">2</a>
      <a href="/items?page=2">2</a>
      <a href="mailto:shop@example.com">Mail</a>
      <a href="javascript:void(0)">Script</a>
    </nav>`;
  const links = extractPagination(html, "https://shop.example.com/items?page=2");
  assert.equal(links.next, "https://shop.example.com/items?page=3");
  assert.equal(links.previous, "https://shop.example.com/items?page=1");
  assert.deepEqual(
    links.numbered.map((link) => [link.label, link.url]),
    [
      ["1", "https://shop.example.com/items?page=1"],
      ["2", "https://shop.example.com/items?page=2"],
    ],
  );
  assert.throws(() => extractPagination(html, "not a url"), /not a URL/);
  assert.throws(() => extractPagination(html, "ftp://example.com/"), /http\(s\) base URL/);
  assert.throws(() => extractPagination(null as never, "https://example.com/"), /html must be text/);

  const paginateOnly = makeBridge({ capabilities: ["browser.paginate"] });
  const extracted = paginateOnly.bridge.browser.pagination({
    url: "https://shop.example.com/items?page=1",
    title: "one",
    html: '<a rel="next" href="/items?page=2">Next</a>',
  });
  assert.equal(extracted.next, "https://shop.example.com/items?page=2");
  assert.equal(paginateOnly.bridge.journal.entries().at(-1)!.outcome, "ok");
  assert.throws(
    () => paginateOnly.bridge.browser.pagination({ url: "https://evil.test/", title: "x", html: "" }),
    /host is not granted/,
  );
});

test("crawling follows next links, stops at the limit and detects cycles", () => {
  const { bridge, ledger } = makeBridge();
  const result = bridge.browser.crawl("https://shop.example.com/items?page=1", { maxPages: 10 });
  assert.equal(result.pages.length, 3);
  assert.deepEqual(result.visited, [
    "https://shop.example.com/items?page=1",
    "https://shop.example.com/items?page=2",
    "https://shop.example.com/items?page=3",
  ]);
  assert.equal(result.stoppedReason, "complete");
  assert.equal(ledger.ofType("bridge.browser.crawl").length, 1);
  assert.equal(ledger.ofType("bridge.browser.open").length, 3);

  const limited = bridge.browser.crawl("https://shop.example.com/items?page=1", { maxPages: 2 });
  assert.equal(limited.pages.length, 2);
  assert.equal(limited.stoppedReason, "limit");

  const numbered = bridge.browser.crawl("https://shop.example.com/items?page=1", {
    maxPages: 10,
    follow: "numbered",
  });
  assert.equal(numbered.pages.length, 3);
  assert.equal(numbered.stoppedReason, "complete");

  const cycleBrowser = new MemoryBrowser({
    "https://shop.example.com/a": { url: "https://shop.example.com/a", title: "A", html: '<a rel="next" href="/b">Next</a>' },
    "https://shop.example.com/b": { url: "https://shop.example.com/b", title: "B", html: '<a rel="next" href="/a">Next</a>' },
  });
  const cycle = new GenesisBridge({
    grant: grant(),
    ports: {
      files: new MemoryFs(),
      browser: cycleBrowser,
      apps: new MemoryApps([]),
      screen: new MemoryScreen(),
      input: new MemoryInput(),
    },
    clock: CLOCK,
  });
  const cycled = cycle.browser.crawl("https://shop.example.com/a");
  assert.equal(cycled.pages.length, 2);
  assert.equal(cycled.stoppedReason, "cycle");

  assert.throws(() => bridge.browser.crawl("https://shop.example.com/items?page=1", { maxPages: 0 }), /maxPages is out of range/);
  assert.throws(() => bridge.browser.crawl("https://shop.example.com/items?page=1", { maxPages: 51 }), /maxPages is out of range/);
  assert.throws(
    () => bridge.browser.crawl("https://shop.example.com/items?page=1", { follow: "all" as never }),
    /unknown follow mode/,
  );
  assert.throws(() => bridge.browser.crawl("https://evil.test/"), /host is not granted/);
});

test("link collection filters hosts, deduplicates and caps the list", () => {
  const { bridge } = makeBridge();
  const page: BrowserPage = {
    url: "https://shop.example.com/items",
    title: "Items",
    html: `
      <a href="/items?page=2">2</a>
      <a href="https://shop.example.com/items?page=2">2 again</a>
      <a href="https://a.example.com/detail">Detail</a>
      <a href="https://evil.test/">Evil</a>
      <a href="mailto:shop@example.com">Mail</a>
      <a href="javascript:void(0)">Script</a>`,
  };
  assert.deepEqual(bridge.browser.collectLinks(page), [
    "https://shop.example.com/items?page=2",
    "https://a.example.com/detail",
  ]);
  assert.deepEqual(bridge.browser.collectLinks(page, { sameHost: true }), [
    "https://shop.example.com/items?page=2",
  ]);
  assert.deepEqual(
    makeBridge({}, { maxLinks: 1 }).bridge.browser.collectLinks(page),
    ["https://shop.example.com/items?page=2"],
  );
  assert.throws(() => makeBridge({}, { maxLinks: 0 }), /maxLinks is invalid/);
});

/* ------------------------------------------------------------------- apps */

test("app control launches, invokes and journals results without arguments", () => {
  const { bridge, apps, ledger } = makeBridge();
  assert.deepEqual(bridge.apps.list().map((app) => app.name), ["Notes", "Terminal"]);
  assert.equal(bridge.apps.launch("notes").running, true);
  assert.deepEqual(bridge.apps.commands("notes").map((command) => command.name), ["append", "noop", "fail"]);
  assert.deepEqual(bridge.apps.invoke("notes", "append", { text: "hello" }), {
    app: "notes",
    command: "append",
    args: { text: "hello" },
  });
  assert.equal(bridge.apps.invoke("notes", "noop"), undefined, "an undefined result is still a successful call");
  assert.throws(() => bridge.apps.invoke("notes", "missing"), /does not declare command missing/);
  assert.throws(() => bridge.apps.invoke("terminal", "run", {}), /app is not granted/);
  assert.throws(() => bridge.apps.invoke("notes", "fail"), /the app failed/);

  bridge.apps.focus("notes");
  bridge.apps.close("notes");
  assert.deepEqual(apps.focused, ["notes"]);

  const journal = bridge.journal.entries();
  assert.deepEqual(
    journal.map((entry) => [entry.action, entry.outcome]),
    [
      ["apps.list", "ok"],
      ["apps.launch", "ok"],
      ["apps.commands", "ok"],
      ["apps.invoke", "ok"],
      ["apps.invoke", "ok"],
      ["apps.invoke", "denied"],
      ["apps.invoke", "denied"],
      ["apps.invoke", "error"],
      ["apps.focus", "ok"],
      ["apps.close", "ok"],
    ],
  );
  const invoke = journal[3]!;
  assert.equal(invoke.detail.command, "append");
  assert.match(String(invoke.detail.resultDigest), /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(invoke.detail).includes("hello"), false);
  assert.equal(ledger.ofType("bridge.apps.invoke").length, 5);
});

test("front-to-back control brings an app forward and stops on failure", () => {
  const { bridge, apps } = makeBridge();
  const result = bridge.apps.frontToBack("notes", [
    { command: "append", args: { text: "a" } },
    { command: "append", args: { text: "b" } },
  ]);
  assert.equal(result.app.running, true);
  assert.equal(result.results.length, 2);
  assert.deepEqual(apps.focused, ["notes"]);
  assert.deepEqual(apps.invocations.map((entry) => entry.args.text), ["a", "b"]);
  assert.equal(bridge.journal.entries().at(-1)!.outcome, "ok");

  const alreadyRunning = bridge.apps.frontToBack("notes", [{ command: "noop" }]);
  assert.equal(alreadyRunning.app.running, true);
  assert.equal(alreadyRunning.results.length, 1);

  assert.throws(() => bridge.apps.frontToBack("notes", []), /at least one step/);
  assert.throws(() => bridge.apps.frontToBack("terminal", [{ command: "run" }]), /app is not granted/);
  assert.throws(
    () => bridge.apps.frontToBack("notes", [
      { command: "append", args: { text: "c" } },
      { command: "missing" },
      { command: "append", args: { text: "d" } },
    ]),
    /does not declare command missing/,
  );
  assert.deepEqual(
    apps.invocations.filter((entry) => entry.command === "append").map((entry) => entry.args.text),
    ["a", "b", "c"],
  );
  assert.equal(bridge.journal.entries().at(-1)!.outcome, "error");
});

/* ----------------------------------------------------------- input/screen */

test("input and screen are bounded and journaled without plaintext", () => {
  const { bridge, input, screen } = makeBridge();
  bridge.input.move(10, 20);
  bridge.input.click(10, 20, "right");
  bridge.input.type("secret text");
  bridge.input.key("Enter");
  const capture = bridge.input.capture();
  assert.deepEqual(input.moves, [[10, 20]]);
  assert.deepEqual(input.clicks, [[10, 20, "right"]]);
  assert.deepEqual(input.typed, ["secret text"]);
  assert.deepEqual(input.keys, ["Enter"]);
  assert.equal(screen.captures, 1);
  assert.equal(capture.width, 1920);
  assert.equal(capture.pngBase64, Buffer.from("fake-png").toString("base64"));

  const typed = bridge.journal.entries().find((entry) => entry.action === "input.type")!;
  assert.equal(typed.detail.chars, 11);
  assert.equal(typed.detail.sha256, createHash("sha256").update("secret text").digest("hex"));
  assert.equal(JSON.stringify(typed.detail).includes("secret text"), false);
  const captured = bridge.journal.entries().find((entry) => entry.action === "screen.capture")!;
  assert.equal(captured.detail.width, 1920);
  assert.equal(captured.detail.bytes, 8);
  assert.match(String(captured.detail.sha256), /^[a-f0-9]{64}$/);

  assert.throws(() => bridge.input.move(-1, 0), /outside the 1920x1080 screen/);
  assert.throws(() => bridge.input.click(1920, 0), /outside the/);
  assert.throws(() => bridge.input.move(1.5, 0), /coordinates must be integers/);
  assert.throws(() => bridge.input.click(0, 0, "side" as never), /unknown pointer button/);
  assert.throws(() => bridge.input.key("bad key"), /invalid key name/);
  assert.throws(() => makeBridge({}, { maxTextLength: 3 }).bridge.input.type("four"), /exceeds 3 characters/);
  assert.throws(() => makeBridge({}, { maxTextLength: 0 }), /maxTextLength is invalid/);

  const tiny = makeBridge();
  tiny.screen.width = 0;
  assert.throws(() => tiny.bridge.input.move(0, 0), /invalid size/);
  assert.throws(() => tiny.bridge.input.capture(), /invalid size/);

  const noPointer = makeBridge({ capabilities: ["screen.capture"] });
  assert.throws(() => noPointer.bridge.input.move(0, 0), /capability denied/);
  assert.equal(noPointer.bridge.input.capture().width, 1920);
});

/* ----------------------------------------------------------------- bridge */

test("the bridge composes every subsystem and verifies its ledger", () => {
  const { bridge, ledger } = makeBridge();
  bridge.files.read("/work/notes/a.txt");
  bridge.browser.open("https://shop.example.com/items?page=1");
  bridge.apps.launch("notes");
  bridge.input.move(1, 2);
  bridge.input.capture();

  const status = bridge.status();
  assert.equal(status.subject, "trading-bot");
  assert.equal(status.capabilities.length, BRIDGE_CAPABILITIES.length);
  assert.equal(status.expired, false);
  assert.equal(status.journalEntries, 5);
  assert.equal(status.ledgerLength, 5);
  assert.equal(bridge.verify().ok, true);
  assert.deepEqual(EventLedger.verify(ledger.all()), { ok: true });

  assert.throws(() => bridge.files.read("/etc/passwd"), /outside the granted roots/);
  assert.equal(bridge.status().journalEntries, 6);
  assert.equal(bridge.journal.entries().at(-1)!.outcome, "denied");
  assert.equal(bridge.verify().ok, true);
});

test("an expired bridge reports expiry and refuses work", () => {
  const bridge = new GenesisBridge({
    grant: grant({ expiresAt: "2026-10-28T00:00:00Z" }),
    ports: {
      files: new MemoryFs({ "/work/a.txt": "a" }),
      browser: new MemoryBrowser(),
      apps: new MemoryApps([]),
      screen: new MemoryScreen(),
      input: new MemoryInput(),
    },
    clock: CLOCK,
  });
  assert.equal(bridge.status().expired, true);
  assert.throws(() => bridge.files.read("/work/a.txt"), /grant expired/);
  assert.equal(bridge.journal.entries().at(-1)!.outcome, "denied");
});

/* --------------------------------------------------------- direct helpers */

test("standalone scoped access still needs a journal and a grant", () => {
  const access = new GenesisAccess(grant({ capabilities: ["files.read"] }), CLOCK);
  const journal = new AuditJournal({ clock: CLOCK });
  const files = new ScopedFileAccess(new MemoryFs({ "/work/a.txt": "a" }), access, journal);
  assert.equal(files.read("/work/a.txt"), "a");
  assert.equal(journal.entries().length, 1);
  assert.throws(() => files.write("/work/b.txt", "b"), /capability denied/);
  assert.equal(journal.entries().at(-1)!.outcome, "denied");

  const browser = new BrowserAutomation(
    new MemoryBrowser({ "https://shop.example.com/": { url: "https://shop.example.com/", title: "x", html: "" } }),
    access,
    journal,
  );
  assert.throws(() => browser.open("https://shop.example.com/"), /capability denied/);
});
