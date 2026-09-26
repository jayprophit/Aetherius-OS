import { describe, expect, it } from "vitest";
import {
  FRESHNESS_STATES,
  SATURATION_STATES,
  VERSION_LIFECYCLE_STATES,
  assessDatasetVersion,
  datasetVersionRef,
  deprecateDatasetVersion,
  listDeprecations,
  queryFreshness,
} from "./benchmarkFreshness";
import * as benchmarkFreshness from "./benchmarkFreshness";
import type { DeprecationRecord, FreshnessSaturationPolicy } from "./benchmarkFreshness";
import type { BenchmarkRecord } from "../providers/benchmarks";

const NOW = 1_757_000_000_000;
const MINUTE = 60_000;

/**
 * Dimension-specific fixture. Each record's `dataset` ref is set explicitly
 * because `BenchmarkRecord.dataset` is optional free text: a shared default
 * would silently attribute one version's observations to another.
 */
function policy(over: Partial<FreshnessSaturationPolicy> = {}): FreshnessSaturationPolicy {
  return { maxAgeMs: 30 * 24 * 60 * MINUTE, agingMs: 7 * 24 * 60 * MINUTE, saturationObservations: 10, approachingObservations: 5, ...over };
}

function record(dataset: string | undefined, timestamp: number): BenchmarkRecord {
  return {
    provider: "p",
    model: "m",
    runtime: "r",
    task: "t",
    metric: "reasoning_eval",
    value: 0.5,
    dataset,
    timestamp,
    environment: "test",
    source: "LOCAL_MEASURED",
    provenance: "fixture",
  };
}

function recordsFor(ref: string, count: number, newestAgeMs: number): BenchmarkRecord[] {
  const newest = NOW - newestAgeMs;
  return Array.from({ length: count }, (_, i) => record(ref, newest - i * MINUTE));
}

function request(over: Partial<Parameters<typeof assessDatasetVersion>[0]> = {}) {
  return {
    datasetId: "gsm8k",
    version: "1.0.0",
    policy: policy(),
    records: [],
    nowMs: NOW,
    ...over,
  };
}

describe("dataset version identity", () => {
  it("reuses the DatasetRegistry id@version key convention", () => {
    expect(datasetVersionRef("gsm8k", "1.0.0")).toBe("gsm8k@1.0.0");
  });

  it("requires a strict x.y.z version, because a name is not a version", () => {
    expect(() => assessDatasetVersion(request({ version: "1.0" }))).toThrowError(/version/);
    expect(() => assessDatasetVersion(request({ version: "latest" }))).toThrowError(/version/);
  });

  it("attributes a record only on an exact versioned ref, never a bare name", () => {
    const bare = recordsFor("gsm8k", 3, MINUTE);
    const versioned = recordsFor("gsm8k@1.0.0", 3, MINUTE);
    // A bare dataset name is not a version attribution, so it counts for nothing.
    expect(assessDatasetVersion(request({ records: bare })).observations).toBe(0);
    expect(assessDatasetVersion(request({ records: versioned })).observations).toBe(3);
  });
});

describe("freshness policy", () => {
  it("reports FRESH, AGING and STALE from real timestamps", () => {
    const ref = datasetVersionRef("gsm8k", "1.0.0");
    expect(assessDatasetVersion(request({ records: recordsFor(ref, 1, MINUTE) })).freshness).toBe("FRESH");
    expect(assessDatasetVersion(request({ records: recordsFor(ref, 1, 10 * 24 * 60 * MINUTE) })).freshness).toBe("AGING");
    expect(assessDatasetVersion(request({ records: recordsFor(ref, 1, 90 * 24 * 60 * MINUTE) })).freshness).toBe("STALE");
  });

  it("treats NO OBSERVATION as unknown, never as fresh", () => {
    const assessment = assessDatasetVersion(request());
    expect(assessment.freshness).toBe("FRESHNESS_UNKNOWN");
    expect(assessment.freshness).not.toBe("FRESH");
    expect(assessment.ageMs).toBeNull();
    expect(assessment.qualifications.join(" ")).toContain("unknown, not fresh");
  });

  it("treats a future timestamp as unknown rather than as fresh evidence", () => {
    const ref = datasetVersionRef("gsm8k", "1.0.0");
    const assessment = assessDatasetVersion(request({ records: recordsFor(ref, 1, -MINUTE) }));
    expect(assessment.freshness).toBe("FRESHNESS_UNKNOWN");
    expect(assessment.ageMs).toBeNull();
    expect(assessment.qualifications.join(" ")).toContain("later than the supplied now");
  });

  it("rejects an incoherent policy where AGING would be unreachable", () => {
    expect(() => assessDatasetVersion(request({ policy: policy({ agingMs: 10, maxAgeMs: 5 }) }))).toThrowError(/policy/);
    expect(() => assessDatasetVersion(request({ policy: policy({ approachingObservations: 10, saturationObservations: 5 }) }))).toThrowError(/policy/);
    expect(() => assessDatasetVersion(request({ policy: policy({ maxAgeMs: 0 }) }))).toThrowError(/policy/);
  });

  it("rejects a non-finite or negative now", () => {
    expect(() => assessDatasetVersion(request({ nowMs: Number.NaN }))).toThrowError(/now-ms/);
    expect(() => assessDatasetVersion(request({ nowMs: -1 }))).toThrowError(/now-ms/);
  });

  it("calls no clock: the caller supplies nowMs", () => {
    const a = assessDatasetVersion(request({ nowMs: 1000 }));
    const b = assessDatasetVersion(request({ nowMs: 1000 }));
    expect(a.assessedAtMs).toBe(1000);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe("saturation is a real count, not a quality score", () => {
  const ref = datasetVersionRef("gsm8k", "1.0.0");

  it("reports UNSATURATED, APPROACHING and SATURATED by observation count", () => {
    expect(assessDatasetVersion(request({ records: recordsFor(ref, 1, MINUTE) })).saturation).toBe("UNSATURATED");
    expect(assessDatasetVersion(request({ records: recordsFor(ref, 5, MINUTE) })).saturation).toBe("APPROACHING_SATURATION");
    expect(assessDatasetVersion(request({ records: recordsFor(ref, 10, MINUTE) })).saturation).toBe("SATURATED");
  });

  it("reports SATURATION_UNKNOWN with no observations, not zero-saturated", () => {
    const assessment = assessDatasetVersion(request());
    expect(assessment.saturation).toBe("SATURATION_UNKNOWN");
    expect(assessment.observations).toBe(0);
  });

  it("has no quality, score or accuracy field", () => {
    const keys = Object.keys(assessDatasetVersion(request({ records: recordsFor(ref, 3, MINUTE) })));
    for (const absent of ["score", "quality", "accuracy", "grade", "value", "mean", "passed"]) {
      expect(keys).not.toContain(absent);
    }
  });

  it("keeps freshness and saturation independent", () => {
    // Old AND heavily measured: both dimensions report separately.
    const assessment = assessDatasetVersion(request({ records: recordsFor(ref, 12, 90 * 24 * 60 * MINUTE) }));
    expect(assessment.freshness).toBe("STALE");
    expect(assessment.saturation).toBe("SATURATED");
  });
});

describe("deprecation is append-only and never deletes", () => {
  it("records a deprecation and blocks only NEW evaluation", () => {
    const { deprecations, outcome } = deprecateDatasetVersion([], {
      datasetId: "gsm8k",
      version: "1.0.0",
      deprecatedAtMs: NOW,
      reason: "superseded by a corrected item set",
      replacementRef: "gsm8k@2.0.0",
    });
    expect(outcome).toBe("recorded");
    const assessment = assessDatasetVersion(request(), deprecations);
    expect(assessment.lifecycle).toBe("DEPRECATED");
    expect(assessment.newEvaluationBlocked).toBe(true);
    // The deprecation record is retained verbatim: history is evidence.
    expect(assessment.deprecation?.replacementRef).toBe("gsm8k@2.0.0");
    expect(assessment.qualifications.join(" ")).toContain("DEPRECATED");
  });

  it("does not block on freshness or saturation alone", () => {
    const ref = datasetVersionRef("gsm8k", "1.0.0");
    const assessment = assessDatasetVersion(request({ records: recordsFor(ref, 12, 90 * 24 * 60 * MINUTE) }));
    expect(assessment.lifecycle).toBe("ACTIVE");
    expect(assessment.newEvaluationBlocked).toBe(false);
    expect(assessment.freshness).toBe("STALE");
  });

  it("is idempotent for identical content and conflicts on changed content", () => {
    const first = deprecateDatasetVersion([], {
      datasetId: "gsm8k",
      version: "1.0.0",
      deprecatedAtMs: NOW,
      reason: "superseded",
    });
    const again = deprecateDatasetVersion(first.deprecations, {
      datasetId: "gsm8k",
      version: "1.0.0",
      deprecatedAtMs: NOW,
      reason: "superseded",
    });
    expect(again.outcome).toBe("identical");
    expect(again.deprecations).toHaveLength(1);

    const clash = deprecateDatasetVersion(first.deprecations, {
      datasetId: "gsm8k",
      version: "1.0.0",
      deprecatedAtMs: NOW,
      reason: "a different reason entirely",
    });
    expect(clash.outcome).toBe("conflict");
    expect(clash.reason).toContain("immutable");
    expect(clash.deprecations).toHaveLength(1);
  });

  it("keeps deprecations of different versions side by side", () => {
    const first = deprecateDatasetVersion([], { datasetId: "gsm8k", version: "1.0.0", deprecatedAtMs: NOW, reason: "old" });
    const second = deprecateDatasetVersion(first.deprecations, { datasetId: "gsm8k", version: "1.1.0", deprecatedAtMs: NOW, reason: "old" });
    expect(second.outcome).toBe("recorded");
    expect(listDeprecations(second.deprecations).map((d) => d.version)).toEqual(["1.0.0", "1.1.0"]);
  });

  it("rejects malformed deprecations without recording anything", () => {
    for (const bad of [
      { datasetId: "", version: "1.0.0", deprecatedAtMs: NOW, reason: "r" },
      { datasetId: "d", version: "1.0", deprecatedAtMs: NOW, reason: "r" },
      { datasetId: "d", version: "1.0.0", deprecatedAtMs: Number.NaN, reason: "r" },
      { datasetId: "d", version: "1.0.0", deprecatedAtMs: NOW, reason: "  " },
    ]) {
      const result = deprecateDatasetVersion([], bad as never);
      expect(result.outcome).toBe("rejected");
      expect(result.deprecations).toEqual([]);
    }
  });

  it("rejects unrecognised keys rather than silently dropping them", () => {
    const result = deprecateDatasetVersion([], {
      datasetId: "d",
      version: "1.0.0",
      deprecatedAtMs: NOW,
      reason: "r",
      urgent: true,
    } as never);
    expect(result.outcome).toBe("rejected");
    expect(result.reason).toContain("unknown-field");
  });
});

describe("queries and determinism", () => {
  function build(): DeprecationRecord[] {
    const a = deprecateDatasetVersion([], { datasetId: "gsm8k", version: "1.0.0", deprecatedAtMs: NOW, reason: "old" });
    return deprecateDatasetVersion(a.deprecations, { datasetId: "mmlu", version: "2.0.0", deprecatedAtMs: NOW, reason: "old" }).deprecations;
  }

  it("filters by explicit dimensions", () => {
    const deprecations = build();
    // 1.1.0 is deliberately NOT in the deprecation set, so this one is active.
    const active = assessDatasetVersion(request({ version: "1.1.0" }), deprecations);
    const deprecated = assessDatasetVersion(request({ version: "1.0.0" }), deprecations);
    expect(active.lifecycle).toBe("ACTIVE");
    expect(deprecated.lifecycle).toBe("DEPRECATED");
    expect(queryFreshness([active, deprecated], { lifecycle: "DEPRECATED" }).map((a) => a.version)).toEqual(["1.0.0"]);
    expect(queryFreshness([active, deprecated], { usableOnly: true }).map((a) => a.version)).toEqual(["1.1.0"]);
    expect(queryFreshness([active, deprecated], { datasetId: "mmlu" })).toEqual([]);
  });

  it("orders deterministically from scrambled input", () => {
    const records = [
      assessDatasetVersion(request({ datasetId: "z", version: "1.0.0" })),
      assessDatasetVersion(request({ datasetId: "a", version: "2.0.0" })),
      assessDatasetVersion(request({ datasetId: "a", version: "1.0.0" })),
    ];
    expect(queryFreshness(records).map((a) => `${a.datasetId}@${a.version}`)).toEqual([
      "a@1.0.0",
      "a@2.0.0",
      "z@1.0.0",
    ]);
  });

  it("does not mutate its inputs", () => {
    const records = recordsFor(datasetVersionRef("gsm8k", "1.0.0"), 3, MINUTE);
    const before = JSON.stringify({ records, policy: policy() });
    assessDatasetVersion(request({ records }));
    deprecateDatasetVersion([], { datasetId: "d", version: "1.0.0", deprecatedAtMs: NOW, reason: "r" });
    expect(JSON.stringify({ records, policy: policy() })).toBe(before);
  });
});

describe("freshness policy boundary", () => {
  it("declares the full state vocabularies with no positive false states", () => {
    expect([...FRESHNESS_STATES]).toEqual(["FRESH", "AGING", "STALE", "FRESHNESS_UNKNOWN"]);
    expect([...SATURATION_STATES]).toEqual(["UNSATURATED", "APPROACHING_SATURATION", "SATURATED", "SATURATION_UNKNOWN"]);
    expect([...VERSION_LIFECYCLE_STATES]).toEqual(["ACTIVE", "DEPRECATED"]);
    // There is no VALID/INVALID/OK member: a version is not "good".
    for (const absent of ["VALID", "INVALID", "OK", "TRUSTED"]) {
      expect(VERSION_LIFECYCLE_STATES).not.toContain(absent as never);
    }
  });

  it("does not delete, mutate or invalidate a dataset", () => {
    const names = Object.keys(benchmarkFreshness);
    for (const banned of ["delete", "remove", "purge", "drop", "invalidate", "revoke", "expire"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("creates no second dataset registry, benchmark store or clock", () => {
    const names = Object.keys(benchmarkFreshness);
    for (const banned of ["registry", "store", "save", "clock", "now", "time", "date"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("reuses the existing BenchmarkRecord rather than redefining it", () => {
    // Freshness is computed FROM stored records, not from a parallel copy.
    const names = Object.keys(benchmarkFreshness);
    expect(names).not.toContain("BenchmarkRecord");
    expect(names).not.toContain("BenchmarkStore");
  });
});
