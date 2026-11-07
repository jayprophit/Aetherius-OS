/**
 * Token-free local inference through an Ollama daemon.
 *
 * The daemon is never started, installed or asked to pull a model. If it is
 * not running, or no model is installed, the caller gets an honest failure
 * and can decide what to show the user. This is the default AI path: it costs
 * no API tokens and sends no prompt off the machine.
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
}

export type LocalChatResult =
  | { ok: true; text: string; model: string; latencyMs: number }
  | { ok: false; code: "RUNTIME_UNAVAILABLE" | "NO_MODEL" | "TIMEOUT" | "CANCELLED" | "ERROR"; error: string };

interface OllamaTagsResponse {
  models?: Array<{ name?: string }>;
}

interface OllamaChatResponse {
  message?: { content?: unknown };
  done_reason?: unknown;
}

const MODEL_PREFERENCE = [
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

/** Prefer a small general-purpose model, then the first installed one. */
export function chooseLocalModel(models: string[], requested?: string): string | null {
  if (requested && models.includes(requested)) return requested;
  for (const preference of MODEL_PREFERENCE) {
    const match = models.find((model) => model.toLowerCase().includes(preference));
    if (match) return match;
  }
  return models[0] ?? null;
}

/**
 * Send a non-streaming chat request to the local daemon.
 *
 * The result is a discriminated union rather than a thrown error: callers
 * render an honest state instead of a blank panel.
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
  try {
    const response = await fetchFn(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        ...(options.temperature === undefined ? {} : { options: { temperature: options.temperature } }),
      }),
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
    if (typeof data.message?.content !== "string") {
      return { ok: false, code: "ERROR", error: "Local model returned no message content." };
    }
    return { ok: true, text: data.message.content, model, latencyMs: Date.now() - started };
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
