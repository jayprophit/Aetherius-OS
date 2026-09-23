import { isValidMetric } from "../providers/benchmarks";

/**
 * REQ-p19-benchmark-registries: typed Dataset + Scorer registries and an
 * evaluation runner binding them to P19 promotion dimensions.
 *
 * BenchmarkStore (records/provenance/append-only) already exists; datasets
 * and scorers did not. This module adds them without touching the store.
 *
 * No universal score, ever: runEvaluation scores ONE metric per run.
 * There is no combine/average-across-metrics function anywhere here;
 * promotion consumes per-dimension results separately.
 */

export type DatasetSplit =
  | "train"
  | "validation"
  | "held-out"
  | "out-of-domain"
  | "adversarial"
  | "temporal"
  | "sealed";

export const DATASET_SPLITS: readonly DatasetSplit[] = [
  "train",
  "validation",
  "held-out",
  "out-of-domain",
  "adversarial",
  "temporal",
  "sealed",
];

export interface DatasetItem {
  inputId: string;
  input: unknown;
  expected: unknown;
}

export interface Dataset {
  datasetId: string;
  version: string;
  task: string;
  split: DatasetSplit;
  items: DatasetItem[];
  provenance: string;
}

export interface Scorer {
  scorerId: string;
  version: string;
  metric: string;
  description: string;
}

export interface EvaluationResult {
  datasetId: string;
  datasetVersion: string;
  scorerId: string;
  scorerVersion: string;
  metric: string;
  /** Mean of per-item scores in [0,1]; single metric only. */
  mean: number;
  scored: number;
  missing: string[];
  provenance: string;
  ranAt: string;
}

export type EvalProblem =
  | "dataset-id"
  | "dataset-version"
  | "dataset-task"
  | "dataset-split"
  | "dataset-items"
  | "dataset-duplicate"
  | "scorer-id"
  | "scorer-version"
  | "scorer-metric"
  | "scorer-unknown";

const VERSION_RE = /^\d+\.\d+\.\d+$/;

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateDataset(dataset: Dataset): EvalProblem[] {
  const problems: EvalProblem[] = [];
  if (!nonEmpty(dataset.datasetId)) problems.push("dataset-id");
  if (!nonEmpty(dataset.version) || !VERSION_RE.test(dataset.version.trim())) problems.push("dataset-version");
  if (!nonEmpty(dataset.task)) problems.push("dataset-task");
  if (!DATASET_SPLITS.includes(dataset.split)) problems.push("dataset-split");
  if (!Array.isArray(dataset.items) || dataset.items.length === 0) {
    problems.push("dataset-items");
  } else {
    const ids = dataset.items.map((item) => (typeof item?.inputId === "string" ? item.inputId : ""));
    if (ids.some((id) => !id.trim()) || new Set(ids).size !== ids.length) {
      problems.push("dataset-items");
    }
  }
  if (!nonEmpty(dataset.provenance)) problems.push("dataset-items");
  return [...new Set(problems)].sort() as EvalProblem[];
}

export function validateScorer(scorer: Scorer): EvalProblem[] {
  const problems: EvalProblem[] = [];
  if (!nonEmpty(scorer.scorerId)) problems.push("scorer-id");
  if (!nonEmpty(scorer.version) || !VERSION_RE.test(scorer.version.trim())) problems.push("scorer-version");
  if (!isValidMetric(scorer.metric)) problems.push("scorer-metric");
  return [...new Set(problems)].sort() as EvalProblem[];
}

export class DatasetRegistry {
  private readonly datasets = new Map<string, Dataset>();

  private key(datasetId: string, version: string): string {
    return `${datasetId}@${version}`;
  }

  register(dataset: Dataset): Dataset {
    const problems = validateDataset(dataset);
    if (problems.length > 0) throw new Error(`invalid dataset: ${problems.join(",")}`);
    const key = this.key(dataset.datasetId.trim(), dataset.version.trim());
    if (this.datasets.has(key)) throw new Error(`duplicate dataset ${key}`);
    const stored: Dataset = JSON.parse(JSON.stringify(dataset)) as Dataset;
    this.datasets.set(key, stored);
    return stored;
  }

  lookup(datasetId: string, version: string): Dataset | null {
    return this.datasets.get(this.key(datasetId, version)) ?? null;
  }

  list(): Dataset[] {
    return [...this.datasets.values()].sort((a, b) =>
      a.datasetId === b.datasetId ? (a.version < b.version ? -1 : 1) : a.datasetId < b.datasetId ? -1 : 1,
    );
  }
}

export class ScorerRegistry {
  private readonly scorers = new Map<string, Scorer>();

  register(scorer: Scorer): Scorer {
    const problems = validateScorer(scorer);
    if (problems.length > 0) throw new Error(`invalid scorer: ${problems.join(",")}`);
    const key = `${scorer.scorerId.trim()}@${scorer.version.trim()}`;
    if (this.scorers.has(key)) throw new Error(`duplicate scorer ${key}`);
    const stored: Scorer = { ...scorer };
    this.scorers.set(key, stored);
    return stored;
  }

  lookup(scorerId: string, version: string): Scorer | null {
    return this.scorers.get(`${scorerId}@${version}`) ?? null;
  }
}

export type ScorerFn = (expected: unknown, predicted: unknown) => number;

/**
 * Run one scorer over one dataset version. Predictions keyed by inputId;
 * missing predictions are reported (never zero-filled silently... they
 * are simply absent from the mean, and listed). Score function results
 * must be finite numbers in [0,1].
 */
export function runEvaluation(
  datasets: DatasetRegistry,
  scorers: ScorerRegistry,
  datasetId: string,
  datasetVersion: string,
  scorerId: string,
  scorerVersion: string,
  predictions: ReadonlyMap<string, unknown>,
  scorerFn: ScorerFn,
  provenance: string,
  now: () => string = () => new Date().toISOString(),
): EvaluationResult {
  const dataset = datasets.lookup(datasetId, datasetVersion);
  if (!dataset) throw new Error(`unknown dataset ${datasetId}@${datasetVersion}`);
  const scorer = scorers.lookup(scorerId, scorerVersion);
  if (!scorer) throw new Error(`unknown scorer ${scorerId}@${scorerVersion}`);
  if (!nonEmpty(provenance)) throw new Error("provenance is required");
  const scores: number[] = [];
  const missing: string[] = [];
  for (const item of dataset.items) {
    if (!predictions.has(item.inputId)) {
      missing.push(item.inputId);
      continue;
    }
    const score = scorerFn(item.expected, predictions.get(item.inputId));
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 1) {
      throw new Error(`scorer ${scorerId} returned out-of-range score for ${item.inputId}`);
    }
    scores.push(score);
  }
  const mean = scores.length === 0 ? 0 : scores.reduce((a, b) => a + b, 0) / scores.length;
  return {
    datasetId: dataset.datasetId,
    datasetVersion: dataset.version,
    scorerId: scorer.scorerId,
    scorerVersion: scorer.version,
    metric: scorer.metric,
    mean,
    scored: scores.length,
    missing: [...missing].sort(),
    provenance: provenance.trim(),
    ranAt: now(),
  };
}
