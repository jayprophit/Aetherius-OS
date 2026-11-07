/**
 * Storage for the local replica, the outbox and sync metadata.
 *
 * The engine does not care whether the bytes live in memory, in
 * localStorage, or in a file adapter supplied by a desktop host. It cares
 * that the store can answer four questions: what do I have, what have I not
 * sent, where is my cursor, and what did the last sync say.
 */

import type { SyncChange } from "./protocol.ts";

export interface SyncConflict {
  detectedAt: number;
  appId: string;
  collection: string;
  key: string;
  /** The value this device had and lost. */
  local: SyncChange;
  /** The value the server chose. */
  remote: SyncChange;
}

export interface SyncStore {
  getMeta(key: string): string | null;
  setMeta(key: string, value: string): void;
  getRecord(appId: string, collection: string, key: string): SyncChange | null;
  putRecord(change: SyncChange): void;
  listRecords(appId?: string, collection?: string): SyncChange[];
  enqueue(change: SyncChange): void;
  listOutbox(): SyncChange[];
  removeFromOutbox(revision: string): void;
  addConflict(conflict: SyncConflict): void;
  listConflicts(): SyncConflict[];
  clearConflicts(): void;
  reset(): void;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface PersistedState {
  version: 1;
  meta: Record<string, string>;
  records: SyncChange[];
  outbox: SyncChange[];
  conflicts: SyncConflict[];
}

function emptyState(): PersistedState {
  return { version: 1, meta: {}, records: [], outbox: [], conflicts: [] };
}

function recordKey(appId: string, collection: string, key: string): string {
  return JSON.stringify([appId, collection, key]);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * A state container shared by the memory and browser stores. Keeping one
 * implementation means the in-memory store used by tests cannot drift from
 * the store the browser uses.
 */
abstract class BaseSyncStore implements SyncStore {
  protected state: PersistedState;

  protected constructor(state: PersistedState) {
    this.state = state;
  }

  protected abstract persist(): void;

  getMeta(key: string): string | null {
    return this.state.meta[key] ?? null;
  }

  setMeta(key: string, value: string): void {
    this.state.meta[key] = value;
    this.persist();
  }

  getRecord(appId: string, collection: string, key: string): SyncChange | null {
    const wanted = recordKey(appId, collection, key);
    const found = this.state.records.find(
      (record) => recordKey(record.appId, record.collection, record.key) === wanted,
    );
    return found ? clone(found) : null;
  }

  putRecord(change: SyncChange): void {
    const wanted = recordKey(change.appId, change.collection, change.key);
    const index = this.state.records.findIndex(
      (record) => recordKey(record.appId, record.collection, record.key) === wanted,
    );
    if (index === -1) this.state.records.push(clone(change));
    else this.state.records[index] = clone(change);
    this.persist();
  }

  listRecords(appId?: string, collection?: string): SyncChange[] {
    return this.state.records
      .filter((record) => (appId ? record.appId === appId : true))
      .filter((record) => (collection ? record.collection === collection : true))
      .map((record) => clone(record));
  }

  enqueue(change: SyncChange): void {
    const wanted = recordKey(change.appId, change.collection, change.key);
    const next = this.state.outbox.filter(
      (record) => recordKey(record.appId, record.collection, record.key) !== wanted,
    );
    next.push(clone(change));
    this.state.outbox = next;
    this.persist();
  }

  listOutbox(): SyncChange[] {
    return this.state.outbox.map((record) => clone(record));
  }

  removeFromOutbox(revision: string): void {
    this.state.outbox = this.state.outbox.filter((record) => record.revision !== revision);
    this.persist();
  }

  addConflict(conflict: SyncConflict): void {
    // A conflict log is evidence, not a work queue. Keep it bounded so a
    // long-lived browser profile cannot fill its storage with old conflicts.
    this.state.conflicts.push(clone(conflict));
    if (this.state.conflicts.length > 50) {
      this.state.conflicts = this.state.conflicts.slice(-50);
    }
    this.persist();
  }

  listConflicts(): SyncConflict[] {
    return this.state.conflicts.map((conflict) => clone(conflict));
  }

  clearConflicts(): void {
    this.state.conflicts = [];
    this.persist();
  }

  reset(): void {
    this.state = emptyState();
    this.persist();
  }
}

export class MemorySyncStore extends BaseSyncStore {
  constructor() {
    super(emptyState());
  }

  protected persist(): void {
    // Memory is already the state.
  }
}

export const SYNC_STORAGE_KEY = "aetherius.sync.state.v1";

export class BrowserSyncStore extends BaseSyncStore {
  private readonly storage: KeyValueStorage | null;

  constructor(storage: KeyValueStorage | null = browserStorage()) {
    super(loadState(storage));
    this.storage = storage;
    if (!storage) {
      // A browser with storage blocked still gets an in-memory session. It
      // will not survive a reload, and the UI must say so.
    }
  }

  get persistent(): boolean {
    return this.storage !== null;
  }

  protected persist(): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(SYNC_STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Quota exceeded or storage disabled. The in-memory replica remains
      // usable; the sync status reports that persistence is unavailable.
    }
  }
}

function browserStorage(): KeyValueStorage | null {
  try {
    const storage = (globalThis as { localStorage?: KeyValueStorage }).localStorage;
    return storage ?? null;
  } catch {
    return null;
  }
}

function loadState(storage: KeyValueStorage | null): PersistedState {
  if (!storage) return emptyState();
  try {
    const raw = storage.getItem(SYNC_STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (parsed.version !== 1 || !Array.isArray(parsed.records)) return emptyState();
    return {
      version: 1,
      meta: parsed.meta && typeof parsed.meta === "object" ? parsed.meta : {},
      records: parsed.records.filter(isChangeish),
      outbox: Array.isArray(parsed.outbox) ? parsed.outbox.filter(isChangeish) : [],
      conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts : [],
    };
  } catch {
    return emptyState();
  }
}

function isChangeish(value: unknown): value is SyncChange {
  const change = value as Partial<SyncChange> | null;
  return Boolean(
    change &&
      typeof change.appId === "string" &&
      typeof change.collection === "string" &&
      typeof change.key === "string" &&
      typeof change.revision === "string" &&
      typeof change.updatedAt === "number" &&
      typeof change.deviceId === "string" &&
      typeof change.deleted === "boolean",
  );
}
