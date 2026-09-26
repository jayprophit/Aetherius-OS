import { checkEvidenceGate } from "../workflows/evidenceGate";
import type { EvidenceProvided, EvidenceRequirement } from "../workflows/evidenceGate";
import type { VerificationState } from "../workflows/deliverable";
import type { SecurityFinding } from "../workflows/promotion";
import type { PackImpact, PackTouchComparison, PackUnresolvedRef } from "./reviewPack";
import type { ReadinessVerdict } from "../steward/types";
import type { ContaminationStatus } from "../eval/contamination";

/**
 * REQ-p19-independent-review-gate: independent model review gate.
 *
 * The registered requirement is the scope authority:
 *
 *   "Executable independent-model reviewer composed into the change pipeline
 *    (impact, context, static, model review, security, verify/repair/
 *    reject); gates exist, model-gate and composition do not; emits
 *    clean-room-ready evidence without claiming fresh-env proof while
 *    clean-room is blocked."
 *
 * Two things are named as MISSING, and they are the whole scope of this
 * unit:
 *
 *   1. THE COMPOSITION. Individual gates already exist across the codebase;
 *      nothing joined them, so no one could see a change's review state as a
 *      whole. This module composes them WITHOUT owning or re-implementing
 *      any of them: it imports the existing contracts and reads their
 *      results.
 *   2. THE MODEL-REVIEW LEG. It exists as a leg here and its state is
 *      UNAVAILABLE, because `REQ-p18-model-fabric` is BLOCKED on cloud
 *      credentials. The leg is present and visible, not omitted and not
 *      passed.
 *
 * Distinctions this module exists to hold:
 *
 *   SELF REVIEW        != INDEPENDENT REVIEW
 *   REVIEW CONTEXT     != REVIEW VERDICT
 *   STEWARD REPORT     != INDEPENDENT REVIEW
 *   COHORT REVIEW      != INDEPENDENT REVIEW
 *   TEST PASS          != INDEPENDENT REVIEW
 *   WORLD VERIFICATION != INDEPENDENT REVIEW
 *   MODEL REVIEW       != CLEAN-ROOM PROOF
 *   MISSING REVIEWER   != REVIEW SUCCESS
 *   UNAVAILABLE        != PASS
 *   REVIEW PASSED      != MERGE AUTHORITY
 *   CLEAN-ROOM-READY   != CLEAN-ROOM-PROVEN
 *   DIFFERENT FUNCTION != INDEPENDENT ACTOR
 *
 * It composes evidence. It decides nothing, approves nothing, and merges
 * nothing.
 */

/**
 * Per-leg state. Each leg keeps its OWN state; `UNAVAILABLE` and
 * `MISSING_EVIDENCE` are real outcomes and are never folded into `PASS`.
 * The model leg is a declared member of the vocabulary precisely so its
 * absence is reported rather than skipped.
 */
export const REVIEW_LEG_STATES = ["PASS", "FAIL", "BLOCKED", "UNAVAILABLE", "MISSING_EVIDENCE"] as const;
export type ReviewLegState = (typeof REVIEW_LEG_STATES)[number];

/**
 * The legs the registered requirement names, in pipeline order. This is the
 * registered list, not an invented one.
 */
export const REVIEW_LEGS = [
  "impact",
  "context",
  "static",
  "model-review",
  "security",
  "verification",
] as const;
export type ReviewLeg = (typeof REVIEW_LEGS)[number];

export interface ReviewLegRecord {
  leg: ReviewLeg;
  state: ReviewLegState;
  /** Opaque reference to the authoritative record this state came from. */
  sourceRef?: string;
  /** Required whenever state is not PASS: why, and what is missing. */
  reason?: string;
}

/** Evidence class per leg, reusing the existing vocabularies. */
export interface LegEvidence {
  leg: ReviewLeg;
  state: ReviewLegState;
  sourceRef?: string;
  reason?: string;
  /** Impact: the review pack's own honest impact state. */
  impact?: PackImpact;
  /** Impact: expected vs actual touch, reported side by side, never judged. */
  touch?: PackTouchComparison;
  /** Context: refs the pack could not resolve. Absence must stay visible. */
  unresolved?: PackUnresolvedRef[];
  /** Static: findings from the existing static safety scan. */
  securityFindings?: SecurityFinding[];
  /** Verification: the existing VerificationState vocabulary. */
  verificationState?: VerificationState;
  /** Model review: the steward's stored verdict, never recomputed here. */
  readinessVerdict?: ReadinessVerdict;
  /** Contamination fairness, when the leg had a benchmark assessment. */
  contaminationStatus?: ContaminationStatus;
}

/**
 * Independence facts, recorded EXPLICITLY. A change produced by the same
 * system that produced the context pack, the steward report and the tests is
 * NOT independent review, and running those analyses in a different module
 * does not make them independent. `sameActor` defaults to true, because
 * self-review is the common case and must be stated rather than assumed
 * away.
 */
export interface IndependenceFacts {
  /** True when the reviewer actor is the same actor that produced the change. */
  sameActor: boolean;
  reviewerRef: string;
  changeProducerRef: string;
  notes: string[];
}

export type GateOutcome = "REVIEW_READY" | "REVIEW_INCOMPLETE" | "REVIEW_FAILED";

export interface IndependentReviewReport {
  gateId: string;
  changeRef: string;
  legs: ReviewLegRecord[];
  /**
   * True only when every leg is PASS. An UNAVAILABLE or MISSING_EVIDENCE leg
   * makes this false; the gate can never be made to pass by omission.
   */
  allLegsPass: boolean;
  outcome: GateOutcome;
  independence: IndependenceFacts;
  /**
   * What this gate establishes about clean-room EXECUTION readiness. It is
   * never a clean-room PROOF: `REQ-p20-clean-room` is BLOCKED on the absence
   * of an isolated backend, and no amount of internal review supplies one.
   */
  cleanRoomReady: boolean;
  cleanRoomProven: false;
  /** Always true: a passing review carries no merge, deploy or authority. */
  noMergeAuthority: true;
  /** No aggregate numeric figure exists, by construction. */
  noCompositeScore: true;
  provenance: string;
  assessedAt: string;
}

export type GateProblem =
  | "gate-id"
  | "change-ref"
  | "legs"
  | "duplicate-leg"
  | "unknown-leg"
  | "reason-required"
  | "independence"
  | "reviewer-ref"
  | "producer-ref"
  | "assessed-at"
  | "unknown-field";

const GATE_PROVENANCE = "p19-independent-review-gate";
const ALLOWED_KEYS: ReadonlySet<string> = new Set([
  "gateId",
  "changeRef",
  "evidence",
  "independence",
  "assessedAt",
  "provenance",
]);
const ID_RE = /^irev-[a-z0-9][a-z0-9-]*$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Real comparator (never a factory): a factory passed to sort yields NaN. */
function compareLegs(a: ReviewLegRecord, b: ReviewLegRecord): number {
  return REVIEW_LEGS.indexOf(a.leg) - REVIEW_LEGS.indexOf(b.leg);
}

/** Deterministic gate id from a slug. */
export function gateIdFor(slug: string): string {
  const normalized = slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `irev-${normalized.length > 0 ? normalized : "gate"}`;
}

function validateIndependence(facts: IndependenceFacts | undefined): GateProblem[] {
  const problems: GateProblem[] = [];
  if (!facts || typeof facts !== "object") {
    problems.push("independence");
    return problems;
  }
  if (typeof facts.sameActor !== "boolean") problems.push("independence");
  if (!nonEmpty(facts.reviewerRef)) problems.push("reviewer-ref");
  if (!nonEmpty(facts.changeProducerRef)) problems.push("producer-ref");
  return problems;
}

/**
 * Compose the review gate from evidence gathered elsewhere.
 *
 * `evidence` must supply one entry per registered leg. A leg with no entry
 * is reported `MISSING_EVIDENCE` rather than treated as satisfied — that is
 * what stops the gate from passing by omission.
 */
export function composeIndependentReview(input: {
  gateId: string;
  changeRef: string;
  evidence: readonly LegEvidence[];
  independence: IndependenceFacts;
  assessedAt: string;
  provenance?: string;
}): IndependentReviewReport {
  const problems: GateProblem[] = [];
  for (const key of Object.keys(input ?? {})) {
    if (!ALLOWED_KEYS.has(key)) problems.push("unknown-field");
  }
  if (!nonEmpty(input?.gateId) || !ID_RE.test(input.gateId)) problems.push("gate-id");
  if (!nonEmpty(input?.changeRef)) problems.push("change-ref");
  if (typeof input?.assessedAt !== "string" || !ISO_RE.test(input.assessedAt) || Number.isNaN(Date.parse(input.assessedAt))) {
    problems.push("assessed-at");
  }
  if (!Array.isArray(input?.evidence)) problems.push("legs");
  else {
    for (const entry of input.evidence) {
      if (!REVIEW_LEGS.includes(entry?.leg)) problems.push("unknown-leg");
      else if (!REVIEW_LEG_STATES.includes(entry?.state)) problems.push("unknown-leg");
    }
    const legs = input.evidence.map((e) => e.leg);
    if (new Set(legs).size !== legs.length) problems.push("duplicate-leg");
  }
  problems.push(...validateIndependence(input?.independence));
  if (problems.length > 0) {
    throw new Error(`invalid review gate ${String(input?.gateId)}: ${[...new Set(problems)].sort().join(",")}`);
  }

  // Every registered leg appears in the report, supplied or not.
  const supplied = new Map(input.evidence.map((e) => [e.leg, e]));
  const legs: ReviewLegRecord[] = REVIEW_LEGS.map((leg) => {
    const entry = supplied.get(leg);
    if (entry === undefined) {
      return { leg, state: "MISSING_EVIDENCE" as const, reason: `no evidence supplied for the ${leg} leg` };
    }
    // A non-PASS leg must say why. An unexplained failure is not reviewable.
    if (entry.state !== "PASS" && !nonEmpty(entry.reason)) {
      throw new Error(
        `invalid review gate ${input.gateId}: ${leg} leg is ${entry.state} and must carry a reason`,
      );
    }
    return {
      leg,
      state: entry.state,
      ...(entry.sourceRef === undefined ? {} : { sourceRef: entry.sourceRef }),
      ...(entry.reason === undefined ? {} : { reason: entry.reason }),
    };
  }).sort(compareLegs);

  const allLegsPass = legs.every((l) => l.state === "PASS");
  const anyFail = legs.some((l) => l.state === "FAIL");
  const outcome: GateOutcome = anyFail ? "REVIEW_FAILED" : allLegsPass ? "REVIEW_READY" : "REVIEW_INCOMPLETE";

  // Clean-room EXECUTION readiness is a statement about this gate's inputs.
  // It is never a clean-room PROOF: REQ-p20-clean-room is BLOCKED for want of
  // an isolated backend, which no internal review can substitute for.
  const cleanRoomReady = allLegsPass;

  return {
    gateId: input.gateId,
    changeRef: input.changeRef,
    legs,
    allLegsPass,
    outcome,
    independence: {
      sameActor: input.independence.sameActor,
      reviewerRef: input.independence.reviewerRef,
      changeProducerRef: input.independence.changeProducerRef,
      notes: [...input.independence.notes].sort(compareStrings),
    },
    cleanRoomReady,
    cleanRoomProven: false,
    noMergeAuthority: true,
    noCompositeScore: true,
    provenance: input.provenance ?? GATE_PROVENANCE,
    assessedAt: input.assessedAt,
  };
}

/**
 * The evidence gate's own verdict, read through the EXISTING
 * `checkEvidenceGate`. This module does not re-implement evidence checking;
 * it reports what the existing gate concluded.
 */
export function evidenceLeg(
  required: readonly EvidenceRequirement[],
  provided: readonly EvidenceProvided[],
  sourceRef?: string,
): LegEvidence {
  const result = checkEvidenceGate(required, provided);
  if (result.verdict === "COMPLETE") {
    return {
      leg: "verification",
      state: "PASS",
      ...(sourceRef === undefined ? {} : { sourceRef }),
      reason: `evidence gate COMPLETE (${result.missing.length} missing, ${result.failed.length} failed)`,
    };
  }
  const parts = [
    result.missing.length > 0 ? `missing: ${[...result.missing].sort(compareStrings).join(",")}` : undefined,
    result.failed.length > 0 ? `failed: ${[...result.failed].sort(compareStrings).join(",")}` : undefined,
  ].filter((p): p is string => p !== undefined);
  return {
    leg: "verification",
    state: parts.some((p) => p.startsWith("failed")) ? "FAIL" : "MISSING_EVIDENCE",
    ...(sourceRef === undefined ? {} : { sourceRef }),
    reason: `evidence gate NOT_PROVEN: ${parts.join("; ")}`,
  };
}

/**
 * The model-review leg. It exists, and it is UNAVAILABLE while
 * `REQ-p18-model-fabric` is BLOCKED on cloud credentials.
 *
 * There is deliberately no fallback reviewer: no substituted provider, no
 * local model presented as independent, and no "temporary pass".
 * MISSING REVIEWER != REVIEW SUCCESS.
 */
export function modelReviewLeg(input: {
  /** Why no independent model reviewer can run. */
  blockerRef: string;
  reason?: string;
}): LegEvidence {
  if (!nonEmpty(input?.blockerRef)) {
    throw new Error("invalid model review leg: blockerRef is required so the unavailability has a traceable cause");
  }
  return {
    leg: "model-review",
    state: "UNAVAILABLE",
    sourceRef: input.blockerRef,
    reason:
      input.reason ??
      "no independent model reviewer is available: REQ-p18-model-fabric is BLOCKED on cloud credentials; no fallback reviewer is substituted",
  };
}
