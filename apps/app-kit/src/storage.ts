/**
 * Storage adapter interface for Aetherius OS.
 *
 * Provides a unified storage contract that works in both Node.js (filesystem)
 * and browser (IndexedDB) environments. Domain services depend on this
 * interface, never on a specific backend.
 *
 * Owned by: app-kit
 */

export interface StorageAdapter {
  /** Read raw bytes. */
  read(key: string): Promise<Uint8Array | null>;
  /** Write raw bytes atomically. */
  write(key: string, data: Uint8Array): Promise<void>;
  /** Delete a stored entry. */
  delete(key: string): Promise<void>;
  /** List all stored keys, optionally filtered by prefix. */
  listKeys(prefix?: string): Promise<string[]>;
  /** Check whether a key exists. */
  exists(key: string): Promise<boolean>;
  /** Optional synchronous read for construction-time initialization. */
  readSync?(key: string): Uint8Array | null;
  /** Optional synchronous write for construction-time persistence. */
  writeSync?(key: string, data: Uint8Array): void;
}
