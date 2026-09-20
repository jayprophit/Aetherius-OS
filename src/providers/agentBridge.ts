import type { Provider, ProviderReport } from "./types";
import { baseReport } from "./types";
import { fetchJson, ProviderError } from "./registry";

export interface AgentBridgeStatus {
  health: unknown;
  capabilities: unknown;
}

// REAL_LOCAL provider over the Agent Bridge HTTP surface
// (cli.py serve -> /health on loopback). No silent fallback.
export function createAgentBridgeProvider(
  endpoint = "http://127.0.0.1:8471",
  timeoutMs = 4000,
): Provider & { status(): Promise<AgentBridgeStatus> } {
  const base = endpoint.replace(/\/+$/, "");
  async function get(path: string, signal?: AbortSignal): Promise<unknown> {
    return fetchJson(`${base}${path}`, { timeoutMs, signal });
  }
  return {
    id: "agent-bridge",
    kind: "REAL_LOCAL",
    describe: () => `Agent Bridge HTTP API at ${base}`,
    async check(signal?: AbortSignal): Promise<ProviderReport> {
      const started = Date.now();
      try {
        const health = await get("/health", signal);
        return baseReport("agent-bridge", "REAL_LOCAL", {
          state: "AVAILABLE",
          detail: `healthy: ${JSON.stringify(health).slice(0, 200)}`,
          latencyMs: Date.now() - started,
        });
      } catch (error) {
        if (error instanceof ProviderError && error.code === "HTTP") {
          return baseReport("agent-bridge", "REAL_LOCAL", {
            state: "DEGRADED",
            detail: error.message,
            latencyMs: Date.now() - started,
            errorCode: "HTTP",
            errorDetail: error.message,
          });
        }
        const code = error instanceof ProviderError ? error.code : "NETWORK";
        return baseReport("agent-bridge", "REAL_LOCAL", {
          state: code === "TIMEOUT" ? "ERROR" : "UNAVAILABLE",
          detail: error instanceof Error ? error.message : String(error),
          latencyMs: Date.now() - started,
          errorCode: code,
          errorDetail: error instanceof Error ? error.message : String(error),
        });
      }
    },
    async status(): Promise<AgentBridgeStatus> {
      const [health, capabilities] = await Promise.all([
        get("/health"),
        get("/v1/capabilities").catch(() => get("/capabilities").catch(() => null)),
      ]);
      return { health, capabilities };
    },
  };
}
