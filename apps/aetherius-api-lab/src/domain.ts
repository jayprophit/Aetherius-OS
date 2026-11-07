import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface RequestCollection {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
}

export interface ApiLabOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class ApiLab {
  private readonly collections = new Map<string, RequestCollection>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: ApiLabOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createCollection(name: string, method: RequestCollection["method"], url: string): RequestCollection {
    const collection: RequestCollection = { id: newId("api"), name, method, url };
    this.collections.set(collection.id, collection);
    this.ledger.append({ type: "api-lab.created", actor: "api-lab", subject: collection.id });
    return collection;
  }

  list(): RequestCollection[] {
    return Array.from(this.collections.values());
  }
}
