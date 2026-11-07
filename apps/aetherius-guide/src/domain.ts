import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
}

export interface GuideOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class GuideService {
  private readonly articles = new Map<string, HelpArticle>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: GuideOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  add(article: Omit<HelpArticle, "id">): HelpArticle {
    const a: HelpArticle = { ...article, id: newId("guide") };
    this.articles.set(a.id, a);
    this.ledger.append({ type: "guide.added", actor: "guide", subject: a.id });
    return a;
  }

  search(query: string): HelpArticle[] {
    const q = query.toLowerCase();
    return Array.from(this.articles.values()).filter(
      (a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
    );
  }
}
