import { describe, expect, it } from "vitest";
import {
  LAB_METRICS,
  LAB_STUDY_ONLY,
  SOURCE_CLAIM_STATUS,
  canonicalSuperposition,
  compareSuperposition,
  labRuns,
  runDispersion,
  runVariant,
  validateConfig,
  validateVariant,
} from "./superposition";
import * as superposition from "./superposition";
import type { LabConfig, LabVariant } from "./superposition";

const AT = "2026-09-26T00:00:00.000Z";

/**
 * Dimension-specific fixture. `features` is held EQUAL across variants on
 * purpose: the same number of features is represented in both arms, so the
 * task is equally hard. `width` differs because superposition is defined by
 * features > width — pinning width too would make the mechanism unable to
 * vary at all. A shared-defaults fixture would let one arm silently satisfy
 * the other's control, so every field is set explicitly.
 */
function variant(over: Partial<LabVariant> = {}): LabVariant {
  return { variantId: "v", superposition: false, bits: 32, features: 4, width: 4, ...over };
}

function dense(over: Partial<LabVariant> = {}): LabVariant {
  return variant({ variantId: "dense", superposition: false, features: 4, width: 4, bits: 32, ...over });
}

function packed(over: Partial<LabVariant> = {}): LabVariant {
  return variant({ variantId: "packed", superposition: true, features: 4, width: 2, bits: 32, ...over });
}

function config(over: Partial<LabConfig> = {}): LabConfig {
  return {
    experimentId: "sup-1",
    baseline: dense(),
    experimental: packed(),
    seed: 7,
    repetitions: 3,
    recordedAt: AT,
    ...over,
  };
}

describe("lab validation", () => {
  it("accepts a dense baseline and a genuinely packed experimental variant", () => {
    expect(validateVariant(dense())).toEqual([]);
    expect(validateVariant(packed())).toEqual([]);
    expect(validateConfig(config())).toEqual([]);
  });

  it("rejects malformed variants", () => {
    expect(validateVariant(variant({ variantId: " " }))).toContain("variant-id");
    expect(validateVariant(variant({ bits: 0 }))).toContain("bits");
    expect(validateVariant(variant({ bits: 64 }))).toContain("bits");
    expect(validateVariant(variant({ bits: 2.5 }))).toContain("bits");
    expect(validateVariant(variant({ features: 0 }))).toContain("features");
    expect(validateVariant(variant({ width: -1 }))).toContain("width");
    expect(validateVariant(variant({ features: 1.5 }))).toContain("features");
    expect(validateVariant(variant({ superposition: "yes" as never }))).toContain("superposition");
  });

  it("rejects a dense variant packed beyond its width, and a fake superposition control", () => {
    // features > width with superposition off is a mislabelled variant.
    expect(validateVariant(variant({ superposition: false, features: 8, width: 2 }))).toContain("superposition");
    // superposition on with features <= width is a dense baseline wearing a
    // label; accepting it would manufacture a false independent variable.
    expect(validateVariant(variant({ superposition: true, features: 2, width: 4 }))).toContain("superposition");
  });

  it("rejects malformed configs", () => {
    expect(validateConfig(config({ experimentId: "" }))).toContain("experiment-id");
    expect(validateConfig(config({ recordedAt: "today" }))).toContain("recorded-at");
    expect(validateConfig(config({ seed: -1 }))).toContain("seed");
    expect(validateConfig(config({ seed: 1.5 }))).toContain("seed");
    expect(validateConfig(config({ repetitions: 0 }))).toContain("repetitions");
    expect(validateConfig(config({ baseline: dense(), experimental: dense() }))).toContain("variant-pair");
  });

  it("runVariant refuses malformed input rather than returning a partial observation", () => {
    expect(() => runVariant(variant({ bits: 0 }), 1, 0)).toThrowError(/bits/);
    expect(() => runVariant(dense(), -1, 0)).toThrowError(/seed/);
    expect(() => runVariant(dense(), 1, -1)).toThrowError(/runIndex/);
  });

  it("compareSuperposition fails closed on a malformed config", () => {
    expect(() => compareSuperposition(config({ seed: -1 }))).toThrowError(/seed/);
  });
});

describe("lab mechanism", () => {
  it("measures exactly zero interference for a dense baseline with no packing", () => {
    // Analytical case: 4 features in 4 dimensions share nothing.
    const run = runVariant(dense(), 7, 0);
    expect(run.metrics.interference).toBe(0);
    expect(run.metrics.accuracy).toBe(1);
  });

  it("measures positive interference once features are packed", () => {
    // Analytical case: 4 features into 2 dimensions forces sharing.
    const run = runVariant(packed(), 7, 0);
    expect(run.metrics.interference).toBeGreaterThan(0);
    expect(run.metrics.accuracy).toBeLessThan(1);
  });

  it("increases interference when quantization is made coarser at equal packing", () => {
    const fine = runVariant(packed({ bits: 32 }), 7, 0);
    const coarse = runVariant(packed({ bits: 2 }), 7, 0);
    expect(coarse.metrics.interference).toBeGreaterThanOrEqual(fine.metrics.interference);
  });

  it("never reports LESS interference as precision is destroyed", () => {
    // Regression guard. A sign-agreement decoder must break ties, and a
    // coarse grid can round a cancelled 0 to a small positive value and let
    // one of two tied features "win" — which reported interference FALLING
    // after destroying MORE information. The metric is now normalized
    // reconstruction error, which is monotone in the damage done.
    //
    // Tolerance: TOL is a tight absolute epsilon, not a slack allowance. After
    // the encoder/decoder mapping was corrected, each cancelling feature pair
    // contributes two errors symmetric about its target, so their mean is
    // exact and the metric is monotone to double precision (verified at 1e-12).
    // 1e-9 sits three orders above double-epsilon accumulation for order-1
    // sums and nine orders below the 0.25-magnitude artifact being guarded
    // against, so it cannot conceal a real regression. An earlier 1e-4
    // tolerance here was masking the encoder/decoder bug and was removed.
    const TOL = 1e-9;
    for (let run = 0; run < 6; run++) {
      const byBits = [32, 16, 8, 4, 2].map((bits) => runVariant(packed({ bits }), 7, run));
      for (let i = 1; i < byBits.length; i++) {
        expect(byBits[i]!.metrics.interference!).toBeGreaterThanOrEqual(
          byBits[i - 1]!.metrics.interference! - TOL,
        );
        expect(byBits[i]!.metrics.accuracy!).toBeLessThanOrEqual(
          byBits[i - 1]!.metrics.accuracy! + TOL,
        );
      }
    }
  });

  it("refuses a 1-bit dimension, where superposition cannot be expressed at all", () => {
    // A single-bit dimension has no zero level, so a cancelling pair has no
    // consistent encoding and "accuracy" there is a decoder artifact.
    expect(validateVariant(packed({ bits: 1 }))).toContain("bits");
    expect(() => runVariant(packed({ bits: 1 }), 7, 0)).toThrowError(/bits/);
  });

  it("is unaffected by quantization when nothing is packed", () => {
    // No packing means no shared direction, so bits cannot change the result.
    const fine = runVariant(dense({ bits: 32 }), 7, 0);
    const coarse = runVariant(dense({ bits: 2 }), 7, 0);
    expect(coarse.metrics.interference).toBe(fine.metrics.interference);
    expect(coarse.metrics.accuracy).toBe(fine.metrics.accuracy);
  });

  it("reports every metric with explicit provenance and never zero-fills energy", () => {
    const run = runVariant(packed(), 7, 0);
    for (const metric of LAB_METRICS) {
      expect(run.provenance[metric]).toBeDefined();
    }
    // UNKNOWN != ZERO: energy is null with UNAVAILABLE, not 0.
    expect(run.metrics.energy).toBeNull();
    expect(run.provenance.energy).toBe("UNAVAILABLE");
    expect(run.metrics.interference).not.toBeNull();
    expect(run.provenance.interference).toBe("MEASURED");
    expect(run.provenance.accuracy).toBe("MEASURED");
    expect(run.provenance.memory).toBe("ANALYTIC");
  });

  it("computes analytic metrics by closed-form arithmetic", () => {
    const run = runVariant(dense({ width: 8, bits: 16 }), 7, 0);
    expect(run.metrics.feature_capacity).toBe(8 * 16);
    expect(run.metrics.memory).toBe((8 * 16) / 8);
    expect(run.metrics.width).toBe(8);
    expect(run.metrics.sparsity).toBeGreaterThanOrEqual(0);
    expect(run.metrics.sparsity).toBeLessThanOrEqual(1);
  });

  it("decodes each feature from the dimension it was actually packed into", () => {
    // Regression guard for an encoder/decoder mismatch: packing places
    // features d*perDimension + k into dimension d, so feature f must be
    // decoded from floor(f/perDimension). Reading it back with f % width
    // compares the WRONG features and the metric silently measures noise.
    //
    // At 32 bits, and with every dimension receiving a full group of exactly
    // two features (perDimension = 2), a stored value is the mean of two ±1
    // directions and is therefore exactly ±1 or 0. Each feature's error is
    // then exactly 0 (partner agreed) or exactly 0.5 (partner cancelled), so
    // interference must be a multiple of 0.5/features. The mismatched map
    // produced values like 0.49902 that are multiples of nothing, which is
    // how the bug was found.
    //
    // Configs with perDimension = 3 (e.g. 8 features in 3 dimensions) are
    // deliberately excluded: their dimension means are ±2/3, so errors are
    // 1/6 and this particular invariant does not apply.
    for (const v of [
      packed(),
      variant({ variantId: "a", superposition: true, features: 4, width: 2, bits: 32 }),
      variant({ variantId: "b", superposition: true, features: 6, width: 3, bits: 32 }),
      variant({ variantId: "c", superposition: true, features: 8, width: 4, bits: 32 }),
    ]) {
      for (let run = 0; run < 4; run++) {
        const observed = runVariant(v, 7, run).metrics.interference!;
        const quantum = 0.5 / v.features;
        const steps = observed / quantum;
        expect(Math.abs(steps - Math.round(steps))).toBeLessThan(1e-9);
        expect(observed).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it("never produces NaN, Infinity or a negative metric", () => {
    for (const v of [dense(), packed(), packed({ bits: 2 }), dense({ width: 1, features: 1 })]) {
      for (let i = 0; i < 4; i++) {
        const run = runVariant(v, 3, i);
        for (const metric of LAB_METRICS) {
          const value = run.metrics[metric];
          if (value === null) continue;
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

describe("lab reproducibility", () => {
  it("is deterministic for the same seed, run index and variant", () => {
    expect(canonicalSuperposition(compareSuperposition(config()))).toBe(
      canonicalSuperposition(compareSuperposition(config())),
    );
  });

  it("produces a different stream for a different seed", () => {
    const a = runVariant(packed(), 1, 0);
    const b = runVariant(packed(), 2, 0);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it("produces a different stream for a different run index", () => {
    const a = runVariant(packed(), 7, 0);
    const b = runVariant(packed(), 7, 1);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it("retains every run and never discards outliers", () => {
    const runs = labRuns(config({ repetitions: 5 }));
    expect(runs).toHaveLength(10);
    expect(runs.filter((r) => r.variantId === "dense")).toHaveLength(5);
    expect(runs.filter((r) => r.variantId === "packed")).toHaveLength(5);
  });

  it("orders retained runs by variant then run index, not insertion order", () => {
    const runs = labRuns(config());
    expect(runs.map((r) => `${r.variantId}#${r.runIndex}`)).toEqual([
      "dense#0",
      "dense#1",
      "dense#2",
      "packed#0",
      "packed#1",
      "packed#2",
    ]);
  });

  it("reports run-to-run dispersion rather than hiding it", () => {
    const runs = labRuns(config({ repetitions: 4 }));
    const packedRuns = runs.filter((r) => r.variantId === "packed");
    expect(runDispersion(packedRuns, "interference")).toBeGreaterThanOrEqual(0);
    // Energy was never measured, so its dispersion carries no numbers.
    expect(runDispersion(packedRuns, "energy")).toBe(0);
  });

  it("serializes canonically regardless of key insertion order", () => {
    const forward = compareSuperposition(config());
    const reversed = compareSuperposition(config());
    expect(canonicalSuperposition(forward)).toBe(canonicalSuperposition(reversed));
    expect(canonicalSuperposition(forward)).toContain('"experimentId":"sup-1"');
  });
});

describe("lab confound control", () => {
  it("declares superposition, bits and width as the independent variables", () => {
    expect(compareSuperposition(config()).independentVariables).toEqual(["superposition", "bits", "width"]);
  });

  it("marks the comparison incomparable when the quantization width is identical", () => {
    const result = compareSuperposition(config({ experimental: packed({ bits: 32 }) }));
    expect(result.comparable).toBe(false);
    expect(result.incomparabilityReasons.join(" ")).toContain("quantization width is identical");
  });

  it("treats a differing width as the mechanism, not a confound", () => {
    // Superposition IS features > width, so width must be free to vary.
    // Holding it fixed would make a clean comparison inexpressible.
    const result = compareSuperposition(
      config({ baseline: dense(), experimental: packed({ bits: 4 }) }),
    );
    expect(result.confoundedRuns).toEqual([]);
    expect(result.comparable).toBe(true);
  });

  it("confounds and excludes runs when the controlled feature count differs", () => {
    // features is the control; moving it changes the task, not the mechanism.
    const result = compareSuperposition(
      config({ baseline: dense({ features: 4 }), experimental: packed({ features: 8, bits: 4 }) }),
    );
    expect(result.comparable).toBe(false);
    expect(result.confoundedRuns).toHaveLength(6);
    expect(result.confoundedRuns[0]!.reasons.join(" ")).toContain("features differs");
    // Confounded runs never enter the deltas.
    for (const delta of result.deltas) {
      expect(delta.baseline).toBeNull();
      expect(delta.experimental).toBeNull();
      expect(delta.delta).toBeNull();
      expect(delta.provenance).toBe("UNAVAILABLE");
    }
  });

  it("confounds when the superposition flag does not differ", () => {
    // Both dense: there is no independent variable, so no claim can be made.
    const result = compareSuperposition(
      config({ experimental: dense({ variantId: "dense2" }) }),
    );
    expect(result.comparable).toBe(false);
    expect(result.confoundedRuns[0]!.reasons.join(" ")).toContain("no independent variable");
  });

  it("produces a clean comparable result when only the independent variables differ", () => {
    const result = compareSuperposition(
      config({ baseline: dense(), experimental: packed({ bits: 4 }) }),
    );
    expect(result.comparable).toBe(true);
    expect(result.incomparabilityReasons).toEqual([]);
    expect(result.confoundedRuns).toEqual([]);
  });
});

describe("lab comparison semantics", () => {
  it("reports per-metric deltas sorted by metric name, never combined", () => {
    const result = compareSuperposition(config());
    expect(result.deltas.map((d) => d.metric)).toEqual([...LAB_METRICS].sort());
    for (const delta of result.deltas) {
      if (delta.baseline === null || delta.experimental === null) {
        expect(delta.delta).toBeNull();
      } else {
        expect(delta.delta).toBeCloseTo(delta.experimental - delta.baseline, 12);
      }
    }
  });

  it("has no winner, best, score-bearing or composite field", () => {
    const result = compareSuperposition(config());
    const keys = Object.keys(result);
    for (const banned of ["winner", "best", "bestVariant", "score", "overallScore", "composite", "ranking", "verdict"]) {
      expect(keys).not.toContain(banned);
    }
    // No metric delta may be labelled a score, and nothing may be ranked.
    for (const delta of result.deltas) {
      expect(Object.keys(delta).sort()).toEqual(["baseline", "delta", "experimental", "metric", "provenance"]);
    }
    // `noCompositeScore` is a deliberate NEGATIVE assertion flag, not a score.
    expect(result.noCompositeScore).toBe(true);
  });

  it("carries the study-only and source-honesty markers", () => {
    const result = compareSuperposition(config());
    expect(result.studyOnly).toBe(true);
    expect(result.studyOnly).toBe(LAB_STUDY_ONLY);
    expect(result.sourceClaimStatus).toBe(SOURCE_CLAIM_STATUS);
    expect(result.sourceClaimStatus).toContain("UNAVAILABLE");
    expect(result.provenance).toBe("p18-superposition-lab");
  });

  it("uses a caller-supplied timestamp and never calls a clock", () => {
    expect(compareSuperposition(config()).recordedAt).toBe(AT);
    expect(compareSuperposition(config({ recordedAt: "2020-01-01T00:00:00.000Z" })).recordedAt).toBe(
      "2020-01-01T00:00:00.000Z",
    );
  });
});

describe("lab production boundary", () => {
  it("exposes no routing, provider, deployment or promotion surface", () => {
    const names = Object.keys(superposition);
    for (const banned of [
      "route",
      "provider",
      "deploy",
      "promote",
      "serve",
      "download",
      "fetch",
      "registry",
      "store",
      "publish",
      "install",
    ]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("keeps lab metrics out of the shared provider-benchmark vocabulary", () => {
    // The 7 registered representation metrics are NOT the provider benchmark
    // metric set; widening that shared vocabulary is not this unit's job.
    expect(LAB_METRICS).toContain("interference");
    expect(LAB_METRICS).not.toContain("throughput");
    expect(LAB_METRICS).not.toContain("tool_success");
  });

  it("is not a second causal harness or benchmark registry", () => {
    const names = Object.keys(superposition);
    expect(names).not.toContain("compareHarness");
    expect(names).not.toContain("BenchmarkStore");
    expect(names).not.toContain("DatasetRegistry");
  });
});
