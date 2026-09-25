/**
 * REQ-p16-autonomy-readiness: repository autonomy-readiness dimensions.
 *
 * Machine-verifiable, per-dimension readiness for automated work in a
 * repository: can a bounded agent reliably build, test, observe and
 * recover here? Dimension-specific statuses only — NO universal score,
 * NO percentage, NO stars, NO opaque global verdict anywhere in this
 * module (tested).
 *
 * Boundaries (structural):
 * - Autonomy readiness != five-star capability maturity (quality).
 * - Autonomy readiness != steward PR-readiness (governance) or public
 *   release readiness (product). Separate docs, separate consumers.
 * - PASS requires machine-observed evidence recorded on the dimension;
 *   capability-present is never enough (DECLARED != VERIFIED).
 * - Assessments bind repository + commit + environment + timestamp; a
 *   new commit invalidates currentness (never silently carried over).
 */

export type ReadinessDimension =
  | "WORKTREE_STATE"
  | "BUILD"
  | "LINT"
  | "TYPECHECK"
  | "TEST_DISCOVERY"
  | "TEST_EXECUTION"
  | "REPRO_ENV"
  | "SANDBOX"
  | "DOC_FRESHNESS"
  | "OBSERVABILITY"
  | "SECRET_SCAN"
  | "DEPENDENCY_SCAN"
  | "ROLLBACK"
  | "RECOVERY";

export const READINESS_DIMENSIONS: readonly ReadinessDimension[] = [
  "WORKTREE_STATE",
  "BUILD",
  "LINT",
  "TYPECHECK",
  "TEST_DISCOVERY",
  "TEST_EXECUTION",
  "REPRO_ENV",
  "SANDBOX",
  "DOC_FRESHNESS",
  "OBSERVABILITY",
  "SECRET_SCAN",
  "DEPENDENCY_SCAN",
  "ROLLBACK",
  "RECOVERY",
];

export type ReadinessStatus =
  | "PASS"
  | "FAIL"
  | "BLOCKED"
  | "NOT_APPLICABLE"
  | "UNAVAILABLE"
  | "MISSING_EVIDENCE"
  | "STALE"
  | "HUMAN_REQUIRED";

export const READINESS_STATUSES: readonly ReadinessStatus[] = [
  "PASS",
  "FAIL",
  "BLOCKED",
  "NOT_APPLICABLE",
  "UNAVAILABLE",
  "MISSING_EVIDENCE",
  "STALE",
  "HUMAN_REQUIRED",
];

export interface DimensionResult {
  dimension: ReadinessDimension;
  status: ReadinessStatus;
  evidenceRefs: string[];
  reason: string;
  command?: string;
  observedValue?: string;
}

export interface ReadinessAssessment {
  assessmentId: string;
  repositoryId: string;
  commitRef: string;
  environment: string;
  assessedAt: string;
  dimensions: DimensionResult[];
}

export type ReadinessProblem =
  | "assessment-id"
  | "repository-id"
  | "commit-ref"
  | "environment"
  | "assessed-at"
  | "dimension-unknown"
  | "dimension-duplicate"
  | "status-unknown"
  | "pass-without-evidence"
  | "reason-required";

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIso(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(Date.parse(value));
}

/**
 * Validate an assessment. PASS dimensions must carry evidenceRefs
 * (machine-observed); every dimension needs a reason. Empty =
 * registrable.
 */
export function validateReadiness(assessment: ReadinessAssessment): ReadinessProblem[] {
  const problems: ReadinessProblem[] = [];
  if (!nonEmpty(assessment.assessmentId)) problems.push("assessment-id");
  if (!nonEmpty(assessment.repositoryId)) problems.push("repository-id");
  if (!nonEmpty(assessment.commitRef)) problems.push("commit-ref");
  if (!nonEmpty(assessment.environment)) problems.push("environment");
  if (!nonEmpty(assessment.assessedAt) || !isIso(assessment.assessedAt)) problems.push("assessed-at");
  const seen = new Set<ReadinessDimension>();
  for (const dim of assessment.dimensions ?? []) {
    if (!READINESS_DIMENSIONS.includes(dim?.dimension)) {
      problems.push("dimension-unknown");
      continue;
    }
    if (seen.has(dim.dimension)) problems.push("dimension-duplicate");
    seen.add(dim.dimension);
    if (!READINESS_STATUSES.includes(dim?.status)) problems.push("status-unknown");
    if (!nonEmpty(dim?.reason)) problems.push("reason-required");
    if (dim?.status === "PASS" && (!Array.isArray(dim.evidenceRefs) || dim.evidenceRefs.length === 0)) {
      problems.push("pass-without-evidence");
    }
  }
  return [...new Set(problems)].sort() as ReadinessProblem[];
}

/** Dimensions needing attention (anything not PASS or NOT_APPLICABLE). Informational list, not a score. */
export function attentionNeeded(assessment: ReadinessAssessment): DimensionResult[] {
  return assessment.dimensions
    .filter((d) => d.status !== "PASS" && d.status !== "NOT_APPLICABLE")
    .sort((a, b) => (a.dimension < b.dimension ? -1 : 1));
}

/** An assessment is current only for the exact commit it was taken on. */
export function isCurrentFor(assessment: ReadinessAssessment, commitRef: string): boolean {
  return assessment.commitRef === commitRef;
}

/** Deterministic canonical serialization (durations excluded by construction). */
export function canonicalReadiness(assessment: ReadinessAssessment): string {
  const ordered = {
    ...assessment,
    dimensions: [...assessment.dimensions].sort((a, b) => (a.dimension < b.dimension ? -1 : 1)),
  };
  return JSON.stringify(ordered);
}
