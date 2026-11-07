import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * PDF domain core.
 *
 * A registry of PDF documents with page metadata, annotations and form
 * fields. Rendering and signature crypto are host adapter concerns; this
 * layer models the documents and the marks on them.
 */

export interface PdfDocument {
  id: string;
  title: string;
  author: string;
  pageCount: number;
  fileSizeBytes: number;
  source: string;
  addedAt: string;
}

export interface PdfAnnotation {
  id: string;
  documentId: string;
  page: number;
  kind: "highlight" | "note" | "strike";
  text: string;
  at: string;
}

export interface PdfFormField {
  id: string;
  documentId: string;
  name: string;
  value: string;
  kind: "text" | "checkbox" | "choice";
}

export interface PdfOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class PdfDocuments {
  private readonly documents = new Map<string, PdfDocument>();
  private readonly annotations: PdfAnnotation[] = [];
  private readonly fields = new Map<string, PdfFormField>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: PdfOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addDocument(input: { title: string; author?: string; pageCount: number; fileSizeBytes: number; source: string }): PdfDocument {
    if (typeof input.title !== "string" || input.title.trim().length === 0) {
      throw new Error("a document needs a title");
    }
    if (!Number.isInteger(input.pageCount) || input.pageCount <= 0) {
      throw new Error("pageCount must be a positive integer");
    }
    if (!Number.isInteger(input.fileSizeBytes) || input.fileSizeBytes <= 0) {
      throw new Error("fileSizeBytes must be a positive integer");
    }
    if (typeof input.source !== "string" || input.source.trim().length === 0) {
      throw new Error("a document needs a source");
    }
    const document: PdfDocument = {
      id: newId("pdf"),
      title: input.title.trim(),
      author: (input.author ?? "Unknown").trim() || "Unknown",
      pageCount: input.pageCount,
      fileSizeBytes: input.fileSizeBytes,
      source: input.source.trim(),
      addedAt: nowIso(this.clock),
    };
    this.documents.set(document.id, document);
    this.ledger.append({ type: "pdf.document_added", actor: "pdf", subject: document.id, data: { pages: input.pageCount } });
    return structuredClone(document);
  }

  get(documentId: string): PdfDocument | undefined {
    const found = this.documents.get(documentId);
    return found ? structuredClone(found) : undefined;
  }

  list(): PdfDocument[] {
    return [...this.documents.values()]
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((document) => structuredClone(document));
  }

  totalPages(): number {
    return [...this.documents.values()].reduce((sum, document) => sum + document.pageCount, 0);
  }

  annotate(documentId: string, page: number, kind: "highlight" | "note" | "strike", text: string): PdfAnnotation {
    const document = this.documents.get(documentId);
    if (!document) throw new Error(`no document: ${documentId}`);
    if (!Number.isInteger(page) || page < 1 || page > document.pageCount) {
      throw new Error(`page must be between 1 and ${document.pageCount}`);
    }
    if (!["highlight", "note", "strike"].includes(kind)) {
      throw new Error("kind must be highlight, note or strike");
    }
    if (typeof text !== "string" || text.trim().length === 0) {
      throw new Error("an annotation needs text");
    }
    const annotation: PdfAnnotation = {
      id: newId("ann"),
      documentId,
      page,
      kind,
      text: text.trim(),
      at: nowIso(this.clock),
    };
    this.annotations.push(annotation);
    this.ledger.append({ type: "pdf.annotated", actor: "pdf", subject: documentId, data: { page, kind } });
    return structuredClone(annotation);
  }

  annotationsFor(documentId: string, page?: number): PdfAnnotation[] {
    if (!this.documents.has(documentId)) throw new Error(`no document: ${documentId}`);
    return this.annotations
      .filter((a) => a.documentId === documentId)
      .filter((a) => page === undefined || a.page === page)
      .sort((a, b) => a.page - b.page || a.at.localeCompare(b.at))
      .map((a) => structuredClone(a));
  }

  addField(documentId: string, name: string, kind: "text" | "checkbox" | "choice", value = ""): PdfFormField {
    if (!this.documents.has(documentId)) throw new Error(`no document: ${documentId}`);
    if (typeof name !== "string" || name.trim().length === 0) throw new Error("a field needs a name");
    if (!["text", "checkbox", "choice"].includes(kind)) throw new Error("kind must be text, checkbox or choice");
    const field: PdfFormField = { id: newId("fld"), documentId, name: name.trim(), kind, value };
    this.fields.set(field.id, field);
    return structuredClone(field);
  }

  fillField(fieldId: string, value: string): PdfFormField {
    const field = this.fields.get(fieldId);
    if (!field) throw new Error(`no field: ${fieldId}`);
    field.value = value;
    this.fields.set(fieldId, field);
    this.ledger.append({ type: "pdf.field_filled", actor: "pdf", subject: fieldId, data: { name: field.name } });
    return structuredClone(field);
  }

  fieldsFor(documentId: string): PdfFormField[] {
    if (!this.documents.has(documentId)) throw new Error(`no document: ${documentId}`);
    return [...this.fields.values()].filter((f) => f.documentId === documentId).map((f) => structuredClone(f));
  }

  removeDocument(documentId: string): boolean {
    if (!this.documents.delete(documentId)) return false;
    for (const [id, field] of this.fields) {
      if (field.documentId === documentId) this.fields.delete(id);
    }
    for (let i = this.annotations.length - 1; i >= 0; i -= 1) {
      if (this.annotations[i].documentId === documentId) this.annotations.splice(i, 1);
    }
    this.ledger.append({ type: "pdf.document_removed", actor: "pdf", subject: documentId, data: {} });
    return true;
  }
}
