import { describe, it } from "node:test";
import assert from "node:assert";
import { PrintService } from "../src/domain.ts";

describe("PrintService", () => {
  it("submits and lists print jobs", () => {
    const print = new PrintService();
    const job = print.submit("Document", 5);
    assert.equal(job.pages, 5);
    assert.equal(print.list().length, 1);
  });
});
