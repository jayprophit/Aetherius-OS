import { mkdtempSync, rmSync, unlinkSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { startHive } from "./server.mjs";

/**
 * End-to-end test of the shared MCP surface every agent mounts: work ledger,
 * Obsidian vault, Graphify and REA. The server is spawned exactly as an agent
 * would spawn it, over stdio, against a throwaway hive database.
 */

const SERVER = fileURLToPath(new URL("./mcp-server.mjs", import.meta.url));
const TEST_NOTE = fileURLToPath(new URL("../../knowledge/Aetherius-Vault/MCP Test.md", import.meta.url));

let hive;
let client;
let dir;

function parse(result) {
  expect(result.isError).not.toBe(true);
  return JSON.parse(result.content[0].text);
}

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "aetherius-mcp-test-"));
  hive = startHive({ port: 0, dbPath: join(dir, "hive.db") });
  if (!hive.server.listening) {
    await new Promise((resolvePromise) => hive.server.once("listening", resolvePromise));
  }
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER],
    env: { ...process.env, HIVE_URL: `http://127.0.0.1:${hive.port}` },
    stderr: "pipe",
  });
  client = new Client({ name: "aetherius-mcp-test", version: "1.0.0" });
  await client.connect(transport);
}, 30000);

afterAll(async () => {
  await client?.close();
  hive?.close();
  if (existsSync(TEST_NOTE)) unlinkSync(TEST_NOTE);
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe("shared agent MCP", () => {
  it("exposes work, knowledge, Graphify and REA tools to every agent", async () => {
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "hive_work_log",
        "hive_work_list",
        "hive_work_summary",
        "knowledge_search",
        "knowledge_read",
        "knowledge_write",
        "knowledge_list",
        "graphify_query",
        "graphify_explain",
        "graphify_path",
        "graphify_status",
        "rea_capabilities",
        "rea_analyze",
        "supervisor_status",
        "supervisor_plan",
        "supervisor_claim",
        "supervisor_release",
        "supervisor_handoff",
      ])
    );
  });

  it("reads and writes the Obsidian vault and records work", async () => {
    await client.callTool({
      name: "knowledge_write",
      arguments: {
        note: "MCP Test.md",
        content: "# MCP Test\n\nAetherius knowledge tool online.",
        mode: "replace",
      },
    });

    const read = parse(
      await client.callTool({ name: "knowledge_read", arguments: { note: "MCP Test.md" } })
    );
    expect(read.content).toContain("knowledge tool online");

    const search = parse(
      await client.callTool({ name: "knowledge_search", arguments: { query: "knowledge tool online" } })
    );
    expect(search.results.some((result) => result.note === "MCP Test.md")).toBe(true);

    const listed = parse(await client.callTool({ name: "knowledge_list", arguments: {} }));
    expect(listed.notes.some((note) => note.note === "MCP Test.md")).toBe(true);

    const logged = parse(
      await client.callTool({
        name: "hive_work_log",
        arguments: {
          agent: "mcp-test",
          action: "verify",
          status: "done",
          summary: "MCP knowledge and work tools reachable",
          evidence: "vitest orchestration/hive/mcp.test.mjs",
        },
      })
    );
    expect(logged.agent).toBe("mcp-test");

    const summary = parse(await client.callTool({ name: "hive_work_summary", arguments: {} }));
    expect(summary.totals).toBeGreaterThanOrEqual(1);
    expect(summary.by_agent.some((row) => row.agent === "mcp-test")).toBe(true);
  });

  it("reports the Graphify graph state", async () => {
    const status = parse(await client.callTool({ name: "graphify_status", arguments: {} }));
    expect(typeof status.available).toBe("boolean");
    if (status.available) {
      expect(status.bytes).toBeGreaterThan(0);
      expect(status.graph).toBe("graphify-out/graph.json");
    }
  });

  it("reports the real REA installation", async () => {
    const capabilities = parse(await client.callTool({ name: "rea_capabilities", arguments: {} }));
    expect(typeof capabilities.installed).toBe("boolean");
    expect(Array.isArray(capabilities.commands)).toBe(true);
    if (capabilities.installed) {
      expect(capabilities.version).toMatch(/^\d+\.\d+\.\d+/);
    }
  });

  it("exposes supervisor failover state", async () => {
    const status = parse(await client.callTool({ name: "supervisor_status", arguments: {} }));
    expect(status.lease_key).toBe("supervisor.lease");
    expect(status.candidates.length).toBeGreaterThanOrEqual(3);
    expect(status.candidates.every((candidate) => candidate.billing.startsWith("free"))).toBe(true);
  });
});
