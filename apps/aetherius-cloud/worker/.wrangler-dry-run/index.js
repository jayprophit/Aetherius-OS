var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../aetherius-sync/src/protocol.ts
var SYNC_LIMITS = {
  maxRecordsPerPush: 100,
  maxRecordsPerPull: 500,
  maxValueBytes: 64 * 1024,
  maxKeyLength: 512,
  maxIdLength: 64
};
var ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
function isSafeId(value) {
  return typeof value === "string" && value.length > 0 && value.length <= SYNC_LIMITS.maxIdLength && ID_PATTERN.test(value);
}
__name(isSafeId, "isSafeId");
function isSafeKey(value) {
  if (typeof value !== "string" || value.length === 0) return false;
  if (value.length > SYNC_LIMITS.maxKeyLength) return false;
  return !/[\u0000-\u001f\u007f]/.test(value);
}
__name(isSafeKey, "isSafeKey");
function canonicalJson(value, depth = 0) {
  if (depth > 32) throw new Error("value is nested too deeply");
  if (value === null) return "null";
  const type = typeof value;
  if (type === "string") return JSON.stringify(value);
  if (type === "boolean") return value ? "true" : "false";
  if (type === "number") {
    if (!Number.isFinite(value)) throw new Error("value contains a non-finite number");
    return JSON.stringify(value);
  }
  if (type === "undefined" || type === "function" || type === "symbol" || type === "bigint") {
    throw new Error(`value contains a non-JSON ${type}`);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item, depth + 1)).join(",")}]`;
  }
  const record = value;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key], depth + 1)}`).join(",")}}`;
}
__name(canonicalJson, "canonicalJson");
function hash64(input) {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= BigInt(input.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, "0");
}
__name(hash64, "hash64");
function revisionOf(change) {
  return hash64(
    [
      change.appId,
      change.collection,
      change.key,
      change.deleted ? "1" : "0",
      String(change.updatedAt),
      change.deviceId,
      canonicalJson(change.value)
    ].join("\n")
  );
}
__name(revisionOf, "revisionOf");
function validateChange(value) {
  const problems = [];
  const change = value;
  if (!change || typeof change !== "object") return ["not an object"];
  if (!isSafeId(change.appId)) problems.push("appId is invalid");
  if (!isSafeId(change.collection)) problems.push("collection is invalid");
  if (!isSafeKey(change.key)) problems.push("key is invalid");
  if (typeof change.deleted !== "boolean") problems.push("deleted must be boolean");
  if (typeof change.updatedAt !== "number" || !Number.isFinite(change.updatedAt) || change.updatedAt <= 0 || !Number.isInteger(change.updatedAt)) {
    problems.push("updatedAt must be a positive integer");
  }
  if (typeof change.deviceId !== "string" || change.deviceId.length === 0 || change.deviceId.length > 128 || /[\u0000-\u001f\u007f]/.test(change.deviceId)) {
    problems.push("deviceId is invalid");
  }
  if (typeof change.revision !== "string" || change.revision.length === 0) {
    problems.push("revision is missing");
  }
  try {
    const serialised = canonicalJson(change.value);
    if (new TextEncoder().encode(serialised).byteLength > SYNC_LIMITS.maxValueBytes) {
      problems.push("value is too large");
    }
  } catch (error) {
    problems.push(error instanceof Error ? error.message : "value is not JSON");
  }
  return problems;
}
__name(validateChange, "validateChange");
function winsOver(a, b) {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt;
  if (a.deleted !== b.deleted) return a.deleted;
  if (a.revision !== b.revision) return a.revision > b.revision;
  return a.deviceId > b.deviceId;
}
__name(winsOver, "winsOver");

// src/repository.ts
function address(tenant, change) {
  return JSON.stringify([tenant, change.appId, change.collection, change.key]);
}
__name(address, "address");
var MemorySyncRepository = class {
  constructor() {
    this.heads = /* @__PURE__ */ new Map();
    this.log = [];
    this.seq = 0;
  }
  static {
    __name(this, "MemorySyncRepository");
  }
  async apply(tenant, change) {
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
  async changesAfter(tenant, cursor, limit) {
    const all = this.log.filter((entry) => entry.tenant === tenant && entry.seq > cursor).sort((a, b) => a.seq - b.seq);
    const page = all.slice(0, limit + 1);
    const hasMore = page.length > limit;
    const visible = page.slice(0, limit);
    const last = visible[visible.length - 1];
    return {
      records: visible.map((entry) => ({ ...entry.change, seq: entry.seq })),
      cursor: last ? last.seq : cursor,
      hasMore
    };
  }
  async state(tenant) {
    const prefix = `[${JSON.stringify(tenant)},`;
    const heads = [...this.heads.entries()].filter(([key]) => key.startsWith(prefix)).map(([, head]) => head.change);
    const counts = /* @__PURE__ */ new Map();
    for (const change of heads) {
      if (change.deleted) continue;
      const key = `${change.appId}\0${change.collection}`;
      const existing = counts.get(key);
      if (existing) existing.records += 1;
      else counts.set(key, { appId: change.appId, collection: change.collection, records: 1 });
    }
    const seqs = this.log.filter((entry) => entry.tenant === tenant).map((entry) => entry.seq);
    return {
      cursor: seqs.length > 0 ? Math.max(...seqs) : 0,
      records: heads.filter((change) => !change.deleted).length,
      collections: [...counts.values()].sort(
        (a, b) => a.appId.localeCompare(b.appId) || a.collection.localeCompare(b.collection)
      )
    };
  }
  reset() {
    this.heads.clear();
    this.log.length = 0;
    this.seq = 0;
  }
};
function rowToChange(row) {
  return {
    appId: row.app_id,
    collection: row.collection,
    key: row.record_key,
    value: JSON.parse(row.value_json),
    revision: row.revision,
    updatedAt: row.updated_at,
    deleted: row.deleted === 1,
    deviceId: row.device_id
  };
}
__name(rowToChange, "rowToChange");
var D1SyncRepository = class {
  static {
    __name(this, "D1SyncRepository");
  }
  constructor(db) {
    this.db = db;
  }
  async apply(tenant, change) {
    const head = await this.readHead(tenant, change);
    if (head && head.change.revision === change.revision) {
      return { record: head.change, source: "same", seq: head.seq };
    }
    const valueJson = canonicalJson(change.value);
    const insertChange = this.db.prepare(
      `insert into sync_changes
          (tenant, app_id, collection, record_key, value_json, revision, updated_at, deleted, device_id, server_time)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      tenant,
      change.appId,
      change.collection,
      change.key,
      valueJson,
      change.revision,
      change.updatedAt,
      change.deleted ? 1 : 0,
      change.deviceId,
      Date.now()
    );
    const upsertHead = this.db.prepare(
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
           or (excluded.updated_at = sync_heads.updated_at and excluded.deleted = sync_heads.deleted and excluded.revision = sync_heads.revision and excluded.device_id > sync_heads.device_id)`
    ).bind(
      tenant,
      change.appId,
      change.collection,
      change.key,
      valueJson,
      change.revision,
      change.updatedAt,
      change.deleted ? 1 : 0,
      change.deviceId
    );
    await this.db.batch([insertChange, upsertHead]);
    const winner = await this.readHead(tenant, change);
    if (!winner) throw new Error("the head row disappeared after an upsert");
    return {
      record: winner.change,
      source: winner.change.revision === change.revision ? "incoming" : "server",
      seq: winner.seq
    };
  }
  async changesAfter(tenant, cursor, limit) {
    const result = await this.db.prepare(
      `select id, app_id, collection, record_key, value_json, revision, updated_at, deleted, device_id, 0 as change_id
         from sync_changes
         where tenant = ? and id > ?
         order by id asc
         limit ?`
    ).bind(tenant, cursor, limit + 1).all();
    const rows = result.results ?? [];
    const hasMore = rows.length > limit;
    const visible = rows.slice(0, limit);
    const last = visible[visible.length - 1];
    return {
      records: visible.map((row) => ({ ...rowToChange(row), seq: row.id })),
      cursor: last ? last.id : cursor,
      hasMore
    };
  }
  async state(tenant) {
    const maxRow = await this.db.prepare("select coalesce(max(id), 0) as cursor from sync_changes where tenant = ?").bind(tenant).first();
    const countRow = await this.db.prepare("select count(*) as records from sync_heads where tenant = ? and deleted = 0").bind(tenant).first();
    const groups = await this.db.prepare(
      `select app_id as appId, collection as collection, count(*) as records
         from sync_heads where tenant = ? and deleted = 0
         group by app_id, collection
         order by app_id asc, collection asc`
    ).bind(tenant).all();
    return {
      cursor: Number(maxRow?.cursor ?? 0),
      records: Number(countRow?.records ?? 0),
      collections: (groups.results ?? []).map((group) => ({
        appId: group.appId,
        collection: group.collection,
        records: Number(group.records)
      }))
    };
  }
  async readHead(tenant, change) {
    const row = await this.db.prepare(
      `select app_id, collection, record_key, value_json, revision, updated_at, deleted, device_id, change_id
         from sync_heads
         where tenant = ? and app_id = ? and collection = ? and record_key = ?`
    ).bind(tenant, change.appId, change.collection, change.key).first();
    if (!row) return null;
    return { change: rowToChange(row), seq: Number(row.change_id) };
  }
};

// src/index.ts
var SERVICE = "aetherius-sync";
var VERSION = "0.1.0";
var MAX_BODY_BYTES = 1024 * 1024;
var MIN_TOKEN_LENGTH = 16;
function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...headers
    }
  });
}
__name(json, "json");
function failure(status, code, message, headers = {}) {
  return json({ error: code, message }, status, headers);
}
__name(failure, "failure");
function tokenConfigured(env) {
  return typeof env.SYNC_TOKEN === "string" && env.SYNC_TOKEN.trim().length >= MIN_TOKEN_LENGTH;
}
__name(tokenConfigured, "tokenConfigured");
function constantTimeEqual(left, right) {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  const length = Math.max(a.length, b.length);
  let difference = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}
__name(constantTimeEqual, "constantTimeEqual");
function bearerToken(request) {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}
__name(bearerToken, "bearerToken");
function allowedOrigins(env) {
  return (env.ALLOWED_ORIGIN ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);
}
__name(allowedOrigins, "allowedOrigins");
function corsHeaders(request, env) {
  const headers = new Headers();
  const origin = request.headers.get("origin");
  const allowed = allowedOrigins(env);
  if (origin && allowed.includes(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
    headers.set("access-control-allow-headers", "authorization, content-type");
    headers.set("access-control-max-age", "86400");
    headers.set("vary", "origin");
  }
  return headers;
}
__name(corsHeaders, "corsHeaders");
function withCors(response, cors) {
  const headers = new Headers(response.headers);
  for (const [key, value] of cors.entries()) headers.set(key, value);
  return new Response(response.body, { status: response.status, headers });
}
__name(withCors, "withCors");
async function readJsonBody(request) {
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return { ok: false, response: failure(413, "BODY_TOO_LARGE", "Request body is larger than 1 MB.") };
  }
  if (!text.trim()) {
    return { ok: false, response: failure(400, "EMPTY_BODY", "A JSON body is required.") };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, response: failure(400, "MALFORMED_JSON", "The request body is not valid JSON.") };
  }
}
__name(readJsonBody, "readJsonBody");
function tenantOf(env) {
  const tenant = env.SYNC_TENANT?.trim();
  return tenant && tenant.length > 0 ? tenant : "default";
}
__name(tenantOf, "tenantOf");
async function handleRequest(request, env, repository) {
  const cors = corsHeaders(request, env);
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }), cors);
  }
  if (path === "/health" && request.method === "GET") {
    const health = {
      ok: true,
      service: SERVICE,
      version: VERSION,
      auth: tokenConfigured(env) ? "required" : "not-configured",
      time: Date.now()
    };
    return withCors(json(health), cors);
  }
  if (!path.startsWith("/v1/")) {
    return withCors(failure(404, "NOT_FOUND", "Unknown route."), cors);
  }
  if (!tokenConfigured(env)) {
    return withCors(
      failure(
        503,
        "SYNC_NOT_CONFIGURED",
        `Set the SYNC_TOKEN secret (at least ${MIN_TOKEN_LENGTH} characters) before using sync.`
      ),
      cors
    );
  }
  const provided = bearerToken(request);
  if (!provided || !constantTimeEqual(provided, env.SYNC_TOKEN)) {
    return withCors(failure(401, "UNAUTHORIZED", "A valid bearer token is required."), cors);
  }
  const repo = repository ?? (env.DB ? new D1SyncRepository(env.DB) : null);
  if (!repo) {
    return withCors(failure(503, "STORAGE_NOT_CONFIGURED", "The D1 binding is not configured."), cors);
  }
  const tenant = tenantOf(env);
  if (path === "/v1/sync/push" && request.method === "POST") {
    const parsed = await readJsonBody(request);
    if (parsed.ok === false) return withCors(parsed.response, cors);
    const body = parsed.value;
    if (typeof body.deviceId !== "string" || body.deviceId.length === 0 || body.deviceId.length > 128) {
      return withCors(failure(400, "INVALID_DEVICE", "deviceId is required."), cors);
    }
    if (!Array.isArray(body.records) || body.records.length === 0) {
      return withCors(failure(400, "INVALID_RECORDS", "records must be a non-empty array."), cors);
    }
    if (body.records.length > SYNC_LIMITS.maxRecordsPerPush) {
      return withCors(
        failure(400, "BATCH_TOO_LARGE", `At most ${SYNC_LIMITS.maxRecordsPerPush} records per push.`),
        cors
      );
    }
    const records = [];
    for (const [index, candidate] of body.records.entries()) {
      const problems = validateChange(candidate);
      if (problems.length > 0) {
        return withCors(
          failure(400, "INVALID_RECORD", `records[${index}]: ${problems.join("; ")}`),
          cors
        );
      }
      const change = candidate;
      const expected = revisionOf({
        appId: change.appId,
        collection: change.collection,
        key: change.key,
        value: change.value,
        deleted: change.deleted,
        updatedAt: change.updatedAt,
        deviceId: change.deviceId
      });
      if (expected !== change.revision) {
        return withCors(
          failure(400, "REVISION_MISMATCH", `records[${index}]: revision does not match content.`),
          cors
        );
      }
      records.push(change);
    }
    const results = [];
    for (const record of records) {
      results.push(await repo.apply(tenant, record));
    }
    const response = { results, serverTime: Date.now() };
    return withCors(json(response), cors);
  }
  if (path === "/v1/sync/pull" && request.method === "GET") {
    const cursorRaw = url.searchParams.get("cursor") ?? "0";
    const limitRaw = url.searchParams.get("limit") ?? "200";
    const cursor = Number(cursorRaw);
    const limit = Number(limitRaw);
    if (!Number.isInteger(cursor) || cursor < 0) {
      return withCors(failure(400, "INVALID_CURSOR", "cursor must be a non-negative integer."), cors);
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > SYNC_LIMITS.maxRecordsPerPull) {
      return withCors(
        failure(400, "INVALID_LIMIT", `limit must be between 1 and ${SYNC_LIMITS.maxRecordsPerPull}.`),
        cors
      );
    }
    const page = await repo.changesAfter(tenant, cursor, limit);
    const response = {
      records: page.records,
      cursor: page.cursor,
      hasMore: page.hasMore,
      serverTime: Date.now()
    };
    return withCors(json(response), cors);
  }
  if (path === "/v1/sync/state" && request.method === "GET") {
    const state = await repo.state(tenant);
    return withCors(json({ ...state, serverTime: Date.now() }), cors);
  }
  return withCors(failure(404, "NOT_FOUND", "Unknown route."), cors);
}
__name(handleRequest, "handleRequest");
var index_default = {
  fetch(request, env) {
    return handleRequest(request, env);
  }
};
export {
  D1SyncRepository,
  MemorySyncRepository,
  index_default as default,
  handleRequest
};
//# sourceMappingURL=index.js.map
