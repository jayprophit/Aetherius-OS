import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface ClipboardEntry {
  id: string;
  text: string;
  format: "text" | "html" | "image";
}

export interface ClipboardOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Clipboard {
  private readonly history: ClipboardEntry[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: ClipboardOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  copy(text: string, format: ClipboardEntry["format"] = "text"): ClipboardEntry {
    if (!text.trim()) throw new Error("clipboard entry cannot be empty");
    const entry: ClipboardEntry = { id: newId("clip"), text, format };
    this.history.push(entry);
    this.ledger.append({ type: "clipboard.copied", actor: "clipboard", subject: entry.id });
    return entry;
  }

  paste(): ClipboardEntry | undefined {
    return this.history[this.history.length - 1];
  }

  listHistory(): ClipboardEntry[] {
    return [...this.history];
  }
}
