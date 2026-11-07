import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { EReader } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("EReader", () => {
  it("adds books, tracks progress and bookmarks pages", () => {
    const reader = new EReader({ clock: CLOCK });
    const book = reader.addBook({ title: "Notes on Engines", author: "A. Author", format: "epub", source: "file:///engines.epub", totalPages: 200 });
    reader.setProgress(book.id, 50);
    assert.equal(reader.progressFor(book.id)?.positionPercent, 25);
    reader.setProgress(book.id, 200);
    assert.equal(reader.progressFor(book.id)?.positionPercent, 100);
    assert.throws(() => reader.setProgress(book.id, 201), /between 1 and 200/);

    reader.addBookmark(book.id, 42, "key passage");
    reader.addHighlight(book.id, 42, "highlighted text");
    assert.deepEqual(reader.search("engines").map((b) => b.id), [book.id]);
  });

  it("validates input and removes books with their marks", () => {
    const reader = new EReader({ clock: CLOCK });
    assert.throws(() => reader.addBook({ title: "", format: "epub", source: "x", totalPages: 10 }), /needs a title/);
    assert.throws(() => reader.addBook({ title: "x", format: "mobi" as never, source: "x", totalPages: 10 }), /format must be one of/);
    const book = reader.addBook({ title: "Doomed", format: "txt", source: "x", totalPages: 10 });
    assert.equal(reader.removeBook(book.id), true);
    assert.equal(reader.removeBook(book.id), false);
    assert.equal(reader.progressFor(book.id), null);
  });
});
