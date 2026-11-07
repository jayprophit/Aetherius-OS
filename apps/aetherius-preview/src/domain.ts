import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface DocumentPreview {
  id: string;
  format: string;
  sizeBytes: number;
  thumbnail?: string;
}

export interface PreviewOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class PreviewService {
  private readonly previews = new Map<string, DocumentPreview>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: PreviewOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  register(preview: Omit<DocumentPreview, "id">): DocumentPreview {
    const p: DocumentPreview = { ...preview, id: newId("preview") };
    this.previews.set(p.id, p);
    this.ledger.append({ type: "preview.registered", actor: "preview", subject: p.id });
    return p;
  }

  list(): DocumentPreview[] {
    return Array.from(this.previews.values());
  }
}
