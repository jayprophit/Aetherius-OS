import { stableStringify } from "../workflows/promotion";

/**
 * REQ-p18-superposition-lab: representation superposition x quantization
 * interaction. EXPERIMENTAL / STUDY_ONLY evaluation lane.
 *
 * The registered requirement is the authority for scope, and it reads:
 *
 *   "Isolated STUDY_ONLY eval lane for superposition/quantization
 *    interaction (feature capacity, interference, width, sparsity,
 *    accuracy, memory, energy); never in the routing path, never a
 *    production dependency."
 *
 * SOURCE HONESTY. The registered source is a RESEARCH_NOTE reference
 * ("representation research", "research addendum post-checkpoint
 * 2026-09-23"). No primary paper document exists in this repository, and
 * none is cited by the requirement. Therefore:
 *
 *   SOURCE CLAIM        = UNAVAILABLE (research-note reference only)
 *   AETHERIUS MECHANISM = defined below, as an explicit analytical
 *                         construction, attributed to standard
 *                         representation-superposition mathematics
 *   AETHERIUS MEASUREMENT = whatever the deterministic run below computes
 *
 * Nothing here reproduces a paper result, and nothing here claims scaling,
 * robustness or superiority.
 *
 * MECHANISM (analytical, defined here). A representation stores `features`
 * binary feature directions in `width` dimensions. When
 * features <= width each feature gets its own dimension and interference is
 * exactly zero. When features > width the features are PACKED: each
 * dimension sums ceil(features/width) features, so features must share
 * directions and interfere. Quantization then rounds each stored dimension
 * to `bits` bits, which adds collision error on top of packing error. The
 * interaction being studied is precisely packing x rounding.
 *
 * This is the mathematical/neural sense of "superposition" (packed feature
 * directions sharing representational capacity). It is NOT quantum
 * superposition, NOT mixture-of-experts routing, NOT ensembling, NOT model
 * merging and NOT BitNet/ternary compute; see the BitNet boundary in
 * docs/superposition-lab.md.
 *
 * BOUNDARIES (enforced, not merely documented):
 *
 *   EXPERIMENT != PRODUCTION ARCHITECTURE
 *   SUPERPOSITION LAB != MODEL FABRIC
 *   SUPERPOSITION LAB != GENESIS / REFLEX
 *   SOURCE CLAIM != LOCAL RESULT
 *   LOCAL RESULT != GENERAL PROOF
 *   REPRESENTATION SUPERPOSITION != QUANTUM SUPERPOSITION
 *   TOY EXPERIMENT != PRODUCTION BENCHMARK
 *   UNKNOWN METRIC != ZERO
 *   NO CLEAN COMPARISON != CLEAN RESULT
 *
 * This module is a pure, deterministic function of its inputs. It performs
 * no network access, downloads no model or dataset, calls no provider,
 * holds no credentials, mutates no routing state and starts no service. It
 * is not imported by any production routing path.
 */

/** Mandatory STUDY_ONLY marking, mirroring src/programme/doeMapping.ts. */
export const LAB_STUDY_ONLY = true;

/** What the registered source actually provides. */
export const SOURCE_CLAIM_STATUS = "UNAVAILABLE_RESEARCH_NOTE_REFERENCE_ONLY";

/**
 * The seven metrics named by the registered requirement. This is NOT the
 * provider-benchmark vocabulary in src/providers/benchmarks.ts (which holds
 * latency/throughput/tool_success/... and is validated by isValidMetric):
 * these are representation metrics, and the shared vocabulary is not
 * widened to absorb them.
 */
export const LAB_METRICS = [
  "feature_capacity",
  "interference",
  "width",
  "sparsity",
  "accuracy",
  "memory",
  "energy",
] as const;
export type LabMetric = (typeof LAB_METRICS)[number];

/**
 * Per-metric provenance. This is the mechanism that prevents a fabricated
 * number from being reported as a measurement:
 *
 *   ANALYTIC    = computed from declared dimensions by closed-form
 *                 arithmetic (a model of the quantity, not a measurement)
 *   MEASURED    = actually computed by running the deterministic task below
 *   UNAVAILABLE = this repository cannot measure it; reported as absent
 *
 * `energy` is always UNAVAILABLE: the only hardware measurement in this
 * repository is src/providers/hardwareProbe.ts, which times an FP32 CPU
 * matmul. There is no energy measurement anywhere, so an energy number here
 * would be invented. UNKNOWN != ZERO.
 */
export type MetricProvenance = "ANALYTIC" | "MEASURED" | "UNAVAILABLE";

export interface LabVariant {
  variantId: string;
  /** false = dense baseline (one feature per dimension). */
  superposition: boolean;
  /** Bits per stored dimension. */
  bits: number;
  features: number;
  width: number;
}

export interface LabObservation {
  variantId: string;
  runIndex: number;
  seed: number;
  /** Null means the metric was not measured; never zero-filled. */
  metrics: Record<LabMetric, number | null>;
  provenance: Record<LabMetric, MetricProvenance>;
  notes: string[];
}

export interface MetricDelta {
  metric: LabMetric;
  baseline: number | null;
  experimental: number | null;
  /** experimental - baseline, or null when either side is unmeasured. */
  delta: number | null;
  provenance: MetricProvenance;
}

export interface ConfoundedRun {
  variantId: string;
  runIndex: number;
  reasons: string[];
}

export interface SuperpositionComparison {
  experimentId: string;
  baselineVariantId: string;
  experimentalVariantId: string;
  /** False when any run was confounded or no clean pair exists. */
  comparable: boolean;
  incomparabilityReasons: string[];
  /** Independent variables: the only things allowed to differ. */
  independentVariables: string[];
  /** Per-metric, sorted by metric name. Never combined. */
  deltas: MetricDelta[];
  confoundedRuns: ConfoundedRun[];
  seed: number;
  repetitions: number;
  /**
   * Always true. There is deliberately no `winner`, `best`, `score` or
   * composite field: metric-by-metric deltas plus confounds, or nothing.
   */
  noCompositeScore: true;
  studyOnly: true;
  provenance: string;
  sourceClaimStatus: typeof SOURCE_CLAIM_STATUS;
  /** ISO timestamp supplied by the caller. Never generated here. */
  recordedAt: string;
}

export type LabProblem =
  | "experiment-id"
  | "variant-id"
  | "bits"
  | "features"
  | "width"
  | "superposition"
  | "seed"
  | "repetitions"
  | "variant-pair"
  | "numeric"
  | "recorded-at"
  | "study-only";

const LAB_PROVENANCE = "p18-superposition-lab";
/**
 * Quantization floor.
 *
 * 1 bit per dimension is rejected: a single-bit dimension has only {-1,+1}
 * and therefore no zero level, so two features that cancel in a shared
 * dimension have NO consistent encoding. Measured "accuracy" at 1 bit is a
 * decoder artifact — the quantizer is forced to emit a full-scale value that
 * spuriously matches one of the two tied features — and interference can then
 * appear to IMPROVE as precision is destroyed. Superposition cannot be
 * expressed at all in a 1-bit dimension, so the lab refuses to pretend it can.
 *
 * The floor of 2 is well below the repo's own conventional precision list
 * (src/providers/hardware.ts WELL_KNOWN_PRECISIONS floors at INT4) while
 * still admitting a representable zero.
 */
const BITS_MIN = 2;
const BITS_MAX = 32;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function finiteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function positiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Real comparators (never factories): a factory passed to sort yields NaN. */
function compareMetrics(a: LabMetric, b: LabMetric): number {
  return compareStrings(a, b);
}

function compareDeltas(a: MetricDelta, b: MetricDelta): number {
  return compareMetrics(a.metric, b.metric);
}

function compareConfounds(a: ConfoundedRun, b: ConfoundedRun): number {
  return (
    compareStrings(a.variantId, b.variantId) || a.runIndex - b.runIndex || compareStrings(a.reasons.join("|"), b.reasons.join("|"))
  );
}

/**
 * Deterministic seeded generator. This repository has no RNG abstraction and
 * no seed field anywhere; the only ambient randomness is an id factory in
 * src/workflows/runtime.ts. A seeded generator is introduced here because
 * the requirement's reproducibility rules require an EXPLICIT seed, and
 * because a STUDY_ONLY lane may add what production may not. It is a
 * fixed 32-bit LCG (Numerical Recipes constants), never ambient state.
 */
function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** Quantize a value to `bits` bits over [-1, 1]. Exact, no randomness. */
function quantize(value: number, bits: number): number {
  if (bits >= 32) return value;
  const levels = (1 << bits) - 1;
  const step = 2 / levels;
  const clamped = Math.max(-1, Math.min(1, value));
  return Math.round((clamped + 1) / step) * step - 1;
}

/**
 * Reconstruction tolerance for the accuracy metric, as a fraction of the
 * normalized [0,1] error scale.
 *
 * A feature counts as recovered only if its direction is reconstructed to
 * within a quarter of full scale. Full scale is 2 (the +/-1 signal range),
 * so this is 0.5 in raw units.
 *
 * It is deliberately STRICTER than the 0.5 boundary at which a sign is
 * lost. A threshold sitting exactly on 0.5 is a bug: catastrophic
 * cancellation produces error of exactly 0.5, and a quantizer with an odd
 * number of levels has no zero, so it must round a cancelled 0 to a small
 * non-zero value. That can pull a fully-cancelled feature just inside the
 * threshold and manufacture accuracy out of total interference.
 */
const DECODE_TOLERANCE = 0.25;

function variance(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((a, b) => a + (b - mean) * (b - mean), 0) / values.length;
}

/** Dispersion of a metric across retained runs. Empty spread is 0, not unknown. */
export function runDispersion(observations: readonly LabObservation[], metric: LabMetric): number {
  return variance(observations.map((o) => o.metrics[metric]).filter((v): v is number => v !== null));
}

export function validateVariant(variant: LabVariant): LabProblem[] {
  const problems: LabProblem[] = [];
  if (!nonEmpty(variant?.variantId)) problems.push("variant-id");
  if (!Number.isInteger(variant?.bits) || variant.bits < BITS_MIN || variant.bits > BITS_MAX) problems.push("bits");
  if (!positiveInt(variant?.features)) problems.push("features");
  if (!positiveInt(variant?.width)) problems.push("width");
  if (typeof variant?.superposition !== "boolean") problems.push("superposition");
  // A dense baseline cannot be denser than one feature per dimension; a
  // superposition variant with features <= width is just a dense baseline
  // wearing a superposition label, which would be a false control.
  if (variant?.superposition === false && positiveInt(variant?.features) && positiveInt(variant?.width)) {
    if (variant.features > variant.width) problems.push("superposition");
  }
  if (variant?.superposition === true && positiveInt(variant?.features) && positiveInt(variant?.width)) {
    if (variant.features <= variant.width) problems.push("superposition");
  }
  return [...new Set(problems)].sort() as LabProblem[];
}

export interface LabConfig {
  experimentId: string;
  baseline: LabVariant;
  experimental: LabVariant;
  seed: number;
  repetitions: number;
  /** ISO timestamp supplied by the caller. */
  recordedAt: string;
  provenance?: string;
}

/**
 * Controlled variables: everything that must match between baseline and
 * experimental variant.
 *
 * `features` is the control: the same number of features must be
 * represented either way, so the task is equally hard in both arms.
 *
 * `width` is deliberately NOT controlled. Superposition is *defined* by
 * features > width, so pinning width as well as features would make a clean
 * superposition comparison impossible to express — the mechanism could not
 * vary at all. Width is therefore part of the independent variable set
 * together with `bits`.
 */
const CONTROLLED = ["features"] as const;

export function validateConfig(config: LabConfig): LabProblem[] {
  const problems: LabProblem[] = [];
  if (!nonEmpty(config?.experimentId)) problems.push("experiment-id");
  if (!isoRecordedAt(config?.recordedAt)) problems.push("recorded-at");
  if (!Number.isInteger(config?.seed) || (config.seed as number) < 0) problems.push("seed");
  if (!positiveInt(config?.repetitions)) problems.push("repetitions");
  problems.push(...validateVariant(config?.baseline as LabVariant));
  problems.push(...validateVariant(config?.experimental as LabVariant));
  if (config?.baseline?.variantId && config.baseline.variantId === config.experimental?.variantId) {
    problems.push("variant-pair");
  }
  return [...new Set(problems)].sort() as LabProblem[];
}

function isoRecordedAt(value: unknown): value is string {
  return typeof value === "string" && ISO_RE.test(value) && !Number.isNaN(Date.parse(value));
}

/**
 * Confound reasons for one run: every controlled variable that differs
 * between the two variants, plus any non-finite observation. A comparison
 * where the variants differ in more than the independent variables is
 * CONFOUNDED and is excluded from the deltas rather than averaged in.
 */
function confoundsBetween(a: LabVariant, b: LabVariant): string[] {
  const reasons: string[] = [];
  for (const key of CONTROLLED) {
    if (a[key] !== b[key]) reasons.push(`${key} differs: ${a[key]} vs ${b[key]}`);
  }
  if (a.superposition === b.superposition) {
    reasons.push("superposition flag does not differ; there is no independent variable");
  }
  return reasons.sort();
}

/**
 * One deterministic run of a variant.
 *
 * Builds `features` random +/-1 feature directions of length `width`, packs
 * them `ceil(features/width)` per dimension when superposition is on, then
 * quantizes each stored dimension. Metrics:
 *
 *   feature_capacity  ANALYTIC    width x bits
 *   width             ANALYTIC    the width actually used
 *   memory            ANALYTIC    width x bits / 8 bytes (a model, not a
 *                                measurement of any real allocator)
 *   sparsity          ANALYTIC    active / (width x bits)
 *   interference      MEASURED    mean normalized reconstruction error
 *   accuracy          MEASURED    fraction of features reconstructed within
 *                                DECODE_TOLERANCE of full scale
 *   energy            UNAVAILABLE no energy measurement exists in this repo
 */
export function runVariant(variant: LabVariant, seed: number, runIndex: number): LabObservation {
  const problems = validateVariant(variant);
  if (problems.length > 0) {
    throw new Error(`invalid lab variant ${String(variant?.variantId)}: ${problems.join(",")}`);
  }
  if (!Number.isInteger(seed) || seed < 0) {
    throw new Error(`lab seed must be a non-negative integer, got ${String(seed)}`);
  }
  if (!Number.isInteger(runIndex) || runIndex < 0) {
    throw new Error(`lab runIndex must be a non-negative integer, got ${String(runIndex)}`);
  }
  const { features, width, bits, superposition } = variant;

  // Per-run stream: seed and runIndex are both folded in, so run N is not a
  // repeat of run 0. Pure index arithmetic, no ambient state.
  const next = lcg((seed + runIndex * 0x9e3779b1) >>> 0);
  const directions: number[][] = [];
  for (let f = 0; f < features; f++) {
    const dir: number[] = [];
    for (let d = 0; d < width; d++) dir.push(next() < 0.5 ? -1 : 1);
    directions.push(dir);
  }

  // Dense baseline: one direction per dimension, no sharing, no interference.
  // Superposition: pack ceil(features/width) directions per dimension.
  const perDimension = superposition ? Math.ceil(features / width) : 1;
  const stored: number[] = [];
  for (let d = 0; d < width; d++) {
    let acc = 0;
    for (let k = 0; k < perDimension; k++) {
      const index = superposition ? d * perDimension + k : d;
      if (index < directions.length) acc += directions[index]![d]!;
    }
    stored.push(quantize(acc / Math.max(1, perDimension), bits));
  }

  // Decode each feature back from its stored dimension and measure the
  // normalized reconstruction error against that feature's own target
  // direction. Error is normalized to [0, 1] by the +/-1 signal range.
  //
  // Error is used rather than sign agreement on purpose: a sign-agreement
  // decoder has to break ties, and a coarse grid can round a cancelled 0 to
  // a small positive value and let one of two tied features "win" — which
  // would report LESS interference after destroying MORE information. Error
  // is monotone in the information destroyed, so it cannot reward damage.
  let errorSum = 0;
  let correct = 0;
  for (let f = 0; f < features; f++) {
    // Must mirror the packing map above exactly: dimension d received
    // features d*perDimension + k, so feature f lives in floor(f/perDimension).
    // Using f % width here instead compares the WRONG features and silently
    // measures noise instead of reconstruction error.
    const d = superposition ? Math.floor(f / perDimension) : f;
    const error = Math.min(1, Math.abs(stored[d]! - directions[f]![d]!) / 2);
    errorSum += error;
    if (error < DECODE_TOLERANCE) correct++;
  }

  const interference = features === 0 ? 0 : errorSum / features;
  const accuracy = features === 0 ? 0 : correct / features;
  const capacity = width * bits;
  const activeDims = stored.filter((v) => v !== 0).length;
  const sparsity = capacity === 0 ? 0 : activeDims / capacity;
  const memoryBytes = capacity / 8;
  for (const value of [interference, accuracy, capacity, sparsity, memoryBytes]) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`lab run ${variant.variantId}#${runIndex} produced a non-finite or negative metric`);
    }
  }

  const notes: string[] = [];
  if (interference === 0 && superposition) notes.push("superposition packed but interference measured exactly zero");
  if (perDimension > 1) notes.push(`${perDimension} feature(s) packed per dimension`);

  return {
    variantId: variant.variantId,
    runIndex,
    seed,
    metrics: {
      feature_capacity: capacity,
      interference,
      width,
      sparsity,
      accuracy,
      memory: memoryBytes,
      energy: null,
    },
    provenance: {
      feature_capacity: "ANALYTIC",
      interference: "MEASURED",
      width: "ANALYTIC",
      sparsity: "ANALYTIC",
      accuracy: "MEASURED",
      memory: "ANALYTIC",
      energy: "UNAVAILABLE",
    },
    notes,
  };
}

function mean(values: readonly (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return null;
  return present.reduce((a, b) => a + b, 0) / present.length;
}

/**
 * Compare baseline against experimental across repetitions.
 *
 * Deliberately absent: any `winner`, `best`, `overallScore` or composite.
 * The result is per-metric deltas plus the confound list. Confounded runs
 * are excluded from the deltas and reported, never merged in.
 */
export function compareSuperposition(config: LabConfig): SuperpositionComparison {
  const problems = validateConfig(config);
  if (problems.length > 0) {
    throw new Error(`invalid superposition config ${String(config?.experimentId)}: ${problems.join(",")}`);
  }
  const runConfounds = confoundsBetween(config.baseline, config.experimental);
  const confoundedRuns: ConfoundedRun[] = [];
  const baselineRuns: LabObservation[] = [];
  const experimentalRuns: LabObservation[] = [];
  for (let i = 0; i < config.repetitions; i++) {
    if (runConfounds.length > 0) {
      confoundedRuns.push({ variantId: config.baseline.variantId, runIndex: i, reasons: runConfounds });
      confoundedRuns.push({ variantId: config.experimental.variantId, runIndex: i, reasons: runConfounds });
      continue;
    }
    baselineRuns.push(runVariant(config.baseline, config.seed, i));
    experimentalRuns.push(runVariant(config.experimental, config.seed, i));
  }

  const incomparabilityReasons: string[] = [];
  if (confoundedRuns.length > 0) {
    incomparabilityReasons.push(
      `confounded runs excluded: ${[...new Set(runConfounds)].sort().join("; ")}`,
    );
  }
  if (baselineRuns.length === 0 || experimentalRuns.length === 0) {
    incomparabilityReasons.push("no clean run pair; nothing was measured");
  }
  if (config.baseline.bits === config.experimental.bits) {
    incomparabilityReasons.push("quantization width is identical; the quantization interaction was not varied");
  }

  const deltas: MetricDelta[] = LAB_METRICS.map((metric) => {
    const b = mean(baselineRuns.map((r) => r.metrics[metric]));
    const e = mean(experimentalRuns.map((r) => r.metrics[metric]));
    const provenance: MetricProvenance =
      b === null || e === null ? "UNAVAILABLE" : baselineRuns[0]!.provenance[metric];
    return {
      metric,
      baseline: b,
      experimental: e,
      delta: b === null || e === null ? null : e - b,
      provenance,
    };
  }).sort(compareDeltas);

  return {
    experimentId: config.experimentId,
    baselineVariantId: config.baseline.variantId,
    experimentalVariantId: config.experimental.variantId,
    comparable: incomparabilityReasons.length === 0,
    incomparabilityReasons: incomparabilityReasons.sort(compareStrings),
    independentVariables: ["superposition", "bits", "width"],
    deltas,
    confoundedRuns: confoundedRuns.sort(compareConfounds),
    seed: config.seed,
    repetitions: config.repetitions,
    noCompositeScore: true,
    studyOnly: true,
    provenance: config.provenance ?? LAB_PROVENANCE,
    sourceClaimStatus: SOURCE_CLAIM_STATUS,
    recordedAt: config.recordedAt,
  };
}

/** Canonical serialization: key-sorted, so insertion order cannot leak. */
export function canonicalSuperposition(comparison: SuperpositionComparison): string {
  return stableStringify(comparison);
}

/** Per-run observations retained, sorted. Runs are never discarded. */
export function labRuns(config: LabConfig): LabObservation[] {
  const problems = validateConfig(config);
  if (problems.length > 0) {
    throw new Error(`invalid superposition config ${String(config?.experimentId)}: ${problems.join(",")}`);
  }
  const runs: LabObservation[] = [];
  for (let i = 0; i < config.repetitions; i++) {
    runs.push(runVariant(config.baseline, config.seed, i));
    runs.push(runVariant(config.experimental, config.seed, i));
  }
  return runs.sort(
    (a, b) => compareStrings(a.variantId, b.variantId) || a.runIndex - b.runIndex,
  );
}
