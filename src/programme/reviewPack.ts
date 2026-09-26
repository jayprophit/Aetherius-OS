import { assertSafePath } from "../runners/sync";
import type { WorkspaceDiff } from "../runners/sync";
import type { TouchEstimate } from "../workers/touch";
import type { VerificationState } from "../workflows/deliverable";
import type { Requirement } from "./types";

/**
 * REQ-p16-review-context-pack: reviewer context pack projection.
 *
 * A read-only projection that JOINS the parts that already exist, so a
 * reviewer can see bounded context for a change without reconstructing the
 * project. The registered requirement names the join exactly:
 *
 *   diff + touch set + impact + tests + provenance + policy + verification
 *
 * "disclosure/layers/reports exist separately, no joined pack" — so this is
 * a JOIN, not a new owner. Every dimension is projected from an existing
 * authoritative source and referenced, never copied into new canonical
 * records:
 *
 *   diff        WorkspaceDiff          (src/runners/sync.ts)
 *   touch set   TouchEstimate          (src/workers/touch.ts)
 *   tests       TestReport vocabulary  (src/workflows/promotion.ts)
 *   policy      CapabilityNode refs    (src/programme/capabilityGraph.ts)
 *   verification VerificationState     (src/workflows/deliverable.ts)
 *   provenance  caller-declared sources
 *
 * The "impact" leg is the honest exception. There is NO code-level
 * dependency graph in this repository: registry/depgraph.json is
 * system-level (10 nodes), there is no depgraph.ts module, and
 * EvidenceGraph is an in-memory graph of caller-recorded facts that never
 * reads it. REQ-p20-change-impact owns that gap and is still READY with
 * zero implementation. So impact here is REFERENCED or reported
 * UNAVAILABLE with a reason — never computed, never approximated from
 * name similarity.
 *
 * Boundaries this module exists to hold:
 *
 *   REVIEW CONTEXT PACK != REVIEW VERDICT
 *   REVIEW CONTEXT PACK != MERGE AUTHORITY
 *   REVIEW CONTEXT PACK != CONTEXT FABRIC
 *   CONTEXT PACK        != EXECUTION
 *   SELF-GENERATED PACK != INDEPENDENT REVIEW
 *   EXPECTED TOUCH      != ACTUAL TOUCH
 *   MISSING CONTEXT     != NEGATIVE FACT
 *   NO ERROR            != COMPLETE CONTEXT
 *
 * It is INPUT TO REVIEW, never the reviewer. It produces no verdict, no
 * approval, no authorization, no merge and no execution, and it is not
 * persisted: a pack is a projection, so owning storage for it would make
 * it a second registry.
 */

const PACK_PROVENANCE = "p16-review-context-pack";

/** The join dimensions named by the registered requirement. */
export const PACK_DIMENSIONS = [
  "diff",
  "touch",
  "impact",
  "tests",
  "provenance",
  "policy",
  "verification",
] as const;
export type PackDimension = (typeof PACK_DIMENSIONS)[number];

/**
 * Impact availability. "UNAVAILABLE" is a real, reportable state, not a
 * zero: no code-level dependency graph exists yet.
 */
export interface PackImpact {
  status: "REFERENCED" | "UNAVAILABLE";
  refs: string[];
  reason: string;
}

/**
 * Test outcome states. NOT_RUN is the honest unknown: a test selected by
 * prediction but never executed is not a pass.
 *
 * This records OUTCOMES. It does not predict selection (that is
 * Agent-Bridge REQ-p21-test-impact) and it is not the workflow StepState
 * machine. SKIPPED is never reported as PASSED.
 */
export const PACK_TEST_STATES = ["PASSED", "FAILED", "SKIPPED", "BLOCKED", "NOT_RUN"] as const;
export type PackTestState = (typeof PACK_TEST_STATES)[number];

export interface PackTestOutcome {
  ref: string;
  suite: string;
  state: PackTestState;
}

/**
 * Expected vs actual touch. An unexpected path is a REVIEW SIGNAL, not a
 * defect: only a reviewer can judge it.
 */
export interface PackTouchComparison {
  /** Expected and actually changed. */
  overlap: string[];
  /** Expected but not changed. */
  expectedOnly: string[];
  /** Changed but not expected. */
  unexpected: string[];
}

export interface PackRequirementContext {
  id: string;
  title: string;
  description: string;
  phase: string;
  status: string;
  work_state: string;
  owner: string;
  priority: number;
  dependsOn: string[];
}

/** A declared authoritative source, kept as provenance rather than flattened into prose. */
export interface PackSource {
  dimension: PackDimension;
  provenance: string;
  detail?: string;
}

/**
 * A referenced thing that could not be resolved. Surfaced, never silently
 * dropped: a reviewer must see missing context.
 */
export interface PackUnresolvedRef {
  dimension: PackDimension | "requirement";
  ref: string;
  reason: string;
}

export interface ReviewContextPack {
  /** "rcp-<slug>". Cannot be a verdict, commit, requirement, proposal or evidence id. */
  packId: string;
  /** Caller-supplied change identity, preserved verbatim. */
  changeRef: string;
  changeKind: "COMMIT" | "UNCOMMITTED";
  requirementRefs: string[];
  requirementContext: PackRequirementContext[];
  /** Union of the diff buckets, sorted. */
  changedFiles: string[];
  touch: PackTouchComparison;
  impact: PackImpact;
  testOutcomes: PackTestOutcome[];
  policyRefs: string[];
  capabilityRefs: string[];
  verification: { state: VerificationState; refs: string[] };
  provenance: string;
  sources: PackSource[];
  unresolved: PackUnresolvedRef[];
  /** Dimensions that hit the item bound. */
  truncated: string[];
  /** ISO timestamp supplied by the caller. Never generated here. */
  generatedAt: string;
}

export type PackProblem =
  | "pack-id"
  | "change-ref"
  | "change-kind"
  | "requirement-refs"
  | "requirement-context"
  | "max-items"
  | "test-state"
  | "path"
  | "duplicate-ref"
  | "provenance"
  | "sources"
  | "generated-at"
  | "authority-field"
  | "raw-secret";

/** Authority a projection must never be able to express. */
const BANNED_AUTHORITY_KEYS = [
  "approved",
  "verdict",
  "authorized",
  "authorize",
  "merge_authority",
  "canMerge",
  "canDeploy",
  "apply",
  "applied",
  "execute",
  "executed",
  "policyBypass",
  "ownerOverride",
  "independentReview",
];

/** Mirrors assertSecretReferenceShape (src/state/types.ts). */
const BANNED_CREDENTIAL_KEYS = ["value", "secret", "token", "password", "apiKey", "privateKey"];

/**
 * Minimal credential-assignment guard, mirroring staticSafetyScan intent in
 * src/workflows/promotion.ts. Those patterns are private to the completed
 * P19 module; the repository has no shared redaction helper.
 */
const SECRET_VALUE_PATTERNS: readonly RegExp[] = [
  /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
  /bearer\s+[A-Za-z0-9._-]+/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /password\s*[:=]\s*['"][^'"]+['"]/i,
];

const PACK_ID_RE = /^rcp-[a-z0-9][a-z0-9-]*$/;
const SLUG_RE = /[^a-z0-9]+/g;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const VERIFICATION_STATES: readonly string[] = ["UNVERIFIED", "EVIDENCE_COMPLETE", "VERIFIED", "FAILED"];

/** Deterministic pack id from a title slug. */
export function packIdFor(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(SLUG_RE, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `rcp-${slug.length > 0 ? slug : "pack"}`;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isoTimestamp(value: unknown): value is string {
  return typeof value === "string" && ISO_RE.test(value) && !Number.isNaN(Date.parse(value));
}

function refList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(nonEmpty) && new Set(value).size === value.length;
}

function safePath(path: string): boolean {
  try {
    assertSafePath(path);
    return true;
  } catch {
    return false;
  }
}

function dedupe(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

export interface ReviewContextInput {
  packId: string;
  changeRef: string;
  changeKind: "COMMIT" | "UNCOMMITTED";
  requirementRefs?: string[];
  requirements?: readonly Requirement[];
  /** Existing diff. Only the paths are projected; no content is copied. */
  diff?: WorkspaceDiff;
  /** Existing expected touch estimate. */
  touch?: TouchEstimate;
  /** Impact refs supplied by a caller that owns impact analysis. Never computed here. */
  impactRefs?: string[];
  impactReason?: string;
  testOutcomes?: PackTestOutcome[];
  policyRefs?: string[];
  capabilityRefs?: string[];
  verificationState?: VerificationState;
  verificationRefs?: string[];
  sources?: PackSource[];
  maxItemsPerDimension?: number;
  generatedAt: string;
  provenance?: string;
}

/** Default bound per dimension, mirroring the context-layer convention. */
export const DEFAULT_PACK_MAX_ITEMS = 25;

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Real comparator (not a factory): a factory here silently disables ordering. */
function compareOutcomes(a: PackTestOutcome, b: PackTestOutcome): number {
  return compareStrings(a.ref, b.ref) || compareStrings(a.suite, b.suite);
}

/**
 * Validate a pack input. Malformed input is rejected, never repaired.
 *
 * The known-requirement set is only consulted when non-empty: an unchecked
 * dimension stays silent rather than reporting a false negative.
 */
export function validateReviewContext(
  input: ReviewContextInput,
  knownRequirements: readonly string[] = [],
): PackProblem[] {
  const problems: PackProblem[] = [];
  if (!nonEmpty(input.packId) || !PACK_ID_RE.test(input.packId)) problems.push("pack-id");
  if (!nonEmpty(input.changeRef)) problems.push("change-ref");
  if (input.changeKind !== "COMMIT" && input.changeKind !== "UNCOMMITTED") problems.push("change-kind");
  if (!nonEmpty(input.provenance ?? PACK_PROVENANCE)) problems.push("provenance");
  if (!isoTimestamp(input.generatedAt)) problems.push("generated-at");

  const max = input.maxItemsPerDimension ?? DEFAULT_PACK_MAX_ITEMS;
  if (!Number.isInteger(max) || max < 1) problems.push("max-items");

  for (const refs of [input.requirementRefs, input.impactRefs, input.policyRefs, input.capabilityRefs, input.verificationRefs]) {
    if (refs !== undefined && !refList(refs)) problems.push("duplicate-ref");
  }
  if (knownRequirements.length > 0) {
    const unknown = (input.requirementRefs ?? []).filter((r) => !knownRequirements.includes(r));
    if (unknown.length > 0) problems.push("requirement-refs");
  }
  if (input.requirements !== undefined) {
    for (const requirement of input.requirements) {
      if (!nonEmpty(requirement?.id) || !nonEmpty(requirement.title) || !nonEmpty(requirement.owner)) {
        problems.push("requirement-context");
        break;
      }
    }
  }

  for (const outcome of input.testOutcomes ?? []) {
    if (!nonEmpty(outcome.ref) || !nonEmpty(outcome.suite) || !PACK_TEST_STATES.includes(outcome.state)) {
      problems.push("test-state");
      break;
    }
  }

  // Changed paths are validated with the SHARED guard from src/runners/sync.ts
  // rather than a third private copy of the traversal rule.
  const paths = changedPaths(input);
  if (paths.some((p) => !safePath(p))) problems.push("path");

  for (const source of input.sources ?? []) {
    if (!PACK_DIMENSIONS.includes(source.dimension) || !nonEmpty(source.provenance)) {
      problems.push("sources");
      break;
    }
  }

  const asRecord = input as unknown as Record<string, unknown>;
  for (const key of [...BANNED_AUTHORITY_KEYS, ...BANNED_CREDENTIAL_KEYS]) {
    if (Object.prototype.hasOwnProperty.call(asRecord, key)) problems.push("authority-field");
  }
  for (const text of [input.changeRef, input.impactReason, ...(input.policyRefs ?? []), ...(input.capabilityRefs ?? [])]) {
    if (typeof text === "string" && SECRET_VALUE_PATTERNS.some((p) => p.test(text))) problems.push("raw-secret");
  }

  return [...new Set(problems)].sort() as PackProblem[];
}

function changedPaths(input: ReviewContextInput): string[] {
  const diff = input.diff;
  if (!diff) return [];
  return dedupe([...(diff.added ?? []), ...(diff.modified ?? []), ...(diff.deleted ?? [])]);
}

function compareTouch(a: string, b: string): number {
  return compareStrings(a, b);
}

function compareSources(a: PackSource, b: PackSource): number {
  return compareStrings(a.dimension, b.dimension) || compareStrings(a.provenance, b.provenance);
}

function compareUnresolved(a: PackUnresolvedRef, b: PackUnresolvedRef): number {
  return compareStrings(a.dimension, b.dimension) || compareStrings(a.ref, b.ref) || compareStrings(a.reason, b.reason);
}

function compareRequirements(a: PackRequirementContext, b: PackRequirementContext): number {
  return compareStrings(a.id, b.id);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function bound<T>(items: T[], max: number, dimension: PackDimension, truncated: string[]): T[] {
  if (items.length > max) truncated.push(dimension);
  return items.slice(0, max);
}

/**
 * Project a bounded, deterministic review context pack. Pure: no clock, no
 * filesystem crawl, no shell, no model call, no authorization, no writes.
 *
 * Sources are joined by reference. Nothing is recomputed: touch is not
 * re-estimated, readiness is not re-derived, impact is not computed.
 */
export function buildReviewContextPack(input: ReviewContextInput): ReviewContextPack {
  const problems = validateReviewContext(input);
  if (problems.length > 0) {
    throw new Error(`invalid review context pack ${String(input.packId)}: ${problems.join(",")}`);
  }
  const max = input.maxItemsPerDimension ?? DEFAULT_PACK_MAX_ITEMS;
  const truncated: string[] = [];
  const unresolved: PackUnresolvedRef[] = [];
  const sources = [...(input.sources ?? [])].sort(compareSources);

  // --- diff: project the existing WorkspaceDiff paths, never their content.
  const changed = changedPaths(input).sort(compareTouch);
  const changedFiles = bound(changed, max, "diff", truncated);

  // --- touch set: compare the EXISTING estimate against actual changes.
  const expected = dedupe(input.touch?.paths ?? []).sort(compareTouch);
  const changedSet = new Set(changed);
  const expectedSet = new Set(expected);
  const overlap = expected.filter((p) => changedSet.has(p));
  const expectedOnly = expected.filter((p) => !changedSet.has(p));
  const unexpected = changed.filter((p) => !expectedSet.has(p));

  // --- impact: referenced or honestly unavailable. Never computed.
  const impactRefs = dedupe(input.impactRefs ?? []);
  const impact: PackImpact =
    impactRefs.length > 0
      ? { status: "REFERENCED", refs: bound(impactRefs, max, "impact", truncated), reason: input.impactReason ?? "impact refs supplied by the owning mechanism" }
      : {
          status: "UNAVAILABLE",
          refs: [],
          reason:
            input.impactReason ??
            "no code-level dependency graph exists; REQ-p20-change-impact owns impact analysis and is not implemented",
        };

  // --- tests: outcomes as recorded, never summarised as "tests good".
  const testOutcomes = bound([...(input.testOutcomes ?? [])].sort(compareOutcomes), max, "tests", truncated);

  // --- policy + verification: opaque refs and the existing state vocabulary.
  const policyRefs = bound(dedupe(input.policyRefs ?? []), max, "policy", truncated);
  const capabilityRefs = bound(dedupe(input.capabilityRefs ?? []), max, "policy", truncated);
  const verificationState = input.verificationState ?? "UNVERIFIED";
  if (!VERIFICATION_STATES.includes(verificationState)) {
    throw new Error(`invalid review context pack ${input.packId}: unknown verification state ${verificationState}`);
  }
  const verificationRefs = bound(dedupe(input.verificationRefs ?? []), max, "verification", truncated);

  // --- requirement context: bounded projection of referenced requirements only.
  const requirementRefs = bound(dedupe(input.requirementRefs ?? []), max, "provenance", truncated);
  const wanted = new Set(requirementRefs);
  const requirementContext = bound(
    (input.requirements ?? [])
      .filter((r) => wanted.has(r.id))
      .map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        phase: r.phase,
        status: r.status,
        work_state: r.work_state,
        owner: r.owner,
        priority: r.priority,
        dependsOn: [...r.depends_on].sort(compareStrings),
      }))
      .sort(compareRequirements),
    max,
    "provenance",
    truncated,
  );

  // --- stale references are surfaced, never silently dropped.
  for (const ref of requirementRefs) {
    if (!requirementContext.some((r) => r.id === ref)) {
      unresolved.push({ dimension: "requirement", ref, reason: "no supplied requirement record for this reference" });
    }
  }
  for (const ref of capabilityRefs) {
    unresolved.push({ dimension: "policy", ref, reason: "capability ref not resolved by this projection; verify against CapabilityView" });
  }

  return {
    packId: input.packId,
    changeRef: input.changeRef,
    changeKind: input.changeKind,
    requirementRefs,
    requirementContext,
    changedFiles,
    touch: {
      overlap: bound(overlap, max, "touch", truncated),
      expectedOnly: bound(expectedOnly, max, "touch", truncated),
      unexpected: bound(unexpected, max, "touch", truncated),
    },
    impact,
    testOutcomes,
    policyRefs,
    capabilityRefs,
    verification: { state: verificationState, refs: verificationRefs },
    provenance: input.provenance ?? PACK_PROVENANCE,
    sources,
    unresolved: unresolved.sort(compareUnresolved),
    truncated: dedupe(truncated),
    generatedAt: input.generatedAt,
  };
}

/** Touch comparison for a pack, deep-copied. */
export function packTouchComparison(pack: ReviewContextPack): PackTouchComparison {
  return clone(pack.touch);
}

/** Changed files for a pack, deep-copied. */
export function packChangedFiles(pack: ReviewContextPack): string[] {
  return [...pack.changedFiles];
}

/** Requirement contexts for a pack, deep-copied and deterministic. */
export function packRequirementContext(pack: ReviewContextPack): PackRequirementContext[] {
  return clone(pack.requirementContext);
}

/**
 * Stale/missing references a reviewer must see. There is deliberately no
 * "complete" flag: NO ERROR != COMPLETE CONTEXT.
 */
export function packUnresolved(pack: ReviewContextPack): PackUnresolvedRef[] {
  return clone(pack.unresolved);
}
