import { describe, it } from "node:test";
import assert from "node:assert";
import { Clipboard } from "../src/domain.ts";

describe("Clipboard", () => {
  it("copies and pastes", () => {
    const clipboard = new Clipboard();
    const entry = clipboard.copy("hello world");
    assert.equal(clipboard.paste()?.text, "hello world");
    assert.equal(entry.format, "text");
  });

  it("tracks history", () => {
    const clipboard = new Clipboard();
    clipboard.copy("first");
    clipboard.copy("second");
    assert.equal(clipboard.listHistory().length, 2);
    assert.equal(clipboard.paste()?.text, "second");
  });

  it("rejects empty copy", () => {
    const clipboard = new Clipboard();
    assert.throws(() => clipboard.copy("   "), /clipboard entry cannot be empty/);
  });
});
