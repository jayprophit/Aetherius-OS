import type { ContaminationAssessment } from "./contamination";
import { independentEvidenceFor } from "./contamination";
import type { DatasetSplit } from "./evaluation";
import type { ControlledConditions, Trial, TrialObservations } from "./harness";

/**
 * REQ-p19-e2e-completion: end-to-end workflow completion benchmark.
 *
 * The registered requirement is the scope authority:
 *
 *   "Controlled harness benchmark (fixed repo/task/model/permissions/tools/
 *    env/deliverable; success/correctness/time/calls/errors/retries/
 *    intervention/tokens/cost/evidence/violations/quality/recovery)
 *    EXTENDING benchmark-fabric/causal-harness with sealed-vault and
 *    contamination fairness; never a second framework."
 *
 * "EXTENDING ... never a second framework" is the governing constraint. This
 * module therefore:
 *
 *  - REUSES `ControlledConditions`, `TrialObservations` and `Trial` from
 *    src/eval/harness.ts and emits trials the EXISTING `compareHarness`
 *    already consumes. It does not re-implement comparison, aggregation,
 *    confound detection or delta computation.
 *  - REUSES the contamination guard (src/eval/contamination.ts) for fairness.
 *  - Reports which of the requirement's named facets the existing
 *    observation contract can actually support, and marks the rest
 *    UNAVAILABLE.
 *
 * THE HONEST CORE: the requirement names thirteen facets. The existing
 * `TrialObservations` contract backs nine of them. Four have NO backing
 * field and are reported UNAVAILABLE with a reason:
 *
 *   correctness  no correctness field exists in TrialObservations
 *   violations   `escalations` is not a violation count
 *   quality      no field, and it is a composite — never synthesised
 *   recovery     no field exists
 *
 * Those four are not filled with proxies, and `quality` in particular is
 * never derived from the others:
 *
 *   MISSING FACET != ZERO FACET
 *   NO COMPOSITE != NO QUALITY CLAIM
 *   SUCCESS CLAIMED != SUCCESS VERIFIED
 *
 * A trial whose deliverable or evidence is incomplete is reported as
 * claimed-and-unverified, never as a success.
 */

/** The thirteen facets the registered requirement names, verbatim. */
export const COMPLETION_FACETS = [
  "success",
  "correctness",
  "time",
  "calls",
  "errors",
  "retries",
  "intervention",
  "tokens",
  "cost",
  "evidence",
  "violations",
  "quality",
  "recovery",
] as const;
export type CompletionFacet = (typeof COMPLETION_FACETS)[number];

export type FacetState = "OBSERVED" | "UNAVAILABLE";

export interface FacetObservation {
  facet: CompletionFacet;
  state: FacetState;
  /** Present only when OBSERVED. Never zero-filled when UNAVAILABLE. */
  value?: number | boolean;
  /** Which existing observation field backs this facet, when OBSERVED. */
  sourceField?: keyof TrialObservations;
  /** Required when UNAVAILABLE: why there is no value. */
  reason?: string;
}

/** Why each unsupported facet has no value. Documented, not implied. */
const UNAVAILABLE_REASONS: Readonly<Partial<Record<CompletionFacet, string>>> = {
  correctness: "no correctness field exists in TrialObservations; not proxied from success or verification",
  violations: "escalations is not a violation count; no violation field exists",
  quality: "no quality field exists and quality is a composite; never synthesised from other facets",
  recovery: "no recovery field exists in TrialObservations",
};

/**
 * Project a trial's observations onto the requirement's facets. Facets with
 * no backing field are UNAVAILABLE; optional fields that were simply not
 * recorded are also UNAVAILABLE, because an unrecorded value is not zero.
 */
export function projectFacets(observations: TrialObservations): FacetObservation[] {
  const observed: FacetObservation[] = [
    {
      facet: "success",
      state: "OBSERVED",
      // Both halves are reported: a claim is not a verification.
      value: observations.successVerified,
      sourceField: "successVerified",
      reason: observations.successVerified
        ? undefined
        : "claimed but not verified: successClaimed is recorded separately and is not success",
    },
    { facet: "time", state: "OBSERVED", value: observations.wallMs, sourceField: "wallMs" },
    { facet: "calls", state: "OBSERVED", value: observations.toolCalls, sourceField: "toolCalls" },
    { facet: "errors", state: "OBSERVED", value: observations.toolErrors, sourceField: "toolErrors" },
    { facet: "retries", state: "OBSERVED", value: observations.retries, sourceField: "retries" },
    {
      facet: "intervention",
      state: "OBSERVED",
      value: observations.manualInterventions,
      sourceField: "manualInterventions",
    },
    { facet: "evidence", state: "OBSERVED", value: observations.evidenceComplete, sourceField: "evidenceComplete" },
  ];
  if (typeof observations.tokens === "number") {
    observed.push({ facet: "tokens", state: "OBSERVED", value: observations.tokens, sourceField: "tokens" });
  } else {
    observed.push({
      facet: "tokens",
      state: "UNAVAILABLE",
      reason: "tokens were not recorded on this trial; an unrecorded count is not zero",
    });
  }
  if (typeof observations.costAmount === "number") {
    observed.push({ facet: "cost", state: "OBSERVED", value: observations.costAmount, sourceField: "costAmount" });
  } else {
    observed.push({
      facet: "cost",
      state: "UNAVAILABLE",
      reason: "cost was not recorded on this trial; an unrecorded cost is not zero",
    });
  }
  for (const facet of COMPLETION_FACETS) {
    if (observed.some((o) => o.facet === facet)) continue;
    observed.push({ facet, state: "UNAVAILABLE", reason: UNAVAILABLE_REASONS[facet] ?? "no backing field exists" });
  }
  return observed.sort((a, b) => (a.facet < b.facet ? -1 : 1));
}

export type CompletionProblem =
  | "trial-id"
  | "experiment-id"
  | "variant"
  | "run-index"
  | "conditions"
  | "deliverable-ref"
  | "benchmark-ref"
  | "partition"
  | "observations"
  | "unknown-field";

const COMPLETION_PROVENANCE = "p19-e2e-completion";
const ALLOWED_KEYS: ReadonlySet<string> = new Set([
  "trialId",
  "experimentId",
  "variant",
  "runIndex",
  "conditions",
  "deliverableRef",
  "benchmarkRef",
  "partition",
  "observations",
  "evidenceRefs",
  "provenance",
]);

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Real comparator (never a factory): a factory passed to sort yields NaN. */
function compareTrials(a: CompletionTrial, b: CompletionTrial): number {
  return (
    compareStrings(a.experimentId, b.experimentId) ||
    compareStrings(a.variant, b.variant) ||
    a.runIndex - b.runIndex ||
    compareStrings(a.trialId, b.trialId)
  );
}

function validConditions(conditions: ControlledConditions | undefined): boolean {
  return (
    !!conditions &&
    nonEmpty(conditions.model) &&
    nonEmpty(conditions.modelVersion) &&
    Array.isArray(conditions.tools) &&
    nonEmpty(conditions.permissions) &&
    nonEmpty(conditions.environment) &&
    nonEmpty(conditions.startingState)
  );
}

export interface CompletionTrialInput {
  trialId: string;
  experimentId: string;
  variant: "A" | "B";
  runIndex: number;
  /** The FIXED conditions block. Every trial must match it exactly. */
  conditions: ControlledConditions;
  /** Opaque ref to the deliverable contract under test; never owned here. */
  deliverableRef: string;
  /** Opaque benchmark ref, used for the contamination-fairness lookup. */
  benchmarkRef: string;
  partition: DatasetSplit;
  observations: TrialObservations;
  evidenceRefs?: string[];
  provenance?: string;
}

export type ContaminationFairness = "INDEPENDENT" | "QUALIFIED" | "NO_ASSESSMENT";

export interface CompletionTrial {
  trialId: string;
  experimentId: string;
  variant: "A" | "B";
  runIndex: number;
  conditions: ControlledConditions;
  deliverableRef: string;
  benchmarkRef: string;
  partition: DatasetSplit;
  observations: TrialObservations;
  facets: FacetObservation[];
  /** Contamination fairness for THIS trial's benchmark. Never a verdict. */
  fairness: ContaminationFairness;
  /** True only when fairness is INDEPENDENT. Sealed vaults are never sealed-proof. */
  independentEvidence: boolean;
  evidenceRefs: string[];
  provenance: string;
}

export function validateCompletionTrial(input: CompletionTrialInput): CompletionProblem[] {
  const problems: CompletionProblem[] = [];
  for (const key of Object.keys(input ?? {})) {
    if (!ALLOWED_KEYS.has(key)) problems.push("unknown-field");
  }
  if (!nonEmpty(input?.trialId)) problems.push("trial-id");
  if (!nonEmpty(input?.experimentId)) problems.push("experiment-id");
  if (input?.variant !== "A" && input?.variant !== "B") problems.push("variant");
  if (!Number.isInteger(input?.runIndex) || input.runIndex < 0) problems.push("run-index");
  if (!validConditions(input?.conditions)) problems.push("conditions");
  if (!nonEmpty(input?.deliverableRef)) problems.push("deliverable-ref");
  if (!nonEmpty(input?.benchmarkRef)) problems.push("benchmark-ref");
  if (!nonEmpty(input?.partition)) problems.push("partition");
  if (typeof input?.observations !== "object" || input.observations === null) problems.push("observations");
  if (input?.evidenceRefs !== undefined && (!Array.isArray(input.evidenceRefs) || input.evidenceRefs.some((r) => !nonEmpty(r)))) {
    problems.push("unknown-field");
  }
  return [...new Set(problems)].sort() as CompletionProblem[];
}

/**
 * Build one completion trial.
 *
 * Fairness comes from the EXISTING contamination guard: a trial is only
 * `independentEvidence` when its benchmark's contamination assessment
 * supports it. A `sealed` partition can never be independent on its label
 * alone, which is the sealed-vault requirement: SEALED LABEL != PROVEN
 * SEALED HISTORY.
 */
export function buildCompletionTrial(
  input: CompletionTrialInput,
  assessments: readonly ContaminationAssessment[] = [],
): CompletionTrial {
  const problems = validateCompletionTrial(input);
  if (problems.length > 0) {
    throw new Error(`invalid completion trial ${String(input?.trialId)}: ${problems.join(",")}`);
  }
  // The fairness lookup MUST match the trial's own partition as well as its
  // benchmark. Filtering on benchmarkRef alone would let a clean held-out
  // assessment vouch for a train-partition trial of the same benchmark.
  const fairness = independentEvidenceFor(assessments, {
    benchmarkRef: input.benchmarkRef,
    partition: input.partition,
  });
  // A sealed partition is never independent on its label alone
  // (SEALED LABEL != PROVEN SEALED HISTORY), and train/validation are
  // expected-visible by design, so neither can ever be independent evidence.
  const neverIndependent = input.partition === "sealed" || input.partition === "train" || input.partition === "validation";
  return {
    trialId: input.trialId,
    experimentId: input.experimentId,
    variant: input.variant,
    runIndex: input.runIndex,
    conditions: { ...input.conditions, tools: [...input.conditions.tools] },
    deliverableRef: input.deliverableRef,
    benchmarkRef: input.benchmarkRef,
    partition: input.partition,
    observations: { ...input.observations },
    facets: projectFacets(input.observations),
    fairness,
    independentEvidence: fairness === "INDEPENDENT" && !neverIndependent,
    evidenceRefs: [...(input.evidenceRefs ?? [])].sort(compareStrings),
    provenance: input.provenance ?? COMPLETION_PROVENANCE,
  };
}

export interface CompletionReport {
  experimentId: string;
  /** The single FIXED conditions block every trial matched. */
  controlled: ControlledConditions;
  deliverableRef: string;
  benchmarkRef: string;
  partition: DatasetSplit;
  trials: CompletionTrial[];
  /** Per-facet availability across the benchmark, sorted. Never a score. */
  facetCoverage: { facet: CompletionFacet; observed: number; unavailable: number; reason?: string }[];
  /** Trials whose conditions drifted from the controlled block. */
  confoundedTrialIds: string[];
  /** Always true: no composite quality figure is produced. */
  noCompositeQuality: true;
  provenance: string;
}

/**
 * Build a completion benchmark report over a set of trials.
 *
 * This EXTENDS the causal harness: it fixes and verifies the controlled
 * block, reports facet coverage, and attaches contamination fairness. It
 * deliberately computes NO aggregate, NO quality figure and NO winner —
 * those belong to `compareHarness`, which consumes the trials produced by
 * `toHarnessTrials` below.
 */
export function runCompletionBenchmark(input: {
  experimentId: string;
  controlled: ControlledConditions;
  deliverableRef: string;
  benchmarkRef: string;
  partition: DatasetSplit;
  trials: readonly CompletionTrialInput[];
  assessments?: readonly ContaminationAssessment[];
}): CompletionReport {
  if (!nonEmpty(input?.experimentId)) {
    throw new Error("invalid completion benchmark: experiment-id");
  }
  if (!validConditions(input?.controlled)) {
    throw new Error("invalid completion benchmark: conditions");
  }
  if (!nonEmpty(input?.deliverableRef)) throw new Error("invalid completion benchmark: deliverable-ref");
  if (!nonEmpty(input?.benchmarkRef)) throw new Error("invalid completion benchmark: benchmark-ref");
  if (!Array.isArray(input?.trials) || input.trials.length === 0) {
    throw new Error("invalid completion benchmark: no trials supplied");
  }

  const assessments = input.assessments ?? [];
  const trials = input.trials.map((t) => buildCompletionTrial(t, assessments));
  const confoundedTrialIds = trials
    .filter((t) => !conditionsMatch(input.controlled, t.conditions))
    .map((t) => t.trialId)
    .sort(compareStrings);

  const facetCoverage = COMPLETION_FACETS.map((facet) => {
    const matching = trials.flatMap((t) => t.facets.filter((f) => f.facet === facet));
    const unavailable = matching.filter((f) => f.state === "UNAVAILABLE");
    return {
      facet,
      observed: matching.length - unavailable.length,
      unavailable: unavailable.length,
      ...(unavailable[0]?.reason === undefined ? {} : { reason: unavailable[0].reason }),
    };
  }).sort((a, b) => compareStrings(a.facet, b.facet));

  return {
    experimentId: input.experimentId,
    controlled: { ...input.controlled, tools: [...input.controlled.tools] },
    deliverableRef: input.deliverableRef,
    benchmarkRef: input.benchmarkRef,
    partition: input.partition,
    trials: [...trials].sort(compareTrials),
    facetCoverage,
    confoundedTrialIds,
    noCompositeQuality: true,
    provenance: COMPLETION_PROVENANCE,
  };
}

/**
 * Order-insensitive condition comparison, mirroring the causal harness's own
 * rule so the two agree on what "same conditions" means. `tools` is
 * compared as a SET; `startingState` is part of the fixed block.
 */
function conditionsMatch(controlled: ControlledConditions, actual: ControlledConditions): boolean {
  return (
    actual.model === controlled.model &&
    actual.modelVersion === controlled.modelVersion &&
    actual.permissions === controlled.permissions &&
    actual.environment === controlled.environment &&
    actual.startingState === controlled.startingState &&
    JSON.stringify([...actual.tools].sort()) === JSON.stringify([...controlled.tools].sort())
  );
}

/**
 * Adapt completion trials into the EXISTING `Trial` shape so the existing
 * `compareHarness` can consume them unchanged.
 *
 * This is the "extends, never a second framework" seam: no second
 * comparator, no second aggregate, no re-implementation of confound
 * detection.
 */
export function toHarnessTrials(
  report: CompletionReport,
  confoundedTrialIds: readonly string[] = report.confoundedTrialIds,
): Trial[] {
  const excluded = new Set(confoundedTrialIds);
  return report.trials
    .filter((t) => !excluded.has(t.trialId))
    .map((t) => ({
      experimentId: t.experimentId,
      variant: t.variant,
      runIndex: t.runIndex,
      // TrialConditions intentionally omits startingState; the causal harness
      // treats that field as per-trial unobservable. It is preserved on the
      // completion trial itself, not dropped.
      conditions: {
        model: t.conditions.model,
        modelVersion: t.conditions.modelVersion,
        tools: [...t.conditions.tools],
        permissions: t.conditions.permissions,
        environment: t.conditions.environment,
      },
      observations: { ...t.observations },
      evidenceRefs: [...t.evidenceRefs],
    }));
}
