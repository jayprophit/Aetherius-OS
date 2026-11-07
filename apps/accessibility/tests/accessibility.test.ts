import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { Accessibility } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("Accessibility", () => {
  it("applies text scale, contrast and motion settings", () => {
    const settings = new Accessibility({ clock: CLOCK });
    settings.setTextScale(1.5);
    settings.setContrast("high");
    settings.setMotion("reduced");
    const current = settings.getSettings();
    assert.equal(current.textScale, 1.5);
    assert.equal(current.contrast, "high");
    assert.equal(current.motion, "reduced");
    assert.throws(() => settings.setTextScale(4), /between 0.5 and 3/);
    assert.throws(() => settings.setContrast("ultra" as never), /must be one of/);
    assert.throws(() => settings.setMotion("paused" as never), /must be one of/);
  });

  it("toggles screen-reader announcement and keyboard navigation", () => {
    const settings = new Accessibility({ clock: CLOCK });
    assert.equal(settings.getSettings().screenReaderAnnounce, false);
    settings.setScreenReaderAnnounce(true);
    settings.setKeyboardNavigation(true);
    assert.equal(settings.getSettings().screenReaderAnnounce, true);
    assert.equal(settings.getSettings().keyboardNavigation, true);
  });

  it("queues announcements by priority", () => {
    const settings = new Accessibility({ clock: CLOCK });
    const first = settings.announce("File saved", "polite");
    settings.announce("Disk full", "assertive");
    assert.equal(settings.announcementsFor().length, 2);
    assert.equal(settings.announcementsFor("assertive")[0].priority, "assertive");
    assert.equal(first.priority, "polite");
    settings.clearAnnouncements();
    assert.equal(settings.announcementsFor().length, 0);
    assert.throws(() => settings.announce(""), /needs a message/);
  });
});
