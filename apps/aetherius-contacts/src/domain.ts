import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface ContactsOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class ContactsService {
  private readonly contacts = new Map<string, Contact>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: ContactsOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  add(contact: Omit<Contact, "id">): Contact {
    const c: Contact = { ...contact, id: newId("contact") };
    this.contacts.set(c.id, c);
    this.ledger.append({ type: "contacts.added", actor: "contacts", subject: c.id });
    return c;
  }

  get(id: string): Contact | undefined {
    return this.contacts.get(id);
  }

  search(query: string): Contact[] {
    const q = query.toLowerCase();
    return Array.from(this.contacts.values()).filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }

  list(): Contact[] {
    return Array.from(this.contacts.values());
  }
}
