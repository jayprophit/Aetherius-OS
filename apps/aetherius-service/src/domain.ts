import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Ticket {
  id: string;
  subject: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in-progress" | "resolved";
}

export interface ServiceOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Service {
  private readonly tickets = new Map<string, Ticket>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: ServiceOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createTicket(subject: string, priority: Ticket["priority"]): Ticket {
    const ticket: Ticket = { id: newId("ticket"), subject, priority, status: "open" };
    this.tickets.set(ticket.id, ticket);
    this.ledger.append({ type: "service.ticket.created", actor: "service", subject: ticket.id });
    return ticket;
  }

  list(): Ticket[] {
    return Array.from(this.tickets.values());
  }
}
