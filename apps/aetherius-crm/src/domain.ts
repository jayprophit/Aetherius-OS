import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Deal {
  id: string;
  title: string;
  amount: number;
  stage: "lead" | "qualified" | "proposal" | "closed";
}

export interface CRMOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class CRM {
  private readonly deals = new Map<string, Deal>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: CRMOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createDeal(title: string, amount: number): Deal {
    const deal: Deal = { id: newId("deal"), title, amount, stage: "lead" };
    this.deals.set(deal.id, deal);
    this.ledger.append({ type: "crm.deal.created", actor: "crm", subject: deal.id });
    return deal;
  }

  listDeals(): Deal[] {
    return Array.from(this.deals.values());
  }
}
