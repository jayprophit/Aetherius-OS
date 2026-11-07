import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface FocusSession {
  id: string;
  durationMin: number;
  appWhitelist: string[];
}

export interface FocusOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class FocusService {
  private readonly sessions = new Map<string, FocusSession>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: FocusOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  start(durationMin: number, appWhitelist: string[] = []): FocusSession {
    const session: FocusSession = { id: newId("focus"), durationMin, appWhitelist };
    this.sessions.set(session.id, session);
    this.ledger.append({ type: "focus.started", actor: "focus", subject: session.id });
    return session;
  }

  list(): FocusSession[] {
    return Array.from(this.sessions.values());
  }
}
