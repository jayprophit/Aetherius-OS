import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Session {
  id: string;
  host: string;
  requester: string;
  status: "pending" | "active" | "ended";
}

export interface RemoteOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class RemoteService {
  private readonly sessions = new Map<string, Session>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: RemoteOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  request(host: string, requester: string): Session {
    const session: Session = { id: newId("remote"), host, requester, status: "pending" };
    this.sessions.set(session.id, session);
    this.ledger.append({ type: "remote.requested", actor: "remote", subject: session.id });
    return session;
  }

  list(): Session[] {
    return Array.from(this.sessions.values());
  }
}
