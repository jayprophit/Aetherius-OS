import { test } from "node:test";
import assert from "node:assert/strict";
import { SlidesApp } from "../src/slides.ts";

test("slides creates deck, adds slides and exports outline", () => {
  const slides = new SlidesApp();
  const deck = slides.create({ title: "Overview" });
  assert.strictEqual(deck.id.startsWith("deck"), true);

  const session = slides.session(deck.id);
  session.addSlide("Intro");
  session.addSlide("Details");
  const outline = session.toOutline();
  assert.strictEqual(outline.includes("Intro"), true);

  const committed = slides.commit(deck.id);
  assert.strictEqual(committed.version, 2);
  assert.strictEqual(committed.slides.length, 2);

  assert.strictEqual(slides.delete(deck.id), true);
});