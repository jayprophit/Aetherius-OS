/**
 * Repository boundary for the sync worker.
 *
 * The request handler knows nothing about D1. Tests drive the same handler
 * against an in-memory repository, and production drives it against D1 with
 * the same contract. The two implementations must agree on one rule: the
 * head row is the winner, and the change log is append-only.
 */

import { canonicalJson, winsOver, type SyncChange } from "../../../aetherius-sync/src/protocol.ts";

export interface HeadRecord {
  change: SyncChange;
  seq: number;
}

export interface ApplyResult {
  record: SyncChange;
  source: "incoming" | "server" | "same";
  seq: number;
}

export interface ChangesPage {
  records: Array<SyncChange & { seq: number }>;
  cursor: number;
  hasMore: boolean;
}

export interface RepositoryState {
  cursor: number;
  records: number;
  collections: Array<{ appId: string; collection: string; records: number }>;
}

export interface SyncRepository {
  apply(tenant: string, change: SyncChange): Promise<ApplyResult>;
  changesAfter(tenant: string, cursor: number, limit: number): Promise<ChangesPage>;
  state(tenant: string): Promise<RepositoryState>;
}

function address(tenant: string, change: SyncChange): string {
  return JSON.stringify([tenant, change.appId, change.collection, change.key]);
}

/** In-memory repository used by tests and local tooling. */
export class MemorySyncRepository implements SyncRepository {
  private readonly heads = new Map<string, HeadRecord>();
  private readonly log: Array<{ tenant: string; change: SyncChange; seq: number }> = [];
  private seq = 0;

  async apply(tenant: string, change: SyncChange): Promise<ApplyResult> {
    const key = address(tenant, change);
    const head = this.heads.get(key) ?? null;
    if (head && head.change.revision === change.revision) {
      return { record: head.change, source: "same", seq: head.seq };
    }
    this.seq += 1;
    const seq = this.seq;
    this.log.push({ tenant, change, seq });
    if (!head || winsOver(change, head.change)) {
      const next = { change, seq };
      this.heads.set(key, next);
      return { record: change, source: "incoming", seq };
    }
    return { record: head.change, source: "server", seq: head.seq };
  }

  async changesAfter(tenant: string, cursor: number, limit: number): Promise<ChangesPage> {
    const all = this.log
      .filter((entry) => entry.tenant === tenant && entry.seq > cursor)
      .sort((a, b) => a.seq - b.seq);
    const page = all.slice(0, limit + 1);
    const hasMore = page.length > limit;
    const visible = page.slice(0, limit);
    const last = visible[visible.length - 1];
    return {
      records: visible.map((entry) => ({ ...entry.change, seq: entry.seq })),
      cursor: last ? last.seq : cursor,
      hasMore,
    };
  }

  async state(tenant: string): Promise<RepositoryState> {
    const prefix = `[${JSON.stringify(tenant)},`;
    const heads = [...this.heads.entries()]
      .filter(([key]) => key.startsWith(prefix))
      .map(([, head]) => head.change);
    const counts = new Map<string, { appId: string; collection: string; records: number }>();
    for (const change of heads) {
      if (change.deleted) continue;
      const key = `${change.appId}\u0000${change.collection}`;
      const existing = counts.get(key);
      if (existing) existing.records += 1;
      else counts.set(key, { appId: change.appId, collection: change.collection, records: 1 });
    }
    const seqs = this.log.filter((entry) => entry.tenant === tenant).map((entry) => entry.seq);
    return {
      cursor: seqs.length > 0 ? Math.max(...seqs) : 0,
      records: heads.filter((change) => !change.deleted).length,
      collections: [...counts.values()].sort(
        (a, b) => a.appId.localeCompare(b.appId) || a.collection.localeCompare(b.collection),
      ),
    };
  }

  reset(): void {
    this.heads.clear();
    this.log.length = 0;
    this.seq = 0;
  }
}

/* ------------------------------------------------------------ D1 binding */

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta?: { last_row_id?: number; changes?: number };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

interface HeadRow {
  app_id: string;
  collection: string;
  record_key: string;
  value_json: string;
  revision: string;
  updated_at: number;
  deleted: number;
  device_id: string;
  change_id: number;
}

interface ChangeRow extends HeadRow {
  id: number;
}

function rowToChange(row: HeadRow): SyncChange {
  return {
    appId: row.app_id,
    collection: row.collection,
    key: row.record_key,
    value: JSON.parse(row.value_json) as unknown,
    revision: row.revision,
    updatedAt: row.updated_at,
    deleted: row.deleted === 1,
    deviceId: row.device_id,
  };
}

export class D1SyncRepository implements SyncRepository {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async apply(tenant: string, change: SyncChange): Promise<ApplyResult> {
    const head = await this.readHead(tenant, change);
    if (head && head.change.revision === change.revision) {
      return { record: head.change, source: "same", seq: head.seq };
    }

    const valueJson = canonicalJson(change.value);
    const insertChange = this.db
      .prepare(
        `insert into sync_changes
          (tenant, app_id, collection, record_key, value_json, revision, updated_at, deleted, device_id, server_time)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        tenant,
        change.appId,
        change.collection,
        change.key,
        valueJson,
        change.revision,
        change.updatedAt,
        change.deleted ? 1 : 0,
        change.deviceId,
        Date.now(),
      );

    const upsertHead = this.db
      .prepare(
        `insert into sync_heads
          (tenant, app_id, collection, record_key, value_json, revision, updated_at, deleted, device_id, change_id)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, last_insert_rowid())
         on conflict (tenant, app_id, collection, record_key) do update set
           value_json = excluded.value_json,
           revision = excluded.revision,
           updated_at = excluded.updated_at,
           deleted = excluded.deleted,
           device_id = excluded.device_id,
           change_id = excluded.change_id
         where
           excluded.updated_at > sync_heads.updated_at
           or (excluded.updated_at = sync_heads.updated_at and excluded.deleted > sync_heads.deleted)
           or (excluded.updated_at = sync_heads.updated_at and excluded.deleted = sync_heads.deleted and excluded.revision > sync_heads.revision)
           or (excluded.updated_at = sync_heads.updated_at and excluded.deleted = sync_heads.deleted and excluded.revision = sync_heads.revision and excluded.device_id > sync_heads.device_id)`,
      )
      .bind(
        tenant,
        change.appId,
        change.collection,
        change.key,
        valueJson,
        change.revision,
        change.updatedAt,
        change.deleted ? 1 : 0,
        change.deviceId,
      );

    // One batch is one transaction. The change log gets the attempt even when
    // the attempt loses; the head only moves when the deterministic ordering
    // says it should. Clients resolve the log with the same ordering.
    await this.db.batch([insertChange, upsertHead]);
    const winner = await this.readHead(tenant, change);
    if (!winner) throw new Error("the head row disappeared after an upsert");
    return {
      record: winner.change,
      source: winner.change.revision === change.revision ? "incoming" : "server",
      seq: winner.seq,
    };
  }

  async changesAfter(tenant: string, cursor: number, limit: number): Promise<ChangesPage> {
    const result = await this.db
      .prepare(
        `select id, app_id, collection, record_key, value_json, revision, updated_at, deleted, device_id, 0 as change_id
         from sync_changes
         where tenant = ? and id > ?
         order by id asc
         limit ?`,
      )
      .bind(tenant, cursor, limit + 1)
      .all<ChangeRow>();
    const rows = result.results ?? [];
    const hasMore = rows.length > limit;
    const visible = rows.slice(0, limit);
    const last = visible[visible.length - 1];
    return {
      records: visible.map((row) => ({ ...rowToChange(row), seq: row.id })),
      cursor: last ? last.id : cursor,
      hasMore,
    };
  }

  async state(tenant: string): Promise<RepositoryState> {
    const maxRow = await this.db
      .prepare("select coalesce(max(id), 0) as cursor from sync_changes where tenant = ?")
      .bind(tenant)
      .first<{ cursor: number }>();
    const countRow = await this.db
      .prepare("select count(*) as records from sync_heads where tenant = ? and deleted = 0")
      .bind(tenant)
      .first<{ records: number }>();
    const groups = await this.db
      .prepare(
        `select app_id as appId, collection as collection, count(*) as records
         from sync_heads where tenant = ? and deleted = 0
         group by app_id, collection
         order by app_id asc, collection asc`,
      )
      .bind(tenant)
      .all<{ appId: string; collection: string; records: number }>();
    return {
      cursor: Number(maxRow?.cursor ?? 0),
      records: Number(countRow?.records ?? 0),
      collections: (groups.results ?? []).map((group) => ({
        appId: group.appId,
        collection: group.collection,
        records: Number(group.records),
      })),
    };
  }

  private async readHead(tenant: string, change: SyncChange): Promise<HeadRecord | null> {
    const row = await this.db
      .prepare(
        `select app_id, collection, record_key, value_json, revision, updated_at, deleted, device_id, change_id
         from sync_heads
         where tenant = ? and app_id = ? and collection = ? and record_key = ?`,
      )
      .bind(tenant, change.appId, change.collection, change.key)
      .first<HeadRow>();
    if (!row) return null;
    return { change: rowToChange(row), seq: Number(row.change_id) };
  }
}
