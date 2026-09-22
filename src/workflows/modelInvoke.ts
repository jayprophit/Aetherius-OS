import {
  invokeRoute,
  validateInvokeRequest,
  type AdapterRegistry,
  type InvokeRequest,
} from "../providers/invoke";
import {
  routeCapabilityRequest,
  type CapabilityRequest,
  type ModelCard,
} from "../providers/capabilities";
import type { StepExecutor, StepOutcome } from "./executors";
import type { WorkflowStep } from "./types";

export interface ModelRouteContext {
  cards: ModelCard[];
  adapters: AdapterRegistry;
  nowMs?: () => number;
}

/**
 * Validate a model-invoke step definition. Step inputs carry capability
 * requirements as literal keys (capability, min_context, privacy,
 * timeout_ms, prompt, system, temperature, max_tokens, pin); data bindings
 * ($input./$steps.) supply the prompt and parameters.
 */
export function validateModelStepDef(step: WorkflowStep): string[] {
  const problems: string[] = [];
  if (step.kind !== "model-invoke") {
    problems.push(`model step must use kind model-invoke, got ${step.kind}`);
  }
  const literal = (key: string): string | undefined => {
    const value = step.inputs[key];
    if (value === undefined) return undefined;
    if (value.trim().startsWith("$")) return undefined; // bound at runtime
    return value;
  };
  const minContext = literal("min_context");
  if (minContext !== undefined && (!/^\d+$/.test(minContext) || Number(minContext) < 1)) {
    problems.push("min_context must be a positive integer literal");
  }
  const privacy = literal("privacy");
  if (privacy !== undefined && privacy !== "local-only" && privacy !== "cloud-allowed") {
    problems.push(`privacy must be local-only or cloud-allowed, got ${privacy}`);
  }
  const timeout = literal("timeout_ms");
  if (timeout !== undefined && (!/^\d+$/.test(timeout) || Number(timeout) <= 0)) {
    problems.push("timeout_ms must be a positive integer literal");
  }
  if (step.inputs["prompt"] === undefined) {
    problems.push("model step requires a prompt input binding");
  }
  return [...problems].sort();
}

function literalOrBound(
  raw: unknown,
  fallback: string,
): string {
  return typeof raw === "string" ? raw : fallback;
}

/**
 * MODEL_INVOKE executor: workflow step → P18 capability request → route →
 * live health → provider-neutral invocation → normalized output. Never calls
 * providers directly; never invents availability.
 */
export class ModelInvokeExecutor implements StepExecutor {
  readonly kind = "model-invoke";

  constructor(private readonly context: ModelRouteContext) {}

  async execute(
    step: WorkflowStep,
    ctx: { inputs: Record<string, unknown>; attempt: number; signal: AbortSignal; runId: string; step: WorkflowStep },
  ): Promise<StepOutcome> {
    const defProblems = validateModelStepDef(step);
    if (defProblems.length > 0) {
      return { ok: false, retryable: false, error: `invalid model step: ${defProblems.join("; ")}` };
    }
    const inputs = ctx.inputs;
    const prompt = literalOrBound(inputs["prompt"], "");
    if (!prompt.trim()) {
      return { ok: false, retryable: false, error: "model prompt resolved empty" };
    }
    const minContext = Number(literalOrBound(inputs["min_context"], "1000"));
    if (!Number.isFinite(minContext) || minContext < 1) {
      return { ok: false, retryable: false, error: "min_context must resolve to a positive integer" };
    }
    const privacy = literalOrBound(inputs["privacy"], "cloud-allowed");
    if (privacy !== "local-only" && privacy !== "cloud-allowed") {
      return { ok: false, retryable: false, error: `invalid privacy ${privacy}` };
    }
    const timeoutMs = Number(literalOrBound(inputs["timeout_ms"], "60000"));
    const capability: CapabilityRequest = {
      minContext,
      modalities: ["text"],
      coding: true,
      toolUse: false,
      privacy,
      ...(typeof inputs["pin"] === "string" && inputs["pin"].trim() ? { pin: inputs["pin"].trim() } : {}),
    };
    const routed = routeCapabilityRequest(this.context.cards, capability);
    if (routed.ranked.length === 0) {
      const reasons = routed.excluded.map((e) => `${e.model}: ${e.reason}`).join("; ");
      return { ok: false, retryable: false, error: `no compatible model: ${reasons || "registry empty"}` };
    }
    const candidate = routed.ranked[0];
    const system = typeof inputs["system"] === "string" ? inputs["system"] : undefined;
    const temperature = inputs["temperature"] !== undefined ? Number(inputs["temperature"]) : undefined;
    const maxTokens = inputs["max_tokens"] !== undefined ? Number(inputs["max_tokens"]) : undefined;
    const request: InvokeRequest = {
      requestId: `${ctx.runId}:${step.id}:attempt-${ctx.attempt}`,
      providerId: candidate.providerId,
      modelId: candidate.id,
      runtimeId: candidate.runtimeId ?? "default",
      messages: [
        ...(system ? [{ role: "system" as const, content: system }] : []),
        { role: "user" as const, content: prompt },
      ],
      ...(temperature !== undefined && Number.isFinite(temperature) ? { temperature } : {}),
      ...(maxTokens !== undefined && Number.isFinite(maxTokens) ? { maxTokens } : {}),
      timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 60000,
      signal: ctx.signal,
      privacy,
      trace: { workflow_run: ctx.runId, step: step.id },
    };
    const problem = validateInvokeRequest(request);
    if (problem) return { ok: false, retryable: false, error: problem };
    // Runtime comes from the routed card; the step never names an endpoint.
    const result = await invokeRoute(this.context.adapters, {
      route: {
        providerId: request.providerId,
        runtimeId: request.runtimeId,
        modelId: request.modelId,
        observedHealth: "routed",
        benchmarkUsed: false,
      },
      request,
    });
    if (!result.ok) {
      return { ok: false, retryable: result.error?.code === "TIMEOUT", error: `${result.error?.code}: ${result.error?.message}` };
    }
    return {
      ok: true,
      output: {
        text: result.output ?? "",
        model: result.modelId,
        provider: result.providerId,
        latency_ms: result.latencyMs,
        finish_reason: result.finishReason ?? "unknown",
      },
      retryable: true,
    };
  }

}
