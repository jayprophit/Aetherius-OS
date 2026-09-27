import { gunzipSync, gzipSync } from "node:zlib";
import { sha256HexBytes } from "../workflows/packages";
import type { RealtimeTransport } from "./transport";
import type { Subscriber } from "./types";

/**
 * REQ-p27-degraded-link: delay-tolerant message semantics with
 * store-and-forward over the durable log.
 *
 * The registered requirement is the scope authority:
 *
 *   "Delay-tolerant message semantics (id/sequence/priority/TTL/compression/
 *    hash/signature/ack/retry/dedup/fragments/delivery-state) with
 *    store-and-forward over the durable log; live+backlog exists, DTN does
 *    not."
 *
 * Every noun in the parenthetical becomes exactly one mechanism below — no
 * more, no less. What already exists is composed, never rebuilt:
 *
 *   live delivery + backlog  -> RealtimeTransport / DurableEventLog (P27)
 *   envelope identity        -> EventEnvelope eventId conventions (P19)
 *   payload hashing          -> sha256HexBytes (workflows/packages)
 *   scheduler redelivery dedup stays scheduler event-level dedup; message
 *     dedup here is by messageId, a different owner, a different key
 *
 *   DEGRADED-LINK HANDLING != TRANSPORT REIMPLEMENTATION
 *   NO RealtimeTransport2, NO EventBus2, NO Queue2, NO MessageId2
 *
 * STORE-AND-FORWARD means: enqueue publishes the message envelope to a
 * channel on the durable log (payload durability comes from the log), while
 * delivery/ack/retry bookkeeping lives in a caller-held, JSON-safe store.
 * The two durabilities are never conflated:
 *
 *   BUFFERED != DURABLE (for bookkeeping)
 *   PERSISTED QUEUE != EVENTUAL DELIVERY PROOF
 *   RETRY MECHANISM != DELIVERY GUARANTEE (no exactly-once claims, ever)
 *
 * DELIVERY STATES are evidence, not promises:
 *
 *   SEND ATTEMPT != DELIVERY
 *   DELIVERY != PROCESSING
 *   ACKNOWLEDGEMENT != BUSINESS SUCCESS (an ack records the declared level:
 *     transport receipt, relay receipt, destination receipt — never
 *     application completion)
 *   DUPLICATE ACK != SECOND DELIVERY (acks are idempotent)
 *   DUPLICATE DELIVERY != DUPLICATE INTENT (same messageId twice stores once)
 *   RECONNECT != REPLAY ALL HISTORY (drain returns eligible messages only;
 *     nothing resends itself)
 *
 * EXPIRY is enforced, not advised. A message past its TTL is never
 * delivered; LEASE TTL != MESSAGE TTL (separate field, separate owner).
 * Overflow rejects explicitly (BUFFER FULL) — nothing drops silently, and no
 * drop class is invented because the requirement defines none:
 *
 *   DROPPED != DELIVERED
 *   BUFFER FULL != MESSAGE SUCCESS
 *
 * LINK-GATED DRAIN uses caller-declared link state only. Nothing here
 * measures the network, so nothing here detects degradation: DEGRADED,
 * OFFLINE, HEALTHY, and UNKNOWN arrive as input, and UNKNOWN stays UNKNOWN
 * (hold, never assume healthy). Under DEGRADED the caller supplies the
 * priority floor — no default is invented:
 *
 *   DEGRADED LINK != OFFLINE (distinct states, distinct behaviour)
 *   REMOTE LINK DEGRADED != LOCAL SYSTEM UNAVAILABLE (enqueue always works;
 *     only the drain gate moves)
 *   NETWORK AVAILABILITY != SYSTEM AVAILABILITY
 *   APPLICATION FAILURE != NETWORK DEGRADATION (and reverse)
 *   LINK QUALITY != PLACEMENT DECISION (no placement switch, ever)
 *   NETWORK CONDITION != AUTHORIZATION DECISION (no P25 bypass, ever)
 *
 * RETRY is eligibility, never scheduling: RETRYABLE != RETRY SCHEDULED, and
 * TEMPORARY FAILURE != PERMISSION TO RETRY FOREVER. No timers, no daemons,
 * no background loops — every transition is a caller-driven pure function.
 *
 * FRAGMENTS reassemble only when every index is present exactly once; a gap
 * is reported with the missing indices named, never papered over:
 *
 *   RECEIVED LATER MESSAGE != ALL EARLIER MESSAGES RECEIVED
 *
 * DIGEST != SIGNATURE, always: payload hashes are computed and verified;
 * signature fields are claims carried with key refs, never verified, never
 * generated here (no backend exists). SECRET REF != SECRET VALUE applies to
 * envelope metadata; payload content stays opaque to this module.
 *
 * Gaps, unknown acks, and unknown messages are never fabricated into state:
 * unknown acks are rejected, unknown messages report UNKNOWN, out-of-order
 * acks are accepted independently (no send-order promise is made).
 */

export type DegradedProblemCode =
  | "DEGRADED_INVALID_INPUT"
  | "DEGRADED_UNKNOWN_FIELD"
  | "DEGRADED_AUTHORITY_REJECTED"
  | "DEGRADED_SECRET_REJECTED"
  | "DEGRADED_PERSONALITY_REJECTED"
  | "DEGRADED_DUPLICATE_MESSAGE"
  | "DEGRADED_CONFLICT"
  | "DEGRADED_BUFFER_FULL"
  | "DEGRADED_EXPIRED"
  | "DEGRADED_UNKNOWN_MESSAGE"
  | "DEGRADED_UNKNOWN_ACK"
  | "DEGRADED_BAD_TRANSITION"
  | "DEGRADED_EVIDENCE_REQUIRED"
  | "DEGRADED_RETRY_EXHAUSTED"
  | "DEGRADED_FRAGMENT_GAP"
  | "DEGRADED_HASH_MISMATCH"
  | "DEGRADED_BAD_PRIORITY_FLOOR";

export class DegradedLinkError extends Error {
  readonly code: DegradedProblemCode;
  constructor(code: DegradedProblemCode, message: string) {
    super(message);
    this.name = "DegradedLinkError";
    this.code = code;
  }
}

export const LINK_STATES = ["HEALTHY", "DEGRADED", "OFFLINE", "UNKNOWN"] as const;
export type LinkState = (typeof LINK_STATES)[number];

export const DELIVERY_STATES = [
  "QUEUED",
  "SENT",
  "ACKNOWLEDGED",
  "DELAYED",
  "DROPPED",
  "EXPIRED",
] as const;
export type DeliveryState = (typeof DELIVERY_STATES)[number];

export const ACK_LEVELS = ["TRANSPORT", "RELAY", "DESTINATION"] as const;
export type AckLevel = (typeof ACK_LEVELS)[number];

export const COMPRESSIONS = ["none", "gzip"] as const;
export type Compression = (typeof COMPRESSIONS)[number];

/** The digest algorithm. Recorded explicitly; the only one used here. */
export const MESSAGE_DIGEST_ALGORITHM = "sha256" as const;

export interface DTNMessage {
  /** Stable identity. Same id twice is dedup, never a second message. */
  messageId: string;
  /** Monotonic per-sender sequence, caller-supplied. Preserved, never renumbered. */
  sequence: number;
  /** Caller-declared drain precedence. Higher drains first; no QoS invented beyond order. */
  priority: number;
  /** Epoch ms after which delivery is refused. LEASE TTL != MESSAGE TTL. */
  expiresAt: number;
  compression: Compression;
  /** Opaque application payload. Never inspected, never dumped by this module. */
  payload: Record<string, unknown>;
  /** sha256 over the canonical payload serialization. Computed, never asserted. */
  payloadHash: string;
  /** Signature CLAIM with key ref. Never verified, never generated here. */
  signature: { algorithm: string; keyRef: string; value: string } | null;
  deliveryState: DeliveryState;
  attemptsUsed: number;
  maxAttempts: number;
  acks: Array<{ level: AckLevel; at: string }>;
  /** Caller-supplied creation time. Never invented. */
  createdAt: string;
  provenance: string;
}

export interface MessageFragment {
  groupId: string;
  fragmentIndex: number;
  fragmentCount: number;
  data: string;
}

export interface MessageStore {
  maxMessages: number;
  messages: Record<string, DTNMessage>;
  fragments: Record<string, MessageFragment[]>;
  dropped: Array<{ messageId: string; reason: string; at: string }>;
}

const MESSAGE_FIELDS = [
  "messageId", "sequence", "priority", "expiresAt", "compression",
  "payload", "signature", "maxAttempts", "createdAt", "provenance",
] as const;

const SIGNATURE_FIELDS = ["algorithm", "keyRef", "value"] as const;

const AUTHORITY_KEYS = [
  "authorized", "approved", "canExecute", "canDeploy", "permission",
  "permissionGranted", "grantApproved", "policyBypass", "ownerOverride",
  "mergeAuthority", "releaseApproved", "deployApproved",
];

const SECRET_KEYS = ["apiKey", "secret", "signingKey", "privateKey", "token", "password", "credential"];

const PERSONALITY_KEYS = [
  "personality", "persona", "traits", "backstory", "biography",
  "autobiography", "identity", "dna", "soul", "selfModel",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function nonNegativeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/**
 * Security-significant violations are diagnosed BEFORE generic shape errors,
 * so a smuggled key value is reported as itself and never disappears into an
 * unknown-field complaint. Payload content stays opaque: only the envelope's
 * own declared fields are scanned.
 */
function assertNoViolations(value: Record<string, unknown>, path: string): void {
  for (const key of Object.keys(value)) {
    if (AUTHORITY_KEYS.includes(key)) {
      throw new DegradedLinkError("DEGRADED_AUTHORITY_REJECTED", `${path}.${key}: transport never carries authority`);
    }
    if (SECRET_KEYS.includes(key)) {
      throw new DegradedLinkError("DEGRADED_SECRET_REJECTED", `${path}.${key}: SIGNING KEY REF != SIGNING KEY VALUE`);
    }
    if (PERSONALITY_KEYS.includes(key)) {
      throw new DegradedLinkError("DEGRADED_PERSONALITY_REJECTED", `${path}.${key}: a message envelope carries no stored person`);
    }
  }
}

/** Canonical JSON: sorted keys, recursively. Digests hash this, never raw text. */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function payloadDigest(payload: Record<string, unknown>): string {
  return sha256HexBytes(new TextEncoder().encode(canonicalJson(payload)));
}

function encodeData(text: string, compression: Compression): string {
  if (compression === "none") return text;
  return Buffer.from(gzipSync(text)).toString("base64");
}

function decodeData(data: string, compression: Compression): string {
  if (compression === "none") return data;
  return Buffer.from(gunzipSync(Buffer.from(data, "base64"))).toString("utf8");
}

export function createStore(maxMessages: number): MessageStore {
  if (!Number.isInteger(maxMessages) || maxMessages < 1) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "maxMessages must be a positive integer: QUEUE ACCEPTED != UNBOUNDED CAPACITY");
  }
  return { maxMessages, messages: {}, fragments: {}, dropped: [] };
}

export interface EnqueueInput {
  messageId: string;
  sequence: number;
  priority?: number;
  /** Epoch ms. Caller-supplied; never defaulted. */
  expiresAt: number;
  compression?: Compression;
  payload: Record<string, unknown>;
  signature?: { algorithm: string; keyRef: string; value: string } | null;
  maxAttempts?: number;
  createdAt: string;
  provenance: string;
  /** Caller-supplied observation time of this enqueue. */
  observedAt: string;
}

export interface EnqueueReceipt {
  messageId: string;
  /** Transport log sequence the envelope was published under. */
  logSeq: number;
  digest: string;
  duplicate: boolean;
}

/**
 * Store-and-forward enqueue: validate, bound, hash, publish the envelope to
 * the durable log through the existing transport, record QUEUED. Same id +
 * identical content is idempotent; same id + different content is a conflict.
 * Already-expired mail is refused, never stored dead.
 */
export function enqueue(
  store: MessageStore,
  transport: RealtimeTransport,
  sub: Subscriber,
  channel: string,
  input: unknown,
  nowMs: number,
): { store: MessageStore; receipt: EnqueueReceipt } {
  if (!isPlainObject(input)) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "enqueue input must be an object");
  }
  assertNoViolations(input, "message");
  for (const key of Object.keys(input)) {
    if (!(MESSAGE_FIELDS as readonly string[]).includes(key) && key !== "observedAt") {
      throw new DegradedLinkError("DEGRADED_UNKNOWN_FIELD", `unknown message field ${key}`);
    }
  }
  const record = input as Record<string, unknown>;
  if (!nonEmpty(record.messageId)) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "messageId must be a non-empty stable id: MESSAGE != TASK, MESSAGE != SIDE EFFECT");
  }
  if (!Number.isInteger(record.sequence) || (record.sequence as number) < 0) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "sequence must be a non-negative integer: preserved, never renumbered");
  }
  const priority = record.priority === undefined ? 0 : record.priority;
  if (typeof priority !== "number" || !Number.isFinite(priority)) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "priority must be a finite number when present");
  }
  if (typeof record.expiresAt !== "number" || !Number.isFinite(record.expiresAt) || record.expiresAt < 0) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "expiresAt must be a finite non-negative epoch ms: LEASE TTL != MESSAGE TTL");
  }
  const compression = (record.compression ?? "none") as Compression;
  if (!COMPRESSIONS.includes(compression)) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", `compression must be one of ${COMPRESSIONS.join(", ")}`);
  }
  if (!isPlainObject(record.payload)) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "payload must be an object");
  }
  let signature: DTNMessage["signature"] = null;
  if (record.signature !== undefined && record.signature !== null) {
    if (!isPlainObject(record.signature)) {
      throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "signature must be an object or null");
    }
    for (const key of Object.keys(record.signature)) {
      if (!(SIGNATURE_FIELDS as readonly string[]).includes(key)) {
        throw new DegradedLinkError("DEGRADED_UNKNOWN_FIELD", `unknown signature field ${key}`);
      }
    }
    const sig = record.signature as Record<string, unknown>;
    if (!nonEmpty(sig.algorithm) || !nonEmpty(sig.keyRef) || !nonEmpty(sig.value)) {
      throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "a signature claim needs non-empty algorithm, keyRef, and value");
    }
    signature = { algorithm: sig.algorithm, keyRef: sig.keyRef, value: sig.value };
  }
  const maxAttempts = record.maxAttempts === undefined ? 3 : record.maxAttempts;
  if (!Number.isInteger(maxAttempts) || (maxAttempts as number) < 1) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "maxAttempts must be a positive integer: TEMPORARY FAILURE != PERMISSION TO RETRY FOREVER");
  }
  if (!nonEmpty(record.createdAt) || !nonEmpty(record.provenance) || !nonEmpty(record.observedAt)) {
    throw new DegradedLinkError("DEGRADED_EVIDENCE_REQUIRED", "createdAt, provenance, and observedAt are required: timestamps are caller-supplied, never invented");
  }
  if (!Number.isFinite(nowMs) || nowMs < 0) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "nowMs must be a finite non-negative epoch ms supplied by the caller");
  }
  if ((record.expiresAt as number) <= nowMs) {
    throw new DegradedLinkError("DEGRADED_EXPIRED", `message ${record.messageId} is already expired: dead mail is refused, never stored`);
  }

  const digest = payloadDigest(record.payload as Record<string, unknown>);
  const existing = store.messages[record.messageId as string];
  if (existing !== undefined) {
    if (existing.payloadHash === digest && existing.sequence === record.sequence) {
      return { store, receipt: { messageId: existing.messageId, logSeq: -1, digest, duplicate: true } };
    }
    throw new DegradedLinkError("DEGRADED_CONFLICT", `message ${record.messageId} already stored with different content`);
  }
  if (Object.keys(store.messages).length >= store.maxMessages) {
    throw new DegradedLinkError("DEGRADED_BUFFER_FULL", `store holds ${store.maxMessages} messages: overflow rejects explicitly, nothing drops silently`);
  }

  const message: DTNMessage = {
    messageId: record.messageId as string,
    sequence: record.sequence as number,
    priority: priority as number,
    expiresAt: record.expiresAt as number,
    compression,
    payload: JSON.parse(JSON.stringify(record.payload)) as Record<string, unknown>,
    payloadHash: digest,
    signature,
    deliveryState: "QUEUED",
    attemptsUsed: 0,
    maxAttempts: maxAttempts as number,
    acks: [],
    createdAt: record.createdAt as string,
    provenance: record.provenance as string,
  };
  const event = transport.publish(sub, channel, "dtn.envelope", {
    messageId: message.messageId,
    sequence: message.sequence,
    priority: message.priority,
    expiresAt: message.expiresAt,
    compression: message.compression,
    payload: message.payload,
    payloadHash: message.payloadHash,
    signature: message.signature,
    provenance: message.provenance,
  });
  return {
    store: { ...store, messages: { ...store.messages, [message.messageId]: message } },
    receipt: { messageId: message.messageId, logSeq: event.seq, digest, duplicate: false },
  };
}

export interface LinkGate {
  state: LinkState;
  /** Required under DEGRADED: minimum priority eligible to drain. No default invented. */
  priorityFloor?: number;
  /** Caller-supplied observation time of this decision. */
  observedAt: string;
}

/**
 * Which queued messages may drain under the declared link state. Pure policy
 * evaluation: returns the eligible list, mutates nothing, sends nothing.
 * OFFLINE and UNKNOWN hold everything; DEGRADED needs an explicit floor;
 * HEALTHY drains all queued in priority/sequence order.
 */
export function drainEligible(store: MessageStore, link: LinkGate, nowMs: number): DTNMessage[] {
  if (!LINK_STATES.includes(link.state)) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", `link state must be one of ${LINK_STATES.join(", ")}: UNKNOWN stays UNKNOWN`);
  }
  if (!nonEmpty(link.observedAt)) {
    throw new DegradedLinkError("DEGRADED_EVIDENCE_REQUIRED", "link gate needs a caller-supplied observedAt");
  }
  if (!Number.isFinite(nowMs) || nowMs < 0) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "nowMs must be supplied by the caller");
  }
  if (link.state === "OFFLINE" || link.state === "UNKNOWN") return [];
  const queued = Object.values(store.messages).filter(
    (m) => m.deliveryState === "QUEUED" && m.expiresAt > nowMs,
  );
  if (link.state === "HEALTHY") {
    return [...queued].sort(compareMessages);
  }
  if (link.priorityFloor === undefined || typeof link.priorityFloor !== "number" || !Number.isFinite(link.priorityFloor)) {
    throw new DegradedLinkError("DEGRADED_BAD_PRIORITY_FLOOR", "a DEGRADED link needs an explicit caller-supplied priority floor: no default is invented");
  }
  return queued.filter((m) => m.priority >= (link.priorityFloor as number)).sort(compareMessages);
}

function compareMessages(a: DTNMessage, b: DTNMessage): number {
  if (b.priority !== a.priority) return b.priority - a.priority;
  if (a.sequence !== b.sequence) return a.sequence - b.sequence;
  return a.messageId < b.messageId ? -1 : 1;
}

/** Record a send attempt. SEND ATTEMPT != DELIVERY. */
export function markSent(store: MessageStore, messageId: string, observedAt: string): MessageStore {
  const message = store.messages[messageId];
  if (message === undefined) {
    throw new DegradedLinkError("DEGRADED_UNKNOWN_MESSAGE", `message ${messageId} is not in this store: unknown stays unknown`);
  }
  if (!nonEmpty(observedAt)) {
    throw new DegradedLinkError("DEGRADED_EVIDENCE_REQUIRED", "markSent needs a caller-supplied observedAt");
  }
  if (message.attemptsUsed >= message.maxAttempts) {
    throw new DegradedLinkError("DEGRADED_RETRY_EXHAUSTED", `message ${messageId} used ${message.attemptsUsed}/${message.maxAttempts} attempts`);
  }
  if (message.deliveryState !== "QUEUED" && message.deliveryState !== "DELAYED") {
    throw new DegradedLinkError("DEGRADED_BAD_TRANSITION", `message ${messageId} is ${message.deliveryState}: only QUEUED or DELAYED messages can be marked sent`);
  }
  return {
    ...store,
    messages: {
      ...store.messages,
      [messageId]: { ...message, deliveryState: "SENT", attemptsUsed: message.attemptsUsed + 1 },
    },
  };
}

/**
 * Record an acknowledgement. Idempotent: the same level twice changes
 * nothing. Unknown messages are rejected, never fabricated into state.
 * Out-of-order acks are accepted independently.
 */
export function acknowledge(
  store: MessageStore,
  messageId: string,
  level: AckLevel,
  observedAt: string,
): MessageStore {
  const message = store.messages[messageId];
  if (message === undefined) {
    throw new DegradedLinkError("DEGRADED_UNKNOWN_ACK", `ack for unknown message ${messageId}: unknown acks are rejected, never fabricated into state`);
  }
  if (!ACK_LEVELS.includes(level)) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", `ack level must be one of ${ACK_LEVELS.join(", ")}: TRANSPORT ACK != APPLICATION COMPLETION`);
  }
  if (!nonEmpty(observedAt)) {
    throw new DegradedLinkError("DEGRADED_EVIDENCE_REQUIRED", "acknowledge needs a caller-supplied observedAt");
  }
  if (message.deliveryState === "ACKNOWLEDGED" && message.acks.some((a) => a.level === level)) {
    return store;
  }
  const acks = message.acks.some((a) => a.level === level)
    ? message.acks
    : [...message.acks, { level, at: observedAt }].sort((a, b) => (a.level < b.level ? -1 : 1));
  return {
    ...store,
    messages: { ...store.messages, [messageId]: { ...message, deliveryState: "ACKNOWLEDGED", acks } },
  };
}

/**
 * Retry eligibility, computed — never scheduled. Eligible iff the message is
 * unacknowledged, unexpired, and has attempts left. RETRYABLE != RETRY SCHEDULED.
 */
export function retryEligible(
  store: MessageStore,
  messageId: string,
  nowMs: number,
): { eligible: boolean; reason: string } {
  const message = store.messages[messageId];
  if (message === undefined) {
    return { eligible: false, reason: `unknown message ${messageId}` };
  }
  if (message.deliveryState === "ACKNOWLEDGED") {
    return { eligible: false, reason: "already acknowledged" };
  }
  if (message.deliveryState === "DROPPED") {
    return { eligible: false, reason: "explicitly dropped" };
  }
  if (message.deliveryState === "EXPIRED" || message.expiresAt <= nowMs) {
    return { eligible: false, reason: "expired" };
  }
  if (message.deliveryState === "QUEUED") {
    return { eligible: true, reason: "never attempted" };
  }
  if (message.attemptsUsed >= message.maxAttempts) {
    return { eligible: false, reason: `attempts exhausted ${message.attemptsUsed}/${message.maxAttempts}` };
  }
  return { eligible: true, reason: "unacknowledged with attempts remaining" };
}

/**
 * Sweep expiry with a caller-driven tick. No timers, no daemons: the caller
 * decides when time has passed. Expired messages are marked, never delivered.
 */
export function expireSweep(store: MessageStore, nowMs: number): MessageStore {
  if (!Number.isFinite(nowMs) || nowMs < 0) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "expireSweep needs a caller-supplied nowMs");
  }
  let changed = false;
  const messages: Record<string, DTNMessage> = {};
  for (const [id, message] of Object.entries(store.messages)) {
    if (
      (message.deliveryState === "QUEUED" || message.deliveryState === "SENT" || message.deliveryState === "DELAYED") &&
      message.expiresAt <= nowMs
    ) {
      messages[id] = { ...message, deliveryState: "EXPIRED" };
      changed = true;
    } else {
      messages[id] = message;
    }
  }
  return changed ? { ...store, messages } : store;
}

/**
 * Explicit caller drop with a recorded reason. The only way a message leaves
 * without delivery or expiry — never silent, never a verdict on anything else.
 */
export function dropMessage(store: MessageStore, messageId: string, reason: string, observedAt: string): MessageStore {
  const message = store.messages[messageId];
  if (message === undefined) {
    throw new DegradedLinkError("DEGRADED_UNKNOWN_MESSAGE", `message ${messageId} is not in this store`);
  }
  if (!nonEmpty(reason) || !nonEmpty(observedAt)) {
    throw new DegradedLinkError("DEGRADED_EVIDENCE_REQUIRED", "dropMessage needs a non-empty reason and observedAt: DROPPED != DELIVERED");
  }
  if (message.deliveryState === "ACKNOWLEDGED") {
    throw new DegradedLinkError("DEGRADED_BAD_TRANSITION", `message ${messageId} is already acknowledged and cannot be dropped`);
  }
  return {
    ...store,
    messages: { ...store.messages, [messageId]: { ...message, deliveryState: "DROPPED" } },
    dropped: [...store.dropped, { messageId, reason, at: observedAt }],
  };
}

/**
 * Split a payload string into fragments for degraded transport. Pure
 * splitting; fragment records carry their position explicitly.
 */
export function fragmentData(groupId: string, data: string, maxFragmentChars: number): MessageFragment[] {
  if (!nonEmpty(groupId)) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "fragment groupId must be non-empty");
  }
  if (typeof data !== "string" || data.length === 0) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "fragment data must be a non-empty string");
  }
  if (!Number.isInteger(maxFragmentChars) || maxFragmentChars < 1) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "maxFragmentChars must be a positive integer");
  }
  const count = Math.ceil(data.length / maxFragmentChars);
  const fragments: MessageFragment[] = [];
  for (let index = 0; index < count; index += 1) {
    fragments.push({
      groupId,
      fragmentIndex: index,
      fragmentCount: count,
      data: data.slice(index * maxFragmentChars, (index + 1) * maxFragmentChars),
    });
  }
  return fragments;
}

/**
 * Reassemble a fragment group. Requires every index present exactly once —
 * a gap names its missing indices instead of pretending completeness.
 */
export function reassembleGroup(fragments: MessageFragment[]): string {
  if (!Array.isArray(fragments) || fragments.length === 0) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "reassembly needs a non-empty fragment list");
  }
  const count = fragments[0]!.fragmentCount;
  if (!Number.isInteger(count) || count < 1 || fragments.some((f) => f.fragmentCount !== count)) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "fragments disagree on their group size");
  }
  const groupId = fragments[0]!.groupId;
  if (fragments.some((f) => f.groupId !== groupId)) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "fragments belong to different groups");
  }
  const byIndex = new Map<number, string>();
  for (const fragment of fragments) {
    if (!Number.isInteger(fragment.fragmentIndex) || fragment.fragmentIndex < 0 || fragment.fragmentIndex >= count) {
      throw new DegradedLinkError("DEGRADED_INVALID_INPUT", `fragment index ${fragment.fragmentIndex} out of range`);
    }
    if (byIndex.has(fragment.fragmentIndex)) {
      throw new DegradedLinkError("DEGRADED_DUPLICATE_MESSAGE", `fragment ${fragment.fragmentIndex} supplied twice: DUPLICATE DELIVERY != DUPLICATE INTENT`);
    }
    byIndex.set(fragment.fragmentIndex, fragment.data);
  }
  const missing: number[] = [];
  for (let index = 0; index < count; index += 1) {
    if (!byIndex.has(index)) missing.push(index);
  }
  if (missing.length > 0) {
    throw new DegradedLinkError("DEGRADED_FRAGMENT_GAP", `missing fragments ${missing.join(", ")}: RECEIVED LATER MESSAGE != ALL EARLIER MESSAGES RECEIVED`);
  }
  return [...byIndex.entries()].sort(([a], [b]) => a - b).map(([, data]) => data).join("");
}

/** Pack a text payload with the declared compression. Real gzip, not a label. */
export function packData(text: string, compression: Compression): string {
  if (!COMPRESSIONS.includes(compression)) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", `compression must be one of ${COMPRESSIONS.join(", ")}`);
  }
  return encodeData(text, compression);
}

/** Unpack with the declared compression. Mismatched data fails loudly. */
export function unpackData(data: string, compression: Compression): string {
  if (!COMPRESSIONS.includes(compression)) {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", `compression must be one of ${COMPRESSIONS.join(", ")}`);
  }
  try {
    return decodeData(data, compression);
  } catch {
    throw new DegradedLinkError("DEGRADED_INVALID_INPUT", "payload does not decode under the declared compression");
  }
}

/** Verify a stored payload against its recorded digest. Recomputed, never trusted. */
export function verifyPayload(message: DTNMessage): boolean {
  return payloadDigest(message.payload) === message.payloadHash;
}

/** Read-only status view. Unknown ids report UNKNOWN, never a fabricated state. */
export function messageStatus(
  store: MessageStore,
  messageId: string,
): { messageId: string; state: DeliveryState | "UNKNOWN"; attemptsUsed: number; acks: Array<{ level: AckLevel; at: string }> } {
  const message = store.messages[messageId];
  if (message === undefined) return { messageId, state: "UNKNOWN", attemptsUsed: 0, acks: [] };
  return { messageId, state: message.deliveryState, attemptsUsed: message.attemptsUsed, acks: message.acks.map((a) => ({ ...a })) };
}

/** Canonical snapshot: id order. Same store, same snapshot. */
export function snapshotStore(store: MessageStore): DTNMessage[] {
  return Object.values(store.messages)
    .sort((a, b) => (a.messageId < b.messageId ? -1 : 1))
    .map((m) => JSON.parse(JSON.stringify(m)) as DTNMessage);
}
