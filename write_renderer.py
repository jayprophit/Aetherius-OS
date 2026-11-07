import pathlib, textwrap
path = pathlib.Path(r'apps/aetherius-renderer/src/domain.ts')
content = textwrap.dedent(r'''
import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";
import { deflateSync } from "node:zlib";

const BITMAP_FONT: Record<number, number[]> = {
  32: [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
  33: [0x18,0x18,0x18,0x18,0x18,0x00,0x18,0x00],
  34: [0x6C,0x6C,0x24,0x00,0x00,0x00,0x00,0x00],
  35: [0x6C,0x6C,0xFE,0x6C,0xFE,0x6C,0x6C,0x00],
  36: [0x18,0x7E,0xC0,0x7C,0x06,0xFC,0x18,0x00],
  37: [0xC6,0xCC,0x18,0x30,0x60,0xC6,0x86,0x00],
  38: [0x38,0x6C,0x38,0x76,0xDC,0xCC,0x76,0x00],
  39: [0x18,0x18,0x30,0x00,0x00,0x00,0x00,0x00],
  40: [0x0C,0x18,0x30,0x30,0x30,0x18,0x0C,0x00],
  41: [0x30,0x18,0x0C,0x0C,0x0C,0x18,0x30,0x00],
  42: [0x00,0x66,0x3C,0xFF,0x3C,0x66,0x00,0x00],
  43: [0x00,0x18,0x18,0x7E,0x18,0x18,0x00,0x00],
  44: [0x00,0x00,0x00,0x00,0x00,0x18,0x18,0x30],
  45: [0x00,0x00,0x00,0x7E,0x00,0x00,0x00,0x00],
  46: [0x00,0x00,0x00,0x00,0x00,0x18,0x18,0x00],
  47: [0x06,0x0C,0x18,0x30,0x60,0xC0,0x80,0x00],
  48: [0x7C,0xC6,0xCE,0xD6,0xE6,0xC6,0x7C,0x00],
  49: [0x18,0x38,0x18,0x18,0x18,0x18,0x7E,0x00],
  50: [0x7C,0xC6,0x06,0x1C,0x30,0x66,0xFE,0x00],
  51: [0x7C,0xC6,0x06,0x3C,0x06,0xC6,0x7C,0x00],
  52: [0x1C,0x3C,0x6C,0xCC,0xFE,0x0C,0x1E,0x00],
  53: [0xFE,0xC0,0xC0,0xFC,0x06,0xC6,0x7C,0x00],
  54: [0x38,0x60,0xC0,0xFC,0xC6,0xC6,0x7C,0x00],
  55: [0xFE,0xC6,0x0C,0x18,0x30,0x30,0x30,0x00],
  56: [0x7C,0xC6,0xC6,0x7C,0xC6,0xC6,0x7C,0x00],
  57: [0x7C,0xC6,0xC6,0x7E,0x06,0x0C,0x78,0x00],
  58: [0x00,0x18,0x18,0x00,0x00,0x18,0x18,0x00],
  59: [0x00,0x18,0x18,0x00,0x00,0x18,0x18,0x30],
  60: [0x06,0x0C,0x18,0x30,0x18,0x0C,0x06,0x00],
  61: [0x00,0x00,0x7E,0x00,0x7E,0x00,0x00,0x00],
  62: [0x60,0x30,0x18,0x0C,0x18,0x30,0x60,0x00],
  63: [0x7C,0xC6,0x0C,0x18,0x30,0x00,0x30,0x00],
  64: [0x7C,0xC6,0xDE,0xDE,0xDE,0xC0,0x78,0x00],
  65: [0x38,0x6C,0xC6,0xFE,0xC6,0xC6,0xC6,0x00],
  66: [0xFC,0x66,0x66,0x7C,0x66,0x66,0xFC,0x00],
  67: [0x3C,0x66,0xC0,0xC0,0xC0,0x66,0x3C,0x00],
  68: [0xF8,0x6C,0x66,0x66,0x66,0x6C,0xF8,0x00],
  69: [0xFE,0x62,0x68,0x78,0x68,0x62,0xFE,0x00],
  70: [0xFE,0x62,0x68,0x78,0x68,0x60,0xF0,0x00],
  71: [0x3C,0x66,0xC0,0xC0,0xCE,0x66,0x3A,0x00],
  72: [0xC6,0xC6,0xC6,0xFE,0xC6,0xC6,0xC6,0x00],
  73: [0x3C,0x18,0x18,0x18,0x18,0x18,0x3C,0x00],
  74: [0x1E,0x0C,0x0C,0x0C,0xCC,0xCC,0x78,0x00],
  75: [0xE6,0x66,0x6C,0x78,0x6C,0x66,0xE6,0x00],
  76: [0xF0,0x60,0x60,0x60,0x62,0x66,0xFE,0x00],
  77: [0xC6,0xEE,0xFE,0xFE,0xD6,0xC6,0xC6,0x00],
  78: [0xC6,0xE6,0xF6,0xDE,0xCE,0xC6,0xC6,0x00],
  79: [0x38,0x6C,0xC6,0xC6,0xC6,0x6C,0x38,0x00],
  80: [0xFC,0x66,0x66,0x7C,0x60,0x60,0xF0,0x00],
  81: [0x78,0xCC,0xCC,0xCC,0xDC,0x78,0x1C,0x00],
  82: [0xFC,0x66,0x66,0x7C,0x6C,0x66,0xE6,0x00],
  83: [0x78,0xCC,0xE0,0x70,0x1C,0xCC,0x78,0x00],
  84: [0xFC,0xB4,0x30,0x30,0x30,0x30,0x78,0x00],
  85: [0xC6,0xC6,0xC6,0xC6,0xC6,0xC6,0x7C,0x00],
  86: [0xC6,0xC6,0xC6,0xC6,0x6C,0x38,0x18,0x00],
  87: [0xC6,0xC6,0xD6,0xD6,0xFE,0xEE,0x6C,0x00],
  88: [0xC6,0x6C,0x38,0x38,0x38,0x6C,0xC6,0x00],
  89: [0xCC,0xCC,0xCC,0x78,0x30,0x30,0x78,0x00],
  90: [0xFE,0xC6,0x8C,0x18,0x32,0x66,0xFE,0x00],
  91: [0x3C,0x30,0x30,0x30,0x30,0x30,0x3C,0x00],
  92: [0xC0,0x60,0x30,0x18,0x0C,0x06,0x02,0x00],
  93: [0x3C,0x0C,0x0C,0x0C,0x0C,0x0C,0x3C,0x00],
  94: [0x10,0x38,0x6C,0xC6,0x00,0x00,0x00,0x00],
  95: [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0xFF],
  96: [0x30,0x18,0x0C,0x00,0x00,0x00,0x00,0x00],
  97: [0x00,0x00,0x78,0x0C,0x7C,0xCC,0x76,0x00],
  98: [0xE0,0x60,0x60,0x7C,0x66,0x66,0xDC,0x00],
  99: [0x00,0x00,0x78,0xCC,0xC0,0xCC,0x78,0x00],
  100: [0x1C,0x0C,0x0C,0x7C,0xCC,0xCC,0x76,0x00],
  101: [0x00,0x00,0x78,0xCC,0xFC,0xC0,0x78,0x00],
  102: [0x38,0x6C,0x60,0xF0,0x60,0x60,0xF0,0x00],
  103: [0x00,0x00,0x76,0xCC,0xCC,0x7C,0x0C,0xF8],
  104: [0xE0,0x60,0x6C,0x76,0x66,0x66,0xE6,0x00],
  105: [0x18,0x00,0x38,0x18,0x18,0x18,0x3C,0x00],
  106: [0x06,0x00,0x06,0x06,0x06,0x06,0x06,0x78],
  107: [0xE0,0x60,0x66,0x6C,0x78,0x6C,0xE6,0x00],
  108: [0x78,0x18,0x18,0x18,0x18,0x18,0x3C,0x00],
  109: [0x00,0x00,0xCC,0xFE,0xFE,0xD6,0xC6,0x00],
  110: [0x00,0x00,0xF8,0xCC,0xCC,0xCC,0xCC,0x00],
  111: [0x00,0x00,0x78,0xCC,0xCC,0xCC,0x78,0x00],
  112: [0x00,0x00,0xDC,0x66,0x66,0x7C,0x60,0xF0],
  113: [0x00,0x00,0x76,0xCC,0xCC,0x7C,0x0C,0x1E],
  114: [0x00,0x00,0xDC,0x76,0x60,0x60,0xF0,0x00],
  115: [0x00,0x00,0x7C,0xC0,0x78,0x0C,0xF8,0x00],
  116: [0x30,0x30,0xFC,0x30,0x30,0x30,0x1C,0x00],
  117: [0x00,0x00,0xCC,0xCC,0xCC,0xCC,0x76,0x00],
  118: [0x00,0x00,0xCC,0xCC,0xCC,0x6C,0x38,0x00],
  119: [0x00,0x00,0xC6,0xD6,0xD6,0xFE,0x6C,0x00],
  120: [0x00,0x00,0xC6,0x6C,0x38,0x6C,0xC6,0x00],
  121: [0x00,0x00,0xCC,0xCC,0xCC,0x7C,0x0C,0xF8],
  122: [0x00,0x00,0xFC,0x98,0x30,0x64,0xFC,0x00],
  123: [0x1E,0x30,0x30,0xE0,0x30,0x30,0x1E,0x00],
  124: [0x18,0x18,0x18,0x00,0x18,0x18,0x18,0x00],
  125: [0xE0,0x30,0x30,0x1C,0x30,0x30,0xE0,0x00],
  126: [0x73,0xDB,0xCE,0x00,0x00,0x00,0x00,0x00],
};

export type ShapeKind = "rect" | "ellipse" | "line" | "text";

export interface SceneShape {
  kind: ShapeKind;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  x2?: number;
  y2?: number;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
  visible?: boolean;
}

export interface Scene {
  width: number;
  height: number;
  background: string;
  shapes: SceneShape[];
}

function hexToRgba(hex: string | undefined, alpha = 1): [number, number, number, number] {
  if (!hex || hex === "transparent") return [0, 0, 0, 0];
  const clean = hex.replace("#", "");
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b, Math.round(alpha * 255)];
  }
  return [0, 0, 0, Math.round(alpha * 255)];
}

function crc32(buf: Uint8Array): number {
  let crc = 0 ^ (-1);
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xEDB88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ (-1)) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new Uint8Array(4);
  for (let i = 0; i < 4; i++) typeBytes[i] = type.charCodeAt(i);
  const len = new Uint8Array(4);
  const lenView = new DataView(len.buffer);
  lenView.setUint32(0, data.length, false);
  const crcInput = new Uint8Array(4 + data.length);
  crcInput.set(typeBytes);
  crcInput.set(data, 4);
  const crcBytes = new Uint8Array(4);
  const crcView = new DataView(crcBytes.buffer);
  crcView.setUint32(0, crc32(crcInput), false);
  const out = new Uint8Array(4 + 4 + data.length + 4);
  out.set(len);
  out.set(typeBytes, 4);
  out.set(data, 8);
  out.set(crcBytes, 8 + data.length);
  return out;
}

export function encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
  if (rgba.length !== width * height * 4) {
    throw new Error("RGBA buffer size does not match dimensions");
  }
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width, false);
  ihdrView.setUint32(4, height, false);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    raw.set(rgba.subarray(y * width * 4, y * width * 4 + width * 4), y * (1 + width * 4) + 1);
  }
  const compressed = deflateSync(raw);
  const ihdrChunk = chunk("IHDR", ihdr);
  const idatChunk = chunk("IDAT", compressed);
  const iendChunk = chunk("IEND", new Uint8Array(0));
  const total = signature.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
  const out = new Uint8Array(total);
  let offset = 0;
  out.set(signature); offset += signature.length;
  out.set(ihdrChunk, offset); offset += ihdrChunk.length;
  out.set(idatChunk, offset); offset += idatChunk.length;
  out.set(iendChunk, offset);
  return out;
}

function setPixel(rgba: Uint8Array, w: number, h: number, x: number, y: number, color: [number, number, number, number]): void {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  if (ix < 0 || iy < 0 || ix >= w || iy >= h) return;
  const idx = (iy * w + ix) * 4;
  const [sr, sg, sb, sa] = color;
  const [dr, dg, db, da] = [rgba[idx], rgba[idx+1], rgba[idx+2], rgba[idx+3]];
  if (sa === 0) return;
  const outA = sa + da * (1 - sa / 255);
  if (outA === 0) return;
  rgba[idx]   = Math.round((sr * sa + dr * da * (1 - sa / 255)) / outA);
  rgba[idx+1] = Math.round((sg * sa + dg * da * (1 - sa / 255)) / outA);
  rgba[idx+2] = Math.round((sb * sa + db * da * (1 - sa / 255)) / outA);
  rgba[idx+3] = Math.round(outA);
}

function drawRect(rgba: Uint8Array, w: number, h: number, shape: SceneShape): void {
  const x = shape.x;
  const y = shape.y;
  const rw = shape.width ?? 0;
  const rh = shape.height ?? 0;
  const fill = hexToRgba(shape.fill, shape.opacity ?? 1);
  const stroke = hexToRgba(shape.stroke, shape.opacity ?? 1);
  const sw = shape.strokeWidth ?? 0;

  if (fill[3] > 0) {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(w - 1, Math.ceil(x + rw));
    const y1 = Math.min(h - 1, Math.ceil(y + rh));
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        setPixel(rgba, w, h, px, py, fill);
      }
    }
  }

  if (stroke[3] > 0 && sw > 0) {
    const half = sw / 2;
    const x0 = Math.max(0, Math.floor(x - half));
    const y0 = Math.max(0, Math.floor(y - half));
    const x1 = Math.min(w - 1, Math.ceil(x + rw + half));
    const y1 = Math.min(h - 1, Math.ceil(y + rh + half));
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const top = Math.floor(y - half);
        const bottom = Math.ceil(y + rh + half);
        const left = Math.floor(x - half);
        const right = Math.ceil(x + rw + half);
        if (py >= top && py <= bottom && (px >= left && px <= right)) {
          const onH = py >= top && py <= top + sw - 1;
          const onV = px >= left && px <= left + sw - 1 || px >= right - sw + 1 && px <= right;
          if (onH || onV) setPixel(rgba, w, h, px, py, stroke);
        }
      }
    }
  }
}

function drawEllipse(rgba: Uint8Array, w: number, h: number, shape: SceneShape): void {
  const cx = shape.x + (shape.width ?? 0) / 2;
  const cy = shape.y + (shape.height ?? 0) / 2;
  const rx = (shape.width ?? 0) / 2;
  const ry = (shape.height ?? 0) / 2;
  const fill = hexToRgba(shape.fill, shape.opacity ?? 1);
  const stroke = hexToRgba(shape.stroke, shape.opacity ?? 1);
  const sw = shape.strokeWidth ?? 0;
  if (rx <= 0 && ry <= 0) return;

  const x0 = Math.max(0, Math.floor(cx - rx - sw));
  const y0 = Math.max(0, Math.floor(cy - ry - sw));
  const x1 = Math.min(w - 1, Math.ceil(cx + rx + sw));
  const y1 = Math.min(h - 1, Math.ceil(cy + ry + sw));

  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      const dx = px - cx;
      const dy = py - cy;
      const dist = (rx > 0 ? (dx * dx) / (rx * rx) : 0) + (ry > 0 ? (dy * dy) / (ry * ry) : 0);
      if (fill[3] > 0 && dist <= 1) setPixel(rgba, w, h, px, py, fill);
      if (stroke[3] > 0 && sw > 0 && dist > 1 && dist <= 1 + (sw / Math.max(rx, ry, 1))) {
        setPixel(rgba, w, h, px, py, stroke);
      }
    }
  }
}

function drawLine(rgba: Uint8Array, w: number, h: number, shape: SceneShape): void {
  const x1 = shape.x;
  const y1 = shape.y;
  const x2 = shape.x2 ?? x1;
  const y2 = shape.y2 ?? y1;
  const color = hexToRgba(shape.stroke || shape.fill, shape.opacity ?? 1);
  const sw = shape.strokeWidth ?? 1;
  if (color[3] === 0) return;

  let cx = Math.round(x1);
  let cy = Math.round(y1);
  const tx = Math.round(x2);
  const ty = Math.round(y2);
  const dx = Math.abs(tx - cx);
  const dy = Math.abs(ty - cy);
  const sx = cx < tx ? 1 : -1;
  const sy = cy < ty ? 1 : -1;
  let err = dx - dy;

  while (true) {
    for (let ox = -sw + 1; ox < sw; ox++) {
      for (let oy = -sw + 1; oy < sw; oy++) {
        setPixel(rgba, w, h, cx + ox, cy + oy, color);
      }
    }
    if (cx === tx && cy === ty) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx) { err += dx; cy += sy; }
  }
}

function drawText(rgba: Uint8Array, w: number, h: number, shape: SceneShape): void {
  if (!shape.text) return;
  const color = hexToRgba(shape.fill, shape.opacity ?? 1);
  if (color[3] === 0) return;
  const glyphWidth = 8;
  const glyphHeight = 8;
  const x = Math.floor(shape.x);
  const y = Math.floor(shape.y);
  for (let ci = 0; ci < shape.text.length; ci++) {
    const code = shape.text.charCodeAt(ci);
    const glyph = BITMAP_FONT[code];
    if (!glyph) continue;
    for (let row = 0; row < glyphHeight; row++) {
      const bits = glyph[row];
      for (let col = 0; col < glyphWidth; col++) {
        if (bits & (0x80 >> col)) {
          const px = x + ci * glyphWidth + col;
          const py = y + row;
          setPixel(rgba, w, h, px, py, color);
        }
      }
    }
  }
}

export function renderScene(scene: Scene): Uint8Array {
  const { width, height, shapes } = scene;
  if (width <= 0 || height <= 0) throw new Error("invalid scene dimensions");
  const maxPixels = 8192 * 8192;
  if (width * height > maxPixels) throw new Error("scene exceeds maximum pixel count");

  const rgba = new Uint8Array(width * height * 4);
  if (scene.background !== "transparent") {
    const bg = hexToRgba(scene.background, 1);
    for (let i = 0; i < rgba.length; i += 4) {
      rgba[i] = bg[0]; rgba[i+1] = bg[1]; rgba[i+2] = bg[2]; rgba[i+3] = bg[3];
    }
  }
  for (const shape of shapes) {
    if (shape.visible === false) continue;
    switch (shape.kind) {
      case "rect": drawRect(rgba, width, height, shape); break;
      case "ellipse": drawEllipse(rgba, width, height, shape); break;
      case "line": drawLine(rgba, width, height, shape); break;
      case "text": drawText(rgba, width, height, shape); break;
    }
  }
  return rgba;
}

export function renderPng(scene: Scene): Uint8Array {
  const rgba = renderScene(scene);
  return encodePng(scene.width, scene.height, rgba);
}

export function canvasToScene(board: {
  width: number;
  height: number;
  shapes: Array<{
    kind: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    text?: string;
    rotation?: number;
    visible?: boolean;
    locked?: boolean;
  }>;
}): Scene {
  const shapes: SceneShape[] = [];
  for (const s of board.shapes) {
    if (s.locked) continue;
    shapes.push({
      kind: s.kind as ShapeKind,
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
      radius: s.radius,
      text: s.text,
      rotation: s.rotation,
      visible: s.visible ?? true,
      fill: "#000000",
      stroke: "#000000",
      strokeWidth: 2,
      opacity: 1,
    });
  }
  return { width: board.width, height: board.height, background: "transparent", shapes };
}

export interface RenderJob {
  id: string;
  scene: string;
  samples: number;
  status: "queued" | "rendering" | "done";
}

export interface RendererOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Renderer {
  private readonly jobs = new Map<string, RenderJob>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: RendererOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  submit(scene: string, samples: number): RenderJob {
    const job: RenderJob = { id: newId("render"), scene, samples, status: "queued" };
    this.jobs.set(job.id, job);
    this.ledger.append({ type: "renderer.submitted", actor: "renderer", subject: job.id });
    return job;
  }

  list(): RenderJob[] {
    return Array.from(this.jobs.values());
  }
}
''').lstrip()

with open(path, 'w') as f:
    f.write(content)
print('Wrote renderer domain.ts')
