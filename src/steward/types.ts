/**
 * P16 guarded repository steward automation contracts.
 *
 * Study output informed by ClawSweeper v0.3.0 (MIT, STUDY_ONLY): original
 * implementation, no code/brand copying.
 *
 * Hard invariant: readiness never equals merge authority. This module
 * evaluates, records, comments and proposes repairs. It exposes no merge
 * capability; merging is a separate, owner-gated bridge action that does
 * not exist here.
 */

export type StewardErrorCode =
  | "MARKER_MALFORMED"
  | "MARKER_INVALID_ID"
  | "MARKER_CONTENT_INVALID"
  | "COMMAND_PARSE_FAILED"
  | "COMMAND_DENIED"
  | "REPAIR_INVALID"
  | "REPORT_CONFLICT";

export class StewardError extends Error {
  readonly code: StewardErrorCode;
  constructor(code: StewardErrorCode, message: string) {
    super(message);
    this.name = "StewardError";
    this.code = code;
  }
}

export type FindingSeverity = "info" | "warning" | "error" | "blocker";

export interface ReviewFinding {
  code: string;
  severity: FindingSeverity;
  message: string;
  evidence?: string;
}

export type ReadinessVerdict = "ready" | "not_ready";

export interface Readiness {
  verdict: ReadinessVerdict;
  blockingCount: number;
  warningCount: number;
  reasons: string[];
  /** Always false. Readiness is advisory only; it never carries merge authority. */
  merge_authority: false;
}

export interface ReviewTarget {
  repo: string;
  kind: "issue" | "pull";
  number: number;
}

export type StewardTrigger = "scheduled" | "event" | "command" | "manual";

export interface StewardReport {
  /** Durable state id, e.g. "steward-aetherius-os-pull123". */
  id: string;
  target: ReviewTarget;
  findings: ReviewFinding[];
  readiness: Readiness;
  trigger: StewardTrigger;
  generatedAt: string;
  /** Set when a guarded repair was applied for this report revision. */
  repairApplied?: string;
}

export type CommandVerb = "check" | "re-review" | "repair" | "pause" | "resume";

export interface MaintainerCommand {
  actor: string;
  verb: CommandVerb;
  target: ReviewTarget;
}

export interface CommandPolicy {
  /** Explicit allowlist. Empty list denies everyone (default deny). */
  authorizedActors: readonly string[];
}

export interface RepairProposal {
  id: string;
  target: ReviewTarget;
  summary: string;
  /** Textual changeset description; the executor applies it, not this module. */
  patch: string;
  /** Finding codes this proposal claims to fix. */
  fixesFindingCodes: readonly string[];
}

export interface RepairDecision {
  allowed: boolean;
  reason?: string;
}

export type RepairOutcome =
  | {
      status: "applied";
      proposal: RepairProposal;
      resolvedCodes: string[];
      findings: ReviewFinding[];
      readiness: Readiness;
    }
  | {
      status: "denied";
      proposal: RepairProposal;
      reason: string;
      findings: ReviewFinding[];
      readiness: Readiness;
    };
