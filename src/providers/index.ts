/**
 * Provider adapter wiring (P10-PROVIDERS / P18-invoke).
 *
 * Builds the canonical AdapterRegistry from the existing adapters. Local
 * (Ollama) stays the privacy-first fallback; remote adapters are registered
 * alongside it and are rejected for LOCAL_ONLY requests by invokeRoute.
 *
 * Credentials are supplied by reference — this module never sees a secret.
 */

import { AdapterRegistry } from "./invoke.ts";
import { OllamaAdapter } from "./ollama.ts";
import { GroqAdapter } from "./groq.ts";
import { GeminiAdapter } from "./gemini.ts";
import { REMOTE_CARDS } from "./catalog.ts";
import type { CredentialResolver, FetchLike } from "./remote.ts";
import type { ModelCard } from "./capabilities.ts";

export interface BuildRegistryOptions {
  /** Resolves stable credential references (e.g. "keepass:API/groq"). */
  credentials: CredentialResolver;
  fetchFn?: FetchLike;
  /** Local Ollama endpoint. */
  ollamaUrl?: string;
  /** Register the local Ollama adapter (default true; it is the fallback). */
  includeLocal?: boolean;
}

export function buildAdapterRegistry(options: BuildRegistryOptions): AdapterRegistry {
  const registry = new AdapterRegistry();
  if (options.includeLocal !== false) {
    registry.register(
      new OllamaAdapter(options.ollamaUrl ?? "http://127.0.0.1:11434", options.fetchFn),
    );
  }
  registry.register(new GroqAdapter(options.credentials, { fetchFn: options.fetchFn }));
  registry.register(new GeminiAdapter(options.credentials, { fetchFn: options.fetchFn }));
  return registry;
}

export { REMOTE_CARDS };
export type { ModelCard, CredentialResolver };
