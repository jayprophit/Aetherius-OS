import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  MemorySyncStore,
  SyncEngine,
  canonicalJson,
  createChange,
  getOrCreateDeviceId,
  revisionOf,
  validateChange,
  winsOver,
  type SyncChange,
} from "../src/index.ts";
import { MemorySyncRepository } from "../../aetherius-cloud/worker/src/repository.ts";
import type { SyncHealth, SyncPullResponse, SyncPushResponse } from "../src/protocol.ts";
import type { SyncTransport, TransportResult } from "../src/transport.ts";

class RepoTransport implements SyncTransport {
  private readonly repo: MemorySyncRepository;
  private readonly tenant: string;
  online = true;

  constructor(repo: MemorySyncRepository, tenant = "default") {
    this.repo = repo;
    this.tenant = tenant;
  }

  async health(): Promise<TransportResult<SyncHealth>> {
    return {
      ok: true,
      data: { ok: true, service: "aetherius-sync", version: "test", auth: "required", time: Date.now() },
    };
  }

  async push(request: { deviceId: string; records: SyncChange[] }): Promise<TransportResult<SyncPushResponse>> {
    if (!this.online) {
      return { ok: false, status: null, code: "NETWORK", error: "offline" };
    }
    const results = [];
    for (const record of request.records) results.push(await this.repo.apply(this.tenant, record));
    return { ok: true, data: { results, serverTime: Date.now() } };
  }

  async pull(cursor: number, limit = 200): Promise<TransportResult<SyncPullResponse>> {
    if (!this.online) {
      return { ok: false, status: null, code: "NETWORK", error: "offline" };
    }
    const page = await this.repo.changesAfter(this.tenant, cursor, limit);
    return {
      ok: true,
      data: { ...page, serverTime: Date.now() },
    };
  }
}

function clock(start = 1_000): () => number {
  let value = start;
  return () => {
    value += 1;
    return value;
  };
}

describe("sync protocol", () => {
  it("canonicalises object keys and hashes consistently", () => {
    assert.equal(canonicalJson({ b: 1, a: [true, null] }), '{"a":[true,null],"b":1}');
    assert.equal(canonicalJson({ a: 1 }), canonicalJson({ a: 1 }));
    assert.notEqual(canonicalJson({ a: 1 }), canonicalJson({ a: 2 }));
    assert.throws(() => canonicalJson({ a: undefined }), /non-JSON/);
    assert.throws(() => canonicalJson({ a: Number.NaN }), /non-finite/);
  });

  it("recomputes the same revision for the same content", () => {
    const input = {
      appId: "aetherius-notes",
      collection: "notes",
      key: "note-1",
      value: { title: "A", body: "B" },
      deleted: false,
      updatedAt: 1000,
      deviceId: "device-a",
    };
    assert.equal(revisionOf(input), revisionOf({ ...input }));
  });

  it("validates unsafe ids, oversized values and missing revisions", () => {
    const change = createChange({
      appId: "aetherius-notes",
      collection: "notes",
      key: "note-1",
      value: { text: "hello" },
      updatedAt: 1000,
      deviceId: "device-a",
    });
    assert.deepEqual(validateChange(change), []);
    assert.ok(validateChange({ ...change, appId: "Bad App" }).length > 0);
    assert.ok(validateChange({ ...change, revision: "" }).length > 0);
    assert.ok(validateChange({ ...change, value: "x".repeat(70_000) }).length > 0);
  });

  it("orders writes deterministically", () => {
    const base = {
      appId: "a",
      collection: "c",
      key: "k",
      value: {},
      deleted: false,
      updatedAt: 10,
      deviceId: "d",
    };
    const older = createChange(base);
    const newer = createChange({ ...base, updatedAt: 11, deviceId: "e" });
    assert.equal(winsOver(newer, older), true);
    assert.equal(winsOver(older, newer), false);

    const value = createChange({ ...base, updatedAt: 10 });
    const tombstone = createChange({ ...base, updatedAt: 10, deleted: true });
    assert.equal(winsOver(tombstone, value), true);
  });

  it("creates a stable device id per storage", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      removeItem: (key: string) => void data.delete(key),
    };
    const first = getOrCreateDeviceId(storage);
    const second = getOrCreateDeviceId(storage);
    assert.equal(first, second);
    assert.match(first, /^device-/);
  });
});

describe("sync engine", () => {
  it("writes locally and sends the outbox on sync", async () => {
    const repo = new MemorySyncRepository();
    const store = new MemorySyncStore();
    const engine = new SyncEngine({
      store,
      transport: new RepoTransport(repo),
      deviceId: "device-a",
      now: clock(),
    });

    engine.put("aetherius-notes", "notes", "note-1", { title: "Hello" });
    assert.equal(engine.status().pending, 1);
    assert.equal(engine.status().records, 1);

    const report = await engine.sync();
    assert.equal(report.ok, true);
    assert.equal(report.pushed, 1);
    assert.equal(engine.status().pending, 0);
    assert.equal(engine.status().cursor, 1);
    assert.equal(engine.status().lastError, null);
  });

  it("pulls remote records into the local replica", async () => {
    const repo = new MemorySyncRepository();
    const remote = new SyncEngine({
      store: new MemorySyncStore(),
      transport: new RepoTransport(repo),
      deviceId: "device-remote",
      now: clock(5000),
    });
    remote.put("aetherius-notes", "notes", "note-1", { title: "From remote" });
    await remote.sync();

    const local = new SyncEngine({
      store: new MemorySyncStore(),
      transport: new RepoTransport(repo),
      deviceId: "device-local",
      now: clock(),
    });
    const report = await local.sync();
    assert.equal(report.ok, true);
    assert.equal(report.pulled, 1);
    assert.deepEqual(local.get("aetherius-notes", "notes", "note-1")?.value, { title: "From remote" });
  });

  it("keeps the outbox when offline and drains it later", async () => {
    const repo = new MemorySyncRepository();
    const transport = new RepoTransport(repo);
    const engine = new SyncEngine({
      store: new MemorySyncStore(),
      transport,
      deviceId: "device-a",
      now: clock(),
    });
    engine.put("aetherius-notes", "notes", "note-1", { title: "Draft" });
    transport.online = false;
    const failed = await engine.sync();
    assert.equal(failed.ok, false);
    assert.equal(engine.status().pending, 1);
    assert.match(engine.status().lastError ?? "", /offline/);

    transport.online = true;
    const recovered = await engine.sync();
    assert.equal(recovered.ok, true);
    assert.equal(recovered.pushed, 1);
    assert.equal(engine.status().pending, 0);
  });

  it("resolves a concurrent edit deterministically and records the loser", async () => {
    const repo = new MemorySyncRepository();
    const transportA = new RepoTransport(repo);
    const transportB = new RepoTransport(repo);
    const a = new SyncEngine({
      store: new MemorySyncStore(),
      transport: transportA,
      deviceId: "device-a",
      now: () => 2000,
    });
    const b = new SyncEngine({
      store: new MemorySyncStore(),
      transport: transportB,
      deviceId: "device-b",
      now: () => 2000,
    });

    a.put("aetherius-notes", "notes", "note-1", { title: "A" });
    b.put("aetherius-notes", "notes", "note-1", { title: "B" });
    await a.sync();
    const report = await b.sync();

    assert.equal(report.ok, true);
    // Equal timestamps: the greater revision wins. The losing device keeps
    // the winner and records what it lost.
    const winner = a.get("aetherius-notes", "notes", "note-1");
    const after = b.get("aetherius-notes", "notes", "note-1");
    assert.deepEqual(after?.value, winner?.value);
    assert.equal(b.status().pending, 0);
    assert.equal(b.status().conflicts, 1);
  });

  it("does not resurrect a deleted record during a pull", async () => {
    const repo = new MemorySyncRepository();
    const writer = new SyncEngine({
      store: new MemorySyncStore(),
      transport: new RepoTransport(repo),
      deviceId: "device-writer",
      now: clock(9000),
    });
    writer.put("aetherius-notes", "notes", "note-1", { title: "Temporary" });
    await writer.sync();
    writer.remove("aetherius-notes", "notes", "note-1");
    await writer.sync();

    const reader = new SyncEngine({
      store: new MemorySyncStore(),
      transport: new RepoTransport(repo),
      deviceId: "device-reader",
      now: clock(),
    });
    await reader.sync();
    assert.equal(reader.get("aetherius-notes", "notes", "note-1")?.deleted, true);
  });

  it("advances the cursor without replaying applied changes", async () => {
    const repo = new MemorySyncRepository();
    const transport = new RepoTransport(repo);
    const writer = new SyncEngine({
      store: new MemorySyncStore(),
      transport,
      deviceId: "device-writer",
      now: clock(3000),
    });
    writer.put("aetherius-notes", "notes", "a", { n: 1 });
    writer.put("aetherius-notes", "notes", "b", { n: 2 });
    await writer.sync();

    const reader = new SyncEngine({
      store: new MemorySyncStore(),
      transport: new RepoTransport(repo),
      deviceId: "device-reader",
      now: clock(),
    });
    const first = await reader.sync();
    assert.equal(first.pulled, 2);
    const second = await reader.sync();
    assert.equal(second.pulled, 0);
  });

  it("shares one in-flight sync for concurrent callers", async () => {
    const repo = new MemorySyncRepository();
    const engine = new SyncEngine({
      store: new MemorySyncStore(),
      transport: new RepoTransport(repo),
      deviceId: "device-a",
      now: clock(),
    });
    engine.put("aetherius-notes", "notes", "a", { n: 1 });
    const [first, second] = await Promise.all([engine.sync(), engine.sync()]);
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    assert.equal(engine.status().pending, 0);
    assert.equal(engine.status().lastError, null);
    assert.equal(engine.status().cursor, 1);
  });

  it("reports a health result", async () => {
    const repo = new MemorySyncRepository();
    const engine = new SyncEngine({
      store: new MemorySyncStore(),
      transport: new RepoTransport(repo),
      deviceId: "device-a",
    });
    const health = await engine.testConnection();
    assert.equal(health.ok, true);
  });
});
