/** Durable Persistence Adapter — connects all interface services to file-backed storage.
 * Added to close P1 persistence gap across notes/calendar/photos/browser/settings/etc. */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { nowIso, newId } from "../../app-kit/src/index.ts";

export interface DurableRecord { id: string; updatedAt: string; [key: string]: any; }
export interface DurableState {
  [key: string]: any;
  version: string;
  updatedAt: string;
}

const DATA_DIR = process.env.AETHERIUS_DATA_DIR || join(process.cwd(), ".aetherius-data");
const DATA_FILE = join(DATA_DIR, "durable-state.json");

function ensureDir(p: string) { try { mkdirSync(p, { recursive: true }); } catch { /* ignore */ } }

export function loadDurable(): DurableState {
  ensureDir(DATA_DIR);
  if (!existsSync(DATA_FILE)) return { version: "1.0.0", updatedAt: nowIso() };
  return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
}

export function saveDurable(s: DurableState) {
  ensureDir(DATA_DIR);
  s.updatedAt = nowIso();
  s.version = s.version || "1.0.0";
  writeFileSync(DATA_FILE, JSON.stringify(s, null, 2), "utf-8");
}

export class DurableStore {
  constructor(private key: string) {}
  private state = loadDurable();
  private getCollection(): DurableRecord[] {
    if (!this.state[this.key]) this.state[this.key] = [];
    return this.state[this.key];
  }
  all(): DurableRecord[] { return this.getCollection(); }
  find(id: string): DurableRecord | undefined {
    return this.getCollection().find(r => r.id === id);
  }
  save(record: DurableRecord): DurableRecord {
    const coll = this.getCollection();
    const idx = coll.findIndex(r => r.id === record.id);
    record.updatedAt = nowIso();
    if (record.id === undefined || record.id === null || record.id === "") {
      record.id = newId("rec");
    }
    if (idx >= 0) { coll[idx] = record; } else { coll.push(record); }
    saveDurable(this.state);
    return record;
  }
  remove(id: string): boolean {
    const before = this.getCollection().length;
    this.state[this.key] = this.getCollection().filter(r => r.id !== id);
    saveDurable(this.state);
    return this.state[this.key].length < before;
  }
  persist() { saveDurable(this.state); }
}
