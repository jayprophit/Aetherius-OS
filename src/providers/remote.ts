/**
 * REQ-p18-invoke: shared base for remote (cloud) HTTP inference adapters.
 *
 * Remote adapters never run locally. `invokeRoute` rejects LOCAL_ONLY requests
 * before an adapter is reached, and every remote adapter reports
 * `local = false` so the privacy boundary is enforced structurally.
 *
 * Credentials are supplied by STABLE REFERENCE through a CredentialResolver:
 * no key is hardcoded, embedded in a model card, logged or placed in a prompt.
 */

import type {
  InvokeFailure,
  InvokeRequest,
  InvokeResult,
  InvocationAdapter,
  SupportVerdict,
} from "./invoke.ts";

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Resolves a stable credential reference (e.g. `keepass:API/groq`) to a secret.
 * Returning undefined means "not configured" — never an empty-string guess.
 */
export type CredentialResolver = (
  reference: string,
) => string | undefined | Promise<string | undefined>;

export interface RemoteAdapterConfig {
  /** Stable reference passed to the resolver. */
  credentialRef: string;
  credentials: CredentialResolver;
  fetchFn?: FetchLike;
}

export const DEFAULT_TIMEOUT_MS = 60_000;

export function failure(
  request: InvokeRequest,
  code: InvokeFailure["code"],
  message: string,
  latencyMs: number,
  route: string,
  nativeDetail?: string,
): InvokeResult {
  return {
    ok: false,
    requestId: request.requestId,
    providerId: request.providerId,
    modelId: request.modelId,
    runtimeId: request.runtimeId,
    latencyMs,
    provenance: { route, observedHealth: "checked-at-invoke", benchmarkUsed: false },
    error: { code, message, nativeDetail },
  };
}

/** Map a provider HTTP status onto the neutral failure vocabulary. */
export function codeForStatus(status: number): InvokeFailure["code"] {
  if (status === 401 || status === 403) return "AUTH_REQUIRED";
  if (status === 404) return "MODEL_NOT_AVAILABLE";
  if (status === 408) return "TIMEOUT";
  if (status === 413) return "CONTEXT_LIMIT_EXCEEDED";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "PROVIDER_UNAVAILABLE";
  return "PROVIDER_ERROR";
}

export abstract class RemoteAdapter implements InvocationAdapter {
  abstract readonly providerId: string;
  abstract readonly runtimeId: string;
  readonly local = false;

  abstract supports(modelId: string): SupportVerdict | Promise<SupportVerdict>;
  abstract invoke(request: InvokeRequest): Promise<InvokeResult>;
  protected readonly credentialRef: string;
  protected readonly credentials: CredentialResolver;
  protected readonly fetchFn: FetchLike;

  protected constructor(cfg: RemoteAdapterConfig) {
    this.credentialRef = cfg.credentialRef;
    this.credentials = cfg.credentials;
    this.fetchFn = cfg.fetchFn ?? ((url, init) => fetch(url, init));
  }

  /** Resolve the credential, or undefined when the reference is unconfigured. */
  protected secret(): Promise<string | undefined> {
    return Promise.resolve(this.credentials(this.credentialRef));
  }
}

/** Wire a caller abort signal and a timeout into one AbortController. */
export function abortWithTimeout(
  signal: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; done: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);
  const onAbort = () => controller.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      controller.abort(signal.reason);
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  }
  return {
    signal: controller.signal,
    done: () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    },
  };
}

/** True when an error is a timeout/abort raised by abortWithTimeout. */
export function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.message === "timeout");
}
