/**
 * REQ-p21-sandbox-runners contracts (P20): sandboxed remote/container
 * runners with workspace sync. Reference: CrabBox runners/sync (v0.64.0,
 * MIT, STUDY_ONLY) — mechanics only, no code copied.
 *
 * Isolation labels go beyond the reference trust model: every run record
 * carries explicit network/filesystem isolation, and there is no
 * adversarial-tenant assumption — runners are single-owner tools, not a
 * multi-tenant platform.
 */

export type RunnerKind = "local-directory" | "ssh" | "container";

export type IsolationNetwork = "none" | "restricted" | "open";
export type IsolationFilesystem = "temp-only" | "workspace-ro" | "workspace-rw";

export interface Isolation {
  network: IsolationNetwork;
  filesystem: IsolationFilesystem;
  /** Human/machine label, e.g. "owner-workstation-sim". */
  label: string;
}

export interface WorkspaceSpec {
  /** Workspace id the runner warms. */
  workspaceId: string;
  /** Files the runner must present: path -> sha256. */
  manifest: Record<string, string>;
}

export interface RunSpec {
  /** Command argv. Never a shell string: no shell interpretation. */
  argv: string[];
  env: Record<string, string>;
  timeoutMs: number;
  isolation: Isolation;
  /**
   * Honest-sim only: the exact result the simulated backend replays.
   * Real backends ignore it; simulated backends require it (outputs are
   * declared, never invented).
   */
  simulatedResult?: { exitCode: number; stdout?: string; stderr?: string };
}

export type RunState =
  | "DEFINED"
  | "PROVISIONING"
  | "READY"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "TIMED_OUT"
  | "TEARDOWN"
  | "TORN_DOWN";

export type RunEventKind = "provisioned" | "stream" | "exited" | "teardown";

export interface RunEvent {
  kind: RunEventKind;
  at: string;
  stream?: "stdout" | "stderr";
  chunk?: string;
  exitCode?: number;
  detail?: string;
}

export interface RunRecord {
  runId: string;
  runnerId: string;
  kind: RunnerKind;
  /** False only for backends that really execute remotely/in containers. */
  simulated: boolean;
  workspace: WorkspaceSpec;
  spec: RunSpec;
  state: RunState;
  events: RunEvent[];
  exitCode?: number;
  tornDown: boolean;
}

export type RunnerErrorCode =
  | "RUNNER_UNKNOWN"
  | "RUNNER_UNAVAILABLE"
  | "INVALID_TRANSITION"
  | "WORKSPACE_MISMATCH"
  | "ARTIFACT_UNLISTED"
  | "TEARDOWN_REQUIRED"
  | "RUN_TIMEOUT";

export class RunnerError extends Error {
  readonly code: RunnerErrorCode;
  constructor(code: RunnerErrorCode, message: string) {
    super(message);
    this.name = "RunnerError";
    this.code = code;
  }
}

export interface RunnerCapabilities {
  kind: RunnerKind;
  simulated: boolean;
  available: boolean;
  unavailableReason?: string;
  maxTimeoutMs: number;
  allowedFilesystem: IsolationFilesystem[];
}

export interface Runner {
  readonly runnerId: string;
  capabilities(): RunnerCapabilities;
  provision(workspace: WorkspaceSpec): Promise<RunRecord>;
  sync(workspaceId: string, files: ReadonlyMap<string, Uint8Array>): Promise<{ added: string[]; modified: string[]; deleted: string[] }>;
  run(record: RunRecord, spec: RunSpec): Promise<RunRecord>;
  teardown(record: RunRecord): Promise<RunRecord>;
}
