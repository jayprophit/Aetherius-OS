import type { Provider, ProviderReport } from "./types";
import { baseReport } from "./types";

export class ProviderError extends Error {
  code: "TIMEOUT" | "HTTP" | "NETWORK" | "CANCELLED";
  constructor(code: ProviderError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

export async function fetchJson(
  url: string,
  options: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<unknown> {
  const timeoutMs = options.timeoutMs ?? 5000;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new ProviderError("HTTP", `HTTP ${response.status} from ${url}`);
    }
    return (await response.json()) as unknown;
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      if (options.signal?.aborted) {
        throw new ProviderError("CANCELLED", `cancelled: ${url}`);
      }
      throw new ProviderError("TIMEOUT", `timeout after ${timeoutMs}ms: ${url}`);
    }
    throw new ProviderError(
      "NETWORK",
      `unreachable: ${url} (${error instanceof Error ? error.message : String(error)})`,
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }
}

export class ProviderRegistry {
  private providers = new Map<string, Provider>();

  register(provider: Provider): void {
    if (!provider.id) throw new Error("provider id is required");
    this.providers.set(provider.id, provider);
  }

  get(id: string): Provider | undefined {
    return this.providers.get(id);
  }

  list(): Provider[] {
    return [...this.providers.values()];
  }

  // Never throws: every provider resolves to a report, failures included.
  async checkAll(timeoutMs = 8000): Promise<Record<string, ProviderReport>> {
    const out: Record<string, ProviderReport> = {};
    await Promise.all(
      this.list().map(async (provider) => {
        const started = Date.now();
        try {
          const report = await provider.check(
            AbortSignal.timeout(Math.max(1, timeoutMs)),
          );
          report.latencyMs = Date.now() - started;
          out[provider.id] = report;
        } catch (error) {
          out[provider.id] = baseReport(provider.id, provider.kind, {
            state: "ERROR",
            detail: "provider check threw",
            latencyMs: Date.now() - started,
            errorCode: "CHECK_THREW",
            errorDetail: error instanceof Error ? error.message : String(error),
          });
        }
      }),
    );
    return out;
  }
}
