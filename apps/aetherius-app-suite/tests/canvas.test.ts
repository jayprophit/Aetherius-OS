import { test } from "node:test";
import assert from "node:assert/strict";
import { CanvasApp } from "../src/canvas.ts";

test("canvas creates document, adds elements and exports SVG", () => {
  const canvas = new CanvasApp();
  const doc = canvas.create({ title: "Sketch" });
  const stroke = canvas.addElement(doc.id, {
    kind: "line",
    points: [{ x: 10, y: 10 }, { x: 100, y: 100 }],
    color: "red",
    strokeWidth: 2,
  });

  assert.strictEqual(stroke.kind, "line");
  assert.strictEqual(stroke.points.length, 2);
  assert.strictEqual(stroke.color, "red");

  const svg = canvas.toSvg(doc.id);
  assert.strictEqual(svg.includes("<path"), true);
  assert.strictEqual(svg.includes("M10,10"), true);
  assert.strictEqual(svg.includes("L100,100"), true);

  assert.strictEqual(canvas.delete(doc.id), true);
});