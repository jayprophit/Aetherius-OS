/**
 * Aetherius Hive — local agent message bus, task board and shared memory.
 *
 * One SQLite database, one localhost HTTP API, one SSE stream. Every agent
 * reaches the same state through MCP, HTTP or the CLI. No cloud dependency,
 * no secret storage: credentials never enter this database.
 *
 *   node orchestration/hive/server.mjs
 *   HIVE_PORT=7317 HIVE_DB=... node orchestration/hive/server.mjs
 */

import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEFAULT_DB = join(ROOT, "orchestration", "hive", "hive.db");
const now = () => new Date().toISOString();

const SCHEMA = `
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  protocol TEXT,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'idle',
  metadata TEXT,
  registered_at TEXT NOT NULL,
  last_seen TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL DEFAULT '*',
  topic TEXT NOT NULL DEFAULT 'general',
  correlation_id TEXT,
  reply_to INTEGER,
  body TEXT NOT NULL,
  metadata TEXT
);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient, id);
CREATE INDEX IF NOT EXISTS idx_messages_topic ON messages(topic, id);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  assignee TEXT,
  title TEXT NOT NULL,
  detail TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority INTEGER NOT NULL DEFAULT 3,
  files TEXT,
  result TEXT,
  evidence TEXT
);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status, priority);

CREATE TABLE IF NOT EXISTS memory (
  key TEXT PRIMARY KEY,
  updated_at TEXT NOT NULL,
  owner TEXT NOT NULL,
  value TEXT NOT NULL,
  tags TEXT
);

CREATE TABLE IF NOT EXISTS work_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  agent TEXT NOT NULL,
  task_id TEXT,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  files TEXT,
  evidence TEXT,
  metadata TEXT
);
CREATE INDEX IF NOT EXISTS idx_work_agent ON work_log(agent, id);
CREATE INDEX IF NOT EXISTS idx_work_status ON work_log(status, id);
CREATE INDEX IF NOT EXISTS idx_work_task ON work_log(task_id, id);

CREATE TABLE IF NOT EXISTS leases (
  key TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  model TEXT,
  acquired_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  metadata TEXT
);
`;

function openDb(path) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  return db;
}

function readBody(req, limit = 1_048_576) {
  return new Promise((resolvePromise, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) return resolvePromise({});
      try {
        resolvePromise(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,PUT,OPTIONS",
  });
  res.end(payload);
}

function parseLimit(value, fallback = 50, max = 500) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.min(Math.floor(number), max) : fallback;
}

export function startHive({ port = Number(process.env.HIVE_PORT || 7317), dbPath = process.env.HIVE_DB || DEFAULT_DB } = {}) {
  const db = openDb(dbPath);
  const streams = new Set();
  const startedAt = now();
  let messageCount = 0;

  function broadcast(type, payload) {
    const frame = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const stream of streams) {
      try {
        stream.write(frame);
      } catch {
        streams.delete(stream);
      }
    }
  }

  const insertMessage = db.prepare(
    `INSERT INTO messages (ts, sender, recipient, topic, correlation_id, reply_to, body, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  function createMessage(input) {
    const sender = String(input.sender || "unknown").slice(0, 120);
    const recipient = String(input.recipient || "*").slice(0, 120);
    const topic = String(input.topic || "general").slice(0, 120);
    const body = String(input.body ?? "").slice(0, 262_144);
    if (!body) throw new Error("message body is required");
    const info = insertMessage.run(
      now(),
      sender,
      recipient,
      topic,
      input.correlation_id ? String(input.correlation_id).slice(0, 120) : null,
      input.reply_to == null ? null : Number(input.reply_to),
      body,
      input.metadata ? JSON.stringify(input.metadata) : null
    );
    const message = db.prepare("SELECT * FROM messages WHERE id = ?").get(info.lastInsertRowid);
    messageCount += 1;
    broadcast("message", message);
    return message;
  }

  function listMessages({ since = 0, to, topic, limit = 50 } = {}) {
    const clauses = ["id > ?"];
    const params = [Number(since) || 0];
    if (to) {
      clauses.push("(recipient = ? OR recipient = '*')");
      params.push(String(to));
    }
    if (topic) {
      clauses.push("topic = ?");
      params.push(String(topic));
    }
    params.push(parseLimit(limit));
    return db
      .prepare(`SELECT * FROM messages WHERE ${clauses.join(" AND ")} ORDER BY id ASC LIMIT ?`)
      .all(...params);
  }

  function listTasks({ status, assignee, limit = 100 } = {}) {
    const clauses = [];
    const params = [];
    if (status) {
      clauses.push("status = ?");
      params.push(String(status));
    }
    if (assignee) {
      clauses.push("assignee = ?");
      params.push(String(assignee));
    }
    params.push(parseLimit(limit, 100, 500));
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    return db
      .prepare(`SELECT * FROM tasks ${where} ORDER BY priority ASC, created_at ASC LIMIT ?`)
      .all(...params);
  }

  function getTask(id) {
    return db.prepare("SELECT * FROM tasks WHERE id = ?").get(String(id));
  }

  const WORK_STATUSES = new Set(["done", "pending", "blocked", "in_progress", "info", "failed"]);
  const insertWork = db.prepare(
    `INSERT INTO work_log (ts, agent, task_id, action, status, summary, files, evidence, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  function recordWork(input) {
    const agent = String(input.agent || "").trim().slice(0, 120);
    const action = String(input.action || "note").trim().slice(0, 120);
    const status = String(input.status || "info").trim();
    const summary = String(input.summary ?? "").trim().slice(0, 4000);
    if (!agent) throw new Error("agent is required");
    if (!action) throw new Error("action is required");
    if (!WORK_STATUSES.has(status)) {
      throw new Error(`status must be one of ${[...WORK_STATUSES].join(", ")}`);
    }
    if (!summary) throw new Error("summary is required");
    const info = insertWork.run(
      now(),
      agent,
      input.task_id ? String(input.task_id).slice(0, 120) : null,
      action,
      status,
      summary,
      input.files ? JSON.stringify(input.files) : null,
      input.evidence ? String(input.evidence).slice(0, 8000) : null,
      input.metadata ? JSON.stringify(input.metadata) : null
    );
    const row = db.prepare("SELECT * FROM work_log WHERE id = ?").get(info.lastInsertRowid);
    broadcast("work", row);
    return row;
  }

  function listWork({ agent, status, task_id, since = 0, limit = 100 } = {}) {
    const clauses = ["id > ?"];
    const params = [Number(since) || 0];
    if (agent) {
      clauses.push("agent = ?");
      params.push(String(agent));
    }
    if (status) {
      clauses.push("status = ?");
      params.push(String(status));
    }
    if (task_id) {
      clauses.push("task_id = ?");
      params.push(String(task_id));
    }
    params.push(parseLimit(limit, 100, 500));
    return db
      .prepare(`SELECT * FROM work_log WHERE ${clauses.join(" AND ")} ORDER BY id DESC LIMIT ?`)
      .all(...params);
  }

  function workSummary() {
    const by_status = db
      .prepare("SELECT status, COUNT(*) AS n FROM work_log GROUP BY status ORDER BY status")
      .all();
    const by_agent = db
      .prepare(
        `SELECT agent, status, COUNT(*) AS n, MAX(ts) AS last_ts
         FROM work_log GROUP BY agent, status ORDER BY agent, status`
      )
      .all();
    const latest = db
      .prepare(
        `SELECT w.* FROM work_log w
         JOIN (SELECT agent, MAX(id) AS id FROM work_log GROUP BY agent) last
           ON last.id = w.id
         ORDER BY w.agent`
      )
      .all();
    const open_tasks = db
      .prepare("SELECT status, COUNT(*) AS n FROM tasks GROUP BY status ORDER BY status")
      .all();
    return {
      ok: true,
      generated_at: now(),
      totals: db.prepare("SELECT COUNT(*) AS n FROM work_log").get().n,
      by_status,
      by_agent,
      latest,
      tasks: open_tasks,
      pending: db
        .prepare(
          "SELECT COUNT(*) AS n FROM work_log WHERE status IN ('pending', 'in_progress', 'blocked', 'failed')"
        )
        .get().n,
    };
  }

  function getLease(key) {
    return db.prepare("SELECT * FROM leases WHERE key = ?").get(String(key));
  }

  function listLeases() {
    return db.prepare("SELECT * FROM leases ORDER BY key").all();
  }

  function acquireLease({ key = "supervisor.lease", owner, model, ttl_seconds = 900, force = false, metadata } = {}) {
    const cleanOwner = String(owner || "").trim().slice(0, 120);
    if (!cleanOwner) throw new Error("owner is required");
    const leaseKey = String(key || "supervisor.lease").slice(0, 120);
    const ttl = Math.min(Math.max(Number(ttl_seconds) || 900, 30), 86400);
    const stamp = now();
    const expires = new Date(Date.now() + ttl * 1000).toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
      const current = getLease(leaseKey);
      const active = current && Date.parse(current.expires_at) > Date.now();
      if (active && current.owner !== cleanOwner && force !== true) {
        db.exec("ROLLBACK");
        return { acquired: false, lease: current };
      }
      db.prepare(
        `INSERT INTO leases (key, owner, model, acquired_at, expires_at, metadata)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           owner=excluded.owner,
           model=excluded.model,
           acquired_at=CASE WHEN leases.owner = excluded.owner THEN leases.acquired_at ELSE excluded.acquired_at END,
           expires_at=excluded.expires_at,
           metadata=excluded.metadata`
      ).run(
        leaseKey,
        cleanOwner,
        model ? String(model).slice(0, 200) : null,
        stamp,
        expires,
        metadata ? JSON.stringify(metadata) : null
      );
      db.exec("COMMIT");
      const lease = getLease(leaseKey);
      broadcast("lease", lease);
      return { acquired: true, lease };
    } catch (error) {
      try {
        db.exec("ROLLBACK");
      } catch {
        /* already rolled back */
      }
      throw error;
    }
  }

  function releaseLease({ key = "supervisor.lease", owner } = {}) {
    const leaseKey = String(key || "supervisor.lease").slice(0, 120);
    const current = getLease(leaseKey);
    if (!current) return { released: false, reason: "not-found" };
    if (current.owner !== String(owner || "")) return { released: false, reason: "owner-mismatch", lease: current };
    db.prepare("DELETE FROM leases WHERE key = ?").run(leaseKey);
    broadcast("lease", { key: leaseKey, released: true });
    return { released: true, key: leaseKey };
  }

  function agentCard() {
    return {
      name: "Aetherius Hive",
      description:
        "Local agent-to-agent message bus, shared task board and durable memory for the Aetherius build.",
      url: `http://127.0.0.1:${server.address()?.port || port}/a2a`,
      version: "0.1.0",
      protocolVersion: "0.2.5",
      capabilities: { streaming: false, pushNotifications: false, stateTransitionHistory: false },
      defaultInputModes: ["text/plain", "application/json"],
      defaultOutputModes: ["text/plain", "application/json"],
      skills: [
        {
          id: "hive",
          name: "Agent coordination",
          description: "Send messages, claim tasks, record evidence and share durable memory.",
          tags: ["coordination", "tasks", "memory"],
        },
      ],
    };
  }

  const server = createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "content-type",
        "access-control-allow-methods": "GET,POST,PUT,OPTIONS",
      });
      return res.end();
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
    const path = url.pathname;

    try {
      if (req.method === "GET" && path === "/health") {
        return json(res, 200, {
          ok: true,
          service: "aetherius-hive",
          started_at: startedAt,
          agents: db.prepare("SELECT COUNT(*) AS n FROM agents").get().n,
          messages: db.prepare("SELECT COUNT(*) AS n FROM messages").get().n,
          tasks: db.prepare("SELECT COUNT(*) AS n FROM tasks").get().n,
          work: db.prepare("SELECT COUNT(*) AS n FROM work_log").get().n,
          leases: db.prepare("SELECT COUNT(*) AS n FROM leases").get().n,
        });
      }

      if (req.method === "GET" && path === "/status") {
        return json(res, 200, {
          ok: true,
          started_at: startedAt,
          streams: streams.size,
          counts: {
            agents: db.prepare("SELECT COUNT(*) AS n FROM agents").get().n,
            messages: db.prepare("SELECT COUNT(*) AS n FROM messages").get().n,
            tasks_open: db.prepare("SELECT COUNT(*) AS n FROM tasks WHERE status = 'open'").get().n,
            tasks_claimed: db.prepare("SELECT COUNT(*) AS n FROM tasks WHERE status = 'claimed'").get().n,
            tasks_done: db.prepare("SELECT COUNT(*) AS n FROM tasks WHERE status = 'done'").get().n,
            tasks_blocked: db.prepare("SELECT COUNT(*) AS n FROM tasks WHERE status = 'blocked'").get().n,
            work_done: db.prepare("SELECT COUNT(*) AS n FROM work_log WHERE status = 'done'").get().n,
            work_pending: db
              .prepare("SELECT COUNT(*) AS n FROM work_log WHERE status IN ('pending', 'in_progress')")
              .get().n,
            work_blocked: db
              .prepare("SELECT COUNT(*) AS n FROM work_log WHERE status IN ('blocked', 'failed')")
              .get().n,
          },
        });
      }

      if (req.method === "GET" && path === "/agents") {
        return json(res, 200, { agents: db.prepare("SELECT * FROM agents ORDER BY id").all() });
      }

      if (req.method === "POST" && path === "/agents/register") {
        const body = await readBody(req);
        if (!body.id) return json(res, 400, { error: "id is required" });
        const stamp = now();
        db.prepare(
          `INSERT INTO agents (id, kind, protocol, model, status, metadata, registered_at, last_seen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             kind=excluded.kind, protocol=excluded.protocol, model=excluded.model,
             status=excluded.status, metadata=excluded.metadata, last_seen=excluded.last_seen`
        ).run(
          String(body.id),
          String(body.kind || "unknown"),
          body.protocol ? String(body.protocol) : null,
          body.model ? String(body.model) : null,
          String(body.status || "idle"),
          body.metadata ? JSON.stringify(body.metadata) : null,
          stamp,
          stamp
        );
        const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(String(body.id));
        broadcast("agent", agent);
        return json(res, 201, agent);
      }

      if (req.method === "POST" && path === "/agents/heartbeat") {
        const body = await readBody(req);
        if (!body.id) return json(res, 400, { error: "id is required" });
        db.prepare("UPDATE agents SET last_seen = ?, status = COALESCE(?, status), model = COALESCE(?, model) WHERE id = ?").run(
          now(),
          body.status ? String(body.status) : null,
          body.model ? String(body.model) : null,
          String(body.id)
        );
        return json(res, 200, db.prepare("SELECT * FROM agents WHERE id = ?").get(String(body.id)) || null);
      }

      if (req.method === "POST" && path === "/messages") {
        return json(res, 201, createMessage(await readBody(req)));
      }

      if (req.method === "GET" && path === "/messages") {
        return json(res, 200, {
          messages: listMessages({
            since: url.searchParams.get("since") || 0,
            to: url.searchParams.get("to") || undefined,
            topic: url.searchParams.get("topic") || undefined,
            limit: url.searchParams.get("limit") || 50,
          }),
        });
      }

      if (req.method === "GET" && path === "/events") {
        res.writeHead(200, {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          connection: "keep-alive",
          "access-control-allow-origin": "*",
        });
        res.write(`event: hello\ndata: ${JSON.stringify({ service: "aetherius-hive", ts: now() })}\n\n`);
        streams.add(res);
        const timer = setInterval(() => {
          try {
            res.write(": ping\n\n");
          } catch {
            clearInterval(timer);
            streams.delete(res);
          }
        }, 15_000);
        req.on("close", () => {
          clearInterval(timer);
          streams.delete(res);
        });
        return;
      }

      if (req.method === "GET" && path === "/tasks") {
        return json(res, 200, {
          tasks: listTasks({
            status: url.searchParams.get("status") || undefined,
            assignee: url.searchParams.get("assignee") || undefined,
            limit: url.searchParams.get("limit") || 100,
          }),
        });
      }

      if (req.method === "POST" && path === "/tasks") {
        const body = await readBody(req);
        if (!body.title) return json(res, 400, { error: "title is required" });
        const id = body.id ? String(body.id) : `task_${randomUUID()}`;
        const stamp = now();
        db.prepare(
          `INSERT INTO tasks (id, created_at, updated_at, created_by, assignee, title, detail, status, priority, files)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          id,
          stamp,
          stamp,
          String(body.created_by || "supervisor"),
          body.assignee ? String(body.assignee) : null,
          String(body.title),
          body.detail ? String(body.detail) : null,
          String(body.status || "open"),
          Number.isFinite(Number(body.priority)) ? Number(body.priority) : 3,
          body.files ? JSON.stringify(body.files) : null
        );
        const task = getTask(id);
        broadcast("task", task);
        recordWork({
          agent: String(body.created_by || "supervisor"),
          task_id: id,
          action: "task.create",
          status: "pending",
          summary: `Created task: ${String(body.title)}`,
          files: body.files,
        });
        return json(res, 201, task);
      }

      const taskMatch = path.match(/^\/tasks\/([^/]+)(?:\/(claim|update))?$/);
      if (taskMatch) {
        const id = decodeURIComponent(taskMatch[1]);
        const action = taskMatch[2];
        const task = getTask(id);
        if (!task) return json(res, 404, { error: "task not found" });

        if (req.method === "GET" && !action) return json(res, 200, task);

        if (req.method === "POST" && action === "claim") {
          const body = await readBody(req);
          const agent = String(body.agent || "");
          if (!agent) return json(res, 400, { error: "agent is required" });
          if (task.status !== "open") return json(res, 409, { error: "task is not open", task });
          db.prepare("UPDATE tasks SET assignee = ?, status = 'claimed', updated_at = ? WHERE id = ?").run(agent, now(), id);
          const updated = getTask(id);
          broadcast("task", updated);
          recordWork({
            agent,
            task_id: id,
            action: "task.claim",
            status: "in_progress",
            summary: `Claimed task: ${task.title}`,
          });
          return json(res, 200, updated);
        }

        if (req.method === "POST" && action === "update") {
          const body = await readBody(req);
          const agent = String(body.agent || "");
          if (!agent) return json(res, 400, { error: "agent is required" });
          if (task.assignee && task.assignee !== agent && agent !== "supervisor") {
            return json(res, 403, { error: "task is assigned to another agent", task });
          }
          const status = body.status ? String(body.status) : task.status;
          if (!["open", "claimed", "blocked", "done", "failed"].includes(status)) {
            return json(res, 400, { error: "invalid status" });
          }
          db.prepare(
            "UPDATE tasks SET status = ?, assignee = COALESCE(?, assignee), result = COALESCE(?, result), evidence = COALESCE(?, evidence), updated_at = ? WHERE id = ?"
          ).run(
            status,
            agent === "supervisor" && body.assignee ? String(body.assignee) : null,
            body.result ? String(body.result) : null,
            body.evidence ? String(body.evidence) : null,
            now(),
            id
          );
          const updated = getTask(id);
          broadcast("task", updated);
          recordWork({
            agent,
            task_id: id,
            action: "task.update",
            status: { open: "pending", claimed: "in_progress", blocked: "blocked", done: "done", failed: "failed" }[status] || "info",
            summary: body.summary ? String(body.summary) : `Task status: ${status} (${task.title})`,
            files: body.files,
            evidence: body.evidence,
          });
          return json(res, 200, updated);
        }

        return json(res, 405, { error: "method not allowed" });
      }

      if (req.method === "GET" && path === "/work") {
        return json(res, 200, {
          work: listWork({
            agent: url.searchParams.get("agent") || undefined,
            status: url.searchParams.get("status") || undefined,
            task_id: url.searchParams.get("task_id") || undefined,
            since: url.searchParams.get("since") || 0,
            limit: url.searchParams.get("limit") || 100,
          }),
        });
      }

      if (req.method === "POST" && path === "/work") {
        return json(res, 201, recordWork(await readBody(req)));
      }

      if (req.method === "GET" && path === "/work/summary") {
        return json(res, 200, workSummary());
      }

      if (req.method === "GET" && path === "/leases") {
        return json(res, 200, { leases: listLeases() });
      }

      if (req.method === "POST" && path === "/leases/acquire") {
        const result = acquireLease(await readBody(req));
        return result.acquired
          ? json(res, 200, result)
          : json(res, 409, { error: `lease held by ${result.lease.owner}`, ...result });
      }

      if (req.method === "POST" && path === "/leases/release") {
        const result = releaseLease(await readBody(req));
        if (result.released) return json(res, 200, result);
        return json(res, result.reason === "not-found" ? 404 : 409, result);
      }

      const leaseMatch = path.match(/^\/leases\/([^/]+)$/);
      if (req.method === "GET" && leaseMatch) {
        const lease = getLease(decodeURIComponent(leaseMatch[1]));
        return lease ? json(res, 200, lease) : json(res, 404, { error: "lease not found" });
      }

      if (path.startsWith("/memory/")) {
        const key = decodeURIComponent(path.slice("/memory/".length));
        if (req.method === "GET") {
          const row = db.prepare("SELECT * FROM memory WHERE key = ?").get(key);
          return row ? json(res, 200, row) : json(res, 404, { error: "key not found" });
        }
        if (req.method === "PUT" || req.method === "POST") {
          const body = await readBody(req);
          if (body.value === undefined) return json(res, 400, { error: "value is required" });
          db.prepare(
            `INSERT INTO memory (key, updated_at, owner, value, tags) VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(key) DO UPDATE SET updated_at=excluded.updated_at, owner=excluded.owner, value=excluded.value, tags=excluded.tags`
          ).run(
            key,
            now(),
            String(body.owner || "unknown"),
            typeof body.value === "string" ? body.value : JSON.stringify(body.value),
            body.tags ? JSON.stringify(body.tags) : null
          );
          return json(res, 200, db.prepare("SELECT * FROM memory WHERE key = ?").get(key));
        }
        return json(res, 405, { error: "method not allowed" });
      }

      if (req.method === "GET" && path === "/.well-known/agent-card.json") {
        return json(res, 200, agentCard());
      }

      if (req.method === "POST" && path === "/a2a") {
        const rpc = await readBody(req);
        const id = rpc.id ?? randomUUID();
        const method = rpc.method;
        const params = rpc.params || {};
        if (method === "message/send" || method === "message/stream") {
          const parts = params.message?.parts || [];
          const text = parts.map((part) => part.text || "").filter(Boolean).join("\n");
          const message = createMessage({
            sender: params.metadata?.sender || "a2a",
            recipient: params.metadata?.recipient || "*",
            topic: params.metadata?.topic || "a2a",
            body: text || "empty A2A message",
            correlation_id: params.metadata?.correlation_id,
          });
          return json(res, 200, {
            jsonrpc: "2.0",
            id,
            result: {
              id: `msg_${message.id}`,
              status: { state: "completed" },
              artifacts: [{ parts: [{ type: "text", text: "accepted" }] }],
            },
          });
        }
        if (method === "tasks/get") {
          const task = getTask(String(params.id || ""));
          return task
            ? json(res, 200, { jsonrpc: "2.0", id, result: task })
            : json(res, 200, { jsonrpc: "2.0", id, error: { code: -32001, message: "task not found" } });
        }
        if (method === "tasks/list") {
          return json(res, 200, { jsonrpc: "2.0", id, result: { tasks: listTasks({ status: params.status }) } });
        }
        if (method === "agent/getAuthenticatedExtendedCard") {
          return json(res, 200, { jsonrpc: "2.0", id, result: agentCard() });
        }
        return json(res, 200, { jsonrpc: "2.0", id, error: { code: -32601, message: `method not found: ${method}` } });
      }

      return json(res, 404, { error: "not found", path });
    } catch (error) {
      return json(res, 400, { error: String(error?.message || error) });
    }
  });

  server.listen(port, "127.0.0.1", () => {
    const address = server.address();
    console.log(`[hive] listening on http://127.0.0.1:${address.port} (db: ${dbPath})`);
  });

  return {
    server,
    db,
    dbPath,
    get port() {
      return server.address()?.port ?? port;
    },
    close() {
      for (const stream of streams) {
        try {
          stream.end();
        } catch {
          /* ignore */
        }
      }
      streams.clear();
      server.close();
      db.close();
    },
  };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  startHive();
}
