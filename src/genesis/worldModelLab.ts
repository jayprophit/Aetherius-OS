/**
 * REQ-p22-world-model-lab: scenario suite + quality scoring for the Genesis
 * world model.
 *
 * The registered requirement is the scope authority:
 *
 *   "Scenario suite + quality scoring for the Genesis world model (simulation
 *    divergence, intervention outcomes); read-only eval preserving
 *    counterfactual non-mutation, distinct from perf microbenchmarks."
 *
 * The runtime exists and is tested (`Genesis/src/cognition/world_model.cpp`:
 * `WorldDynamics` with observations, causal hypotheses, predictions with
 * confirmed/refuted/expired states, and a const `simulate()`). What does not
 * exist is the scoring lab. This unit adds exactly that, and nothing else:
 *
 *   RUNTIME (Genesis repo, C++) != SCORING LAB (here)
 *   NO runtime import, NO runtime call, NO runtime reimplementation
 *
 * THE LAB SCORES TRACES, NEVER THE RUNTIME. Every scenario is caller-supplied
 * data: hypotheses, predictions, observed outcomes, interventions. The lab
 * reads those traces and reports quality dimensions. It cannot observe, register,
 * resolve, expire, or simulate against the live model:
 *
 *   SCORED TRACE != LIVE RUNTIME
 *   EVALUATION READS; IT NEVER WRITES
 *
 * COUNTERFACTUAL NON-MUTATION IS STRUCTURAL. The runtime's own `simulate()` is
 * const; the lab mirrors that by taking readonly inputs, returning new objects,
 * and never mutating caller data. Tests freeze inputs to prove it:
 *
 *   READ-ONLY IS NOT A COMMENT; IT IS TESTED WITH FROZEN INPUTS
 *   COUNTERFACTUAL SIMULATION != COUNTERFACTUAL MUTATION
 *
 * QUALITY IS PER-DIMENSION, NEVER ONE NUMBER. The registered dimensions are
 * simulation divergence and intervention outcomes. Each is scored in its own
 * units, and no universal composite is emitted:
 *
 *   PER-DIMENSION SCORING != UNIVERSAL SCORE
 *   NO BLENDED QUALITY FIGURE
 *
 * AN ABSENT OUTCOME IS UNRESOLVED, NOT A VERDICT. A prediction with no supplied
 * outcome stays UNRESOLVED — never confirmed, never refuted, never counted in a
 * hit rate:
 *
 *   NO OUTCOME != NEGATIVE OUTCOME
 *   UNRESOLVED != REFUTED
 *   UNRESOLVED PREDICTIONS NEVER ENTER A RATE
 *
 * A verdict additionally requires an evidence digest. An outcome that names a
 * result but cites no evidence is malformed input, not a verdict:
 *
 *   CLAIM WITHOUT EVIDENCE != VERDICT
 *
 * Digests are opaque: compared for equality only, never parsed, never decoded.
 *
 * THIS IS NOT A PERF MICROBENCHMARK. Timing and throughput fields have no
 * meaning here; wallMs-style fields are rejected as unknown rather than stored:
 *
 *   QUALITY EVAL != PERF MICROBENCHMARK
 *   NO TIMING FIELDS, NO THROUGHPUT FIELDS
 *
 * Probability meanings stay separate. Prediction confidences are the runtime's
 * own issued/calibrated confidences, scored as reported — not reinterpreted as
 * abstention probabilities, error rates, or calibration inputs:
 *
 *   ISSUED CONFIDENCE != ABSTAIN PROBABILITY
 *   NO Brier/NLL/ECE HERE; THAT MODULE OWNS THOSE METRICS
 */

export type LabProblemCode =
  | "LAB_INVALID_INPUT"
  | "LAB_UNKNOWN_FIELD"
  | "LAB_BAD_DIGEST"
  | "LAB_BAD_CONFIDENCE"
  | "LAB_BAD_TIMESTAMP"
  | "LAB_UNKNOWN_HYPOTHESIS"
  | "LAB_DUPLICATE_ID"
  | "LAB_OUTCOME_WITHOUT_EVIDENCE"
  | "LAB_UNRESOLVED_REFERENCE";

export class LabError extends Error {
  readonly code: LabProblemCode;
  constructor(code: LabProblemCode, message: string) {
    super(message);
    this.name = "LabError";
    this.code = code;
  }
}

export type PredictionVerdict = "CONFIRMED" | "REFUTED" | "UNRESOLVED";
export type InterventionVerdict = "CONFIRMED" | "REFUTED" | "UNRESOLVED";

export interface LabHypothesis {
  hypothesisId: string;
  causeProperty: string;
  effectProperty: string;
  /**
   * The runtime's declared expected effect, as reported by the caller.
   * Compared for equality only — never parsed, never decoded.
   */
  effectValueDigest: string;
  /** The runtime's reported calibrated confidence, scored as reported. */
  calibratedConfidence: number;
}

export interface LabPrediction {
  predictionId: string;
  hypothesisId: string;
  entityId: string;
  expectedValueDigest: string;
  issuedConfidence: number;
  issuedAt: number;
  dueAt: number;
}

export interface LabOutcome {
  predictionId: string;
  observedValueDigest: string;
  /** Required: a result without evidence is malformed, not a verdict. */
  evidenceDigest: string;
  resolvedAt: number;
}

export interface LabIntervention {
  interventionId: string;
  causeProperty: string;
  causeValueDigest: string;
  /** Hypotheses the runtime's simulate() matched, as reported by the caller. */
  matchedHypothesisIds: string[];
  observedEffectDigest?: string;
  evidenceDigest?: string;
}

export interface WorldModelScenario {
  scenarioId: string;
  hypotheses: LabHypothesis[];
  predictions: LabPrediction[];
  outcomes: LabOutcome[];
  interventions: LabIntervention[];
  provenance: string;
}

export interface PredictionScore {
  predictionId: string;
  verdict: PredictionVerdict;
  /** Present only for CONFIRMED/REFUTED. */
  confidenceGap?: number;
}

export interface InterventionScore {
  interventionId: string;
  verdict: InterventionVerdict;
  matchedCount: number;
}

export interface HypothesisSupport {
  hypothesisId: string;
  support: number;
  counter: number;
}

/** Per-dimension quality. Each dimension stands alone; there is no composite. */
export interface LabQuality {
  /** Hit rate over resolved predictions only; null when none resolved. */
  predictionHitRate: number | null;
  /** Mean |issuedConfidence − outcome| over resolved predictions; null if none. */
  meanConfidenceGap: number | null;
  /** Confirm rate over resolved interventions; null when none resolved. */
  interventionConfirmRate: number | null;
  hypothesisSupport: HypothesisSupport[];
}

export interface ScenarioScore {
  scenarioId: string;
  predictions: PredictionScore[];
  interventions: InterventionScore[];
  quality: LabQuality;
  provenance: string;
}

const SCENARIO_FIELDS = ["scenarioId", "hypotheses", "predictions", "outcomes", "interventions", "provenance"] as const;
const HYPOTHESIS_FIELDS = ["hypothesisId", "causeProperty", "effectProperty", "effectValueDigest", "calibratedConfidence"] as const;
const PREDICTION_FIELDS = ["predictionId", "hypothesisId", "entityId", "expectedValueDigest", "issuedConfidence", "issuedAt", "dueAt"] as const;
const OUTCOME_FIELDS = ["predictionId", "observedValueDigest", "evidenceDigest", "resolvedAt"] as const;
const INTERVENTION_FIELDS = ["interventionId", "causeProperty", "causeValueDigest", "matchedHypothesisIds", "observedEffectDigest", "evidenceDigest"] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Digests are opaque identifiers: non-empty strings, compared for equality only. */
function assertDigest(value: unknown, path: string): string {
  if (!nonEmpty(value)) {
    throw new LabError("LAB_BAD_DIGEST", `${path} must be a non-empty digest string; digests are opaque and never parsed`);
  }
  return value;
}

function assertConfidence(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new LabError("LAB_BAD_CONFIDENCE", `${path} must be a finite number within [0, 1] as reported by the runtime`);
  }
  return value;
}

function assertTimestamp(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new LabError("LAB_BAD_TIMESTAMP", `${path} must be a finite non-negative timestamp`);
  }
  return value;
}

function rejectUnknown(record: Record<string, unknown>, allowed: readonly string[], path: string): void {
  for (const key of Object.keys(record)) {
    if (!(allowed as readonly string[]).includes(key)) {
      throw new LabError("LAB_UNKNOWN_FIELD", `unknown ${path} field ${key}`);
    }
  }
}

function assertHypothesis(value: unknown, index: number): LabHypothesis {
  if (!isPlainObject(value)) throw new LabError("LAB_INVALID_INPUT", `hypotheses[${index}] must be an object`);
  rejectUnknown(value, HYPOTHESIS_FIELDS, "hypothesis");
  if (!nonEmpty(value.hypothesisId) || !nonEmpty(value.causeProperty) || !nonEmpty(value.effectProperty)) {
    throw new LabError("LAB_INVALID_INPUT", `hypotheses[${index}] needs non-empty hypothesisId, causeProperty and effectProperty`);
  }
  return {
    hypothesisId: value.hypothesisId,
    causeProperty: value.causeProperty,
    effectProperty: value.effectProperty,
    effectValueDigest: assertDigest(value.effectValueDigest, `hypotheses[${index}].effectValueDigest`),
    calibratedConfidence: assertConfidence(value.calibratedConfidence, `hypotheses[${index}].calibratedConfidence`),
  };
}

function assertPrediction(value: unknown, index: number, hypothesisIds: Set<string>): LabPrediction {
  if (!isPlainObject(value)) throw new LabError("LAB_INVALID_INPUT", `predictions[${index}] must be an object`);
  rejectUnknown(value, PREDICTION_FIELDS, "prediction");
  if (!nonEmpty(value.predictionId) || !nonEmpty(value.hypothesisId) || !nonEmpty(value.entityId)) {
    throw new LabError("LAB_INVALID_INPUT", `predictions[${index}] needs non-empty predictionId, hypothesisId and entityId`);
  }
  if (!hypothesisIds.has(value.hypothesisId)) {
    throw new LabError("LAB_UNKNOWN_HYPOTHESIS", `predictions[${index}] names unknown hypothesis ${value.hypothesisId}`);
  }
  const issuedAt = assertTimestamp(value.issuedAt, `predictions[${index}].issuedAt`);
  const dueAt = assertTimestamp(value.dueAt, `predictions[${index}].dueAt`);
  if (!(dueAt > issuedAt)) {
    throw new LabError("LAB_BAD_TIMESTAMP", `predictions[${index}] requires dueAt after issuedAt`);
  }
  return {
    predictionId: value.predictionId,
    hypothesisId: value.hypothesisId,
    entityId: value.entityId,
    expectedValueDigest: assertDigest(value.expectedValueDigest, `predictions[${index}].expectedValueDigest`),
    issuedConfidence: assertConfidence(value.issuedConfidence, `predictions[${index}].issuedConfidence`),
    issuedAt,
    dueAt,
  };
}

function assertOutcome(value: unknown, index: number, predictionById: Map<string, LabPrediction>): LabOutcome {
  if (!isPlainObject(value)) throw new LabError("LAB_INVALID_INPUT", `outcomes[${index}] must be an object`);
  rejectUnknown(value, OUTCOME_FIELDS, "outcome");
  if (!nonEmpty(value.predictionId)) {
    throw new LabError("LAB_INVALID_INPUT", `outcomes[${index}] needs a non-empty predictionId`);
  }
  const prediction = predictionById.get(value.predictionId);
  if (prediction === undefined) {
    throw new LabError("LAB_UNRESOLVED_REFERENCE", `outcomes[${index}] names unknown prediction ${value.predictionId}`);
  }
  // Evidence is mandatory: a result without evidence is malformed input, and
  // the lab refuses to turn it into a verdict either way.
  if (!nonEmpty(value.evidenceDigest)) {
    throw new LabError("LAB_OUTCOME_WITHOUT_EVIDENCE", `outcomes[${index}] cites no evidence: a result without evidence is malformed, not a verdict`);
  }
  const resolvedAt = assertTimestamp(value.resolvedAt, `outcomes[${index}].resolvedAt`);
  if (resolvedAt < prediction.issuedAt) {
    throw new LabError("LAB_BAD_TIMESTAMP", `outcomes[${index}] resolves before the prediction was issued`);
  }
  return {
    predictionId: value.predictionId,
    observedValueDigest: assertDigest(value.observedValueDigest, `outcomes[${index}].observedValueDigest`),
    evidenceDigest: value.evidenceDigest,
    resolvedAt,
  };
}

function assertIntervention(
  value: unknown,
  index: number,
  hypothesisIds: Set<string>,
): LabIntervention {
  if (!isPlainObject(value)) throw new LabError("LAB_INVALID_INPUT", `interventions[${index}] must be an object`);
  rejectUnknown(value, INTERVENTION_FIELDS, "intervention");
  if (!nonEmpty(value.interventionId) || !nonEmpty(value.causeProperty)) {
    throw new LabError("LAB_INVALID_INPUT", `interventions[${index}] needs non-empty interventionId and causeProperty`);
  }
  if (!Array.isArray(value.matchedHypothesisIds) || value.matchedHypothesisIds.some((id) => !nonEmpty(id))) {
    throw new LabError("LAB_INVALID_INPUT", `interventions[${index}] matchedHypothesisIds must be an array of non-empty strings`);
  }
  for (const id of value.matchedHypothesisIds as string[]) {
    if (!hypothesisIds.has(id)) {
      throw new LabError("LAB_UNKNOWN_HYPOTHESIS", `interventions[${index}] matches unknown hypothesis ${id}`);
    }
  }
  const observed = value.observedEffectDigest;
  const evidence = value.evidenceDigest;
  // Half an observation is malformed: an effect without evidence, or evidence
  // with no effect, cannot become a verdict in either direction.
  if ((observed === undefined) !== (evidence === undefined)) {
    throw new LabError(
      "LAB_OUTCOME_WITHOUT_EVIDENCE",
      `interventions[${index}] supplies an effect without evidence or evidence without an effect: half an observation is malformed, not a verdict`,
    );
  }
  if (observed !== undefined && !nonEmpty(observed)) {
    throw new LabError("LAB_INVALID_INPUT", `interventions[${index}] observedEffectDigest must be non-empty`);
  }
  if (evidence !== undefined && !nonEmpty(evidence)) {
    throw new LabError("LAB_INVALID_INPUT", `interventions[${index}] evidenceDigest must be non-empty`);
  }
  return {
    interventionId: value.interventionId,
    causeProperty: value.causeProperty,
    causeValueDigest: assertDigest(value.causeValueDigest, `interventions[${index}].causeValueDigest`),
    matchedHypothesisIds: [...(value.matchedHypothesisIds as string[])].sort(),
    ...(observed === undefined ? {} : { observedEffectDigest: observed as string }),
    ...(evidence === undefined ? {} : { evidenceDigest: evidence as string }),
  };
}

function assertUniqueIds(ids: string[], kind: string): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) throw new LabError("LAB_DUPLICATE_ID", `duplicate ${kind} id ${id}`);
    seen.add(id);
  }
}

function assertScenarioShape(value: unknown): {
  scenario: WorldModelScenario;
  predictionById: Map<string, LabPrediction>;
} {
  if (!isPlainObject(value)) throw new LabError("LAB_INVALID_INPUT", "scenario must be an object");
  rejectUnknown(value, SCENARIO_FIELDS, "scenario");
  if (!nonEmpty(value.scenarioId)) throw new LabError("LAB_INVALID_INPUT", "scenarioId must be non-empty");
  if (!nonEmpty(value.provenance)) throw new LabError("LAB_INVALID_INPUT", "provenance must be a non-empty string");
  for (const field of ["hypotheses", "predictions", "outcomes", "interventions"] as const) {
    if (!Array.isArray(value[field])) {
      throw new LabError("LAB_INVALID_INPUT", `${field} must be an array`);
    }
  }
  const hypotheses = (value.hypotheses as unknown[]).map(assertHypothesis);
  assertUniqueIds(hypotheses.map((h) => h.hypothesisId), "hypothesis");
  const hypothesisIds = new Set(hypotheses.map((h) => h.hypothesisId));
  const predictions = (value.predictions as unknown[]).map((p, i) => assertPrediction(p, i, hypothesisIds));
  assertUniqueIds(predictions.map((p) => p.predictionId), "prediction");
  const predictionById = new Map(predictions.map((p) => [p.predictionId, p] as const));
  const outcomes = (value.outcomes as unknown[]).map((o, i) => assertOutcome(o, i, predictionById));
  assertUniqueIds(outcomes.map((o) => o.predictionId), "outcome");
  const interventions = (value.interventions as unknown[]).map((v, i) => assertIntervention(v, i, hypothesisIds));
  assertUniqueIds(interventions.map((v) => v.interventionId), "intervention");
  return {
    scenario: {
      scenarioId: value.scenarioId as string,
      hypotheses,
      predictions,
      outcomes,
      interventions,
      provenance: value.provenance as string,
    },
    predictionById,
  };
}

/**
 * Score one scenario. Pure: reads the supplied trace, returns a new report,
 * mutates nothing — including the caller's arrays.
 */
export function scoreScenario(input: unknown): ScenarioScore {
  const { scenario, predictionById } = assertScenarioShape(input);
  const outcomeByPrediction = new Map(scenario.outcomes.map((o) => [o.predictionId, o] as const));

  const predictions: PredictionScore[] = scenario.predictions.map((prediction) => {
    const outcome = outcomeByPrediction.get(prediction.predictionId);
    // No outcome supplied: UNRESOLVED. Never confirmed, never refuted, and
    // never counted in a rate below.
    if (outcome === undefined) {
      return { predictionId: prediction.predictionId, verdict: "UNRESOLVED" as const };
    }
    const hit = outcome.observedValueDigest === prediction.expectedValueDigest ? 1 : 0;
    return {
      predictionId: prediction.predictionId,
      verdict: (hit === 1 ? "CONFIRMED" : "REFUTED") as PredictionVerdict,
      confidenceGap: Math.abs(prediction.issuedConfidence - hit),
    };
  });

  const effectByHypothesis = new Map(scenario.hypotheses.map((h) => [h.hypothesisId, h.effectValueDigest] as const));
  const interventions: InterventionScore[] = scenario.interventions.map((intervention) => {
    // No observed effect supplied: UNRESOLVED. Never a verdict either way.
    if (intervention.observedEffectDigest === undefined) {
      return { interventionId: intervention.interventionId, verdict: "UNRESOLVED" as const, matchedCount: intervention.matchedHypothesisIds.length };
    }
    // The observed effect is compared for equality against the declared
    // expected effects of the matched hypotheses — the same digest comparison
    // the runtime itself performs. CONFIRMED iff at least one matched
    // hypothesis expected exactly the observed effect.
    const matches = intervention.matchedHypothesisIds.some(
      (id) => effectByHypothesis.get(id) === intervention.observedEffectDigest,
    );
    return {
      interventionId: intervention.interventionId,
      verdict: (matches ? "CONFIRMED" : "REFUTED") as InterventionVerdict,
      matchedCount: intervention.matchedHypothesisIds.length,
    };
  });

  const resolved = predictions.filter((p) => p.verdict !== "UNRESOLVED");
  const hits = resolved.filter((p) => p.verdict === "CONFIRMED").length;
  const gaps = resolved.map((p) => p.confidenceGap ?? 0);
  const resolvedInterventions = interventions.filter((v) => v.verdict !== "UNRESOLVED");
  const confirmedInterventions = resolvedInterventions.filter((v) => v.verdict === "CONFIRMED").length;

  const support = new Map<string, { support: number; counter: number }>();
  for (const h of scenario.hypotheses) support.set(h.hypothesisId, { support: 0, counter: 0 });
  for (const outcome of scenario.outcomes) {
    const prediction = predictionById.get(outcome.predictionId)!;
    const entry = support.get(prediction.hypothesisId)!;
    if (outcome.observedValueDigest === prediction.expectedValueDigest) entry.support += 1;
    else entry.counter += 1;
  }

  return {
    scenarioId: scenario.scenarioId,
    predictions: [...predictions].sort((a, b) => (a.predictionId < b.predictionId ? -1 : 1)),
    interventions: [...interventions].sort((a, b) => (a.interventionId < b.interventionId ? -1 : 1)),
    quality: {
      predictionHitRate: resolved.length === 0 ? null : hits / resolved.length,
      meanConfidenceGap: resolved.length === 0 ? null : gaps.reduce((s, g) => s + g, 0) / gaps.length,
      interventionConfirmRate: resolvedInterventions.length === 0 ? null : confirmedInterventions / resolvedInterventions.length,
      hypothesisSupport: [...support.entries()]
        .map(([hypothesisId, counts]) => ({ hypothesisId, ...counts }))
        .sort((a, b) => (a.hypothesisId < b.hypothesisId ? -1 : 1)),
    },
    provenance: scenario.provenance,
  };
}
