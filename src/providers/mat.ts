import type { Provider, ProviderReport } from "./types";
import { baseReport } from "./types";
import { fetchJson, ProviderError } from "./registry";

export interface MatQueryResult {
  found: boolean;
  mat_id?: string;
  record_name?: string;
  symbol?: string;
  results?: unknown[];
  provenance?: unknown;
}

// REAL_LOCAL provider over mat-query-service --serve (loopback, read-only).
export function createMatProvider(
  base = "http://127.0.0.1:8472",
  timeoutMs = 4000,
): Provider & {
  query(params: { symbol?: string; mat_id?: string; property?: string }): Promise<MatQueryResult>;
  search(text: string): Promise<unknown>;
} {
  const root = base.replace(/\/+$/, "");
  async function get(path: string, signal?: AbortSignal): Promise<unknown> {
    return fetchJson(`${root}${path}`, { timeoutMs, signal });
  }
  async function report(
    state: ProviderReport["state"],
    detail: string,
    started: number,
    error?: ProviderError | null,
  ): Promise<ProviderReport> {
    return baseReport("mat", "REAL_LOCAL", {
      state,
      detail,
      latencyMs: Date.now() - started,
      errorCode: error ? error.code : null,
      errorDetail: error ? error.message : null,
    });
  }
  return {
    id: "mat",
    kind: "REAL_LOCAL",
    describe: () => `MAT query service at ${root}`,
    async check(signal?: AbortSignal): Promise<ProviderReport> {
      const started = Date.now();
      try {
        const health = await get("/health", signal);
        return report("AVAILABLE", `healthy: ${JSON.stringify(health).slice(0, 200)}`, started);
      } catch (error) {
        const err = error instanceof ProviderError ? error : null;
        const state = err?.code === "HTTP" ? "DEGRADED" : err?.code === "TIMEOUT" ? "ERROR" : "UNAVAILABLE";
        return report(state, err?.message ?? String(error), started, err);
      }
    },
    async query(params): Promise<MatQueryResult> {
      const query = new URLSearchParams();
      if (params.symbol) query.set("symbol", params.symbol);
      if (params.mat_id) query.set("mat_id", params.mat_id);
      if (params.property) query.set("property", params.property);
      return (await get(`/query?${query.toString()}`)) as MatQueryResult;
    },
    async search(text: string): Promise<unknown> {
      return get(`/search?q=${encodeURIComponent(text)}`);
    },
  };
}
