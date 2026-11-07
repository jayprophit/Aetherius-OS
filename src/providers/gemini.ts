/**
 * Google Gemini invocation adapter (remote, cloud-allowed only).
 *
 * Uses the v1beta generateContent surface with an API key supplied by
 * reference. Roles are translated to Gemini's `user`/`model` vocabulary and
 * usage is normalized into the neutral contract. No key is stored in the card,
 * the log or the request.
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

const DEFAULT_BASE = "https://generativelanguage.googleapis.com/v1beta";

export interface GeminiAdapterOptions {
  baseUrl?: string;
  fetchFn?: FetchLike;
}

interface GeminiModel {
  name?: string;
}

/** Gemini speaks `user`/`model`; the neutral contract speaks `user`/`assistant`. */
function toGeminiRole(role: string): string {
  return role === "assistant" ? "model" : role;
}

function toNeutralRole(role: string): string {
  return role === "model" ? "assistant" : role;
}

export class GeminiAdapter extends RemoteAdapter {
  readonly providerId = "gemini";
  readonly runtimeId = "gemini";
  private readonly baseUrl: string;

  constructor(credentials: CredentialResolver, options: GeminiAdapterOptions = {}) {
    super({ credentialRef: "keepass:API/gemini", credentials, fetchFn: options.fetchFn });
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, "");
  }

  /** Accept either `gemini-2.5-flash` or `models/gemini-2.5-flash`. */
  private apiModel(modelId: string): string {
    return modelId.startsWith("models/") ? modelId : `models/${modelId}`;
  }

  async supports(modelId: string): Promise<SupportVerdict> {
    const key = await this.secret();
    if (!key) return "unknown";
    let res: Response;
    try {
      res = await this.fetchFn(`${this.baseUrl}/models?key=${encodeURIComponent(key)}`);
    } catch {
      return "unknown";
    }
    if (!res.ok) return "unknown";
    try {
      const data = (await res.json()) as { models?: GeminiModel[] };
      return (data.models ?? []).some((m) => m.name === this.apiModel(modelId));
    } catch {
      return "unknown";
    }
  }

  async invoke(request: InvokeRequest): Promise<InvokeResult> {
    const started = Date.now();
    const route = `gemini/gemini/${request.modelId}`;
    const key = await this.secret();
    if (!key) {
      return failure(request, "AUTH_REQUIRED", "no Gemini credential resolved",
        Date.now() - started, route);
    }

    const { signal, done } = abortWithTimeout(request.signal, request.timeoutMs);
    try {
      const systemText = request.messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n");
      const body: Record<string, unknown> = {
        contents: request.messages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: toGeminiRole(m.role),
            parts: [{ text: m.content }],
          })),
      };
      if (systemText.trim()) {
        // Gemini has no `system` role in contents; it uses systemInstruction.
        body.systemInstruction = { parts: [{ text: systemText }] };
      }
      const generationConfig: Record<string, unknown> = {};
      if (request.temperature !== undefined) generationConfig.temperature = request.temperature;
      if (request.maxTokens !== undefined) generationConfig.maxOutputTokens = request.maxTokens;
      if (Object.keys(generationConfig).length > 0) body.generationConfig = generationConfig;

      const res = await this.fetchFn(
        `${this.baseUrl}/${this.apiModel(request.modelId)}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal,
        },
      );

      if (!res.ok) {
        const detail = (await res.text()).slice(0, 500);
        return failure(request, codeForStatus(res.status), `gemini HTTP ${res.status}`,
          Date.now() - started, route, detail);
      }

      const data = (await res.json()) as {
        candidates?: Array<{
          content?: { role?: string; parts?: Array<{ text?: unknown }> };
          finishReason?: unknown;
        }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          totalTokenCount?: number;
        };
      };

      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts
        ?.map((p) => (typeof p.text === "string" ? p.text : ""))
        .join("");
      if (typeof text !== "string" || text.length === 0) {
        return failure(request, "MALFORMED_RESPONSE",
          "gemini response has no candidate content", Date.now() - started, route);
      }

      const usage =
        typeof data.usageMetadata?.promptTokenCount === "number" ||
        typeof data.usageMetadata?.candidatesTokenCount === "number"
          ? {
              ...(typeof data.usageMetadata?.promptTokenCount === "number"
                ? { inputTokens: data.usageMetadata.promptTokenCount }
                : {}),
              ...(typeof data.usageMetadata?.candidatesTokenCount === "number"
                ? { outputTokens: data.usageMetadata.candidatesTokenCount }
                : {}),
              ...(typeof data.usageMetadata?.totalTokenCount === "number"
                ? { totalTokens: data.usageMetadata.totalTokenCount }
                : {}),
            }
          : undefined;

      return {
        ok: true,
        requestId: request.requestId,
        providerId: request.providerId,
        modelId: request.modelId,
        runtimeId: request.runtimeId,
        output: text,
        finishReason:
          typeof candidate?.finishReason === "string" ? candidate.finishReason : "unknown",
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
        return failure(request, "TIMEOUT", `gemini invocation exceeded ${request.timeoutMs}ms`,
          Date.now() - started, route);
      }
      return failure(request, "TRANSPORT_ERROR",
        error instanceof Error ? error.message : String(error), Date.now() - started, route);
    } finally {
      done();
    }
  }
}

export { toGeminiRole, toNeutralRole };
