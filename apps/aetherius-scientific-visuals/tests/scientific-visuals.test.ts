import { describe, it } from "node:test";
import assert from "node:assert";
import { ScientificVisuals } from "../src/domain.ts";

describe("ScientificVisuals", () => {
  it("creates and lists visuals", () => {
    const visuals = new ScientificVisuals();
    const visual = visuals.create("Temperature Map", "plot");
    assert.equal(visual.kind, "plot");
    assert.equal(visuals.list().length, 1);
  });
});
