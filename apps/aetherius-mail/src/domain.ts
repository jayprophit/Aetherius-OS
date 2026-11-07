import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Mailbox {
  id: string;
  address: string;
  displayName: string;
}

export interface Email {
  id: string;
  mailboxId: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  receivedAt: string;
}

export interface MailOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class MailService {
  private readonly mailboxes = new Map<string, Mailbox>();
  private readonly emails: Email[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: MailOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createMailbox(address: string, displayName: string): Mailbox {
    const mailbox: Mailbox = { id: newId("mailbox"), address, displayName };
    this.mailboxes.set(mailbox.id, mailbox);
    this.ledger.append({ type: "mail.mailbox.created", actor: "mail", subject: mailbox.id });
    return mailbox;
  }

  send(mailboxId: string, from: string, to: string[], subject: string, body: string): Email {
    const mailbox = this.mailboxes.get(mailboxId);
    if (!mailbox) throw new Error("mailbox not found");
    const email: Email = {
      id: newId("email"),
      mailboxId,
      from,
      to,
      subject,
      body,
      receivedAt: nowIso(this.clock),
    };
    this.emails.push(email);
    this.ledger.append({ type: "mail.sent", actor: "mail", subject: email.id });
    return email;
  }

  listInbox(mailboxId: string): Email[] {
    return this.emails.filter((e) => e.mailboxId === mailboxId);
  }
}
