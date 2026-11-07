import { describe, it } from "node:test";
import assert from "node:assert";
import { WearService } from "../src/domain.ts";

describe("WearService", () => {
  it("pairs wearable devices", () => {
    const wear = new WearService();
    const device = wear.pair({ type: "watch", batteryLevel: 85 });
    assert.equal(device.type, "watch");
    assert.equal(wear.getPaired().length, 1);
  });
});
