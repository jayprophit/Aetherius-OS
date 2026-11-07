import { describe, it } from "node:test";
import assert from "node:assert";
import { Writer } from "../src/domain.ts";
import { existsSync, rmSync } from "node:fs";

describe("Writer", () => {
  const testDir = "test-writer-data";

  it("creates a document and appends blocks", () => {
    const writer = new Writer({ storageDir: testDir });
    const doc = writer.create("My Doc");
    assert.equal(doc.title, "My Doc");
    assert.equal(doc.revision, 0);

    writer.append(doc.id, "heading", "Title", 1);
    writer.append(doc.id, "paragraph", "Hello world");
    assert.equal(writer.listDocuments().length, 1);
    assert.equal(writer.plainText(doc.id), "Title\nHello world");
  });

  it("rejects invalid operations", () => {
    const writer = new Writer({ storageDir: testDir });
    const doc = writer.create("Test");
    assert.throws(() => writer.append(doc.id, "heading", "", 1), /a block needs text/);
    assert.throws(() => writer.append(doc.id, "heading", "Bad", 0), /heading level must be between 1 and 6/);
    assert.throws(() => writer.remove(doc.id, "nonexistent"), /block not found/);
    assert.throws(() => writer.update(doc.id, "nonexistent", "text"), /block not found/);
    assert.throws(() => writer.plainText("nonexistent"), /document not found/);
  });

  it("updates and removes blocks with revision tracking", () => {
    const writer = new Writer({ storageDir: testDir });
    const doc = writer.create("Revisions");
    const block = writer.append(doc.id, "paragraph", "Original");
    assert.equal(doc.revision, 1);

    writer.update(doc.id, block.id, "Updated");
    const updated = writer.getDocument(doc.id);
    assert.equal(updated?.blocks[0].text, "Updated");
    assert.equal(updated?.revision, 2);

    writer.remove(doc.id, block.id);
    const afterRemove = writer.getDocument(doc.id);
    assert.equal(afterRemove?.blocks.length, 0);
    assert.equal(afterRemove?.revision, 3);
  });

  it("persists and reloads documents", () => {
    const writer1 = new Writer({ storageDir: testDir });
    const doc = writer1.create("Persistent");
    writer1.append(doc.id, "heading", "Saved", 2);
    writer1.append(doc.id, "bullet", "Item 1");
    const id = doc.id;

    const writer2 = new Writer({ storageDir: testDir });
    writer2.load();
    const recovered = writer2.recover(id);
    assert.ok(recovered, "recovered document should exist");
    assert.equal(recovered?.title, "Persistent");
    assert.equal(recovered?.blocks.length, 2);
    assert.equal(recovered?.revision, 2);
  });

  it("exports markdown", () => {
    const writer = new Writer({ storageDir: testDir });
    const doc = writer.create("MD Export");
    writer.append(doc.id, "heading", "Header", 1);
    writer.append(doc.id, "paragraph", "Text");
    writer.append(doc.id, "bullet", "Item");
    writer.append(doc.id, "code", "const x = 1;");

    const md = writer.markdown(doc.id);
    assert.ok(md.includes("# MD Export"));
    assert.ok(md.includes("# Header"));
    assert.ok(md.includes("- Item"));
    assert.ok(md.includes("```"));
  });

  it("exports html", () => {
    const writer = new Writer({ storageDir: testDir });
    const doc = writer.create("HTML Export");
    writer.append(doc.id, "heading", "Title", 2);
    writer.append(doc.id, "paragraph", "Hello & world");

    const html = writer.html(doc.id);
    assert.ok(html.includes("<h2>Title</h2>"));
    assert.ok(html.includes("<p>Hello &amp; world</p>"));
    assert.ok(html.includes("<!DOCTYPE html>"));
  });

  it("exports json", () => {
    const writer = new Writer({ storageDir: testDir });
    const doc = writer.create("JSON Export");
    writer.append(doc.id, "paragraph", "content");
    const json = writer.json(doc.id);
    const parsed = JSON.parse(json);
    assert.equal(parsed.title, "JSON Export");
    assert.equal(parsed.blocks.length, 1);
  });

  it("returns empty list when storage is empty", () => {
    const emptyDir = "test-writer-empty";
    if (existsSync(emptyDir)) rmSync(emptyDir, { recursive: true });
    const writer = new Writer({ storageDir: emptyDir });
    writer.load();
    assert.equal(writer.listDocuments().length, 0);
    if (existsSync(emptyDir)) rmSync(emptyDir, { recursive: true });
  });
});
