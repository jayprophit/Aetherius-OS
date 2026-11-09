/**
 * Token-free local inference through an Ollama daemon.
 *
 * The daemon is never started, installed or asked to pull a model. If it is
 * not running, or no model is installed, the caller gets an honest failure
 * and can decide what to show the user. This is the default AI path: it costs
 * no API tokens and sends no prompt off the machine.
 *
 * Fixed 2026-11-09: Qwen3.5 returned empty text when `think` was omitted
 * (thinking tokens consumed `num_predict`). Requests now send top-level
 * `think: false` by default and treat empty/whitespace content as an error,
 * never a success.
 */

import { getOllamaUrl } from "./runtimeCredentials";

export interface LocalChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LocalChatOptions {
  baseUrl?: string;
  model?: string;
  temperature?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Top-level `think` value. Defaults to false (verified for qwen3.5:0.8b on Ollama 0.40.6). */
  think?: boolean;
  /** Output token cap (`options.num_predict`). Unset allows model default. */
  numPredict?: number;
}

export type LocalChatResult =
  | { ok: true; text: string; model: string; latencyMs: number; evalCount?: number; doneReason?: string }
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

/** Installed model names, or an empty list when the daemon is unavailable. */
export async function listLocalModels(baseUrl = getOllamaUrl()): Promise<string[]> {
  const fetchFn = fetchImpl();
  if (!fetchFn) return [];
  try {
    const response = await fetchFn(`${baseUrl}/api/tags`, { method: "GET" });
    if (!response.ok) return [];
    const data = (await readJson<OllamaTagsResponse>(response)) ?? {};
    return (data.models ?? [])
      .map((model) => String(model.name ?? "").trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Prefer a measured-functioning model, else the first installed one. Explicit `requested` always wins. */
export function chooseLocalModel(models: string[], requested?: string): string | null {
  if (requested && models.includes(requested)) return requested;
  for (const preference of MODEL_PREFERENCE) {
    const match = models.find((model) => model.toLowerCase().includes(preference.toLowerCase()));
    if (match) return match;
  }
  return models[0] ?? null;
}

/**
 * Send a non-streaming chat request to the local daemon.
 *
 * Empty/whitespace content is `EMPTY_OUTPUT`, not success. `done_reason: "length"`
 * with reasoning-only output is `TRUNCATED`. Durations from Ollama (ns) are not
 * used to fabricate throughput; latency is wall-clock.
 */
export async function chatWithLocalModel(
  messages: LocalChatMessage[],
  options: LocalChatOptions = {},
): Promise<LocalChatResult> {
  const fetchFn = fetchImpl();
  if (!fetchFn) return { ok: false, code: "RUNTIME_UNAVAILABLE", error: "fetch is unavailable" };

  const baseUrl = options.baseUrl ?? getOllamaUrl();
  const models = await listLocalModels(baseUrl);
  if (models.length === 0) {
    return {
      ok: false,
      code: "RUNTIME_UNAVAILABLE",
      error: `No local model runtime responded at ${baseUrl}. Start Ollama and install a model, or opt in to a remote provider at runtime.`,
    };
  }

  const model = chooseLocalModel(models, options.model);
  if (!model) return { ok: false, code: "NO_MODEL", error: "No local model is installed." };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error("timeout")), options.timeoutMs ?? 120_000);
  const abortFromCaller = () => controller.abort(options.signal?.reason);
  if (options.signal) {
    if (options.signal.aborted) controller.abort(options.signal.reason);
    else options.signal.addEventListener("abort", abortFromCaller, { once: true });
  }

  const started = Date.now();
  const think = options.think ?? false;
  const body: Record<string, unknown> = {
    model,
    messages,
    stream: false,
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
    const data = (await readJson<OllamaChatResponse>(response)) ?? {};
    const content = typeof data.message?.content === "string" ? data.message.content : "";
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
    return { ok: true, text: trimmed, model, latencyMs: Date.now() - started, evalCount, doneReason };
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
