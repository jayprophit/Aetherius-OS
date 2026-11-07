import { describe, it } from "node:test";
import assert from "node:assert";
import { NearbyService } from "../src/domain.ts";

describe("NearbyService", () => {
  it("discovers nearby devices", () => {
    const nearby = new NearbyService();
    const device = nearby.discover({ name: "Phone", type: "phone", distanceM: 5 });
    assert.equal(device.distanceM, 5);
    assert.equal(nearby.getNearby().length, 1);
  });

  it("filters by distance", () => {
    const nearby = new NearbyService();
    nearby.discover({ name: "Near", type: "phone", distanceM: 10 });
    nearby.discover({ name: "Far", type: "laptop", distanceM: 200 });
    assert.equal(nearby.getNearby(50).length, 1);
  });
});
