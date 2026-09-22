import type { StepExecutor, StepOutcome } from "./executors";
import type { WorkflowStep } from "./types";

export type BridgeOutcome =
  | "SUCCEEDED"
  | "DENIED"
  | "WAITING_APPROVAL"
  | "FAILED"
  | "TIMED_OUT"
  | "CANCELLED"
  | "UNKNOWN_OUTCOME";

export interface BridgeActionRequest {
  /** runId:stepId — the bridge deduplicates repeat submissions on this id. */
  actionId: string;
  principal: string;
  sessionId: string;
  workspace: string;
  action: string;
  resource: string;
  payload?: Record<string, unknown>;
  ownerMode: string;
  provenance: { runId: string; stepId: string; attempt: number };
  timeoutMs: number;
  signal?: AbortSignal;
}

export interface BridgeActionResponse {
  outcome: BridgeOutcome;
  output?: unknown;
  error?: string;
  approvalId?: string;
  evidence: { actionId: string; deduped: boolean };
}

/** Transport to Agent Bridge. P19 never executes external actions itself. */
export interface BridgeTransport {
  submit(request: BridgeActionRequest): Promise<BridgeActionResponse>;
}

type FetchFn = (url: string, init: RequestInit) => Promise<Response>;

/**
 * HTTP transport speaking the bridge action endpoint. Used against stub
 * servers in tests and a real bridge where one is reachable; never embeds
 * bridge policy — DENY/APPROVAL verdicts come from the bridge.
 */
export class HttpBridgeTransport implements BridgeTransport {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchFn: FetchFn = (url, init) => fetch(url, init),
  ) {}

  async submit(request: BridgeActionRequest): Promise<BridgeActionResponse> {
    const body = {
      action_id: request.actionId,
      principal: request.principal,
      session_id: request.sessionId,
      workspace: request.workspace,
      action: request.action,
      resource: request.resource,
      payload: request.payload ?? {},
      owner_mode: request.ownerMode,
      provenance: request.provenance,
    };
    let response: Response;
    try {
      response = await this.fetchFn(`${this.baseUrl}/v1/actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: request.signal,
      });
    } catch (error) {
      if (request.signal?.aborted) {
        return { outcome: "CANCELLED", error: "bridge request cancelled", evidence: { actionId: request.actionId, deduped: false } };
      }
      return { outcome: "TIMED_OUT", error: `bridge unreachable: ${error instanceof Error ? error.message : String(error)}`, evidence: { actionId: request.actionId, deduped: false } };
    }
    let data: {
      outcome?: unknown; output?: unknown; error?: unknown; approval_id?: unknown; deduped?: unknown;
    };
    try {
      data = (await response.text().then((t) => JSON.parse(t) as unknown)) as typeof data;
    } catch {
      return { outcome: "FAILED", error: "malformed bridge response", evidence: { actionId: request.actionId, deduped: false } };
    }
    const outcome = String(data.outcome ?? "FAILED");
    const valid: BridgeOutcome[] = ["SUCCEEDED", "DENIED", "WAITING_APPROVAL", "FAILED", "TIMED_OUT", "CANCELLED", "UNKNOWN_OUTCOME"];
    if (!valid.includes(outcome as BridgeOutcome)) {
      return { outcome: "FAILED", error: `unknown bridge outcome ${outcome}`, evidence: { actionId: request.actionId, deduped: false } };
    }
    return {
      outcome: outcome as BridgeOutcome,
      output: data.output,
      error: typeof data.error === "string" ? data.error : undefined,
      approvalId: typeof data.approval_id === "string" ? data.approval_id : undefined,
      evidence: { actionId: request.actionId, deduped: data.deduped === true },
    };
  }
}

/** Actions treated as read-like for retry-safety composition. */
const READ_LIKE = new Set([
  "filesystem:read",
  "filesystem:list",
  "filesystem:stat",
  "filesystem:exists",
  "filesystem:search",
]);

export function validateBridgeStepDef(step: WorkflowStep): string[] {
  const problems: string[] = [];
  if (step.kind !== "bridge-action") {
    problems.push(`bridge step must use kind bridge-action, got ${step.kind}`);
  }
  if (!/^bridge:[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+$/.test(step.ref.trim())) {
    problems.push(`bridge ref must look like bridge:<domain>:<action>, got ${step.ref}`);
  }
  if (step.inputs["resource"] === undefined) {
    problems.push("bridge step requires a resource input binding");
  }
  const ownerMode = step.inputs["owner_mode"];
  if (ownerMode !== undefined && !ownerMode.trim().startsWith("$") && ownerMode.trim().length === 0) {
    problems.push("owner_mode must be non-empty when given literally");
  }
  return [...problems].sort();
}

export interface BridgeExecutorContext {
  transport: BridgeTransport;
  principal: string;
  defaultWorkspace: string;
  defaultOwnerMode: string;
}

/**
 * BRIDGE_ACTION executor: workflow step → governed bridge request.
 * P19 performs no external action itself; Agent Bridge remains the sole
 * authority for execution, denial and approval. Retries compose transport
 * safety with step retry_safety; unknown outcomes propagate truthfully.
 */
export class BridgeActionExecutor implements StepExecutor {
  readonly kind = "bridge-action";

  constructor(private readonly context: BridgeExecutorContext) {}

  /**
   * Bounded submission: upfront abort check plus a race against the step
   * timeout and caller cancellation. A timed-out mutating request becomes
   * UNKNOWN_OUTCOME (it may still execute bridge-side); read-like requests
   * safely become TIMED_OUT.
   */
  private submitBounded(request: BridgeActionRequest, readLike: boolean): Promise<BridgeActionResponse> {
    if (request.signal?.aborted) {
      return Promise.resolve({
        outcome: "CANCELLED" as const,
        error: "bridge request cancelled before submit",
        evidence: { actionId: request.actionId, deduped: false },
      });
    }
    return new Promise<BridgeActionResponse>((resolve) => {
      const timer = setTimeout(() => {
        resolve(
          readLike
            ? { outcome: "TIMED_OUT", error: `bridge request exceeded ${request.timeoutMs}ms`, evidence: { actionId: request.actionId, deduped: false } }
            : { outcome: "UNKNOWN_OUTCOME", error: `bridge request exceeded ${request.timeoutMs}ms; side effects unconfirmed`, evidence: { actionId: request.actionId, deduped: false } },
        );
      }, request.timeoutMs);
      const onAbort = (): void => {
        clearTimeout(timer);
        resolve({
          outcome: "CANCELLED",
          error: "bridge request cancelled",
          evidence: { actionId: request.actionId, deduped: false },
        });
      };
      request.signal?.addEventListener("abort", onAbort, { once: true });
      this.context.transport.submit(request).then(
        (response) => {
          clearTimeout(timer);
          request.signal?.removeEventListener("abort", onAbort);
          resolve(response);
        },
        () => {
          clearTimeout(timer);
          request.signal?.removeEventListener("abort", onAbort);
          // Transport threw after send: outcome genuinely unknown.
          resolve({
            outcome: "UNKNOWN_OUTCOME",
            error: "bridge transport failed after transmit",
            evidence: { actionId: request.actionId, deduped: false },
          });
        },
      );
    });
  }

  async execute(
    step: WorkflowStep,
    ctx: { inputs: Record<string, unknown>; attempt: number; signal: AbortSignal; runId: string; step: WorkflowStep },
  ): Promise<StepOutcome> {
    const defProblems = validateBridgeStepDef(step);
    if (defProblems.length > 0) {
      return { ok: false, retryable: false, error: `invalid bridge step: ${defProblems.join("; ")}` };
    }
    const action = step.ref.trim().slice("bridge:".length);
    const resource = typeof ctx.inputs["resource"] === "string" ? (ctx.inputs["resource"] as string).trim() : "";
    if (!resource) {
      return { ok: false, retryable: false, error: "bridge resource resolved empty" };
    }
    const sessionId = typeof ctx.inputs["session"] === "string" && (ctx.inputs["session"] as string).trim()
      ? (ctx.inputs["session"] as string).trim()
      : `wf-${ctx.runId}`;
    const workspace = typeof ctx.inputs["workspace"] === "string" && (ctx.inputs["workspace"] as string).trim()
      ? (ctx.inputs["workspace"] as string).trim()
      : this.context.defaultWorkspace;
    const ownerMode = typeof ctx.inputs["owner_mode"] === "string" && (ctx.inputs["owner_mode"] as string).trim()
      ? (ctx.inputs["owner_mode"] as string).trim()
      : this.context.defaultOwnerMode;
    const timeoutMs = Number(ctx.inputs["timeout_ms"] ?? 60000);
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(ctx.inputs)) {
      if (!["resource", "session", "workspace", "owner_mode", "timeout_ms"].includes(key)) {
        payload[key] = value;
      }
    }
    const effectiveTimeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 60000;
    const request: BridgeActionRequest = {
      actionId: `${ctx.runId}:${step.id}`,
      principal: this.context.principal,
      sessionId,
      workspace,
      action,
      resource,
      payload,
      ownerMode,
      provenance: { runId: ctx.runId, stepId: step.id, attempt: ctx.attempt },
      timeoutMs: effectiveTimeout,
      signal: ctx.signal,
    };
    let response: BridgeActionResponse;
    try {
      response = await this.submitBounded(request, READ_LIKE.has(action));
    } catch (error) {
      if (ctx.signal.aborted) {
        return { ok: false, retryable: false, error: "bridge request cancelled" };
      }
      return { ok: false, retryable: false, unknownOutcome: true, error: `bridge transport failed: ${error instanceof Error ? error.message : String(error)}` };
    }
    switch (response.outcome) {
      case "SUCCEEDED":
        return { ok: true, output: response.output ?? null, retryable: true };
      case "DENIED":
        return { ok: false, retryable: false, error: `bridge denied: ${response.error ?? action}` };
      case "WAITING_APPROVAL":
        return { ok: false, retryable: false, waitingApproval: true, approvalId: response.approvalId, error: "bridge requires approval" };
      case "TIMED_OUT":
        return { ok: false, retryable: false, error: `bridge timeout: ${response.error ?? action}` };
      case "CANCELLED":
        return { ok: false, retryable: false, error: "bridge request cancelled" };
      case "UNKNOWN_OUTCOME":
        return { ok: false, retryable: false, unknownOutcome: true, error: response.error ?? "unknown bridge outcome" };
      case "FAILED":
      default: {
        const retryable =
          READ_LIKE.has(action) || (ctx.step as { retry_safety?: string }).retry_safety === "safe";
        return { ok: false, retryable, error: response.error ?? "bridge action failed" };
      }
    }
  }
}
