import { describe, it } from "node:test";
import assert from "node:assert";
import { Editor } from "../src/domain.ts";

describe("Editor", () => {
  it("opens and updates buffers", () => {
    const editor = new Editor();
    const buffer = editor.open("main.ts", "console.log(1);", "typescript");
    assert.equal(buffer.language, "typescript");
    editor.update(buffer.id, "console.log('hello');");
    assert.equal(editor.list()[0].content, "console.log('hello');");
  });

  it("throws on missing buffer", () => {
    const editor = new Editor();
    assert.throws(() => editor.update("nonexistent", "text"), /buffer not found/);
  });
});
