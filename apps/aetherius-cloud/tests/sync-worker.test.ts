import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { handleRequest, MemorySyncRepository, MemoryBlobStore } from "../worker/src/index.ts";
import { createChange, type SyncChange } from "../../aetherius-sync/src/protocol.ts";

const TOKEN = "test-token-0123456789";
const ORIGIN = "http://localhost:3000";

function env(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    SYNC_TOKEN: TOKEN,
    ALLOWED_ORIGIN: ORIGIN,
    ...overrides,
  };
}

function request(
  path: string,
  options: {
    method?: string;
    token?: string | null;
    body?: unknown;
    origin?: string;
    headers?: Record<string, string>;
  } = {},
): Request {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) headers.set("content-type", "application/json");
  if (options.token !== null) headers.set("authorization", `Bearer ${options.token ?? TOKEN}`);
  if (options.origin) headers.set("origin", options.origin);
  return new Request(`https://sync.test${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

function change(overrides: Partial<Parameters<typeof createChange>[0]> = {}): SyncChange {
  return createChange({
    appId: "aetherius-notes",
    collection: "notes",
    key: "note-1",
    value: { title: "Hello" },
    updatedAt: 1000,
    deviceId: "device-a",
    ...overrides,
  });
}

async function push(
  repo: MemorySyncRepository,
  records: SyncChange[],
  environment: Record<string, unknown> = env(),
): Promise<Response> {
  return handleRequest(
    request("/v1/sync/push", { method: "POST", body: { deviceId: "device-a", records } }),
    environment,
    repo,
  );
}

describe("sync worker", () => {
  it("answers health without a token", async () => {
    const response = await handleRequest(request("/health", { token: null }), env() as never);
    assert.equal(response.status, 200);
    const body = (await response.json()) as { ok: boolean; auth: string };
    assert.equal(body.ok, true);
    assert.equal(body.auth, "required");
  });

  it("fails closed when the token is not configured", async () => {
    const repo = new MemorySyncRepository();
    const response = await push(repo, [change()], env({ SYNC_TOKEN: "" }));
    assert.equal(response.status, 503);
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, "SYNC_NOT_CONFIGURED");
  });

  it("rejects a wrong token", async () => {
    const repo = new MemorySyncRepository();
    const response = await handleRequest(
      request("/v1/sync/push", {
        method: "POST",
        token: "wrong-token-000000000",
        body: { deviceId: "device-a", records: [change()] },
      }),
      env() as never,
      repo,
    );
    assert.equal(response.status, 401);
  });

  it("pushes, pulls and reports state", async () => {
    const repo = new MemorySyncRepository();
    const first = change();
    const pushed = await push(repo, [first]);
    assert.equal(pushed.status, 200);
    const pushBody = (await pushed.json()) as { results: Array<{ source: string; seq: number }> };
    assert.equal(pushBody.results[0].source, "incoming");
    assert.equal(pushBody.results[0].seq, 1);

    const pulled = await handleRequest(
      request("/v1/sync/pull?cursor=0&limit=10"),
      env() as never,
      repo,
    );
    assert.equal(pulled.status, 200);
    const pullBody = (await pulled.json()) as {
      records: Array<{ key: string; seq: number }>;
      cursor: number;
      hasMore: boolean;
    };
    assert.equal(pullBody.records.length, 1);
    assert.equal(pullBody.records[0].key, "note-1");
    assert.equal(pullBody.cursor, 1);
    assert.equal(pullBody.hasMore, false);

    const state = await handleRequest(request("/v1/sync/state"), env() as never, repo);
    const stateBody = (await state.json()) as { records: number; collections: unknown[] };
    assert.equal(stateBody.records, 1);
    assert.equal(stateBody.collections.length, 1);
  });

  it("treats an identical retry as idempotent", async () => {
    const repo = new MemorySyncRepository();
    const record = change();
    await push(repo, [record]);
    const retry = await push(repo, [record]);
    const body = (await retry.json()) as { results: Array<{ source: string }> };
    assert.equal(body.results[0].source, "same");
    const pulled = await handleRequest(
      request("/v1/sync/pull?cursor=0&limit=10"),
      env() as never,
      repo,
    );
    const pullBody = (await pulled.json()) as { records: unknown[] };
    assert.equal(pullBody.records.length, 1);
  });

  it("keeps the deterministic winner across a conflict", async () => {
    const repo = new MemorySyncRepository();
    const newer = change({ updatedAt: 2000, deviceId: "device-a", value: { title: "newer" } });
    const older = change({ updatedAt: 1000, deviceId: "device-b", value: { title: "older" } });
    await push(repo, [newer]);
    const response = await push(repo, [older]);
    const body = (await response.json()) as {
      results: Array<{ source: string; record: { value: { title: string } } }>;
    };
    assert.equal(body.results[0].source, "server");
    assert.equal(body.results[0].record.value.title, "newer");
  });

  it("rejects a revision that does not match content", async () => {
    const repo = new MemorySyncRepository();
    const record = { ...change(), revision: "0".repeat(16) };
    const response = await push(repo, [record]);
    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, "REVISION_MISMATCH");
  });

  it("rejects malformed records and cursors", async () => {
    const repo = new MemorySyncRepository();
    const malformed = await handleRequest(
      request("/v1/sync/push", {
        method: "POST",
        body: { deviceId: "device-a", records: [{ nope: true }] },
      }),
      env() as never,
      repo,
    );
    assert.equal(malformed.status, 400);

    const cursor = await handleRequest(
      request("/v1/sync/pull?cursor=-1"),
      env() as never,
      repo,
    );
    assert.equal(cursor.status, 400);
  });

  it("completes a CORS preflight for an allowed origin", async () => {
    const response = await handleRequest(
      request("/v1/sync/push", { method: "OPTIONS", token: null, origin: ORIGIN }),
      env() as never,
    );
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), ORIGIN);
  });

  it("does not emit a CORS header for an unknown origin", async () => {
    const repo = new MemorySyncRepository();
    const response = await handleRequest(
      request("/v1/sync/state", { origin: "https://evil.example" }),
      env() as never,
      repo,
    );
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });

  it("partitions tenants", async () => {
    const repo = new MemorySyncRepository();
    const pushed = await push(repo, [change()], env({ SYNC_TENANT: "one" }));
    assert.equal(pushed.status, 200);

    const empty = await handleRequest(
      request("/v1/sync/pull?cursor=0&limit=10"),
      env({ SYNC_TENANT: "two" }) as never,
      repo,
    );
    const body = (await empty.json()) as { records: unknown[] };
    assert.equal(body.records.length, 0);

    const own = await handleRequest(
      request("/v1/sync/pull?cursor=0&limit=10"),
      env({ SYNC_TENANT: "one" }) as never,
      repo,
    );
    const ownBody = (await own.json()) as { records: unknown[] };
    assert.equal(ownBody.records.length, 1);
  });

  it("keeps a tombstone in the log and out of the live count", async () => {
    const repo = new MemorySyncRepository();
    await push(repo, [change()]);
    const deleted = change({ updatedAt: 3000, deleted: true, value: null });
    const response = await push(repo, [deleted]);
    assert.equal(response.status, 200);
    const state = await handleRequest(request("/v1/sync/state"), env() as never, repo);
    const body = (await state.json()) as { records: number; cursor: number };
    assert.equal(body.records, 0);
    assert.equal(body.cursor, 2);
  });
});
