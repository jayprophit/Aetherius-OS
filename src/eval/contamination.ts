import { sha256HexBytes } from "../runners/sync";
import type { ClaimSource } from "../providers/trainingLifecycle";
import { DATASET_SPLITS } from "./evaluation";
import type { DatasetSplit } from "./evaluation";

/**
 * REQ-p19-benchmark-contamination: benchmark contamination guards.
 *
 * The registered requirement is the scope authority:
 *
 *   "Train/valid/internal held-out/OOD/adversarial/temporal/private-sealed
 *    partitions with contamination detection; listed as gap, never
 *    implemented."
 *
 * THE PARTITIONS ALREADY EXIST. `DatasetSplit` in src/eval/evaluation.ts is
 * exactly train / validation / held-out / out-of-domain / adversarial /
 * temporal / sealed, which is the requirement's seven partitions under
 * different spellings. They are REUSED here. `BenchmarkPartition2` was not
 * created, and this module adds no partition vocabulary of its own.
 *
 * The real gap the requirement names is CONTAMINATION DETECTION. That is
 * what this module adds: an assessment that records what is known about a
 * benchmark/subject pair's exposure, with evidence, and refuses to
 * overstate what it does not know.
 *
 * Distinctions this module exists to hold:
 *
 *   BENCHMARK SEEN          != BENCHMARK MEMORIZED
 *   HIGH SCORE              != CONTAMINATION PROOF
 *   LOW SCORE               != CLEAN BENCHMARK PROOF
 *   TRAINING EXPOSURE       != INTENTIONAL CHEATING
 *   PUBLIC DATASET          != KNOWN TRAINING EXPOSURE
 *   NO KNOWN EXPOSURE       != PROVEN CLEAN
 *   CONTAMINATION RISK      != CONTAMINATION FACT
 *   SEALED LABEL            != PROVEN SEALED HISTORY
 *   MODEL CONTAMINATION     != AGENT/SYSTEM CONTAMINATION
 *   SCORER KNOWLEDGE        != TEST SUBJECT CONTEXT
 *   FINGERPRINT NO-MATCH    != PROOF OF NO EXPOSURE
 *   DATASET NAME            != DATASET VERSION
 *   SEALED BENCHMARK        != CLEAN-ROOM EXECUTION
 *
 * It is a guard, not a scorer: it computes no task-quality score, replaces
 * no Scorer, and creates no second dataset registry, benchmark registry or
 * evidence graph. It contributes evaluation-INTEGRITY evidence only.
 */

/**
 * Contamination status. Deliberately NOT a boolean: `contaminated: true` and
 * `contaminated: false` both overstate what exposure evidence can support.
 *
 * Note there is no CLEAN and no TRUE/FALSE member. Absence of disclosure is
 * UNKNOWN, never CLEAN: `UNKNOWN != FALSE`.
 *
 * The registered requirement defines no status vocabulary, so this set exists
 * to encode exactly the distinctions above and nothing wider.
 */
export const CONTAMINATION_STATUSES = [
  "KNOWN_EXPOSED",
  "SUSPECTED",
  "NO_KNOWN_EXPOSURE",
  "UNKNOWN",
  "SEALED_BY_POLICY",
] as const;
export type ContaminationStatus = (typeof CONTAMINATION_STATUSES)[number];

/**
 * What a partition LABEL alone establishes.
 *
 * train/validation are visible during development by design: that is
 * expected exposure and affects interpretation, it is not a defect.
 * held-out/OOD/adversarial/temporal are INTENDED independent, which is an
 * intent and not a proof. sealed is a handling POLICY label, which says
 * nothing about actual history: SEALED LABEL != PROVEN SEALED HISTORY.
 */
export type PartitionExpectation = "EXPECTED_EXPOSURE" | "INTENDED_INDEPENDENT" | "POLICY_LABEL_ONLY";

const EXPECTED_EXPOSURE_PARTITIONS: ReadonlySet<DatasetSplit> = new Set<DatasetSplit>(["train", "validation"]);
const POLICY_LABEL_PARTITIONS: ReadonlySet<DatasetSplit> = new Set<DatasetSplit>(["sealed"]);

/** What the partition label itself establishes. Never a contamination verdict. */
export function partitionExpectation(partition: DatasetSplit): PartitionExpectation {
  if (EXPECTED_EXPOSURE_PARTITIONS.has(partition)) return "EXPECTED_EXPOSURE";
  if (POLICY_LABEL_PARTITIONS.has(partition)) return "POLICY_LABEL_ONLY";
  return "INTENDED_INDEPENDENT";
}

/**
 * Normalization applied before fingerprinting. Documented exactly, because
 * NORMALIZATION != SEMANTIC EQUIVALENCE: over-normalizing collapses distinct
 * benchmark items and manufactures false overlap.
 *
 * Applied: UTF-8 encode, CRLF and lone CR to LF, trailing whitespace removed
 * per line, leading/trailing whitespace of the whole item removed.
 *
 * NOT applied: case folding, punctuation stripping, Unicode normalization,
 * whitespace collapsing inside a line, or any semantic/synonym handling.
 * Two items differing only in case or punctuation fingerprint DIFFERENT,
 * which is the conservative direction: a missed match is honest, a false
 * match is not.
 */
export function normalizeForFingerprint(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .trim();
}

/** Deterministic sha256 fingerprint of one benchmark item. */
export function fingerprintItem(text: string): string {
  return sha256HexBytes(new TextEncoder().encode(normalizeForFingerprint(text)));
}

/** Deterministic fingerprints for many items, in input order. */
export function fingerprintItems(items: readonly string[]): string[] {
  return items.map(fingerprintItem);
}

export interface ContaminationAssessment {
  /** "bcont-<slug>". Distinct from dataset, model, run and evidence ids. */
  assessmentId: string;
  benchmarkRef: string;
  /** Required: DATASET NAME != DATASET VERSION. */
  datasetVersion: string;
  /** The model OR the system under evaluation; both are legitimate subjects. */
  subjectRef: string;
  subjectVersion?: string;
  partition: DatasetSplit;
  status: ContaminationStatus;
  expectation: PartitionExpectation;
  /** Evidence that exposure OCCURRED. */
  exposureRefs: string[];
  exposureSource?: ClaimSource;
  /** Fingerprints the subject was known to have seen. */
  knownFingerprints: string[];
  /** Fingerprints of the benchmark items in scope. */
  benchmarkFingerprints: string[];
  /** The actual intersection. Evidence of exact/normalized overlap. */
  matchedFingerprints: string[];
  /** Supporting evidence references (manifests, disclosures, logs). */
  evidenceRefs: string[];
  reasons: string[];
  /**
   * True only for NO_KNOWN_EXPOSURE backed by evidence. A benchmark/score
   * may be reported as independent evidence only when this is true.
   */
  independentEvidence: boolean;
  provenance: string;
  /** ISO timestamp supplied by the caller. Never generated here. */
  assessedAt: string;
}

export type ContaminationProblem =
  | "assessment-id"
  | "benchmark-ref"
  | "dataset-version"
  | "subject-ref"
  | "partition"
  | "status"
  | "exposure-refs"
  | "fingerprints"
  | "evidence-refs"
  | "exposure-source"
  | "status-evidence"
  | "sealed-claim"
  | "unknown-field"
  | "provenance"
  | "assessed-at";

/**
 * Exactly the keys an assessment input may carry. Anything else is REJECTED
 * rather than silently dropped: dropping an unrecognised field is silent
 * repair, and it would let a caller smuggle in a `score` or `expected`
 * field believing it had been recorded when it had not.
 */
const ALLOWED_INPUT_KEYS: ReadonlySet<string> = new Set([
  "assessmentId",
  "benchmarkRef",
  "datasetVersion",
  "subjectRef",
  "subjectVersion",
  "partition",
  "status",
  "exposureRefs",
  "exposureSource",
  "knownFingerprints",
  "benchmarkFingerprints",
  "evidenceRefs",
  "provenance",
  "assessedAt",
]);

const ASSESSMENT_ID_RE = /^bcont-[a-z0-9][a-z0-9-]*$/;
const SLUG_RE = /[^a-z0-9]+/g;
const VERSION_RE = /^\d+\.\d+\.\d+$/;
const SHA256_HEX_RE = /^[0-9a-f]{64}$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const CONTAMINATION_PROVENANCE = "p19-benchmark-contamination";
const CLAIM_SOURCES: readonly ClaimSource[] = [
  "LOCAL_MEASURED",
  "INTERNAL_TEST",
  "VENDOR_REPORTED",
  "THIRD_PARTY_REPORTED",
  "HISTORICAL",
  "UNKNOWN",
];

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isoTimestamp(value: unknown): value is string {
  return typeof value === "string" && ISO_RE.test(value) && !Number.isNaN(Date.parse(value));
}

function refList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(nonEmpty) && new Set(value).size === value.length;
}

function fingerprintList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string" && SHA256_HEX_RE.test(v)) && new Set(value).size === value.length;
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Real comparator (never a factory): a factory passed to sort yields NaN. */
function compareAssessments(a: ContaminationAssessment, b: ContaminationAssessment): number {
  return (
    compareStrings(a.assessmentId, b.assessmentId) ||
    compareStrings(a.benchmarkRef, b.benchmarkRef) ||
    compareStrings(a.subjectRef, b.subjectRef) ||
    compareStrings(a.datasetVersion, b.datasetVersion)
  );
}

/** Deterministic assessment id from a slug. */
export function assessmentIdFor(slug: string): string {
  const normalized = slug
    .toLowerCase()
    .replace(SLUG_RE, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `bcont-${normalized.length > 0 ? normalized : "assessment"}`;
}

export interface AssessmentInput {
  assessmentId: string;
  benchmarkRef: string;
  datasetVersion: string;
  subjectRef: string;
  subjectVersion?: string;
  partition: DatasetSplit;
  status: ContaminationStatus;
  exposureRefs?: string[];
  exposureSource?: ClaimSource;
  knownFingerprints?: string[];
  benchmarkFingerprints?: string[];
  evidenceRefs?: string[];
  provenance?: string;
  assessedAt: string;
}

/**
 * Validate an assessment input.
 *
 * The load-bearing rules:
 *  - NO_KNOWN_EXPOSURE REQUIRES evidence. No disclosure is UNKNOWN, never
 *    CLEAN: UNKNOWN != FALSE.
 *  - KNOWN_EXPOSED requires exposure evidence, not an assertion.
 *  - A sealed partition can never assert independent evidence, because
 *    SEALED LABEL != PROVEN SEALED HISTORY.
 *  - Fingerprints must be real sha256 hex. A fingerprint is a deterministic
 *    hash, never a similarity score.
 */
export function validateAssessment(input: AssessmentInput): ContaminationProblem[] {
  const problems: ContaminationProblem[] = [];
  // Reject unrecognised keys: silent repair is forbidden, and a dropped
  // field is indistinguishable from a recorded one to the caller.
  for (const key of Object.keys(input ?? {})) {
    if (!ALLOWED_INPUT_KEYS.has(key)) problems.push("unknown-field");
  }
  if (!nonEmpty(input?.assessmentId) || !ASSESSMENT_ID_RE.test(input.assessmentId)) problems.push("assessment-id");
  if (!nonEmpty(input?.benchmarkRef)) problems.push("benchmark-ref");
  if (!nonEmpty(input?.datasetVersion) || !VERSION_RE.test(input.datasetVersion)) problems.push("dataset-version");
  if (!nonEmpty(input?.subjectRef)) problems.push("subject-ref");
  if (!DATASET_SPLITS.includes(input?.partition)) problems.push("partition");
  if (!CONTAMINATION_STATUSES.includes(input?.status)) problems.push("status");
  if (!isoTimestamp(input?.assessedAt)) problems.push("assessed-at");
  if (!nonEmpty(input?.provenance ?? CONTAMINATION_PROVENANCE)) problems.push("provenance");

  const exposureRefs = input.exposureRefs ?? [];
  if (!refList(exposureRefs)) problems.push("exposure-refs");
  if (!fingerprintList(input.knownFingerprints ?? [])) problems.push("fingerprints");
  if (!fingerprintList(input.benchmarkFingerprints ?? [])) problems.push("fingerprints");
  if (!refList(input.evidenceRefs ?? [])) problems.push("evidence-refs");
  if (input.exposureSource !== undefined && !CLAIM_SOURCES.includes(input.exposureSource)) {
    problems.push("exposure-source");
  }

  const evidenceRefs = input.evidenceRefs ?? [];
  if (input.status === "NO_KNOWN_EXPOSURE" && evidenceRefs.length === 0) problems.push("status-evidence");
  if (input.status === "KNOWN_EXPOSED" && exposureRefs.length === 0) problems.push("status-evidence");
  // A sealed label is a handling policy. It cannot by itself establish that
  // the benchmark was never trained on.
  if (input.partition === "sealed" && input.status === "NO_KNOWN_EXPOSURE" && evidenceRefs.length === 0) {
    problems.push("sealed-claim");
  }
  // An exposure asserted with an UNKNOWN source asserts nothing.
  if (input.status === "KNOWN_EXPOSED" && input.exposureSource === "UNKNOWN") problems.push("status-evidence");

  return [...new Set(problems)].sort() as ContaminationProblem[];
}

function clone(assessment: ContaminationAssessment): ContaminationAssessment {
  return JSON.parse(JSON.stringify(assessment)) as ContaminationAssessment;
}

/**
 * Build an assessment. `matchedFingerprints` is COMPUTED as the intersection
 * of what the subject was known to have seen and what the benchmark
 * contains — it is never supplied, so a caller cannot assert overlap that
 * the fingerprints do not support.
 *
 * A non-empty intersection is exact/normalized overlap evidence and forces
 * the status to at least SUSPECTED: it is never quietly downgraded.
 *
 * `independentEvidence` is true only for an evidence-backed NO_KNOWN_EXPOSURE
 * on a partition that is not merely a policy label.
 */
export function assessContamination(input: AssessmentInput): ContaminationAssessment {
  const problems = validateAssessment(input);
  if (problems.length > 0) {
    throw new Error(`invalid contamination assessment ${String(input?.assessmentId)}: ${problems.join(",")}`);
  }
  const known = new Set(input.knownFingerprints ?? []);
  const benchmark = input.benchmarkFingerprints ?? [];
  const matched = benchmark.filter((f) => known.has(f)).sort(compareStrings);
  const evidenceRefs = [...(input.evidenceRefs ?? [])].sort(compareStrings);
  const exposureRefs = [...(input.exposureRefs ?? [])].sort(compareStrings);

  const reasons: string[] = [];
  let status = input.status;
  if (matched.length > 0) {
    // Exact or normalized overlap is real evidence; it cannot be downgraded.
    if (status === "NO_KNOWN_EXPOSURE" || status === "UNKNOWN" || status === "SEALED_BY_POLICY") {
      status = "SUSPECTED";
    }
    reasons.push(`${matched.length} fingerprint match(es) between subject exposure and benchmark items`);
  }
  const expectation = partitionExpectation(input.partition);
  if (expectation === "EXPECTED_EXPOSURE") {
    // TRAIN/VALIDATION visibility is by design. It qualifies interpretation
    // and is not a failure, but it also can never be independent evidence.
    reasons.push(`${input.partition} partition is expected exposure by design; results are not independent evidence`);
  }
  if (expectation === "POLICY_LABEL_ONLY") {
    reasons.push("sealed is a handling-policy label; it is not evidence of an uncontaminated history");
  }
  if (status === "UNKNOWN") {
    reasons.push("no exposure disclosure available; absence of disclosure is not evidence of cleanliness");
  }
  if (status === "NO_KNOWN_EXPOSURE" && evidenceRefs.length > 0) {
    reasons.push(`no known exposure, supported by ${evidenceRefs.length} evidence reference(s)`);
  }

  const independentEvidence =
    status === "NO_KNOWN_EXPOSURE" &&
    evidenceRefs.length > 0 &&
    matched.length === 0 &&
    expectation !== "EXPECTED_EXPOSURE" &&
    expectation !== "POLICY_LABEL_ONLY";

  return {
    assessmentId: input.assessmentId,
    benchmarkRef: input.benchmarkRef,
    datasetVersion: input.datasetVersion,
    subjectRef: input.subjectRef,
    ...(input.subjectVersion === undefined ? {} : { subjectVersion: input.subjectVersion }),
    partition: input.partition,
    status,
    expectation,
    exposureRefs,
    ...(input.exposureSource === undefined ? {} : { exposureSource: input.exposureSource }),
    knownFingerprints: [...(input.knownFingerprints ?? [])].sort(compareStrings),
    benchmarkFingerprints: [...benchmark].sort(compareStrings),
    matchedFingerprints: matched,
    evidenceRefs,
    reasons: reasons.sort(compareStrings),
    independentEvidence,
    provenance: input.provenance ?? CONTAMINATION_PROVENANCE,
    assessedAt: input.assessedAt,
  };
}

/** Canonical serialization: key-sorted, so insertion order cannot leak. */
export function canonicalAssessment(assessment: ContaminationAssessment): string {
  return JSON.stringify(Object.fromEntries(Object.entries(assessment).sort(([a], [b]) => compareStrings(a, b))));
}

export interface GuardQuery {
  benchmarkRef?: string;
  subjectRef?: string;
  partition?: DatasetSplit;
  status?: ContaminationStatus;
  /** Only assessments that may be reported as independent evidence. */
  independentOnly?: boolean;
}

function matches(assessment: ContaminationAssessment, query: GuardQuery): boolean {
  if (query.benchmarkRef !== undefined && assessment.benchmarkRef !== query.benchmarkRef) return false;
  if (query.subjectRef !== undefined && assessment.subjectRef !== query.subjectRef) return false;
  if (query.partition !== undefined && assessment.partition !== query.partition) return false;
  if (query.status !== undefined && assessment.status !== query.status) return false;
  if (query.independentOnly === true && !assessment.independentEvidence) return false;
  return true;
}

/**
 * Query assessments deterministically. Contamination is RELATIONAL: the same
 * dataset assessed against two subjects yields two records, and neither is a
 * global property of the dataset.
 */
export function queryAssessments(
  assessments: readonly ContaminationAssessment[],
  query: GuardQuery = {},
): ContaminationAssessment[] {
  return [...assessments].sort(compareAssessments).filter((a) => matches(a, query)).map(clone);
}

/**
 * The strongest qualification the guard can attach to a result. It
 * qualifies interpretation; it never alters an observed score.
 */
export function independentEvidenceFor(
  assessments: readonly ContaminationAssessment[],
  query: GuardQuery,
): "INDEPENDENT" | "QUALIFIED" | "NO_ASSESSMENT" {
  const found = queryAssessments(assessments, query);
  if (found.length === 0) return "NO_ASSESSMENT";
  return found.every((a) => a.independentEvidence) ? "INDEPENDENT" : "QUALIFIED";
}
