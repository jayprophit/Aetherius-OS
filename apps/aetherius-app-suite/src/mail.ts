import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Mail core.
 *
 * A local mail model: accounts, folders, threads, drafts, a send queue and
 * attachment metadata. It does not open a network connection, authenticate to
 * an SMTP/IMAP server or decode attachments; a host adapter supplies those.
 */

export type MailFolder = "inbox" | "sent" | "drafts" | "archive" | "trash" | "spam";

export interface MailAddress {
  name?: string;
  address: string;
}

export interface MailAttachment {
  name: string;
  mime: string;
  bytes: number;
}

export interface MailMessage {
  id: string;
  accountId: string;
  folder: MailFolder;
  from: MailAddress;
  to: MailAddress[];
  cc: MailAddress[];
  subject: string;
  body: string;
  threadId: string;
  receivedAt: string;
  sentAt?: string;
  read: boolean;
  flagged: boolean;
  attachments: MailAttachment[];
}

export interface MailAccount {
  id: string;
  address: MailAddress;
  createdAt: string;
}

export interface ComposeInput {
  to: Array<MailAddress | string>;
  cc?: Array<MailAddress | string>;
  subject?: string;
  body: string;
  attachments?: MailAttachment[];
}

export interface MailOptions {
  ledger?: EventLedger;
  clock?: () => Date;
  maxAttachmentBytes?: number;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseAddress(value: MailAddress | string): MailAddress {
  if (typeof value === "string") {
    const address = value.trim();
    if (!EMAIL.test(address)) throw new Error(`not an email address: ${value}`);
    return { address };
  }
  const address = value.address.trim();
  if (!EMAIL.test(address)) throw new Error(`not an email address: ${value.address}`);
  const name = value.name?.trim();
  return name ? { name, address } : { address };
}

function threadKey(subject: string): string {
  return subject
    .replace(/^(re|fwd?):\s*/gi, "")
    .trim()
    .toLowerCase() || "(no subject)";
}

function normaliseFolder(folder: string): MailFolder {
  const allowed: MailFolder[] = ["inbox", "sent", "drafts", "archive", "trash", "spam"];
  if (!allowed.includes(folder as MailFolder)) throw new Error(`unknown mail folder: ${folder}`);
  return folder as MailFolder;
}

export class MailApp {
  private readonly accounts = new Map<string, MailAccount>();
  private readonly messages = new Map<string, MailMessage>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  private readonly maxAttachmentBytes: number;

  constructor(options: MailOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.maxAttachmentBytes = options.maxAttachmentBytes ?? 25 * 1024 * 1024;
  }

  addAccount(address: MailAddress | string): MailAccount {
    const parsed = parseAddress(address);
    if ([...this.accounts.values()].some((account) => account.address.address === parsed.address)) {
      throw new Error(`the account already exists: ${parsed.address}`);
    }
    const account: MailAccount = {
      id: newId("account"),
      address: parsed,
      createdAt: nowIso(this.clock),
    };
    this.accounts.set(account.id, account);
    this.ledger.append({ type: "mail.account.added", actor: "mail", subject: account.id });
    return structuredClone(account);
  }

  accountsList(): MailAccount[] {
    return [...this.accounts.values()].map((account) => structuredClone(account));
  }

  receive(accountId: string, input: ComposeInput & { from: MailAddress | string }): MailMessage {
    this.requireAccount(accountId);
    return this.store(accountId, "inbox", input, parseAddress(input.from));
  }

  saveDraft(accountId: string, input: ComposeInput): MailMessage {
    this.requireAccount(accountId);
    return this.store(accountId, "drafts", input, this.requireAccount(accountId).address);
  }

  send(draftId: string): MailMessage {
    const draft = this.requireMessage(draftId);
    if (draft.folder !== "drafts") throw new Error("only a draft can be sent");
    const at = nowIso(this.clock);
    const sent: MailMessage = {
      ...draft,
      folder: "sent",
      sentAt: at,
      receivedAt: at,
      read: true,
    };
    this.messages.set(sent.id, sent);
    this.ledger.append({
      type: "mail.sent",
      actor: "mail",
      subject: sent.id,
      data: { to: sent.to.map((address) => address.address) },
    });
    return structuredClone(sent);
  }

  move(messageId: string, folder: MailFolder): MailMessage {
    const message = this.requireMessage(messageId);
    const target = normaliseFolder(folder);
    if (message.folder === target) return structuredClone(message);
    const moved: MailMessage = { ...message, folder: target };
    this.messages.set(moved.id, moved);
    this.ledger.append({
      type: "mail.moved",
      actor: "mail",
      subject: moved.id,
      data: { from: message.folder, to: target },
    });
    return structuredClone(moved);
  }

  setRead(messageId: string, read = true): MailMessage {
    return this.patch(messageId, { read }, "mail.read");
  }

  setFlagged(messageId: string, flagged = true): MailMessage {
    return this.patch(messageId, { flagged }, "mail.flagged");
  }

  get(messageId: string): MailMessage | undefined {
    const message = this.messages.get(messageId);
    return message ? structuredClone(message) : undefined;
  }

  list(options: { accountId?: string; folder?: MailFolder; unreadOnly?: boolean } = {}): MailMessage[] {
    const folder = options.folder ? normaliseFolder(options.folder) : undefined;
    return [...this.messages.values()]
      .filter((message) => (options.accountId ? message.accountId === options.accountId : true))
      .filter((message) => (folder ? message.folder === folder : true))
      .filter((message) => (options.unreadOnly ? !message.read : true))
      .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt))
      .map((message) => structuredClone(message));
  }

  thread(threadId: string): MailMessage[] {
    return [...this.messages.values()]
      .filter((message) => message.threadId === threadId)
      .sort((left, right) => left.receivedAt.localeCompare(right.receivedAt))
      .map((message) => structuredClone(message));
  }

  search(query: string, options: { accountId?: string; folder?: MailFolder } = {}): MailMessage[] {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return this.list(options).filter((message) => {
      const haystack = [
        message.subject,
        message.body,
        message.from.name ?? "",
        message.from.address,
        ...message.to.map((address) => `${address.name ?? ""} ${address.address}`),
        ...message.attachments.map((attachment) => attachment.name),
      ]
        .join(" ")
        .toLowerCase();
      return needle.split(/\s+/).every((term) => haystack.includes(term));
    });
  }

  unreadCount(accountId: string, folder: MailFolder = "inbox"): number {
    return this.list({ accountId, folder, unreadOnly: true }).length;
  }

  private store(
    accountId: string,
    folder: MailFolder,
    input: ComposeInput,
    from: MailAddress,
  ): MailMessage {
    const at = nowIso(this.clock);
    const to = input.to.map(parseAddress);
    if (to.length === 0) throw new Error("a message needs at least one recipient");
    const cc = (input.cc ?? []).map(parseAddress);
    const attachments = (input.attachments ?? []).map((attachment) => {
      if (!attachment.name.trim()) throw new Error("an attachment needs a name");
      if (!Number.isInteger(attachment.bytes) || attachment.bytes < 0) {
        throw new Error("an attachment size must be a non-negative integer");
      }
      if (attachment.bytes > this.maxAttachmentBytes) {
        throw new Error(`the attachment exceeds the ${this.maxAttachmentBytes}-byte limit`);
      }
      return { ...attachment };
    });
    const subject = input.subject?.trim() ?? "";
    const message: MailMessage = {
      id: newId("message"),
      accountId,
      folder,
      from: structuredClone(from),
      to,
      cc,
      subject,
      body: input.body,
      threadId: threadKey(subject),
      receivedAt: at,
      read: folder === "sent",
      flagged: false,
      attachments,
    };
    this.messages.set(message.id, message);
    this.ledger.append({
      type: folder === "drafts" ? "mail.draft.saved" : "mail.received",
      actor: "mail",
      subject: message.id,
      data: { folder, threadId: message.threadId },
    });
    return structuredClone(message);
  }

  private patch(messageId: string, patch: Partial<MailMessage>, type: string): MailMessage {
    const message = this.requireMessage(messageId);
    const updated: MailMessage = { ...message, ...patch };
    this.messages.set(updated.id, updated);
    this.ledger.append({ type, actor: "mail", subject: updated.id });
    return structuredClone(updated);
  }

  private requireAccount(accountId: string): MailAccount {
    const account = this.accounts.get(accountId);
    if (!account) throw new Error(`no mail account: ${accountId}`);
    return account;
  }

  private requireMessage(messageId: string): MailMessage {
    const message = this.messages.get(messageId);
    if (!message) throw new Error(`no mail message: ${messageId}`);
    return message;
  }
}
