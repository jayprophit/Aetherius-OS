#!/usr/bin/env node
/**
 * Generate the Tauri desktop icon set from code so the binary assets are reproducible.
 * Mirrors scripts/generate-pwa-icons.mjs (same mark) but emits the exact sizes
 * `src-tauri/tauri.conf.json` expects: 32x32, 128x128, 128x128@2x (256), plus
 * icon.icns (Apple) and icon.ico (Windows) wrappers containing the 256 PNG.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(repoRoot, "src-tauri", "icons");

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const sum = Buffer.alloc(4); sum.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, sum]);
}
function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) raw[y * (stride + 1)] = 0;
  for (let y = 0; y < height; y += 1) rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function renderIcon(size, scale) {
  const rgba = Buffer.alloc(size * size * 4);
  const c = 0.5;
  const pts = [[0.5,0.16,0.22,0.84],[0.5,0.16,0.78,0.84],[0.34,0.62,0.66,0.62]]
    .map(([ax, ay, bx, by]) => [c+(ax-c)*scale, c+(ay-c)*scale, c+(bx-c)*scale, c+(by-c)*scale]);
  const thickness = 0.055 * scale, glow = 0.03 * scale;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5) / size, ny = (y + 0.5) / size, t = (nx + ny) / 2;
      let r = Math.round(11 + 13 * t), g = Math.round(16 + 14 * t), b = Math.round(32 + 30 * t);
      let d = Infinity;
      for (const [ax, ay, bx, by] of pts) d = Math.min(d, distToSeg(nx, ny, ax, ay, bx, by));
      if (d <= thickness) { r = 77; g = 225; b = 255; }
      else if (d <= thickness + glow) { const a = 1 - (d - thickness) / glow; r = Math.round(r + (77 - r) * a * 0.55); g = Math.round(g + (225 - g) * a * 0.55); b = Math.round(b + (255 - b) * a * 0.55); }
      const o = (y * size + x) * 4;
      rgba[o] = r; rgba[o+1] = g; rgba[o+2] = b; rgba[o+3] = 255;
    }
  }
  return encodePng(size, size, rgba);
}
function toIco(pngBytes) {
  // Minimal valid ICO: ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes) + PNG image data.
  const ico = Buffer.alloc(22);
  ico.writeUInt16LE(0, 0); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
  ico.writeUInt32LE(pngBytes.length, 8);
  ico.writeUInt32LE(22, 12);
  return Buffer.concat([ico, pngBytes]);
}
function toIcns(pngBytes) {
  // ICNS header + ic07 (256x256 PNG) element. Total length = 8 + 8 + pngBytes.length.
  // Element id 'ic07' denotes 256x256 PNG in ICNS spec (Apple TB2306).
  const header = Buffer.alloc(8);
  header.write("icns", 0, "ascii");
  header.writeUInt32BE(8 + 8 + pngBytes.length, 4);
  const element = Buffer.alloc(8);
  element.write("ic07", 0, "ascii");
  element.writeUInt32BE(8 + pngBytes.length, 4);
  return Buffer.concat([header, element, pngBytes]);
}
mkdirSync(outputDir, { recursive: true });
const png32 = renderIcon(32, 1);
const png128 = renderIcon(128, 1);
const png256 = renderIcon(256, 1);
writeFileSync(join(outputDir, "32x32.png"), png32);
writeFileSync(join(outputDir, "128x128.png"), png128);
writeFileSync(join(outputDir, "128x128@2x.png"), png256);
writeFileSync(join(outputDir, "icon.ico"), toIco(png256));
writeFileSync(join(outputDir, "icon.icns"), toIcns(png256));
console.log(`wrote ${join(outputDir, "32x32.png")}`);
console.log(`wrote ${join(outputDir, "128x128.png")}`);
console.log(`wrote ${join(outputDir, "128x128@2x.png")}`);
console.log(`wrote ${join(outputDir, "icon.ico")}`);
console.log(`wrote ${join(outputDir, "icon.icns")}`);
