import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { OnScreenKeyboard } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

const QWERTY = {
  name: "QWERTY",
  rows: [
    ["Q", "W", "E", "R", "T", "Y"].map((label) => ({ label, type: "letter" as const })),
    ["A", "S", "D"].map((label) => ({ label, type: "letter" as const })),
    [{ label: " ", type: "space" as const }, { label: "⌫", type: "backspace" as const }, { label: "⏎", type: "enter" as const }],
  ],
};

describe("OnScreenKeyboard", () => {
  it("types letters, spaces and newlines from the layout", () => {
    const keyboard = new OnScreenKeyboard({ clock: CLOCK, dictionary: ["hello", "help", "world"] });
    keyboard.addLayout(QWERTY);
    keyboard.press("E");
    keyboard.press("R");
    keyboard.press(" ");
    assert.equal(keyboard.outputText(), "ER ");
    keyboard.press("⏎");
    assert.equal(keyboard.outputText(), "ER \n");
  });

  it("deletes with backspace and ignores modifier keys", () => {
    const keyboard = new OnScreenKeyboard({ clock: CLOCK });
    keyboard.addLayout(QWERTY);
    keyboard.press("Q");
    keyboard.press("⌫");
    assert.equal(keyboard.outputText(), "");
    keyboard.clearOutput();
    keyboard.press(" ");
    assert.equal(keyboard.outputText(), " ");
  });

  it("switches layouts and themes", () => {
    const keyboard = new OnScreenKeyboard({ clock: CLOCK });
    keyboard.addLayout(QWERTY);
    const alt = keyboard.addLayout({ name: "Alt", language: "de", rows: [[{ label: "X", type: "letter" as const }]] });
    keyboard.setActiveLayout(alt.id);
    keyboard.press("X");
    assert.equal(keyboard.outputText(), "X");
    const theme = keyboard.addTheme({ name: "Dark", dark: true });
    keyboard.setActiveTheme(theme.id);
    assert.equal(keyboard.layoutsList().length, 2);
    assert.throws(() => keyboard.setActiveLayout("missing"), /no layout/);
    assert.throws(() => keyboard.setActiveTheme("missing"), /no theme/);
    assert.throws(() => keyboard.press("Z"), /no key/);
  });

  it("validates layouts and keys", () => {
    const keyboard = new OnScreenKeyboard({ clock: CLOCK });
    assert.throws(() => keyboard.addLayout({ name: "", rows: [[{ label: "A", type: "letter" }]] }), /needs a name/);
    assert.throws(() => keyboard.addLayout({ name: "Bad", rows: [] }), /at least one row/);
    assert.throws(
      () => keyboard.addLayout({ name: "Bad", rows: [[{ label: "A", type: "emoji" as never }]] }),
      /key type must be/,
    );
    assert.throws(() => keyboard.press("A"), /no active layout/);
  });
});
