#!/usr/bin/env node
/**
 * Supervisor failover.
 *
 * OpenCode is the first supervisor, but its session usage is finite. This
 * module makes the supervisor role a lease in the hive, not a property of one
 * process: any registered free-model agent can take over, and the outgoing
 * supervisor can continue as a worker.
 *
 *   node orchestration/supervisor/failover.mjs status
 *   node orchestration/supervisor/failover.mjs candidates
 *   node orchestration/supervisor/failover.mjs acquire --agent hermes
 *   node orchestration/supervisor/failover.mjs handoff --from opencode --to kilo
 *   node orchestration/supervisor/failover.mjs release --agent kilo
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { hive } from "../hive/client.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REGISTRY_PATH = join(ROOT, "orchestration", "supervisor", "registry.json");
const VAULT = join(ROOT, "knowledge", "Aetherius-Vault");

export function loadRegistry(path = REGISTRY_PATH) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assertFree(candidate) {
  if (!candidate) throw new Error("unknown supervisor candidate");
  if (!String(candidate.billing || "").toLowerCase().startsWith("free")) {
    throw new Error(`candidate ${candidate.id} is not free (${candidate.billing}); refusing takeover`);
  }
  if (!candidate.supervisor) throw new Error(`candidate ${candidate.id} is not allowed to supervise`);
  return candidate;
}

function findCandidate(registry, id) {
  return registry.supervisor_candidates.find((candidate) => candidate.id === id);
}

async function leaseOrNull(client, key) {
  try {
    return await client.lease(key);
  } catch (error) {
    if (/\(404\)/.test(error.message)) return null;
    throw error;
  }
}

export async function supervisorStatus({ client = hive, registry = loadRegistry() } = {}) {
  const key = registry.policy.lease_key;
  const [lease, summary, tasks] = await Promise.all([
    leaseOrNull(client, key),
    client.workSummary(),
    client.tasks({ limit: 500 }),
  ]);
  const active = lease && Date.parse(lease.expires_at) > Date.now();
  return {
    generated_at: new Date().toISOString(),
    lease_key: key,
    lease,
    lease_active: Boolean(active),
    supervisor: active ? lease.owner : null,
    model: active ? lease.model : null,
    counts: {
      work_total: summary.totals,
      work_pending: summary.pending,
      tasks_open: tasks.tasks.filter((task) => task.status === "open").length,
      tasks_claimed: tasks.tasks.filter((task) => task.status === "claimed").length,
      tasks_blocked: tasks.tasks.filter((task) => task.status === "blocked").length,
      tasks_done: tasks.tasks.filter((task) => task.status === "done").length,
    },
    tasks: tasks.tasks,
    latest: summary.latest,
    candidates: registry.supervisor_candidates.map((candidate) => ({
      id: candidate.id,
      priority: candidate.priority,
      model: candidate.model,
      billing: candidate.billing,
      available: findCandidate(registry, candidate.id) !== undefined,
    })),
  };
}

export async function acquireSupervisor({ agent, ttl_seconds, client = hive, registry = loadRegistry() } = {}) {
  const candidate = assertFree(findCandidate(registry, agent));
  const key = registry.policy.lease_key;
  const ttl = Number(ttl_seconds) || registry.policy.ttl_seconds;
  const result = await client.acquireLease({
    key,
    owner: candidate.id,
    model: candidate.model,
    ttl_seconds: ttl,
    metadata: { role: "supervisor", provider: candidate.provider },
  });
  if (!result.acquired) {
    throw new Error(`supervisor lease is held by ${result.lease.owner} until ${result.lease.expires_at}`);
  }
  await client.recordWork({
    agent: candidate.id,
    action: "supervisor.acquire",
    status: "in_progress",
    summary: `Acquired supervisor lease on ${candidate.model}`,
    evidence: `lease ${key} until ${result.lease.expires_at}`,
  });
  return result;
}

export async function releaseSupervisor({ agent, client = hive, registry = loadRegistry() } = {}) {
  const key = registry.policy.lease_key;
  const result = await client.releaseLease({ key, owner: agent });
  if (!result.released) throw new Error(`cannot release lease: ${result.reason}`);
  await client.recordWork({
    agent,
    action: "supervisor.release",
    status: "done",
    summary: "Released supervisor lease",
  });
  return result;
}

export function renderHandoffBrief({ status, from, to, candidate, now = new Date().toISOString() }) {
  const blocked = status.tasks.filter((task) => task.status === "blocked");
  const open = status.tasks.filter((task) => task.status === "open");
  const claimed = status.tasks.filter((task) => task.status === "claimed");
  const latest = status.latest || [];
  return [
    "# Supervisor Handoff",
    "",
    "<!-- Generated by orchestration/supervisor/failover.mjs. Do not edit by hand. -->",
    "",
    `Generated: ${now}`,
    `From: **${from}**`,
    `To: **${to}** (${candidate.model}, ${candidate.billing})`,
    "",
    "## Why",
    "",
    from === "opencode"
      ? "OpenCode session usage or credits are finite. The supervisor role moves to a free-model agent; OpenCode continues as a worker."
      : "Supervisor lease transferred between free-model agents.",
    "",
    "## Counts",
    "",
    `- Work entries: ${status.counts.work_total} (open or blocked: ${status.counts.work_pending})`,
    `- Tasks: ${status.counts.tasks_open} open, ${status.counts.tasks_claimed} claimed, ${status.counts.tasks_blocked} blocked, ${status.counts.tasks_done} done`,
    "",
    "## Immediate queue",
    "",
    ...(open.length
      ? open.map((task) => `- [ ] ${task.id} — ${task.title} (priority ${task.priority})`)
      : ["- No open tasks."]),
    "",
    "## In progress",
    "",
    ...(claimed.length
      ? claimed.map((task) => `- [ ] ${task.id} — ${task.title} (${task.assignee})`)
      : ["- No claimed tasks."]),
    "",
    "## Blocked",
    "",
    ...(blocked.length
      ? blocked.map((task) => `- [ ] ${task.id} — ${task.title}: ${task.result || "no reason recorded"}`)
      : ["- No blocked tasks."]),
    "",
    "## Latest work per agent",
    "",
    ...(latest.length
      ? latest.map((entry) => `- **${entry.agent}** — ${entry.status}: ${entry.summary} (${entry.ts})`)
      : ["- No work recorded."]),
    "",
    "## Takeover checklist",
    "",
    "1. Read `docs/SUPERVISOR-FAILOVER.md` and `docs/SUPERVISOR-HANDOFF-2026-11-08.md`.",
    "2. Claim the lease: `node orchestration/supervisor/failover.mjs acquire --agent <id>`.",
    "3. Run `node orchestration/hive/cli.mjs work export` and `npm run verify`.",
    "4. Claim unowned tasks in the hive before editing their files.",
    "5. Keep free-only. Refuse any paid model or provider.",
    "6. Commit and push only verified files.",
    "",
    "## OpenCode worker switch",
    "",
    'After handoff, OpenCode runs as a worker: `opencode run --model opencode/deepseek-v4.1-flash-free "<task>"`.',
    "It must not commit or push while another agent holds the supervisor lease.",
    "",
  ].join("\n");
}

export async function handoffSupervisor({
  from,
  to,
  force = false,
  client = hive,
  registry = loadRegistry(),
  vaultDir = VAULT,
  writeNote = true,
} = {}) {
  const candidate = assertFree(findCandidate(registry, to));
  const key = registry.policy.lease_key;
  const current = await leaseOrNull(client, key);
  const active = current && Date.parse(current.expires_at) > Date.now();
  if (active && current.owner !== from && !force) {
    throw new Error(`lease is held by ${current.owner}; pass --force only after an explicit owner decision`);
  }
  const status = await supervisorStatus({ client, registry });
  const ttl = registry.policy.ttl_seconds;
  const acquired = await client.acquireLease({
    key,
    owner: candidate.id,
    model: candidate.model,
    ttl_seconds: ttl,
    force: true,
    metadata: { role: "supervisor", handed_off_from: from, handed_off_at: new Date().toISOString() },
  });
  const now = new Date().toISOString();
  const markdown = renderHandoffBrief({ status, from, to, candidate, now });
  let note = null;
  if (writeNote) {
    note = join(vaultDir, "Supervisor Handoff.md");
    mkdirSync(dirname(note), { recursive: true });
    writeFileSync(note, markdown, "utf8");
  }
  await client.recordWork({
    agent: from,
    action: "supervisor.handoff",
    status: "done",
    summary: `Handed supervisor lease to ${to} (${candidate.model})`,
    evidence: writeNote ? `note: ${note}` : "no note",
  });
  await client.recordWork({
    agent: candidate.id,
    action: "supervisor.takeover",
    status: "in_progress",
    summary: `Took over supervisor role from ${from}; model ${candidate.model}`,
    evidence: `lease until ${acquired.lease.expires_at}`,
  });
  return {
    ok: true,
    from,
    to: candidate.id,
    model: candidate.model,
    lease: acquired.lease,
    note: note ? resolve(note) : null,
    markdown,
    counts: status.counts,
  };
}

export async function supervisorPlan({ to, client = hive, registry = loadRegistry() } = {}) {
  const candidate = assertFree(findCandidate(registry, to));
  const status = await supervisorStatus({ client, registry });
  return {
    to: candidate.id,
    candidate,
    markdown: renderHandoffBrief({
      status,
      from: status.supervisor || "none",
      to: candidate.id,
      candidate,
    }),
    counts: status.counts,
  };
}

function parse(argv) {
  const positional = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) flags[key] = true;
      else {
        flags[key] = next;
        index += 1;
      }
    } else {
      positional.push(token);
    }
  }
  return { positional, flags };
}

async function main() {
  const [command] = process.argv.slice(2);
  const { flags } = parse(process.argv.slice(3));
  if (!command || command === "help" || command === "--help") {
    console.log("commands: status | candidates | plan | acquire | handoff | release");
    return;
  }
  if (command === "candidates") {
    const registry = loadRegistry();
    console.log(JSON.stringify(registry.supervisor_candidates, null, 2));
    return;
  }
  if (command === "status") {
    console.log(JSON.stringify(await supervisorStatus(), null, 2));
    return;
  }
  if (command === "plan") {
    const plan = await supervisorPlan({ to: flags.to });
    console.log(JSON.stringify(plan, null, 2));
    return;
  }
  if (command === "acquire") {
    console.log(JSON.stringify(await acquireSupervisor({ agent: flags.agent, ttl_seconds: flags.ttl }), null, 2));
    return;
  }
  if (command === "handoff") {
    console.log(
      JSON.stringify(
        await handoffSupervisor({ from: flags.from, to: flags.to, force: Boolean(flags.force) }),
        null,
        2
      )
    );
    return;
  }
  if (command === "release") {
    console.log(JSON.stringify(await releaseSupervisor({ agent: flags.agent }), null, 2));
    return;
  }
  throw new Error(`unknown command: ${command}`);
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  main().catch((error) => {
    console.error(`supervisor failover: ${error.message}`);
    process.exitCode = 1;
  });
}
