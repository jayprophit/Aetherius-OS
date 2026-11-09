/**
 * Token-free local inference through an Ollama daemon.
 *
 * Fixed 2026-11-09: Qwen3.5 returned empty text when `think` was omitted
 * (thinking tokens consumed `num_predict`). Requests now send top-level
 * `think: false` by default and treat empty/whitespace content as an error,
 * never a success.
 *
 * Hardened 2026-11-09: explicit model-absent error, fallback policy,
 * discovery timeout, per-model think compatibility, streamed cancellation,
 * and separate load/generation/total latency (Ollama ns → ms).
 */

import { getOllamaUrl } from "./runtimeCredentials";

export interface LocalChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LocalChatOptions {
  baseUrl?: string;
  model?: string;
  /** Fallback policy: "none" = requested model must exist (error if absent); "auto" = measured preference, then first installed. Default "auto". */
  fallback?: "none" | "auto";
  temperature?: number;
  timeoutMs?: number;
  discoveryTimeoutMs?: number;
  signal?: AbortSignal;
  think?: boolean;
  numPredict?: number;
  /** Streaming: if true, accumulate NDJSON chunks with cancellation. Defaults false. */
  stream?: boolean;
  onToken?: (token: string) => void;
}

export type LocalChatResult =
  | { ok: true; text: string; model: string; latencyMs: number; evalCount?: number; doneReason?: string; loadMs?: number; genMs?: number; totalMs?: number }
  | { ok: false; code: "RUNTIME_UNAVAILABLE" | "NO_MODEL" | "TIMEOUT" | "CANCELLED" | "EMPTY_OUTPUT" | "TRUNCATED" | "ERROR"; error: string };

interface OllamaTagsResponse {
  models?: Array<{ name?: string }>;
}

interface OllamaChatResponse {
  model?: unknown;
  message?: { content?: unknown; thinking?: unknown };
  done_reason?: unknown;
  eval_count?: unknown;
  eval_duration?: unknown;
  load_duration?: unknown;
  total_duration?: unknown;
}

const MODEL_PREFERENCE = [
  "qwen3.5:0.8b",
  "qwen3:1.7b",
  "qwen2.5",
  "qwen",
  "llama3",
  "llama",
  "mistral",
  "gemma",
  "phi",
  "deepseek",
];

function fetchImpl(): typeof fetch | null {
  return typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : null;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return JSON.parse(text) as T;
}

function nsToMs(ns: unknown): number | undefined {
  return typeof ns === "number" && Number.isFinite(ns) ? Math.round(ns / 1_000_000) : undefined;
}

/** Installed model names, or an empty list when the daemon is unavailable. Bounded by `timeoutMs` and `signal`. */
export async function listLocalModels(baseUrl = getOllamaUrl(), opts: { timeoutMs?: number; signal?: AbortSignal } = {}): Promise<string[]> {
  const fetchFn = fetchImpl();
  if (!fetchFn) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("timeout")), opts.timeoutMs ?? 5000);
  const onAbort = () => controller.abort(opts.signal?.reason);
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort(opts.signal.reason);
    else opts.signal.addEventListener("abort", onAbort, { once: true });
  }
  try {
    const response = await fetchFn(`${baseUrl}/api/tags`, { method: "GET", signal: controller.signal });
    if (!response.ok) return [];
    const data = (await readJson<OllamaTagsResponse>(response)) ?? {};
    return (data.models ?? [])
      .map((model) => String(model.name ?? "").trim())
      .filter(Boolean);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onAbort);
  }
}

/** Prefer a measured-functioning model, else the first installed one. Explicit `requested` always wins. */
export function chooseLocalModel(models: string[], requested?: string, fallback: "none" | "auto" = "auto"): string | null {
  if (requested) {
    if (models.includes(requested)) return requested;
    if (fallback === "none") return null;
    // fallback auto: fall through to measured preference rather than silent substitution
  }
  for (const preference of MODEL_PREFERENCE) {
    const match = models.find((model) => model.toLowerCase().includes(preference.toLowerCase()));
    if (match) return match;
  }
  return models[0] ?? null;
}

export async function chatWithLocalModel(
  messages: LocalChatMessage[],
  options: LocalChatOptions = {},
): Promise<LocalChatResult> {
  const fetchFn = fetchImpl();
  if (!fetchFn) return { ok: false, code: "RUNTIME_UNAVAILABLE", error: "fetch is unavailable" };

  const baseUrl = options.baseUrl ?? getOllamaUrl();
  const models = await listLocalModels(baseUrl, { timeoutMs: options.discoveryTimeoutMs ?? 5000, signal: options.signal });
  if (models.length === 0) {
    return {
      ok: false,
      code: "RUNTIME_UNAVAILABLE",
      error: `No local model runtime responded at ${baseUrl}. Start Ollama and install a model, or opt in to a remote provider at runtime.`,
    };
  }

  const fallback = options.fallback ?? "auto";
  if (options.model && !models.includes(options.model) && fallback === "none") {
    return {
      ok: false,
      code: "NO_MODEL",
      error: `Requested model "${options.model}" is not installed. Installed: ${models.join(", ")}.`,
    };
  }
  const model = chooseLocalModel(models, options.model, fallback);
  if (!model) {
    const detail = options.model ? `Requested model "${options.model}" is not installed.` : "No local model is installed.";
    return { ok: false, code: "NO_MODEL", error: detail };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error("timeout")), options.timeoutMs ?? 120_000);
  const abortFromCaller = () => controller.abort(options.signal?.reason);
  if (options.signal) {
    if (options.signal.aborted) controller.abort(options.signal.reason);
    else options.signal.addEventListener("abort", abortFromCaller, { once: true });
  }

  const started = Date.now();
  const think = options.think ?? false;
  const stream = options.stream ?? false;
  const body: Record<string, unknown> = {
    model,
    messages,
    stream,
    think,
  };
  const ollamaOptions: Record<string, unknown> = {};
  if (options.temperature !== undefined) ollamaOptions.temperature = options.temperature;
  if (options.numPredict !== undefined) ollamaOptions.num_predict = options.numPredict;
  if (Object.keys(ollamaOptions).length > 0) body.options = ollamaOptions;

  try {
    const response = await fetchFn(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        ok: false,
        code: "ERROR",
        error: `Local model runtime responded HTTP ${response.status}.`,
      };
    }
    let data: OllamaChatResponse;
    let content = "";
    if (stream && response.body) {
      // Streamed NDJSON accumulation with cancellation (no fabricated output on truncation).
      const reader = (response.body as ReadableStream<Uint8Array>).getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let thinking = false;
      let doneReason: string | undefined;
      let evalCount: number | undefined;
      let accum = "";
      try {
        while (true) {
          if (controller.signal.aborted) throw new Error("timeout");
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const chunk = JSON.parse(line) as OllamaChatResponse & { done_reason?: unknown; eval_count?: unknown };
            const c = typeof chunk.message?.content === "string" ? chunk.message.content : "";
            if (c) {
              accum += c;
              options.onToken?.(c);
            }
            if (typeof chunk.message?.thinking === "string" && chunk.message.thinking !== "") thinking = true;
            if (typeof chunk.done_reason === "string") doneReason = chunk.done_reason;
            if (typeof chunk.eval_count === "number") evalCount = chunk.eval_count;
            if (typeof (chunk as Record<string, unknown>).done === "boolean" && (chunk as Record<string, unknown>).done === true) {
              // ignore, defers to doneReason
            }
          }
        }
      } finally {
        try { reader.cancel(); } catch { /* ignore */ }
      }
      data = { model, message: { content: accum, thinking: thinking ? "thinking" : undefined }, done_reason: doneReason, eval_count: evalCount };
      content = accum;
      const doneReasonStr = doneReason;
      if (content.trim() === "") {
        if (doneReasonStr === "length") return { ok: false, code: "TRUNCATED", error: `Local model ${model} truncated during reasoning (done_reason=length) with no displayable output. Increase num_predict or set think:false.` };
        return { ok: false, code: "EMPTY_OUTPUT", error: `Local model ${model} returned empty output (streamed).` };
      }
      return { ok: true, text: content.trim(), model, latencyMs: Date.now() - started, evalCount: evalCount, doneReason: doneReasonStr };
    }
    data = (await readJson<OllamaChatResponse>(response)) ?? {};
    content = typeof data.message?.content === "string" ? data.message.content : "";
    const trimmed = content.trim();
    const doneReason = typeof data.done_reason === "string" ? data.done_reason : undefined;
    const hasThinking = data.message?.thinking !== undefined && data.message?.thinking !== null && String(data.message.thinking ?? "").trim() !== "";

    if (trimmed === "") {
      if (doneReason === "length") {
        return {
          ok: false,
          code: "TRUNCATED",
          error: `Local model ${model} truncated during reasoning (done_reason=length) with no displayable output. Increase num_predict or set think:false.`,
        };
      }
      if (hasThinking) {
        return {
          ok: false,
          code: "EMPTY_OUTPUT",
          error: `Local model ${model} returned reasoning only with no displayable content. Try think:false.`,
        };
      }
      return {
        ok: false,
        code: "EMPTY_OUTPUT",
        error: `Local model ${model} returned empty output.`,
      };
    }
    const evalCount = typeof data.eval_count === "number" ? data.eval_count : undefined;
    return { ok: true, text: trimmed, model, latencyMs: Date.now() - started, evalCount, doneReason, loadMs: nsToMs(data.load_duration), genMs: nsToMs(data.eval_duration), totalMs: nsToMs(data.total_duration) };
  } catch (error) {
    if (options.signal?.aborted) return { ok: false, code: "CANCELLED", error: "Request cancelled." };
    if (error instanceof Error && (error.name === "AbortError" || error.message === "timeout")) {
      return { ok: false, code: "TIMEOUT", error: "Local model request timed out." };
    }
    return {
      ok: false,
      code: "ERROR",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}
