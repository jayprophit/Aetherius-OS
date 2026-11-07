import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Document {
  id: string;
  title: string;
  format: "pdf" | "docx" | "txt";
  pageCount: number;
}

export interface DocumentsOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Documents {
  private readonly documents = new Map<string, Document>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: DocumentsOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(title: string, format: Document["format"], pageCount: number): Document {
    const document: Document = { id: newId("document"), title, format, pageCount };
    this.documents.set(document.id, document);
    this.ledger.append({ type: "documents.created", actor: "documents", subject: document.id });
    return document;
  }

  list(): Document[] {
    return Array.from(this.documents.values());
  }
}
