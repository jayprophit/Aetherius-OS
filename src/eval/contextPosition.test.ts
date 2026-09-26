import { describe, expect, it } from "vitest";
import { BenchmarkStore, type BenchmarkRecord } from "../providers/benchmarks";
import {
  CONTEXT_STRATEGIES,
  buildPositionDataset,
  declareStrategy,
  readPositionSamples,
  runPositionHarness,
  scorePositionSensitivity,
} from "./contextPosition";
import * as contextPosition from "./contextPosition";
import type { ContextStrategy, PositionSample } from "./contextPosition";

/**
 * Dimension-specific fixtures. Scores are set explicitly per position so no
 * assertion can be satisfied by an inherited default, and the store records
 * name their own position rather than relying on a shared task string.
 */
function samples(...pairs: [number, number][]): PositionSample[] {
  return pairs.map(([position, score]) => ({ position, score }));
}

function storeWith(records: BenchmarkRecord[]): BenchmarkStore {
  const store = new BenchmarkStore();
  for (const record of records) store.add(record);
  return store;
}

function record(task: string, value: number, model = "m1"): BenchmarkRecord {
  return {
    provider: "p",
    model,
    runtime: "r",
    task,
    metric: "context_handling",
    value,
    environment: "test",
    source: "LOCAL_MEASURED",
    provenance: "fixture",
    timestamp: 1_757_000_000_000,
  };
}

describe("position sensitivity scorer", () => {
  it("reports the observed spread, best and worst position", () => {
    const profile = scorePositionSensitivity({ samples: samples([0, 0.9], [1, 0.4], [2, 0.8]) });
    expect(profile.bestPosition).toBe(0);
    expect(profile.worstPosition).toBe(1);
    expect(profile.bestScore).toBe(0.9);
    expect(profile.worstScore).toBe(0.4);
    expect(profile.spread).toBeCloseTo(0.5, 12);
    expect(profile.samples).toBe(3);
  });

  it("breaks ties on the lowest position, so the result is total", () => {
    const profile = scorePositionSensitivity({ samples: samples([0, 0.7], [1, 0.7], [2, 0.7]) });
    expect(profile.bestPosition).toBe(0);
    expect(profile.worstPosition).toBe(0);
    expect(profile.spread).toBe(0);
  });

  it("detects a middle deficit and describes it without claiming a cause", () => {
    // A classic lost-in-the-middle shape: strong edges, weak middle.
    const profile = scorePositionSensitivity({ samples: samples([0, 0.9], [1, 0.2], [2, 0.3], [3, 0.9], [4, 0.85]) });
    expect(profile.middleDeficit).toBeGreaterThan(0);
    expect(profile.edgeMean).toBeGreaterThan(profile.middleMean);
    // A description, not an explanation.
    expect(Object.keys(profile)).not.toContain("cause");
    expect(Object.keys(profile)).not.toContain("explanation");
  });

  it("reports a zero deficit when the middle matches the edges", () => {
    const profile = scorePositionSensitivity({ samples: samples([0, 0.5], [1, 0.5], [2, 0.5], [3, 0.5]) });
    expect(profile.middleDeficit).toBe(0);
    expect(profile.spread).toBe(0);
  });

  it("orders samples by position regardless of input order", () => {
    const profile = scorePositionSensitivity({ samples: samples([3, 0.1], [0, 0.9], [2, 0.5], [1, 0.7]) });
    expect(profile.perPosition.map((s) => s.position)).toEqual([0, 1, 2, 3]);
  });

  it("has no quality, score-of-record or winner field", () => {
    const keys = Object.keys(scorePositionSensitivity({ samples: samples([0, 0.9], [1, 0.4], [2, 0.8]) }));
    for (const absent of ["winner", "best", "quality", "grade", "verdict", "ranking", "composite", "robust"]) {
      expect(keys).not.toContain(absent);
    }
  });

  it("rejects malformed samples rather than coercing them", () => {
    expect(() => scorePositionSensitivity({ samples: [] })).toThrowError(/samples/);
    expect(() => scorePositionSensitivity({ samples: samples([0, 1.5]) })).toThrowError(/score/);
    expect(() => scorePositionSensitivity({ samples: samples([0, -0.1]) })).toThrowError(/score/);
    expect(() => scorePositionSensitivity({ samples: samples([0, Number.NaN]) })).toThrowError(/score/);
    expect(() => scorePositionSensitivity({ samples: samples([-1, 0.5]) })).toThrowError(/position/);
    expect(() => scorePositionSensitivity({ samples: samples([0, 0.5], [0, 0.6], [1, 0.7], [2, 0.8]) })).toThrowError(
      /duplicate-position/,
    );
  });

  it("requires enough positions to define a middle region", () => {
    expect(() => scorePositionSensitivity({ samples: samples([0, 0.5], [1, 0.6]) })).toThrowError(/min-positions/);
    expect(() => scorePositionSensitivity({ samples: samples([0, 0.5]), minPositions: 1 })).toThrowError(/min-positions/);
  });

  it("rejects unrecognised keys rather than silently dropping them", () => {
    expect(() => scorePositionSensitivity({ samples: samples([0, 0.5], [1, 0.6], [2, 0.7]), weights: [] } as never)).toThrowError(
      /unknown-field/,
    );
  });
});

describe("strategy declarations stay honest", () => {
  it("names exactly the two strategies the requirement names", () => {
    expect([...CONTEXT_STRATEGIES]).toEqual(["keep-recent", "truncate-middle"]);
  });

  it("refuses to call a strategy MEASURED without a profile", () => {
    expect(() => declareStrategy({ strategy: "keep-recent", measurement: "MEASURED" })).toThrowError(/measurement/);
  });

  it("refuses to attach a profile to an UNMEASURED strategy", () => {
    const profile = scorePositionSensitivity({ samples: samples([0, 0.9], [1, 0.4], [2, 0.8]) });
    expect(() =>
      declareStrategy({ strategy: "truncate-middle", measurement: "UNMEASURED", measuredProfile: profile }),
    ).toThrowError(/measurement/);
  });

  it("declares both requirement-named heuristics as UNMEASURED by default", () => {
    // The requirement states these heuristics are unmeasured. Nothing here
    // may assert otherwise without a real profile.
    for (const strategy of CONTEXT_STRATEGIES) {
      const declared = declareStrategy({ strategy, measurement: "UNMEASURED" });
      expect(declared.measurement).toBe("UNMEASURED");
      expect(declared.measuredProfile).toBeUndefined();
    }
  });

  it("accepts a MEASURED declaration only with a real profile", () => {
    const profile = scorePositionSensitivity({ samples: samples([0, 0.9], [1, 0.4], [2, 0.8]) });
    const declared = declareStrategy({ strategy: "keep-recent", measurement: "MEASURED", measuredProfile: profile });
    expect(declared.measuredProfile).toBeDefined();
    expect(declared.measuredProfile!.spread).toBeCloseTo(0.5, 12);
  });

  it("rejects an unknown strategy and unknown keys", () => {
    expect(() => declareStrategy({ strategy: "magic" as never, measurement: "UNMEASURED" })).toThrowError(/strategy/);
    expect(() => declareStrategy({ strategy: "keep-recent", measurement: "UNMEASURED", extra: 1 } as never)).toThrowError(
      /unknown-field/,
    );
  });
});

describe("position dataset reuses the existing registry", () => {
  it("builds a Dataset compatible with DatasetRegistry", () => {
    const dataset = buildPositionDataset({
      datasetId: "position-probe",
      version: "1.0.0",
      task: "needle-retrieval",
      positions: [0, 1, 2],
      scores: [0.9, 0.2, 0.8],
      provenance: "fixture",
    });
    expect(dataset.split).toBe("held-out");
    expect(dataset.items).toHaveLength(3);
    expect(dataset.items[0]!.inputId).toBe("pos-000");
    expect(dataset.items[1]!.input).toEqual({ position: 1 });
  });

  it("accepts only a split from the reused DATASET_SPLITS vocabulary", () => {
    expect(() =>
      buildPositionDataset({
        datasetId: "d",
        version: "1.0.0",
        task: "t",
        positions: [0, 1, 2],
        scores: [0.1, 0.2, 0.3],
        provenance: "p",
        split: "private-never-trained" as never,
      }),
    ).toThrowError(/metric/);
  });

  it("rejects mismatched or undersized position/score lists", () => {
    const base = { datasetId: "d", version: "1.0.0", task: "t", provenance: "p" };
    expect(() => buildPositionDataset({ ...base, positions: [0, 1, 2], scores: [0.1, 0.2] })).toThrowError(/samples/);
    expect(() => buildPositionDataset({ ...base, positions: [0, 1], scores: [0.1, 0.2] })).toThrowError(/min-positions/);
    expect(() => buildPositionDataset({ ...base, positions: [0, 1, 2], scores: [0.1, 0.2, 1.4] })).toThrowError(/score/);
    expect(() => buildPositionDataset({ ...base, version: "1.0", positions: [0, 1, 2], scores: [0.1, 0.2, 0.3] })).toThrowError(
      /position/,
    );
  });
});

describe("harness over BenchmarkStore", () => {
  it("reads position samples from store records only", () => {
    const store = storeWith([
      record("needle@pos-0", 0.9),
      record("needle@pos-1", 0.2),
      record("needle@pos-2", 0.8),
    ]);
    const { samples: read, skipped } = readPositionSamples(store, { model: "m1", task: "needle" });
    expect(read).toEqual(samples([0, 0.9], [1, 0.2], [2, 0.8]));
    expect(skipped).toEqual([]);
  });

  it("reads a strategy-tagged subset without touching the other strategy", () => {
    const store = storeWith([
      record("needle#keep-recent@pos-0", 0.9),
      record("needle#keep-recent@pos-1", 0.8),
      record("needle#keep-recent@pos-2", 0.7),
      record("needle#truncate-middle@pos-0", 0.1),
      record("needle#truncate-middle@pos-1", 0.2),
      record("needle#truncate-middle@pos-2", 0.3),
    ]);
    const keepRecent = readPositionSamples(store, { model: "m1", task: "needle", strategy: "keep-recent" });
    expect(keepRecent.samples).toHaveLength(3);
    expect(keepRecent.samples.every((s) => s.score >= 0.7)).toBe(true);
  });

  it("skips a record with no position suffix instead of guessing", () => {
    const store = storeWith([record("needle@pos-0", 0.9), record("unrelated-task", 0.5)]);
    const { samples: read, skipped } = readPositionSamples(store, { model: "m1", task: "needle" });
    expect(read).toHaveLength(1);
    expect(skipped.join(" ")).toContain("not a position task name");
  });

  it("skips an out-of-range value rather than clamping it", () => {
    const store = storeWith([record("needle@pos-0", 1.5), record("needle@pos-1", 0.4), record("needle@pos-2", 0.5)]);
    const { samples: read, skipped } = readPositionSamples(store, { model: "m1", task: "needle" });
    expect(read).toHaveLength(2);
    expect(skipped.join(" ")).toContain("outside [0,1]");
  });

  it("reports measured:false and NO profile when the store is too thin", () => {
    const store = storeWith([record("needle@pos-0", 0.9)]);
    const report = runPositionHarness(store, { model: "m1", task: "needle" });
    // NO SAMPLES != ZERO SENSITIVITY: no fabricated zero-sensitivity profile.
    expect(report.measured).toBe(false);
    expect(report.profile).toBeUndefined();
  });

  it("produces a measured report when the store holds enough", () => {
    const store = storeWith([
      record("needle@pos-0", 0.9),
      record("needle@pos-1", 0.2),
      record("needle@pos-2", 0.8),
    ]);
    const report = runPositionHarness(store, { model: "m1", task: "needle" });
    expect(report.measured).toBe(true);
    expect(report.profile!.middleDeficit).toBeGreaterThan(0);
  });

  it("does not widen the shared metric vocabulary", () => {
    // A position metric is NOT added to providers/benchmarks.ts; results are
    // recorded under the existing context_handling metric.
    const store = storeWith([record("needle@pos-0", 0.9), record("needle@pos-1", 0.2), record("needle@pos-2", 0.8)]);
    const report = runPositionHarness(store, { model: "m1", task: "needle" });
    expect(report.measured).toBe(true);
    const names = Object.keys(contextPosition);
    expect(names).not.toContain("BenchmarkStore");
    expect(names).not.toContain("DatasetRegistry");
  });

  it("rejects a malformed harness query", () => {
    const store = storeWith([]);
    expect(() => readPositionSamples(store, { model: "", task: "needle" })).toThrowError(/store-query/);
    expect(() => readPositionSamples(store, { model: "m1", task: "" })).toThrowError(/store-query/);
    expect(() => readPositionSamples(store, { model: "m1", task: "t", strategy: "magic" as ContextStrategy })).toThrowError(
      /strategy/,
    );
  });

  it("isolates models: one model's data never becomes another's", () => {
    const store = storeWith([
      record("needle@pos-0", 0.9, "m1"),
      record("needle@pos-1", 0.8, "m1"),
      record("needle@pos-2", 0.7, "m1"),
      record("needle@pos-0", 0.1, "m2"),
      record("needle@pos-1", 0.2, "m2"),
      record("needle@pos-2", 0.3, "m2"),
    ]);
    const a = runPositionHarness(store, { model: "m1", task: "needle" });
    const b = runPositionHarness(store, { model: "m2", task: "needle" });
    expect(a.profile!.worstScore).toBeCloseTo(0.7, 12);
    expect(b.profile!.worstScore).toBeCloseTo(0.1, 12);
  });
});

describe("position study boundary", () => {
  it("does not implement a context compiler, because none exists", () => {
    const names = Object.keys(contextPosition);
    for (const banned of ["compile", "compiler", "assemble", "prompt", "template"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("exposes no ranking, winner or composite capability", () => {
    const names = Object.keys(contextPosition);
    for (const banned of ["winner", "best", "rank", "score_", "composite", "grade", "verdict"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("creates no second benchmark store, dataset registry or evidence graph", () => {
    const names = Object.keys(contextPosition);
    for (const banned of ["store", "registry", "graph", "save", "persist", "record"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("calls no clock: timestamps come from the stored records", () => {
    const store = storeWith([
      record("needle@pos-0", 0.9),
      record("needle@pos-1", 0.2),
      record("needle@pos-2", 0.8),
    ]);
    const report = runPositionHarness(store, { model: "m1", task: "needle" });
    expect(Object.keys(report)).not.toContain("generatedAt");
    expect(Object.keys(report)).not.toContain("now");
  });
});
