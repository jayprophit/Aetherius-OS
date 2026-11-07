/**
 * Aetherius Cloud — provider wiring.
 *
 * Consumes the canonical OS provider registry (src/providers) so the cloud app,
 * Genesis and Agent Bridge all share ONE adapter set, ONE router and ONE
 * credential-reference mechanism. No duplicate gateway, router or vault.
 *
 * Local Ollama stays registered as the privacy-first fallback; Groq and Gemini
 * are remote and are rejected for LOCAL_ONLY requests by invokeRoute.
 */

export {
  buildAdapterRegistry,
  REMOTE_CARDS,
} from "../../../src/providers/index.ts";
export { GroqAdapter } from "../../../src/providers/groq.ts";
export { GeminiAdapter } from "../../../src/providers/gemini.ts";
export {
  GROQ_CARDS,
  GEMINI_CARDS,
} from "../../../src/providers/catalog.ts";
export type {
  CredentialResolver,
  FetchLike,
} from "../../../src/providers/remote.ts";
export { invokeRoute } from "../../../src/providers/invoke.ts";
export type {
  InvokeRequest,
  InvokeResult,
  InvocationAdapter,
} from "../../../src/providers/invoke.ts";
