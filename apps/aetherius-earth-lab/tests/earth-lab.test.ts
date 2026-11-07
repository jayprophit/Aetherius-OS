import { describe, it } from "node:test";
import assert from "node:assert";
import { EarthLab } from "../src/domain.ts";

describe("EarthLab", () => {
  it("observes and lists observations", () => {
    const earthLab = new EarthLab();
    const observation = earthLab.observe("Amazon", "NDVI", "2026-10-01");
    assert.equal(observation.band, "NDVI");
    assert.equal(earthLab.list().length, 1);
  });
});
