import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  updatedAt: string;
  createdAt: string;
}

export interface NotesOptions {
  ledger?: EventLedger;
  clock?: () => Date;
  storageDir?: string;
}

export class NotesService {
  private readonly notes = new Map<string, Note>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  private readonly storageDir: string;

  constructor(options: NotesOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.storageDir = options.storageDir ?? "./notes-data";
  }

  create(title: string, body = "", tags: string[] = []): Note {
    const now = nowIso(this.clock);
    const note: Note = {
      id: newId("note"),
      title,
      body,
      tags,
      updatedAt: now,
      createdAt: now,
    };
    this.notes.set(note.id, note);
    this.ledger.append({ type: "notes.created", actor: "notes", subject: note.id });
    this.persist();
    return note;
  }

  update(id: string, body: string): Note {
    const note = this.notes.get(id);
    if (!note) throw new Error("note not found");
    note.body = body;
    note.updatedAt = nowIso(this.clock);
    this.ledger.append({ type: "notes.updated", actor: "notes", subject: id });
    this.persist();
    return note;
  }

  get(id: string): Note | undefined {
    return this.notes.get(id);
  }

  list(): Note[] {
    return Array.from(this.notes.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private persist(): void {
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true });
    }
    const all = Array.from(this.notes.values());
    writeFileSync(`${this.storageDir}/notes.json`, JSON.stringify(all, null, 2));
  }

  load(): void {
    if (!existsSync(this.storageDir)) return;
    const path = `${this.storageDir}/notes.json`;
    if (!existsSync(path)) return;
    const raw = readFileSync(path, "utf8");
    const data: Note[] = JSON.parse(raw);
    this.notes.clear();
    for (const note of data) {
      this.notes.set(note.id, note);
    }
  }

  recover(id: string): Note | undefined {
    return this.notes.get(id);
  }

  export(id: string, format: "json" | "md" = "json"): string {
    const note = this.notes.get(id);
    if (!note) throw new Error("note not found");
    if (format === "md") {
      return `# ${note.title}\n\n${note.body}\n\nTags: ${note.tags.join(", ")}`;
    }
    return JSON.stringify(note, null, 2);
  }
}
