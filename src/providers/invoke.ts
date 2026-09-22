/**
 * P18/3 provider-neutral invocation contract + adapter registry.
 *
 * Routing (P18/1 + P18/2) decides WHO is eligible; this layer performs the
 * call and normalizes the outcome. A provider may be healthy, compatible
 * and selected yet still fail at invocation — ROUTING_SUCCESS and
 * INVOCATION_SUCCESS are reported separately and truthfully.
 * Inference-only: no tool execution, no automatic retries (retrying could
 * duplicate external side effects), no silent failover across privacy or
 * cost boundaries.
 */

import type { PrivacyClass } from "./capabilities";

export interface InvokeMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface InvokeRequest {
  requestId: string;
  providerId: string;
  modelId: string;
  runtimeId: string;
  messages: InvokeMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs: number;
  signal?: AbortSignal;
  privacy: PrivacyClass;
  trace?: Record<string, string>;
}

export interface InvokeUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export type InvokeErrorCode =
  | "PROVIDER_UNAVAILABLE"
  | "RUNTIME_UNAVAILABLE"
  | "MODEL_NOT_AVAILABLE"
  | "AUTH_REQUIRED"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "CANCELLED"
  | "INVALID_REQUEST"
  | "UNSUPPORTED_CAPABILITY"
  | "CONTEXT_LIMIT_EXCEEDED"
  | "TRANSPORT_ERROR"
  | "PROVIDER_ERROR"
  | "MALFORMED_RESPONSE"
  | "POLICY_DENIED"
  | "UNKNOWN_ERROR";

export interface InvokeFailure {
  code: InvokeErrorCode;
  message: string;
  /** Provider-native detail (status codes, bodies); never credentials. */
  nativeDetail?: string;
}

export interface InvokeResult {
  ok: boolean;
  requestId: string;
  providerId: string;
  modelId: string;
  runtimeId: string;
  output?: string;
  finishReason?: string;
  usage?: InvokeUsage;
  latencyMs: number;
  provenance: {
    route: string;
    observedHealth: string;
    benchmarkUsed: boolean;
  };
  error?: InvokeFailure;
}

export function validateInvokeRequest(request: InvokeRequest): string | null {
  if (!request.requestId.trim()) return "requestId is required";
  if (!request.providerId.trim()) return "providerId is required";
  if (!request.modelId.trim()) return "modelId is required";
  if (!request.runtimeId.trim()) return "runtimeId is required";
  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    return "at least one message is required";
  }
  for (const m of request.messages) {
    if (!["system", "user", "assistant"].includes(m.role)) return `invalid role ${m.role}`;
    if (typeof m.content !== "string") return "message content must be a string";
  }
  if (!Number.isFinite(request.timeoutMs) || request.timeoutMs <= 0) {
    return "timeoutMs must be positive";
  }
  if (request.temperature !== undefined && (!Number.isFinite(request.temperature) || request.temperature < 0)) {
    return "temperature must be a finite non-negative number";
  }
  return null;
}

export type SupportVerdict = boolean | "unknown";

export interface InvocationAdapter {
  readonly providerId: string;
  readonly runtimeId: string;
  readonly local: boolean;
  /**
   * true = model confirmed; false = model confirmed absent;
   * "unknown" = could not check (transport/parse failure), never guessed.
   */
  supports(modelId: string): SupportVerdict | Promise<SupportVerdict>;
  invoke(request: InvokeRequest): Promise<InvokeResult>;
}

/** Adapter registry: future providers register here; callers never switch. */
export class AdapterRegistry {
  private adapters: InvocationAdapter[] = [];

  register(adapter: InvocationAdapter): void {
    if (this.adapters.some((a) => a.providerId === adapter.providerId && a.runtimeId === adapter.runtimeId)) {
      throw new Error(`adapter already registered: ${adapter.providerId}/${adapter.runtimeId}`);
    }
    this.adapters.push(adapter);
  }

  find(providerId: string, runtimeId: string): InvocationAdapter | null {
    return this.adapters.find((a) => a.providerId === providerId && a.runtimeId === runtimeId) ?? null;
  }

  list(): InvocationAdapter[] {
    return [...this.adapters];
  }
}

function failure(
  request: InvokeRequest,
  code: InvokeFailure["code"],
  message: string,
  latencyMs: number,
  provenance: InvokeResult["provenance"],
  nativeDetail?: string,
): InvokeResult {
  return {
    ok: false,
    requestId: request.requestId,
    providerId: request.providerId,
    modelId: request.modelId,
    runtimeId: request.runtimeId,
    latencyMs,
    provenance,
    error: { code, message, nativeDetail },
  };
}

export interface RouteInvokeInput {
  route: { providerId: string; runtimeId: string; modelId: string; observedHealth: string; benchmarkUsed: boolean };
  request: InvokeRequest;
}

/**
 * Invoke one selected route. No silent failover: exactly one attempt against
 * the selected adapter; transport failure becomes a normalized failure.
 * Privacy is re-checked at invocation time (LOCAL_ONLY never leaves local).
 */
export async function invokeRoute(
  registry: AdapterRegistry,
  input: RouteInvokeInput,
): Promise<InvokeResult> {
  const started = Date.now();
  const { route, request } = input;
  const provenance = {
    route: `${route.providerId}/${route.runtimeId}/${route.modelId}`,
    observedHealth: route.observedHealth,
    benchmarkUsed: route.benchmarkUsed,
  };
  const invalid = validateInvokeRequest(request);
  if (invalid) {
    return failure(request, "INVALID_REQUEST", invalid, Date.now() - started, provenance);
  }
  const adapter = registry.find(route.providerId, route.runtimeId);
  if (!adapter) {
    return failure(request, "PROVIDER_UNAVAILABLE", `no adapter for ${route.providerId}/${route.runtimeId}`, Date.now() - started, provenance);
  }
  if (request.privacy === "local-only" && !adapter.local) {
    return failure(
      request, "POLICY_DENIED",
      "LOCAL_ONLY request cannot invoke a non-local adapter",
      Date.now() - started, provenance,
    );
  }
  let supported: boolean | "unknown";
  try {
    supported = await adapter.supports(request.modelId);
  } catch (error) {
    return failure(request, "TRANSPORT_ERROR", `capability check failed: ${error instanceof Error ? error.message : String(error)}`, Date.now() - started, provenance);
  }
  if (supported === false) {
    return failure(request, "UNSUPPORTED_CAPABILITY", `adapter does not support model ${request.modelId}`, Date.now() - started, provenance);
  }
  if (supported === "unknown") {
    return failure(request, "TRANSPORT_ERROR", `could not verify model ${request.modelId}; refusing to guess`, Date.now() - started, provenance);
  }
  return adapter.invoke(request);
}
