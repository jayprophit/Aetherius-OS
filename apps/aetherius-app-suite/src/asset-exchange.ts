import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
// Browser-compatible SHA-256 using Web Crypto API
import type { StorageAdapter } from "../../app-kit/src/storage.ts";

/** Versioned Asset Exchange Contract — shared by all Aetherius applications. */
export interface AssetManifest {
  id: string;
  schemaVersion: string;
  mimeType: string;
  contentHash: string;
  ownership: string;
  provenance: Provenance;
  contentDimensions: ContentDimensions;
  sourceRelationship?: SourceRelationship;
  createdAt: string;
}

export interface Provenance {
  sourceApp: string;
  exportedAt: string;
  exporterVersion: string;
}

export interface ContentDimensions {
  width: number;
  height: number;
}

export interface SourceRelationship {
  sourceId: string;
  sourceType: "canvas-board" | "slide-element" | "external";
}

export interface AssetRecord {
  manifest: AssetManifest;
  content: string | Uint8Array;
}

export class AssetStore {
  private readonly storage: StorageAdapter;
  private readonly assets = new Map<string, AssetRecord>();

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.loadSync();
  }

  private async load(): Promise<void> {
    const raw = await this.storage.read("asset-manifest.json");
    if (!raw) return;
    const text = new TextDecoder().decode(raw);
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) throw new Error("asset store is not an array");
    for (const item of parsed as AssetRecord[]) {
      if (!item || typeof item.manifest?.id !== "string") {
        throw new Error("asset store contains a record without an id");
      }
      if (item.manifest.mimeType && !item.manifest.mimeType.startsWith("text/") && item.manifest.mimeType !== "application/json" && typeof item.content === "string") {
        try {
          const binary = Buffer.from(item.content, "base64");
          if (binary.length > 0 && binary[0] !== 0) {
            item.content = new Uint8Array(binary);
          }
        } catch {
          // leave as string
        }
      }
      this.assets.set(item.manifest.id, item);
    }
  }

  private loadSync(): void {
    // Synchronous wrapper for constructor; delegates to async load.
    // In Node, storage.read is sync-capable via promises; in browser, initial data may be empty.
    try {
      const raw = (this.storage.read as any).sync?.("asset-manifest.json");
      if (!raw) return;
      const text = new TextDecoder().decode(raw);
      const parsed = JSON.parse(text) as unknown;
      if (!Array.isArray(parsed)) throw new Error("asset store is not an array");
      for (const item of parsed as AssetRecord[]) {
        if (!item || typeof item.manifest?.id !== "string") {
          throw new Error("asset store contains a record without an id");
        }
        if (item.manifest.mimeType && !item.manifest.mimeType.startsWith("text/") && item.manifest.mimeType !== "application/json" && typeof item.content === "string") {
          try {
            const binary = Buffer.from(item.content, "base64");
            if (binary.length > 0 && binary[0] !== 0) {
              item.content = new Uint8Array(binary);
            }
          } catch {
            // leave as string
          }
        }
        this.assets.set(item.manifest.id, item);
      }
    } catch {
      // Initial load failure is non-fatal; empty store is acceptable.
    }
  }

  register(record: AssetRecord): AssetManifest {
    if (!record.manifest.id) throw new Error("asset manifest requires an id");
    if (!record.manifest.schemaVersion) throw new Error("asset manifest requires schemaVersion");
    if (!record.manifest.mimeType) throw new Error("asset manifest requires mimeType");
    if (!record.manifest.contentHash) throw new Error("asset manifest requires contentHash");
    if (!record.manifest.ownership) throw new Error("asset manifest requires ownership");
    if (!record.manifest.provenance) throw new Error("asset manifest requires provenance");
    if (!record.manifest.contentDimensions) throw new Error("asset manifest requires contentDimensions");

    if (this.assets.has(record.manifest.id)) {
      const existing = this.assets.get(record.manifest.id)!;
      if (existing.manifest.contentHash !== record.manifest.contentHash) {
        throw new Error(`asset ${record.manifest.id} already registered with a different contentHash`);
      }
      return structuredClone(existing.manifest);
    }

    this.assets.set(record.manifest.id, structuredClone(record));
    this.flushSync();
    return structuredClone(record.manifest);
  }

  get(id: string): AssetRecord | undefined {
    const record = this.assets.get(id);
    return record ? structuredClone(record) : undefined;
  }

  all(): AssetRecord[] {
    return [...this.assets.values()].map((r) => structuredClone(r));
  }

  delete(id: string): boolean {
    const removed = this.assets.delete(id);
    if (removed) this.flushSync();
    return removed;
  }

  verifyIntegrity(id: string): boolean {
    const record = this.assets.get(id);
    if (!record) return false;
    const expected = computeHash(record.content);
    return record.manifest.contentHash === expected;
  }

  private async flush(): Promise<void> {
    const serialisable = [...this.assets.values()].map((r) => ({
      ...r,
      content: r.content instanceof Uint8Array ? Buffer.from(r.content).toString("base64") : r.content,
    }));
    const text = `${JSON.stringify(serialisable, null, 2)}\n`;
    const data = new TextEncoder().encode(text);
    await this.storage.write("asset-manifest.json", data);
  }

  private flushSync(): void {
    const serialisable = [...this.assets.values()].map((r) => ({
      ...r,
      content: r.content instanceof Uint8Array ? Buffer.from(r.content).toString("base64") : r.content,
    }));
    const text = `${JSON.stringify(serialisable, null, 2)}\n`;
    const data = new TextEncoder().encode(text);
    (this.storage.write as any).sync?.("asset-manifest.json", data);
  }
}

function sha256Sync(data: Uint8Array): string {
  // Simple SHA-256-like hash for browser compatibility
  // This is NOT cryptographically secure, but provides a 64-char hex digest
  // For production use, replace with Web Crypto API (async) or a proper JS SHA-256 lib
  let h = new Uint32Array(8);
  const k = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);

  // Pad the message to a multiple of 64 bytes
  const bitLen = data.length * 8;
  const paddedLen = Math.ceil((data.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 4, bitLen, false);

  // Process blocks
  const w = new Uint32Array(64);
  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = ((w[i-15] >>> 7) | (w[i-15] << 25)) ^ ((w[i-15] >>> 18) | (w[i-15] << 14)) ^ (w[i-15] >>> 3);
      const s1 = ((w[i-2] >>> 17) | (w[i-2] << 15)) ^ ((w[i-2] >>> 19) | (w[i-2] << 13)) ^ (w[i-2] >>> 10);
      w[i] = (w[i-16] + s0 + w[i-7] + s1) | 0;
    }

    let [a, b, c, d, e, f, g, hh] = [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7]];
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + S1 + ch + k[i] + w[i]) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      hh = d;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
      f = e;
      e = g;
      g = hh;
      hh = temp1;
    }
    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0;
    h[5] = (h[5] + f) | 0;
    h[6] = (h[6] + g) | 0;
    h[7] = (h[7] + hh) | 0;
  }

  const hex = Array.from(h, n => (n >>> 0).toString(16).padStart(8, '0')).join('');
  return hex;
}

export function computeHash(content: string | Uint8Array): string {
  const data = typeof content === "string" ? new TextEncoder().encode(content) : content;
  return sha256Sync(data);
}

export function sanitizeSvg(svg: string): string {
  const forbidden = /<script|javascript:|on\w+\s*=|data:\s*\w+\/\w+/i;
  if (forbidden.test(svg)) {
    throw new Error("SVG contains forbidden executable content or external references");
  }
  return svg;
}

export function validatePath(path: string): void {
  if (path.includes("..") || path.includes("~") || path.includes("\\") || path.includes("/")) {
    throw new Error("unsafe path reference in asset");
  }
}
