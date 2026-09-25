/**
 * REQ-p19-causal-harness: causal A/B harness comparison.
 *
 * Answers: does harness/architecture A cause a measured difference
 * relative to B with task, model, tools, permissions and environment
 * held constant? Not a leaderboard, vendor ranking, preference engine
 * or universal score.
 *
 * Control discipline (enforced, not advised):
 * - The experiment declares controlled conditions once. Trials
 *   recording different actual conditions are CONFOUNDED: excluded
 *   from aggregates, listed separately, never silently merged.
 * - Model/tools/permissions/environment mismatches across variants
 *   make the comparison INCOMPARABLE (declared, not numbered).
 * - Declared-but-uncontrolled variables must be listed as confounds
 *   upfront; hidden differences invalidate the comparison, not the data.
 * - HARNESS CLAIM != VERIFIED TASK SUCCESS: claimed success and
 *   independently verified success are counted separately.
 * - No composite score, no winner field, no outlier removal. Every
 *   trial is preserved; repeatability comes from samples, not claims.
 */

export interface ControlledConditions {
  model: string;
  modelVersion: string;
  tools: string[];
  permissions: string;
  environment: string;
  startingState: string;
}

export interface Experiment {
  experimentId: string;
  taskId: string;
  harnessA: string;
  harnessB: string;
  controlled: ControlledConditions;
  /** Variables known-uncontrolled, declared upfront. */
  confounds: string[];
  scorerRef?: string;
  evidenceRefs?: string[];
}

export interface TrialConditions {
  model: string;
  modelVersion: string;
  tools: string[];
  permissions: string;
  environment: string;
}

export interface TrialObservations {
  successClaimed: boolean;
  successVerified: boolean;
  verificationRef?: string;
  toolCalls: number;
  toolErrors: number;
  retries: number;
  manualInterventions: number;
  wallMs: number;
  tokens?: number;
  costAmount?: number;
  escalations: number;
  verificationFailures: number;
  evidenceComplete: boolean;
}

export interface Trial {
  experimentId: string;
  variant: "A" | "B";
  runIndex: number;
  conditions: TrialConditions;
  observations: TrialObservations;
  artifactRefs?: string[];
  evidenceRefs?: string[];
}

export type HarnessProblem =
  | "experiment-id"
  | "task-id"
  | "harness-ids"
  | "controlled"
  | "variant"
  | "run-index"
  | "conditions"
  | "observations";

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function nonNegativeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function validConditions(conditions: TrialConditions | ControlledConditions): boolean {
  if (!nonEmpty(conditions.model) || !nonEmpty(conditions.modelVersion)) return false;
  if (!nonEmpty(conditions.permissions) || !nonEmpty(conditions.environment)) return false;
  if (!Array.isArray((conditions as TrialConditions).tools ?? []) ||
      (conditions as TrialConditions).tools?.some((t) => !nonEmpty(t))) return false;
  return true;
}

function validExperimentConditions(controlled: ControlledConditions): boolean {
  if (!nonEmpty(controlled.model) || !nonEmpty(controlled.modelVersion)) return false;
  if (!nonEmpty(controlled.permissions) || !nonEmpty(controlled.environment)) return false;
  if (!nonEmpty(controlled.startingState)) return false;
  if (!Array.isArray(controlled.tools) || controlled.tools.some((t) => !nonEmpty(t))) return false;
  return true;
}

export function validateExperiment(experiment: Experiment): HarnessProblem[] {
  const problems: HarnessProblem[] = [];
  if (!nonEmpty(experiment.experimentId)) problems.push("experiment-id");
  if (!nonEmpty(experiment.taskId)) problems.push("task-id");
  if (!nonEmpty(experiment.harnessA) || !nonEmpty(experiment.harnessB) ||
      experiment.harnessA.trim() === experiment.harnessB.trim()) {
    problems.push("harness-ids");
  }
  if (!validExperimentConditions(experiment.controlled)) problems.push("controlled");
  return [...new Set(problems)].sort() as HarnessProblem[];
}

export function validateTrial(trial: Trial): HarnessProblem[] {
  const problems: HarnessProblem[] = [];
  if (!nonEmpty(trial.experimentId)) problems.push("experiment-id");
  if (trial.variant !== "A" && trial.variant !== "B") problems.push("variant");
  if (!Number.isInteger(trial.runIndex) || trial.runIndex < 0) problems.push("run-index");
  if (!validConditions(trial.conditions)) problems.push("conditions");
  const obs = trial.observations;
  if (typeof obs?.successClaimed !== "boolean" || typeof obs?.successVerified !== "boolean") {
    problems.push("observations");
  }
  const counts = [obs?.toolCalls, obs?.toolErrors, obs?.retries, obs?.manualInterventions,
    obs?.wallMs, obs?.escalations, obs?.verificationFailures];
  if (counts.some((c) => !nonNegativeInt(c))) problems.push("observations");
  for (const optional of [obs?.tokens, obs?.costAmount] as const) {
    if (optional !== undefined && (typeof optional !== "number" || !Number.isFinite(optional) || optional < 0)) {
      problems.push("observations");
    }
  }
  return [...new Set(problems)].sort() as HarnessProblem[];
}

function sameConditions(controlled: ControlledConditions, actual: TrialConditions): boolean {
  return (
    actual.model === controlled.model &&
    actual.modelVersion === controlled.modelVersion &&
    actual.permissions === controlled.permissions &&
    actual.environment === controlled.environment &&
    JSON.stringify([...actual.tools].sort()) === JSON.stringify([...controlled.tools].sort())
  );
}

export interface VariantAggregate {
  variant: "A" | "B";
  runs: number;
  confoundedRuns: number;
  claimedSuccess: number;
  verifiedSuccess: number;
  meanToolCalls: number;
  meanToolErrors: number;
  meanRetries: number;
  meanManualInterventions: number;
  meanWallMs: number;
  meanEscalations: number;
  meanVerificationFailures: number;
}

export interface HarnessComparison {
  experimentId: string;
  comparable: boolean;
  incomparabilityReasons: string[];
  aggregates: Record<"A" | "B", VariantAggregate>;
  /** Per-metric B-minus-A deltas over unconfounded runs only. No composite. */
  deltas: Record<string, number>;
  confoundedTrials: { variant: "A" | "B"; runIndex: number; reason: string }[];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Compare two harness variants. Trials whose actual conditions differ
 * from the declared controlled block are confounded (excluded, listed).
 * Different declared blocks per variant would make the experiment
 * incomparable by construction — the single-block schema prevents that.
 */
export function compareHarness(
  experiment: Experiment,
  trials: readonly Trial[],
): HarnessComparison {
  const expProblems = validateExperiment(experiment);
  if (expProblems.length > 0) throw new Error(`invalid experiment: ${expProblems.join(",")}`);
  const incomparabilityReasons: string[] = [];
  if (experiment.confounds.length > 0) {
    incomparabilityReasons.push(`declared confounds limit causal reading: ${[...experiment.confounds].sort().join(", ")}`);
  }
  const byVariant: Record<"A" | "B", Trial[]> = { A: [], B: [] };
  const confoundedTrials: HarnessComparison["confoundedTrials"] = [];
  for (const trial of [...trials].sort((a, b) => (a.variant === b.variant ? a.runIndex - b.runIndex : a.variant < b.variant ? -1 : 1))) {
    const problems = validateTrial(trial);
    if (problems.length > 0) throw new Error(`invalid trial ${trial.variant}#${trial.runIndex}: ${problems.join(",")}`);
    if (trial.experimentId !== experiment.experimentId) {
      throw new Error(`trial belongs to ${trial.experimentId}, not ${experiment.experimentId}`);
    }
    if (!sameConditions(experiment.controlled, trial.conditions)) {
      confoundedTrials.push({ variant: trial.variant, runIndex: trial.runIndex, reason: "actual conditions differ from declared controlled block" });
      continue;
    }
    byVariant[trial.variant].push(trial);
  }
  const aggregate = (variant: "A" | "B", clean: Trial[]): VariantAggregate => ({
    variant,
    runs: clean.length,
    confoundedRuns: confoundedTrials.filter((c) => c.variant === variant).length,
    claimedSuccess: clean.filter((t) => t.observations.successClaimed).length,
    verifiedSuccess: clean.filter((t) => t.observations.successVerified).length,
    meanToolCalls: mean(clean.map((t) => t.observations.toolCalls)),
    meanToolErrors: mean(clean.map((t) => t.observations.toolErrors)),
    meanRetries: mean(clean.map((t) => t.observations.retries)),
    meanManualInterventions: mean(clean.map((t) => t.observations.manualInterventions)),
    meanWallMs: mean(clean.map((t) => t.observations.wallMs)),
    meanEscalations: mean(clean.map((t) => t.observations.escalations)),
    meanVerificationFailures: mean(clean.map((t) => t.observations.verificationFailures)),
  });
  const aggregates = { A: aggregate("A", byVariant.A), B: aggregate("B", byVariant.B) };
  const delta = (pick: (a: VariantAggregate) => number): number => pick(aggregates.B) - pick(aggregates.A);
  return {
    experimentId: experiment.experimentId,
    comparable: incomparabilityReasons.length === 0,
    incomparabilityReasons: [...incomparabilityReasons].sort(),
    aggregates,
    deltas: {
      claimedSuccess: delta((a) => a.claimedSuccess),
      verifiedSuccess: delta((a) => a.verifiedSuccess),
      toolCalls: delta((a) => a.meanToolCalls),
      toolErrors: delta((a) => a.meanToolErrors),
      retries: delta((a) => a.meanRetries),
      manualInterventions: delta((a) => a.meanManualInterventions),
      wallMs: delta((a) => a.meanWallMs),
      escalations: delta((a) => a.meanEscalations),
      verificationFailures: delta((a) => a.meanVerificationFailures),
    },
    confoundedTrials: [...confoundedTrials].sort((a, b) =>
      a.variant === b.variant ? a.runIndex - b.runIndex : a.variant < b.variant ? -1 : 1),
  };
}
