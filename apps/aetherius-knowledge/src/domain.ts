import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Page {
  id: string;
  title: string;
  blocks: string[];
}

export interface KnowledgeOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Knowledge {
  private readonly pages = new Map<string, Page>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: KnowledgeOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(title: string, blocks: string[]): Page {
    const page: Page = { id: newId("page"), title, blocks };
    this.pages.set(page.id, page);
    this.ledger.append({ type: "knowledge.created", actor: "knowledge", subject: page.id });
    return page;
  }

  list(): Page[] {
    return Array.from(this.pages.values());
  }
}
