import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Browser core.
 *
 * Tabs, history, bookmarks, a host blocklist, download records and a bounded
 * pagination-link extractor. It models a browser session; it does not render
 * HTML, execute JavaScript or claim a network stack. The pagination extractor
 * reads well-formed anchors only and is not a DOM.
 */

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  history: string[];
  index: number;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  tags: string[];
  createdAt: string;
}

export interface DownloadRecord {
  id: string;
  url: string;
  filename: string;
  bytes: number;
  status: "completed" | "failed";
  at: string;
}

export interface PaginationLinks {
  next: string | null;
  previous: string | null;
  numbered: { label: string; url: string }[];
}

export interface BrowserOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

function parseUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`not a URL: ${value}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`only http and https are supported: ${value}`);
  }
  return url;
}

export class BrowserSession {
  private readonly tabs = new Map<string, BrowserTab>();
  private readonly bookmarks = new Map<string, Bookmark>();
  private readonly downloads: DownloadRecord[] = [];
  private readonly blockedHosts = new Set<string>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: BrowserOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  open(url: string, title?: string): BrowserTab {
    const parsed = parseUrl(url);
    this.assertAllowed(parsed);
    const at = nowIso(this.clock);
    const tab: BrowserTab = {
      id: newId("tab"),
      url: parsed.toString(),
      title: title?.trim() || parsed.hostname,
      history: [parsed.toString()],
      index: 0,
      createdAt: at,
    };
    this.tabs.set(tab.id, tab);
    this.ledger.append({ type: "browser.tab.opened", actor: "browser", subject: tab.id, data: { url: tab.url } });
    return structuredClone(tab);
  }

  navigate(tabId: string, url: string, title?: string): BrowserTab {
    const tab = this.requireTab(tabId);
    const parsed = parseUrl(url);
    this.assertAllowed(parsed);
    const next = parsed.toString();
    tab.history = tab.history.slice(0, tab.index + 1);
    tab.history.push(next);
    if (tab.history.length > 100) tab.history.shift();
    tab.index = tab.history.length - 1;
    tab.url = next;
    tab.title = title?.trim() || parsed.hostname;
    this.tabs.set(tabId, tab);
    this.ledger.append({ type: "browser.tab.navigated", actor: "browser", subject: tabId, data: { url: next } });
    return structuredClone(tab);
  }

  back(tabId: string): BrowserTab {
    const tab = this.requireTab(tabId);
    if (tab.index > 0) {
      tab.index -= 1;
      tab.url = tab.history[tab.index]!;
      tab.title = new URL(tab.url).hostname;
      this.tabs.set(tabId, tab);
    }
    return structuredClone(tab);
  }

  forward(tabId: string): BrowserTab {
    const tab = this.requireTab(tabId);
    if (tab.index < tab.history.length - 1) {
      tab.index += 1;
      tab.url = tab.history[tab.index]!;
      tab.title = new URL(tab.url).hostname;
      this.tabs.set(tabId, tab);
    }
    return structuredClone(tab);
  }

  close(tabId: string): boolean {
    this.requireTab(tabId);
    this.tabs.delete(tabId);
    this.ledger.append({ type: "browser.tab.closed", actor: "browser", subject: tabId, data: {} });
    return true;
  }

  tabsList(): BrowserTab[] {
    return [...this.tabs.values()]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((tab) => structuredClone(tab));
  }

  bookmark(tabId: string, tags: readonly string[] = []): Bookmark {
    const tab = this.requireTab(tabId);
    if ([...this.bookmarks.values()].some((bookmark) => bookmark.url === tab.url)) {
      throw new Error(`already bookmarked: ${tab.url}`);
    }
    const bookmark: Bookmark = {
      id: newId("bkm"),
      url: tab.url,
      title: tab.title,
      tags: [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].sort(),
      createdAt: nowIso(this.clock),
    };
    this.bookmarks.set(bookmark.id, bookmark);
    this.ledger.append({ type: "browser.bookmark.added", actor: "browser", subject: bookmark.id, data: { url: bookmark.url } });
    return { ...bookmark };
  }

  listBookmarks(query?: string): Bookmark[] {
    const terms = query?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
    return [...this.bookmarks.values()]
      .filter((bookmark) => {
        if (terms.length === 0) return true;
        const haystack = `${bookmark.title}\n${bookmark.url}\n${bookmark.tags.join(" ")}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((bookmark) => ({ ...bookmark }));
  }

  removeBookmark(bookmarkId: string): boolean {
    if (!this.bookmarks.delete(bookmarkId)) throw new Error(`no bookmark: ${bookmarkId}`);
    return true;
  }

  recordDownload(input: { url: string; filename: string; bytes: number; status: "completed" | "failed" }): DownloadRecord {
    parseUrl(input.url);
    if (!input.filename.trim()) throw new Error("a download needs a filename");
    if (!Number.isInteger(input.bytes) || input.bytes < 0) throw new Error(`download size is invalid: ${input.bytes}`);
    const record: DownloadRecord = {
      id: newId("dwn"),
      url: input.url,
      filename: input.filename.trim(),
      bytes: input.bytes,
      status: input.status,
      at: nowIso(this.clock),
    };
    this.downloads.push(record);
    return { ...record };
  }

  downloadsList(): DownloadRecord[] {
    return this.downloads.map((record) => ({ ...record }));
  }

  blockHost(host: string): void {
    const normalised = host.trim().toLowerCase();
    if (!normalised || normalised.includes("/") || normalised.includes(" ")) throw new Error(`not a host: ${host}`);
    this.blockedHosts.add(normalised);
  }

  unblockHost(host: string): void {
    this.blockedHosts.delete(host.trim().toLowerCase());
  }

  blockedHostsList(): string[] {
    return [...this.blockedHosts].sort();
  }

  isBlocked(url: string): boolean {
    const host = parseUrl(url).hostname.toLowerCase();
    return [...this.blockedHosts].some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
  }

  /**
   * Extract next/previous/numbered pagination links from well-formed anchors.
   * Relative links resolve against `baseUrl`; anything that is not http(s) is
   * dropped. This is deliberately a bounded extractor, not an HTML parser.
   */
  paginationLinks(html: string, baseUrl: string): PaginationLinks {
    if (typeof html !== "string") throw new Error("html must be text");
    const base = parseUrl(baseUrl);
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
      const rel = (relMatch?.[1] ?? relMatch?.[2] ?? relMatch?.[3] ?? "").toLowerCase();
      const isNext = rel.split(/\s+/).includes("next") || ["next", "next page", "›", "»", ">"].includes(text);
      const isPrevious =
        rel.split(/\s+/).includes("prev") ||
        rel.split(/\s+/).includes("previous") ||
        ["prev", "previous", "previous page", "‹", "«", "<"].includes(text);
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

  private requireTab(tabId: string): BrowserTab {
    const tab = this.tabs.get(tabId);
    if (!tab) throw new Error(`no tab: ${tabId}`);
    return structuredClone(tab);
  }

  private assertAllowed(url: URL): void {
    const host = url.hostname.toLowerCase();
    const blocked = [...this.blockedHosts].find((entry) => host === entry || host.endsWith(`.${entry}`));
    if (blocked) throw new Error(`host is blocked: ${blocked}`);
  }
}
