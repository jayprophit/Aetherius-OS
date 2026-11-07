import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface SearchIndex {
  id: string;
  query: string;
  results: { id: string; title: string; snippet: string }[];
}

export interface SearchOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class SearchService {
  private readonly index = new Map<string, { title: string; snippet: string }>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: SearchOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  indexDocument(id: string, title: string, snippet: string): void {
    this.index.set(id, { title, snippet });
    this.ledger.append({ type: "search.indexed", actor: "search", subject: id });
  }

  search(query: string): SearchIndex {
    const q = query.toLowerCase();
    const results: { id: string; title: string; snippet: string }[] = [];
    for (const [id, doc] of this.index) {
      if (doc.title.toLowerCase().includes(q) || doc.snippet.toLowerCase().includes(q)) {
        results.push({ id, title: doc.title, snippet: doc.snippet });
      }
    }
    const idx: SearchIndex = { id: newId("search"), query, results };
    this.ledger.append({ type: "search.queried", actor: "search", subject: idx.id });
    return idx;
  }
}
