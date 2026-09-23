# Benchmark Registries (REQ-p19-benchmark-registries, P19)

Typed Dataset + Scorer registries with an evaluation runner binding them
to P19 promotion dimensions. BenchmarkStore (records, provenance,
append-only) already existed; datasets and scorers did not.

## Contents (`src/eval/evaluation.ts`)

- **DatasetRegistry**: versioned datasets (`datasetId@x.y.z`) with task,
  split (`train/validation/held-out/out-of-domain/adversarial/temporal/
  sealed`), unique non-empty input ids, and provenance. Duplicates and
  malformed sets rejected.
- **ScorerRegistry**: named versioned scorers whose metric must belong to
  the canonical `BenchmarkStore` vocabulary (shared via `isValidMetric`).
- **runEvaluation**: one scorer over one dataset version. Predictions
  keyed by input id; missing predictions listed (never silently
  zero-filled); scorer outputs must be finite [0,1]; provenance and
  versions recorded on every result.

No universal score, ever: the runner scores a single metric per run and
offers no cross-metric combination. Promotion consumes per-dimension
results separately, as before.

Tests: `src/eval/evaluation.test.ts` (6 tests: registration, malformed
rejection, scored runs, missing predictions, honest failures, no
combination surface).
