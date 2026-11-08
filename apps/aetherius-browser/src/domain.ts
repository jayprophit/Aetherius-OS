import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Tab {
  id: string;
  url: string;
  title: string;
}

export interface BrowserOptions {
  ledger?: EventLedger;
  clock?: () => Date;
  maxTabs?: number;
}

const IFRAME_SANDBOX = "allow-scripts allow-forms allow-popups";
const BLOCKED_SCHEMES = new Set(["javascript:", "data:", "vbscript:", "file:", "blob:"]);
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function validateTabUrl(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) throw new Error("invalid url: empty");
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`invalid url: cannot parse "${raw}"`);
  }
  const proto = parsed.protocol.toLowerCase();
  if (BLOCKED_SCHEMES.has(proto)) throw new Error(`blocked url scheme: ${proto} (iframe restrictions)`);
  if (!ALLOWED_PROTOCOLS.has(proto)) throw new Error(`blocked url scheme: ${proto} (only http/https allowed in iframe tabs)`);
  return parsed.toString();
}

export class Browser {
  private readonly tabs: Tab[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  private readonly maxTabs: number;

  constructor(options: BrowserOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.maxTabs = options.maxTabs ?? 32;
  }

  /** Sandbox policy to apply to the iframe that renders a tab. Never allow-same-origin. */
  iframeSandbox(): string {
    return IFRAME_SANDBOX;
  }

  open(url: string, title = "New Tab"): Tab {
    const validated = validateTabUrl(url);
    if (this.tabs.length >= this.maxTabs) {
      throw new Error(`tab quota exceeded: max ${this.maxTabs} tabs`);
    }
    const tab: Tab = { id: newId("tab"), url: validated, title: title || "New Tab" };
    this.tabs.push(tab);
    this.ledger.append({ type: "browser.opened", actor: "browser", subject: tab.id });
    return tab;
  }

  close(tabId: string): void {
    const idx = this.tabs.findIndex((t) => t.id === tabId);
    if (idx === -1) throw new Error("tab not found");
    this.tabs.splice(idx, 1);
    this.ledger.append({ type: "browser.closed", actor: "browser", subject: tabId });
  }

  listTabs(): Tab[] {
    return [...this.tabs];
  }
}
