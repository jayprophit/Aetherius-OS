import type { BenchmarkRecord } from "../providers/benchmarks";

/**
 * REQ-p19-benchmark-freshness: benchmark freshness and saturation policy
 * with dataset version deprecation.
 *
 * The registered requirement is the scope authority:
 *
 *   "Version/date/freshness/saturation tracking with dataset version
 *    deprecation for benchmarks; timestamps exist, lifecycle policy does
 *    not."
 *
 * That last clause is the gap, precisely. `BenchmarkRecord.timestamp`
 * (epoch ms) has existed all along, and `DatasetRegistry` already keys
 * versions as `<id>@<version>`; what does not exist anywhere in this
 * repository is a LIFECYCLE POLICY over those versions. There is no
 * freshness rule, no saturation rule and no deprecation mechanism. The
 * `ttlMs` fields in src/genesis/workers.ts and src/placement/placement.ts are
 * worker leases and placement leases, unrelated to benchmark age, and are
 * not reused or conflated.
 *
 * The policy DESCRIBES and QUALIFIES. It never deletes a dataset, never
 * removes a historical result, and never invents an observation.
 *
 * Distinctions this module exists to hold:
 *
 *   TIMESTAMP EXISTS   != FRESHNESS POLICY EXISTS
 *   NO OBSERVATION     != FRESH
 *   UNKNOWN            != FRESH and UNKNOWN != STALE
 *   FRESHNESS          != SATURATION
 *   SATURATION         != QUALITY
 *   DEPRECATED         != DELETED
 *   DEPRECATION        != INVALIDATION OF HISTORY
 *   NEW EVALUATION     != HISTORICAL RESULT
 *   DATASET NAME       != DATASET VERSION
 *   REPEATED MEASUREMENT != ADDED INFORMATION
 */

/** Dataset version identity, matching the DatasetRegistry key convention. */
export function datasetVersionRef(datasetId: string, version: string): string {
  return `${datasetId}@${version}`;
}

/**
 * Freshness states. `FRESHNESS_UNKNOWN` exists because a version with no
 * observation timestamp is neither fresh nor stale: UNKNOWN != FRESH, and
 * UNKNOWN != STALE. Treating "unmeasured" as "fresh" would silently
 * qualify a benchmark nobody has ever run.
 */
export const FRESHNESS_STATES = ["FRESH", "AGING", "STALE", "FRESHNESS_UNKNOWN"] as const;
export type FreshnessState = (typeof FRESHNESS_STATES)[number];

/**
 * Saturation states, driven by a REAL COUNT of recorded observations of
 * that exact version. SATURATION != QUALITY: a saturated benchmark is not a
 * bad benchmark, it is one that has been measured enough times that further
 * measurement adds little. Nothing here scores quality.
 */
export const SATURATION_STATES = [
  "UNSATURATED",
  "APPROACHING_SATURATION",
  "SATURATED",
  "SATURATION_UNKNOWN",
] as const;
export type SaturationState = (typeof SATURATION_STATES)[number];

/** Version lifecycle. DEPRECATED stops NEW evaluation; it never deletes. */
export const VERSION_LIFECYCLE_STATES = ["ACTIVE", "DEPRECATED"] as const;
export type VersionLifecycleState = (typeof VERSION_LIFECYCLE_STATES)[number];

export interface FreshnessSaturationPolicy {
  /** Age past which a version is STALE. Required, positive integer ms. */
  maxAgeMs: number;
  /** Age past which a version is AGING (but not yet STALE). */
  agingMs: number;
  /** Observation count at or above which a version is SATURATED. */
  saturationObservations: number;
  /** Observation count at or above which a version is APPROACHING_SATURATION. */
  approachingObservations: number;
}

export type FreshnessProblem =
  | "policy"
  | "dataset-id"
  | "version"
  | "now-ms"
  | "records"
  | "deprecation"
  | "deprecated-at"
  | "reason"
  | "provenance"
  | "unknown-field";

const CONTRIBUTION_PROVENANCE = "p19-benchmark-freshness";
const ALLOWED_ASSESS_KEYS: ReadonlySet<string> = new Set([
  "datasetId",
  "version",
  "policy",
  "records",
  "nowMs",
  "provenance",
]);
const ALLOWED_DEPRECATION_KEYS: ReadonlySet<string> = new Set([
  "datasetId",
  "version",
  "deprecatedAtMs",
  "reason",
  "replacementRef",
  "provenance",
]);
const VERSION_RE = /^\d+\.\d+\.\d+$/;

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function positiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Real comparator (never a factory): a factory passed to sort yields NaN. */
function compareDeprecations(a: DeprecationRecord, b: DeprecationRecord): number {
  return (
    compareStrings(a.datasetId, b.datasetId) ||
    compareStrings(a.version, b.version) ||
    a.deprecatedAtMs - b.deprecatedAtMs
  );
}

function validPolicy(policy: FreshnessSaturationPolicy): boolean {
  if (!policy || !positiveInt(policy.maxAgeMs) || !positiveInt(policy.agingMs)) return false;
  if (!positiveInt(policy.saturationObservations) || !positiveInt(policy.approachingObservations)) return false;
  // A window where AGING begins after STALE would make AGING unreachable.
  return policy.agingMs < policy.maxAgeMs && policy.approachingObservations < policy.saturationObservations;
}

export interface AssessmentRequest {
  datasetId: string;
  version: string;
  policy: FreshnessSaturationPolicy;
  /**
   * Existing benchmark records. A record is attributed to this version ONLY
   * when its `dataset` field is the exact `<id>@<version>` ref, because
   * `BenchmarkRecord.dataset` is optional free text and cannot be guessed
   * into a version attribution.
   */
  records: readonly BenchmarkRecord[];
  /** Epoch ms supplied by the caller. This module never calls a clock. */
  nowMs: number;
  provenance?: string;
}

export interface DeprecationRecord {
  datasetId: string;
  version: string;
  /** Epoch ms supplied by the caller. */
  deprecatedAtMs: number;
  reason: string;
  /** Optional ref to the version that supersedes this one. */
  replacementRef?: string;
  provenance: string;
}

export interface VersionAssessment {
  datasetId: string;
  version: string;
  datasetVersionRef: string;
  lifecycle: VersionLifecycleState;
  freshness: FreshnessState;
  /** Age in ms, or null when no observation timestamp was available. */
  ageMs: number | null;
  /** Real count of records attributed to this exact version. */
  observations: number;
  saturation: SaturationState;
  /** True only for a DEPRECATED version. Freshness and saturation qualify; they never block. */
  newEvaluationBlocked: boolean;
  /** Human-readable qualifications, sorted. Never a score. */
  qualifications: string[];
  /** Deprecation record when deprecated, so history is preserved verbatim. */
  deprecation?: DeprecationRecord;
  provenance: string;
  assessedAtMs: number;
}

function validateAssessmentRequest(request: AssessmentRequest): FreshnessProblem[] {
  const problems: FreshnessProblem[] = [];
  for (const key of Object.keys(request ?? {})) {
    if (!ALLOWED_ASSESS_KEYS.has(key)) problems.push("unknown-field");
  }
  if (!nonEmpty(request?.datasetId)) problems.push("dataset-id");
  if (!nonEmpty(request?.version) || !VERSION_RE.test(request.version)) problems.push("version");
  if (!validPolicy(request?.policy)) problems.push("policy");
  if (!Number.isFinite(request?.nowMs) || request.nowMs < 0) problems.push("now-ms");
  if (!Array.isArray(request?.records)) problems.push("records");
  if (!nonEmpty(request?.provenance ?? CONTRIBUTION_PROVENANCE)) problems.push("provenance");
  return [...new Set(problems)].sort() as FreshnessProblem[];
}

/**
 * Assess one dataset version's freshness and saturation.
 *
 * Freshness UNKNOWN and Saturation UNKNOWN are real, reportable states, not
 * zero and not defaults: a version nobody has measured is not fresh.
 */
export function assessDatasetVersion(
  request: AssessmentRequest,
  deprecations: readonly DeprecationRecord[] = [],
): VersionAssessment {
  const problems = validateAssessmentRequest(request);
  if (problems.length > 0) {
    throw new Error(`invalid freshness assessment ${String(request?.datasetId)}: ${problems.join(",")}`);
  }
  const ref = datasetVersionRef(request.datasetId, request.version);
  const matched = request.records.filter((r) => r.dataset === ref);
  const observations = matched.length;
  const timestamps = matched
    .map((r) => r.timestamp)
    .filter((t): t is number => typeof t === "number" && Number.isFinite(t));

  const qualifications: string[] = [];
  let ageMs: number | null = null;
  let freshness: FreshnessState;
  if (timestamps.length === 0) {
    // No observation: UNKNOWN, never FRESH.
    freshness = "FRESHNESS_UNKNOWN";
    qualifications.push("no observation timestamp for this version; freshness is unknown, not fresh");
  } else {
    const newest = Math.max(...timestamps);
    ageMs = request.nowMs - newest;
    if (ageMs < 0) {
      // A timestamp in the future relative to the supplied clock is not
      // credible evidence of freshness, so it is unknown rather than fresh.
      freshness = "FRESHNESS_UNKNOWN";
      qualifications.push("observation timestamp is later than the supplied now; freshness is unknown");
      ageMs = null;
    } else if (ageMs > request.policy.maxAgeMs) {
      freshness = "STALE";
      qualifications.push(`newest observation is ${ageMs}ms old, beyond the ${request.policy.maxAgeMs}ms maximum age`);
    } else if (ageMs > request.policy.agingMs) {
      freshness = "AGING";
      qualifications.push(`newest observation is ${ageMs}ms old, past the ${request.policy.agingMs}ms aging threshold`);
    } else {
      freshness = "FRESH";
    }
  }

  let saturation: SaturationState;
  if (observations === 0) {
    saturation = "SATURATION_UNKNOWN";
    qualifications.push("no observations recorded; saturation is unknown, not zero");
  } else if (observations >= request.policy.saturationObservations) {
    saturation = "SATURATED";
    qualifications.push(
      `${observations} observation(s) at or above the ${request.policy.saturationObservations} saturation threshold; further measurement adds little information`,
    );
  } else if (observations >= request.policy.approachingObservations) {
    saturation = "APPROACHING_SATURATION";
    qualifications.push(`${observations} observation(s) approaching the saturation threshold`);
  } else {
    saturation = "UNSATURATED";
  }

  const deprecation = deprecations.find(
    (d) => d.datasetId === request.datasetId && d.version === request.version,
  );
  if (deprecation) {
    qualifications.push(`version is DEPRECATED: ${deprecation.reason}`);
  }

  return {
    datasetId: request.datasetId,
    version: request.version,
    datasetVersionRef: ref,
    lifecycle: deprecation ? "DEPRECATED" : "ACTIVE",
    freshness,
    ageMs,
    observations,
    saturation,
    newEvaluationBlocked: deprecation !== undefined,
    qualifications: qualifications.sort(compareStrings),
    ...(deprecation === undefined ? {} : { deprecation }),
    provenance: request.provenance ?? CONTRIBUTION_PROVENANCE,
    assessedAtMs: request.nowMs,
  };
}

export type DeprecationProblem = FreshnessProblem;

/**
 * Record a deprecation. Deprecation is APPEND-ONLY and idempotent:
 *
 *  - the same version deprecated again with identical content -> identical
 *  - the same version deprecated again with DIFFERENT content -> conflict
 *  - deprecating a different version -> a new retained record
 *
 * Deprecating never removes a dataset or a historical result.
 */
export function deprecateDatasetVersion(
  deprecations: readonly DeprecationRecord[],
  input: {
    datasetId: string;
    version: string;
    deprecatedAtMs: number;
    reason: string;
    replacementRef?: string;
    provenance?: string;
  },
): {
  deprecations: DeprecationRecord[];
  outcome: "recorded" | "identical" | "conflict" | "rejected";
  reason?: string;
} {
  const problems: DeprecationProblem[] = [];
  for (const key of Object.keys(input ?? {})) {
    if (!ALLOWED_DEPRECATION_KEYS.has(key)) problems.push("unknown-field");
  }
  if (!nonEmpty(input?.datasetId)) problems.push("dataset-id");
  if (!nonEmpty(input?.version) || !VERSION_RE.test(input.version)) problems.push("version");
  if (!Number.isFinite(input?.deprecatedAtMs) || input.deprecatedAtMs < 0) problems.push("deprecated-at");
  if (!nonEmpty(input?.reason)) problems.push("reason");
  if (input?.replacementRef !== undefined && !nonEmpty(input.replacementRef)) problems.push("provenance");
  if (!nonEmpty(input?.provenance ?? CONTRIBUTION_PROVENANCE)) problems.push("provenance");
  if (problems.length > 0) {
    return {
      deprecations: [...deprecations],
      outcome: "rejected",
      reason: `invalid deprecation: ${[...new Set(problems)].sort().join(",")}`,
    };
  }

  const record: DeprecationRecord = {
    datasetId: input.datasetId,
    version: input.version,
    deprecatedAtMs: input.deprecatedAtMs,
    reason: input.reason,
    ...(input.replacementRef === undefined ? {} : { replacementRef: input.replacementRef }),
    provenance: input.provenance ?? CONTRIBUTION_PROVENANCE,
  };
  const existing = deprecations.filter(
    (d) => d.datasetId === record.datasetId && d.version === record.version,
  );
  if (existing.length > 0) {
    if (JSON.stringify(existing[0]) === JSON.stringify(record)) {
      return { deprecations: [...deprecations], outcome: "identical" };
    }
    // Deprecation history is evidence: a conflicting re-deprecation is a
    // conflict, never a silent overwrite.
    return {
      deprecations: [...deprecations],
      outcome: "conflict",
      reason: `${datasetVersionRef(record.datasetId, record.version)} already deprecated with different content; deprecation history is immutable`,
    };
  }
  return { deprecations: [...deprecations, record].sort(compareDeprecations), outcome: "recorded" };
}

/** Deterministically ordered deprecation history. Never deleted. */
export function listDeprecations(deprecations: readonly DeprecationRecord[]): DeprecationRecord[] {
  return [...deprecations].sort(compareDeprecations);
}

export interface FreshnessQuery {
  datasetId?: string;
  lifecycle?: VersionLifecycleState;
  freshness?: FreshnessState;
  saturation?: SaturationState;
  /** Only versions still open to new evaluation. */
  usableOnly?: boolean;
}

function matches(assessment: VersionAssessment, query: FreshnessQuery): boolean {
  if (query.datasetId !== undefined && assessment.datasetId !== query.datasetId) return false;
  if (query.lifecycle !== undefined && assessment.lifecycle !== query.lifecycle) return false;
  if (query.freshness !== undefined && assessment.freshness !== query.freshness) return false;
  if (query.saturation !== undefined && assessment.saturation !== query.saturation) return false;
  if (query.usableOnly === true && assessment.newEvaluationBlocked) return false;
  return true;
}

/** Query assessments deterministically, filtered by explicit dimensions. */
export function queryFreshness(
  assessments: readonly VersionAssessment[],
  query: FreshnessQuery = {},
): VersionAssessment[] {
  return assessments
    .filter((a) => matches(a, query))
    .sort(
      (a, b) => compareStrings(a.datasetId, b.datasetId) || compareStrings(a.version, b.version),
    );
}
