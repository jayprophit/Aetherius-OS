import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Source {
  id: string;
  title: string;
  type: "article" | "book" | "web";
  url?: string;
}

export interface ResearchOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Research {
  private readonly sources = new Map<string, Source>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: ResearchOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  add(title: string, type: Source["type"], url?: string): Source {
    const source: Source = { id: newId("source"), title, type, url };
    this.sources.set(source.id, source);
    this.ledger.append({ type: "research.added", actor: "research", subject: source.id });
    return source;
  }

  list(): Source[] {
    return Array.from(this.sources.values());
  }
}
