import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { TextEditor } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("TextEditor", () => {
  it("creates documents and reports statistics", () => {
    const editor = new TextEditor({ clock: CLOCK });
    const doc = editor.create("Notes", "# Title\n\nHello world\nsecond line", "markdown");
    assert.equal(doc.language, "markdown");
    const stats = editor.stats(doc.id);
    assert.deepEqual(stats, { words: 6, characters: doc.text.length, lines: 4 });
    editor.update(doc.id, { text: "replaced" });
    assert.equal(editor.stats(doc.id).words, 1);
  });

  it("finds lines and replaces all occurrences", () => {
    const editor = new TextEditor({ clock: CLOCK });
    const doc = editor.create("Log", "error: disk error\nok\nerror again", "text");
    const hits = editor.find(doc.id, "error");
    assert.deepEqual(hits, [
      { line: 1, text: "error: disk error" },
      { line: 3, text: "error again" },
    ]);
    assert.equal(editor.find(doc.id, "ERROR", true).length, 0);
    assert.equal(editor.find(doc.id, "ERROR").length, 2); // two matching lines, not three occurrences
    const replaced = editor.replaceAll(doc.id, "error", "failure");
    assert.equal(replaced, 3);
    assert.equal(editor.get(doc.id)?.text, "failure: disk failure\nok\nfailure again");
    assert.throws(() => editor.replaceAll(doc.id, "", "x"), /non-empty search/);
  });

  it("derives an outline from markdown headings", () => {
    const editor = new TextEditor({ clock: CLOCK });
    const doc = editor.create("Outline", "# Top\ntext\n## Mid\nmore\n### Deep", "markdown");
    assert.deepEqual(editor.outline(doc.id), [
      { title: "Top", level: 1 },
      { title: "Mid", level: 2 },
      { title: "Deep", level: 3 },
    ]);
    assert.throws(() => editor.create("", "x"), /needs a title/);
    assert.equal(editor.get("missing"), undefined);
    assert.equal(editor.delete(doc.id), true);
    assert.equal(editor.delete(doc.id), false);
  });
});
