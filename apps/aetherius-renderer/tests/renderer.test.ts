import { describe, it } from "node:test";
import assert from "node:assert";
import { Renderer, encodePng, renderScene, renderPng, type Scene } from "../src/domain.ts";
import { Canvas } from "../../aetherius-canvas/src/domain.ts";
import { Slides } from "../../aetherius-slides/src/domain.ts";
import { inflateSync } from "node:zlib";

function decodePngSignature(data: Uint8Array): void {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < sig.length; i++) {
    assert.equal(data[i], sig[i], "PNG signature mismatch");
  }
}

function readChunks(data: Uint8Array): Array<{ type: string; payload: Uint8Array }> {
  const chunks: Array<{ type: string; payload: Uint8Array }> = [];
  let offset = 8;
  while (offset < data.length) {
    const view = new DataView(data.buffer, data.byteOffset + offset);
    const length = view.getUint32(0, false);
    const type = String.fromCharCode(data[offset+4], data[offset+5], data[offset+6], data[offset+7]);
    const payload = data.slice(offset + 8, offset + 8 + length);
    chunks.push({ type, payload });
    offset += 8 + length + 4;
  }
  return chunks;
}

function decodePngRgba(data: Uint8Array): { width: number; height: number; rgba: Uint8Array } {
  decodePngSignature(data);
  const chunks = readChunks(data);
  const ihdr = chunks.find((c) => c.type === "IHDR");
  assert.ok(ihdr, "IHDR chunk missing");
  const view = new DataView(ihdr!.payload.buffer, ihdr!.payload.byteOffset);
  const width = view.getUint32(0, false);
  const height = view.getUint32(4, false);
  assert.equal(ihdr!.payload[8], 8, "bit depth must be 8");
  assert.equal(ihdr!.payload[9], 6, "color type must be RGBA");

  const idat = chunks.filter((c) => c.type === "IDAT");
  assert.ok(idat.length > 0, "IDAT chunk missing");
  const compressed = new Uint8Array(idat.reduce((sum, c) => sum + c.payload.length, 0));
  let off = 0;
  for (const c of idat) {
    compressed.set(c.payload, off);
    off += c.payload.length;
  }
  const raw = inflateSync(compressed);
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    const filter = raw[rowOffset];
    assert.equal(filter, 0, "only None filter supported in decoder");
    const src = raw.slice(rowOffset + 1, rowOffset + 1 + width * 4);
    rgba.set(src, y * width * 4);
  }
  return { width, height, rgba };
}

describe("Renderer", () => {
  it("submits render jobs", () => {
    const renderer = new Renderer();
    const job = renderer.submit("scene-1", 128);
    assert.equal(job.samples, 128);
    assert.equal(renderer.list().length, 1);
  });
});

describe("encodePng", () => {
  it("produces a valid PNG signature and chunks", () => {
    const rgba = new Uint8Array([0, 0, 0, 0, 255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 0, 0]);
    const png = encodePng(2, 2, rgba);
    assert.ok(png[0] === 137 && png[1] === 80, "PNG signature");
    const chunks = readChunks(png);
    assert.ok(chunks.some((c) => c.type === "IHDR"));
    assert.ok(chunks.some((c) => c.type === "IDAT"));
    assert.ok(chunks.some((c) => c.type === "IEND"));
  });

  it("round-trips through the minimal independent decoder", () => {
    const rgba = new Uint8Array([
      255, 0, 0, 255,   0, 255, 0, 255,
      0, 0, 255, 255,   255, 255, 255, 255,
    ]);
    const png = encodePng(2, 2, rgba);
    const decoded = decodePngRgba(png);
    assert.equal(decoded.width, 2);
    assert.equal(decoded.height, 2);
    assert.deepEqual(decoded.rgba, rgba);
  });

  it("rejects mismatched buffer sizes", () => {
    assert.throws(() => encodePng(2, 2, new Uint8Array(3)), /does not match/);
  });
});

describe("renderScene", () => {
  it("renders a transparent background by default", () => {
    const scene: Scene = { width: 4, height: 4, background: "transparent", shapes: [] };
    const rgba = renderScene(scene);
    assert.equal(rgba.length, 4 * 4 * 4);
    for (let i = 3; i < rgba.length; i += 4) assert.equal(rgba[i], 0);
  });

  it("renders an opaque background", () => {
    const scene: Scene = { width: 2, height: 2, background: "#FF00FF", shapes: [] };
    const rgba = renderScene(scene);
    for (let i = 0; i < rgba.length; i += 4) {
      assert.equal(rgba[i], 255);
      assert.equal(rgba[i + 2], 255);
      assert.equal(rgba[i + 3], 255);
    }
  });

  it("renders a filled rect", () => {
    const scene: Scene = {
      width: 10, height: 10, background: "transparent",
      shapes: [{ kind: "rect", x: 2, y: 2, width: 4, height: 4, fill: "#FF0000", stroke: "#000000", strokeWidth: 0, opacity: 1, visible: true }],
    };
    const rgba = renderScene(scene);
    const idx = (3 * 10 + 3) * 4;
    assert.equal(rgba[idx], 255);
    assert.equal(rgba[idx + 1], 0);
    assert.equal(rgba[idx + 2], 0);
    assert.equal(rgba[idx + 3], 255);
  });

  it("renders a stroked ellipse", () => {
    const scene: Scene = {
      width: 40, height: 40, background: "transparent",
      shapes: [{ kind: "ellipse", x: 10, y: 10, width: 20, height: 20, stroke: "#00FF00", strokeWidth: 1, fill: "transparent", opacity: 1, visible: true }],
    };
    const rgba = renderScene(scene);
    const cx = 20, cy = 20;
    const idx = (cy * 40 + cx) * 4;
    assert.equal(rgba[idx + 3], 0, "center should be transparent");
    let hit = false;
    for (let py = 0; py < 40; py++) {
      for (let px = 0; px < 40; px++) {
        if (rgba[(py * 40 + px) * 4 + 3] > 0) { hit = true; break; }
      }
      if (hit) break;
    }
    assert.ok(hit, "stroke should produce at least one opaque pixel");
  });

  it("renders a line", () => {
    const scene: Scene = {
      width: 10, height: 10, background: "transparent",
      shapes: [{ kind: "line", x: 0, y: 0, x2: 9, y2: 9, stroke: "#0000FF", strokeWidth: 1, opacity: 1, visible: true }],
    };
    const rgba = renderScene(scene);
    const idx = (5 * 10 + 5) * 4;
    assert.ok(rgba[idx + 3] > 0, "line pixel should be opaque");
  });

  it("renders bitmap text", () => {
    const scene: Scene = {
      width: 32, height: 10, background: "transparent",
      shapes: [{ kind: "text", x: 0, y: 0, text: "A", fill: "#FFFFFF", opacity: 1, visible: true }],
    };
    const rgba = renderScene(scene);
    let hit = false;
    for (let i = 0; i < rgba.length; i += 4) {
      if (rgba[i + 3] > 0) { hit = true; break; }
    }
    assert.ok(hit, "text should produce opaque pixels");
  });

  it("respects the visible flag", () => {
    const scene: Scene = {
      width: 10, height: 10, background: "transparent",
      shapes: [{ kind: "rect", x: 0, y: 0, width: 10, height: 10, fill: "#FF0000", strokeWidth: 0, opacity: 1, visible: false }],
    };
    const rgba = renderScene(scene);
    for (let i = 3; i < rgba.length; i += 4) assert.equal(rgba[i], 0);
  });

  it("rejects oversized scenes", () => {
    assert.throws(() => renderScene({ width: 100000000, height: 1, background: "transparent", shapes: [] }), /exceeds maximum pixel count/);
  });
});

describe("Canvas raster export", () => {
  const testDir = "test-canvas-raster";

  it("renders a PNG from a board", () => {
    const canvas = new Canvas({ storageDir: testDir });
    const board = canvas.createBoard("Raster", 32, 32);
    canvas.addShape(board.id, { kind: "rect", x: 4, y: 4, width: 24, height: 24, visible: true, locked: false });
    const result = canvas.renderPng(board.id);
    assert.equal(result.manifest.mimeType, "image/png");
    assert.ok(result.png.length > 100, "PNG should not be empty");
    assert.ok(result.snapshot.length > 100, "base64 snapshot should not be empty");
    assert.equal(result.manifest.contentHash.length, 64);
  });

  it("produces independently decodable PNG", () => {
    const canvas = new Canvas({ storageDir: testDir });
    const board = canvas.createBoard("Decode", 8, 8);
    canvas.addShape(board.id, { kind: "rect", x: 2, y: 2, width: 4, height: 4, visible: true, locked: false });
    const { png } = canvas.renderPng(board.id);
    const decoded = decodePngRgba(png);
    assert.equal(decoded.width, 8);
    assert.equal(decoded.height, 8);
    const idx = (4 * 8 + 4) * 4;
    assert.equal(decoded.rgba[idx + 3], 255, "center pixel should be opaque");
  });

  it("throws on missing board", () => {
    const canvas = new Canvas({ storageDir: testDir });
    assert.throws(() => canvas.renderPng("nonexistent"), /board not found/);
  });
});

describe("Slides raster import", () => {
  const testDir = "test-slides-raster";

  it("imports a PNG asset via importRasterAsset", () => {
    const canvas = new Canvas({ storageDir: testDir });
    const board = canvas.createBoard("SlideRaster", 64, 64);
    canvas.addShape(board.id, { kind: "rect", x: 0, y: 0, width: 64, height: 64, visible: true, locked: false });
    const { manifest, snapshot } = canvas.renderPng(board.id);

    const slides = new Slides({ storageDir: testDir });
    const deck = slides.createDeck("RasterDeck");
    const slide = slides.addSlide(deck.id, "RasterSlide");
    const el = slides.importRasterAsset(deck.id, slide.id, manifest, snapshot, { x: 0, y: 0, width: 64, height: 64 });
    assert.equal(el.kind, "asset");
    assert.equal(el.assetId, manifest.id);
    assert.ok(el.assetSnapshot!.length > 100);
  });

  it("rejects non-PNG manifest for raster import", () => {
    const slides = new Slides({ storageDir: testDir });
    const deck = slides.createDeck("BadRaster");
    const slide = slides.addSlide(deck.id, "Bad");
    const badManifest = {
      id: "asset-1",
      schemaVersion: "aetherius-asset-v1",
      mimeType: "image/svg+xml",
      contentHash: "a".repeat(64),
      ownership: "test",
      provenance: { sourceApp: "test", exportedAt: new Date().toISOString(), exporterVersion: "1" },
      contentDimensions: { width: 10, height: 10 },
      createdAt: new Date().toISOString(),
    };
    assert.throws(() => slides.importRasterAsset(deck.id, slide.id, badManifest, "", { x: 0, y: 0, width: 10, height: 10 }), /raster asset import expects image\/png/);
  });

  it("preserves PNG asset across separate-process reload", () => {
    const canvas = new Canvas({ storageDir: testDir });
    const board = canvas.createBoard("Persistence", 32, 32);
    canvas.addShape(board.id, { kind: "rect", x: 4, y: 4, width: 24, height: 24, visible: true, locked: false });
    const { manifest, snapshot } = canvas.renderPng(board.id);

    const slides = new Slides({ storageDir: testDir });
    const deck = slides.createDeck("PersistDeck");
    const slide = slides.addSlide(deck.id, "PersistSlide");
    slides.importRasterAsset(deck.id, slide.id, manifest, snapshot, { x: 0, y: 0, width: 32, height: 32 });

    // Simulate separate process: new Slides instance loads from disk
    const slides2 = new Slides({ storageDir: testDir });
    (slides2 as any).load();
    const loaded = slides2.getDeck(deck.id);
    assert.ok(loaded, "deck should reload from disk");
    const loadedSlide = loaded!.slides.find((s) => s.id === slide.id);
    assert.ok(loadedSlide, "slide should reload from disk");
    const loadedEl = loadedSlide!.elements.find((e) => e.assetId === manifest.id);
    assert.ok(loadedEl, "asset element should reload from disk");
    assert.equal(loadedEl!.assetSnapshot!.length, snapshot.length, "snapshot should survive reload");
    assert.equal(loadedEl!.assetId, manifest.id, "asset identity should survive reload");
  });
});

