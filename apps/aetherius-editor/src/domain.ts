import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface EditorBuffer {
  id: string;
  name: string;
  content: string;
  language: string;
}

export interface EditorOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Editor {
  private readonly buffers = new Map<string, EditorBuffer>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: EditorOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  open(name: string, content = "", language = "plaintext"): EditorBuffer {
    const buffer: EditorBuffer = { id: newId("buffer"), name, content, language };
    this.buffers.set(buffer.id, buffer);
    this.ledger.append({ type: "editor.opened", actor: "editor", subject: buffer.id });
    return buffer;
  }

  update(id: string, content: string): EditorBuffer {
    const buffer = this.buffers.get(id);
    if (!buffer) throw new Error("buffer not found");
    buffer.content = content;
    this.ledger.append({ type: "editor.updated", actor: "editor", subject: id });
    return buffer;
  }

  list(): EditorBuffer[] {
    return Array.from(this.buffers.values());
  }
}
