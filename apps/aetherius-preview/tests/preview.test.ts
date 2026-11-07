import { describe, it } from "node:test";
import assert from "node:assert";
import { PreviewService } from "../src/domain.ts";

describe("PreviewService", () => {
  it("registers and lists previews", () => {
    const preview = new PreviewService();
    const doc = preview.register({ format: "pdf", sizeBytes: 2048 });
    assert.equal(doc.format, "pdf");
    assert.equal(preview.list().length, 1);
  });
});
