/**
 * P19/1 skill / workflow / routine contracts. Deterministic, serializable,
 * versioned. No executable closures in definitions; no self-granted authority.
 */

export type SkillStatus = "REGISTERED" | "VERIFIED" | "DEPRECATED";
export type RiskClass = "low" | "medium" | "high" | "critical";
export type RetrySafety = "safe" | "unsafe" | "unknown";

export interface Skill {
  skill_id: string;
  version: string;
  name: string;
  description: string;
  capability: string;
  inputs: string[];
  outputs: string[];
  required_capabilities: string[];
  /** Declared only. Registration/execution NEVER grants these. */
  required_permissions: string[];
  required_tools: string[];
  supported_platforms: string[];
  execution_kind: string;
  implementation_ref: string;
  risk_class: RiskClass;
  provenance: string;
  verification?: string[];
  status: SkillStatus;
}

export type StepKind =
  | "skill"
  | "condition"
  | "approval"
  | "wait"
  | "subworkflow"
  | "model-invoke"
  | "bridge-action";

export interface RetryPolicy {
  max_attempts: number;
  retry_on: "transient" | "all" | "none";
}

export interface WorkflowStep {
  id: string;
  kind: StepKind;
  /** skill:<skill_id>@<version> | condition expr key | approval id */
  ref: string;
  depends_on: string[];
  inputs: Record<string, string>;
  outputs: string[];
  output_required_keys?: string[];
  retry?: RetryPolicy;
  timeout_ms?: number;
  /** Approval checkpoint attached to this step. */
  approval?: { approver: string; reason: string };
  retry_safety: RetrySafety;
}

export interface Workflow {
  workflow_id: string;
  version: string;
  description: string;
  inputs: string[];
  steps: WorkflowStep[];
}

export interface Routine {
  routine_id: string;
  version: string;
  workflow_ref: string;
  workflow_version: string;
  default_inputs: Record<string, unknown>;
  policy: string;
  capability_requirements: string[];
  execution_hints?: Record<string, string>;
  enabled: boolean;
}

export type RunState =
  | "DEFINED"
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "WAITING_APPROVAL"
  | "RECOVERING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "TIMED_OUT";

export type StepState =
  | "PENDING"
  | "READY"
  | "RUNNING"
  | "WAITING_APPROVAL"
  | "RETRY_WAIT"
  | "SUCCEEDED"
  | "FAILED"
  | "SKIPPED"
  | "CANCELLED"
  | "TIMED_OUT"
  | "RECOVERING";

export interface StepAttempt {
  attempt: number;
  started_at: string;
  ended_at: string;
  ok: boolean;
  retryable: boolean;
  error?: string;
}

export interface StepRun {
  step_id: string;
  state: StepState;
  attempts: StepAttempt[];
  output?: unknown;
  approvals: Array<{ decision: "ALLOW" | "DENY"; at: string; by: string }>;
}

export interface HistoryEvent {
  at: string;
  seq: number;
  kind: string;
  step_id?: string;
  detail?: string;
}

export interface WorkflowRun {
  run_id: string;
  workflow_id: string;
  workflow_version: string;
  routine_id?: string;
  /** Pinned skill versions resolved at start: skill_id -> version. */
  skill_pins: Record<string, string>;
  inputs: Record<string, unknown>;
  state: RunState;
  steps: StepRun[];
  history: HistoryEvent[];
  failure?: string;
  created_at: string;
  updated_at: string;
}
