import { canonicalSerialize, type OwnedStore } from "../state/store";
import type { StateEnvelope } from "../state/types";
import { assertChannel, assertEventShape, TransportError } from "./types";
import type { LogEvent } from "./types";

const KIND = "realtime.channel-log";
const SCHEMA = 1;

interface ChannelLog {
  nextSeq: number;
  events: LogEvent[];
}

/**
 * Durable per-channel event log over the shared owned-state store: atomic
 * writes, integrity hashes, optimistic versions. Sequence numbers are
 * monotonic per channel and survive restarts (read from the stored log).
 * Bounded in memory: at most `retained` events per channel are kept
 * loaded; older events remain loadable only via explicit replay window
 * errors — resume before the retention floor fails honestly instead of
 * silently skipping.
 */
export class DurableEventLog {
  private readonly store: OwnedStore;
  private readonly owner: string;
  private readonly retained: number;
  private readonly now: () => string;

  constructor(store: OwnedStore, owner: string, options: { retained?: number; now?: () => string } = {}) {
    if (!Number.isInteger(options.retained ?? 1000) || (options.retained ?? 1000) < 1) {
      throw new TransportError("SEQ_INVALID", "retained must be a positive integer");
    }
    this.store = store;
    this.owner = owner;
    this.retained = options.retained ?? 1000;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  private recordId(channel: string): string {
    return `realtime-log-${channel.replace(/[^a-z0-9_-]/gi, "-")}`;
  }

  private read(channel: string): { log: ChannelLog; recordVersion: number; createdAt: string } {
    assertChannel(channel);
    const id = this.recordId(channel);
    if (!this.store.exists(id)) {
      return { log: { nextSeq: 1, events: [] }, recordVersion: 0, createdAt: this.now() };
    }
    const envelope = this.store.load<ChannelLog>(id);
    if (envelope.kind !== KIND) {
      throw new TransportError("EVENT_MALFORMED", `record ${id} is not a channel log`);
    }
    return { log: envelope.payload, recordVersion: envelope.recordVersion, createdAt: envelope.createdAt };
  }

  private write(channel: string, log: ChannelLog, recordVersion: number, createdAt: string): void {
    const id = this.recordId(channel);
    const envelope: StateEnvelope<ChannelLog> = {
      id,
      kind: KIND,
      schemaVersion: SCHEMA,
      recordVersion: recordVersion + 1,
      createdAt,
      updatedAt: this.now(),
      owner: this.owner,
      provenance: "p27-realtime-transport",
      sensitivity: "USER",
      integrity: "",
      payload: log,
    };
    this.store.save(envelope, {
      expectedRecordVersion: recordVersion === 0 ? undefined : recordVersion,
      causedBy: { actor: "realtime-log", source: "p27-realtime-transport" },
    });
  }

  /** Append an event; returns the sequenced record. */
  publish(channel: string, kind: string, payload: unknown): LogEvent {
    const clean = assertEventShape(kind, payload);
    const { log, recordVersion, createdAt } = this.read(channel);
    const event: LogEvent = {
      seq: log.nextSeq,
      channel,
      kind: kind.trim(),
      payload: JSON.parse(canonicalSerialize(clean)) as Record<string, unknown>,
      at: this.now(),
    };
    const events = [...log.events, event].slice(-this.retained);
    this.write(channel, { nextSeq: log.nextSeq + 1, events }, recordVersion, createdAt);
    return event;
  }

  /**
   * Replay events strictly after `fromSeq`. If the retention floor moved
   * past fromSeq, fails honestly (caller must resync, never silently skip).
   */
  replay(channel: string, fromSeq: number): { events: LogEvent[]; floor: number; head: number } {
    if (!Number.isInteger(fromSeq) || fromSeq < 0) {
      throw new TransportError("SEQ_INVALID", "fromSeq must be a non-negative integer");
    }
    const { log } = this.read(channel);
    const floor = log.events.length > 0 ? log.events[0]!.seq : log.nextSeq;
    if (fromSeq < floor - 1 && log.events.length > 0) {
      throw new TransportError(
        "SEQ_INVALID",
        `channel ${channel} retained only from seq ${floor}; resync required`,
      );
    }
    return { events: log.events.filter((e) => e.seq > fromSeq), floor, head: log.nextSeq - 1 };
  }

  head(channel: string): number {
    return this.read(channel).log.nextSeq - 1;
  }
}
