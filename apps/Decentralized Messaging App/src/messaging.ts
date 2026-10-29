import {
  createCipheriv,
  createDecipheriv,
  createPublicKey,
  generateKeyPairSync,
  randomBytes,
  sign,
  verify,
} from "node:crypto";

import { EventLedger, MemoryRepository, NotificationService, newId, nowIso } from "../../app-kit/src/index.ts";
import type { Repository } from "../../app-kit/src/index.ts";

/**
 * Decentralized messaging domain slice.
 *
 * The transport is deliberately an interface. This slice proves the message
 * store, the membership rules, the encryption at rest and the federation
 * envelope; it does not claim that a production relay, WebRTC media plane or
 * a Matrix bridge is deployed.
 */

export type MemberRole = "owner" | "admin" | "member";
export type MessageKind = "text" | "attachment" | "call_signal" | "system";
export type CallSignalType = "offer" | "answer" | "ice";

export interface Participant {
  accountId: string;
  role: MemberRole;
  joinedAt: string;
  lastReadSeq?: number;
}

export interface Conversation {
  id: string;
  kind: "direct" | "group";
  title: string;
  members: Participant[];
  activeKeyId: string;
  nextSeq: number;
  createdAt: string;
}

export interface ConversationKey {
  id: string;
  conversationId: string;
  /** Base64-encoded 32-byte key. A production host would wrap this per device. */
  key: string;
  createdAt: string;
  retiredAt: string | null;
}

export interface Attachment {
  name: string;
  mime: string;
  bytes: number;
  sha256: string;
}

export interface CallSignal {
  type: CallSignalType;
  payload: string;
}

export interface EncryptedPayload {
  keyId: string;
  iv: string;
  tag: string;
  ciphertext: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  clientId: string | null;
  seq: number;
  kind: MessageKind;
  payload: EncryptedPayload | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
}

export interface MessageView {
  id: string;
  conversationId: string;
  senderId: string;
  seq: number;
  kind: MessageKind;
  body: string;
  attachment: Attachment | null;
  signal: CallSignal | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
}

export interface SendInput {
  kind: MessageKind;
  body?: string;
  attachment?: Attachment;
  signal?: CallSignal;
  clientId?: string;
}

export interface DeliveryEvent {
  type: "message.created" | "message.edited" | "message.deleted" | "presence.changed";
  conversationId: string;
  messageId?: string;
  actorId: string;
  at: string;
}

export type DeliveryListener = (event: DeliveryEvent) => void;

export class InMemoryDeliveryBus {
  private readonly listeners = new Set<DeliveryListener>();

  subscribe(listener: DeliveryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(event: DeliveryEvent): void {
    for (const listener of this.listeners) listener(structuredClone(event));
  }
}

/** COM-107 email integration smtp imap mail server sendmail: outbox for offline delivery. */
export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  conversationId: string;
}

/** COM-107 email integration smtp imap mail server sendmail: outbox for offline delivery. */
export interface EmailOutbox {
  enqueue(message: EmailMessage): void;
  sent(): EmailMessage[];
}

/** COM-107 email integration smtp imap mail server sendmail: outbox for offline delivery. */
export class InMemoryEmailOutbox implements EmailOutbox {
  private readonly messages: EmailMessage[] = [];

  enqueue(message: EmailMessage): void {
    this.messages.push(structuredClone(message));
  }

  sent(): EmailMessage[] {
    return this.messages.map((message) => structuredClone(message));
  }
}

const MAX_BODY = 4000;
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/ogg",
  "video/mp4",
  "application/pdf",
  "text/plain",
]);

export class MessagingService {
  private readonly conversations: Repository<Conversation>;
  private readonly messages: Repository<Message>;
  private readonly keys: Repository<ConversationKey>;
  private readonly notifications: NotificationService | null;
  private readonly bus: InMemoryDeliveryBus;
  private readonly outbox: EmailOutbox | null;
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(
    conversations: Repository<Conversation>,
    messages: Repository<Message>,
    keys: Repository<ConversationKey>,
    options: {
      notifications?: NotificationService;
      bus?: InMemoryDeliveryBus;
      outbox?: EmailOutbox;
      ledger?: EventLedger;
      clock?: () => Date;
    } = {},
  ) {
    this.conversations = conversations;
    this.messages = messages;
    this.keys = keys;
    this.notifications = options.notifications ?? null;
    this.bus = options.bus ?? new InMemoryDeliveryBus();
    this.outbox = options.outbox ?? null;
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createConversation(actorId: string, input: { kind: "direct" | "group"; title?: string; members: string[] }): Conversation {
    const members = [...new Set([actorId, ...input.members.map((member) => member.trim()).filter(Boolean)])];
    if (input.kind === "direct" && members.length !== 2) {
      throw new Error("a direct conversation has exactly two members");
    }
    if (input.kind === "group" && members.length < 2) {
      throw new Error("a group conversation needs at least two members");
    }
    const at = nowIso(this.clock);
    const id = newId("cnv");
    const key = this.newKey(id, at);
    const conversation: Conversation = {
      id,
      kind: input.kind,
      title: input.title?.trim() || (input.kind === "direct" ? "Direct message" : "Group"),
      members: members.map((accountId) => ({
        accountId,
        role: accountId === actorId ? "owner" : "member",
        joinedAt: at,
      })),
      activeKeyId: key.id,
      nextSeq: 1,
      createdAt: at,
    };
    this.conversations.put(conversation);
    this.ledger.append({ type: "messaging.conversation.created", actor: actorId, subject: id, data: { kind: input.kind, members: members.length } });
    return structuredClone(conversation);
  }

  addMember(actorId: string, conversationId: string, accountId: string, role: MemberRole = "member"): Conversation {
    const conversation = this.requireConversation(conversationId);
    const actor = this.requireMember(conversation, actorId);
    if (actor.role !== "owner" && actor.role !== "admin") throw new Error("only an owner or admin may add a member");
    if (conversation.members.some((member) => member.accountId === accountId)) {
      throw new Error("the account is already a member");
    }
    conversation.members.push({ accountId, role, joinedAt: nowIso(this.clock) });
    this.conversations.put(conversation);
    this.ledger.append({ type: "messaging.member.added", actor: actorId, subject: conversationId, data: { accountId, role } });
    return structuredClone(conversation);
  }

  removeMember(actorId: string, conversationId: string, accountId: string): Conversation {
    const conversation = this.requireConversation(conversationId);
    const actor = this.requireMember(conversation, actorId);
    if (actor.role !== "owner" && actor.role !== "admin") throw new Error("only an owner or admin may remove a member");
    const target = conversation.members.find((member) => member.accountId === accountId);
    if (!target) throw new Error("the account is not a member");
    if (target.role === "owner") throw new Error("the owner cannot be removed");
    conversation.members = conversation.members.filter((member) => member.accountId !== accountId);
    this.conversations.put(conversation);
    this.ledger.append({ type: "messaging.member.removed", actor: actorId, subject: conversationId, data: { accountId } });
    return structuredClone(conversation);
  }

  send(actorId: string, conversationId: string, input: SendInput): MessageView {
    const conversation = this.requireConversation(conversationId);
    this.requireMember(conversation, actorId);
    if (input.clientId) {
      const existing = this.messages
        .all()
        .find(
          (message) =>
            message.conversationId === conversationId &&
            message.senderId === actorId &&
            message.clientId === input.clientId,
        );
      if (existing) return this.view(existing, conversation);
    }
    this.validateInput(input);
    const key = this.activeKey(conversation);
    const plaintext = JSON.stringify({
      body: input.body?.trim() ?? "",
      attachment: input.attachment ?? null,
      signal: input.signal ?? null,
    });
    const encrypted = encrypt(key, plaintext);
    const at = nowIso(this.clock);
    const message: Message = {
      id: newId("msg"),
      conversationId,
      senderId: actorId,
      clientId: input.clientId?.trim() || null,
      seq: conversation.nextSeq,
      kind: input.kind,
      payload: encrypted,
      createdAt: at,
      editedAt: null,
      deletedAt: null,
    };
    conversation.nextSeq += 1;
    this.conversations.put(conversation);
    this.messages.put(message);

    for (const member of conversation.members) {
      if (member.accountId === actorId) continue;
      this.notifications?.notify(member.accountId, "New message", preview(input), {
        kind: "message",
        data: { conversationId, messageId: message.id },
      });
      this.outbox?.enqueue({
        to: member.accountId,
        subject: `New message in ${conversation.title}`,
        body: preview(input),
        conversationId,
      });
    }
    this.bus.publish({ type: "message.created", conversationId, messageId: message.id, actorId, at });
    this.ledger.append({
      type: "messaging.message.sent",
      actor: actorId,
      subject: message.id,
      data: { conversationId, seq: message.seq, kind: message.kind },
    });
    return this.view(message, conversation);
  }

  list(actorId: string, conversationId: string, options: { sinceSeq?: number; limit?: number } = {}): MessageView[] {
    const conversation = this.requireConversation(conversationId);
    this.requireMember(conversation, actorId);
    return this.messages
      .all()
      .filter((message) => message.conversationId === conversationId)
      .filter((message) => options.sinceSeq === undefined || message.seq > options.sinceSeq)
      .sort((a, b) => a.seq - b.seq)
      .slice(0, options.limit ?? 100)
      .map((message) => this.view(message, conversation));
  }

  edit(actorId: string, messageId: string, body: string): MessageView {
    const message = this.requireMessage(messageId);
    if (message.senderId !== actorId) throw new Error("only the sender may edit a message");
    if (message.deletedAt) throw new Error("a deleted message cannot be edited");
    if (body.trim().length === 0 || body.trim().length > MAX_BODY) throw new Error("a message body is empty or too long");
    const conversation = this.requireConversation(message.conversationId);
    const key = this.keyById(message.payload!.keyId);
    const current = JSON.parse(decrypt(key, message.payload!)) as { attachment: Attachment | null; signal: CallSignal | null };
    const encrypted = encrypt(key, JSON.stringify({ body: body.trim(), attachment: current.attachment, signal: current.signal }));
    message.payload = encrypted;
    message.editedAt = nowIso(this.clock);
    this.messages.put(message);
    this.bus.publish({ type: "message.edited", conversationId: message.conversationId, messageId, actorId, at: message.editedAt });
    this.ledger.append({ type: "messaging.message.edited", actor: actorId, subject: messageId, data: { seq: message.seq } });
    return this.view(message, conversation);
  }

  delete(actorId: string, messageId: string): MessageView {
    const message = this.requireMessage(messageId);
    if (message.senderId !== actorId) throw new Error("only the sender may delete a message");
    const conversation = this.requireConversation(message.conversationId);
    if (!message.deletedAt) {
      message.deletedAt = nowIso(this.clock);
      message.payload = null;
      this.messages.put(message);
      this.bus.publish({ type: "message.deleted", conversationId: message.conversationId, messageId, actorId, at: message.deletedAt });
      this.ledger.append({ type: "messaging.message.deleted", actor: actorId, subject: messageId, data: { seq: message.seq } });
    }
    return this.view(message, conversation);
  }

  rotateKey(actorId: string, conversationId: string): Conversation {
    const conversation = this.requireConversation(conversationId);
    const actor = this.requireMember(conversation, actorId);
    if (actor.role !== "owner" && actor.role !== "admin") throw new Error("only an owner or admin may rotate the key");
    const at = nowIso(this.clock);
    const current = this.keys.get(conversation.activeKeyId);
    if (current) {
      current.retiredAt = at;
      this.keys.put(current);
    }
    const key = this.newKey(conversationId, at);
    conversation.activeKeyId = key.id;
    this.conversations.put(conversation);
    this.ledger.append({ type: "messaging.key.rotated", actor: actorId, subject: conversationId, data: { keyId: key.id } });
    return structuredClone(conversation);
  }

  markRead(actorId: string, conversationId: string, seq: number): void {
    const conversation = this.requireConversation(conversationId);
    const member = this.requireMember(conversation, actorId);
    member.lastReadSeq = Math.max(member.lastReadSeq ?? 0, seq);
    this.conversations.put(conversation);
    this.ledger.append({ type: "messaging.read", actor: actorId, subject: conversationId, data: { seq: member.lastReadSeq } });
  }

  unreadCount(actorId: string, conversationId: string): number {
    const conversation = this.requireConversation(conversationId);
    const member = this.requireMember(conversation, actorId);
    return this.messages
      .all()
      .filter((message) => message.conversationId === conversationId)
      .filter((message) => message.senderId !== actorId)
      .filter((message) => message.seq > (member.lastReadSeq ?? 0))
      .length;
  }

  conversation(conversationId: string): Conversation | undefined {
    const conversation = this.conversations.get(conversationId);
    return conversation ? structuredClone(conversation) : undefined;
  }

  /** Raw stored message, including the encrypted payload. */
  rawMessage(messageId: string): Message | undefined {
    const message = this.messages.get(messageId);
    return message ? structuredClone(message) : undefined;
  }

  busForTest(): InMemoryDeliveryBus {
    return this.bus;
  }

  private validateInput(input: SendInput): void {
    if (input.kind === "text") {
      if (!input.body?.trim()) throw new Error("a text message needs a body");
      if (input.body.trim().length > MAX_BODY) throw new Error("a message body is too long");
    } else if (input.kind === "attachment") {
      if (!input.attachment) throw new Error("an attachment message needs an attachment");
      validateAttachment(input.attachment);
    } else if (input.kind === "call_signal") {
      if (!input.signal) throw new Error("a call-signal message needs a signal");
      if (!["offer", "answer", "ice"].includes(input.signal.type)) throw new Error("unknown call signal");
      if (!input.signal.payload.trim()) throw new Error("a call signal needs a payload");
    } else if (input.kind === "system") {
      if (!input.body?.trim()) throw new Error("a system message needs a body");
    }
  }

  private view(message: Message, conversation: Conversation): MessageView {
    if (message.deletedAt) {
      return {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        seq: message.seq,
        kind: message.kind,
        body: "",
        attachment: null,
        signal: null,
        createdAt: message.createdAt,
        editedAt: message.editedAt,
        deletedAt: message.deletedAt,
      };
    }
    if (!message.payload) throw new Error(`message ${message.id} has no payload`);
    const key = this.keyById(message.payload.keyId);
    const decoded = JSON.parse(decrypt(key, message.payload)) as {
      body: string;
      attachment: Attachment | null;
      signal: CallSignal | null;
    };
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      seq: message.seq,
      kind: message.kind,
      body: decoded.body,
      attachment: decoded.attachment,
      signal: decoded.signal,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
      deletedAt: message.deletedAt,
    };
  }

  private newKey(conversationId: string, at: string): ConversationKey {
    const key: ConversationKey = {
      id: newId("key"),
      conversationId,
      key: randomBytes(32).toString("base64"),
      createdAt: at,
      retiredAt: null,
    };
    this.keys.put(key);
    return key;
  }

  private activeKey(conversation: Conversation): ConversationKey {
    const key = this.keys.get(conversation.activeKeyId);
    if (!key || key.retiredAt) throw new Error("the conversation has no active key");
    return key;
  }

  private keyById(keyId: string): ConversationKey {
    const key = this.keys.get(keyId);
    if (!key) throw new Error(`no conversation key: ${keyId}`);
    return key;
  }

  private requireConversation(conversationId: string): Conversation {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) throw new Error(`no conversation: ${conversationId}`);
    return structuredClone(conversation);
  }

  private requireMessage(messageId: string): Message {
    const message = this.messages.get(messageId);
    if (!message) throw new Error(`no message: ${messageId}`);
    return structuredClone(message);
  }

  private requireMember(conversation: Conversation, accountId: string): Participant & { lastReadSeq?: number } {
    const member = conversation.members.find((candidate) => candidate.accountId === accountId);
    if (!member) throw new Error("the account is not a member of this conversation");
    return member as Participant & { lastReadSeq?: number };
  }
}

function validateAttachment(attachment: Attachment): void {
  if (!attachment.name.trim() || /[\\/]/.test(attachment.name)) throw new Error("an attachment needs a safe file name");
  if (!ALLOWED_MIME.has(attachment.mime)) throw new Error(`attachment type is not allowed: ${attachment.mime}`);
  if (!Number.isSafeInteger(attachment.bytes) || attachment.bytes <= 0) throw new Error("an attachment needs a positive size");
  if (attachment.bytes > MAX_ATTACHMENT_BYTES) throw new Error("an attachment is too large");
  if (!/^[a-f0-9]{64}$/.test(attachment.sha256)) throw new Error("an attachment needs a SHA-256 digest");
}

function preview(input: SendInput): string {
  if (input.kind === "text") return input.body!.slice(0, 140);
  if (input.kind === "attachment") return `Attachment: ${input.attachment!.name}`;
  if (input.kind === "call_signal") return `Call ${input.signal!.type}`;
  return input.body!.slice(0, 140);
}

export function encrypt(key: ConversationKey, plaintext: string): EncryptedPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(key.key, "base64"), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    keyId: key.id,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

export function decrypt(key: ConversationKey, payload: EncryptedPayload): string {
  if (payload.keyId !== key.id) throw new Error("the payload was encrypted with a different key");
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key.key, "base64"), Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, "base64")), decipher.final()]).toString("utf8");
}

export interface FederationEnvelope {
  origin: string;
  conversationId: string;
  messageId: string;
  senderId: string;
  seq: number;
  payload: EncryptedPayload;
  signature: string;
  publicKey: string;
}

export class FederationService {
  private readonly origin: string;

  constructor(origin: string) {
    this.origin = origin;
  }

  pack(message: Message, privateKeyPem: string): FederationEnvelope {
    if (!message.payload) throw new Error("a deleted message cannot be federated");
    const publicKey = createPublicKey(privateKeyPem).export({ type: "spki", format: "pem" }).toString();
    const body = {
      origin: this.origin,
      conversationId: message.conversationId,
      messageId: message.id,
      senderId: message.senderId,
      seq: message.seq,
      payload: message.payload,
      publicKey,
    };
    const signature = sign(null, Buffer.from(canonical(body)), privateKeyPem).toString("base64");
    return { ...body, signature };
  }

  unpack(envelope: FederationEnvelope, publicKeyPem: string): FederationEnvelope {
    const { signature, ...body } = envelope;
    const ok = verify(null, Buffer.from(canonical(body)), publicKeyPem, Buffer.from(signature, "base64"));
    if (!ok) throw new Error("federation envelope signature is invalid");
    if (envelope.publicKey.trim() !== publicKeyPem.trim()) {
      throw new Error("federation envelope was signed by a different key");
    }
    return structuredClone(envelope);
  }
}

export function generateFederationKeys(): { publicKey: string; privateKey: string } {
  const pair = generateKeyPairSync("ed25519");
  return {
    publicKey: pair.publicKey.export({ type: "spki", format: "pem" }).toString(),
    privateKey: pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
    .join(",")}}`;
}

export class PresenceService {
  private readonly states = new Map<string, { status: "online" | "away"; lastSeen: number; typingIn: string | null; typingUntil: number }>();
  private readonly ttlMs: number;

  constructor(ttlMs = 60_000) {
    this.ttlMs = ttlMs;
  }

  connect(accountId: string, at: Date): void {
    this.states.set(accountId, { status: "online", lastSeen: at.getTime(), typingIn: null, typingUntil: 0 });
  }

  disconnect(accountId: string, at: Date): void {
    const state = this.states.get(accountId);
    if (state) {
      state.status = "away";
      state.lastSeen = at.getTime();
    }
  }

  typing(accountId: string, conversationId: string, at: Date, durationMs = 5000): void {
    const state = this.states.get(accountId) ?? { status: "online" as const, lastSeen: at.getTime(), typingIn: null, typingUntil: 0 };
    state.typingIn = conversationId;
    state.typingUntil = at.getTime() + durationMs;
    this.states.set(accountId, state);
  }

  snapshot(accountId: string, at: Date): { status: "online" | "away" | "offline"; typingIn: string | null; lastSeen: string | null } {
    const state = this.states.get(accountId);
    if (!state) return { status: "offline", typingIn: null, lastSeen: null };
    const expired = at.getTime() - state.lastSeen > this.ttlMs;
    return {
      status: expired ? "offline" : state.status,
      typingIn: state.typingUntil > at.getTime() ? state.typingIn : null,
      lastSeen: new Date(state.lastSeen).toISOString(),
    };
  }
}

export class EmailBridge {
  private readonly outbox: EmailOutbox;

  constructor(outbox: EmailOutbox) {
    this.outbox = outbox;
  }

  notifyOffline(memberId: string, conversationId: string, title: string, body: string): void {
    this.outbox.enqueue({ to: memberId, subject: title, body, conversationId });
  }
}

export function createMessaging(): MessagingService {
  return new MessagingService(new MemoryRepository(), new MemoryRepository(), new MemoryRepository(), {
    notifications: new NotificationService(new MemoryRepository()),
  });
}
