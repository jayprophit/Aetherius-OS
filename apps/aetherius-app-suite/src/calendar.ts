import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Calendar core.
 *
 * Events are stored as ISO instants. Recurrence is expanded deterministically
 * for daily, weekly and monthly rules, with the monthly day clamped to the
 * last day of a shorter month. The ICS export is a real RFC 5545-shaped
 * calendar, not a screenshot of one.
 */

export type Recurrence = "none" | "daily" | "weekly" | "monthly";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string;
  notes: string;
  reminderMinutes: number[];
  recurrence: Recurrence;
  recurrenceUntil: string | null;
  createdAt: string;
}

export interface CreateEventInput {
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string;
  notes?: string;
  reminderMinutes?: number[];
  recurrence?: Recurrence;
  recurrenceUntil?: string | null;
}

export interface CalendarOccurrence {
  event: CalendarEvent;
  start: string;
  end: string;
}

export interface CalendarOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

const DAY_MS = 86_400_000;
const MAX_OCCURRENCES = 1000;

function parseInstant(value: string, field: string): number {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new Error(`${field} is not an ISO date: ${value}`);
  return time;
}

function addMonthsClamped(time: number, months: number): number {
  const date = new Date(time);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const daysInMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, daysInMonth));
  return date.getTime();
}

function advance(time: number, recurrence: Recurrence): number {
  if (recurrence === "daily") return time + DAY_MS;
  if (recurrence === "weekly") return time + 7 * DAY_MS;
  return Number.NaN;
}

export class CalendarApp {
  private readonly events = new Map<string, CalendarEvent>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: CalendarOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  add(input: CreateEventInput): CalendarEvent {
    const event = this.build(input, newId("evt"), nowIso(this.clock));
    this.events.set(event.id, event);
    this.ledger.append({ type: "calendar.event.added", actor: "calendar", subject: event.id, data: { recurrence: event.recurrence } });
    return structuredClone(event);
  }

  update(eventId: string, patch: Partial<CreateEventInput>): CalendarEvent {
    const current = this.require(eventId);
    const merged: CreateEventInput = {
      title: patch.title ?? current.title,
      start: patch.start ?? current.start,
      end: patch.end ?? current.end,
      allDay: patch.allDay ?? current.allDay,
      location: patch.location ?? current.location,
      notes: patch.notes ?? current.notes,
      reminderMinutes: patch.reminderMinutes ?? current.reminderMinutes,
      recurrence: patch.recurrence ?? current.recurrence,
      recurrenceUntil: patch.recurrenceUntil === undefined ? current.recurrenceUntil : patch.recurrenceUntil,
    };
    const next = this.build(merged, current.id, current.createdAt);
    this.events.set(eventId, next);
    this.ledger.append({ type: "calendar.event.updated", actor: "calendar", subject: eventId, data: {} });
    return structuredClone(next);
  }

  remove(eventId: string): boolean {
    this.require(eventId);
    this.events.delete(eventId);
    this.ledger.append({ type: "calendar.event.removed", actor: "calendar", subject: eventId, data: {} });
    return true;
  }

  get(eventId: string): CalendarEvent | undefined {
    const event = this.events.get(eventId);
    return event ? structuredClone(event) : undefined;
  }

  list(): CalendarEvent[] {
    return [...this.events.values()]
      .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title))
      .map((event) => structuredClone(event));
  }

  /** Expand every event into occurrences that overlap [from, to). */
  range(from: string, to: string): CalendarOccurrence[] {
    const start = parseInstant(from, "from");
    const end = parseInstant(to, "to");
    if (end <= start) throw new Error("the range must end after it starts");
    const occurrences: CalendarOccurrence[] = [];
    for (const event of this.events.values()) {
      occurrences.push(...this.occurrences(event, start, end));
    }
    return occurrences.sort(
      (a, b) => a.start.localeCompare(b.start) || a.event.title.localeCompare(b.event.title),
    );
  }

  /** Stored occurrences that overlap the proposed window. */
  conflicts(start: string, end: string, ignoreEventId?: string): CalendarOccurrence[] {
    const from = parseInstant(start, "start");
    const to = parseInstant(end, "end");
    if (to <= from) throw new Error("the window must end after it starts");
    return this.range(start, end).filter(
      (occurrence) => occurrence.event.id !== ignoreEventId,
    );
  }

  /** A deterministic RFC 5545-shaped calendar. */
  ics(): string {
    const stamp = formatIcsInstant(new Date(nowIso(this.clock)).getTime());
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Aetherius//Calendar 1.0//EN", "CALSCALE:GREGORIAN"];
    for (const event of this.events.values()) {
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${event.id}@aetherius.local`);
      lines.push(`DTSTAMP:${stamp}`);
      if (event.allDay) {
        lines.push(`DTSTART;VALUE=DATE:${formatIcsDate(event.start)}`);
        lines.push(`DTEND;VALUE=DATE:${formatIcsDate(event.end)}`);
      } else {
        lines.push(`DTSTART:${formatIcsInstant(Date.parse(event.start))}`);
        lines.push(`DTEND:${formatIcsInstant(Date.parse(event.end))}`);
      }
      lines.push(`SUMMARY:${escapeIcs(event.title)}`);
      if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);
      if (event.notes) lines.push(`DESCRIPTION:${escapeIcs(event.notes)}`);
      if (event.recurrence !== "none") {
        const frequency = event.recurrence.toUpperCase();
        const until = event.recurrenceUntil ? `;UNTIL=${formatIcsInstant(Date.parse(event.recurrenceUntil))}` : "";
        lines.push(`RRULE:FREQ=${frequency}${until}`);
      }
      for (const minutes of event.reminderMinutes) {
        lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `TRIGGER:-PT${minutes}M`, `DESCRIPTION:${escapeIcs(event.title)}`, "END:VALARM");
      }
      lines.push("END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    return `${lines.join("\r\n")}\r\n`;
  }

  private occurrences(event: CalendarEvent, from: number, to: number): CalendarOccurrence[] {
    const start = Date.parse(event.start);
    const duration = Date.parse(event.end) - start;
    const until = event.recurrenceUntil ? Date.parse(event.recurrenceUntil) : null;
    const occurrences: CalendarOccurrence[] = [];
    let cursor = start;
    let count = 0;
    let step = 0;
    while (cursor < to) {
      if (until !== null && cursor > until) break;
      if (cursor + duration > from) {
        occurrences.push({
          event: structuredClone(event),
          start: new Date(cursor).toISOString(),
          end: new Date(cursor + duration).toISOString(),
        });
      }
      count += 1;
      if (count > MAX_OCCURRENCES) throw new Error(`recurrence expands beyond ${MAX_OCCURRENCES} occurrences`);
      if (event.recurrence === "none") break;
      step += 1;
      // Monthly recurrences are computed from the original start so a 31st
      // returns to the 31st after passing through February.
      cursor = event.recurrence === "monthly" ? addMonthsClamped(start, step) : advance(cursor, event.recurrence);
    }
    return occurrences;
  }

  private build(input: CreateEventInput, id: string, createdAt: string): CalendarEvent {
    if (!input.title.trim()) throw new Error("an event needs a title");
    const start = parseInstant(input.start, "start");
    const end = parseInstant(input.end, "end");
    if (end <= start) throw new Error("an event must end after it starts");
    const recurrence = input.recurrence ?? "none";
    if (!["none", "daily", "weekly", "monthly"].includes(recurrence)) {
      throw new Error(`unknown recurrence: ${recurrence}`);
    }
    const recurrenceUntil = input.recurrenceUntil
      ? new Date(parseInstant(input.recurrenceUntil, "recurrenceUntil")).toISOString()
      : null;
    if (recurrenceUntil && Date.parse(recurrenceUntil) < start) {
      throw new Error("recurrenceUntil cannot be before the event starts");
    }
    const reminderMinutes = [...new Set(input.reminderMinutes ?? [])].sort((a, b) => a - b);
    for (const minutes of reminderMinutes) {
      if (!Number.isInteger(minutes) || minutes < 0 || minutes > 10_080) {
        throw new Error(`reminder is out of range: ${minutes}`);
      }
    }
    return {
      id,
      title: input.title.trim(),
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      allDay: input.allDay === true,
      location: input.location?.trim() ?? "",
      notes: input.notes?.trim() ?? "",
      reminderMinutes,
      recurrence,
      recurrenceUntil,
      createdAt,
    };
  }

  private require(eventId: string): CalendarEvent {
    const event = this.events.get(eventId);
    if (!event) throw new Error(`no event: ${eventId}`);
    return structuredClone(event);
  }
}

function formatIcsInstant(time: number): string {
  const date = new Date(time);
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function formatIcsDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "");
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
