import { describe, it } from "node:test";
import assert from "node:assert";
import { ComputeService } from "../src/domain.ts";

describe("ComputeService", () => {
  it("runs containers", () => {
    const compute = new ComputeService();
    const container = compute.run("alpine:latest");
    assert.equal(container.status, "running");
    assert.equal(compute.list().length, 1);
  });
});
