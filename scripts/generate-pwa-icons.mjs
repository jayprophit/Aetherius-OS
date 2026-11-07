#!/usr/bin/env node
/**
 * Generate the PWA icon set from code so the binary assets are reproducible.
 *
 * The mark is a geometric "A" on the Aetherius dark background. The maskable
 * variant is inset so it survives a circular mask.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(repoRoot, "public", "icons");

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const raw = lengthSquared === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lengthSquared;
  const t = Math.max(0, Math.min(1, raw));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function renderIcon(size, scale) {
  const rgba = Buffer.alloc(size * size * 4);
  const center = 0.5;
  const points = [
    [0.5, 0.16, 0.22, 0.84],
    [0.5, 0.16, 0.78, 0.84],
    [0.34, 0.62, 0.66, 0.62],
  ].map(([ax, ay, bx, by]) => [
    center + (ax - center) * scale,
    center + (ay - center) * scale,
    center + (bx - center) * scale,
    center + (by - center) * scale,
  ]);
  const thickness = 0.055 * scale;
  const glow = 0.03 * scale;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5) / size;
      const ny = (y + 0.5) / size;
      const t = (nx + ny) / 2;
      let r = Math.round(11 + 13 * t);
      let g = Math.round(16 + 14 * t);
      let b = Math.round(32 + 30 * t);

      let distance = Infinity;
      for (const [ax, ay, bx, by] of points) {
        distance = Math.min(distance, distanceToSegment(nx, ny, ax, ay, bx, by));
      }

      if (distance <= thickness) {
        r = 77;
        g = 225;
        b = 255;
      } else if (distance <= thickness + glow) {
        const alpha = 1 - (distance - thickness) / glow;
        r = Math.round(r + (77 - r) * alpha * 0.55);
        g = Math.round(g + (225 - g) * alpha * 0.55);
        b = Math.round(b + (255 - b) * alpha * 0.55);
      }

      const offset = (y * size + x) * 4;
      rgba[offset] = r;
      rgba[offset + 1] = g;
      rgba[offset + 2] = b;
      rgba[offset + 3] = 255;
    }
  }

  return encodePng(size, size, rgba);
}

mkdirSync(outputDir, { recursive: true });
const outputs = [
  ["icon-192.png", 192, 1],
  ["icon-512.png", 512, 1],
  ["icon-maskable-512.png", 512, 0.86],
];

for (const [name, size, scale] of outputs) {
  const path = join(outputDir, name);
  writeFileSync(path, renderIcon(size, scale));
  console.log(`wrote ${path}`);
}
