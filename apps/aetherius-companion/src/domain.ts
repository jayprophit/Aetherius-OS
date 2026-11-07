import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Notification {
  id: string;
  title: string;
  body: string;
  priority: "low" | "normal" | "high";
}

export interface CompanionOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class CompanionService {
  private readonly notifications: Notification[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: CompanionOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  send(notification: Omit<Notification, "id">): Notification {
    const n: Notification = { ...notification, id: newId("companion") };
    this.notifications.push(n);
    this.ledger.append({ type: "companion.notified", actor: "companion", subject: n.id });
    return n;
  }

  list(): Notification[] {
    return [...this.notifications];
  }
}
