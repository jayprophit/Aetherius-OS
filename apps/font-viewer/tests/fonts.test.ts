import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { FontViewer } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("FontViewer", () => {
  it("adds families and tracks install state", () => {
    const fonts = new FontViewer({ clock: CLOCK });
    const family = fonts.addFamily({ name: "Inter", weights: [400, 700, 400], styles: ["normal", "italic"] });
    assert.deepEqual(family.weights, [400, 700]);
    assert.equal(family.installed, false);
    fonts.setInstalled(family.id, true);
    assert.equal(fonts.list()[0].installed, true);
    assert.equal(fonts.list(true).length, 1);
    assert.deepEqual(fonts.search("inte").map((f) => f.name), ["Inter"]);
  });

  it("previews samples and validates input", () => {
    const fonts = new FontViewer({ clock: CLOCK });
    const family = fonts.addFamily({ name: "Atkinson", weights: [400] });
    const preview = fonts.preview(family.id, "The quick brown fox", 24);
    assert.equal(preview.fontSize, 24);
    assert.throws(() => fonts.preview(family.id, "", 12), /sample text/);
    assert.throws(() => fonts.preview(family.id, "x", 0), /fontSize must be/);
    assert.throws(() => fonts.addFamily({ name: "", weights: [400] }), /needs a name/);
    assert.throws(() => fonts.addFamily({ name: "x", weights: [50] }), /valid weight/);
    assert.throws(() => fonts.setInstalled("missing", true), /no font family/);
  });
});
