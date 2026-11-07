/**
 * Aetherius sync worker.
 *
 * Free-tier Cloudflare Worker in front of D1. It stores a head row per
 * (tenant, app, collection, key) and an append-only change log. The request
 * handler is dependency-injected so the same code is tested in Node against
 * an in-memory repository and deployed against D1.
 *
 * Security posture:
 *  - fail closed: if SYNC_TOKEN is not configured, protected routes return
 *    503 rather than serving an unauthenticated sync endpoint;
 *  - the token is compared in constant time;
 *  - request bodies are bounded;
 *  - CORS is opt-in via ALLOWED_ORIGIN;
 *  - every response is no-store and carries a restrictive content type.
 */

import {
  revisionOf,
  validateChange,
  SYNC_LIMITS,
  type SyncChange,
  type SyncHealth,
  type SyncPullResponse,
  type SyncPushResponse,
} from "../../../aetherius-sync/src/protocol.ts";
import {
  D1SyncRepository,
  MemorySyncRepository,
  type D1Database,
  type SyncRepository,
} from "./repository.ts";

export interface WorkerEnv {
  DB?: D1Database;
  BLOBS?: R2Bucket;
  SYNC_TOKEN?: string;
  SYNC_TENANT?: string;
  ALLOWED_ORIGIN?: string;
}

const SERVICE = "aetherius-sync";
const VERSION = "0.1.0";
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_BLOB_BYTES = 16 * 1024 * 1024;
const MIN_TOKEN_LENGTH = 16;

/** Minimal R2 bucket surface the worker needs. */
export interface R2Bucket {
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<{ body: ReadableStream | null; httpMetadata?: { contentType?: string }; size: number } | null>;
  head(key: string): Promise<{ size: number; httpMetadata?: { contentType?: string } } | null>;
  delete(key: string): Promise<void>;
}

/** In-memory blob store used by tests. */
export class MemoryBlobStore implements R2Bucket {
  private readonly objects = new Map<string, { data: Uint8Array; contentType: string }>();

  async put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown> {
    this.objects.set(key, { data: new Uint8Array(value), contentType: options?.httpMetadata?.contentType ?? "application/octet-stream" });
    return {};
  }

  async get(key: string): Promise<{ body: ReadableStream; httpMetadata: { contentType: string }; size: number } | null> {
    const found = this.objects.get(key);
    if (!found) return null;
    return {
      body: new Response(found.data).body as ReadableStream,
      httpMetadata: { contentType: found.contentType },
      size: found.data.byteLength,
    };
  }

  async head(key: string): Promise<{ size: number; httpMetadata: { contentType: string } } | null> {
    const found = this.objects.get(key);
    if (!found) return null;
    return { size: found.data.byteLength, httpMetadata: { contentType: found.contentType } };
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }
}

function isSafeBlobKey(key: string): boolean {
  if (key.length === 0 || key.length > 512) return false;
  if (key.includes("..") || key.startsWith("/") || key.includes("//")) return false;
  return !/[\u0000-\u001f\u007f\\]/.test(key);
}

function json(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...headers,
    },
  });
}

function failure(status: number, code: string, message: string, headers: HeadersInit = {}): Response {
  return json({ error: code, message }, status, headers);
}

function tokenConfigured(env: WorkerEnv): boolean {
  return typeof env.SYNC_TOKEN === "string" && env.SYNC_TOKEN.trim().length >= MIN_TOKEN_LENGTH;
}

function constantTimeEqual(left: string, right: string): boolean {
  // The comparison touches max(len) characters so the time does not depend
  // on where the first difference is. Length itself is not a secret.
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  const length = Math.max(a.length, b.length);
  let difference = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

function allowedOrigins(env: WorkerEnv): string[] {
  return (env.ALLOWED_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsHeaders(request: Request, env: WorkerEnv): Headers {
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

function withCors(response: Response, cors: Headers): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of cors.entries()) headers.set(key, value);
  return new Response(response.body, { status: response.status, headers });
}

async function readJsonBody(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return { ok: false, response: failure(413, "BODY_TOO_LARGE", "Request body is larger than 1 MB.") };
  }
  if (!text.trim()) {
    return { ok: false, response: failure(400, "EMPTY_BODY", "A JSON body is required.") };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, response: failure(400, "MALFORMED_JSON", "The request body is not valid JSON.") };
  }
}

function tenantOf(env: WorkerEnv): string {
  const tenant = env.SYNC_TENANT?.trim();
  return tenant && tenant.length > 0 ? tenant : "default";
}

/**
 * Handle one request. `repository` exists so tests can use a memory store;
 * production leaves it undefined and the D1 binding is used.
 */
export async function handleRequest(
  request: Request,
  env: WorkerEnv,
  repository?: SyncRepository,
): Promise<Response> {
  const cors = corsHeaders(request, env);
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }), cors);
  }

  if (path === "/health" && request.method === "GET") {
    const health: SyncHealth = {
      ok: true,
      service: SERVICE,
      version: VERSION,
      auth: tokenConfigured(env) ? "required" : "not-configured",
      time: Date.now(),
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
        `Set the SYNC_TOKEN secret (at least ${MIN_TOKEN_LENGTH} characters) before using sync.`,
      ),
      cors,
    );
  }

  const provided = bearerToken(request);
  if (!provided || !constantTimeEqual(provided, env.SYNC_TOKEN as string)) {
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
    const body = parsed.value as { deviceId?: unknown; records?: unknown };
    if (typeof body.deviceId !== "string" || body.deviceId.length === 0 || body.deviceId.length > 128) {
      return withCors(failure(400, "INVALID_DEVICE", "deviceId is required."), cors);
    }
    if (!Array.isArray(body.records) || body.records.length === 0) {
      return withCors(failure(400, "INVALID_RECORDS", "records must be a non-empty array."), cors);
    }
    if (body.records.length > SYNC_LIMITS.maxRecordsPerPush) {
      return withCors(
        failure(400, "BATCH_TOO_LARGE", `At most ${SYNC_LIMITS.maxRecordsPerPush} records per push.`),
        cors,
      );
    }

    const records: SyncChange[] = [];
    for (const [index, candidate] of body.records.entries()) {
      const problems = validateChange(candidate);
      if (problems.length > 0) {
        return withCors(
          failure(400, "INVALID_RECORD", `records[${index}]: ${problems.join("; ")}`),
          cors,
        );
      }
      const change = candidate as SyncChange;
      const expected = revisionOf({
        appId: change.appId,
        collection: change.collection,
        key: change.key,
        value: change.value,
        deleted: change.deleted,
        updatedAt: change.updatedAt,
        deviceId: change.deviceId,
      });
      if (expected !== change.revision) {
        return withCors(
          failure(400, "REVISION_MISMATCH", `records[${index}]: revision does not match content.`),
          cors,
        );
      }
      records.push(change);
    }

    const results: SyncPushResponse["results"] = [];
    for (const record of records) {
      results.push(await repo.apply(tenant, record));
    }
    const response: SyncPushResponse = { results, serverTime: Date.now() };
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
        cors,
      );
    }
    const page = await repo.changesAfter(tenant, cursor, limit);
    const response: SyncPullResponse = {
      records: page.records,
      cursor: page.cursor,
      hasMore: page.hasMore,
      serverTime: Date.now(),
    };
    return withCors(json(response), cors);
  }

  if (path === "/v1/sync/state" && request.method === "GET") {
    const state = await repo.state(tenant);
    return withCors(json({ ...state, serverTime: Date.now() }), cors);
  }

  // ------------------------------------------------------- blob store

  if (path.startsWith("/v1/blobs/")) {
    const key = decodeURIComponent(path.slice("/v1/blobs/".length));
    if (!isSafeBlobKey(key)) {
      return withCors(failure(400, "INVALID_KEY", "Blob keys must be 1-512 characters without traversal."), cors);
    }
    const blobs = env.BLOBS ?? null;
    if (!blobs) {
      return withCors(failure(503, "BLOB_NOT_CONFIGURED", "The R2 binding is not configured."), cors);
    }
    // Tenant-scope blob keys so one tenant cannot read another's blobs.
    const scoped = `${tenant}:${key}`;

    if (request.method === "PUT") {
      const body = await request.arrayBuffer();
      if (body.byteLength === 0 || body.byteLength > MAX_BLOB_BYTES) {
        return withCors(failure(400, "INVALID_SIZE", `Blob bodies must be 1 byte to ${MAX_BLOB_BYTES} bytes.`), cors);
      }
      const contentType = request.headers.get("content-type") || "application/octet-stream";
      await blobs.put(scoped, body, { httpMetadata: { contentType } });
      return withCors(json({ key, size: body.byteLength, serverTime: Date.now() }), cors);
    }

    if (request.method === "HEAD") {
      const meta = await blobs.head(scoped);
      if (!meta) return withCors(failure(404, "NOT_FOUND", "No blob with that key."), cors);
      return withCors(
        new Response(null, {
          status: 200,
          headers: {
            "content-length": String(meta.size),
            "content-type": meta.httpMetadata?.contentType ?? "application/octet-stream",
            "cache-control": "no-store",
          },
        }),
        cors,
      );
    }

    if (request.method === "GET") {
      const object = await blobs.get(scoped);
      if (!object) return withCors(failure(404, "NOT_FOUND", "No blob with that key."), cors);
      return withCors(
        new Response(object.body, {
          status: 200,
          headers: {
            "content-length": String(object.size),
            "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
            "cache-control": "no-store",
          },
        }),
        cors,
      );
    }

    if (request.method === "DELETE") {
      await blobs.delete(scoped);
      return withCors(json({ key, deleted: true, serverTime: Date.now() }), cors);
    }

    return withCors(failure(405, "METHOD_NOT_ALLOWED", `Method ${request.method} is not allowed on blobs.`), cors);
  }

  return withCors(failure(404, "NOT_FOUND", "Unknown route."), cors);
}

export default {
  fetch(request: Request, env: WorkerEnv): Promise<Response> {
    return handleRequest(request, env);
  },
};

export { MemorySyncRepository, D1SyncRepository };
