import { isValidMetric, type BenchmarkRecord, type BenchmarkStore } from "../providers/benchmarks";
import type { Dataset, DatasetItem } from "./evaluation";
import { DATASET_SPLITS } from "./evaluation";

/**
 * REQ-p19-context-position: context position robustness scorer.
 *
 * The registered requirement is the scope authority:
 *
 *   "Lost-in-the-middle evaluation: position-sensitivity scorer + harness
 *    over BenchmarkStore + compiler; keep-recent/truncate-middle
 *    heuristics are unmeasured."
 *
 * Scope, precisely: a POSITION-SENSITIVITY SCORER and a HARNESS over the
 * existing `BenchmarkStore`. The clause "keep-recent/truncate-middle
 * heuristics are unmeasured" is a statement about the CURRENT STATE of the
 * world, so this module's job is to make that state explicit and
 * measurable — not to assume either heuristic helps.
 *
 * Distinctions this module exists to hold:
 *
 *   POSITION SENSITIVITY != MODEL QUALITY
 *   HIGHER SPREAD        != BETTER MODEL      (it means less robust)
 *   UNMEASURED HEURISTIC != GOOD HEURISTIC
 *   HEURISTIC LABEL      != MEASURED BEHAVIOUR
 *   MIDDLE DEFICIT       != CAUSAL EXPLANATION
 *   POSITION             != TOKEN OFFSET
 *   CONTEXT COMPILER     != AVAILABLE          (no compiler exists yet)
 *   NO SAMPLES           != ZERO SENSITIVITY
 *
 * THE COMPILER DOES NOT EXIST. `REQ-p26-context-compiler` is registered and
 * READY at src/programme/requirements.json, but there is no compiler module
 * anywhere in src/ — a search for compileContext / contextCompiler returns
 * only the requirement record itself. This module therefore treats a
 * compiler as an OPTIONAL EXTERNAL REFERENCE and never pretends to have
 * compiled anything.
 *
 * THE SHARED METRIC VOCABULARY IS NOT WIDENED. `isValidMetric` in
 * src/providers/benchmarks.ts holds nine provider-benchmark metrics and
 * none of them is position sensitivity. Rather than add a tenth for a
 * single study, results are recorded under the existing
 * `context_handling` metric with the position breakdown carried in the
 * task field, so the canonical vocabulary stays canonical.
 */

/**
 * Context-assembly strategies named by the requirement. Declaring a name is
 * NOT evidence that the strategy behaves well.
 */
export const CONTEXT_STRATEGIES = ["keep-recent", "truncate-middle"] as const;
export type ContextStrategy = (typeof CONTEXT_STRATEGIES)[number];

/** Whether a strategy's behaviour has actually been measured here. */
export type StrategyMeasurement = "MEASURED" | "UNMEASURED";

export interface PositionSample {
  /** Ordinal position of the relevant evidence within the context, 0-based. */
  position: number;
  /** Observed correctness for that position, in [0, 1]. */
  score: number;
}

export interface PositionProfile {
  perPosition: PositionSample[];
  bestPosition: number;
  worstPosition: number;
  bestScore: number;
  worstScore: number;
  /** bestScore - worstScore. A real observed spread, never an estimate. */
  spread: number;
  edgeMean: number;
  middleMean: number;
  /**
   * edgeMean - middleMean. Positive means the middle underperformed the
   * edges. This is a DESCRIPTION of an observed pattern, not a causal
   * explanation: MIDDLE DEFICIT != CAUSAL EXPLANATION.
   */
  middleDeficit: number;
  samples: number;
  provenance: string;
}

export type PositionProblem =
  | "samples"
  | "position"
  | "score"
  | "duplicate-position"
  | "min-positions"
  | "strategy"
  | "measurement"
  | "metric"
  | "store-query"
  | "provenance"
  | "unknown-field";

const POSITION_PROVENANCE = "p19-context-position";
const ALLOWED_SCORER_KEYS: ReadonlySet<string> = new Set([
  "samples",
  "provenance",
  "minPositions",
]);
const STORE_METRIC = "context_handling";

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function compareNumbers(a: number, b: number): number {
  return a - b;
}

function compareSamples(a: PositionSample, b: PositionSample): number {
  return compareNumbers(a.position, b.position);
}

/** Real comparator (never a factory): a factory passed to sort yields NaN. */
function compareBenchmarks(a: BenchmarkRecord, b: BenchmarkRecord): number {
  return (
    compareStrings(a.model, b.model) ||
    compareStrings(a.metric, b.metric) ||
    compareStrings(a.task, b.task) ||
    a.timestamp - b.timestamp
  );
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * At least three positions, because a middle region cannot be defined from
 * one or two. Reported as a problem rather than silently degrading.
 */
const MIN_POSITIONS = 3;

export interface ScorerInput {
  samples: PositionSample[];
  provenance?: string;
  minPositions?: number;
}

/**
 * Score position sensitivity from observed per-position results.
 *
 * Edge and middle regions are the first and last thirds of the observed
 * position range, and the middle is what remains. The split is computed
 * from the data, not from a caller-supplied boundary, so it cannot be
 * tuned to manufacture a deficit.
 */
export function scorePositionSensitivity(input: ScorerInput): PositionProfile {
  const problems: PositionProblem[] = [];
  for (const key of Object.keys(input ?? {})) {
    if (!ALLOWED_SCORER_KEYS.has(key)) problems.push("unknown-field");
  }
  const min = input?.minPositions ?? MIN_POSITIONS;
  if (!Number.isInteger(min) || min < MIN_POSITIONS) problems.push("min-positions");
  if (!Array.isArray(input?.samples) || input.samples.length === 0) {
    // NO SAMPLES is a reported absence, never a zero sensitivity.
    problems.push("samples");
  } else {
    for (const sample of input.samples) {
      if (!Number.isInteger(sample?.position) || sample.position < 0) problems.push("position");
      const ok = typeof sample?.score === "number" && Number.isFinite(sample.score);
      if (!ok || sample.score < 0 || sample.score > 1) problems.push("score");
    }
    const positions = input.samples.map((s) => s.position);
    if (new Set(positions).size !== positions.length) problems.push("duplicate-position");
    if (input.samples.length < min) problems.push("min-positions");
  }
  if (!nonEmpty(input?.provenance ?? POSITION_PROVENANCE)) problems.push("provenance");
  if (problems.length > 0) {
    throw new Error(`invalid position sensitivity input: ${[...new Set(problems)].sort().join(",")}`);
  }

  const perPosition = [...input.samples].sort(compareSamples);
  // Ties break on the LOWEST position, so the result is total and stable.
  let best = perPosition[0]!;
  let worst = perPosition[0]!;
  for (const sample of perPosition) {
    if (sample.score > best.score) best = sample;
    if (sample.score < worst.score) worst = sample;
  }
  const count = perPosition.length;
  const edgeWidth = Math.max(1, Math.floor(count / 3));
  const edges = [...perPosition.slice(0, edgeWidth), ...perPosition.slice(count - edgeWidth)];
  const middles = perPosition.slice(edgeWidth, count - edgeWidth);
  const mean = (values: PositionSample[]): number =>
    values.length === 0
      ? 0
      : values.reduce((sum, v) => sum + v.score, 0) / values.length;

  const edgeMean = mean(edges);
  const middleMean = mean(middles);
  return {
    perPosition,
    bestPosition: best.position,
    worstPosition: worst.position,
    bestScore: best.score,
    worstScore: worst.score,
    spread: best.score - worst.score,
    edgeMean,
    middleMean,
    middleDeficit: edgeMean - middleMean,
    samples: count,
    provenance: input.provenance ?? POSITION_PROVENANCE,
  };
}

export interface StrategyDeclaration {
  strategy: ContextStrategy;
  measurement: StrategyMeasurement;
  /** Set only when MEASURED. Absent means no measurement backs the label. */
  measuredProfile?: PositionProfile;
  notes: string[];
}

/**
 * Declare a context strategy's measurement state.
 *
 * An `UNMEASURED` strategy may never carry a profile, and declaring
 * `MEASURED` requires one: a name is not evidence, and
 * `HEURISTIC LABEL != MEASURED BEHAVIOUR`.
 */
export function declareStrategy(input: {
  strategy: ContextStrategy;
  measurement: StrategyMeasurement;
  measuredProfile?: PositionProfile;
  notes?: string[];
}): StrategyDeclaration {
  const problems: PositionProblem[] = [];
  for (const key of Object.keys(input ?? {})) {
    if (!["strategy", "measurement", "measuredProfile", "notes"].includes(key)) {
      problems.push("unknown-field");
    }
  }
  if (!CONTEXT_STRATEGIES.includes(input?.strategy)) problems.push("strategy");
  if (input?.measurement !== "MEASURED" && input?.measurement !== "UNMEASURED") problems.push("measurement");
  if (input?.measurement === "MEASURED" && input?.measuredProfile === undefined) problems.push("measurement");
  if (input?.measurement === "UNMEASURED" && input?.measuredProfile !== undefined) problems.push("measurement");
  if (problems.length > 0) {
    throw new Error(`invalid strategy declaration: ${[...new Set(problems)].sort().join(",")}`);
  }
  return {
    strategy: input.strategy,
    measurement: input.measurement,
    ...(input.measuredProfile === undefined ? {} : { measuredProfile: input.measuredProfile }),
    notes: [...(input.notes ?? [])].sort(compareStrings),
  };
}

export interface PositionDatasetInput {
  datasetId: string;
  version: string;
  task: string;
  /** One entry per context position, in the order the harness will vary them. */
  positions: number[];
  /** Correctness observed for the evidence at each position. */
  scores: number[];
  /**
   * Partition, from the reused `DATASET_SPLITS` vocabulary. Defaults to
   * `held-out`: a robustness study is only meaningful on data the system was
   * not built against.
   */
  split?: Dataset["split"];
  provenance: string;
}

/**
 * Build a `Dataset` compatible with the EXISTING `DatasetRegistry`, so the
 * position study is registrable without a second registry and without a
 * new partition vocabulary: the split is chosen from the existing
 * `DATASET_SPLITS`, and `held-out` is the default because a robustness
 * study is only meaningful on data the system was not built against.
 */
export function buildPositionDataset(input: PositionDatasetInput): Dataset {
  const problems: PositionProblem[] = [];
  for (const key of Object.keys(input ?? {})) {
    if (!["datasetId", "version", "task", "positions", "scores", "split", "provenance"].includes(key)) {
      problems.push("unknown-field");
    }
  }
  if (!nonEmpty(input?.datasetId)) problems.push("samples");
  if (!nonEmpty(input?.version) || !/^\d+\.\d+\.\d+$/.test(input.version)) problems.push("position");
  if (!nonEmpty(input?.task)) problems.push("metric");
  if (!nonEmpty(input?.provenance)) problems.push("unknown-field");
  const split = input.split ?? "held-out";
  if (!DATASET_SPLITS.includes(split)) problems.push("metric");
  if (!Array.isArray(input?.positions) || !Array.isArray(input?.scores)) problems.push("samples");
  else if (input.positions.length !== input.scores.length) problems.push("samples");
  else if (input.positions.length < MIN_POSITIONS) problems.push("min-positions");
  else {
    for (const score of input.scores) {
      if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 1) problems.push("score");
    }
    if (new Set(input.positions).size !== input.positions.length) problems.push("duplicate-position");
  }
  const bad = [...new Set(problems)].sort() as PositionProblem[];
  if (bad.length > 0) {
    throw new Error(`invalid position dataset: ${bad.join(",")}`);
  }

  const items: DatasetItem[] = input.positions.map((position, i) => ({
    inputId: `pos-${String(position).padStart(3, "0")}`,
    input: { position },
    expected: { score: input.scores[i]! },
  }));
  return {
    datasetId: input.datasetId,
    version: input.version,
    task: input.task,
    split: split as Dataset["split"],
    items,
    provenance: input.provenance,
  };
}

export interface HarnessQuery {
  /** Model under study. */
  model: string;
  /**
   * Base task name. A position-carrying record is named
   * `<task>@pos-<n>`, optionally with a strategy segment
   * `<task>#<strategy>@pos-<n>`.
   */
  task: string;
  /** Restrict to one strategy's records. Omit to read every strategy. */
  strategy?: ContextStrategy;
}

/**
 * Read position samples for a query out of the EXISTING `BenchmarkStore`.
 *
 * The store is the only source: nothing is cached, mirrored or written here.
 * `BenchmarkRecord` has no position field, so the position is read from the
 * task name the recorder already used (`...@pos-<n>`) and the score from the
 * recorded `value`. A record whose name carries no position is SKIPPED with
 * a reason rather than guessed at.
 */
export function readPositionSamples(
  store: BenchmarkStore,
  query: HarnessQuery,
): { samples: PositionSample[]; skipped: string[] } {
  const problems: PositionProblem[] = [];
  if (!nonEmpty(query?.model)) problems.push("store-query");
  if (!nonEmpty(query?.task)) problems.push("store-query");
  if (query?.strategy !== undefined && !CONTEXT_STRATEGIES.includes(query.strategy)) problems.push("strategy");
  // The shared metric vocabulary is reused, never widened.
  if (!isValidMetric(STORE_METRIC)) problems.push("metric");
  if (problems.length > 0) {
    throw new Error(`invalid position harness query: ${[...new Set(problems)].sort().join(",")}`);
  }
  const records = store.query({ model: query.model, metric: STORE_METRIC }).sort(compareBenchmarks);
  const samples: PositionSample[] = [];
  const skipped: string[] = [];
  const pattern = new RegExp(`^${escapeRegExp(query.task)}(?:#(${CONTEXT_STRATEGIES.join("|")}))?@pos-(\\d+)$`);
  for (const record of records) {
    const match = pattern.exec(record.task);
    if (match === null) {
      skipped.push(`${record.task}: not a position task name`);
      continue;
    }
    if (query.strategy !== undefined && match[1] !== query.strategy) continue;
    if (typeof record.value !== "number" || !Number.isFinite(record.value) || record.value < 0 || record.value > 1) {
      skipped.push(`${record.task}: value outside [0,1]`);
      continue;
    }
    samples.push({ position: Number(match[2]), score: record.value });
  }
  return { samples, skipped };
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface PositionHarnessReport {
  model: string;
  task: string;
  strategy?: ContextStrategy;
  profile?: PositionProfile;
  /** Records that could not be read as a position sample, with reasons. */
  skipped: string[];
  /** False when the store held too little to score. Never a zero profile. */
  measured: boolean;
  provenance: string;
}

/**
 * Run the harness over `BenchmarkStore` and produce a report.
 *
 * When the store holds fewer than the minimum number of usable samples the
 * report says `measured: false` and carries NO profile. It does not
 * fabricate a zero-sensitivity result: NO SAMPLES != ZERO SENSITIVITY.
 */
export function runPositionHarness(
  store: BenchmarkStore,
  query: HarnessQuery,
  options: { provenance?: string; minPositions?: number } = {},
): PositionHarnessReport {
  const { samples, skipped } = readPositionSamples(store, query);
  const min = options.minPositions ?? MIN_POSITIONS;
  try {
    const profile = scorePositionSensitivity({
      samples,
      minPositions: min,
      provenance: options.provenance ?? POSITION_PROVENANCE,
    });
    return {
      model: query.model,
      task: query.task,
      ...(query.strategy === undefined ? {} : { strategy: query.strategy }),
      profile,
      skipped,
      measured: true,
      provenance: options.provenance ?? POSITION_PROVENANCE,
    };
  } catch {
    return {
      model: query.model,
      task: query.task,
      ...(query.strategy === undefined ? {} : { strategy: query.strategy }),
      skipped,
      measured: false,
      provenance: options.provenance ?? POSITION_PROVENANCE,
    };
  }
}
