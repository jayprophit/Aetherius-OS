/**
 * P18/2 benchmark evidence. Multidimensional, provenance-preserving,
 * append-only. No universal "AI score" is computed here.
 */

export type BenchmarkSource =
  | "LOCAL_MEASURED"
  | "INTERNAL_TEST"
  | "VENDOR_REPORTED"
  | "THIRD_PARTY_REPORTED"
  | "HISTORICAL"
  | "UNKNOWN";

const VALID_METRICS = new Set([
  "latency",
  "throughput",
  "tool_success",
  "coding_success",
  "reasoning_eval",
  "context_handling",
  "structured_output_success",
  "cost",
  "resource_use",
]);

export interface BenchmarkRecord {
  provider: string;
  model: string;
  runtime: string;
  task: string;
  metric: string;
  value: number;
  units?: string;
  dataset?: string;
  timestamp: number;
  environment: string;
  source: BenchmarkSource;
  provenance: string;
  samples?: number;
}

export function validateBenchmark(record: BenchmarkRecord): string | null {
  if (!record.provider.trim() || !record.model.trim() || !record.runtime.trim()) {
    return "provider/model/runtime must be non-empty";
  }
  if (!VALID_METRICS.has(record.metric)) {
    return `unknown metric ${record.metric}`;
  }
  if (!Number.isFinite(record.value)) {
    return "value must be finite";
  }
  if (!record.task.trim() || !record.environment.trim() || !record.provenance.trim()) {
    return "task/environment/provenance must be non-empty";
  }
  if (record.samples !== undefined && (!Number.isInteger(record.samples) || record.samples < 1)) {
    return "samples must be a positive integer when present";
  }
  return null;
}

/** Append-only store: history is preserved, never overwritten. */
export class BenchmarkStore {
  private records: BenchmarkRecord[] = [];
  /** Known model ids; when set, unknown references are rejected. */
  constructor(private readonly knownModels?: Set<string>) {}

  add(record: BenchmarkRecord): BenchmarkRecord {
    const problem = validateBenchmark(record);
    if (problem) throw new Error(`invalid benchmark: ${problem}`);
    if (this.knownModels && !this.knownModels.has(record.model)) {
      throw new Error(`invalid benchmark: unknown model reference ${record.model}`);
    }
    const stored = { ...record };
    this.records.push(stored);
    return stored;
  }

  list(): BenchmarkRecord[] {
    return this.records.map((r) => ({ ...r }));
  }

  query(filter: Partial<Pick<BenchmarkRecord, "provider" | "model" | "runtime" | "metric" | "task" | "source">>): BenchmarkRecord[] {
    return this.records
      .filter((r) =>
        (filter.provider === undefined || r.provider === filter.provider) &&
        (filter.model === undefined || r.model === filter.model) &&
        (filter.runtime === undefined || r.runtime === filter.runtime) &&
        (filter.metric === undefined || r.metric === filter.metric) &&
        (filter.task === undefined || r.task === filter.task) &&
        (filter.source === undefined || r.source === filter.source),
      )
      .map((r) => ({ ...r }));
  }

  /** Latest LOCAL_MEASURED value for (model, metric, task), if any. */
  latestLocal(model: string, metric: string, task: string): BenchmarkRecord | null {
    const hits = this.query({ model, metric, task, source: "LOCAL_MEASURED" }).sort(
      (a, b) => b.timestamp - a.timestamp,
    );
    return hits[0] ?? null;
  }
}
