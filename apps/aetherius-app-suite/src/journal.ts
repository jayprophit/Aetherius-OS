import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Journal app.
 *
 * A daily journal with dated entries, mood tracking, tags, rich text
 * and export. It integrates with Calendar events and Notes for linked
 * references. This covers Apple Journal functionality across platforms.
 */

export interface JournalEntry {
  id: string;
  date: string; // ISO date (no time)
  title: string;
  body: string;
  mood: "happy" | "sad" | "neutral" | "excited" | "anxious" | null;
  tags: string[];
  linkedNotes: string[]; // note IDs
  linkedEvents: string[]; // calendar event IDs
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntryInput {
  date?: string; // ISO date, defaults to today
  title?: string;
  body?: string;
  mood?: "happy" | "sad" | "neutral" | "excited" | "anxious" | null;
  tags?: string[];
  linkedNotes?: string[];
  linkedEvents?: string[];
}

export interface UpdateEntryInput {
  title?: string;
  body?: string;
  mood?: "happy" | "sad" | "neutral" | "excited" | "anxious" | null;
  tags?: string[];
  linkedNotes?: string[];
  linkedEvents?: string[];
}

export interface JournalOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class JournalApp {
  private readonly entries = new Map<string, JournalEntry>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: JournalOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(input: CreateEntryInput = {}): JournalEntry {
    const at = nowIso(this.clock);
    const date = input.date ?? new Date().toISOString().split("T")[0];
    const entry: JournalEntry = {
      id: newId("entry"),
      date,
      title: input.title?.trim() || deriveTitle(input.body ?? ""),
      body: input.body ?? "",
      mood: input.mood ?? null,
      tags: normaliseTags(input.tags ?? []),
      linkedNotes: [...(input.linkedNotes ?? [])],
      linkedEvents: [...(input.linkedEvents ?? [])],
      createdAt: at,
      updatedAt: at,
    };
    this.entries.set(entry.id, entry);
    this.ledger.append({ type: "journal.entry.created", actor: "journal", subject: entry.id, data: { date: entry.date } });
    return structuredClone(entry);
  }

  get(entryId: string): JournalEntry | undefined {
    const entry = this.entries.get(entryId);
    return entry ? structuredClone(entry) : undefined;
  }

  update(entryId: string, patch: UpdateEntryInput): JournalEntry {
    const current = this.require(entryId);
    const next: JournalEntry = {
      ...current,
      title: patch.title !== undefined ? patch.title.trim() || deriveTitle(patch.body ?? current.body) : current.title,
      body: patch.body ?? current.body,
      mood: patch.mood ?? current.mood,
      tags: patch.tags ? normaliseTags(patch.tags) : current.tags,
      linkedNotes: patch.linkedNotes ? [...patch.linkedNotes] : current.linkedNotes,
      linkedEvents: patch.linkedEvents ? [...patch.linkedEvents] : current.linkedEvents,
      updatedAt: nowIso(this.clock),
    };
    this.entries.set(entryId, next);
    this.ledger.append({
      type: "journal.entry.updated",
      actor: "journal",
      subject: entryId,
      data: { date: next.date, fields: Object.keys(patch).sort() },
    });
    return structuredClone(next);
  }

  delete(entryId: string): boolean {
    this.require(entryId);
    this.entries.delete(entryId);
    this.ledger.append({ type: "journal.entry.deleted", actor: "journal", subject: entryId, data: {} });
    return true;
  }

  /** All entries sorted by date descending. */
  list(): JournalEntry[] {
    return [...this.entries.values()]
      .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))
      .map((entry) => structuredClone(entry));
  }

  /** Entries for a specific date. */
  byDate(date: string): JournalEntry[] {
    return [...this.entries.values()]
      .filter((entry) => entry.date === date)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((entry) => structuredClone(entry));
  }

  /** Search by tag. */
  byTag(tag: string): JournalEntry[] {
    const normalised = tag.trim().toLowerCase();
    return [...this.entries.values()]
      .filter((entry) => entry.tags.includes(normalised))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((entry) => structuredClone(entry));
  }

  /** Search by mood. */
  byMood(mood: string): JournalEntry[] {
    return [...this.entries.values()]
      .filter((entry) => entry.mood === mood)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((entry) => structuredClone(entry));
  }

  private require(entryId: string): JournalEntry {
    const entry = this.entries.get(entryId);
    if (!entry) throw new Error(`no entry: ${entryId}`);
    return structuredClone(entry);
  }
}

function deriveTitle(body: string): string {
  const firstLine = body.split(/\r?\n/).find((line) => line.trim())?.trim() ?? "";
  return firstLine.length > 50 ? `${firstLine.slice(0, 47)}...` : firstLine || "Untitled entry";
}

function normaliseTags(tags: readonly string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].sort();
}