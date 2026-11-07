/**
 * Groq invocation adapter (remote, cloud-allowed only).
 *
 * OpenAI-compatible surface. Credential is resolved by reference at call time;
 * no key is stored in the card, the log or the request. Free-tier only: no
 * paid model is declared in the catalog.
 */

import type { InvokeRequest, InvokeResult, SupportVerdict } from "./invoke.ts";
import {
  abortWithTimeout,
  codeForStatus,
  failure,
  isTimeout,
  RemoteAdapter,
  type CredentialResolver,
  type FetchLike,
} from "./remote.ts";

const DEFAULT_BASE = "https://api.groq.com/openai/v1";

export interface GroqAdapterOptions {
  baseUrl?: string;
  fetchFn?: FetchLike;
}

interface GroqModel {
  id?: string;
}

export class GroqAdapter extends RemoteAdapter {
  readonly providerId = "groq";
  readonly runtimeId = "groq";
  private readonly baseUrl: string;

  constructor(credentials: CredentialResolver, options: GroqAdapterOptions = {}) {
    super({ credentialRef: "keepass:API/groq", credentials, fetchFn: options.fetchFn });
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, "");
  }

  async supports(modelId: string): Promise<SupportVerdict> {
    const key = await this.secret();
    if (!key) return "unknown";
    let res: Response;
    try {
      res = await this.fetchFn(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${key}` },
      });
    } catch {
      return "unknown";
    }
    if (!res.ok) return "unknown";
    try {
      const data = (await res.json()) as { data?: GroqModel[] };
      return (data.data ?? []).some((m) => m.id === modelId);
    } catch {
      return "unknown";
    }
  }

  async invoke(request: InvokeRequest): Promise<InvokeResult> {
    const started = Date.now();
    const route = `groq/groq/${request.modelId}`;
    const key = await this.secret();
    if (!key) {
      return failure(request, "AUTH_REQUIRED", "no Groq credential resolved",
        Date.now() - started, route);
    }

    const { signal, done } = abortWithTimeout(request.signal, request.timeoutMs);
    try {
      const body: Record<string, unknown> = {
        model: request.modelId,
        messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
        stream: false,
      };
      if (request.temperature !== undefined) body.temperature = request.temperature;
      if (request.maxTokens !== undefined) body.max_tokens = request.maxTokens;

      const res = await this.fetchFn(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!res.ok) {
        const detail = (await res.text()).slice(0, 500);
        return failure(request, codeForStatus(res.status), `groq HTTP ${res.status}`,
          Date.now() - started, route, detail);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: unknown }; finish_reason?: unknown }>;
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
      };
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        return failure(request, "MALFORMED_RESPONSE",
          "groq response has no choices[0].message.content", Date.now() - started, route);
      }

      const usage =
        typeof data.usage?.prompt_tokens === "number" ||
        typeof data.usage?.completion_tokens === "number"
          ? {
              ...(typeof data.usage?.prompt_tokens === "number"
                ? { inputTokens: data.usage.prompt_tokens }
                : {}),
              ...(typeof data.usage?.completion_tokens === "number"
                ? { outputTokens: data.usage.completion_tokens }
                : {}),
              ...(typeof data.usage?.total_tokens === "number"
                ? { totalTokens: data.usage.total_tokens }
                : {}),
            }
          : undefined;

      return {
        ok: true,
        requestId: request.requestId,
        providerId: request.providerId,
        modelId: request.modelId,
        runtimeId: request.runtimeId,
        output: content,
        finishReason:
          typeof data.choices?.[0]?.finish_reason === "string"
            ? data.choices[0].finish_reason
            : "unknown",
        usage,
        latencyMs: Date.now() - started,
        provenance: { route, observedHealth: "checked-at-invoke", benchmarkUsed: false },
      };
    } catch (error) {
      if (request.signal?.aborted) {
        return failure(request, "CANCELLED", "invocation cancelled by caller",
          Date.now() - started, route);
      }
      if (isTimeout(error)) {
        return failure(request, "TIMEOUT", `groq invocation exceeded ${request.timeoutMs}ms`,
          Date.now() - started, route);
      }
      return failure(request, "TRANSPORT_ERROR",
        error instanceof Error ? error.message : String(error), Date.now() - started, route);
    } finally {
      done();
    }
  }
}
