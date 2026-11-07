/**
 * Core repository interfaces and in-memory implementation.
 *
 * Owned by: app-kit
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
