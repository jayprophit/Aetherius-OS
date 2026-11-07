import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { PdfDocuments } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("PdfDocuments", () => {
  it("adds a document and totals its pages", () => {
    const pdf = new PdfDocuments({ clock: CLOCK });
    const guide = pdf.addDocument({ title: "Guide", author: "A", pageCount: 120, fileSizeBytes: 1_000_000, source: "file:///guide.pdf" });
    pdf.addDocument({ title: "Manual", pageCount: 40, fileSizeBytes: 400_000, source: "file:///manual.pdf" });
    assert.equal(guide.pageCount, 120);
    assert.equal(pdf.totalPages(), 160);
    assert.deepEqual(pdf.list().map((d) => d.title), ["Guide", "Manual"]);
  });

  it("validates document metadata", () => {
    const pdf = new PdfDocuments({ clock: CLOCK });
    assert.throws(() => pdf.addDocument({ title: "", pageCount: 1, fileSizeBytes: 1, source: "x" }), /needs a title/);
    assert.throws(() => pdf.addDocument({ title: "x", pageCount: 0, fileSizeBytes: 1, source: "x" }), /pageCount must be/);
    assert.throws(() => pdf.addDocument({ title: "x", pageCount: 1, fileSizeBytes: -1, source: "x" }), /fileSizeBytes must be/);
  });

  it("annotates pages and filters by page", () => {
    const pdf = new PdfDocuments({ clock: CLOCK });
    const doc = pdf.addDocument({ title: "Doc", pageCount: 10, fileSizeBytes: 100, source: "x" });
    pdf.annotate(doc.id, 3, "highlight", "key section");
    pdf.annotate(doc.id, 3, "note", "check this");
    pdf.annotate(doc.id, 7, "strike", "outdated");
    assert.equal(pdf.annotationsFor(doc.id).length, 3);
    assert.equal(pdf.annotationsFor(doc.id, 3).length, 2);
    assert.throws(() => pdf.annotate(doc.id, 11, "note", "too far"), /page must be between 1 and 10/);
    assert.throws(() => pdf.annotate("missing", 1, "note", "x"), /no document/);
  });

  it("fills form fields and removes documents with their marks", () => {
    const pdf = new PdfDocuments({ clock: CLOCK });
    const doc = pdf.addDocument({ title: "Form", pageCount: 2, fileSizeBytes: 50, source: "x" });
    const field = pdf.addField(doc.id, "full-name", "text");
    pdf.fillField(field.id, "Jonathan Powell");
    assert.equal(pdf.fieldsFor(doc.id)[0].value, "Jonathan Powell");
    pdf.annotate(doc.id, 1, "note", "to keep");
    assert.equal(pdf.removeDocument(doc.id), true);
    assert.equal(pdf.get(doc.id), undefined);
    assert.equal(pdf.removeDocument(doc.id), false);
  });
});
