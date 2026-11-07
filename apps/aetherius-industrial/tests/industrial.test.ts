import { describe, it } from "node:test";
import assert from "node:assert";
import { Industrial } from "../src/domain.ts";

describe("Industrial", () => {
  it("registers and lists devices", () => {
    const industrial = new Industrial();
    const device = industrial.register("PLC-01", "modbus");
    assert.equal(device.protocol, "modbus");
    assert.equal(industrial.list().length, 1);
  });
});
