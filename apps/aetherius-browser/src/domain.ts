import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Tab {
  id: string;
  url: string;
  title: string;
}

export interface BrowserOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Browser {
  private readonly tabs: Tab[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: BrowserOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  open(url: string, title = "New Tab"): Tab {
    const tab: Tab = { id: newId("tab"), url, title };
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
