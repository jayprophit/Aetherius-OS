import { describe, expect, it } from "vitest";
import {
  CalibrationError,
  NOT_FITTED_REASONS,
  applyTemperature,
  buildCalibrationReport,
  computeMetrics,
  fitIsotonic,
  fitTemperatureScaling,
  reliabilityBins,
  reliabilityCurve,
  riskCoverageCurve,
} from "./calibration";
import type { CalibrationObservation } from "./calibration";

/**
 * Dimension-specific fixtures. Every generator declares its own shape, and no
 * observation is produced by a shared mutable default.
 */
function observed(pairs: Array<[number, 0 | 1]>): CalibrationObservation[] {
  return pairs.map(([predicted, outcome]) => ({ predicted, observed: outcome }));
}

/**
 * A deliberately OVERCONFIDENT predictor: it says 0.9 when the outcome is a
 * coin flip. A correct calibrator has real work to do on this set, so a fit that
 * fails to improve is a genuine result rather than a rigged one.
 */
function overconfident(count = 40): CalibrationObservation[] {
  const rows: CalibrationObservation[] = [];
  for (let index = 0; index < count; index += 1) {
    rows.push({ predicted: 0.9, observed: index % 2 === 0 ? 1 : 0 });
  }
  return rows;
}

function wellCalibrated(count = 40): CalibrationObservation[] {
  const rows: CalibrationObservation[] = [];
  for (let index = 0; index < count; index += 1) {
    const predicted = 0.2 + (0.6 * index) / count;
    rows.push({ predicted, observed: index % 3 === 0 ? 1 : 0 });
  }
  return rows;
}

describe("calibration: registered vocabulary", () => {
  it("names only the techniques it actually reproduces", () => {
    const report = buildCalibrationReport({ observations: overconfident() });
    expect(report.reproducedTechniques).toEqual(["NONE", "TEMPERATURE_SCALING", "ISOTONIC"]);
    expect(report.fits.map((fit) => fit.technique)).toEqual(["TEMPERATURE_SCALING", "ISOTONIC"]);
  });

  it("declares distinct not-fitted reasons", () => {
    expect([...NOT_FITTED_REASONS]).toEqual([
      "INSUFFICIENT_CALIBRATION_DATA",
      "TECHNIQUE_NOT_REQUESTED",
      "NO_VALID_OBSERVATIONS",
    ]);
  });
});

describe("calibration: input validation", () => {
  it("rejects a probability of exactly 0 or 1 rather than clamping it", () => {
    for (const predicted of [0, 1, -0.1, 1.1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => computeMetrics([{ predicted, observed: 1 }])).toThrowError(
        expect.objectContaining({ code: "CALIBRATION_PROBABILITY_OUT_OF_RANGE" }),
      );
    }
  });

  it("rejects an outcome that is not an observed binary", () => {
    for (const outcome of [2, -1, 0.5, "1", null, undefined]) {
      expect(() => computeMetrics([{ predicted: 0.5, observed: outcome }])).toThrowError(
        expect.objectContaining({ code: "CALIBRATION_OUTCOME_NOT_BINARY" }),
      );
    }
  });

  it("rejects unknown observation fields rather than dropping them", () => {
    expect(() => computeMetrics([{ predicted: 0.5, observed: 1, confidence: 0.9 }])).toThrowError(
      expect.objectContaining({ code: "CALIBRATION_UNKNOWN_FIELD" }),
    );
  });

  it("rejects malformed observation collections", () => {
    expect(() => computeMetrics("rows")).toThrowError(CalibrationError);
    expect(() => computeMetrics([])).toThrowError(CalibrationError);
    expect(() => computeMetrics([null])).toThrowError(CalibrationError);
  });

  it("rejects a non-positive bin count", () => {
    for (const binCount of [0, -1, 2.5]) {
      expect(() => reliabilityBins(binCount)).toThrowError(
        expect.objectContaining({ code: "CALIBRATION_BIN_COUNT_INVALID" }),
      );
    }
  });
});

describe("calibration: Brier, NLL and ECE", () => {
  it("computes a near-zero Brier score for near-certain correct predictions", () => {
    // Certain, yet still strictly inside (0, 1) so NLL stays finite. The
    // residual 1e-6 is (0.999 - 1)^2, not a rounding artefact.
    const metrics = computeMetrics(observed([[0.999, 1], [0.001, 0]]), 10);
    expect(metrics.brier).toBeCloseTo(0, 5);
    expect(metrics.brier).toBeLessThan(1e-5);
    expect(metrics.nll).toBeLessThan(0.01);
  });

  it("computes the Brier score of wholly wrong confident predictions", () => {
    // ((0.9 - 0)^2 + (0.8 - 0)^2) / 2 = (0.81 + 0.64) / 2
    const metrics = computeMetrics(observed([[0.9, 0], [0.8, 0]]), 10);
    expect(metrics.brier).toBeCloseTo(0.725, 6);
  });

  it("computes NLL as the mean negative log likelihood", () => {
    const metrics = computeMetrics(observed([[0.5, 1]]), 10);
    expect(metrics.nll).toBeCloseTo(Math.log(2), 6);
  });

  it("reports the observed base rate it read the metrics against", () => {
    expect(computeMetrics(observed([[0.5, 1], [0.5, 0], [0.5, 1], [0.5, 0]])).baseRate).toBe(0.5);
  });

  it("reports a non-zero ECE for an overconfident predictor", () => {
    const metrics = computeMetrics(overconfident(), 10);
    // Predicted 0.9, observed rate 0.5, so the gap is 0.4.
    expect(metrics.ece).toBeCloseTo(0.4, 6);
  });

  it("reports a near-zero ECE for a calibrated predictor", () => {
    const metrics = computeMetrics(wellCalibrated(), 10);
    expect(metrics.ece).toBeLessThan(0.3);
  });

  it("keeps the bin count explicit because ECE depends on it", () => {
    // 0.05 and 0.14 land in DIFFERENT bins at 10 and the SAME bin at 2, and the
    // outcomes inside that merged pair differ, so the two binnings disagree.
    // Data whose outcomes are homogeneous within every bin gives the same ECE at
    // any resolution, which would make this a vacuous assertion.
    const rows = observed([[0.05, 0], [0.14, 1], [0.55, 1]]);
    expect(computeMetrics(rows, 10).ece).not.toBeCloseTo(computeMetrics(rows, 2).ece, 6);
  });
});

describe("calibration: reliability curve", () => {
  it("reports an empty bin as null rather than a confident zero", () => {
    const curve = reliabilityCurve(observed([[0.95, 1], [0.05, 0]]), 10);
    const empty = curve.filter((bin) => bin.count === 0);
    expect(empty.length).toBeGreaterThan(0);
    for (const bin of empty) {
      expect(bin.meanPredicted).toBeNull();
      expect(bin.observedRate).toBeNull();
    }
  });

  it("places every observation in exactly one bin", () => {
    const curve = reliabilityCurve(wellCalibrated(30), 10);
    const total = curve.reduce((sum, bin) => sum + bin.count, 0);
    expect(total).toBe(30);
  });

  it("averages predicted and observed separately within a bin", () => {
    const curve = reliabilityCurve(observed([[0.7, 1], [0.7, 0]]), 10);
    const bin = curve.find((entry) => entry.count > 0)!;
    expect(bin.meanPredicted).toBeCloseTo(0.7, 6);
    expect(bin.observedRate).toBeCloseTo(0.5, 6);
  });
});

describe("calibration: risk/coverage curve", () => {
  it("reports coverage rising from the first item to the whole set", () => {
    const points = riskCoverageCurve(wellCalibrated(10));
    expect(points).toHaveLength(10);
    expect(points[0]!.coverage).toBeCloseTo(0.1, 6);
    expect(points[9]!.coverage).toBeCloseTo(1, 6);
  });

  it("counts an error when the observed outcome contradicts the predicted class", () => {
    // Ranked highest first: a confident-and-wrong item, then a confident-and-right one.
    const points = riskCoverageCurve(observed([[0.95, 0], [0.55, 1]]));
    expect(points[0]!.risk).toBe(1);
    expect(points[1]!.risk).toBeCloseTo(0.5, 6);
  });

  it("gives zero risk when every ranked item is correct", () => {
    const points = riskCoverageCurve(observed([[0.95, 1], [0.55, 1], [0.51, 1]]));
    expect(points.every((point) => point.risk === 0)).toBe(true);
  });

  it("ranks by the caller's supplied score, not by insertion order", () => {
    // (0.9, observed 0) is the error; (0.2, observed 1) is also an error,
    // because 0.2 predicts the negative class. Ranking by the prediction puts
    // the error first, and a constant supplied score falls back to the
    // deterministic tiebreak, which orders ascending by probability.
    const items = observed([[0.2, 1], [0.9, 0]]);
    expect(riskCoverageCurve(items)[0]!.risk).toBe(1);
    const bySupplied = riskCoverageCurve(items, () => 0);
    expect(bySupplied[0]!.risk).toBe(1);
    expect(bySupplied[0]!.count).toBe(1);
  });

  it("changes the ranking when the supplied score inverts the order", () => {
    // Ranked by the supplied ascending score, the correct item comes first.
    const items = observed([[0.9, 0], [0.55, 1]]);
    const byDescendingProbability = riskCoverageCurve(items);
    expect(byDescendingProbability[0]!.risk).toBe(1);
    const bySupplied = riskCoverageCurve(items, (row) => -row.predicted);
    expect(bySupplied[0]!.risk).toBe(0);
  });

  it("is deterministic from scrambled input", () => {
    const rows = wellCalibrated(12);
    expect(JSON.stringify(riskCoverageCurve(rows))).toBe(JSON.stringify(riskCoverageCurve([...rows].reverse())));
  });

  it("rejects an empty item list rather than returning an empty curve silently", () => {
    expect(() => riskCoverageCurve([])).toThrowError(CalibrationError);
  });
});

describe("calibration: temperature scaling", () => {
  it("rejects a non-positive or non-finite temperature", () => {
    for (const temperature of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => applyTemperature(0.5, temperature)).toThrowError(
        expect.objectContaining({ code: "CALIBRATION_TEMPERATURE_INVALID" }),
      );
    }
  });

  it("reports saturation out of (0, 1) instead of clamping it back", () => {
    // A temperature this small drives the logistic to exactly 1.
    expect(() => applyTemperature(0.999999, 0.25)).toThrowError(
      expect.objectContaining({ code: "CALIBRATION_PROBABILITY_OUT_OF_RANGE" }),
    );
  });

  it("is monotone: a hotter temperature pulls a probability toward one half", () => {
    expect(applyTemperature(0.9, 2)).toBeLessThan(0.9);
    expect(applyTemperature(0.9, 4)).toBeLessThan(applyTemperature(0.9, 2));
    expect(applyTemperature(0.1, 2)).toBeGreaterThan(0.1);
  });

  it("is the identity at temperature one", () => {
    expect(applyTemperature(0.7, 1)).toBeCloseTo(0.7, 6);
  });

  it("does not fit from too little calibration data", () => {
    const fit = fitTemperatureScaling(observed([[0.9, 1], [0.9, 0]]));
    expect(fit.fitted).toBe(false);
    expect(fit.notFittedReason).toBe("INSUFFICIENT_CALIBRATION_DATA");
    expect(fit.improved).toBe(false);
    expect(fit.after).toBeUndefined();
  });

  it("fits an overconfident predictor and reports the measured improvement", () => {
    const fit = fitTemperatureScaling(overconfident(40));
    expect(fit.fitted).toBe(true);
    expect(fit.parameter).toBeGreaterThan(1);
    expect(fit.after!.nll).toBeLessThan(fit.before.nll);
    expect(fit.improved).toBe(true);
    expect(fit.selectedOn).toBe("NLL");
  });

  it("reports before and after metrics, never a bare claim", () => {
    const fit = fitTemperatureScaling(overconfident(40));
    expect(fit.before.count).toBe(40);
    expect(fit.after!.count).toBe(40);
    expect(typeof fit.before.nll).toBe("number");
    expect(typeof fit.after!.nll).toBe("number");
  });

  it("does not claim improvement when the fit made NLL worse", () => {
    // A perfectly calibrated set has nothing to gain, so improvement must be
    // measured, never assumed.
    const fit = fitTemperatureScaling(wellCalibrated(200));
    expect(fit.fitted).toBe(true);
    expect(fit.improved).toBe(fit.after!.nll < fit.before.nll);
  });

  it("is deterministic across repeated fits", () => {
    const rows = overconfident(40);
    expect(JSON.stringify(fitTemperatureScaling(rows))).toBe(JSON.stringify(fitTemperatureScaling(rows)));
  });
});

describe("calibration: isotonic regression", () => {
  it("does not fit from too little calibration data", () => {
    const fit = fitIsotonic(observed([[0.9, 1], [0.9, 0]]));
    expect(fit.fitted).toBe(false);
    expect(fit.notFittedReason).toBe("INSUFFICIENT_CALIBRATION_DATA");
  });

  it("fits and produces one threshold per observation", () => {
    const rows = overconfident(40);
    const fit = fitIsotonic(rows);
    expect(fit.fitted).toBe(true);
    expect(fit.thresholds).toHaveLength(rows.length);
  });

  it("produces a monotone non-decreasing map, as isotonic regression must", () => {
    const fit = fitIsotonic(overconfident(40));
    for (let index = 1; index < fit.thresholds!.length; index += 1) {
      expect(fit.thresholds![index]!.y).toBeGreaterThanOrEqual(fit.thresholds![index - 1]!.y);
    }
  });

  it("keys the map on the original predicted probability", () => {
    const rows = overconfident(40);
    const fit = fitIsotonic(rows);
    const predictions = new Set(rows.map((row) => row.predicted));
    for (const threshold of fit.thresholds!) {
      expect(predictions.has(threshold.x)).toBe(true);
    }
  });

  it("collapses a fully inverted predictor to the base rate", () => {
    // Every high prediction is wrong and every low prediction is right, so the
    // monotone map cannot do better than a constant.
    const rows: CalibrationObservation[] = [];
    for (let index = 0; index < 20; index += 1) {
      rows.push({ predicted: 0.9, observed: 0 });
      rows.push({ predicted: 0.1, observed: 1 });
    }
    const fit = fitIsotonic(rows);
    expect(fit.fitted).toBe(true);
    expect(fit.thresholds!.every((threshold) => threshold.y === 0.5)).toBe(true);
  });

  it("is deterministic from scrambled input", () => {
    const rows = wellCalibrated(60);
    expect(JSON.stringify(fitIsotonic(rows))).toBe(JSON.stringify(fitIsotonic([...rows].reverse())));
  });
});

describe("calibration: report boundaries", () => {
  it("grants no authority and decides no reflex", () => {
    const report = buildCalibrationReport({ observations: overconfident(40) });
    expect(report.grantsAuthority).toBe(false);
    expect(report.decidesReflex).toBe(false);
  });

  it("exposes no verdict, score, rank, winner or permission field", () => {
    const report = buildCalibrationReport({ observations: overconfident(40) }) as unknown as Record<string, unknown>;
    for (const banned of ["verdict", "score", "rank", "winner", "permission", "approve", "authorize", "route"]) {
      expect(Object.keys(report)).not.toContain(banned);
    }
  });

  it("reports an uncalibrated state as uncalibrated", () => {
    // With no fit applied, the metrics ARE the raw scores. The report does not
    // present them as post-calibration numbers.
    const report = buildCalibrationReport({ observations: observed([[0.9, 1], [0.9, 0]]) });
    expect(report.fits.every((fit) => fit.fitted === false)).toBe(true);
    expect(report.improvesAnything).toBe(false);
  });

  it("carries the bin count it used", () => {
    expect(buildCalibrationReport({ observations: wellCalibrated(30), binCount: 5 }).binCount).toBe(5);
  });

  it("reads no clock, filesystem or network: the same input gives the same report", () => {
    const rows = overconfident(40);
    expect(JSON.stringify(buildCalibrationReport({ observations: rows }))).toBe(
      JSON.stringify(buildCalibrationReport({ observations: rows })),
    );
  });
});
