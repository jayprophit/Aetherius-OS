import { describe, it } from "node:test";
import assert from "node:assert";
import { MapService, RoutePlanner } from "../src/domain.ts";

describe("MapService", () => {
  it("adds and lists markers", () => {
    const maps = new MapService();
    const marker = maps.addMarker({ lat: 51.5, lng: -0.1 }, "London");
    assert.equal(maps.listMarkers().length, 1);
    assert.equal(marker.label, "London");
  });

  it("removes markers", () => {
    const maps = new MapService();
    const marker = maps.addMarker({ lat: 51.5, lng: -0.1 }, "London");
    maps.removeMarker(marker.id);
    assert.equal(maps.listMarkers().length, 0);
  });

  it("throws on missing marker", () => {
    const maps = new MapService();
    assert.throws(() => maps.removeMarker("nonexistent"), /marker not found/);
  });

  it("retrieves marker by id", () => {
    const maps = new MapService();
    const marker = maps.addMarker({ lat: 51.5, lng: -0.1 }, "London");
    assert.equal(maps.getMarker(marker.id)?.label, "London");
  });
});

describe("RoutePlanner", () => {
  it("plans a route", () => {
    const planner = new RoutePlanner();
    const steps = planner.plan({ lat: 51.5, lng: -0.1 }, { lat: 48.8566, lng: 2.3522 });
    assert.ok(steps.length >= 1);
    assert.ok(steps[0].distanceM > 0);
  });
});
