/**
 * AI provider abstraction for Genesis Human.
 *
 * One interface, four possible runtimes, honest labels. The interface never
 * claims the native Genesis model: it names the runtime that actually
 * answered.
 *
 * - `local-ollama` — the token-free default on the owner's machine
 *   (`http://127.0.0.1:11434`). The Cloudflare-hosted PWA cannot reach
 *   `127.0.0.1` on other clients' devices; that is labelled UNVERIFIED
 *   until a paired local companion ships (see docs below).
 * - `genesis-server` — the native Genesis model server (Hermes-owned).
 *   Not started by this session; the provider reports it as not configured
 *   until an endpoint is supplied at runtime.
 * - `agent-bridge` — the local Agent Bridge tool/route service. Tool calls
 *   need explicit permission checks; the provider only reports state.
 * - `offline-fallback` — rule-based demo. Always available, always labelled.
 *
 * Remote hosted providers (Gemini/Groq) are out of scope here: they need a
 * runtime session key and are handled by the existing runtime-credentials
 * path, not by this abstraction. Nothing in this file injects a key.
 */

import { chatWithLocalModel, listLocalModels } from "./localClient";
import { getOllamaUrl } from "./runtimeCredentials";

export type ProviderId = "local-ollama" | "genesis-server" | "agent-bridge" | "offline-fallback";

export interface ProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderResult {
  ok: boolean;
  provider: ProviderId;
  /** Human-readable label, e.g. "LOCAL OLLAMA · qwen2.5:..." */
  label: string;
  text?: string;
  error?: string;
}

export interface ProviderState {
  id: ProviderId;
  label: string;
  available: boolean;
  detail: string;
}

function offlineReply(input: string): string {
  const text = input.toLowerCase();
  if (/(hello|hi|hey|good morning|good evening)/.test(text)) {
    return "Hello. I'm Genesis Human in offline demo mode — no local model answered, so this is a rule-based reply, not Genesis intelligence. Start Ollama and install a model, or keep chatting like this.";
  }
  if (text.includes("voight") || text.includes("kampff") || text.includes("evaluation") || text.includes("turing")) {
    return "The Voight-Kampff check for Genesis tracks emotional appropriateness, contextual understanding, latency and interruption handling. A behavioural check cannot prove consciousness. Use the evaluation button to run the three-question protocol.";
  }
  if (text.includes("who are you") || text.includes("introduce")) {
    return "I'm Genesis Human, the Aetherius first-party AI-human prototype. I speak through a local Ollama model when one answers, and an offline fallback otherwise. My face is a lightweight 2D renderer — not a photoreal diffusion avatar.";
  }
  if (text.includes("what can you do") || text.includes("help")) {
    return "I can chat, speak replies aloud, listen with the microphone, show a camera preview if you enable it, and log Agent Bridge requests for approval. Try the evaluation, or type a question.";
  }
  if (text.includes("time") || text.includes("date")) {
    return `It is ${new Date().toLocaleTimeString()} on ${new Date().toLocaleDateString()}. (Offline clock reply.)`;
  }
  return `I heard "${input}". Offline mode: start the local Ollama daemon with a model installed and I will answer through it instead.`;
}

/** Probe the local Ollama daemon without sending any prompt. */
export async function probeLocalOllama(): Promise<ProviderState> {
  const url = getOllamaUrl();
  const models = await listLocalModels(url);
  if (models.length === 0) {
    return {
      id: "local-ollama",
      label: "LOCAL OLLAMA",
      available: false,
      detail: `No daemon answered at ${url}`,
    };
  }
  return {
    id: "local-ollama",
    label: `LOCAL OLLAMA · ${models[0]}`,
    available: true,
    detail: `${models.length} model(s) installed on this device`,
  };
}

/**
 * Send a chat turn, preferring local Ollama, otherwise falling back to the
 * labelled offline responder. The genesis-server and agent-bridge providers
 * are reported as not configured rather than silently skipped: there is no
 * endpoint in the preview build and Hermes owns the training side.
 */
export async function chatWithProvider(
  history: ProviderMessage[],
  options: { preferLocal?: boolean; timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<ProviderResult> {
  const preferLocal = options.preferLocal !== false;
  if (preferLocal) {
    const result = await chatWithLocalModel(history, {
      timeoutMs: options.timeoutMs ?? 45_000,
      signal: options.signal,
    });
    if (result.ok) {
      return {
        ok: true,
        provider: "local-ollama",
        label: `LOCAL OLLAMA · ${result.model} · ${(result.latencyMs / 1000).toFixed(1)}s`,
        text: result.text,
      };
    }
  }
  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  return {
    ok: true,
    provider: "offline-fallback",
    label: "OFFLINE FALLBACK · rule-based demo",
    text: offlineReply(lastUser),
  };
}
