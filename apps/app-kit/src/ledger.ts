import { createHash } from "node:crypto";
import { nowIso } from "./ids.ts";

export interface LedgerEvent {
  seq: number;
  at: string;
  type: string;
  actor: string;
  subject: string;
  data: Record<string, unknown>;
  prev: string;
  hash: string;
}

export interface AppendEvent {
  type: string;
  actor: string;
  subject: string;
  data?: Record<string, unknown>;
}

const GENESIS = "0".repeat(64);

/** Stable JSON so a hash does not depend on object key insertion order. */
function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}

function hashEvent(event: Omit<LedgerEvent, "hash">): string {
  return createHash("sha256").update(canonical(event)).digest("hex");
}

/**
 * An append-only, hash-chained event ledger.
 *
 * This is the audit trail the applications share: a purchase, an enrolment,
 * a moderation decision and a ledger posting all become events. The chain
 * makes a deleted or edited event detectable without a database.
 */
export class EventLedger {
  private readonly events: LedgerEvent[] = [];
  private readonly clock: () => Date;

  constructor(seed: readonly LedgerEvent[] = [], clock: () => Date = () => new Date()) {
    this.clock = clock;
    if (seed.length > 0) {
      const result = EventLedger.verify(seed);
      if (result.ok === false) throw new Error(`refusing to load a broken ledger: ${result.reason}`);
      this.events.push(...seed.map((event) => structuredClone(event)));
    }
  }

  append(input: AppendEvent): LedgerEvent {
    if (!input.type.trim()) throw new Error("event type is empty");
    if (!input.actor.trim()) throw new Error("event actor is empty");
    if (!input.subject.trim()) throw new Error("event subject is empty");
    const prev = this.events.at(-1)?.hash ?? GENESIS;
    const withoutHash: Omit<LedgerEvent, "hash"> = {
      seq: this.events.length + 1,
      at: nowIso(this.clock),
      type: input.type,
      actor: input.actor,
      subject: input.subject,
      data: structuredClone(input.data ?? {}),
      prev,
    };
    const event: LedgerEvent = { ...withoutHash, hash: hashEvent(withoutHash) };
    this.events.push(event);
    return structuredClone(event);
  }

  all(): LedgerEvent[] {
    return this.events.map((event) => structuredClone(event));
  }

  ofType(type: string): LedgerEvent[] {
    return this.events.filter((event) => event.type === type).map((event) => structuredClone(event));
  }

  forSubject(subject: string): LedgerEvent[] {
    return this.events
      .filter((event) => event.subject === subject)
      .map((event) => structuredClone(event));
  }

  get length(): number {
    return this.events.length;
  }

  static verify(events: readonly LedgerEvent[]): { ok: true } | { ok: false; reason: string } {
    let prev = GENESIS;
    for (let index = 0; index < events.length; index += 1) {
      const event = events[index]!;
      if (event.seq !== index + 1) return { ok: false, reason: `event ${index + 1} has seq ${event.seq}` };
      if (event.prev !== prev) return { ok: false, reason: `event ${event.seq} does not link to its predecessor` };
      const { hash, ...withoutHash } = event;
      if (hashEvent(withoutHash) !== hash) return { ok: false, reason: `event ${event.seq} has been altered` };
      prev = hash;
    }
    return { ok: true };
  }
}
