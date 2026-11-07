import { describe, it } from "node:test";
import assert from "node:assert";
import { DeviceManager } from "../src/domain.ts";

describe("DeviceManager", () => {
  it("registers and lists devices", () => {
    const dm = new DeviceManager();
    const device = dm.register({ name: "Printer", type: "printer", status: "connected" });
    assert.equal(dm.list().length, 1);
    assert.equal(device.status, "connected");
  });
});
