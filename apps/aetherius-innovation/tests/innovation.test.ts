import { describe, it } from "node:test";
import assert from "node:assert";
import { Innovation } from "../src/domain.ts";

describe("Innovation", () => {
  it("files and lists patents", () => {
    const innovation = new Innovation();
    const patent = innovation.file("Smart Widget", "US");
    assert.equal(patent.jurisdiction, "US");
    assert.equal(innovation.list().length, 1);
  });
});
