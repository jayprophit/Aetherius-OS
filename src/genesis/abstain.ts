import type { DecisionEnvelope } from "./reflex";

/**
 * REQ-p22-reflex-abstention: abstaining Reflex decisions.
 *
 * The reflex may decline a fast decision under uncertainty instead of
 * guessing. Abstention is a decision-state (uncertainty/non-selection),
 * NOT failure, denial, authorization, escalation, approval, or missing
 * capability. It belongs to S1; S0 exact rules never abstain (they
 * match or return UNRESOLVED).
 *
 * Permanent distinctions (enforced/tested):
 * - ABSTENTION != AUTHORIZATION/DENIAL/POLICY-BLOCK/HUMAN-ESCALATION.
 * - ABSTAIN PROBABILITY != CALIBRATED ERROR RATE (uncalibrated unless
 *   calibration evidence exists — none does; the flag says so).
 * - RAW SCORE != CALIBRATED PROBABILITY. LOW CONFIDENCE != UNSAFE.
 * - ABSTAINED DECISION != SELECTED DECISION (no fake selectedValue).
 * - P25 still authorizes; abstention never approves or denies action.
 */

export type AbstainReason =
  | "BELOW_THRESHOLD"
  | "AMBIGUOUS"
  | "CONFLICTING_EVIDENCE"
  | "OUT_OF_DISTRIBUTION"
  | "INSUFFICIENT_EVIDENCE"
  | "UNSUPPORTED";

export const ABSTAIN_REASONS: readonly AbstainReason[] = [
  "BELOW_THRESHOLD",
  "AMBIGUOUS",
  "CONFLICTING_EVIDENCE",
  "OUT_OF_DISTRIBUTION",
  "INSUFFICIENT_EVIDENCE",
  "UNSUPPORTED",
];

export interface AbstentionCandidate {
  value: string;
  probability?: number;
}

export interface Abstention {
  decisionId: string;
  taskType: string;
  inputFingerprint: string;
  abstained: true;
  /** Required, finite, 0..1. Never defaulted, never fabricated. */
  abstainProbability: number;
  reasons: AbstainReason[];
  /** Preserved candidates; selection stays absent. */
  candidates?: AbstentionCandidate[];
  /** False until calibration evidence exists (none does). */
  calibrated: boolean;
  backend: string;
  backendVersion: string;
  evidenceRefs: string[];
  provenance: string;
}

export type AbstainProblem =
  | "decision-id"
  | "task-type"
  | "fingerprint"
  | "probability"
  | "reasons"
  | "candidates"
  | "backend"
  | "provenance";

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validAbstainProbability(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

/** Validate an abstention record. Empty problems = well-formed. */
export function validateAbstention(abstention: Abstention): AbstainProblem[] {
  const problems: AbstainProblem[] = [];
  if (!nonEmpty(abstention.decisionId)) problems.push("decision-id");
  if (!nonEmpty(abstention.taskType)) problems.push("task-type");
  if (!nonEmpty(abstention.inputFingerprint)) problems.push("fingerprint");
  if (!validAbstainProbability(abstention.abstainProbability)) problems.push("probability");
  if (!Array.isArray(abstention.reasons) || abstention.reasons.length === 0 ||
      abstention.reasons.some((r) => !ABSTAIN_REASONS.includes(r))) {
    problems.push("reasons");
  }
  if (abstention.candidates !== undefined) {
    if (!Array.isArray(abstention.candidates) ||
        abstention.candidates.some((c) => !nonEmpty(c?.value) ||
          (c.probability !== undefined && !validAbstainProbability(c.probability)))) {
      problems.push("candidates");
    }
  }
  if (!nonEmpty(abstention.backend) || !nonEmpty(abstention.backendVersion)) problems.push("backend");
  if (!nonEmpty(abstention.provenance)) problems.push("provenance");
  return [...new Set(problems)].sort() as AbstainProblem[];
}

export interface AbstentionInput {
  decisionId: string;
  taskType: string;
  inputFingerprint: string;
  abstainProbability: number;
  reasons: AbstainReason[];
  candidates?: AbstentionCandidate[];
  backend: string;
  backendVersion: string;
  evidenceRefs?: string[];
  provenance: string;
}

/** Construct a validated abstention. Probability is required input, never defaulted. */
export function makeAbstention(input: AbstentionInput): Abstention {
  const record: Abstention = {
    decisionId: input.decisionId,
    taskType: input.taskType,
    inputFingerprint: input.inputFingerprint,
    abstained: true,
    abstainProbability: input.abstainProbability,
    reasons: [...input.reasons],
    ...(input.candidates !== undefined ? { candidates: input.candidates.map((c) => ({ ...c })) } : {}),
    calibrated: false,
    backend: input.backend,
    backendVersion: input.backendVersion,
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    provenance: input.provenance,
  };
  const problems = validateAbstention(record);
  if (problems.length > 0) throw new Error(`invalid abstention: ${problems.join(",")}`);
  return record;
}

/**
 * Threshold predicate: abstain iff probability >= threshold. The
 * threshold is an explicit caller argument (configuration, policy, or
 * calibrated default) — this module defines none, manufactures none.
 */
export function evaluateAbstention(
  abstainProbability: number,
  threshold: number,
): { abstain: boolean; reason: AbstainReason | null } {
  if (!validAbstainProbability(abstainProbability)) {
    throw new Error("abstain probability must be finite within 0..1");
  }
  if (!validAbstainProbability(threshold)) {
    throw new Error("abstention threshold must be finite within 0..1 (explicit, never defaulted here)");
  }
  return abstainProbability >= threshold
    ? { abstain: true, reason: "BELOW_THRESHOLD" }
    : { abstain: false, reason: null };
}

export interface EscalationSignal {
  abstained: true;
  abstainProbability: number;
  reasons: AbstainReason[];
  candidates: AbstentionCandidate[];
  taskType: string;
  inputFingerprint: string;
  /** Suggested only; resolution belongs to selective-escalation, not here. */
  requiresHuman: false;
}

/**
 * Downstream projection for selective-escalation: carries everything
 * escalation needs (uncertainty, reasons, candidates) without deciding
 * anything — notably never requires_human (abstention != escalation).
 */
export function escalationSignal(abstention: Abstention): EscalationSignal {
  return {
    abstained: true,
    abstainProbability: abstention.abstainProbability,
    reasons: [...abstention.reasons],
    candidates: (abstention.candidates ?? []).map((c) => ({ ...c })),
    taskType: abstention.taskType,
    inputFingerprint: abstention.inputFingerprint,
    requiresHuman: false,
  };
}

/** Deterministic canonical serialization. */
export function canonicalAbstention(abstention: Abstention): string {
  return JSON.stringify(abstention);
}

/** Abstention records never carry a selected value (checked structurally). */
export function hasSelectedValue(abstention: Abstention): boolean {
  return "selectedValue" in (abstention as unknown as Record<string, unknown>) ||
    "selected" in (abstention as unknown as Record<string, unknown>);
}

export type { DecisionEnvelope };
