/**
 * REQ-p27-realtime-transport: realtime comms transport over a durable event
 * log.
 *
 * Transports deliver only what the log has durably accepted; a live WebSocket
 * peer is owner runtime work, not a claim made here.
 */
import { DurableEventLog } from "./log";
import { assertChannel, assertEventShape, assertSubscriber, TransportError } from "./types";
import type { LogEvent, Subscriber } from "./types";

export interface TransportCapabilities {
  kind: "loopback" | "websocket";
  simulated: boolean;
  available: boolean;
  unavailableReason?: string;
}

/**
 * Realtime transport interface: live delivery over channels with durable
 * backlog. Implementations differ in transport only; sequencing, access
 * control and durability live in DurableEventLog, shared by all.
 */
export interface RealtimeTransport {
  capabilities(): TransportCapabilities;
  publish(sub: Subscriber, channel: string, kind: string, payload: unknown): LogEvent;
  /**
   * Resume a subscription: backlog strictly after lastSeenSeq, then the
   * returned head for the next resume. Access-controlled per channel.
   */
  resume(sub: Subscriber, channel: string, lastSeenSeq: number): { events: LogEvent[]; head: number };
  liveTail(sub: Subscriber, channel: string, limit?: number): LogEvent[];
}

/**
 * Loopback transport: in-memory delivery fan-out over the durable log.
 * Labeled simulated; proves reconnect/backlog/access semantics without a
 * socket. Live subscribers receive published events synchronously via
 * registered handlers (test/embedded use).
 */
export class LoopbackTransport implements RealtimeTransport {
  private readonly log: DurableEventLog;
  private readonly handlers = new Map<string, Array<(event: LogEvent) => void>>();

  constructor(log: DurableEventLog) {
    this.log = log;
  }

  capabilities(): TransportCapabilities {
    return { kind: "loopback", simulated: true, available: true };
  }

  on(channel: string, handler: (event: LogEvent) => void): void {
    assertChannel(channel);
    const list = this.handlers.get(channel) ?? [];
    list.push(handler);
    this.handlers.set(channel, list);
  }

  publish(sub: Subscriber, channel: string, kind: string, payload: unknown): LogEvent {
    assertChannel(channel);
    assertSubscriber(sub, channel);
    assertEventShape(kind, payload);
    const event = this.log.publish(channel, kind, payload);
    for (const handler of this.handlers.get(channel) ?? []) {
      handler(event);
    }
    return event;
  }

  resume(sub: Subscriber, channel: string, lastSeenSeq: number): { events: LogEvent[]; head: number } {
    assertChannel(channel);
    assertSubscriber(sub, channel);
    const { events, head } = this.log.replay(channel, lastSeenSeq);
    return { events, head };
  }

  liveTail(sub: Subscriber, channel: string, limit = 25): LogEvent[] {
    assertChannel(channel);
    assertSubscriber(sub, channel);
    if (!Number.isInteger(limit) || limit < 1) {
      throw new TransportError("SEQ_INVALID", "limit must be a positive integer");
    }
    const head = this.log.head(channel);
    const { events } = this.log.replay(channel, Math.max(0, head - limit));
    return events.slice(-limit);
  }
}

/**
 * Declared WebSocket transport with no live peer/server here: every op
 * throws TRANSPORT_UNAVAILABLE with the reason instead of pretending.
 * A real socket backend is owner-authorized runtime work.
 */
export class WebSocketTransport implements RealtimeTransport {
  capabilities(): TransportCapabilities {
    return {
      kind: "websocket",
      simulated: false,
      available: false,
      unavailableReason: "no realtime peer configured (owner-authorized runtime work)",
    };
  }

  private fail(): never {
    throw new TransportError(
      "TRANSPORT_UNAVAILABLE",
      "websocket transport: no realtime peer configured (owner-authorized runtime work)",
    );
  }

  publish(_sub: Subscriber, _channel: string, _kind: string, _payload: unknown): LogEvent {
    this.fail();
  }

  resume(_sub: Subscriber, _channel: string, _lastSeenSeq: number): { events: LogEvent[]; head: number } {
    this.fail();
  }

  liveTail(_sub: Subscriber, _channel: string, _limit?: number): LogEvent[] {
    this.fail();
  }
}
