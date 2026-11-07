import { describe, it } from "node:test";
import assert from "node:assert";
import { Operations } from "../src/domain.ts";

describe("Operations", () => {
  it("raises and lists alerts", () => {
    const ops = new Operations();
    const alert = ops.raise("warning", "High CPU");
    assert.equal(alert.severity, "warning");
    assert.equal(ops.list().length, 1);
  });
});
