/**
 * REQ-p31-deployment-profile: deployment qualification profile.
 *
 * The registered requirement is the scope authority:
 *
 *   "Deployment readiness metrics (accuracy, reliability,
 *    escalation/human-review rates, model+execution+review costs, residual
 *    risk, evidence coverage, recovery success) as multidimensional profile;
 *    declarations exist, metrics do not; never a universal score."
 *
 * Seven named dimensions, each measured-or-missing, assembled into one
 * profile. No dimension is ever blended into another and no universal score
 * exists anywhere in this module:
 *
 *   MULTIDIMENSIONAL PROFILE != UNIVERSAL SCORE
 *   SEVEN MEASURED-OR-MISSING SLOTS != ONE NUMBER
 *
 * MEASURED means a caller-supplied observation with method, evidence refs,
 * provenance, and observation time. This module has no runtime access, no
 * telemetry, and no production visibility, so it measures nothing itself —
 * it records measurements honestly or records their absence:
 *
 *   MEASURED != ESTIMATED
 *   MISSING != ZERO (a missing dimension contributes nothing, not a zero)
 *   UNAVAILABLE != FAILED (no measurement says nothing about the system)
 *
 * Each dimension keeps its own units, because the seven quantities are
 * different things and must never be unit-collapsed:
 *
 *   accuracy / reliability / escalation-review-rate: rate in [0,1] + support
 *   cost: model + execution + review amounts in a caller-declared unit
 *     (no currency conversion is ever performed)
 *   residual-risk: caller-assessed level + rationale + evidence
 *     (a level with reasons, never a fabricated probability)
 *   evidence-coverage: covered/total counts with the rate derived, never
 *     asserted
 *   recovery-success: successes/attempts counts with the rate derived
 *
 * WHAT THIS IS NOT. A profile describes readiness evidence; it does not
 * decide, deploy, approve, or release anything:
 *
 *   PROFILE != DEPLOYMENT EXECUTION
 *   PROFILE != DEPLOYMENT AUTHORIZATION
 *   PROFILE != RELEASE SCOPE (OWNER_GATED — untouched, never decided here)
 *   MEASURED DIMENSIONS != RELEASE READY
 *   TARGET DESCRIPTION != TARGET INSTANCE (no placement, P30 untouched)
 *   RELEASE ARTIFACT != DEPLOYED SYSTEM
 *
 * Timestamps are caller-supplied observation times with identity preserved
 * (one observedAt per measurement; never invented, never defaulted).
 * Everything is pure and deterministic: canonical ordering, scrambled-input
 * equality, no caller mutation, no clock, no network.
 */

export type ProfileProblemCode =
  | "PROFILE_INVALID_INPUT"
  | "PROFILE_UNKNOWN_FIELD"
  | "PROFILE_AUTHORITY_REJECTED"
  | "PROFILE_SECRET_REJECTED"
  | "PROFILE_PERSONALITY_REJECTED"
  | "PROFILE_BAD_RATE"
  | "PROFILE_BAD_COUNT"
  | "PROFILE_UNKNOWN_DIMENSION";

export class DeploymentProfileError extends Error {
  readonly code: ProfileProblemCode;
  constructor(code: ProfileProblemCode, message: string) {
    super(message);
    this.name = "DeploymentProfileError";
    this.code = code;
  }
}

/** Exactly the seven registered dimensions. No eighth is ever added here. */
export const PROFILE_DIMENSIONS = [
  "accuracy",
  "reliability",
  "escalation-review-rate",
  "cost",
  "residual-risk",
  "evidence-coverage",
  "recovery-success",
] as const;
export type ProfileDimension = (typeof PROFILE_DIMENSIONS)[number];

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export interface RateMetric {
  /** Rate in [0,1]. Finite; NaN/Infinity rejected, never clamped. */
  rate: number;
  /** Observations behind the rate. Indistinguishable support is dishonest. */
  observations: number;
  method: string;
  evidenceRefs: string[];
  provenance: string;
  observedAt: string;
}

export interface CostMetric {
  model: number;
  execution: number;
  review: number;
  /** Caller-declared unit label (e.g. "USD", "tokens", "ms"). Never converted. */
  unit: string;
  method: string;
  evidenceRefs: string[];
  provenance: string;
  observedAt: string;
}

export interface RiskMetric {
  level: RiskLevel;
  rationale: string;
  evidenceRefs: string[];
  provenance: string;
  observedAt: string;
}

export interface CoverageMetric {
  covered: number;
  total: number;
  method: string;
  evidenceRefs: string[];
  provenance: string;
  observedAt: string;
}

export interface RecoveryMetric {
  successes: number;
  attempts: number;
  method: string;
  evidenceRefs: string[];
  provenance: string;
  observedAt: string;
}

export type DimensionMetric =
  | { kind: "rate"; metric: RateMetric }
  | { kind: "cost"; metric: CostMetric }
  | { kind: "risk"; metric: RiskMetric }
  | { kind: "coverage"; metric: CoverageMetric }
  | { kind: "recovery"; metric: RecoveryMetric };

/** Which metric kind each dimension takes. Fixed by contract, not by caller. */
export const DIMENSION_KINDS: Record<ProfileDimension, DimensionMetric["kind"]> = {
  accuracy: "rate",
  reliability: "rate",
  "escalation-review-rate": "rate",
  cost: "cost",
  "residual-risk": "risk",
  "evidence-coverage": "coverage",
  "recovery-success": "recovery",
};

export interface DimensionSlot {
  dimension: ProfileDimension;
  /** MEASURED carries evidence; UNAVAILABLE carries a reason. Never a zero. */
  state: "MEASURED" | "UNAVAILABLE";
  metric?: DimensionMetric;
  unavailableReason?: string;
}

export interface DeploymentProfile {
  profileId: string;
  subjectRef: string;
  slots: DimensionSlot[];
  provenance: string;
}

const PROFILE_FIELDS = ["profileId", "subjectRef", "measurements", "provenance"] as const;

const AUTHORITY_KEYS = [
  "authorized", "approved", "canExecute", "canDeploy", "permission",
  "permissionGranted", "grantApproved", "policyBypass", "ownerOverride",
  "mergeAuthority", "releaseApproved", "releaseScope", "deployApproved",
  "score", "grade", "rating", "verdict",
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

function nonNegativeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/**
 * Security-significant violations are diagnosed BEFORE generic shape errors,
 * so a smuggled approval is reported as itself and never disappears into an
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
      throw new DeploymentProfileError("PROFILE_AUTHORITY_REJECTED", `${path}.${key}: a readiness profile never carries authorization, approval, or scores`);
    }
    if (SECRET_KEYS.includes(key)) {
      throw new DeploymentProfileError("PROFILE_SECRET_REJECTED", `${path}.${key}: SECRET REF != SECRET VALUE`);
    }
    if (PERSONALITY_KEYS.includes(key)) {
      throw new DeploymentProfileError("PROFILE_PERSONALITY_REJECTED", `${path}.${key}: a profile carries no stored person`);
    }
    assertNoViolations(nested, `${path}.${key}`, seen);
  }
}

function assertCommon(value: Record<string, unknown>, path: string): {
  method: string;
  evidenceRefs: string[];
  provenance: string;
  observedAt: string;
} {
  if (!nonEmpty(value.method)) {
    throw new DeploymentProfileError("PROFILE_INVALID_INPUT", `${path}.method must be a non-empty string: every measurement names how it was observed`);
  }
  if (!Array.isArray(value.evidenceRefs) || value.evidenceRefs.some((r) => !nonEmpty(r))) {
    throw new DeploymentProfileError("PROFILE_INVALID_INPUT", `${path}.evidenceRefs must be an array of non-empty strings`);
  }
  if (!nonEmpty(value.provenance) || !nonEmpty(value.observedAt)) {
    throw new DeploymentProfileError("PROFILE_INVALID_INPUT", `${path}.provenance and observedAt are required: timestamps are caller-supplied, never invented`);
  }
  return {
    method: value.method,
    evidenceRefs: [...(value.evidenceRefs as string[])].sort(),
    provenance: value.provenance,
    observedAt: value.observedAt,
  };
}

function assertRate(value: unknown, path: string): RateMetric {
  if (!isPlainObject(value)) {
    throw new DeploymentProfileError("PROFILE_INVALID_INPUT", `${path} must be an object`);
  }
  if (typeof value.rate !== "number" || !Number.isFinite(value.rate) || value.rate < 0 || value.rate > 1) {
    throw new DeploymentProfileError("PROFILE_BAD_RATE", `${path}.rate must be a finite number within [0, 1]: never NaN, never clamped`);
  }
  if (!nonNegativeInt(value.observations)) {
    throw new DeploymentProfileError("PROFILE_BAD_COUNT", `${path}.observations must be a non-negative integer: a rate without support is dishonest`);
  }
  return { rate: value.rate, observations: value.observations, ...assertCommon(value, path) };
}

function assertAmount(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new DeploymentProfileError("PROFILE_BAD_COUNT", `${path} must be a finite non-negative number`);
  }
  return value;
}

function assertCost(value: unknown, path: string): CostMetric {
  if (!isPlainObject(value)) {
    throw new DeploymentProfileError("PROFILE_INVALID_INPUT", `${path} must be an object`);
  }
  if (!nonEmpty(value.unit)) {
    throw new DeploymentProfileError("PROFILE_INVALID_INPUT", `${path}.unit must be a caller-declared unit label: amounts are never converted`);
  }
  return {
    model: assertAmount(value.model, `${path}.model`),
    execution: assertAmount(value.execution, `${path}.execution`),
    review: assertAmount(value.review, `${path}.review`),
    unit: value.unit,
    ...assertCommon(value, path),
  };
}

function assertRisk(value: unknown, path: string): RiskMetric {
  if (!isPlainObject(value)) {
    throw new DeploymentProfileError("PROFILE_INVALID_INPUT", `${path} must be an object`);
  }
  if (!RISK_LEVELS.includes(value.level as RiskLevel)) {
    throw new DeploymentProfileError("PROFILE_INVALID_INPUT", `${path}.level must be one of ${RISK_LEVELS.join(", ")}: a level with reasons, never a fabricated probability`);
  }
  if (!nonEmpty(value.rationale)) {
    throw new DeploymentProfileError("PROFILE_INVALID_INPUT", `${path}.rationale must be non-empty: a level without reasons is decoration`);
  }
  return { level: value.level as RiskLevel, rationale: value.rationale, ...assertCommon(value, path) };
}

function assertCoverage(value: unknown, path: string): CoverageMetric {
  if (!isPlainObject(value)) {
    throw new DeploymentProfileError("PROFILE_INVALID_INPUT", `${path} must be an object`);
  }
  if (!nonNegativeInt(value.covered) || !nonNegativeInt(value.total)) {
    throw new DeploymentProfileError("PROFILE_BAD_COUNT", `${path}.covered and total must be non-negative integers`);
  }
  if ((value.covered as number) > (value.total as number)) {
    throw new DeploymentProfileError("PROFILE_BAD_COUNT", `${path}.covered cannot exceed total`);
  }
  return { covered: value.covered as number, total: value.total as number, ...assertCommon(value, path) };
}

function assertRecovery(value: unknown, path: string): RecoveryMetric {
  if (!isPlainObject(value)) {
    throw new DeploymentProfileError("PROFILE_INVALID_INPUT", `${path} must be an object`);
  }
  if (!nonNegativeInt(value.successes) || !nonNegativeInt(value.attempts)) {
    throw new DeploymentProfileError("PROFILE_BAD_COUNT", `${path}.successes and attempts must be non-negative integers`);
  }
  if ((value.successes as number) > (value.attempts as number)) {
    throw new DeploymentProfileError("PROFILE_BAD_COUNT", `${path}.successes cannot exceed attempts`);
  }
  return { successes: value.successes as number, attempts: value.attempts as number, ...assertCommon(value, path) };
}

const MEASUREMENT_FIELDS = ["dimension", "metric", "unavailableReason"] as const;

/**
 * Build one deployment qualification profile. Each of the seven dimensions
 * is independently MEASURED (with evidence) or UNAVAILABLE (with a reason).
 * Dimensions may arrive in any order and duplicates collapse only when
 * identical; the profile never blends, scores, or judges.
 */
export function buildProfile(input: unknown): DeploymentProfile {
  if (!isPlainObject(input)) {
    throw new DeploymentProfileError("PROFILE_INVALID_INPUT", "profile input must be an object");
  }
  assertNoViolations(input, "input", new Set());
  for (const key of Object.keys(input)) {
    if (!(PROFILE_FIELDS as readonly string[]).includes(key)) {
      throw new DeploymentProfileError("PROFILE_UNKNOWN_FIELD", `unknown profile field ${key}`);
    }
  }
  if (!nonEmpty(input.profileId)) {
    throw new DeploymentProfileError("PROFILE_INVALID_INPUT", "profileId must be a non-empty stable id");
  }
  if (!nonEmpty(input.subjectRef)) {
    throw new DeploymentProfileError("PROFILE_INVALID_INPUT", "subjectRef must be a non-empty reference: a profile without a subject is meaningless");
  }
  if (!nonEmpty(input.provenance)) {
    throw new DeploymentProfileError("PROFILE_INVALID_INPUT", "provenance must be a non-empty string");
  }
  if (!Array.isArray(input.measurements)) {
    throw new DeploymentProfileError("PROFILE_INVALID_INPUT", "measurements must be an array");
  }
  const seen = new Map<ProfileDimension, DimensionSlot>();
  for (const [index, raw] of (input.measurements as unknown[]).entries()) {
    if (!isPlainObject(raw)) {
      throw new DeploymentProfileError("PROFILE_INVALID_INPUT", `measurements[${index}] must be an object`);
    }
    assertNoViolations(raw, `measurements[${index}]`, new Set());
    for (const key of Object.keys(raw)) {
      if (!(MEASUREMENT_FIELDS as readonly string[]).includes(key)) {
        throw new DeploymentProfileError("PROFILE_UNKNOWN_FIELD", `unknown measurement field ${key}`);
      }
    }
    if (!PROFILE_DIMENSIONS.includes(raw.dimension as ProfileDimension)) {
      throw new DeploymentProfileError("PROFILE_UNKNOWN_DIMENSION", `dimension must be one of ${PROFILE_DIMENSIONS.join(", ")}: no eighth dimension is ever added here`);
    }
    const dimension = raw.dimension as ProfileDimension;
    const kind = DIMENSION_KINDS[dimension];
    let slot: DimensionSlot;
    if (raw.metric !== undefined) {
      if (raw.unavailableReason !== undefined) {
        throw new DeploymentProfileError("PROFILE_INVALID_INPUT", `measurements[${index}] carries both a metric and an unavailable reason: MEASURED and UNAVAILABLE are exclusive`);
      }
      const path = `measurements[${index}].metric`;
      const metric =
        kind === "rate" ? { kind: "rate" as const, metric: assertRate(raw.metric, path) }
        : kind === "cost" ? { kind: "cost" as const, metric: assertCost(raw.metric, path) }
        : kind === "risk" ? { kind: "risk" as const, metric: assertRisk(raw.metric, path) }
        : kind === "coverage" ? { kind: "coverage" as const, metric: assertCoverage(raw.metric, path) }
        : { kind: "recovery" as const, metric: assertRecovery(raw.metric, path) };
      slot = { dimension, state: "MEASURED", metric };
    } else {
      if (!nonEmpty(raw.unavailableReason)) {
        throw new DeploymentProfileError("PROFILE_INVALID_INPUT", `measurements[${index}] needs a metric or a non-empty unavailableReason: absence without a reason is not evidence`);
      }
      slot = { dimension, state: "UNAVAILABLE", unavailableReason: raw.unavailableReason as string };
    }
    const prior = seen.get(dimension);
    if (prior !== undefined) {
      if (JSON.stringify(prior) === JSON.stringify(slot)) continue;
      throw new DeploymentProfileError("PROFILE_INVALID_INPUT", `dimension ${dimension} recorded twice with different content`);
    }
    seen.set(dimension, slot);
  }
  // Every registered dimension appears exactly once: measured, or explicitly
  // unavailable. A missing dimension is not silently complete.
  const slots: DimensionSlot[] = PROFILE_DIMENSIONS.map(
    (dimension) => seen.get(dimension) ?? { dimension, state: "UNAVAILABLE", unavailableReason: "not observed" },
  );
  return {
    profileId: input.profileId,
    subjectRef: input.subjectRef,
    slots,
    provenance: input.provenance,
  };
}

/** Derived rates callers may read. Computed here, never asserted by callers. */
export function derivedRates(profile: DeploymentProfile): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const slot of profile.slots) {
    if (slot.state !== "MEASURED" || slot.metric === undefined) {
      out[slot.dimension] = null;
      continue;
    }
    const metric = slot.metric;
    if (metric.kind === "rate") out[slot.dimension] = metric.metric.rate;
    else if (metric.kind === "coverage") {
      out[slot.dimension] = metric.metric.total === 0 ? null : metric.metric.covered / metric.metric.total;
    } else if (metric.kind === "recovery") {
      out[slot.dimension] = metric.metric.attempts === 0 ? null : metric.metric.successes / metric.metric.attempts;
    } else {
      out[slot.dimension] = null;
    }
  }
  return out;
}

/** Measured-dimension count. Bookkeeping tally, never a quality score. */
export function measuredCount(profile: DeploymentProfile): number {
  return profile.slots.filter((s) => s.state === "MEASURED").length;
}
