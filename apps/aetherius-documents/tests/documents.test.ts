import { describe, it } from "node:test";
import assert from "node:assert";
import { Documents } from "../src/domain.ts";

describe("Documents", () => {
  it("creates and lists documents", () => {
    const docs = new Documents();
    const doc = docs.create("Report", "pdf", 10);
    assert.equal(doc.format, "pdf");
    assert.equal(docs.list().length, 1);
  });
});
