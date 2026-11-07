/**
 * Runtime-only AI credentials and endpoints.
 *
 * Aetherius does not inject an API key at build time. A key that is compiled
 * into the bundle is published with the bundle, so the build deliberately
 * carries none. The browser-side legacy views can use:
 *
 *  - a session-scoped key supplied by the user at runtime, or
 *  - a host-provided runtime configuration object set before the app boots.
 *
 * Session storage is used rather than local storage: the key survives a
 * reload in the same tab, but it is not written to the persistent profile.
 * The local Ollama runtime is the default and needs no key at all.
 */

export interface RuntimeAiConfig {
  /** Optional Gemini key supplied by the host at runtime. */
  geminiApiKey?: string;
  /** Local Ollama endpoint. Defaults to the loopback daemon. */
  ollamaUrl?: string;
  /** Preferred provider. Local is the privacy-first default. */
  preferredProvider?: "local" | "gemini";
}

declare global {
  // Hosts may set this before the application module boots. It is a runtime
  // injection point, not a build-time define.
  var __AETHERIUS_RUNTIME_CONFIG__: RuntimeAiConfig | undefined;
}

const SESSION_KEY = "aetherius.ai.geminiKey";
const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";

function sessionStorageOrNull(): Storage | null {
  try {
    return (globalThis as { sessionStorage?: Storage }).sessionStorage ?? null;
  } catch {
    return null;
  }
}

/** The host-provided key, if any. */
function hostKey(): string | undefined {
  const value = globalThis.__AETHERIUS_RUNTIME_CONFIG__?.geminiApiKey;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/**
 * The Gemini key available to this session, or undefined.
 *
 * Nothing here reads `process.env`: a build-time environment variable is not
 * a runtime secret and must never be treated as one.
 */
export function getRuntimeGeminiKey(): string | undefined {
  const fromHost = hostKey();
  if (fromHost) return fromHost;
  try {
    const stored = sessionStorageOrNull()?.getItem(SESSION_KEY);
    return stored && stored.trim() ? stored.trim() : undefined;
  } catch {
    return undefined;
  }
}

/** Supply a key for the current tab, or clear it with null. */
export function setRuntimeGeminiKey(key: string | null): void {
  try {
    const storage = sessionStorageOrNull();
    if (!storage) return;
    if (key && key.trim()) storage.setItem(SESSION_KEY, key.trim());
    else storage.removeItem(SESSION_KEY);
  } catch {
    // Storage blocked: the in-memory host configuration still works.
  }
}

export function hasRuntimeGeminiKey(): boolean {
  return getRuntimeGeminiKey() !== undefined;
}

/** The local Ollama endpoint, always loopback unless the host says otherwise. */
export function getOllamaUrl(): string {
  const configured = globalThis.__AETHERIUS_RUNTIME_CONFIG__?.ollamaUrl;
  if (typeof configured === "string" && configured.trim()) return configured.trim();
  return DEFAULT_OLLAMA_URL;
}

/** The preferred provider. Local is the default so inference stays token-free. */
export function getPreferredProvider(): "local" | "gemini" {
  return globalThis.__AETHERIUS_RUNTIME_CONFIG__?.preferredProvider === "gemini"
    ? "gemini"
    : "local";
}
