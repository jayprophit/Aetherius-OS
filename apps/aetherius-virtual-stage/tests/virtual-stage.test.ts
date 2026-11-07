import { describe, it } from "node:test";
import assert from "node:assert";
import { VirtualStage } from "../src/domain.ts";

describe("VirtualStage", () => {
  it("creates and lists scenes", () => {
    const stage = new VirtualStage();
    const scene = stage.createScene("Act 1", "main", ["actor-1", "actor-2"]);
    assert.equal(scene.cast.length, 2);
    assert.equal(stage.list().length, 1);
  });
});
