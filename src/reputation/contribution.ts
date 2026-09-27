/**
 * REQ-p25-reputation: contribution-scored reputation over validated actions.
 *
 * The registered requirement is the scope authority:
 *
 *   "Contribution-scored reputation over validated actions; docs-only
 *    mentions today, no scoring code."
 *
 * The scoring unit is the CONTRIBUTION — a validated action — not a person, a
 * model, a provider, or a social score. Nothing in this repository scores
 * contributions today (the word "trust" appears only in unrelated owners:
 * package trust metadata, sealed-vault trust machines, scheduler claim
 * semantics — all untouched), so the gap is exactly this scoring code:
 *
 *   CONTRIBUTION-SCORED != PERSON-SCORED
 *   NO scoring code existed; THIS module is the scoring code
 *
 * ONLY VALIDATED ACTIONS COUNT. An action without verification evidence is
 * recorded as unvalidated and excluded from every tally. A worker saying
 * "success" is not a verified success:
 *
 *   SELF-REPORTED SUCCESS != VERIFIED SUCCESS
 *   UNVALIDATED ACTION != EVIDENCE
 *
 * ATTRIBUTION GATES BOTH DIRECTIONS. A failure the subject did not cause is
 * not counted against it — and symmetrically, a success the subject did not
 * cause is not counted for it:
 *
 *   TASK FAILED != SUBJECT CAUSED FAILURE
 *   TASK SUCCEEDED != SUBJECT CAUSED SUCCESS
 *
 * A COLD SUBJECT IS UNKNOWN, NOT ZERO-RATED. No validated decisive actions
 * means state UNKNOWN. The zero tallies alongside it mean "none observed",
 * which the UNKNOWN state makes explicit — never a rating of zero:
 *
 *   NO HISTORY != BAD REPUTATION
 *   NO HISTORY != GOOD REPUTATION
 *   UNKNOWN != ZERO
 *
 * DUPLICATE REFERENCE != ADDITIONAL EVIDENCE. The same action recorded twice
 * (same actionId) is rejected, not double-counted; shared evidence refs are
 * deduplicated in the view.
 *
 * THE SCORE IS AN EXPLICIT TALLY, NOT A TRUST NUMBER. Verified successes,
 * verified subject-attributed failures, and a support count — integers only,
 * no floats anywhere. No 0–100, no stars, no grades, no composite:
 *
 *   EXPLICIT TALLY != UNIVERSAL TRUST SCORE
 *   CONVENIENT COMPOSITE SCORE != REQUIREMENT
 *
 * REPUTATION OBSERVES; IT GRANTS NOTHING. The view carries no permission,
 * role, capability, approval, or policy field, and computing it performs no
 * side effect — no grants, no revocations, no spawns, no bans, no lifecycle
 * changes:
 *
 *   REPUTATION != AUTHORIZATION / APPROVAL / ROLE / IDENTITY / CAPABILITY
 *   HIGH REPUTATION != CLAIM TRUE; LOW REPUTATION != CLAIM FALSE
 *   REPUTATION UPDATE != POLICY SIDE EFFECT
 *   TRUST HISTORY != SECURITY EXEMPTION
 *
 * Subjects are opaque references. This module owns no identity — worker
 * profile vs instance, model vs provider, service vs worker stay exactly as
 * their owners define them:
 *
 *   REPUTATION SUBJECT REF != IDENTITY REGISTRY
 *   WORKER PROFILE != WORKER INSTANCE (never transferred silently)
 *
 * Evidence stays owned elsewhere: views carry evidenceRefs; no
 * ReputationEvidenceGraph is built, audit evidence is never mutated, and
 * completion is never recomputed (REPUTATION ENGINE != COMPLETION GATE).
 * Calibration probabilities are not reputation (MODEL CALIBRATION !=
 * REPUTATION; CONFIDENCE != REPUTATION).
 *
 * Timestamps are caller-supplied observedAt, never generated. Everything is
 * pure and deterministic: canonical ordering before accumulation, scrambled
 * inputs produce identical views, caller data is never mutated.
 */

export type ReputationProblemCode =
  | "REPUTATION_INVALID_INPUT"
  | "REPUTATION_UNKNOWN_FIELD"
  | "REPUTATION_AUTHORITY_REJECTED"
  | "REPUTATION_SECRET_REJECTED"
  | "REPUTATION_PERSONALITY_REJECTED"
  | "REPUTATION_DUPLICATE_ACTION"
  | "REPUTATION_VERIFICATION_REF_REQUIRED";

export class ReputationError extends Error {
  readonly code: ReputationProblemCode;
  constructor(code: ReputationProblemCode, message: string) {
    super(message);
    this.name = "ReputationError";
    this.code = code;
  }
}

export const ACTION_OUTCOMES = ["SUCCESS", "FAILURE", "UNKNOWN"] as const;
export type ActionOutcome = (typeof ACTION_OUTCOMES)[number];

export const ATTRIBUTIONS = ["SUBJECT", "EXTERNAL", "UNKNOWN"] as const;
export type Attribution = (typeof ATTRIBUTIONS)[number];

export interface ContributionAction {
  /** Stable identity. Same id twice is a duplicate, never more evidence. */
  actionId: string;
  /** Opaque reference to whoever contributed. Never owned or resolved here. */
  subjectRef: string;
  /** Caller action vocabulary, non-empty. No taxonomy is invented. */
  kind: string;
  /** Whether verification evidence backs this action. */
  verified: boolean;
  /** Required when verified: the verification evidence reference. */
  verificationRef?: string;
  outcome: ActionOutcome;
  /** Who caused the outcome. Gates counting in both directions. */
  attribution: Attribution;
  evidenceRefs: string[];
  /** Caller-supplied observation time. Never generated. */
  observedAt: string;
  provenance: string;
}

export interface ReputationView {
  subjectRef: string;
  /** UNKNOWN means no validated decisive actions — never a zero rating. */
  state: "RATED" | "UNKNOWN";
  verifiedSuccesses: number;
  /** Subject-attributed verified failures only. */
  verifiedFailures: number;
  /** Decisive validated actions behind the rating. */
  supportCount: number;
  /** Canonical deduplicated evidence behind the rating. */
  evidenceRefs: string[];
  provenance: string;
}

const ACTION_FIELDS = [
  "actionId", "subjectRef", "kind", "verified", "verificationRef",
  "outcome", "attribution", "evidenceRefs", "observedAt", "provenance",
] as const;

const AUTHORITY_KEYS = [
  "authorized", "approved", "canExecute", "canDeploy", "permission",
  "permissionGranted", "grantApproved", "policyBypass", "ownerOverride",
  "mergeAuthority", "role", "capability", "capabilities", "clearance",
];

const SECRET_KEYS = ["apiKey", "secret", "token", "password", "privateKey", "credential"];

const PERSONALITY_KEYS = [
  "personality", "persona", "traits", "backstory", "biography",
  "autobiography", "identity", "dna", "soul", "selfModel",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Security-significant violations are diagnosed BEFORE generic shape errors,
 * so a smuggled grant is reported as itself and never disappears into an
 * unknown-field complaint.
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
      throw new ReputationError("REPUTATION_AUTHORITY_REJECTED", `${path}.${key}: reputation never carries authority, role, or capability`);
    }
    if (SECRET_KEYS.includes(key)) {
      throw new ReputationError("REPUTATION_SECRET_REJECTED", `${path}.${key}: raw secrets never ride a reputation record`);
    }
    if (PERSONALITY_KEYS.includes(key)) {
      throw new ReputationError("REPUTATION_PERSONALITY_REJECTED", `${path}.${key}: a contribution record carries no stored person`);
    }
    assertNoViolations(nested, `${path}.${key}`, seen);
  }
}

/**
 * Validate one contribution action. Strict closed shape; unknown fields are
 * rejected, never dropped.
 */
export function validateAction(input: unknown): ContributionAction {
  if (!isPlainObject(input)) {
    throw new ReputationError("REPUTATION_INVALID_INPUT", "contribution action must be an object");
  }
  assertNoViolations(input, "action", new Set());
  for (const key of Object.keys(input)) {
    if (!(ACTION_FIELDS as readonly string[]).includes(key)) {
      throw new ReputationError("REPUTATION_UNKNOWN_FIELD", `unknown action field ${key}`);
    }
  }
  if (!nonEmpty(input.actionId)) {
    throw new ReputationError("REPUTATION_INVALID_INPUT", "actionId must be a non-empty stable id");
  }
  if (!nonEmpty(input.subjectRef)) {
    throw new ReputationError("REPUTATION_INVALID_INPUT", "subjectRef must be a non-empty reference: a value without a subject is meaningless");
  }
  if (!nonEmpty(input.kind)) {
    throw new ReputationError("REPUTATION_INVALID_INPUT", "kind must be a non-empty action label");
  }
  if (typeof input.verified !== "boolean") {
    throw new ReputationError("REPUTATION_INVALID_INPUT", "verified must be an explicit boolean");
  }
  if (input.verified && !nonEmpty(input.verificationRef)) {
    throw new ReputationError(
      "REPUTATION_VERIFICATION_REF_REQUIRED",
      "a verified action requires a verificationRef: SELF-REPORTED SUCCESS != VERIFIED SUCCESS",
    );
  }
  if (!ACTION_OUTCOMES.includes(input.outcome as ActionOutcome)) {
    throw new ReputationError("REPUTATION_INVALID_INPUT", "outcome must be SUCCESS, FAILURE, or UNKNOWN");
  }
  if (!ATTRIBUTIONS.includes(input.attribution as Attribution)) {
    throw new ReputationError("REPUTATION_INVALID_INPUT", "attribution must be SUBJECT, EXTERNAL, or UNKNOWN");
  }
  if (!Array.isArray(input.evidenceRefs) || input.evidenceRefs.some((r) => !nonEmpty(r))) {
    throw new ReputationError("REPUTATION_INVALID_INPUT", "evidenceRefs must be an array of non-empty strings");
  }
  if (!nonEmpty(input.observedAt)) {
    throw new ReputationError("REPUTATION_INVALID_INPUT", "observedAt must be a caller-supplied non-empty timestamp: GENERATED TIME != OBSERVED TIME");
  }
  if (!nonEmpty(input.provenance)) {
    throw new ReputationError("REPUTATION_INVALID_INPUT", "provenance must be a non-empty string");
  }
  return {
    actionId: input.actionId,
    subjectRef: input.subjectRef,
    kind: input.kind,
    verified: input.verified,
    ...(input.verificationRef === undefined ? {} : { verificationRef: input.verificationRef as string }),
    outcome: input.outcome as ActionOutcome,
    attribution: input.attribution as Attribution,
    evidenceRefs: [...(input.evidenceRefs as string[])].sort(),
    observedAt: input.observedAt,
    provenance: input.provenance,
  };
}

/**
 * Rate one subject from validated actions. Pure: canonical ordering first,
 * integer tallies only, caller data never mutated.
 *
 * Counting rule, stated once: an action contributes to the tally iff it is
 * verified, its outcome is known, and its attribution is SUBJECT. Everything
 * else is preserved in evidence but never counted — in either direction.
 */
export function rateSubject(actions: ContributionAction[], subjectRef: string, provenance: string): ReputationView {
  if (!Array.isArray(actions)) {
    throw new ReputationError("REPUTATION_INVALID_INPUT", "actions must be an array");
  }
  if (!nonEmpty(subjectRef)) {
    throw new ReputationError("REPUTATION_INVALID_INPUT", "subjectRef must be a non-empty reference");
  }
  if (!nonEmpty(provenance)) {
    throw new ReputationError("REPUTATION_INVALID_INPUT", "provenance must be a non-empty string");
  }
  const ordered = [...actions].sort((a, b) => (a.actionId < b.actionId ? -1 : a.actionId > b.actionId ? 1 : 0));
  const seen = new Set<string>();
  let verifiedSuccesses = 0;
  let verifiedFailures = 0;
  const evidence = new Set<string>();
  for (const action of ordered) {
    const validated = validateAction(action);
    if (validated.subjectRef !== subjectRef) continue;
    if (seen.has(validated.actionId)) {
      throw new ReputationError("REPUTATION_DUPLICATE_ACTION", `action ${validated.actionId} recorded twice: DUPLICATE REFERENCE != ADDITIONAL EVIDENCE`);
    }
    seen.add(validated.actionId);
    if (!validated.verified) continue;
    for (const ref of validated.evidenceRefs) evidence.add(ref);
    if (validated.verificationRef !== undefined) evidence.add(validated.verificationRef);
    if (validated.outcome === "UNKNOWN" || validated.attribution !== "SUBJECT") continue;
    if (validated.outcome === "SUCCESS") verifiedSuccesses += 1;
    else verifiedFailures += 1;
  }
  const supportCount = verifiedSuccesses + verifiedFailures;
  return {
    subjectRef,
    // Cold start: no validated decisive actions means UNKNOWN, and the zero
    // tallies alongside it mean "none observed" — never a zero rating.
    state: supportCount === 0 ? "UNKNOWN" : "RATED",
    verifiedSuccesses,
    verifiedFailures,
    supportCount,
    evidenceRefs: [...evidence].sort(),
    provenance,
  };
}

/**
 * Rate every subject present in the actions. Canonical subject order; same
 * canonical evidence, same output.
 */
export function rateAll(actions: ContributionAction[], provenance: string): ReputationView[] {
  if (!Array.isArray(actions)) {
    throw new ReputationError("REPUTATION_INVALID_INPUT", "actions must be an array");
  }
  const subjects = [...new Set(actions.map((a) => (isPlainObject(a) ? (a.subjectRef as string) : "")))].sort();
  return subjects.map((subjectRef) => rateSubject(actions, subjectRef, provenance));
}
