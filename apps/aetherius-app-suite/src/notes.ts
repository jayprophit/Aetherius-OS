import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Notes core.
 *
 * A real document service: create, edit, tag, pin, archive, search and keep a
 * full revision history. It stores text in memory; it does not claim a rich
 * text editor, encryption at rest or a sync server.
 */

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteRevision {
  noteId: string;
  version: number;
  title: string;
  body: string;
  tags: string[];
  at: string;
}

export interface CreateNoteInput {
  title?: string;
  body: string;
  tags?: string[];
  pinned?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  body?: string;
  tags?: string[];
  pinned?: boolean;
  archived?: boolean;
}

export interface NoteOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class NotesApp {
  private readonly notes = new Map<string, Note>();
  private readonly revisions = new Map<string, NoteRevision[]>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: NoteOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(input: CreateNoteInput): Note {
    if (typeof input.body !== "string") throw new Error("a note needs a body");
    const at = nowIso(this.clock);
    const note: Note = {
      id: newId("note"),
      title: input.title?.trim() || deriveTitle(input.body),
      body: input.body,
      tags: normaliseTags(input.tags ?? []),
      pinned: input.pinned === true,
      archived: false,
      version: 1,
      createdAt: at,
      updatedAt: at,
    };
    this.notes.set(note.id, note);
    this.revisions.set(note.id, [snapshot(note)]);
    this.ledger.append({ type: "notes.created", actor: "notes", subject: note.id, data: { version: 1 } });
    return structuredClone(note);
  }

  update(noteId: string, patch: UpdateNoteInput): Note {
    const current = this.require(noteId);
    const next: Note = {
      ...current,
      title: patch.title !== undefined ? patch.title.trim() || deriveTitle(patch.body ?? current.body) : current.title,
      body: patch.body ?? current.body,
      tags: patch.tags ? normaliseTags(patch.tags) : current.tags,
      pinned: patch.pinned ?? current.pinned,
      archived: patch.archived ?? current.archived,
      version: current.version + 1,
      updatedAt: nowIso(this.clock),
    };
    this.notes.set(noteId, next);
    this.revisions.get(noteId)!.push(snapshot(next));
    this.ledger.append({
      type: "notes.updated",
      actor: "notes",
      subject: noteId,
      data: { version: next.version, fields: Object.keys(patch).sort() },
    });
    return structuredClone(next);
  }

  get(noteId: string): Note | undefined {
    const note = this.notes.get(noteId);
    return note ? structuredClone(note) : undefined;
  }

  delete(noteId: string): boolean {
    this.require(noteId);
    this.notes.delete(noteId);
    this.revisions.delete(noteId);
    this.ledger.append({ type: "notes.deleted", actor: "notes", subject: noteId, data: {} });
    return true;
  }

  list(options: { tag?: string; includeArchived?: boolean } = {}): Note[] {
    const tag = options.tag?.trim().toLowerCase();
    return [...this.notes.values()]
      .filter((note) => options.includeArchived === true || !note.archived)
      .filter((note) => tag === undefined || note.tags.includes(tag))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt) || a.title.localeCompare(b.title))
      .map((note) => structuredClone(note));
  }

  search(query: string, limit = 20): Note[] {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error(`limit is out of range: ${limit}`);
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    return [...this.notes.values()]
      .filter((note) => !note.archived)
      .map((note) => {
        const haystack = `${note.title}\n${note.body}\n${note.tags.join(" ")}`.toLowerCase();
        return { note, score: terms.filter((term) => haystack.includes(term)).length };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || b.note.updatedAt.localeCompare(a.note.updatedAt))
      .slice(0, limit)
      .map((entry) => structuredClone(entry.note));
  }

  history(noteId: string): NoteRevision[] {
    this.require(noteId);
    return this.revisions.get(noteId)!.map((revision) => structuredClone(revision));
  }

  restore(noteId: string, version: number): Note {
    const revisions = this.revisions.get(noteId);
    if (!revisions) throw new Error(`no note: ${noteId}`);
    const revision = revisions.find((candidate) => candidate.version === version);
    if (!revision) throw new Error(`no revision ${version} for note ${noteId}`);
    return this.update(noteId, { title: revision.title, body: revision.body, tags: revision.tags });
  }

  private require(noteId: string): Note {
    const note = this.notes.get(noteId);
    if (!note) throw new Error(`no note: ${noteId}`);
    return structuredClone(note);
  }
}

function deriveTitle(body: string): string {
  const firstLine = body.split(/\r?\n/).find((line) => line.trim())?.trim() ?? "";
  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine || "Untitled note";
}

function normaliseTags(tags: readonly string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].sort();
}

function snapshot(note: Note): NoteRevision {
  return {
    noteId: note.id,
    version: note.version,
    title: note.title,
    body: note.body,
    tags: [...note.tags],
    at: note.updatedAt,
  };
}
