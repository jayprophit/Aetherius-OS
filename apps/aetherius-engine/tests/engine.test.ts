import { describe, it } from "node:test";
import assert from "node:assert";
import { Engine } from "../src/domain.ts";

describe("Engine", () => {
  it("loads and lists scenes", () => {
    const engine = new Engine();
    const scene = engine.loadScene("Main", ["player", "camera"]);
    assert.equal(scene.entities.length, 2);
    assert.equal(engine.listScenes().length, 1);
  });
});
