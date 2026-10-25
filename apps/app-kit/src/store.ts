import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * A minimal repository. The application services depend on this interface,
 * never on a database driver, so a slice can run in memory in a test and on a
 * JSON file on disk in the desktop host.
 */
export interface Entity {
  id: string;
}

export interface Repository<T extends Entity> {
  all(): T[];
  get(id: string): T | undefined;
  put(item: T): T;
  delete(id: string): boolean;
}

export class MemoryRepository<T extends Entity> implements Repository<T> {
  private readonly items = new Map<string, T>();

  constructor(seed: readonly T[] = []) {
    for (const item of seed) this.put(item);
  }

  all(): T[] {
    return [...this.items.values()];
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  put(item: T): T {
    if (!item.id) throw new Error("entity has no id");
    this.items.set(item.id, structuredClone(item));
    return item;
  }

  delete(id: string): boolean {
    return this.items.delete(id);
  }
}

/**
 * A JSON-file repository. Writes go to a sibling temporary file and are then
 * renamed, so a crash cannot leave a half-written store in place.
 */
export class JsonFileRepository<T extends Entity> implements Repository<T> {
  private readonly path: string;
  private items: Map<string, T>;

  constructor(path: string) {
    this.path = path;
    this.items = new Map();
    this.load();
  }

  private load(): void {
    if (!existsSync(this.path)) return;
    const raw = readFileSync(this.path, "utf8").trim();
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) throw new Error(`store is not an array: ${this.path}`);
    for (const item of parsed as T[]) {
      if (!item || typeof item.id !== "string") {
        throw new Error(`store contains an entity without an id: ${this.path}`);
      }
      this.items.set(item.id, item);
    }
  }

  private flush(): void {
    mkdirSync(dirname(this.path), { recursive: true });
    const temp = `${this.path}.tmp`;
    writeFileSync(temp, `${JSON.stringify([...this.items.values()], null, 2)}\n`, "utf8");
    renameSync(temp, this.path);
  }

  all(): T[] {
    return [...this.items.values()];
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  put(item: T): T {
    if (!item.id) throw new Error("entity has no id");
    this.items.set(item.id, structuredClone(item));
    this.flush();
    return item;
  }

  delete(id: string): boolean {
    const removed = this.items.delete(id);
    if (removed) this.flush();
    return removed;
  }
}
