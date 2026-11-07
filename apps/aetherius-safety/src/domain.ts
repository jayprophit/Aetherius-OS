import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface SafetyOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class SafetyService {
  private readonly contacts = new Map<string, EmergencyContact>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: SafetyOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addContact(contact: Omit<EmergencyContact, "id">): EmergencyContact {
    const c: EmergencyContact = { ...contact, id: newId("safety") };
    this.contacts.set(c.id, c);
    this.ledger.append({ type: "safety.contact.added", actor: "safety", subject: c.id });
    return c;
  }

  listContacts(): EmergencyContact[] {
    return Array.from(this.contacts.values());
  }
}
