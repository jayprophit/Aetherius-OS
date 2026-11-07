import { describe, it } from "node:test";
import assert from "node:assert";
import { DriveService } from "../src/domain.ts";

describe("DriveService", () => {
  it("registers vehicles", () => {
    const drive = new DriveService();
    const vehicle = drive.registerVehicle("Toyota", "Corolla", 2023);
    assert.equal(vehicle.make, "Toyota");
    assert.equal(drive.getVehicle(vehicle.id)?.model, "Corolla");
  });
});
