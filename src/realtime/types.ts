/**
 * REQ-p27-realtime-transport contracts (P27): realtime comms transport
 * with a durable event log. Reference: ClickClack realtime (v0.5.1, MIT,
 * STUDY_ONLY) — mechanics only.
 *
 * Design: WebSocket-style live delivery backed by a DURABLE per-channel
 * event log. Subscribers resume from their last seen sequence and receive
 * exactly the missed backlog (reconnect semantics); backlog access is
 * controlled per subscriber channel allowlist. No live socket exists in
 * this unit — delivery runs over the transport interface with a loopback
 * implementation; the WebSocket transport is declared-unavailable.
 */

export interface LogEvent {
  seq: number;
  channel: string;
  kind: string;
  payload: Record<string, unknown>;
  at: string;
}

export interface Subscriber {
  subscriberId: string;
  channels: readonly string[];
}

export type TransportErrorCode =
  | "CHANNEL_DENIED"
  | "CHANNEL_INVALID"
  | "EVENT_MALFORMED"
  | "TRANSPORT_UNAVAILABLE"
  | "SEQ_INVALID";

export class TransportError extends Error {
  readonly code: TransportErrorCode;
  constructor(code: TransportErrorCode, message: string) {
    super(message);
    this.name = "TransportError";
    this.code = code;
  }
}

const CHANNEL_RE = /^[a-z0-9][a-z0-9_.:-]*$/i;
const MAX_CHANNELS = 64;
const MAX_PAYLOAD_BYTES = 65536;

export function assertChannel(channel: string): void {
  if (!CHANNEL_RE.test(channel) || channel.length > 128) {
    throw new TransportError("CHANNEL_INVALID", `invalid channel ${channel}`);
  }
}

export function assertEventShape(kind: string, payload: unknown): Record<string, unknown> {
  if (!kind.trim()) throw new TransportError("EVENT_MALFORMED", "event kind is required");
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new TransportError("EVENT_MALFORMED", "event payload must be an object");
  }
  const bytes = JSON.stringify(payload).length;
  if (bytes > MAX_PAYLOAD_BYTES) {
    throw new TransportError("EVENT_MALFORMED", `event payload ${bytes} exceeds ${MAX_PAYLOAD_BYTES} bytes`);
  }
  return payload as Record<string, unknown>;
}

export function assertSubscriber(sub: Subscriber, channel: string): void {
  if (!sub.subscriberId.trim()) throw new TransportError("CHANNEL_DENIED", "subscriber id is required");
  if (sub.channels.length > MAX_CHANNELS) {
    throw new TransportError("CHANNEL_DENIED", `subscriber allows more than ${MAX_CHANNELS} channels`);
  }
  if (!sub.channels.includes(channel)) {
    throw new TransportError("CHANNEL_DENIED", `subscriber ${sub.subscriberId} may not read ${channel}`);
  }
}
