import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { Screenshots } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("Screenshots", () => {
  it("captures regions and windows with metadata", () => {
    const shots = new Screenshots({ clock: CLOCK });
    const region = shots.capture({ scope: "region", format: "png", width: 800, height: 600, timerSeconds: 5 });
    const full = shots.capture({ scope: "screen", width: 3840, height: 2160 });
    assert.equal(region.scope, "region");
    assert.equal(region.timerSeconds, 5);
    assert.deepEqual(new Set(shots.list().map((s) => s.id)), new Set([full.id, region.id]));
    assert.deepEqual(shots.list("region").map((s) => s.id), [region.id]);
  });

  it("validates capture input", () => {
    const shots = new Screenshots({ clock: CLOCK });
    assert.throws(() => shots.capture({ scope: "webcam" as never, width: 10, height: 10 }), /scope must be/);
    assert.throws(() => shots.capture({ format: "gif" as never, width: 10, height: 10 }), /format must be/);
    assert.throws(() => shots.capture({ width: 0, height: 10 }), /width must be/);
    assert.throws(() => shots.capture({ width: 10, height: 10, timerSeconds: 61 }), /timerSeconds/);
  });

  it("annotates captures and deletes them", () => {
    const shots = new Screenshots({ clock: CLOCK });
    const shot = shots.capture({ width: 100, height: 100 });
    shots.annotate(shot.id, "arrow points here");
    assert.deepEqual(shots.get(shot.id)?.annotations, ["arrow points here"]);
    assert.throws(() => shots.annotate(shot.id, ""), /needs text/);
    assert.equal(shots.delete(shot.id), true);
    assert.equal(shots.delete(shot.id), false);
  });
});
