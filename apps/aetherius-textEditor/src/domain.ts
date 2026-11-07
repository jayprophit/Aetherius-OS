import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Text Editor domain core.
 *
 * Documents with buffers, word/line/character statistics, find/replace and
 * an outline derived from markdown headings. Syntax highlighting and file
 * IO are host adapter concerns.
 */

export interface EditorDocument {
  id: string;
  title: string;
  text: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface TextStats {
  words: number;
  characters: number;
  lines: number;
}

export interface OutlineEntry {
  title: string;
  level: number;
}

export interface EditorOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class TextEditor {
  private readonly documents = new Map<string, EditorDocument>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: EditorOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(title: string, text: string, language = "text"): EditorDocument {
    if (typeof title !== "string" || title.trim().length === 0) {
      throw new Error("a document needs a title");
    }
    if (typeof text !== "string") throw new Error("text must be a string");
    const document: EditorDocument = {
      id: newId("doc"),
      title: title.trim(),
      text,
      language: language.trim() || "text",
      createdAt: nowIso(this.clock),
      updatedAt: nowIso(this.clock),
    };
    this.documents.set(document.id, document);
    this.ledger.append({ type: "editor.document_created", actor: "editor", subject: document.id, data: { language: document.language } });
    return structuredClone(document);
  }

  get(documentId: string): EditorDocument | undefined {
    const found = this.documents.get(documentId);
    return found ? structuredClone(found) : undefined;
  }

  update(documentId: string, patch: { title?: string; text?: string; language?: string }): EditorDocument {
    const current = this.require(documentId);
    const next: EditorDocument = {
      ...current,
      title: patch.title !== undefined ? patch.title.trim() || current.title : current.title,
      text: patch.text ?? current.text,
      language: patch.language !== undefined && patch.language.trim() ? patch.language.trim() : current.language,
      updatedAt: nowIso(this.clock),
    };
    this.documents.set(documentId, next);
    return structuredClone(next);
  }

  stats(documentId: string): TextStats {
    const document = this.require(documentId);
    const words = document.text.split(/\s+/).filter(Boolean).length;
    return {
      words,
      characters: document.text.length,
      lines: document.text.length === 0 ? 0 : document.text.split(/\r?\n/).length,
    };
  }

  find(documentId: string, query: string, caseSensitive = false): Array<{ line: number; text: string }> {
    const document = this.require(documentId);
    if (typeof query !== "string" || query.length === 0) throw new Error("find needs a query");
    const needle = caseSensitive ? query : query.toLowerCase();
    return document.text
      .split(/\r?\n/)
      .map((line, index) => ({ line: index + 1, text: line, hit: caseSensitive ? line.includes(query) : line.toLowerCase().includes(needle) }))
      .filter((entry) => entry.hit)
      .map(({ line, text }) => ({ line, text }));
  }

  replaceAll(documentId: string, from: string, to: string, caseSensitive = false): number {
    const current = this.require(documentId);
    if (typeof from !== "string" || from.length === 0) throw new Error("replace needs a non-empty search");
    const count = countOccurrences(current.text, from, caseSensitive);
    const nextText = caseSensitive
      ? current.text.split(from).join(to)
      : current.text.replace(new RegExp(escapeRegExp(from), "gi"), to);
    this.documents.set(documentId, { ...current, text: nextText, updatedAt: nowIso(this.clock) });
    this.ledger.append({ type: "editor.replaced", actor: "editor", subject: documentId, data: { count } });
    return count;
  }

  outline(documentId: string): OutlineEntry[] {
    const document = this.require(documentId);
    return document.text
      .split(/\r?\n/)
      .map((line) => /^(#{1,6})\s+(.+)$/.exec(line))
      .filter((match): match is RegExpExecArray => match !== null)
      .map((match) => ({ title: match[2].trim(), level: match[1].length }));
  }

  list(): EditorDocument[] {
    return [...this.documents.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((document) => structuredClone(document));
  }

  delete(documentId: string): boolean {
    if (!this.documents.delete(documentId)) return false;
    this.ledger.append({ type: "editor.document_deleted", actor: "editor", subject: documentId, data: {} });
    return true;
  }

  private require(documentId: string): EditorDocument {
    const found = this.documents.get(documentId);
    if (!found) throw new Error(`no document: ${documentId}`);
    return structuredClone(found);
  }
}

function countOccurrences(text: string, needle: string, caseSensitive: boolean): number {
  const haystack = caseSensitive ? text : text.toLowerCase();
  const target = caseSensitive ? needle : needle.toLowerCase();
  let count = 0;
  let index = haystack.indexOf(target);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(target, index + target.length);
  }
  return count;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
