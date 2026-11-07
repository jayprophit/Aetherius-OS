import { describe, it } from "node:test";
import assert from "node:assert";
import { SpatialService } from "../src/domain.ts";

describe("SpatialService", () => {
  it("creates spatial objects", () => {
    const spatial = new SpatialService();
    const obj = spatial.create({ x: 0, y: 1, z: 2 });
    assert.equal(obj.position.z, 2);
    assert.equal(spatial.list().length, 1);
  });
});
