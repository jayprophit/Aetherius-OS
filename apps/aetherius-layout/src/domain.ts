import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Page {
  id: string;
  title: string;
  template: string;
  elements: string[];
}

export interface LayoutOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Layout {
  private readonly pages = new Map<string, Page>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: LayoutOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(title: string, template: string, elements: string[]): Page {
    const page: Page = { id: newId("page"), title, template, elements };
    this.pages.set(page.id, page);
    this.ledger.append({ type: "layout.created", actor: "layout", subject: page.id });
    return page;
  }

  list(): Page[] {
    return Array.from(this.pages.values());
  }
}
