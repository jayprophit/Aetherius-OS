import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Help & Support domain core.
 *
 * A searchable help topic library plus support tickets with severity,
 * status and escalation. Search is term-based (every term must match) so
 * results stay predictable; it does not emulate ranking or ML.
 */

export type TicketSeverity = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "in-progress" | "resolved" | "closed";

export interface HelpTopic {
  id: string;
  title: string;
  body: string;
  keywords: string[];
  category: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  severity: TicketSeverity;
  status: TicketStatus;
  escalated: boolean;
  messages: string[];
  openedAt: string;
  resolvedAt: string | null;
}

export interface HelpOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

const SEVERITIES: TicketSeverity[] = ["low", "medium", "high", "critical"];

export class HelpSupport {
  private readonly topics = new Map<string, HelpTopic>();
  private readonly tickets = new Map<string, SupportTicket>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: HelpOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addTopic(input: { title: string; body: string; keywords?: string[]; category?: string }): HelpTopic {
    if (typeof input.title !== "string" || input.title.trim().length === 0) {
      throw new Error("a topic needs a title");
    }
    if (typeof input.body !== "string" || input.body.trim().length === 0) {
      throw new Error("a topic needs a body");
    }
    const topic: HelpTopic = {
      id: newId("topic"),
      title: input.title.trim(),
      body: input.body.trim(),
      keywords: [...new Set((input.keywords ?? []).map((k) => k.trim().toLowerCase()).filter(Boolean))],
      category: (input.category ?? "General").trim() || "General",
    };
    this.topics.set(topic.id, topic);
    return structuredClone(topic);
  }

  search(query: string): HelpTopic[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return this.topicsList();
    return [...this.topics.values()]
      .map((topic) => {
        const haystack = `${topic.title}\n${topic.body}\n${topic.keywords.join(" ")}`.toLowerCase();
        const score = terms.filter((term) => haystack.includes(term)).length;
        return { topic, score };
      })
      .filter((entry) => entry.score === terms.length)
      .sort((a, b) => b.score - a.score || a.topic.title.localeCompare(b.topic.title))
      .map((entry) => structuredClone(entry.topic));
  }

  topicsList(): HelpTopic[] {
    return [...this.topics.values()]
      .sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title))
      .map((topic) => structuredClone(topic));
  }

  openTicket(subject: string, severity: TicketSeverity, firstMessage: string): SupportTicket {
    if (typeof subject !== "string" || subject.trim().length === 0) {
      throw new Error("a ticket needs a subject");
    }
    if (!SEVERITIES.includes(severity)) throw new Error(`severity must be one of: ${SEVERITIES.join(", ")}`);
    if (typeof firstMessage !== "string" || firstMessage.trim().length === 0) {
      throw new Error("a ticket needs a first message");
    }
    const ticket: SupportTicket = {
      id: newId("tick"),
      subject: subject.trim(),
      severity,
      status: "open",
      escalated: false,
      messages: [firstMessage.trim()],
      openedAt: nowIso(this.clock),
      resolvedAt: null,
    };
    this.tickets.set(ticket.id, ticket);
    this.ledger.append({ type: "support.ticket_opened", actor: "support", subject: ticket.id, data: { severity } });
    return structuredClone(ticket);
  }

  reply(ticketId: string, message: string): SupportTicket {
    const ticket = this.requireTicket(ticketId);
    if (ticket.status === "closed") throw new Error("a closed ticket cannot receive replies");
    if (typeof message !== "string" || message.trim().length === 0) {
      throw new Error("a reply needs a message");
    }
    ticket.messages.push(message.trim());
    if (ticket.status === "open") ticket.status = "in-progress";
    this.tickets.set(ticketId, ticket);
    return structuredClone(ticket);
  }

  escalate(ticketId: string): SupportTicket {
    const ticket = this.requireTicket(ticketId);
    if (ticket.escalated) throw new Error("the ticket is already escalated");
    if (ticket.status === "closed") throw new Error("a closed ticket cannot be escalated");
    ticket.escalated = true;
    if (ticket.severity === "low" || ticket.severity === "medium") ticket.severity = "high";
    this.tickets.set(ticketId, ticket);
    this.ledger.append({ type: "support.ticket_escalated", actor: "support", subject: ticketId, data: { severity: ticket.severity } });
    return structuredClone(ticket);
  }

  resolve(ticketId: string): SupportTicket {
    const ticket = this.requireTicket(ticketId);
    if (ticket.status === "closed") throw new Error("the ticket is already closed");
    ticket.status = ticket.status === "open" ? "resolved" : ticket.status === "in-progress" ? "resolved" : ticket.status;
    ticket.resolvedAt = nowIso(this.clock);
    this.tickets.set(ticketId, ticket);
    this.ledger.append({ type: "support.ticket_resolved", actor: "support", subject: ticketId, data: {} });
    return structuredClone(ticket);
  }

  close(ticketId: string): SupportTicket {
    const ticket = this.requireTicket(ticketId);
    if (ticket.status !== "resolved") throw new Error("only a resolved ticket can be closed");
    ticket.status = "closed";
    this.tickets.set(ticketId, ticket);
    return structuredClone(ticket);
  }

  ticketsList(status?: TicketStatus): SupportTicket[] {
    return [...this.tickets.values()]
      .filter((ticket) => status === undefined || ticket.status === status)
      .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
      .map((ticket) => structuredClone(ticket));
  }

  private requireTicket(ticketId: string): SupportTicket {
    const found = this.tickets.get(ticketId);
    if (!found) throw new Error(`no ticket: ${ticketId}`);
    return structuredClone(found);
  }
}
