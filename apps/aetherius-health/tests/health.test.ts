import { describe, it } from "node:test";
import assert from "node:assert";
import { HealthService } from "../src/domain.ts";

describe("HealthService", () => {
  it("records health metrics", () => {
    const health = new HealthService();
    const record = health.record("steps", 5000, "steps");
    assert.equal(record.type, "steps");
    assert.equal(record.value, 5000);
  });

  it("filters by type", () => {
    const health = new HealthService();
    health.record("steps", 5000, "steps");
    health.record("heartRate", 72, "bpm");
    const steps = health.getByType("steps");
    assert.equal(steps.length, 1);
    assert.equal(steps[0].unit, "steps");
  });
});
