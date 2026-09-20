import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderRegistry } from "./registry";
import { createAgentBridgeProvider } from "./agentBridge";
import { createMatProvider } from "./mat";
import { createComputeProvider } from "./compute";
import { createGenesisProvider } from "./genesis";
import { createIdeProvider } from "./ide";
import { getApp, listApps } from "../apps/registry";
import type { Provider } from "./types";

const servers: Server[] = [];
afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(servers.splice(0).map((s) => new Promise<void>((r) => s.close(() => r()))));
});

function stubServer(handler: (url: string) => { status: number; body: unknown }): Promise<string> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const out = handler(req.url ?? "/");
      res.writeHead(out.status, { "content-type": "application/json" });
      res.end(JSON.stringify(out.body));
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      servers.push(server);
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

describe("provider registry", () => {
  it("never throws: throwing providers become ERROR reports", async () => {
    const registry = new ProviderRegistry();
    const bad: Provider = {
      id: "bad",
      kind: "UNAVAILABLE",
      describe: () => "bad",
      check: async () => {
        throw new Error("boom");
      },
    };
    registry.register(bad);
    const reports = await registry.checkAll(1000);
    expect(reports.bad.state).toBe("ERROR");
    expect(reports.bad.errorCode).toBe("CHECK_THREW");
  });

  it("rejects blank provider ids", () => {
    const registry = new ProviderRegistry();
    expect(() =>
      registry.register({ id: "", kind: "UNAVAILABLE", describe: () => "", check: async () => { throw new Error("x"); } }),
    ).toThrow();
  });
});

describe("agent bridge provider", () => {
  it("reports AVAILABLE against a live stub", async () => {
    const base = await stubServer(() => ({ status: 200, body: { ok: true, version: "test" } }));
    const report = await createAgentBridgeProvider(base, 2000).check();
    expect(report.state).toBe("AVAILABLE");
    expect(report.kind).toBe("REAL_LOCAL");
    expect(report.latencyMs).not.toBeNull();
  });

  it("reports DEGRADED on HTTP errors", async () => {
    const base = await stubServer(() => ({ status: 500, body: {} }));
    const report = await createAgentBridgeProvider(base, 2000).check();
    expect(report.state).toBe("DEGRADED");
    expect(report.errorCode).toBe("HTTP");
  });

  it("reports UNAVAILABLE when unreachable", async () => {
    const report = await createAgentBridgeProvider("http://127.0.0.1:1", 500).check();
    expect(report.state).toBe("UNAVAILABLE");
    expect(report.errorCode).toBe("NETWORK");
  });
});

describe("mat provider", () => {
  it("queries through a live stub", async () => {
    const base = await stubServer((url) => {
      if (url === "/health") return { status: 200, body: { ok: true } };
      if (url.startsWith("/query")) {
        return { status: 200, body: { found: true, mat_id: "MAT:0001", results: [] } };
      }
      return { status: 404, body: {} };
    });
    const provider = createMatProvider(base, 2000);
    const health = await provider.check();
    expect(health.state).toBe("AVAILABLE");
    const result = await provider.query({ symbol: "H", property: "ionization.first" });
    expect(result.found).toBe(true);
  });

  it("reports UNAVAILABLE when the service is down", async () => {
    const report = await createMatProvider("http://127.0.0.1:1", 500).check();
    expect(report.state).toBe("UNAVAILABLE");
  });
});

describe("compute provider", () => {
  it("reports real signals when a sampler provides them", async () => {
    const report = await createComputeProvider(() => ({ cores: 8, memoryGB: 16 })).check();
    expect(report.state).toBe("AVAILABLE");
    expect(report.detail).toContain("cores=8");
  });

  it("reports UNAVAILABLE with no signals, never invented", async () => {
    const report = await createComputeProvider(() => ({ cores: null, memoryGB: null })).check();
    expect(report.state).toBe("UNAVAILABLE");
    expect(report.errorCode).toBe("NO_SIGNALS");
  });
});

describe("genesis provider", () => {
  it("is honestly UNAVAILABLE without a transport", async () => {
    const report = await createGenesisProvider().check();
    expect(report.state).toBe("UNAVAILABLE");
    expect(report.errorCode).toBe("NO_TRANSPORT");
  });
});

describe("ide provider and app registry", () => {
  it("resolves the registered IDE entry", async () => {
    const report = await createIdeProvider().check();
    expect(report.state).toBe("AVAILABLE");
  });

  it("registry lists the canonical applications", () => {
    const apps = listApps();
    for (const id of ["genesis", "agent-bridge", "mat", "ide-workspace", "poietek", "universal-bridge"]) {
      expect(apps.some((a) => a.id === id)).toBe(true);
    }
    expect(getApp("agent-bridge")?.healthEndpoint).toContain("8471");
    expect(getApp("mat")?.healthEndpoint).toContain("8472");
  });
});
