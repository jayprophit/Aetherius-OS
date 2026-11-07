/**
 * The local sync engine.
 *
 * Local-first means the app never waits for the network. A write lands in
 * the local replica and the outbox immediately; the network is a background
 * detail. If the worker is unreachable the outbox simply stays full and the
 * next sync sends it.
 *
 * The engine is deliberately transport-agnostic and framework-free. The
 * browser settings panel, a desktop host and a test all drive the same code.
 */

import {
  createChange,
  validateChange,
  winnerOf,
  winsOver,
  type SyncChange,
  type SyncHealth,
  type SyncPullResponse,
  type SyncPushResponse,
} from "./protocol.ts";
import type { KeyValueStorage, SyncStore } from "./store.ts";
import type { SyncTransport, TransportResult } from "./transport.ts";

export interface SyncEngineOptions {
  store: SyncStore;
  transport: SyncTransport;
  deviceId: string;
  now?: () => number;
}

export interface SyncReport {
  ok: boolean;
  pushed: number;
  pulled: number;
  conflicts: number;
  cursor: number;
  pending: number;
  error?: string;
  code?: string;
}

export interface SyncStatus {
  deviceId: string;
  cursor: number;
  pending: number;
  records: number;
  conflicts: number;
  lastSyncAt: number | null;
  lastError: string | null;
  lastReport: SyncReport | null;
}

const META_CURSOR = "cursor";
const META_LAST_SYNC = "lastSyncAt";
const META_LAST_ERROR = "lastError";
const META_LAST_REPORT = "lastReport";
const DEVICE_KEY = "aetherius.sync.deviceId.v1";

export function getOrCreateDeviceId(storage: KeyValueStorage | null): string {
  if (storage) {
    try {
      const existing = storage.getItem(DEVICE_KEY);
      if (existing && /^[A-Za-z0-9._:-]{1,128}$/.test(existing)) return existing;
      const created = newDeviceId();
      storage.setItem(DEVICE_KEY, created);
      return created;
    } catch {
      // Fall through to an ephemeral id.
    }
  }
  return newDeviceId();
}

function newDeviceId(): string {
  const cryptoApi = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoApi?.randomUUID) return `device-${cryptoApi.randomUUID()}`;
  return `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function sameAddress(a: SyncChange, b: SyncChange): boolean {
  return a.appId === b.appId && a.collection === b.collection && a.key === b.key;
}

function recordCount(store: SyncStore): number {
  return store.listRecords().length;
}

export class SyncEngine {
  private readonly store: SyncStore;
  private readonly transport: SyncTransport;
  private readonly deviceId: string;
  private readonly now: () => number;
  private activeSync: Promise<SyncReport> | null = null;

  constructor(options: SyncEngineOptions) {
    if (!options.deviceId) throw new Error("a device id is required");
    this.store = options.store;
    this.transport = options.transport;
    this.deviceId = options.deviceId;
    this.now = options.now ?? (() => Date.now());
  }

  get device(): string {
    return this.deviceId;
  }

  /** Write a value locally and mark it for the next sync. */
  put(appId: string, collection: string, key: string, value: unknown): SyncChange {
    const change = createChange({
      appId,
      collection,
      key,
      value,
      updatedAt: Math.max(1, Math.floor(this.now())),
      deviceId: this.deviceId,
    });
    this.store.putRecord(change);
    this.store.enqueue(change);
    return change;
  }

  /** Tombstone a value locally and mark the tombstone for the next sync. */
  remove(appId: string, collection: string, key: string): SyncChange {
    const change = createChange({
      appId,
      collection,
      key,
      deleted: true,
      updatedAt: Math.max(1, Math.floor(this.now())),
      deviceId: this.deviceId,
    });
    this.store.putRecord(change);
    this.store.enqueue(change);
    return change;
  }

  get(appId: string, collection: string, key: string): SyncChange | null {
    return this.store.getRecord(appId, collection, key);
  }

  list(appId?: string, collection?: string): SyncChange[] {
    return this.store.listRecords(appId, collection);
  }

  /** Delete a local record without producing a tombstone. Local reset only. */
  forget(appId: string, collection: string, key: string): void {
    const existing = this.store.getRecord(appId, collection, key);
    if (!existing) return;
    const tombstone = createChange({
      appId,
      collection,
      key,
      deleted: true,
      updatedAt: Math.max(1, Math.floor(this.now())),
      deviceId: this.deviceId,
    });
    this.store.putRecord(tombstone);
    this.store.enqueue(tombstone);
  }

  status(): SyncStatus {
    return {
      deviceId: this.deviceId,
      cursor: Number(this.store.getMeta(META_CURSOR) ?? "0") || 0,
      pending: this.store.listOutbox().length,
      records: recordCount(this.store),
      conflicts: this.store.listConflicts().length,
      lastSyncAt: Number(this.store.getMeta(META_LAST_SYNC) ?? "0") || null,
      lastError: this.store.getMeta(META_LAST_ERROR) || null,
      lastReport: this.readLastReport(),
    };
  }

  async testConnection(signal?: AbortSignal): Promise<TransportResult<SyncHealth>> {
    return this.transport.health(signal);
  }

  /**
   * Push the outbox, then pull every change after the cursor.
   *
   * Concurrent callers share the in-flight run rather than issuing two
   * pushes for the same outbox.
   */
  sync(signal?: AbortSignal): Promise<SyncReport> {
    if (this.activeSync) return this.activeSync;
    this.activeSync = this.runSync(signal).finally(() => {
      this.activeSync = null;
    });
    return this.activeSync;
  }

  private async runSync(signal?: AbortSignal): Promise<SyncReport> {
    let pushed = 0;
    let pulled = 0;
    let conflicts = 0;

    const outbox = this.store.listOutbox();
    for (let index = 0; index < outbox.length; index += 100) {
      const batch = outbox.slice(index, index + 100);
      if (signal?.aborted) return this.finish(false, pushed, pulled, conflicts, "CANCELLED", "Sync cancelled.");
      const result = await this.transport.push({ deviceId: this.deviceId, records: batch }, signal);
      if (result.ok === false) {
        return this.finish(false, pushed, pulled, conflicts, result.code, result.error);
      }
      const applied = this.applyPush(batch, result.data);
      pushed += applied.pushed;
      conflicts += applied.conflicts;
    }

    let cursor = Number(this.store.getMeta(META_CURSOR) ?? "0") || 0;
    for (let round = 0; round < 20; round += 1) {
      if (signal?.aborted) return this.finish(false, pushed, pulled, conflicts, "CANCELLED", "Sync cancelled.");
      const result = await this.transport.pull(cursor, 200, signal);
      if (result.ok === false) {
        return this.finish(false, pushed, pulled, conflicts, result.code, result.error);
      }
      const applied = this.applyPull(result.data);
      pulled += applied.pulled;
      conflicts += applied.conflicts;
      cursor = result.data.cursor;
      this.store.setMeta(META_CURSOR, String(cursor));
      if (!result.data.hasMore) break;
    }

    return this.finish(true, pushed, pulled, conflicts);
  }

  private applyPush(
    batch: SyncChange[],
    response: SyncPushResponse,
  ): { pushed: number; conflicts: number } {
    let pushed = 0;
    let conflicts = 0;
    const byAddress = new Map<string, SyncChange>();
    for (const change of batch) {
      byAddress.set(`${change.appId}\u0000${change.collection}\u0000${change.key}`, change);
    }
    for (const result of response.results ?? []) {
      if (validateChange(result.record).length > 0) continue;
      const local = byAddress.get(
        `${result.record.appId}\u0000${result.record.collection}\u0000${result.record.key}`,
      );
      if (!local) continue;
      if (result.source === "server" && result.record.revision !== local.revision) {
        this.store.addConflict({
          detectedAt: this.now(),
          appId: local.appId,
          collection: local.collection,
          key: local.key,
          local,
          remote: result.record,
        });
        conflicts += 1;
      }
      this.store.putRecord(result.record);
      this.store.removeFromOutbox(local.revision);
      pushed += 1;
    }
    return { pushed, conflicts };
  }

  private applyPull(response: SyncPullResponse): { pulled: number; conflicts: number } {
    let pulled = 0;
    let conflicts = 0;
    const outboxRevisions = new Set(this.store.listOutbox().map((change) => change.revision));
    for (const remote of response.records ?? []) {
      if (validateChange(remote).length > 0) continue;
      const local = this.store.getRecord(remote.appId, remote.collection, remote.key);
      if (!local || local.revision === remote.revision) {
        this.store.putRecord(remote);
        this.store.removeFromOutbox(local?.revision ?? remote.revision);
        pulled += 1;
        continue;
      }
      if (winsOver(remote, local)) {
        if (outboxRevisions.has(local.revision)) {
          this.store.addConflict({
            detectedAt: this.now(),
            appId: remote.appId,
            collection: remote.collection,
            key: remote.key,
            local,
            remote,
          });
          conflicts += 1;
        }
        this.store.putRecord(remote);
        this.store.removeFromOutbox(local.revision);
        outboxRevisions.delete(local.revision);
        pulled += 1;
      }
      // The local value wins. Its pending change stays in the outbox and
      // will be pushed by the next run; the cursor still advances.
    }
    return { pulled, conflicts };
  }

  private finish(
    ok: boolean,
    pushed: number,
    pulled: number,
    conflicts: number,
    code?: string,
    error?: string,
  ): SyncReport {
    const report: SyncReport = {
      ok,
      pushed,
      pulled,
      conflicts,
      cursor: Number(this.store.getMeta(META_CURSOR) ?? "0") || 0,
      pending: this.store.listOutbox().length,
    };
    if (code) report.code = code;
    if (error) report.error = error;
    this.store.setMeta(META_LAST_SYNC, String(this.now()));
    this.store.setMeta(META_LAST_ERROR, error ?? "");
    this.store.setMeta(META_LAST_REPORT, JSON.stringify(report));
    return report;
  }

  private readLastReport(): SyncReport | null {
    const raw = this.store.getMeta(META_LAST_REPORT);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SyncReport;
    } catch {
      return null;
    }
  }
}

/** Merge two changes without a store. Exposed for tests and tooling. */
export function resolveConflict(local: SyncChange, remote: SyncChange): SyncChange {
  return winnerOf(local, remote);
}
