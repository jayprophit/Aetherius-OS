import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startHive } from "./server.mjs";

/**
 * The hive is the coordination substrate every agent shares. These tests use
 * a throwaway SQLite file and an ephemeral port, so they never touch the
 * owner's live hive database and can run in CI.
 */

let hive;
let base;

async function call(path, { method = "GET", body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  return { status: response.status, body: payload };
}

beforeAll(async () => {
  const dir = mkdtempSync(join(tmpdir(), "aetherius-hive-test-"));
  hive = startHive({ port: 0, dbPath: join(dir, "hive.db") });
  hive.testDir = dir;
  if (!hive.server.listening) {
    await new Promise((resolvePromise) => hive.server.once("listening", resolvePromise));
  }
  base = `http://127.0.0.1:${hive.port}`;
});

afterAll(() => {
  hive?.close();
  if (hive?.testDir) rmSync(hive.testDir, { recursive: true, force: true });
});

describe("hive", () => {
  it("reports health before any traffic", async () => {
    const { status, body } = await call("/health");
    expect(status).toBe(200);
    expect(body).toMatchObject({ ok: true, service: "aetherius-hive" });
    expect(body.agents).toBe(0);
  });

  it("registers agents and updates their heartbeat", async () => {
    const registered = await call("/agents/register", {
      method: "POST",
      body: { id: "kilo", kind: "kilo", protocol: "mcp", model: "auto", status: "idle" },
    });
    expect(registered.status).toBe(201);
    expect(registered.body.id).toBe("kilo");

    await call("/agents/register", {
      method: "POST",
      body: { id: "hermes", kind: "hermes", protocol: "cli", model: "solar-mini4:free" },
    });

    const beat = await call("/agents/heartbeat", {
      method: "POST",
      body: { id: "kilo", status: "working", model: "auto" },
    });
    expect(beat.status).toBe(200);
    expect(beat.body.status).toBe("working");

    const agents = await call("/agents");
    expect(agents.body.agents.map((agent) => agent.id)).toEqual(["hermes", "kilo"]);
  });

  it("delivers direct and broadcast messages with topic filtering", async () => {
    const direct = await call("/messages", {
      method: "POST",
      body: { sender: "supervisor", recipient: "kilo", topic: "ci", body: "verify the build" },
    });
    expect(direct.status).toBe(201);

    await call("/messages", {
      method: "POST",
      body: { sender: "supervisor", recipient: "*", topic: "general", body: "stand up" },
    });

    const forKilo = await call("/messages?since=0&to=kilo");
    expect(forKilo.body.messages).toHaveLength(2);

    const ciOnly = await call("/messages?since=0&to=kilo&topic=ci");
    expect(ciOnly.body.messages).toHaveLength(1);
    expect(ciOnly.body.messages[0].body).toBe("verify the build");

    const forHermes = await call("/messages?since=0&to=hermes");
    expect(forHermes.body.messages).toHaveLength(1);
    expect(forHermes.body.messages[0].body).toBe("stand up");
  });

  it("rejects an empty message", async () => {
    const { status, body } = await call("/messages", {
      method: "POST",
      body: { sender: "supervisor", body: "" },
    });
    expect(status).toBe(400);
    expect(body.error).toMatch(/body is required/);
  });

  it("runs the task lifecycle with single ownership", async () => {
    const created = await call("/tasks", {
      method: "POST",
      body: {
        created_by: "supervisor",
        title: "Regenerate source registry",
        priority: 1,
        files: ["docs/SOURCE-REGISTRY.yaml"],
      },
    });
    expect(created.status).toBe(201);
    const id = created.body.id;

    const claimed = await call(`/tasks/${id}/claim`, {
      method: "POST",
      body: { agent: "kilo" },
    });
    expect(claimed.status).toBe(200);
    expect(claimed.body.status).toBe("claimed");
    expect(claimed.body.assignee).toBe("kilo");

    const stolen = await call(`/tasks/${id}/claim`, {
      method: "POST",
      body: { agent: "hermes" },
    });
    expect(stolen.status).toBe(409);

    const refused = await call(`/tasks/${id}/update`, {
      method: "POST",
      body: { agent: "hermes", status: "done" },
    });
    expect(refused.status).toBe(403);

    const done = await call(`/tasks/${id}/update`, {
      method: "POST",
      body: { agent: "kilo", status: "done", result: "1149 documents", evidence: "npm test" },
    });
    expect(done.status).toBe(200);
    expect(done.body.status).toBe("done");
    expect(done.body.evidence).toBe("npm test");

    const completed = await call("/tasks?status=done");
    expect(completed.body.tasks.map((task) => task.id)).toEqual([id]);
  });

  it("records append-only work and auto-logs task transitions", async () => {
    const done = await call("/work", {
      method: "POST",
      body: {
        agent: "hermes",
        action: "research",
        status: "done",
        summary: "Checked free compute quotas",
        files: ["docs/FREE-COMPUTE-2026-11-08.md"],
        evidence: "targeted tests passed",
      },
    });
    expect(done.status).toBe(201);
    expect(done.body.agent).toBe("hermes");

    const pending = await call("/work", {
      method: "POST",
      body: { agent: "hermes", action: "research", status: "pending", summary: "Awaiting Kaggle owner gate" },
    });
    expect(pending.status).toBe(201);

    const invalid = await call("/work", {
      method: "POST",
      body: { agent: "hermes", action: "research", status: "someday", summary: "invalid" },
    });
    expect(invalid.status).toBe(400);

    const listed = await call("/work?agent=hermes");
    expect(listed.body.work).toHaveLength(2);
    expect(listed.body.work[0].summary).toBe("Awaiting Kaggle owner gate");

    const task = await call("/tasks", {
      method: "POST",
      body: { created_by: "kilo", title: "Verify work ledger", files: ["orchestration/hive"] },
    });
    const taskId = task.body.id;
    await call(`/tasks/${taskId}/claim`, { method: "POST", body: { agent: "kilo" } });
    await call(`/tasks/${taskId}/update`, {
      method: "POST",
      body: { agent: "kilo", status: "done", result: "green", evidence: "vitest" },
    });

    const taskWork = await call(`/work?task_id=${taskId}`);
    expect(taskWork.body.work.map((entry) => entry.status)).toEqual(["done", "in_progress", "pending"]);

    const summary = await call("/work/summary");
    expect(summary.status).toBe(200);
    expect(summary.body.totals).toBeGreaterThanOrEqual(5);
    expect(summary.body.pending).toBeGreaterThanOrEqual(1);
    expect(summary.body.by_agent.some((row) => row.agent === "kilo")).toBe(true);

    const status = await call("/status");
    expect(status.body.counts.work_done).toBeGreaterThanOrEqual(2);
  });

  it("leases the supervisor role atomically and expires stale holders", async () => {
    const first = await call("/leases/acquire", {
      method: "POST",
      body: { key: "supervisor.lease", owner: "opencode", model: "opencode/deepseek-v4.1-flash-free", ttl_seconds: 900 },
    });
    expect(first.status).toBe(200);
    expect(first.body.acquired).toBe(true);
    expect(first.body.lease.owner).toBe("opencode");

    const conflict = await call("/leases/acquire", {
      method: "POST",
      body: { key: "supervisor.lease", owner: "hermes", model: "upstage/solar-mini4:free", ttl_seconds: 900 },
    });
    expect(conflict.status).toBe(409);
    expect(conflict.body.lease.owner).toBe("opencode");

    const renew = await call("/leases/acquire", {
      method: "POST",
      body: { key: "supervisor.lease", owner: "opencode", model: "opencode/deepseek-v4.1-flash-free", ttl_seconds: 900 },
    });
    expect(renew.status).toBe(200);
    expect(renew.body.lease.acquired_at).toBe(first.body.lease.acquired_at);

    const wrongRelease = await call("/leases/release", {
      method: "POST",
      body: { key: "supervisor.lease", owner: "hermes" },
    });
    expect(wrongRelease.status).toBe(409);

    hive.db
      .prepare("UPDATE leases SET expires_at = ? WHERE key = ?")
      .run(new Date(Date.now() - 1000).toISOString(), "supervisor.lease");

    const expired = await call("/leases/acquire", {
      method: "POST",
      body: { key: "supervisor.lease", owner: "hermes", model: "upstage/solar-mini4:free", ttl_seconds: 900 },
    });
    expect(expired.status).toBe(200);
    expect(expired.body.lease.owner).toBe("hermes");

    const read = await call("/leases/supervisor.lease");
    expect(read.status).toBe(200);
    expect(read.body.owner).toBe("hermes");

    const released = await call("/leases/release", {
      method: "POST",
      body: { key: "supervisor.lease", owner: "hermes" },
    });
    expect(released.status).toBe(200);
    expect(released.body.released).toBe(true);
  });

  it("stores durable memory", async () => {
    const written = await call("/memory/release.gate", {
      method: "PUT",
      body: { owner: "supervisor", value: "NOT_RELEASABLE", tags: ["gate"] },
    });
    expect(written.status).toBe(200);

    const read = await call("/memory/release.gate");
    expect(read.status).toBe(200);
    expect(read.body.value).toBe("NOT_RELEASABLE");
    expect(read.body.owner).toBe("supervisor");
  });

  it("exposes an A2A agent card and JSON-RPC surface", async () => {
    const card = await call("/.well-known/agent-card.json");
    expect(card.status).toBe(200);
    expect(card.body.name).toBe("Aetherius Hive");

    const sent = await call("/a2a", {
      method: "POST",
      body: {
        jsonrpc: "2.0",
        id: "t1",
        method: "message/send",
        params: {
          message: { parts: [{ type: "text", text: "a2a hello" }] },
          metadata: { sender: "openclaw", recipient: "kilo", topic: "a2a" },
        },
      },
    });
    expect(sent.status).toBe(200);
    expect(sent.body.result.status.state).toBe("completed");

    const listed = await call("/a2a", {
      method: "POST",
      body: { jsonrpc: "2.0", id: "t2", method: "tasks/list", params: {} },
    });
    expect(listed.body.result.tasks.length).toBeGreaterThan(0);

    const unknown = await call("/a2a", {
      method: "POST",
      body: { jsonrpc: "2.0", id: "t3", method: "nonexistent" },
    });
    expect(unknown.body.error.code).toBe(-32601);
  });
});
