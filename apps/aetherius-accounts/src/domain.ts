import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Invoice {
  id: string;
  client: string;
  amount: number;
  status: "draft" | "sent" | "paid";
}

export interface AccountsOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Accounts {
  private readonly invoices = new Map<string, Invoice>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: AccountsOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createInvoice(client: string, amount: number): Invoice {
    const invoice: Invoice = { id: newId("invoice"), client, amount, status: "draft" };
    this.invoices.set(invoice.id, invoice);
    this.ledger.append({ type: "accounts.created", actor: "accounts", subject: invoice.id });
    return invoice;
  }

  list(): Invoice[] {
    return Array.from(this.invoices.values());
  }
}
