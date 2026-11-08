// End-to-end control-plane + health-monitor run against live Supabase.
// The service-role key arrives on stdin (never in argv, never printed).
import { readFileSync } from "node:fs";
import { ControlPlaneClient } from "./src/control-plane.ts";
import { HealthMonitor, probe } from "./src/health-monitor.ts";

const key = readFileSync(0, "utf8").trim();
const apiUrl = process.argv[2];
if (!key || !apiUrl) {
  console.error("usage: node e2e-control-plane.mjs <api_url> < keyfile");
  process.exit(2);
}

const client = new ControlPlaneClient({
  apiUrl,
  credentialRef: "keepass:Aetherius/Cloud/Supabase",
  credentials: async () => key,
});

const out = {};
out.providers = (await client.listProviders()).map((p) => ({
  id: p.id, kind: p.kind, credential_ref: p.credential_ref,
}));

const monitor = new HealthMonitor([
  probe("local", async () => ({ state: "AVAILABLE", detail: "ollama 0.40.6" })),
  probe("groq", async () => ({ state: "AVAILABLE", detail: "free tier" })),
  probe("gemini", async () => ({ state: "AVAILABLE", detail: "free tier" })),
], client);

const started = new Date().toISOString();
out.health_pass = (await monitor.runOnce()).map((r) => ({
  provider_id: r.provider_id, state: r.state, latency_ms: r.latency_ms,
}));
out.health_persisted = (await client.healthSince(started)).map((r) => ({
  provider_id: r.provider_id, state: r.state, observed_at: r.observed_at,
}));

// Task round-trip through the control plane
const task = await client.createTask({
  id: `e2e-${Date.now()}`, definition: "e2e-smoke",
  subject: "aetherius-cloud-fabric", state: "running", history: [],
});
out.task_created = { id: task.id, state: task.state };
out.task_updated = (await client.updateTask(task.id, { state: "done" })).state;
out.tasks_visible = (await client.listTasks(10)).map((t) => ({ id: t.id, state: t.state }));

console.log(JSON.stringify(out, null, 2));
