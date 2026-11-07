import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AppLauncher } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("AppLauncher", () => {
  it("registers, pins, launches and searches applications", () => {
    const launcher = new AppLauncher({ clock: CLOCK });
    const notes = launcher.register("Notes", "Productivity");
    launcher.register("Terminal", "System");
    launcher.pin(notes.id);
    launcher.launch(notes.id);
    launcher.launch(notes.id);

    assert.deepEqual(launcher.list().map((app) => app.name), ["Notes", "Terminal"]);
    assert.deepEqual(launcher.search("term").map((app) => app.name), ["Terminal"]);
    assert.deepEqual(launcher.search("system").map((app) => app.name), ["Terminal"]);
    assert.deepEqual(launcher.categories(), ["Productivity", "System"]);
    assert.equal(launcher.recent()[0].id, notes.id);
    assert.equal(launcher.recent()[0].launchCount, 2);
  });

  it("validates input and missing applications", () => {
    const launcher = new AppLauncher({ clock: CLOCK });
    assert.throws(() => launcher.register("", "Cat"), /needs a name/);
    assert.throws(() => launcher.launch("missing"), /no app/);
    assert.throws(() => launcher.recent(0), /limit must be/);
    assert.deepEqual(launcher.recent(), []);
  });
});
