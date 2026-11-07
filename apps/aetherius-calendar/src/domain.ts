import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
}

export interface CalendarOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class CalendarService {
  private readonly events = new Map<string, Event>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: CalendarOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(title: string, start: string, end: string, location?: string): Event {
    const event: Event = { id: newId("event"), title, start, end, location };
    this.events.set(event.id, event);
    this.ledger.append({ type: "calendar.event.created", actor: "calendar", subject: event.id });
    return event;
  }

  get(id: string): Event | undefined {
    return this.events.get(id);
  }

  listRange(start: string, end: string): Event[] {
    return Array.from(this.events.values()).filter(
      (e) => e.start >= start && e.end <= end
    );
  }
}
