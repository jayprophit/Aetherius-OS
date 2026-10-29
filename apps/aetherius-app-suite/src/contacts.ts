import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Contacts core.
 *
 * A local address book with groups, search, duplicate merging and vCard 3.0
 * export. It does not sync to a CardDAV server; the host supplies that.
 */

export interface Contact {
  id: string;
  givenName: string;
  familyName: string;
  organisation?: string;
  emails: string[];
  phones: string[];
  notes: string;
  groups: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactInput {
  givenName?: string;
  familyName?: string;
  organisation?: string;
  emails?: string[];
  phones?: string[];
  notes?: string;
  groups?: string[];
}

export interface ContactOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

function cleanList(values: string[] = []): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normaliseEmail(email: string): string {
  const value = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error(`not an email address: ${email}`);
  return value;
}

function normalisePhone(phone: string): string {
  const value = phone.trim();
  if (!/^\+?[0-9 ()-]{3,}$/.test(value)) throw new Error(`not a phone number: ${phone}`);
  return value;
}

export class ContactsApp {
  private readonly contacts = new Map<string, Contact>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: ContactOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(input: ContactInput): Contact {
    if (!input.givenName?.trim() && !input.familyName?.trim() && !input.organisation?.trim()) {
      throw new Error("a contact needs a name or an organisation");
    }
    const at = nowIso(this.clock);
    const contact: Contact = {
      id: newId("contact"),
      givenName: input.givenName?.trim() ?? "",
      familyName: input.familyName?.trim() ?? "",
      organisation: input.organisation?.trim() || undefined,
      emails: cleanList((input.emails ?? []).map(normaliseEmail)),
      phones: cleanList((input.phones ?? []).map(normalisePhone)),
      notes: input.notes ?? "",
      groups: cleanList(input.groups ?? []).map((group) => group.toLowerCase()),
      createdAt: at,
      updatedAt: at,
    };
    this.contacts.set(contact.id, contact);
    this.ledger.append({ type: "contacts.created", actor: "contacts", subject: contact.id });
    return structuredClone(contact);
  }

  update(contactId: string, input: ContactInput): Contact {
    const contact = this.require(contactId);
    const updated: Contact = {
      ...contact,
      givenName: input.givenName?.trim() ?? contact.givenName,
      familyName: input.familyName?.trim() ?? contact.familyName,
      organisation: input.organisation?.trim() ?? contact.organisation,
      emails: input.emails ? cleanList(input.emails.map(normaliseEmail)) : contact.emails,
      phones: input.phones ? cleanList(input.phones.map(normalisePhone)) : contact.phones,
      notes: input.notes ?? contact.notes,
      groups: input.groups ? cleanList(input.groups.map((group) => group.toLowerCase())) : contact.groups,
      updatedAt: nowIso(this.clock),
    };
    this.contacts.set(contactId, updated);
    this.ledger.append({ type: "contacts.updated", actor: "contacts", subject: contactId });
    return structuredClone(updated);
  }

  get(contactId: string): Contact | undefined {
    const contact = this.contacts.get(contactId);
    return contact ? structuredClone(contact) : undefined;
  }

  list(options: { group?: string; query?: string } = {}): Contact[] {
    const group = options.group?.trim().toLowerCase();
    const terms = options.query?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? [];
    return [...this.contacts.values()]
      .filter((contact) => (group ? contact.groups.includes(group) : true))
      .filter((contact) => {
        if (terms.length === 0) return true;
        const haystack = [
          contact.givenName,
          contact.familyName,
          contact.organisation ?? "",
          contact.notes,
          ...contact.emails,
          ...contact.phones,
          ...contact.groups,
        ]
          .join(" ")
          .toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .sort((left, right) => this.displayName(left).localeCompare(this.displayName(right)))
      .map((contact) => structuredClone(contact));
  }

  addGroup(contactId: string, group: string): Contact {
    const contact = this.require(contactId);
    const value = group.trim().toLowerCase();
    if (!value) throw new Error("a group name is empty");
    if (contact.groups.includes(value)) return structuredClone(contact);
    return this.update(contactId, { groups: [...contact.groups, value] });
  }

  removeGroup(contactId: string, group: string): Contact {
    const contact = this.require(contactId);
    const value = group.trim().toLowerCase();
    return this.update(contactId, { groups: contact.groups.filter((entry) => entry !== value) });
  }

  /**
   * Merge a duplicate into a primary contact. The primary keeps its name and
   * notes; the duplicate's emails, phones and groups are unioned. The
   * duplicate is removed. The merge is journaled.
   */
  merge(primaryId: string, duplicateId: string): Contact {
    if (primaryId === duplicateId) throw new Error("a contact cannot be merged with itself");
    const primary = this.require(primaryId);
    const duplicate = this.require(duplicateId);
    const merged: Contact = {
      ...primary,
      emails: cleanList([...primary.emails, ...duplicate.emails]),
      phones: cleanList([...primary.phones, ...duplicate.phones]),
      groups: cleanList([...primary.groups, ...duplicate.groups]).sort(),
      notes: [primary.notes, duplicate.notes].filter(Boolean).join("\n"),
      updatedAt: nowIso(this.clock),
    };
    this.contacts.set(primaryId, merged);
    this.contacts.delete(duplicateId);
    this.ledger.append({
      type: "contacts.merged",
      actor: "contacts",
      subject: primaryId,
      data: { duplicateId },
    });
    return structuredClone(merged);
  }

  duplicates(): Contact[][] {
    const byEmail = new Map<string, Contact[]>();
    for (const contact of this.contacts.values()) {
      for (const email of contact.emails) {
        const bucket = byEmail.get(email) ?? [];
        bucket.push(contact);
        byEmail.set(email, bucket);
      }
    }
    const groups: Contact[][] = [];
    const seen = new Set<string>();
    for (const bucket of byEmail.values()) {
      if (bucket.length < 2) continue;
      const key = bucket.map((contact) => contact.id).sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      groups.push(bucket.map((contact) => structuredClone(contact)));
    }
    return groups;
  }

  toVCard(contactId: string): string {
    const contact = this.require(contactId);
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${escapeVCard(contact.familyName)};${escapeVCard(contact.givenName)};;;`,
      `FN:${escapeVCard(this.displayName(contact))}`,
    ];
    if (contact.organisation) lines.push(`ORG:${escapeVCard(contact.organisation)}`);
    for (const email of contact.emails) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(email)}`);
    for (const phone of contact.phones) lines.push(`TEL;TYPE=VOICE:${escapeVCard(phone)}`);
    if (contact.notes) lines.push(`NOTE:${escapeVCard(contact.notes)}`);
    for (const group of contact.groups) lines.push(`CATEGORIES:${escapeVCard(group)}`);
    lines.push("END:VCARD");
    return `${lines.join("\r\n")}\r\n`;
  }

  displayName(contact: Contact): string {
    const name = [contact.givenName, contact.familyName].filter(Boolean).join(" ").trim();
    return name || contact.organisation || contact.emails[0] || contact.phones[0] || "Unnamed contact";
  }

  private require(contactId: string): Contact {
    const contact = this.contacts.get(contactId);
    if (!contact) throw new Error(`no contact: ${contactId}`);
    return contact;
  }
}

function escapeVCard(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}
