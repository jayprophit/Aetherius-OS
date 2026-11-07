#!/usr/bin/env node
/**
 * End-to-end smoke test for the deployed sync Worker.
 *
 * Uses the project's own protocol code so the revision hash is the real one.
 * Pushes a single heartbeat record (same key each run, last-writer-wins),
 * pulls it back, checks the revision, and reports state. Prints no secrets.
 *
 * Usage:
 *   SYNC_URL=https://aetherius-sync.<subdomain>.workers.dev \
 *   SYNC_TOKEN=... node scripts/sync-smoke.mjs
 */

import { createChange, validateChange } from "../apps/aetherius-sync/src/protocol.ts";

const base = (process.env.SYNC_URL ?? "").replace(/\/+$/, "");
const token = process.env.SYNC_TOKEN ?? "";

if (!base) {
  console.error("SYNC_URL is required");
  process.exit(2);
}
if (token.length < 16) {
  console.error("SYNC_TOKEN is required");
  process.exit(2);
}

const headers = {
  authorization: `Bearer ${token}`,
  "content-type": "application/json",
};

async function call(path, init = {}) {
  const response = await fetch(`${base}${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status, body };
}

const change = createChange({
  appId: "aetherius-smoke",
  collection: "probe",
  key: "smoke-heartbeat",
  value: { probe: true, at: new Date().toISOString() },
  updatedAt: Date.now(),
  deviceId: "smoke-local",
});

const problems = validateChange(change);
if (problems.length > 0) {
  console.error(`invalid change: ${problems.join("; ")}`);
  process.exit(2);
}

const push = await call("/v1/sync/push", {
  method: "POST",
  body: JSON.stringify({ deviceId: "smoke-local", records: [change] }),
});
if (push.status !== 200) {
  console.error(`push failed: HTTP ${push.status} ${JSON.stringify(push.body)}`);
  process.exit(1);
}

const pull = await call("/v1/sync/pull?cursor=0&limit=500");
if (pull.status !== 200) {
  console.error(`pull failed: HTTP ${pull.status} ${JSON.stringify(pull.body)}`);
  process.exit(1);
}

const found = (pull.body.records ?? []).find(
  (record) => record.appId === change.appId && record.collection === change.collection && record.key === change.key,
);
if (!found) {
  console.error("pushed record was not returned by pull");
  process.exit(1);
}
if (found.revision !== change.revision) {
  console.error(`revision mismatch: pushed ${change.revision}, pulled ${found.revision}`);
  process.exit(1);
}

const state = await call("/v1/sync/state");
if (state.status !== 200) {
  console.error(`state failed: HTTP ${state.status} ${JSON.stringify(state.body)}`);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      push: push.body.results?.[0]?.source ?? "unknown",
      revision: change.revision,
      pulledRecords: pull.body.records?.length ?? 0,
      serverRecords: state.body.records,
      collections: state.body.collections,
    },
    null,
    2,
  ),
);
