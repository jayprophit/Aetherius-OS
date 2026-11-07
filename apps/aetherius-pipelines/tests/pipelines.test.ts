import { describe, it } from "node:test";
import assert from "node:assert";
import { Pipelines } from "../src/domain.ts";

describe("Pipelines", () => {
  it("creates and lists pipelines", () => {
    const pipelines = new Pipelines();
    const pipeline = pipelines.create("CI", ["build", "test", "deploy"]);
    assert.equal(pipeline.stages.length, 3);
    assert.equal(pipelines.list().length, 1);
  });
});
