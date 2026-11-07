import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Stream {
  id: string;
  title: string;
  platform: string;
  status: "idle" | "live" | "ended";
}

export interface BroadcastOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Broadcast {
  private readonly streams = new Map<string, Stream>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: BroadcastOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  start(title: string, platform: string): Stream {
    const stream: Stream = { id: newId("stream"), title, platform, status: "live" };
    this.streams.set(stream.id, stream);
    this.ledger.append({ type: "broadcast.started", actor: "broadcast", subject: stream.id });
    return stream;
  }

  list(): Stream[] {
    return Array.from(this.streams.values());
  }
}
