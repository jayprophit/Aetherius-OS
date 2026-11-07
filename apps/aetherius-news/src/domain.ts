import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  summary: string;
}

export interface NewsOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class NewsService {
  private readonly items = new Map<string, NewsItem>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: NewsOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  add(item: Omit<NewsItem, "id">): NewsItem {
    const news: NewsItem = { ...item, id: newId("news") };
    this.items.set(news.id, news);
    this.ledger.append({ type: "news.added", actor: "news", subject: news.id });
    return news;
  }

  list(): NewsItem[] {
    return Array.from(this.items.values());
  }
}
