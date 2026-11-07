/**
 * Node.js filesystem-backed storage adapter.
 *
 * Owned by: app-kit
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export class NodeFsStorage {
  private readonly root: string;

  constructor(root: string) {
    this.root = root;
    mkdirSync(this.root, { recursive: true });
  }

  async read(key: string): Promise<Uint8Array | null> {
    const path = this.resolve(key);
    if (!existsSync(path)) return null;
    const buf = readFileSync(path);
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }

  readSync(key: string): Uint8Array | null {
    const path = this.resolve(key);
    if (!existsSync(path)) return null;
    const buf = readFileSync(path);
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }

  async write(key: string, data: Uint8Array): Promise<void> {
    this.writeSync(key, data);
  }

  writeSync(key: string, data: Uint8Array): void {
    const path = this.resolve(key);
    mkdirSync(dirname(path), { recursive: true });
    const tmp = `${path}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    writeFileSync(tmp, Buffer.from(data));
    try {
      renameSync(tmp, path);
    } catch {
      writeFileSync(path, Buffer.from(data));
      unlinkSync(tmp);
    }
  }

  async delete(key: string): Promise<void> {
    const path = this.resolve(key);
    if (existsSync(path)) unlinkSync(path);
  }

  async listKeys(prefix?: string): Promise<string[]> {
    const keys: string[] = [];
    const walk = (dir: string) => {
      if (!existsSync(dir)) return;
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const full = `${dir}/${entry}`;
        const stat = existsSync(full) ? statSync(full) : null;
        if (stat?.isDirectory()) {
          walk(full);
        } else {
          const rel = full.slice(this.root.length + 1);
          if (!prefix || rel.startsWith(prefix)) keys.push(rel);
        }
      }
    };
    walk(this.root);
    return keys;
  }

  async exists(key: string): Promise<boolean> {
    return existsSync(this.resolve(key));
  }

  private resolve(key: string): string {
    if (key.includes("..") || key.includes("~")) {
      throw new Error(`unsafe storage key: ${key}`);
    }
    return `${this.root}/${key}`;
  }
}
