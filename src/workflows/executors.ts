import type { WorkflowStep } from "./types";

export interface StepOutcome {
  ok: boolean;
  output?: unknown;
  /** Whether a retry is semantically safe for this outcome. */
  retryable: boolean;
  error?: string;
  /**
   * External approval required: the runtime must pause durably instead of
   * succeeding or failing. Re-execution after ALLOW relies on downstream
   * idempotency (same action/request id).
   */
  waitingApproval?: boolean;
  approvalId?: string;
  /**
   * Result genuinely unknown (request sent, outcome unconfirmed): the
   * runtime must mark RECOVERING, never assume success or failure.
   */
  unknownOutcome?: boolean;
}

export interface ExecContext {
  runId: string;
  workflowId: string;
  workflowVersion: string;
  step: WorkflowStep;
  /** Fully resolved inputs (bindings already substituted). */
  inputs: Record<string, unknown>;
  /** Declared skill permissions (metadata only — never a grant). */
  declaredPermissions: string[];
  attempt: number;
  signal: AbortSignal;
}

/**
 * Trusted step executor. Kinds are registered explicitly; anything else is
 * rejected. No eval, no dynamic code, no untrusted execution.
 */
export interface StepExecutor {
  readonly kind: string;
  execute(step: WorkflowStep, ctx: ExecContext): Promise<StepOutcome>;
}

export class ExecutorRegistry {
  private readonly executors = new Map<string, StepExecutor>();

  register(executor: StepExecutor): void {
    if (!executor.kind.trim()) throw new Error("executor kind is required");
    if (this.executors.has(executor.kind)) {
      throw new Error(`duplicate executor kind: ${executor.kind}`);
    }
    this.executors.set(executor.kind, executor);
  }

  get(kind: string): StepExecutor | null {
    return this.executors.get(kind) ?? null;
  }

  kinds(): string[] {
    return [...this.executors.keys()].sort();
  }
}
