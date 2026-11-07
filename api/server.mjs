/**
 * Aetherius OS — Live local API server.
 * Implements the mock API definitions as real HTTP endpoints for pre-public testing.
 * Localhost only; no external network or live financial adapter.
 */
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesPath = join(__dirname, "..", "tests", "fixtures", "benchmark-fixtures.json");

function loadFixtures() {
  if (!existsSync(fixturesPath)) return { fixtures: [] };
  return JSON.parse(readFileSync(fixturesPath, "utf-8"));
}

const endpoints = {
  "/api/health": () => ({ status: "ok", service: "aetherius-api", version: "0.1.0", live: false, localOnly: true }),
  "/api/genesis/financial/state": () => ({ status: "ok", layer: "Genesis-Sovereign-Finance", balanceCheck: true, liveAdapter: false }),
  "/api/genesis/financial/post": () => ({ status: "ok", event: "POST", audit: true, persisted: false }),
  "/api/genesis/trading/state": () => ({ status: "ok", layer: "Genesis-Trading-Bot", killSwitch: false, liveAdapter: false }),
  "/api/genesis/trading/order": () => ({ status: "ok", event: "PAPER_ORDER", audit: true, persisted: false }),
  "/api/benchmark/fixtures": () => {
    const data = loadFixtures();
    return { fixtures: data.fixtures ?? [], total: (data.fixtures ?? []).length, allMeasured: false };
  },
  "/api/deploy/status": () => ({ signedArtifacts: 0, formatsDefined: ["MSIX", "DEB", "RPM", "APK", "DMG", "PKG", "PWA"], installationsVerified: false }),
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const handler = endpoints[url.pathname];
  res.setHeader("Content-Type", "application/json");
  if (!handler) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not_found", path: url.pathname }));
    return;
  }
  res.statusCode = 200;
  res.end(JSON.stringify({ ...handler(), requestedAt: new Date().toISOString() }, null, 2));
});

const port = Number(process.env.AETHERIUS_API_PORT ?? 4317);
server.listen(port, "127.0.0.1", () => {
  console.log(`Aetherius API listening on http://127.0.0.1:${port}`);
  console.log(`Endpoints: ${Object.keys(endpoints).join(", ")}`);
});
