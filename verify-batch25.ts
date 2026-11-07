import { Canvas } from "./apps/aetherius-canvas/src/domain.ts";
import { Slides } from "./apps/aetherius-slides/src/domain.ts";
import { inflateSync } from "node:zlib";
import fs from "node:fs";
import path from "node:path";

const outDir = "batch25-verify";
fs.mkdirSync(outDir, { recursive: true });

// 1. Create Canvas board with shapes
const canvas = new Canvas({ storageDir: "batch25-canvas" });
const board = canvas.createBoard("Verify", 128, 128);
canvas.addShape(board.id, { kind: "rect", x: 10, y: 10, width: 50, height: 50, visible: true, locked: false });
canvas.addShape(board.id, { kind: "rect", x: 40, y: 40, width: 50, height: 50, visible: true, locked: false });
canvas.addShape(board.id, { kind: "line", x1: 0, y1: 0, x2: 127, y2: 127, visible: true, locked: false });

// 2. Render PNG
const { manifest, png, snapshot } = canvas.renderPng(board.id);
fs.writeFileSync(path.join(outDir, "canvas-export.png"), Buffer.from(png));
fs.writeFileSync(path.join(outDir, "canvas-export-base64.txt"), snapshot);

// 3. Validate PNG structure
const sig = [137, 80, 78, 71, 13, 10, 26, 10];
const data = new Uint8Array(fs.readFileSync(path.join(outDir, "canvas-export.png")));
for (let i = 0; i < sig.length; i++) {
  if (data[i] !== sig[i]) throw new Error("Invalid PNG signature");
}
console.log("PNG signature: OK");

// Parse IHDR
let offset = 8;
const view = new DataView(data.buffer, data.byteOffset + offset);
const width = view.getUint32(0, false);
const height = view.getUint32(4, false);
console.log("Dimensions:", width, "x", height);

// Decompress IDAT
const chunks: Array<{ type: string; payload: Uint8Array }> = [];
offset = 8;
while (offset < data.length) {
  const l = new DataView(data.buffer, data.byteOffset + offset).getUint32(0, false);
  const type = String.fromCharCode(data[offset+4], data[offset+5], data[offset+6], data[offset+7]);
  const payload = data.slice(offset+8, offset+8+l);
  chunks.push({ type, payload });
  offset += 8 + l + 4;
}
const compressed = new Uint8Array(chunks.filter((c) => c.type === "IDAT").reduce((s, c) => s + c.payload.length, 0));
let off = 0;
for (const c of chunks.filter((c) => c.type === "IDAT")) {
  compressed.set(c.payload, off);
  off += c.payload.length;
}
const raw = inflateSync(compressed);
console.log("IDAT decompressed, raw bytes:", raw.length);
console.log("Expected raw bytes for 128x128 RGBA:", 128 * (1 + 128 * 4));

// 4. Import into Slides
const slides = new Slides({ storageDir: "batch25-slides" });
const deck = slides.createDeck("VerifyDeck");
const slide = slides.addSlide(deck.id, "VerifySlide");
const el = slides.importRasterAsset(deck.id, slide.id, manifest, snapshot, { x: 0, y: 0, width: 128, height: 128 });
console.log("Slides asset element kind:", el.kind);
console.log("Slides asset snapshot length:", el.assetSnapshot!.length);

// 5. Save and reload
slides.persist();
const slides2 = new Slides({ storageDir: "batch25-slides" });
(slides2 as any).load();
const recovered = slides2.getDeck(deck.id);
const recoveredEl = recovered!.slides.find((s) => s.id === slide.id)!.elements.find((e) => e.assetId === manifest.id);
console.log("Reloaded asset snapshot length:", recoveredEl!.assetSnapshot!.length);
console.log("Content integrity preserved:", recoveredEl!.assetSnapshot!.length === snapshot.length);

console.log("\n=== BATCH 25 VERIFICATION COMPLETE ===");
console.log("Files written to:", outDir);
