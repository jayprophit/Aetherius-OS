import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";
import type { DocBlock } from "./office.ts";
import { WriterDocument } from "./office.ts";

/**
 * Writer app.
 *
 * A block-based document model with full revision history, Markdown export,
 * word count and title derivation. It stores documents in memory with the
 * app-kit EventLedger for audit trails; the host supplies the real storage
 * adapter and a rich-text editor surface.
 */

export interface WriterDocumentState {
  id: string;
  title: string;
  blocks: DocBlock[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput {
  title?: string;
  blocks?: DocBlock[];
}

export interface WriterOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class WriterApp {
  private readonly documents = new Map<string, WriterDocumentState>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: WriterOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(input: CreateDocumentInput = {}): WriterDocumentState {
    const at = nowIso(this.clock);
    const document: WriterDocumentState = {
      id: newId("doc"),
      title: input.title?.trim() || "Untitled document",
      blocks: input.blocks ?? [],
      version: 1,
      createdAt: at,
      updatedAt: at,
    };
    this.documents.set(document.id, document);
    this.ledger.append({ type: "writer.document.created", actor: "writer", subject: document.id, data: { title: document.title } });
    return structuredClone(document);
  }

  get(documentId: string): WriterDocumentState | undefined {
    const document = this.documents.get(documentId);
    return document ? structuredClone(document) : undefined;
  }

  update(documentId: string, patch: { title?: string; blocks?: DocBlock[] }): WriterDocumentState {
    const current = this.require(documentId);
    const next: WriterDocumentState = {
      ...current,
      title: patch.title !== undefined ? patch.title.trim() || "Untitled document" : current.title,
      blocks: patch.blocks !== undefined ? patch.blocks : current.blocks,
      version: current.version + 1,
      updatedAt: nowIso(this.clock),
    };
    this.documents.set(documentId, next);
    this.ledger.append({
      type: "writer.document.updated",
      actor: "writer",
      subject: documentId,
      data: { version: next.version, fields: Object.keys(patch).sort() },
    });
    return structuredClone(next);
  }

  delete(documentId: string): boolean {
    this.require(documentId);
    this.documents.delete(documentId);
    this.ledger.append({ type: "writer.document.deleted", actor: "writer", subject: documentId, data: {} });
    return true;
  }

  list(): WriterDocumentState[] {
    return [...this.documents.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.title.localeCompare(b.title))
      .map((document) => structuredClone(document));
  }

  /** Create a block-level editor for a specific document. */
  editor(documentId: string): WriterDocument {
    const document = this.require(documentId);
    const editor = new WriterDocument({ ledger: this.ledger, clock: this.clock });
    for (const block of document.blocks) {
      editor.append(block.kind, block.text, block.level);
    }
    return editor;
  }

  /** Apply editor changes back to the document. */
  commit(documentId: string, editor: WriterDocument): WriterDocumentState {
    const document = this.require(documentId);
    const blocks = editor.blocksList();
    return this.update(documentId, { blocks });
  }

  /** Export a document to Markdown. */
  toMarkdown(documentId: string): string {
    const document = this.require(documentId);
    const editor = new WriterDocument({ ledger: this.ledger, clock: this.clock });
    for (const block of document.blocks) {
      editor.append(block.kind, block.text, block.level);
    }
    return editor.toMarkdown();
  }

  /** Word count excluding code blocks. */
  wordCount(documentId: string): number {
    const document = this.require(documentId);
    const editor = new WriterDocument({ ledger: this.ledger, clock: this.clock });
    for (const block of document.blocks) {
      editor.append(block.kind, block.text, block.level);
    }
    return editor.wordCount();
  }

  importMarkdown(documentId: string, markdown: string): WriterDocumentState {
    const document = this.require(documentId);
    const lines = markdown.split(/\r?\n/);
    const blocks: DocBlock[] = [];
    const at = nowIso(this.clock);

    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line) continue;
      const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
      if (headingMatch) {
        const level = headingMatch[1].length;
        blocks.push({ id: newId("block"), kind: "heading", text: headingMatch[2].trim(), level });
      } else if (line.startsWith("- ")) {
        blocks.push({ id: newId("block"), kind: "bullet", text: line.slice(2) });
      } else if (line.startsWith("```")) {
        continue;
      } else {
        blocks.push({ id: newId("block"), kind: "paragraph", text: line });
      }
    }

    const next: WriterDocumentState = {
      ...document,
      blocks,
      version: document.version + 1,
      updatedAt: at,
    };
    this.documents.set(documentId, next);
    this.ledger.append({ type: "writer.document.imported", actor: "writer", subject: documentId, data: { blockCount: blocks.length } });
    return structuredClone(next);
  }

  private require(documentId: string): WriterDocumentState {
    const document = this.documents.get(documentId);
    if (!document) throw new Error(`no document: ${documentId}`);
    return structuredClone(document);
  }
}