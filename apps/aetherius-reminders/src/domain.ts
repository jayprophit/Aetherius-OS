import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Reminders domain core.
 *
 * Lists of reminders with due dates, priority, subtasks and completion
 * tracking. Location triggers are recorded as data (a place name and radius);
 * this core never reads a device location, because there is no host adapter
 * in this layer. Overdue reporting is a pure function of the clock, so it
 * is fully testable without timers.
 */

export type ReminderPriority = "low" | "medium" | "high";

export interface LocationTrigger {
  placeName: string;
  radiusMeters: number;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  notes: string;
  list: string;
  priority: ReminderPriority;
  dueAt: string | null;
  location: LocationTrigger | null;
  subtasks: Subtask[];
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export interface CreateReminderInput {
  title: string;
  notes?: string;
  list?: string;
  priority?: ReminderPriority;
  dueAt?: string | null;
  location?: LocationTrigger | null;
  subtasks?: string[];
}

const PRIORITIES: ReminderPriority[] = ["low", "medium", "high"];

function requireTitle(title: unknown): string {
  if (typeof title !== "string" || title.trim().length === 0) {
    throw new Error("a reminder needs a title");
  }
  return title.trim();
}

function requirePriority(priority: unknown): ReminderPriority {
  if (!PRIORITIES.includes(priority as ReminderPriority)) {
    throw new Error(`priority must be one of: ${PRIORITIES.join(", ")}`);
  }
  return priority as ReminderPriority;
}

function validateDueAt(dueAt: unknown): string | null {
  if (dueAt === undefined || dueAt === null || dueAt === "") return null;
  if (typeof dueAt !== "string" || Number.isNaN(Date.parse(dueAt))) {
    throw new Error("dueAt must be an ISO date or empty");
  }
  return new Date(dueAt).toISOString();
}

function validateLocation(location: unknown): LocationTrigger | null {
  if (location === undefined || location === null) return null;
  const candidate = location as Partial<LocationTrigger>;
  if (typeof candidate.placeName !== "string" || candidate.placeName.trim().length === 0) {
    throw new Error("a location trigger needs a place name");
  }
  const radius = Number(candidate.radiusMeters);
  if (!Number.isFinite(radius) || radius <= 0 || radius > 50_000) {
    throw new Error("a location trigger needs a radius between 1 and 50000 metres");
  }
  return { placeName: candidate.placeName.trim(), radiusMeters: radius };
}

export class Reminders {
  private readonly items = new Map<string, Reminder>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: ReminderOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(input: CreateReminderInput): Reminder {
    const at = nowIso(this.clock);
    const reminder: Reminder = {
      id: newId("rem"),
      title: requireTitle(input.title),
      notes: input.notes ?? "",
      list: (input.list ?? "Inbox").trim() || "Inbox",
      priority: input.priority === undefined ? "medium" : requirePriority(input.priority),
      dueAt: validateDueAt(input.dueAt),
      location: validateLocation(input.location),
      subtasks: (input.subtasks ?? []).map((title) => ({
        id: newId("sub"),
        title: requireTitle(title),
        done: false,
      })),
      completedAt: null,
      createdAt: at,
      updatedAt: at,
    };
    this.items.set(reminder.id, reminder);
    this.ledger.append({
      type: "reminders.created",
      actor: "reminders",
      subject: reminder.id,
      data: { list: reminder.list, priority: reminder.priority, dueAt: reminder.dueAt },
    });
    return structuredClone(reminder);
  }

  get(reminderId: string): Reminder | undefined {
    const found = this.items.get(reminderId);
    return found ? structuredClone(found) : undefined;
  }

  list(options: { list?: string; includeCompleted?: boolean } = {}): Reminder[] {
    return [...this.items.values()]
      .filter((item) => options.list === undefined || item.list === options.list)
      .filter((item) => options.includeCompleted === true || item.completedAt === null)
      .sort((a, b) => {
        const dueA = a.dueAt ?? "9999-12-31T23:59:59.000Z";
        const dueB = b.dueAt ?? "9999-12-31T23:59:59.000Z";
        return dueA.localeCompare(dueB) || a.title.localeCompare(b.title);
      })
      .map((item) => structuredClone(item));
  }

  lists(): string[] {
    return [...new Set([...this.items.values()].map((item) => item.list))].sort();
  }

  update(
    reminderId: string,
    patch: Partial<Pick<Reminder, "title" | "notes" | "list" | "priority" | "dueAt">>,
  ): Reminder {
    const current = this.require(reminderId);
    if (current.completedAt !== null) throw new Error("a completed reminder cannot be edited");
    const next: Reminder = {
      ...current,
      title: patch.title !== undefined ? requireTitle(patch.title) : current.title,
      notes: patch.notes ?? current.notes,
      list: patch.list !== undefined ? patch.list.trim() || "Inbox" : current.list,
      priority: patch.priority !== undefined ? requirePriority(patch.priority) : current.priority,
      dueAt: patch.dueAt !== undefined ? validateDueAt(patch.dueAt) : current.dueAt,
      updatedAt: nowIso(this.clock),
    };
    this.items.set(reminderId, next);
    this.ledger.append({
      type: "reminders.updated",
      actor: "reminders",
      subject: reminderId,
      data: { fields: Object.keys(patch).sort() },
    });
    return structuredClone(next);
  }

  complete(reminderId: string): Reminder {
    const current = this.require(reminderId);
    if (current.completedAt !== null) throw new Error("the reminder is already completed");
    const next = { ...current, completedAt: nowIso(this.clock), updatedAt: nowIso(this.clock) };
    this.items.set(reminderId, next);
    this.ledger.append({ type: "reminders.completed", actor: "reminders", subject: reminderId, data: {} });
    return structuredClone(next);
  }

  reopen(reminderId: string): Reminder {
    const current = this.require(reminderId);
    if (current.completedAt === null) throw new Error("the reminder is not completed");
    const next = { ...current, completedAt: null, updatedAt: nowIso(this.clock) };
    this.items.set(reminderId, next);
    this.ledger.append({ type: "reminders.reopened", actor: "reminders", subject: reminderId, data: {} });
    return structuredClone(next);
  }

  addStartingSubtask(reminderId: string, title: string): Subtask {
    const current = this.require(reminderId);
    const subtask: Subtask = { id: newId("sub"), title: requireTitle(title), done: false };
    this.items.set(reminderId, { ...current, subtasks: [...current.subtasks, subtask], updatedAt: nowIso(this.clock) });
    return structuredClone(subtask);
  }

  toggleSubtask(reminderId: string, subtaskId: string): Subtask {
    const current = this.require(reminderId);
    const target = current.subtasks.find((sub) => sub.id === subtaskId);
    if (!target) throw new Error(`no subtask: ${subtaskId}`);
    const next = {
      ...current,
      subtasks: current.subtasks.map((sub) =>
        sub.id === subtaskId ? { ...sub, done: !sub.done } : sub,
      ),
      updatedAt: nowIso(this.clock),
    };
    this.items.set(reminderId, next);
    return structuredClone(next.subtasks.find((sub) => sub.id === subtaskId)!);
  }

  delete(reminderId: string): boolean {
    this.require(reminderId);
    this.items.delete(reminderId);
    this.ledger.append({ type: "reminders.deleted", actor: "reminders", subject: reminderId, data: {} });
    return true;
  }

  overdue(now: Date = this.clock()): Reminder[] {
    const at = now.toISOString();
    return [...this.items.values()]
      .filter((item) => item.completedAt === null && item.dueAt !== null && item.dueAt < at)
      .sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""))
      .map((item) => structuredClone(item));
  }

  dueSoon(withinHours: number, now: Date = this.clock()): Reminder[] {
    if (!Number.isFinite(withinHours) || withinHours <= 0) {
      throw new Error("withinHours must be a positive number");
    }
    const start = now.getTime();
    const end = start + withinHours * 3_600_000;
    return [...this.items.values()]
      .filter((item) => {
        if (item.completedAt !== null || item.dueAt === null) return false;
        const due = Date.parse(item.dueAt);
        return due >= start && due <= end;
      })
      .sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""))
      .map((item) => structuredClone(item));
  }

  private require(reminderId: string): Reminder {
    const found = this.items.get(reminderId);
    if (!found) throw new Error(`no reminder: ${reminderId}`);
    return structuredClone(found);
  }
}
