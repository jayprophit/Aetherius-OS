import type { EscalationSignal } from "./abstain";
import { ABSTAIN_REASONS } from "./abstain";

/**
 * REQ-p22-selective-escalation: typed EscalationDecision.
 * (P22 proposes, P25 disposes.)
 *
 * The registered requirement is the scope authority:
 *
 *   "Typed EscalationDecision (can_continue, missing/ambiguous/contradictory
 *    info, resolvability routes, requires_human, confidence); cognition
 *    proposes, P25 authority disposes; never auto-grants or bypasses
 *    approvals."
 *
 * The gap is real and narrow: an `EscalationSignal` exists (uncertainty,
 * reasons, candidates), and untyped `"escalate"` fallback strings exist, but
 * no `EscalationDecision` exists anywhere. This unit adds exactly the typed
 * decision, composed from the existing signal seam:
 *
 *   SIGNAL (abstain.ts) != DECISION (here)
 *   NO escalationSignal2, NO EscalationSignalV2, NO ReflexEscalation2
 *
 * CAN_CONTINUE AND REQUIRES_HUMAN ARE DERIVED, NEVER ASSERTED. A caller cannot
 * hand this module a verdict. `can_continue` follows from the evidence (no
 * unresolved missing items, no live contradictions, no human-only reason), and
 * `requires_human` follows only from explicit human-only reasons:
 *
 *   LOW CONFIDENCE != AUTOMATIC HUMAN REQUIREMENT
 *   MISSING EVIDENCE + HIGH CONFIDENCE STILL BLOCKS CONTINUATION
 *
 * REQUIRES HUMAN MEANS ONE THING. It means automated resolution is
 * insufficient under the recorded conditions — never unsafe, unauthorized, low
 * confidence, or controversial by itself. Each human requirement is traceable
 * to an explicit reason from a closed vocabulary:
 *
 *   REQUIRES HUMAN != HUMAN APPROVAL
 *   REQUIRES HUMAN != UNSAFE
 *   HUMAN REVIEW REQUEST != OWNER APPROVAL
 *
 * A MACHINE STEP THAT CAN RESOLVE IS NOT THE SAME AS PERMISSION TO RUN IT.
 * Resolver routes recommend; they never authorize, spawn, invoke, message, or
 * execute:
 *
 *   WORKER RECOMMENDED != WORKER SPAWNED
 *   TOOL RECOMMENDED != TOOL AUTHORIZED
 *   SEARCH RECOMMENDED != SEARCH EXECUTED
 *   RESOLVABLE_BY TOOL != AUTHORIZED TO USE TOOL
 *   ESCALATION DECISION != ESCALATION EXECUTION
 *
 * And escalation as a whole grants nothing:
 *
 *   ESCALATION != AUTHORIZATION
 *   ESCALATION TARGET != PERMISSION TO INVOKE TARGET
 *   P25 STILL DISPOSES; THIS MODULE ONLY EVER PROPOSES
 *
 * CONTRADICTIONS ARE PRESERVED, NEVER RESOLVED. Two contradicting claims are
 * recorded side by side with their sources. This module picks no winner, and
 * MAT/epistemic-graph work stays separate — no EpistemicGraph is built here:
 *
 *   CONTRADICTION != AUTOMATIC RESOLUTION
 *   PRESERVED CONTRADICTION BLOCKS CONTINUATION
 *
 * MISSING STAYS MISSING. Required evidence that is absent is recorded as
 * absent, never rounded to negative evidence, and never implied present by
 * high confidence:
 *
 *   REQUIRED EVIDENCE MISSING != PROVEN COMPLETE
 *   MISSING EVIDENCE != NEGATIVE EVIDENCE
 *
 * UNAVAILABLE STAYS UNAVAILABLE. A resolver that needs blocked Model Fabric,
 * an owner-gated memory lane, or an unresolved human gate is recorded with its
 * blocker — never silently rerouted to a local model, a direct provider, or a
 * hidden fallback:
 *
 *   UNAVAILABLE != DENIED
 *   NO SILENT FALLBACK, NO HIDDEN ROUTE
 *
 * CONFIDENCE HAS ONE MEANING HERE: confidence in this decision's own
 * completeness and correct classification. It is not an error rate, not an
 * unsafety probability, not an abstention probability:
 *
 *   ESCALATION CONFIDENCE != ERROR PROBABILITY
 *   ESCALATION CONFIDENCE != UNSAFETY PROBABILITY
 *   ESCALATION CONFIDENCE != ABSTAIN PROBABILITY
 *   CONFIDENCE != AUTHORIZATION
 *
 * It is reported with an explicit `calibrated` flag. A claim of `calibrated:
 * true` requires a calibration evidence ref; otherwise the confidence is raw
 * and says so. Nothing here duplicates temperature scaling or PAVA:
 *
 *   CALIBRATION CAPABILITY EXISTS != EVERY SIGNAL CALIBRATED
 *   NO Calibration2, NO SECOND FITTER
 *
 * Abstention reasons are referenced from the closed `ABSTAIN_REASONS`
 * vocabulary, never extended or reinterpreted here.
 */

/** Escalation-specific reason classes, disjoint from abstention reasons. */
export const ESCALATION_REASONS = [
  "MISSING_INFORMATION",
  "AMBIGUITY",
  "CONTRADICTION",
  "UNAVAILABLE_RESOLVER",
  "HUMAN_ONLY",
] as const;
export type EscalationReason = (typeof ESCALATION_REASONS)[number];

/** The only reasons that may set requires_human. Closed, traceable. */
export const HUMAN_ONLY_REASONS = [
  "OWNER_DECISION_REQUIRED",
  "IRREDUCIBLE_AMBIGUITY",
  "CONFLICTING_PROTECTED_POLICY",
  "HUMAN_ONLY_EVIDENCE",
  "UNRESOLVED_AUTHORIZATION",
] as const;
export type HumanOnlyReason = (typeof HUMAN_ONLY_REASONS)[number];

/** Resolver route kinds. A recommendation, never an invocation. */
export const RESOLVER_KINDS = [
  "SEARCH",
  "DETERMINISTIC_TOOL",
  "DEEPER_REASONING",
  "TEMPORARY_WORKER",
  "VERIFICATION",
  "MODEL_FABRIC",
  "HUMAN",
  "OWNER_DECISION",
] as const;
export type ResolverKind = (typeof RESOLVER_KINDS)[number];

export type EscalationProblemCode =
  | "ESCALATION_INVALID_INPUT"
  | "ESCALATION_UNKNOWN_FIELD"
  | "ESCALATION_FROM_NON_ABSTAINED"
  | "ESCALATION_BAD_REASON"
  | "ESCALATION_BAD_ITEM"
  | "ESCALATION_AMBIGUITY_NEEDS_OPTIONS"
  | "ESCALATION_CONTRADICTION_NEEDS_CLAIMS"
  | "ESCALATION_HUMAN_REASON_REQUIRED"
  | "ESCALATION_UNAVAILABLE_NEEDS_BLOCKER"
  | "ESCALATION_DERIVED_FIELD_REJECTED"
  | "ESCALATION_AUTHORITY_REJECTED"
  | "ESCALATION_EXECUTION_REJECTED"
  | "ESCALATION_PERSONALITY_REJECTED"
  | "ESCALATION_SECRET_REJECTED"
  | "ESCALATION_CALIBRATION_REF_REQUIRED"
  | "ESCALATION_CONFIDENCE_INVALID";

export class EscalationError extends Error {
  readonly code: EscalationProblemCode;
  constructor(code: EscalationProblemCode, message: string) {
    super(message);
    this.name = "EscalationError";
    this.code = code;
  }
}

export interface MissingItem {
  id: string;
  description: string;
  evidenceRef?: string;
}

export interface AmbiguityItem {
  id: string;
  description: string;
  /** An ambiguity with fewer than two options is not an ambiguity. */
  options: string[];
}

export interface ContradictionClaim {
  claim: string;
  source: string;
}

export interface ContradictionItem {
  id: string;
  description: string;
  /** Two or more sourced claims, recorded side by side. No winner picked. */
  claims: ContradictionClaim[];
}

export interface ResolverRoute {
  kind: ResolverKind;
  /** WHAT would resolve, never a call to run it. */
  target: string;
  description: string;
  availability: "AVAILABLE" | "UNAVAILABLE";
  /** Required when UNAVAILABLE: the blocker, not a reroute. */
  blockerRef?: string;
}

export interface EscalationConfidence {
  /** In (0, 1]: confidence in this decision's own completeness. */
  value: number;
  meaning: "COMPLETENESS_OF_THIS_DECISION";
  /** Raw unless a calibration evidence ref is supplied. */
  calibrated: boolean;
  calibrationRef?: string;
}

export interface EscalationInput {
  /** Carried from the existing signal; read, never re-derived. */
  signal: EscalationSignal;
  decisionId: string;
  missing: MissingItem[];
  ambiguous: AmbiguityItem[];
  contradictory: ContradictionItem[];
  resolvers: ResolverRoute[];
  humanReasons: HumanOnlyReason[];
  confidence: EscalationConfidence;
  evidenceRefs?: string[];
  provenance: string;
}

export interface EscalationDecision {
  decisionId: string;
  /** Signal facts carried through: type, fingerprint, probability, reasons. */
  fromSignal: {
    taskType: string;
    inputFingerprint: string;
    abstainProbability: number;
    abstainReasons: string[];
  };
  /** DERIVED. Never supplied. */
  can_continue: boolean;
  missing: MissingItem[];
  ambiguous: AmbiguityItem[];
  contradictory: ContradictionItem[];
  resolvers: ResolverRoute[];
  /** DERIVED. True iff humanReasons is non-empty. */
  requires_human: boolean;
  humanReasons: HumanOnlyReason[];
  confidence: EscalationConfidence;
  /** This unit only ever proposes. P25 disposes, elsewhere. */
  disposition: "PROPOSED";
  disposedBy: "P25";
  p25Disposition: "PENDING";
  evidenceRefs: string[];
  provenance: string;
}

const INPUT_FIELDS = [
  "signal",
  "decisionId",
  "missing",
  "ambiguous",
  "contradictory",
  "resolvers",
  "humanReasons",
  "confidence",
  "evidenceRefs",
  "provenance",
] as const;

const DERIVED_FIELDS = ["can_continue", "requires_human", "disposition", "disposedBy", "p25Disposition"];

const AUTHORITY_KEYS = [
  "authorized",
  "approved",
  "canExecute",
  "executeNow",
  "policyBypass",
  "ownerOverride",
  "mergeAuthority",
  "grantApproved",
  "permissionGranted",
  "disposed",
  "p25Approved",
];

const EXECUTION_KEYS = [
  "spawnWorker",
  "spawnedWorker",
  "runTool",
  "toolResult",
  "executedSearch",
  "searchResult",
  "messagedHuman",
  "humanResponse",
  "invoked",
  "executed",
  "deployed",
  "merged",
  "escalated",
];

const PERSONALITY_KEYS = [
  "personality",
  "persona",
  "traits",
  "backstory",
  "biography",
  "autobiography",
  "identity",
  "dna",
  "soul",
  "selfModel",
];

const SECRET_KEYS = ["apiKey", "secret", "token", "password", "privateKey", "credential"];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Security-significant violations are diagnosed BEFORE generic shape errors,
 * so a smuggled authority claim is reported as itself and never disappears
 * into an EXTRA_KEY complaint.
 */
function assertNoViolations(value: unknown, path: string, seen: Set<unknown>): void {
  if (seen.has(value) || typeof value !== "object" || value === null) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoViolations(item, `${path}[${index}]`, seen));
    return;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (AUTHORITY_KEYS.includes(key)) {
      throw new EscalationError(
        "ESCALATION_AUTHORITY_REJECTED",
        `${path}.${key}: escalation proposes; it never carries authority`,
      );
    }
    if (EXECUTION_KEYS.includes(key)) {
      throw new EscalationError(
        "ESCALATION_EXECUTION_REJECTED",
        `${path}.${key}: escalation decides; it never executes`,
      );
    }
    if (PERSONALITY_KEYS.includes(key)) {
      throw new EscalationError(
        "ESCALATION_PERSONALITY_REJECTED",
        `${path}.${key}: a decision carries no stored person`,
      );
    }
    if (SECRET_KEYS.includes(key)) {
      throw new EscalationError(
        "ESCALATION_SECRET_REJECTED",
        `${path}.${key}: raw secrets never ride an escalation decision`,
      );
    }
    assertNoViolations(nested, `${path}.${key}`, seen);
  }
}

function assertSignalShape(signal: unknown): EscalationSignal {
  if (!isPlainObject(signal)) {
    throw new EscalationError("ESCALATION_INVALID_INPUT", "signal must be an object");
  }
  if (signal.abstained !== true) {
    throw new EscalationError(
      "ESCALATION_FROM_NON_ABSTAINED",
      "escalation is built from an abstained signal; a non-abstained case continues normally without a decision",
    );
  }
  if (typeof signal.abstainProbability !== "number" || !Number.isFinite(signal.abstainProbability)) {
    throw new EscalationError("ESCALATION_INVALID_INPUT", "signal abstainProbability must be a finite number");
  }
  if (!Array.isArray(signal.reasons) || signal.reasons.some((r) => !ABSTAIN_REASONS.includes(r))) {
    throw new EscalationError(
      "ESCALATION_BAD_REASON",
      "signal reasons must come from the closed abstention vocabulary; escalation adds no meanings to it",
    );
  }
  if (typeof signal.taskType !== "string" || signal.taskType.trim().length === 0) {
    throw new EscalationError("ESCALATION_INVALID_INPUT", "signal taskType must be a non-empty string");
  }
  if (typeof signal.inputFingerprint !== "string" || signal.inputFingerprint.trim().length === 0) {
    throw new EscalationError("ESCALATION_INVALID_INPUT", "signal inputFingerprint must be a non-empty string");
  }
  if (signal.candidates !== undefined) {
    if (
      !Array.isArray(signal.candidates) ||
      signal.candidates.some((c) => typeof (c as { value?: unknown })?.value !== "string")
    ) {
      throw new EscalationError("ESCALATION_INVALID_INPUT", "signal candidates must carry string values");
    }
  }
  return {
    abstained: true,
    abstainProbability: signal.abstainProbability as number,
    reasons: [...(signal.reasons as string[])] as EscalationSignal["reasons"],
    candidates: ((signal.candidates ?? []) as Array<{ value: string; probability?: number }>).map((c) => ({ ...c })),
    taskType: signal.taskType as string,
    inputFingerprint: signal.inputFingerprint as string,
    requiresHuman: false,
  };
}

function sortStrings(values: string[]): string[] {
  return [...values].sort();
}

function assertMissingItem(value: unknown, index: number): MissingItem {
  if (!isPlainObject(value) || !nonEmpty(value.id) || !nonEmpty(value.description)) {
    throw new EscalationError("ESCALATION_BAD_ITEM", `missing[${index}] needs a non-empty id and description`);
  }
  for (const key of Object.keys(value)) {
    if (!["id", "description", "evidenceRef"].includes(key)) {
      throw new EscalationError("ESCALATION_UNKNOWN_FIELD", `unknown missing field ${key}`);
    }
  }
  if (value.evidenceRef !== undefined && !nonEmpty(value.evidenceRef)) {
    throw new EscalationError("ESCALATION_BAD_ITEM", `missing[${index}] evidenceRef must be non-empty`);
  }
  return { id: value.id, description: value.description, ...(value.evidenceRef === undefined ? {} : { evidenceRef: value.evidenceRef as string }) };
}

function assertAmbiguityItem(value: unknown, index: number): AmbiguityItem {
  if (!isPlainObject(value) || !nonEmpty(value.id) || !nonEmpty(value.description)) {
    throw new EscalationError("ESCALATION_BAD_ITEM", `ambiguous[${index}] needs a non-empty id and description`);
  }
  for (const key of Object.keys(value)) {
    if (!["id", "description", "options"].includes(key)) {
      throw new EscalationError("ESCALATION_UNKNOWN_FIELD", `unknown ambiguous field ${key}`);
    }
  }
  if (!Array.isArray(value.options) || value.options.length < 2 || value.options.some((o) => !nonEmpty(o))) {
    throw new EscalationError(
      "ESCALATION_AMBIGUITY_NEEDS_OPTIONS",
      `ambiguous[${index}] needs two or more non-empty options; fewer is not an ambiguity`,
    );
  }
  return { id: value.id, description: value.description, options: sortStrings(value.options as string[]) };
}

function assertContradictionItem(value: unknown, index: number): ContradictionItem {
  if (!isPlainObject(value) || !nonEmpty(value.id) || !nonEmpty(value.description)) {
    throw new EscalationError("ESCALATION_BAD_ITEM", `contradictory[${index}] needs a non-empty id and description`);
  }
  for (const key of Object.keys(value)) {
    if (!["id", "description", "claims"].includes(key)) {
      throw new EscalationError("ESCALATION_UNKNOWN_FIELD", `unknown contradictory field ${key}`);
    }
  }
  if (!Array.isArray(value.claims) || value.claims.length < 2) {
    throw new EscalationError(
      "ESCALATION_CONTRADICTION_NEEDS_CLAIMS",
      `contradictory[${index}] needs two or more sourced claims; a single claim is not a contradiction`,
    );
  }
  const claims = (value.claims as unknown[]).map((claim, claimIndex) => {
    if (!isPlainObject(claim) || !nonEmpty(claim.claim) || !nonEmpty(claim.source)) {
      throw new EscalationError(
        "ESCALATION_CONTRADICTION_NEEDS_CLAIMS",
        `contradictory[${index}] claim ${claimIndex} needs a non-empty claim and source; both sides are preserved`,
      );
    }
    return { claim: claim.claim, source: claim.source };
  });
  return { id: value.id, description: value.description, claims };
}

function assertResolverRoute(value: unknown, index: number): ResolverRoute {
  if (!isPlainObject(value)) {
    throw new EscalationError("ESCALATION_BAD_ITEM", `resolvers[${index}] must be an object`);
  }
  for (const key of Object.keys(value)) {
    if (!["kind", "target", "description", "availability", "blockerRef"].includes(key)) {
      throw new EscalationError("ESCALATION_UNKNOWN_FIELD", `unknown resolver field ${key}`);
    }
  }
  if (!RESOLVER_KINDS.includes(value.kind as ResolverKind)) {
    throw new EscalationError("ESCALATION_BAD_ITEM", `resolvers[${index}] kind is not a registered resolver kind`);
  }
  if (!nonEmpty(value.target) || !nonEmpty(value.description)) {
    throw new EscalationError("ESCALATION_BAD_ITEM", `resolvers[${index}] needs a non-empty target and description`);
  }
  if (value.availability !== "AVAILABLE" && value.availability !== "UNAVAILABLE") {
    throw new EscalationError("ESCALATION_BAD_ITEM", `resolvers[${index}] availability must be AVAILABLE or UNAVAILABLE`);
  }
  if (value.availability === "UNAVAILABLE" && !nonEmpty(value.blockerRef)) {
    throw new EscalationError(
      "ESCALATION_UNAVAILABLE_NEEDS_BLOCKER",
      `resolvers[${index}] is UNAVAILABLE and must name its blocker rather than vanish`,
    );
  }
  return {
    kind: value.kind as ResolverKind,
    target: value.target,
    description: value.description,
    availability: value.availability,
    ...(value.blockerRef === undefined ? {} : { blockerRef: value.blockerRef as string }),
  };
}

function assertConfidence(value: unknown): EscalationConfidence {
  if (!isPlainObject(value)) {
    throw new EscalationError("ESCALATION_CONFIDENCE_INVALID", "confidence must be an object");
  }
  for (const key of Object.keys(value)) {
    if (!["value", "meaning", "calibrated", "calibrationRef"].includes(key)) {
      throw new EscalationError("ESCALATION_UNKNOWN_FIELD", `unknown confidence field ${key}`);
    }
  }
  // Confidence here means exactly one thing. Foreign meanings (error rate,
  // unsafety, abstention probability) have their own fields elsewhere.
  if (value.meaning !== undefined && value.meaning !== "COMPLETENESS_OF_THIS_DECISION") {
    throw new EscalationError(
      "ESCALATION_CONFIDENCE_INVALID",
      "confidence here means completeness of this decision only; other probabilities keep their own fields",
    );
  }
  if (typeof value.value !== "number" || !Number.isFinite(value.value) || value.value <= 0 || value.value > 1) {
    throw new EscalationError("ESCALATION_CONFIDENCE_INVALID", "confidence value must be finite within (0, 1]");
  }
  if (typeof value.calibrated !== "boolean") {
    throw new EscalationError("ESCALATION_CONFIDENCE_INVALID", "confidence must declare calibrated true or false");
  }
  if (value.calibrated && !nonEmpty(value.calibrationRef)) {
    throw new EscalationError(
      "ESCALATION_CALIBRATION_REF_REQUIRED",
      "calibrated confidence requires a calibration evidence ref; uncalibrated confidence says so",
    );
  }
  return {
    value: value.value,
    meaning: "COMPLETENESS_OF_THIS_DECISION",
    calibrated: value.calibrated,
    ...(value.calibrationRef === undefined ? {} : { calibrationRef: value.calibrationRef as string }),
  };
}

/**
 * Build the typed decision. can_continue and requires_human are derived here
 * from the recorded evidence; any caller-supplied verdict field is rejected.
 */
export function decideEscalation(input: unknown): EscalationDecision {
  if (!isPlainObject(input)) {
    throw new EscalationError("ESCALATION_INVALID_INPUT", "escalation input must be an object");
  }
  assertNoViolations(input, "input", new Set());
  for (const key of Object.keys(input)) {
    if (!(INPUT_FIELDS as readonly string[]).includes(key)) {
      if ((DERIVED_FIELDS as readonly string[]).includes(key)) {
        throw new EscalationError(
          "ESCALATION_DERIVED_FIELD_REJECTED",
          `${key} is derived from the evidence here and must not be supplied`,
        );
      }
      throw new EscalationError("ESCALATION_UNKNOWN_FIELD", `unknown escalation field ${key}`);
    }
  }
  const record = input as Record<string, unknown>;
  if (!nonEmpty(record.decisionId)) {
    throw new EscalationError("ESCALATION_INVALID_INPUT", "decisionId must be a non-empty string");
  }
  if (!nonEmpty(record.provenance)) {
    throw new EscalationError("ESCALATION_INVALID_INPUT", "provenance must be a non-empty string");
  }
  const signal = assertSignalShape(record.signal);

  const requireArray = (name: string): unknown[] => {
    if (!Array.isArray(record[name])) {
      throw new EscalationError("ESCALATION_INVALID_INPUT", `${name} must be an array`);
    }
    return record[name] as unknown[];
  };
  const missing = requireArray("missing").map(assertMissingItem);
  const ambiguous = requireArray("ambiguous").map(assertAmbiguityItem);
  const contradictory = requireArray("contradictory").map(assertContradictionItem);
  const resolvers = requireArray("resolvers").map(assertResolverRoute);
  if (!Array.isArray(record.humanReasons) || record.humanReasons.some((r) => !HUMAN_ONLY_REASONS.includes(r as HumanOnlyReason))) {
    throw new EscalationError(
      "ESCALATION_HUMAN_REASON_REQUIRED",
      "humanReasons must come from the closed human-only vocabulary; anything else is not a human requirement",
    );
  }
  const humanReasons = [...(record.humanReasons as HumanOnlyReason[])].sort();
  const confidence = assertConfidence(record.confidence);
  const evidenceRefs = record.evidenceRefs === undefined ? [] : record.evidenceRefs;
  if (!Array.isArray(evidenceRefs) || evidenceRefs.some((r) => !nonEmpty(r))) {
    throw new EscalationError("ESCALATION_INVALID_INPUT", "evidenceRefs must be an array of non-empty strings");
  }

  // Derived, in this order: human first, then continuation.
  const requires_human = humanReasons.length > 0;
  const can_continue =
    !requires_human && missing.length === 0 && contradictory.length === 0 && ambiguous.length === 0;

  const byId = <T extends { id: string }>(items: T[]): T[] =>
    [...items].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  return {
    decisionId: record.decisionId as string,
    fromSignal: {
      taskType: signal.taskType,
      inputFingerprint: signal.inputFingerprint,
      abstainProbability: signal.abstainProbability,
      abstainReasons: [...signal.reasons].sort(),
    },
    can_continue,
    missing: byId(missing),
    ambiguous: byId(ambiguous),
    contradictory: byId(contradictory),
    resolvers: [...resolvers].sort((a, b) =>
      a.kind === b.kind ? (a.target < b.target ? -1 : a.target > b.target ? 1 : 0) : a.kind < b.kind ? -1 : 1,
    ),
    requires_human,
    humanReasons,
    confidence,
    disposition: "PROPOSED",
    disposedBy: "P25",
    p25Disposition: "PENDING",
    evidenceRefs: sortStrings(evidenceRefs as string[]),
    provenance: record.provenance as string,
  };
}
