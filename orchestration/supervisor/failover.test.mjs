import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import {
  acquireSupervisor,
  handoffSupervisor,
  loadRegistry,
  releaseSupervisor,
  supervisorPlan,
  supervisorStatus,
} from "./failover.mjs";

function fakeClient(tasks = []) {
  const leases = new Map();
  const work = [];
  return {
    work,
    leases,
    async lease(key) {
      const lease = leases.get(key);
      if (!lease) throw new Error(`hive GET /leases/${key} failed (404): lease not found`);
      return lease;
    },
    async acquireLease(input) {
      const current = leases.get(input.key);
      if (current && Date.parse(current.expires_at) > Date.now() && current.owner !== input.owner && !input.force) {
        return { acquired: false, lease: current };
      }
      const lease = {
        key: input.key,
        owner: input.owner,
        model: input.model,
        acquired_at:
          current && current.owner === input.owner ? current.acquired_at : new Date().toISOString(),
        expires_at: new Date(Date.now() + (input.ttl_seconds || 900) * 1000).toISOString(),
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      };
      leases.set(input.key, lease);
      return { acquired: true, lease };
    },
    async releaseLease({ key, owner }) {
      const current = leases.get(key);
      if (!current) return { released: false, reason: "not-found" };
      if (current.owner !== owner) return { released: false, reason: "owner-mismatch", lease: current };
      leases.delete(key);
      return { released: true, key };
    },
    async recordWork(entry) {
      const row = { ...entry, ts: new Date().toISOString() };
      work.push(row);
      return row;
    },
    async workSummary() {
      return {
        totals: work.length,
        pending: work.filter((entry) => ["pending", "in_progress", "blocked", "failed"].includes(entry.status)).length,
        latest: work.slice(-1),
        by_status: [],
        tasks: [],
      };
    },
    async tasks() {
      return { tasks };
    },
  };
}

const dir = mkdtempSync(join(tmpdir(), "aetherius-supervisor-test-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("supervisor failover", () => {
  it("keeps every takeover candidate on a free model", () => {
    const registry = loadRegistry();
    expect(registry.supervisor_candidates.length).toBeGreaterThanOrEqual(3);
    for (const candidate of registry.supervisor_candidates) {
      expect(candidate.billing.toLowerCase().startsWith("free")).toBe(true);
      expect(candidate.model).toBeTruthy();
    }
    expect(registry.worker_switch.opencode.model).toMatch(/free/);
  });

  it("acquires one supervisor lease and refuses a concurrent takeover", async () => {
    const client = fakeClient();
    const acquired = await acquireSupervisor({ agent: "kilo", client });
    expect(acquired.acquired).toBe(true);
    expect(acquired.lease.owner).toBe("kilo");

    await expect(acquireSupervisor({ agent: "hermes", client })).rejects.toThrow(/held by kilo/);

    const status = await supervisorStatus({ client });
    expect(status.lease_active).toBe(true);
    expect(status.supervisor).toBe("kilo");
    expect(status.model).toContain("nemotron");
  });

  it("hands off to Hermes, records both sides and writes the Obsidian brief", async () => {
    const client = fakeClient([
      { id: "task_1", title: "Deploy gateway", status: "open", priority: 1 },
      { id: "task_2", title: "Owner-gated Kaggle", status: "blocked", priority: 2, result: "owner login required" },
    ]);
    await acquireSupervisor({ agent: "kilo", client });

    const handoff = await handoffSupervisor({
      from: "kilo",
      to: "hermes",
      client,
      vaultDir: dir,
    });

    expect(handoff.to).toBe("hermes");
    expect(handoff.lease.owner).toBe("hermes");
    expect(handoff.markdown).toContain("Owner-gated Kaggle");
    expect(handoff.markdown).toContain("OpenCode worker switch");

    const note = readFileSync(join(dir, "Supervisor Handoff.md"), "utf8");
    expect(note).toContain("From: **kilo**");
    expect(note).toContain("To: **hermes**");
    expect(client.work.map((entry) => entry.action)).toEqual(
      expect.arrayContaining(["supervisor.acquire", "supervisor.handoff", "supervisor.takeover"])
    );
  });

  it("refuses a handoff from an agent that does not hold the lease", async () => {
    const client = fakeClient();
    await acquireSupervisor({ agent: "kilo", client });
    await expect(
      handoffSupervisor({ from: "hermes", to: "vibe", client, vaultDir: dir, writeNote: false })
    ).rejects.toThrow(/held by kilo/);
  });

  it("plans a takeover without changing the lease and refuses a paid candidate", async () => {
    const client = fakeClient([{ id: "task_3", title: "Verify build", status: "open", priority: 2 }]);
    await acquireSupervisor({ agent: "kilo", client });

    const plan = await supervisorPlan({ to: "hermes", client });
    expect(plan.markdown).toContain("Verify build");
    expect(client.leases.get("supervisor.lease").owner).toBe("kilo");

    const registry = loadRegistry();
    const paidRegistry = {
      ...registry,
      supervisor_candidates: registry.supervisor_candidates.map((candidate) =>
        candidate.id === "hermes" ? { ...candidate, billing: "paid", model: "paid/model" } : candidate
      ),
    };
    await expect(supervisorPlan({ to: "hermes", client, registry: paidRegistry })).rejects.toThrow(/not free/);
  });

  it("releases only for the current holder", async () => {
    const client = fakeClient();
    await acquireSupervisor({ agent: "vibe", client });
    await expect(releaseSupervisor({ agent: "hermes", client })).rejects.toThrow(/owner-mismatch/);
    const released = await releaseSupervisor({ agent: "vibe", client });
    expect(released.released).toBe(true);
  });
});
