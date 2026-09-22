import type {
  InvocationAdapter,
  InvokeFailure,
  InvokeRequest,
  InvokeResult,
} from "./invoke";

export type FetchFn = (url: string, init: RequestInit) => Promise<Response>;

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`malformed JSON response: ${text.slice(0, 200)}`);
  }
}

function withTimeout(signal: AbortSignal | undefined, timeoutMs: number): { signal: AbortSignal; done: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      controller.abort(signal.reason);
    } else {
      signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
    }
  }
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

/**
 * Ollama invocation adapter (local runtime).
 *
 * - Uses the configured endpoint only; never starts/pulls/stops anything.
 * - Checks model availability via /api/tags before invoking.
 * - Normalizes Ollama responses and errors into the neutral contract.
 * - Captures real usage fields when present; unknown fields stay unknown.
 */
export class OllamaAdapter implements InvocationAdapter {
  readonly providerId = "local";
  readonly runtimeId: string;
  readonly local = true;

  constructor(
    private readonly baseUrl = "http://127.0.0.1:11434",
    private readonly fetchFn: FetchFn = (url, init) => fetch(url, init),
    runtimeId = "ollama",
  ) {
    this.runtimeId = runtimeId;
  }

  async supports(modelId: string): Promise<boolean | "unknown"> {
    let response: Response;
    try {
      response = await this.fetchFn(`${this.baseUrl}/api/tags`, {});
    } catch {
      return "unknown";
    }
    if (!response.ok) return false;
    let data: { models?: Array<{ name?: string }> };
    try {
      data = (await readJson(response)) as { models?: Array<{ name?: string }> };
    } catch {
      return "unknown";
    }
    return (data.models ?? []).some((m) => String(m.name ?? "") === modelId);
  }

  async invoke(request: InvokeRequest): Promise<InvokeResult> {
    const started = Date.now();
    const provenance = { route: `local/${this.runtimeId}/${request.modelId}`, observedHealth: "checked-at-invoke", benchmarkUsed: false };
    const fail = (code: InvokeFailure["code"], message: string, nativeDetail?: string): InvokeResult => ({
      ok: false,
      requestId: request.requestId,
      providerId: request.providerId,
      modelId: request.modelId,
      runtimeId: this.runtimeId,
      latencyMs: Date.now() - started,
      provenance,
      error: { code, message, nativeDetail },
    });

    let available: boolean | "unknown" = "unknown";
    try {
      available = await this.supports(request.modelId);
    } catch (error) {
      return fail("TRANSPORT_ERROR", "model availability check failed", String(error));
    }
    if (available === "unknown") {
      // Availability unverifiable: probe the daemon to distinguish a dead
      // runtime (RUNTIME_UNAVAILABLE) from an indeterminate state, but never
      // claim the model is missing without evidence.
      try {
        const version = await this.fetchFn(`${this.baseUrl}/api/version`, {});
        if (!version.ok) return fail("RUNTIME_UNAVAILABLE", `ollama daemon responded HTTP ${version.status}`);
      } catch {
        return fail("RUNTIME_UNAVAILABLE", `ollama daemon unreachable at ${this.baseUrl}`);
      }
      return fail("TRANSPORT_ERROR", `could not verify model ${request.modelId}; refusing to guess`);
    }
    if (!available) {
      // Distinguish "daemon down" from "model missing" with one cheap probe.
      try {
        const version = await this.fetchFn(`${this.baseUrl}/api/version`, {});
        if (!version.ok) return fail("RUNTIME_UNAVAILABLE", `ollama daemon responded HTTP ${version.status}`);
      } catch {
        return fail("RUNTIME_UNAVAILABLE", `ollama daemon unreachable at ${this.baseUrl}`);
      }
      return fail("MODEL_NOT_AVAILABLE", `model ${request.modelId} is not installed (no auto-pull)`);
    }

    const { signal, done } = withTimeout(request.signal, request.timeoutMs);
    try {
      const body: Record<string, unknown> = {
        model: request.modelId,
        messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
        stream: false,
      };
      if (request.temperature !== undefined) body.options = { temperature: request.temperature };
      const response = await this.fetchFn(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      if (response.status === 404) {
        return fail("MODEL_NOT_AVAILABLE", `model ${request.modelId} not found by daemon`);
      }
      if (!response.ok) {
        return fail("PROVIDER_ERROR", `ollama HTTP ${response.status}`, (await response.text()).slice(0, 500));
      }
      let data: {
        message?: { content?: unknown };
        done_reason?: unknown;
        prompt_eval_count?: unknown;
        eval_count?: unknown;
      };
      try {
        data = (await readJson(response)) as typeof data;
      } catch (error) {
        return fail("MALFORMED_RESPONSE", error instanceof Error ? error.message : String(error));
      }
      if (typeof data.message?.content !== "string") {
        return fail("MALFORMED_RESPONSE", "ollama response has no message.content string");
      }
      const usage =
        typeof data.prompt_eval_count === "number" || typeof data.eval_count === "number"
          ? {
              ...(typeof data.prompt_eval_count === "number" ? { inputTokens: data.prompt_eval_count } : {}),
              ...(typeof data.eval_count === "number" ? { outputTokens: data.eval_count } : {}),
            }
          : undefined;
      const total =
        usage && usage.inputTokens !== undefined && usage.outputTokens !== undefined
          ? { ...usage, totalTokens: usage.inputTokens + usage.outputTokens }
          : usage;
      return {
        ok: true,
        requestId: request.requestId,
        providerId: request.providerId,
        modelId: request.modelId,
        runtimeId: this.runtimeId,
        output: data.message.content,
        finishReason: typeof data.done_reason === "string" ? data.done_reason : "unknown",
        usage: total,
        latencyMs: Date.now() - started,
        provenance,
      };
    } catch (error) {
      // Caller cancellation takes precedence over transport shape: an abort
      // reason can be any value, so check the caller's signal first.
      if (request.signal?.aborted) {
        return fail("CANCELLED", "invocation cancelled by caller");
      }
      if (error instanceof Error && (error.name === "AbortError" || error.message === "timeout")) {
        return fail("TIMEOUT", `ollama invocation exceeded ${request.timeoutMs}ms`);
      }
      return fail("TRANSPORT_ERROR", error instanceof Error ? error.message : String(error));
    } finally {
      done();
    }
  }
}
