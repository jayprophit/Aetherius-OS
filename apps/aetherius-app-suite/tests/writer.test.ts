import { test } from "node:test";
import assert from "node:assert/strict";
import { WriterApp } from "../src/writer.ts";

test("writer creates, updates, deletes and exports markdown", () => {
  const writer = new WriterApp();
  const doc = writer.create({ title: "Hello" });
  assert.strictEqual(doc.id.startsWith("doc"), true);
  assert.strictEqual(doc.title, "Hello");

  const updated = writer.update(doc.id, { title: "World" });
  assert.strictEqual(updated.title, "World");
  assert.strictEqual(updated.version, 2);

  const edited = writer.editor(doc.id);
  edited.append("paragraph", "A paragraph.");
  writer.commit(doc.id, edited);

  const committed = writer.get(doc.id);
  assert.strictEqual(committed!.version, 3);

  const md = writer.toMarkdown(doc.id);
  assert.strictEqual(typeof md, "string");
  assert.strictEqual(md.includes("A paragraph."), true);

  assert.strictEqual(writer.delete(doc.id), true);
  assert.strictEqual(writer.get(doc.id), undefined);
});
