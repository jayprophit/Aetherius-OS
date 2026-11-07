import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * E-Reader domain core.
 *
 * A library of e-books (EPUB/HTML/PDF sources), reading progress, bookmarks
 * and highlights. Content parsing is a host adapter concern; this layer
 * tracks what is in the library and where the reader is in each book.
 */

export type BookFormat = "epub" | "html" | "pdf" | "txt";

export interface Book {
  id: string;
  title: string;
  author: string;
  format: BookFormat;
  source: string;
  totalPages: number;
  addedAt: string;
}

export interface ReadingProgress {
  bookId: string;
  page: number;
  positionPercent: number;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  bookId: string;
  page: number;
  note: string;
  at: string;
}

export interface Highlight {
  id: string;
  bookId: string;
  page: number;
  text: string;
  at: string;
}

export interface ReaderOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

const FORMATS: BookFormat[] = ["epub", "html", "pdf", "txt"];

export class EReader {
  private readonly books = new Map<string, Book>();
  private readonly progress = new Map<string, ReadingProgress>();
  private readonly bookmarks: Bookmark[] = [];
  private readonly highlights: Highlight[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: ReaderOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addBook(input: { title: string; author?: string; format: string; source: string; totalPages: number }): Book {
    const format = input.format as BookFormat;
    if (!FORMATS.includes(format)) throw new Error(`format must be one of: ${FORMATS.join(", ")}`);
    if (typeof input.title !== "string" || input.title.trim().length === 0) throw new Error("a book needs a title");
    if (typeof input.source !== "string" || input.source.trim().length === 0) throw new Error("a book needs a source");
    if (!Number.isInteger(input.totalPages) || input.totalPages <= 0) throw new Error("totalPages must be a positive integer");
    const book: Book = {
      id: newId("book"),
      title: input.title.trim(),
      author: (input.author ?? "Unknown").trim() || "Unknown",
      format,
      source: input.source.trim(),
      totalPages: input.totalPages,
      addedAt: nowIso(this.clock),
    };
    this.books.set(book.id, book);
    this.ledger.append({ type: "reader.book_added", actor: "reader", subject: book.id, data: { format } });
    return structuredClone(book);
  }

  setProgress(bookId: string, page: number): ReadingProgress {
    const book = this.requireBook(bookId);
    if (!Number.isInteger(page) || page < 1 || page > book.totalPages) {
      throw new Error(`page must be between 1 and ${book.totalPages}`);
    }
    const progress: ReadingProgress = {
      bookId,
      page,
      positionPercent: Math.round((page / book.totalPages) * 100),
      updatedAt: nowIso(this.clock),
    };
    this.progress.set(bookId, progress);
    return structuredClone(progress);
  }

  progressFor(bookId: string): ReadingProgress | null {
    const found = this.progress.get(bookId);
    return found ? structuredClone(found) : null;
  }

  addBookmark(bookId: string, page: number, note = ""): Bookmark {
    const book = this.requireBook(bookId);
    if (!Number.isInteger(page) || page < 1 || page > book.totalPages) {
      throw new Error(`page must be between 1 and ${book.totalPages}`);
    }
    const bookmark: Bookmark = { id: newId("bm"), bookId, page, note, at: nowIso(this.clock) };
    this.bookmarks.push(bookmark);
    return structuredClone(bookmark);
  }

  addHighlight(bookId: string, page: number, text: string): Highlight {
    const book = this.requireBook(bookId);
    if (!Number.isInteger(page) || page < 1 || page > book.totalPages) {
      throw new Error(`page must be between 1 and ${book.totalPages}`);
    }
    if (typeof text !== "string" || text.trim().length === 0) throw new Error("a highlight needs text");
    const highlight: Highlight = { id: newId("hl"), bookId, page, text: text.trim(), at: nowIso(this.clock) };
    this.highlights.push(highlight);
    this.ledger.append({ type: "reader.highlighted", actor: "reader", subject: bookId, data: { page } });
    return structuredClone(highlight);
  }

  search(query: string): Book[] {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return this.list();
    return [...this.books.values()]
      .filter((book) => book.title.toLowerCase().includes(needle) || book.author.toLowerCase().includes(needle))
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((book) => structuredClone(book));
  }

  list(): Book[] {
    return [...this.books.values()]
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((book) => structuredClone(book));
  }

  removeBook(bookId: string): boolean {
    if (!this.books.delete(bookId)) return false;
    this.progress.delete(bookId);
    for (let i = this.bookmarks.length - 1; i >= 0; i -= 1) {
      if (this.bookmarks[i].bookId === bookId) this.bookmarks.splice(i, 1);
    }
    for (let i = this.highlights.length - 1; i >= 0; i -= 1) {
      if (this.highlights[i].bookId === bookId) this.highlights.splice(i, 1);
    }
    this.ledger.append({ type: "reader.book_removed", actor: "reader", subject: bookId, data: {} });
    return true;
  }

  private requireBook(bookId: string): Book {
    const found = this.books.get(bookId);
    if (!found) throw new Error(`no book: ${bookId}`);
    return structuredClone(found);
  }
}
