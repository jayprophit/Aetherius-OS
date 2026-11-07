import { describe, it } from "node:test";
import assert from "node:assert";
import { Energy } from "../src/domain.ts";

describe("Energy", () => {
  it("models and lists energy", () => {
    const energy = new Energy();
    const model = energy.model("Office A", 4500, "solar");
    assert.equal(model.source, "solar");
    assert.equal(energy.list().length, 1);
  });
});
