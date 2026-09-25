import { StateError } from "../state/types";
import type { OwnedStore } from "../state/store";
import type { StateEnvelope } from "../state/types";
import { reportStateId } from "./reports";
import type { ReadinessVerdict, ReviewTarget, StewardReport } from "./types";

/**
 * P16 change cohort review batches.
 *
 * Per-target steward reports exist; cohorts do not. A cohort is a named
 * batch of change targets whose existing readiness verdicts are rolled up
 * into one advisory summary plus a deterministic review-batch plan.
 *
 * Verdicts are REUSED from stored StewardReport.readiness, never
 * re-derived from findings: one verdict vocabulary, one producer. A
 * member with no stored report is "unknown", never assumed ready.
 *
 * Advisory only, like every steward surface: rollups carry
 * merge_authority: false and this module exposes no grant, merge or
 * approval capability. Granting is owner-gated and does not exist here.
 */

const COHORT_KIND = "steward.cohort";
const COHORT_SCHEMA = 1;
const COHORT_PROVENANCE = "p16-change-cohort-review";
const TARGET_ID_RE = /^[a-z0-9][a-z0-9_-]*$/i;
const KINDS: ReadonlySet<ReviewTarget["kind"]> = new Set(["issue", "pull"]);

/**
 * "unknown" is a real cohort verdict: a member whose report is absent has
 * no known readiness, and a cohort containing one cannot be called ready.
 */
export type CohortVerdict = ReadinessVerdict | "unknown";

export interface CohortMember {
  target: ReviewTarget;
  reportId: string;
  /** "unknown" when no stored report covers this member. */
  verdict: CohortVerdict;
  blockingCount: number;
  warningCount: number;
}

export interface ReviewBatch {
  index: number;
  memberIds: string[];
}

export interface CohortReadiness {
  verdict: CohortVerdict;
  readyCount: number;
  notReadyCount: number;
  unknownCount: number;
  blockingCount: number;
  warningCount: number;
  reasons: string[];
  /** Always false. A cohort rollup is advisory; it never carries authority. */
  merge_authority: false;
}

export interface CohortReview {
  cohortId: string;
  members: CohortMember[];
  readiness: CohortReadiness;
  batches: ReviewBatch[];
  /** ISO timestamp supplied by the caller; never invented here. */
  generatedAt: string;
  provenance: string;
}

export type CohortProblem =
  | "cohort-id"
  | "target"
  | "duplicate-targets"
  | "target-mismatch"
  | "report-authority"
  | "batch-size"
  | "generated-at"
  | "provenance";

export interface CohortInput {
  cohortId: string;
  targets: readonly ReviewTarget[];
  reports: readonly StewardReport[];
  maxBatchSize?: number;
  generatedAt: string;
  provenance?: string;
}

/** Durable state id, e.g. "steward-cohort-release-train". */
export function cohortStateId(cohortId: string): string {
  return `steward-cohort-${cohortId}`;
}

function validTarget(target: ReviewTarget | undefined): boolean {
  return (
    !!target &&
    typeof target.repo === "string" &&
    TARGET_ID_RE.test(target.repo) &&
    KINDS.has(target.kind) &&
    Number.isInteger(target.number) &&
    target.number >= 1
  );
}

function sameTarget(a: ReviewTarget, b: ReviewTarget): boolean {
  return a.repo === b.repo && a.kind === b.kind && a.number === b.number;
}

/**
 * Validate a cohort before any state is touched. Reports are checked for
 * target drift and for a readiness that claims authority it can never
 * hold: a report asserting merge_authority is hostile input, not a fact.
 */
export function validateCohort(input: CohortInput): CohortProblem[] {
  const problems: CohortProblem[] = [];
  if (typeof input.cohortId !== "string" || !TARGET_ID_RE.test(input.cohortId)) {
    problems.push("cohort-id");
  }
  if (!Array.isArray(input.targets) || input.targets.length === 0) {
    problems.push("target");
  } else if (!input.targets.every(validTarget)) {
    problems.push("target");
  }
  const ids = input.targets.map((t) => reportStateId(t));
  if (new Set(ids).size !== ids.length) {
    problems.push("duplicate-targets");
  }
  if (input.maxBatchSize !== undefined &&
      (!Number.isInteger(input.maxBatchSize) || input.maxBatchSize < 1)) {
    problems.push("batch-size");
  }
  const provenance = input.provenance ?? COHORT_PROVENANCE;
  if (typeof provenance !== "string" || provenance.trim().length === 0) {
    problems.push("provenance");
  }
  if (typeof input.generatedAt !== "string" || input.generatedAt.trim().length === 0) {
    problems.push("generated-at");
  }
  for (const report of input.reports) {
    if (report.readiness?.merge_authority !== false) {
      problems.push("report-authority");
    }
    const claimed = input.targets.find((t) => reportStateId(t) === report.id);
    if (claimed && !sameTarget(claimed, report.target)) {
      problems.push("target-mismatch");
    }
  }
  return [...new Set(problems)].sort() as CohortProblem[];
}

/** Review order: unresolved and blocking work first, then ready, id-stable. */
const TRIAGE_RANK: Readonly<Record<CohortVerdict, number>> = { not_ready: 0, unknown: 1, ready: 2 };

/**
 * Split ordered members into fixed-size batches. Deterministic for a
 * given member set: triage rank first, report id as tie-break, so the
 * same cohort always yields the same plan.
 */
export function planCohortBatches(members: readonly CohortMember[], maxBatchSize: number): ReviewBatch[] {
  const ordered = [...members].sort(
    (a, b) => TRIAGE_RANK[a.verdict] - TRIAGE_RANK[b.verdict] || (a.reportId < b.reportId ? -1 : 1),
  );
  const batches: ReviewBatch[] = [];
  for (let i = 0; i < ordered.length; i += maxBatchSize) {
    batches.push({ index: batches.length, memberIds: ordered.slice(i, i + maxBatchSize).map((m) => m.reportId) });
  }
  return batches;
}

/**
 * Roll a cohort up from stored per-target reports. Reuses each report's
 * readiness verbatim; absent reports are reported as unknown rather than
 * dropped or optimistically counted as ready.
 */
export function summarizeCohort(input: CohortInput): CohortReview {
  const problems = validateCohort(input);
  if (problems.length > 0) {
    throw new Error(`invalid cohort ${String(input.cohortId)}: ${problems.join(",")}`);
  }
  const byId = new Map<string, StewardReport>();
  for (const report of input.reports) {
    byId.set(report.id, report);
  }
  const members: CohortMember[] = input.targets.map((target) => {
    const reportId = reportStateId(target);
    const report = byId.get(reportId);
    if (!report) {
      return { target, reportId, verdict: "unknown", blockingCount: 0, warningCount: 0 };
    }
    return {
      target,
      reportId,
      verdict: report.readiness.verdict,
      blockingCount: report.readiness.blockingCount,
      warningCount: report.readiness.warningCount,
    };
  });
  const ready = members.filter((m) => m.verdict === "ready");
  const notReady = members.filter((m) => m.verdict === "not_ready");
  const unknown = members.filter((m) => m.verdict === "unknown");
  // A single blocking member blocks the cohort; an unreported member makes
  // the cohort unknown, which is never upgraded to ready by omission.
  const verdict: CohortVerdict =
    notReady.length > 0 ? "not_ready" : unknown.length > 0 ? "unknown" : "ready";
  const reasons = [
    ...notReady.map((m) => `${m.reportId}: not_ready`),
    ...unknown.map((m) => `${m.reportId}: no stored report`),
    ...(notReady.length === 0 && unknown.length === 0 ? ["every member reported ready"] : []),
  ];
  return {
    cohortId: input.cohortId,
    members,
    readiness: {
      verdict,
      readyCount: ready.length,
      notReadyCount: notReady.length,
      unknownCount: unknown.length,
      blockingCount: members.reduce((sum, m) => sum + m.blockingCount, 0),
      warningCount: members.reduce((sum, m) => sum + m.warningCount, 0),
      reasons,
      merge_authority: false,
    },
    batches: planCohortBatches(members, input.maxBatchSize ?? members.length),
    generatedAt: input.generatedAt,
    provenance: input.provenance ?? COHORT_PROVENANCE,
  };
}

/**
 * Durable cohort reviews over the shared owned-state store. Same
 * append-by-revision discipline as StewardReportStore: integrity hashes,
 * optimistic concurrency, createdAt preserved across revisions, and
 * cohort-id drift rejected on update.
 */
export class CohortReviewStore {
  private readonly store: OwnedStore;
  private readonly owner: string;

  constructor(store: OwnedStore, owner: string) {
    this.store = store;
    this.owner = owner;
  }

  save(
    review: CohortReview,
    options: { actor?: string; source?: string } = {},
  ): CohortReview {
    const problems = validateCohort({
      cohortId: review.cohortId,
      targets: review.members.map((m) => m.target),
      reports: [],
      generatedAt: review.generatedAt,
      provenance: review.provenance,
    });
    if (problems.length > 0) {
      throw new StateError("STATE_VALIDATION_FAILED", `invalid cohort review ${review.cohortId}: ${problems.join(",")}`);
    }
    const id = cohortStateId(review.cohortId);
    let recordVersion = 1;
    let createdAt = review.generatedAt;
    if (this.store.exists(id)) {
      const current = this.store.load<CohortReview>(id);
      if (current.payload.cohortId !== review.cohortId) {
        throw new StateError("STATE_VALIDATION_FAILED", `cohort ${id} id mismatch on update`);
      }
      recordVersion = current.recordVersion + 1;
      createdAt = current.createdAt;
    }
    const envelope: StateEnvelope<CohortReview> = {
      id,
      kind: COHORT_KIND,
      schemaVersion: COHORT_SCHEMA,
      recordVersion,
      createdAt,
      updatedAt: review.generatedAt,
      owner: this.owner,
      provenance: COHORT_PROVENANCE,
      sensitivity: "USER",
      integrity: "",
      payload: review,
    };
    this.store.save(envelope, {
      expectedRecordVersion: recordVersion === 1 ? undefined : recordVersion - 1,
      causedBy: { actor: options.actor ?? "steward", source: options.source ?? "steward.cohort-store" },
    });
    return review;
  }

  load(id: string): CohortReview {
    const envelope = this.store.load<CohortReview>(id);
    if (envelope.kind !== COHORT_KIND) {
      throw new StateError("STATE_MALFORMED", `record ${id} is not a cohort review`);
    }
    return envelope.payload;
  }

  listIds(prefix = "steward-cohort-"): string[] {
    const withList = this.store as OwnedStore & { listIds?: (p?: string) => string[] };
    if (typeof withList.listIds === "function") {
      return withList.listIds(prefix);
    }
    return [];
  }
}
