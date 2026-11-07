import { describe, it } from "node:test";
import assert from "node:assert";
import { Slides } from "../src/domain.ts";
import { existsSync, rmSync } from "node:fs";

const manifestBad = {
  id: "asset-bad",
  schemaVersion: "aetherius-asset-v1",
  mimeType: "image/svg+xml",
  contentHash: "0".repeat(64),
  ownership: "aetherius-canvas",
  provenance: { sourceApp: "aetherius-canvas", exportedAt: "2026-11-03T00:00:00.000Z", exporterVersion: "batch-23" },
  contentDimensions: { width: 1, height: 1 },
  createdAt: "2026-11-03T00:00:00.000Z",
};

describe("Slides", () => {
  const testDir = "test-slides-data";

  it("creates deck and adds slides", () => {
    const slides = new Slides({ storageDir: testDir });
    const deck = slides.createDeck("Presentation");
    assert.equal(deck.name, "Presentation");
    const slide = slides.addSlide(deck.id, "Title");
    assert.equal(slides.listDecks().length, 1);
    assert.equal(slide.title, "Title");
  });

  it("adds and updates elements", () => {
    const slides = new Slides({ storageDir: testDir });
    const deck = slides.createDeck("Elements");
    const slide = slides.addSlide(deck.id, "Slide");
    const el = slides.addElement(deck.id, slide.id, { kind: "text", text: "Hello", x: 0, y: 0, width: 100, height: 50 });
    assert.equal(el.text, "Hello");
    slides.updateElement(deck.id, slide.id, el.id, { text: "Updated", x: 10, y: 10 });
    const updated = slides.getDeck(deck.id)!.slides[0].elements[0];
    assert.equal(updated.text, "Updated");
    assert.equal(updated.x, 10);
  });

  it("removes elements and slides", () => {
    const slides = new Slides({ storageDir: testDir });
    const deck = slides.createDeck("Remove");
    const slide = slides.addSlide(deck.id, "Slide");
    const el = slides.addElement(deck.id, slide.id, { kind: "text", text: "Bye", x: 0, y: 0, width: 50, height: 50 });
    slides.removeElement(deck.id, slide.id, el.id);
    assert.equal(slides.getDeck(deck.id)!.slides[0].elements.length, 0);
    slides.removeSlide(deck.id, slide.id);
    assert.equal(slides.getDeck(deck.id)!.slides.length, 0);
  });

  it("reorders slides", () => {
    const slides = new Slides({ storageDir: testDir });
    const deck = slides.createDeck("Order");
    const s1 = slides.addSlide(deck.id, "First");
    const s2 = slides.addSlide(deck.id, "Second");
    const s3 = slides.addSlide(deck.id, "Third");
    assert.equal(slides.getDeck(deck.id)!.slides[0].id, s1.id);
    slides.reorderSlide(deck.id, s3.id, 0);
    assert.equal(slides.getDeck(deck.id)!.slides[0].id, s3.id);
    assert.equal(slides.getDeck(deck.id)!.slides[1].id, s1.id);
    assert.equal(slides.getDeck(deck.id)!.slides[2].id, s2.id);
  });

  it("sets and retrieves speaker notes", () => {
    const slides = new Slides({ storageDir: testDir });
    const deck = slides.createDeck("Notes");
    const slide = slides.addSlide(deck.id, "Talk");
    slides.setNotes(deck.id, slide.id, "Remember to smile");
    assert.equal(slides.getDeck(deck.id)!.slides[0].notes, "Remember to smile");
  });

  it("persists and reloads decks", () => {
    const slides1 = new Slides({ storageDir: testDir });
    const deck = slides1.createDeck("Persistent");
    slides1.addSlide(deck.id, "Saved");
    slides1.addElement(deck.id, deck.slides[0].id, { kind: "title", text: "Title", x: 0, y: 0, width: 200, height: 100 });
    const id = deck.id;

    const slides2 = new Slides({ storageDir: testDir });
    slides2.load();
    const recovered = slides2.getDeck(id);
    assert.ok(recovered, "recovered deck should exist");
    assert.equal(recovered?.name, "Persistent");
    assert.equal(recovered?.slides.length, 1);
    assert.equal(recovered?.slides[0].elements.length, 1);
  });

  it("exports json", () => {
    const slides = new Slides({ storageDir: testDir });
    const deck = slides.createDeck("JSON Export");
    slides.addSlide(deck.id, "Slide 1");
    const json = slides.json(deck.id);
    const parsed = JSON.parse(json);
    assert.equal(parsed.name, "JSON Export");
    assert.equal(parsed.slides.length, 1);
    assert.equal(parsed.slides[0].title, "Slide 1");
  });

  it("rejects invalid operations", () => {
    const slides = new Slides({ storageDir: testDir });
    assert.throws(() => slides.addSlide("nonexistent", "x"), /deck not found/);
    assert.throws(() => slides.removeSlide("nonexistent", "x"), /deck not found/);
    assert.throws(() => slides.reorderSlide("nonexistent", "x", 0), /deck not found/);
    
    const deck = slides.createDeck("InvalidTest");
    const slide = slides.addSlide(deck.id, "Slide");
    assert.throws(() => slides.reorderSlide(deck.id, "nonexistent", 0), /slide not found/);
    assert.throws(() => slides.reorderSlide(deck.id, slide.id, -1), /invalid order/);
    assert.throws(() => slides.reorderSlide(deck.id, slide.id, 100), /invalid order/);
    assert.throws(() => slides.addElement("nonexistent", "sid", { kind: "text", text: "x", x: 0, y: 0, width: 1, height: 1 }), /deck not found/);
  });

  it("imports a canvas asset as an immutable snapshot", () => {
    const slides = new Slides({ storageDir: testDir });
    const deck = slides.createDeck("Interop");
    const slide = slides.addSlide(deck.id, "Slide 1");

    const manifest = {
      id: "asset-123",
      schemaVersion: "aetherius-asset-v1",
      mimeType: "image/svg+xml",
      contentHash: "a".repeat(64),
      ownership: "aetherius-canvas",
      provenance: { sourceApp: "aetherius-canvas", exportedAt: "2026-11-03T00:00:00.000Z", exporterVersion: "batch-23" },
      contentDimensions: { width: 640, height: 480 },
      sourceRelationship: { sourceId: "board-1", sourceType: "canvas-board" as const },
      createdAt: "2026-11-03T00:00:00.000Z",
    };

    const el = slides.importAsset(deck.id, slide.id, manifest, "<svg xmlns='http://www.w3.org/2000/svg'/>", { x: 0, y: 0, width: 320, height: 240 });
    assert.equal(el.kind, "asset");
    assert.equal(el.assetId, "asset-123");
    assert.equal(el.assetSnapshot, "<svg xmlns='http://www.w3.org/2000/svg'/>");
    assert.equal(el.x, 0);
    assert.equal(el.y, 0);

    const asset = slides.getAsset(deck.id, "asset-123");
    assert.ok(asset, "asset should be registered");
    assert.equal(asset!.id, "asset-123");
    assert.equal(asset!.contentDimensions.width, 640);
  });

  it("rejects duplicate import with different contentHash", () => {
    const slides = new Slides({ storageDir: testDir });
    const deck = slides.createDeck("DupTest");
    const slide = slides.addSlide(deck.id, "Slide");

    const manifest = {
      id: "asset-dup",
      schemaVersion: "aetherius-asset-v1",
      mimeType: "image/svg+xml",
      contentHash: "a".repeat(64),
      ownership: "aetherius-canvas",
      provenance: { sourceApp: "aetherius-canvas", exportedAt: "2026-11-03T00:00:00.000Z", exporterVersion: "batch-23" },
      contentDimensions: { width: 100, height: 100 },
      createdAt: "2026-11-03T00:00:00.000Z",
    };

    slides.importAsset(deck.id, slide.id, manifest, "<svg/>", { x: 0, y: 0, width: 100, height: 100 });
    assert.throws(() => slides.importAsset(deck.id, slide.id, { ...manifest, contentHash: "b".repeat(64) }, "<svg/>", { x: 0, y: 0, width: 100, height: 100 }), /already imported with different contentHash/);
  });

  it("rejects unsupported schema version and unsafe paths", () => {
    const slides = new Slides({ storageDir: testDir });
    const deck = slides.createDeck("Unsafe");
    const slide = slides.addSlide(deck.id, "Slide");

    assert.throws(() => slides.importAsset(deck.id, slide.id, { ...manifestBad, schemaVersion: "v2" }, "<svg/>", { x: 0, y: 0, width: 1, height: 1 }), /unsupported asset schema version/);
    assert.throws(() => slides.importAsset(deck.id, slide.id, { ...manifestBad, id: "../etc/passwd" }, "<svg/>", { x: 0, y: 0, width: 1, height: 1 }), /unsafe path reference/);
  });

  it("persists imported assets across reload", () => {
    const slides1 = new Slides({ storageDir: testDir });
    const deck = slides1.createDeck("PersistAsset");
    const slide = slides1.addSlide(deck.id, "Slide");
    const manifest = {
      id: "asset-persist",
      schemaVersion: "aetherius-asset-v1",
      mimeType: "image/svg+xml",
      contentHash: "c".repeat(64),
      ownership: "aetherius-canvas",
      provenance: { sourceApp: "aetherius-canvas", exportedAt: "2026-11-03T00:00:00.000Z", exporterVersion: "batch-23" },
      contentDimensions: { width: 200, height: 200 },
      createdAt: "2026-11-03T00:00:00.000Z",
    };
    slides1.importAsset(deck.id, slide.id, manifest, "<svg/>", { x: 10, y: 10, width: 100, height: 100 });

    const slides2 = new Slides({ storageDir: testDir });
    slides2.load();
    const recovered = slides2.getAsset(deck.id, "asset-persist");
    assert.ok(recovered, "recovered asset should exist");
    assert.equal(recovered!.contentDimensions.width, 200);
    const recoveredSlide = slides2.getDeck(deck.id)!.slides[0];
    const assetEl = recoveredSlide.elements.find((e) => e.assetId === "asset-persist");
    assert.ok(assetEl, "asset element should survive reload");
    assert.equal(assetEl!.assetSnapshot, "<svg/>");
  });
});
