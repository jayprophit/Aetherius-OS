import { describe, it } from "node:test";
import assert from "node:assert";
import { ComputeNotebook } from "../src/domain.ts";

describe("ComputeNotebook", () => {
  it("adds and lists cells", () => {
    const notebook = new ComputeNotebook();
    const code = notebook.addCell("code", "print('hello')");
    const markdown = notebook.addCell("markdown", "# Title");
    assert.equal(code.type, "code");
    assert.equal(notebook.listCells().length, 2);
  });
});
