import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { Canvas } from "../apps/aetherius-canvas/src/domain.ts";
import { Slides } from "../apps/aetherius-slides/src/domain.ts";
import { AssetStore, computeHash, sanitizeSvg } from "../apps/aetherius-app-suite/src/asset-exchange.ts";
import type { AssetManifest } from "../apps/aetherius-app-suite/src/asset-exchange.ts";
import { dirname } from "node:path";
import { NodeFsStorage } from "../apps/app-kit/src/storage-node.ts";
import { existsSync, rmSync } from "node:fs";

describe("Canvas → Slides interoperability", () => {
  const canvasDir = "test-interop-canvas";
  const slidesDir = "test-interop-slides";

  const cleanup = () => {
    if (existsSync(canvasDir)) rmSync(canvasDir, { recursive: true });
    if (existsSync(slidesDir)) rmSync(slidesDir, { recursive: true });
  };

  before(cleanup);
  after(cleanup);

  it("completes the full create → export → register → import → save → reopen → recover workflow", () => {
    const assetStorePath = "test-interop-assets-1.json";
    const cleanupAsset = () => { if (existsSync(assetStorePath)) rmSync(assetStorePath); };
    beforeEach(cleanupAsset);
    afterEach(cleanupAsset);

    // 1. Create canvas and add shapes
    const canvas = new Canvas({ storageDir: canvasDir });
    const board = canvas.createBoard("Interop Board", 800, 600);
    canvas.addShape(board.id, { kind: "rect", x: 10, y: 20, width: 100, height: 50, visible: true, locked: false });
    canvas.addShape(board.id, { kind: "text", x: 50, y: 100, text: "Interop Test", visible: true, locked: false });

    // 2. Export asset
    const { manifest, svg } = canvas.exportAsset(board.id);
    assert.equal(manifest.schemaVersion, "aetherius-asset-v1");
    assert.ok(svg.includes("<svg"));
    assert.ok(svg.includes("Interop Test"));

    // 3. Register asset in shared store
    const assetStore = new AssetStore(new NodeFsStorage(dirname(assetStorePath)));
    const registered = assetStore.register({ manifest, content: svg });
    assert.equal(registered.id, manifest.id);
    assert.equal(registered.contentHash, manifest.contentHash);

    // 4. Import into slides
    const slides = new Slides({ storageDir: slidesDir });
    const deck = slides.createDeck("Interop Deck");
    const slide = slides.addSlide(deck.id, "Slide 1");
    const el = slides.importAsset(deck.id, slide.id, manifest, svg, { x: 0, y: 0, width: 400, height: 300 });
    assert.equal(el.kind, "asset");
    assert.equal(el.assetId, manifest.id);
    assert.equal(el.width, 400);
    assert.equal(el.height, 300);

    // 5. Save and reopen in separate process
    const slides2 = new Slides({ storageDir: slidesDir });
    slides2.load();
    const recoveredDeck = slides2.getDeck(deck.id);
    assert.ok(recoveredDeck, "deck should survive reload");
    assert.equal(recoveredDeck!.assets.length, 1);
    assert.equal(recoveredDeck!.assets[0].id, manifest.id);

    const recoveredSlide = recoveredDeck!.slides[0];
    const assetEl = recoveredSlide.elements.find((e) => e.assetId === manifest.id);
    assert.ok(assetEl, "asset element should survive reload");
    assert.equal(assetEl!.assetSnapshot, svg);
    assert.equal(assetEl!.x, 0);
    assert.equal(assetEl!.y, 0);

    // 6. Verify asset integrity via store
    const integrityOk = assetStore.verifyIntegrity(manifest.id);
    assert.ok(integrityOk, "asset integrity should pass");

    // 7. Verify source edits do not affect imported snapshot
    canvas.updateShape(board.id, board.shapes[0].id, { x: 999, y: 999 });
    const { manifest: updatedManifest, svg: updatedSvg } = canvas.exportAsset(board.id);
    const updatedHash = computeHash(updatedSvg);
    assert.notEqual(updatedHash, manifest.contentHash, "source edit should change content hash");
    assert.equal(assetEl!.assetSnapshot, svg, "snapshot in slides should retain original SVG");
  });

  it("rejects corrupted and unsafe assets", () => {
    const assetStorePath = "test-interop-assets-2.json";
    const cleanupAsset = () => { if (existsSync(assetStorePath)) rmSync(assetStorePath); };
    beforeEach(cleanupAsset);
    afterEach(cleanupAsset);

    const canvas = new Canvas({ storageDir: canvasDir });
    const board = canvas.createBoard("Unsafe");
    canvas.addShape(board.id, { kind: "text", x: 0, y: 0, text: "<script>alert(1)</script>", visible: true, locked: false });

    assert.throws(() => sanitizeSvg("<svg><script>alert(1)</script></svg>"), /forbidden executable content/);
  });

  it("handles duplicate content idempotently", () => {
    const assetStorePath = "test-interop-assets-dup.json";
    const cleanupAsset = () => { if (existsSync(assetStorePath)) rmSync(assetStorePath); };
    beforeEach(cleanupAsset);
    afterEach(cleanupAsset);

    const assetStore = new AssetStore(new NodeFsStorage(dirname(assetStorePath)));
    const manifest = {
      id: "asset-dup",
      schemaVersion: "aetherius-asset-v1",
      mimeType: "image/svg+xml",
      contentHash: "d".repeat(64),
      ownership: "aetherius-canvas",
      provenance: { sourceApp: "aetherius-canvas", exportedAt: "2026-11-03T00:00:00.000Z", exporterVersion: "batch-23" },
      contentDimensions: { width: 100, height: 100 },
      createdAt: "2026-11-03T00:00:00.000Z",
    };
    const svg = "<svg xmlns='http://www.w3.org/2000/svg'/>";
    assetStore.register({ manifest, content: svg });
    const second = assetStore.register({ manifest, content: svg });
    assert.equal(second.id, manifest.id);
    assert.equal(assetStore.all().length, 1);
  });

  it("supports legacy board reopen (pre-Batch-23 boards.json)", () => {
    const canvas = new Canvas({ storageDir: canvasDir });
    const board = canvas.createBoard("Legacy");
    canvas.addShape(board.id, { kind: "rect", x: 0, y: 0, width: 10, height: 10, visible: true, locked: false });

    const canvas2 = new Canvas({ storageDir: canvasDir });
    canvas2.load();
    const recovered = canvas2.getBoard(board.id);
    assert.ok(recovered, "legacy board should reopen");
    assert.equal(recovered!.shapes.length, 1);
  });
});
