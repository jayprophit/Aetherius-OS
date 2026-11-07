import { describe, it } from "node:test";
import assert from "node:assert";
import { Canvas } from "../src/domain.ts";
import { existsSync, rmSync } from "node:fs";

describe("Canvas", () => {
  const testDir = "test-canvas-data";

  it("creates board and adds shapes", () => {
    const canvas = new Canvas({ storageDir: testDir });
    const board = canvas.createBoard("Design", 800, 600);
    assert.equal(board.title, "Design");
    assert.equal(board.width, 800);
    assert.equal(board.height, 600);

    const rect = canvas.addShape(board.id, { kind: "rect", x: 10, y: 20, width: 100, height: 50, visible: true, locked: false });
    assert.equal(rect.kind, "rect");
    assert.equal(rect.zIndex, 0);
    assert.equal(canvas.getBoard(board.id)!.shapes.length, 1);
  });

  it("updates and removes shapes with revision tracking", () => {
    const canvas = new Canvas({ storageDir: testDir });
    const board = canvas.createBoard("Edit");
    const shape = canvas.addShape(board.id, { kind: "circle", x: 50, y: 50, radius: 25, visible: true, locked: false });
    assert.equal(board.revision, 1);

    const originalUpdatedAt = shape.updatedAt;
    canvas.updateShape(board.id, shape.id, { x: 100, y: 100, radius: 30 });
    const updated = canvas.getBoard(board.id)!.shapes[0];
    assert.equal(updated.x, 100);
    assert.equal(updated.radius, 30);
    assert.equal(updated.updatedAt >= originalUpdatedAt, true);

    canvas.removeShape(board.id, shape.id);
    assert.equal(canvas.getBoard(board.id)!.shapes.length, 0);
  });

  it("manages selection", () => {
    const canvas = new Canvas({ storageDir: testDir });
    const board = canvas.createBoard("Select");
    const s1 = canvas.addShape(board.id, { kind: "rect", x: 0, y: 0, width: 10, height: 10, visible: true, locked: false });
    const s2 = canvas.addShape(board.id, { kind: "rect", x: 20, y: 20, width: 10, height: 10, visible: true, locked: false });

    canvas.select(board.id, [s1.id, s2.id]);
    assert.equal(canvas.getBoard(board.id)!.selectedIds.length, 2);

    canvas.select(board.id, [s1.id], true);
    assert.equal(canvas.getBoard(board.id)!.selectedIds.length, 2);

    canvas.select(board.id, [s2.id], false);
    assert.equal(canvas.getBoard(board.id)!.selectedIds.length, 1);
    assert.equal(canvas.getBoard(board.id)!.selectedIds[0], s2.id);
  });

  it("supports undo and redo", () => {
    const canvas = new Canvas({ storageDir: testDir });
    const board = canvas.createBoard("History");
    canvas.addShape(board.id, { kind: "rect", x: 0, y: 0, width: 10, height: 10, visible: true, locked: false });
    assert.equal(canvas.getBoard(board.id)!.shapes.length, 1);

    canvas.undo(board.id);
    assert.equal(canvas.getBoard(board.id)!.shapes.length, 0);

    canvas.redo(board.id);
    assert.equal(canvas.getBoard(board.id)!.shapes.length, 1);
  });

  it("reorders shapes by layer", () => {
    const canvas = new Canvas({ storageDir: testDir });
    const board = canvas.createBoard("Layers");
    const s1 = canvas.addShape(board.id, { kind: "rect", x: 0, y: 0, width: 10, height: 10, visible: true, locked: false });
    const s2 = canvas.addShape(board.id, { kind: "rect", x: 20, y: 20, width: 10, height: 10, visible: true, locked: false });
    assert.equal(canvas.getBoard(board.id)!.shapes[0].id, s1.id);

    canvas.reorderShape(board.id, s1.id, "up");
    assert.equal(canvas.getBoard(board.id)!.shapes[1].id, s1.id);

    canvas.reorderShape(board.id, s2.id, "top");
    assert.equal(canvas.getBoard(board.id)!.shapes[1].id, s2.id);
  });

  it("persists and reloads boards", () => {
    const canvas1 = new Canvas({ storageDir: testDir });
    const board = canvas1.createBoard("Persist");
    canvas1.addShape(board.id, { kind: "text", x: 10, y: 10, text: "Hello", visible: true, locked: false });
    const id = board.id;

    const canvas2 = new Canvas({ storageDir: testDir });
    canvas2.load();
    const recovered = canvas2.getBoard(id);
    assert.ok(recovered, "recovered board should exist");
    assert.equal(recovered?.title, "Persist");
    assert.equal(recovered?.shapes.length, 1);
    assert.equal(recovered?.shapes[0].text, "Hello");
  });

  it("exports SVG", () => {
    const canvas = new Canvas({ storageDir: testDir });
    const board = canvas.createBoard("SVG");
    canvas.addShape(board.id, { kind: "rect", x: 10, y: 20, width: 100, height: 50, visible: true, locked: false });
    canvas.addShape(board.id, { kind: "circle", x: 50, y: 50, radius: 25, visible: true, locked: false });
    canvas.addShape(board.id, { kind: "text", x: 100, y: 100, text: "Test & <special>", visible: true, locked: false });

    const svg = canvas.svg(board.id);
    assert.ok(svg.includes('<?xml version="1.0"'));
    assert.ok(svg.includes("<svg"));
    assert.ok(svg.includes("<rect"));
    assert.ok(svg.includes("<circle"));
    assert.ok(svg.includes("Test &amp; &lt;special&gt;"));
    assert.ok(svg.includes("</svg>"));
  });

  it("rejects invalid operations", () => {
    const canvas = new Canvas({ storageDir: testDir });
    assert.throws(() => canvas.addShape("nonexistent", { kind: "rect", x: 0, y: 0, width: 1, height: 1, visible: true, locked: false }), /board not found/);
    assert.throws(() => canvas.updateShape("nonexistent", "sid", {}), /board not found/);
    assert.throws(() => canvas.removeShape("nonexistent", "sid"), /board not found/);

    const board = canvas.createBoard("Invalid");
    assert.throws(() => canvas.addShape(board.id, { kind: "rect", x: 0, y: 0, width: 1, height: 1, visible: true, locked: true }), /cannot add locked shape/);
  });

  it("exports a versioned asset manifest with sanitized SVG", () => {
    const canvas = new Canvas({ storageDir: testDir });
    const board = canvas.createBoard("Asset", 640, 480);
    canvas.addShape(board.id, { kind: "rect", x: 10, y: 20, width: 100, height: 50, visible: true, locked: false });
    canvas.addShape(board.id, { kind: "text", x: 50, y: 80, text: "Hello & World", visible: true, locked: false });

    const { manifest, svg } = canvas.exportAsset(board.id);
    assert.equal(manifest.schemaVersion, "aetherius-asset-v1");
    assert.equal(manifest.mimeType, "image/svg+xml");
    assert.equal(manifest.contentHash.length, 64);
    assert.equal(manifest.ownership, "aetherius-canvas");
    assert.equal(manifest.contentDimensions.width, 640);
    assert.equal(manifest.contentDimensions.height, 480);
    assert.equal(manifest.sourceRelationship?.sourceId, board.id);
    assert.equal(manifest.sourceRelationship?.sourceType, "canvas-board");
    assert.ok(svg.includes("<svg"));
    assert.ok(svg.includes("Hello &amp; World"));
    assert.ok(!svg.includes("onclick="));
  });

  it("rejects export on missing board", () => {
    const canvas = new Canvas({ storageDir: testDir });
    assert.throws(() => canvas.exportAsset("nonexistent"), /board not found/);
  });
});
