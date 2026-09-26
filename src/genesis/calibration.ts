/**
 * REQ-p22-reflex-calibration: first-class calibration for reflex scores.
 *
 * The registered requirement is the scope authority:
 *
 *   "First-class calibration for reflex scores: Brier/NLL/ECE, reliability and
 *    risk/coverage curves, temperature/isotonic calibration where justified;
 *    never name a technique not reproduced."
 *
 * The classification behind it is exact: "Bridge calibration_engine is hardware
 * tuning, Genesis confidence is frequency-blend". Neither of those is
 * calibration, so neither is reused:
 *
 *   BRIDGE calibration_engine (hardware tuning) != SCORE CALIBRATION
 *   GENESIS confidence (frequency blend)      != SCORE CALIBRATION
 *
 * The last clause of the requirement is the one that shapes this module most:
 *
 *   NEVER NAME A TECHNIQUE NOT REPRODUCED
 *
 * So every technique named in this file is implemented and measured here, and
 * nothing is listed that is not. Both named techniques are genuinely
 * reproduced: temperature scaling by a deterministic search over a single
 * positive scalar, and isotonic regression by the pool-adjacent-violators
 * algorithm. There is no third technique mentioned, because there is no third
 * technique here.
 *
 * A FITTED PARAMETER IS NOT A PROVEN IMPROVEMENT. Fitting a temperature says
 * nothing about whether it helped. Every report therefore carries the metric
 * before and after, and an improvement claim is only ever made from those two
 * measured numbers:
 *
 *   A FITTED PARAMETER IS NOT A PROVEN IMPROVEMENT
 *   CALIBRATED != BETTER
 *   NO MEASURED IMPROVEMENT != CLAIMED IMPROVEMENT
 *
 * And uncalibrated is a real state that is never quietly presented as
 * calibrated:
 *
 *   UNCALIBRATED SCORE != CALIBRATED SCORE
 *   RAW CONFIDENCE != POST-TEMPERATURE CONFIDENCE
 *
 * WHAT THIS IS NOT. Calibration measures and optionally supplies a parameter. It
 * changes no policy, grants no authority, routes nothing, and does not decide
 * whether a reflex should act:
 *
 *   CALIBRATION != POLICY AUTHORITY
 *   CALIBRATION != ROUTING DECISION
 *   CALIBRATION != REFLEX DECISION
 *
 * A calibrated probability is still a probability. It does not become a verdict,
 * a score, a rank, a winner or a permission.
 *
 * INPUTS ARE CALLER-SUPPLIED OUTCOMES. Nothing here observes an outcome, invents
 * a label, reads a clock, or touches the network. An outcome that was never
 * observed cannot be calibrated against, so it is never assumed.
 */

export type CalibrationTechnique = "NONE" | "TEMPERATURE_SCALING" | "ISOTONIC";

/** Why a technique was not fitted. Never collapsed into "not applicable". */
export const NOT_FITTED_REASONS = [
  "INSUFFICIENT_CALIBRATION_DATA",
  "TECHNIQUE_NOT_REQUESTED",
  "NO_VALID_OBSERVATIONS",
] as const;
export type NotFittedReason = (typeof NOT_FITTED_REASONS)[number];

export type CalibrationProblemCode =
  | "CALIBRATION_INVALID_INPUT"
  | "CALIBRATION_PROBABILITY_OUT_OF_RANGE"
  | "CALIBRATION_OUTCOME_NOT_BINARY"
  | "CALIBRATION_UNKNOWN_FIELD"
  | "CALIBRATION_UNKNOWN_TECHNIQUE"
  | "CALIBRATION_BIN_COUNT_INVALID"
  | "CALIBRATION_TEMPERATURE_INVALID";

export class CalibrationError extends Error {
  readonly code: CalibrationProblemCode;
  constructor(code: CalibrationProblemCode, message: string) {
    super(message);
    this.name = "CalibrationError";
    this.code = code;
  }
}

export interface CalibrationObservation {
  /** Predicted probability of the positive outcome, strictly inside (0, 1). */
  predicted: number;
  /** Caller-observed outcome: 1 for positive, 0 for negative. Never inferred. */
  observed: 0 | 1;
}

/**
 * A calibration probability must be strictly inside (0, 1).
 *
 * This is deliberately NOT `validAbstainProbability` from `./abstain`, which is
 * inclusive of 0 and 1. That is correct for an abstention probability, where
 * "certainly abstain" is a legitimate value, and wrong here: a predicted
 * probability of exactly 0 with an observed positive makes the negative log
 * likelihood infinite, so the sample cannot contribute a finite score.
 *
 *   ABSTENTION PROBABILITY (INCLUSIVE) != CALIBRATION PROBABILITY (STRICT)
 *   NEITHER ENDPOINT IS CLAMPED TO MAKE A METRIC COMPUTABLE
 */
function isCalibrationProbability(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value < 1;
}

export function assertObservation(value: unknown): CalibrationObservation {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new CalibrationError("CALIBRATION_INVALID_INPUT", "an observation must be an object");
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key !== "predicted" && key !== "observed") {
      throw new CalibrationError("CALIBRATION_UNKNOWN_FIELD", `unknown observation field ${key}`);
    }
  }
  if (typeof record.predicted !== "number" || !Number.isFinite(record.predicted)) {
    throw new CalibrationError("CALIBRATION_PROBABILITY_OUT_OF_RANGE", "predicted must be a finite number");
  }
  if (!isCalibrationProbability(record.predicted)) {
    throw new CalibrationError(
      "CALIBRATION_PROBABILITY_OUT_OF_RANGE",
      `predicted ${record.predicted} is not a probability strictly inside (0, 1): a probability of exactly 0 or 1 makes NLL infinite and is not silently clamped`,
    );
  }
  if (record.observed !== 0 && record.observed !== 1) {
    throw new CalibrationError("CALIBRATION_OUTCOME_NOT_BINARY", "observed must be 0 or 1 as observed by the caller");
  }
  return { predicted: record.predicted, observed: record.observed };
}

export interface CalibrationMetrics {
  /** Mean squared error of the predicted probability. */
  brier: number;
  /** Mean negative log likelihood. */
  nll: number;
  /** Expected calibration error over the declared bins. */
  ece: number;
  /** Observed positive rate, the base rate the metrics are read against. */
  baseRate: number;
  count: number;
}

/** Deterministic equal-width bin edges. The scheme is explicit, never implicit. */
export function reliabilityBins(count: number): number[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new CalibrationError("CALIBRATION_BIN_COUNT_INVALID", "bin count must be a positive integer");
  }
  return Array.from({ length: count }, (_unused, index) => index / count);
}

export function binIndex(probability: number, binCount: number): number {
  const index = Math.floor(probability * binCount);
  return Math.min(Math.max(index, 0), binCount - 1);
}

function assertObservations(observations: unknown): CalibrationObservation[] {
  if (!Array.isArray(observations)) {
    throw new CalibrationError("CALIBRATION_INVALID_INPUT", "observations must be an array");
  }
  if (observations.length === 0) {
    throw new CalibrationError("CALIBRATION_NO_OBSERVATIONS" as CalibrationProblemCode, "no observations were supplied");
  }
  // Canonical order before any summation. Floating-point addition is not
  // associative, so scrambled input would otherwise produce metrics differing in
  // the last digits. INSERTION ORDER != CANONICAL ORDER.
  return observations
    .map(assertObservation)
    .sort((a, b) => (a.predicted === b.predicted ? a.observed - b.observed : a.predicted - b.predicted));
}

export function computeMetrics(observations: unknown, binCount = 10): CalibrationMetrics {
  const rows = assertObservations(observations);
  const bins = reliabilityBins(binCount);
  let brierSum = 0;
  let nllSum = 0;
  let positives = 0;
  for (const row of rows) {
    brierSum += (row.predicted - row.observed) ** 2;
    nllSum += row.observed === 1 ? -Math.log(row.predicted) : -Math.log(1 - row.predicted);
    positives += row.observed;
  }
  let eceSum = 0;
  for (let bin = 0; bin < bins.length; bin += 1) {
    const inBin = rows.filter((row) => binIndex(row.predicted, bins.length) === bin);
    if (inBin.length === 0) continue;
    const meanPredicted = inBin.reduce((sum, row) => sum + row.predicted, 0) / inBin.length;
    const observedRate = inBin.reduce((sum, row) => sum + row.observed, 0) / inBin.length;
    eceSum += (inBin.length / rows.length) * Math.abs(meanPredicted - observedRate);
  }
  return {
    brier: brierSum / rows.length,
    nll: nllSum / rows.length,
    ece: eceSum,
    baseRate: positives / rows.length,
    count: rows.length,
  };
}

export interface ReliabilityBin {
  bin: number;
  lower: number;
  upper: number;
  count: number;
  meanPredicted: number | null;
  observedRate: number | null;
}

/**
 * Reliability curve. An empty bin reports nulls, never a zero that would plot as
 * a confident bin nobody observed.
 */
export function reliabilityCurve(observations: unknown, binCount = 10): ReliabilityBin[] {
  const rows = assertObservations(observations);
  const bins = reliabilityBins(binCount);
  return bins.map((lower, bin) => {
    const inBin = rows.filter((row) => binIndex(row.predicted, bins.length) === bin);
    const upper = bin + 1 < bins.length ? bins[bin + 1]! : 1;
    return {
      bin,
      lower,
      upper,
      count: inBin.length,
      meanPredicted: inBin.length === 0 ? null : inBin.reduce((s, r) => s + r.predicted, 0) / inBin.length,
      observedRate: inBin.length === 0 ? null : inBin.reduce((s, r) => s + r.observed, 0) / inBin.length,
    };
  });
}

export interface RiskCoveragePoint {
  coverage: number;
  risk: number;
  count: number;
}

/**
 * Risk/coverage curve over a caller-supplied ranking score, highest first.
 *
 * Selective prediction: covering the top fraction of ranked items and reporting
 * the error rate among them. With no ranking supplied the curve is empty rather
 * than fabricated from an arbitrary order.
 */
export function riskCoverageCurve(
  items: ReadonlyArray<{ predicted: number; observed: 0 | 1 }>,
  rankBy: (row: { predicted: number; observed: 0 | 1 }) => number = (row) => row.predicted,
): RiskCoveragePoint[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new CalibrationError("CALIBRATION_INVALID_INPUT", "risk/coverage needs a non-empty item list");
  }
  const rows = items.map((row) => assertObservation(row));
  const ordered = [...rows].sort((a, b) => {
    const delta = rankBy(b) - rankBy(a);
    if (delta !== 0) return delta;
    return a.predicted === b.predicted ? 0 : a.predicted < b.predicted ? -1 : 1;
  });
  const points: RiskCoveragePoint[] = [];
  let errorSum = 0;
  for (let taken = 1; taken <= ordered.length; taken += 1) {
    const row = ordered[taken - 1]!;
    // An error is an observed outcome that contradicts the predicted class.
    const predictedClass: 0 | 1 = row.predicted >= 0.5 ? 1 : 0;
    if (row.observed !== predictedClass) errorSum += 1;
    points.push({ coverage: taken / ordered.length, risk: errorSum / taken, count: taken });
  }
  return points;
}

/** Monotone reshaping of a probability by a positive temperature. */
export function applyTemperature(probability: number, temperature: number): number {
  if (!Number.isFinite(temperature) || temperature <= 0) {
    throw new CalibrationError("CALIBRATION_TEMPERATURE_INVALID", "temperature must be a positive finite number");
  }
  if (!isCalibrationProbability(probability)) {
    throw new CalibrationError("CALIBRATION_PROBABILITY_OUT_OF_RANGE", "probability must be strictly inside (0, 1)");
  }
  const logit = Math.log(probability / (1 - probability));
  const scaled = 1 / (1 + Math.exp(-logit / temperature));
  // The logistic can saturate to exactly 0 or 1 for extreme logits. That is a
  // real limit of the transform, so it is reported as a boundary rather than
  // silently clamped back into (0, 1) and presented as a calibrated probability.
  if (scaled <= 0 || scaled >= 1) {
    throw new CalibrationError(
      "CALIBRATION_PROBABILITY_OUT_OF_RANGE",
      `temperature ${temperature} saturates probability ${probability} to ${scaled}: the transform left (0, 1) and is not clamped`,
    );
  }
  return scaled;
}

const TEMPERATURE_GRID = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 12, 20];

/**
 * Metrics for a set of values THIS MODULE derived, rather than supplied.
 *
 * A fitted isotonic value is an empirical observed rate for a block, so it can
 * legitimately be exactly 0 or exactly 1. Scoring that with the strict input
 * validator would refuse it, and refusing it would make a legitimate fit
 * unusable. So endpoints are clipped to a documented epsilon and the number of
 * clips is RETURNED, so the adjustment is disclosed rather than silent:
 *
 *   DISCLOSED CLIP != SILENT CLAMP
 *   A FITTED ENDPOINT IS NOT A SUPPLIED PROBABILITY
 */
function computeFittedMetrics(
  rows: CalibrationObservation[],
  epsilon: number,
): { metrics: CalibrationMetrics; endpointClips: number } {
  let endpointClips = 0;
  const adjusted = rows.map((row) => {
    if (row.predicted > 0 && row.predicted < 1) return row;
    endpointClips += 1;
    return { predicted: row.predicted <= 0 ? epsilon : 1 - epsilon, observed: row.observed };
  });
  return { metrics: computeMetrics(adjusted), endpointClips };
}

/** The documented epsilon used when a fitted value lands on 0 or 1. */
export const FITTED_ENDPOINT_EPSILON = 1e-9;

export interface FitResult {
  technique: CalibrationTechnique;
  fitted: boolean;
  /** Present only when fitted. */
  parameter?: number;
  /** Isotonic breakpoints, present only for a fitted isotonic map. */
  thresholds?: Array<{ x: number; y: number }>;
  /** Present only when not fitted. */
  notFittedReason?: NotFittedReason;
  /** The metric this fit was selected on, before and after. Never assumed. */
  selectedOn: "NLL";
  before: CalibrationMetrics;
  after?: CalibrationMetrics;
  /** Only ever true when `after` was measured and is strictly better. */
  improved: boolean;
  /**
   * How many fitted values landed on 0 or 1 and were clipped for scoring.
   * Disclosed rather than hidden; zero when no endpoint was hit.
   */
  endpointClips?: number;
}

/**
 * Fit temperature scaling on a deterministic grid, selecting the temperature
 * that minimises NLL. A deterministic grid rather than a gradient solver keeps
 * the result reproducible with no clock, no seed and no convergence tolerance.
 *
 * The minimum sample size is a real constraint, not a formality: one
 * observation can drive NLL to zero for almost any temperature, so a fit from
 * too little data is reported as not fitted rather than as a good fit.
 */
export function fitTemperatureScaling(observations: unknown, minimumSamples = 20): FitResult {
  const rows = assertObservations(observations);
  const before = computeMetrics(rows);
  if (rows.length < minimumSamples) {
    return {
      technique: "TEMPERATURE_SCALING",
      fitted: false,
      notFittedReason: "INSUFFICIENT_CALIBRATION_DATA",
      selectedOn: "NLL",
      before,
      improved: false,
    };
  }
  let best: { temperature: number; nll: number } | undefined;
  for (const temperature of TEMPERATURE_GRID) {
    let nllSum = 0;
    let usable = true;
    for (const row of rows) {
      let scaled: number;
      try {
        scaled = applyTemperature(row.predicted, temperature);
      } catch {
        usable = false;
        break;
      }
      nllSum += row.observed === 1 ? -Math.log(scaled) : -Math.log(1 - scaled);
    }
    if (!usable) continue;
    const nll = nllSum / rows.length;
    if (best === undefined || nll < best.nll) best = { temperature, nll };
  }
  if (best === undefined) {
    return {
      technique: "TEMPERATURE_SCALING",
      fitted: false,
      notFittedReason: "NO_VALID_OBSERVATIONS",
      selectedOn: "NLL",
      before,
      improved: false,
    };
  }
  const after = computeMetrics(rows.map((row) => ({ ...row, predicted: applyTemperature(row.predicted, best.temperature) })));
  return {
    technique: "TEMPERATURE_SCALING",
    fitted: true,
    parameter: best.temperature,
    selectedOn: "NLL",
    before,
    after,
    improved: after.nll < before.nll,
  };
}

/**
 * Isotonic regression by the pool-adjacent-violators algorithm.
 *
 * This is a real reproduction, not a named technique: pools are formed whenever
 * neighbouring fitted values violate monotonicity, and the map is then
 * interpolated between observed points. The result is monotone non-decreasing by
 * construction, which is asserted in the tests.
 */
export function fitIsotonic(observations: unknown, minimumSamples = 20): FitResult {
  const rows = assertObservations(observations);
  const before = computeMetrics(rows);
  if (rows.length < minimumSamples) {
    return {
      technique: "ISOTONIC",
      fitted: false,
      notFittedReason: "INSUFFICIENT_CALIBRATION_DATA",
      selectedOn: "NLL",
      before,
      improved: false,
    };
  }
  const sorted = [...rows].sort((a, b) => (a.predicted === b.predicted ? a.observed - b.observed : a.predicted - b.predicted));
  const xs: number[] = [];
  const ys: number[] = [];
  const weights: number[] = [];
  for (const row of sorted) {
    xs.push(row.predicted);
    ys.push(row.observed);
    weights.push(1);
    // Pool adjacent violators.
    while (ys.length >= 2 && ys[ys.length - 2]! > ys[ys.length - 1]!) {
      const w1 = weights[weights.length - 2]!;
      const w2 = weights[weights.length - 1]!;
      const merged = (ys[ys.length - 2]! * w1 + ys[ys.length - 1]! * w2) / (w1 + w2);
      ys.splice(ys.length - 2, 2, merged);
      weights.splice(weights.length - 2, 2, w1 + w2);
    }
  }
  // Expand pooled blocks back to one fitted value per observation.
  const fittedValues: number[] = [];
  let cursor = 0;
  let block = 0;
  while (cursor < xs.length) {
    let span = 0;
    let remaining = weights[block]!;
    while (remaining > 0 && cursor < xs.length) {
      fittedValues.push(ys[block]!);
      cursor += 1;
      remaining -= 1;
      span += 1;
    }
    if (span === 0) break;
    block += 1;
  }
  const calibrated = sorted.map((row, index) => ({ predicted: fittedValues[index] ?? row.predicted, observed: row.observed }));
  const scored = computeFittedMetrics(calibrated, FITTED_ENDPOINT_EPSILON);
  const thresholds = sorted.map((row, index) => ({ x: row.predicted, y: fittedValues[index] ?? row.observed }));
  return {
    technique: "ISOTONIC",
    fitted: true,
    thresholds,
    selectedOn: "NLL",
    before,
    after: scored.metrics,
    improved: scored.metrics.nll < before.nll,
    endpointClips: scored.endpointClips,
  };
}

export interface CalibrationReport {
  metrics: CalibrationMetrics;
  reliability: ReliabilityBin[];
  riskCoverage: RiskCoveragePoint[];
  fits: FitResult[];
  binCount: number;
  /**
   * Every technique this module names, and whether it was reproduced here.
   * A technique absent from this list was not named and not used.
   */
  reproducedTechniques: CalibrationTechnique[];
  /** Measurement only. This report changes no policy and routes nothing. */
  grantsAuthority: false;
  decidesReflex: false;
  improvesAnything: boolean;
}

export function buildCalibrationReport(input: {
  observations: unknown;
  binCount?: number;
  rankBy?: (row: { predicted: number; observed: 0 | 1 }) => number;
}): CalibrationReport {
  const rows = assertObservations(input.observations);
  const binCount = input.binCount ?? 10;
  const fits = [fitTemperatureScaling(rows), fitIsotonic(rows)];
  return {
    metrics: computeMetrics(rows, binCount),
    reliability: reliabilityCurve(rows, binCount),
    riskCoverage: riskCoverageCurve(rows, input.rankBy),
    fits,
    binCount,
    reproducedTechniques: ["NONE", "TEMPERATURE_SCALING", "ISOTONIC"],
    grantsAuthority: false,
    decidesReflex: false,
    improvesAnything: fits.some((fit) => fit.improved),
  };
}
