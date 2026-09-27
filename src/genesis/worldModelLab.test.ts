import { describe, expect, it } from "vitest";
import { LabError, scoreScenario } from "./worldModelLab";
import type { WorldModelScenario } from "./worldModelLab";

/** Dimension-specific fixtures: every scenario declares its own trace. */
function scenario(over: Partial<WorldModelScenario> = {}): WorldModelScenario {
  return {
    scenarioId: "scn-1",
    hypotheses: [
      {
        hypothesisId: "h-rain",
        causeProperty: "clouds",
        effectProperty: "rain",
        effectValueDigest: "digest:rain",
        calibratedConfidence: 0.8,
      },
    ],
    predictions: [
      {
        predictionId: "p-1",
        hypothesisId: "h-rain",
        entityId: "field-7",
        expectedValueDigest: "digest:rain",
        issuedConfidence: 0.8,
        issuedAt: 100,
        dueAt: 200,
      },
    ],
    outcomes: [
      { predictionId: "p-1", observedValueDigest: "digest:rain", evidenceDigest: "ev:gauge", resolvedAt: 150 },
    ],
    interventions: [
      {
        interventionId: "i-1",
        causeProperty: "clouds",
        causeValueDigest: "digest:clouds",
        matchedHypothesisIds: ["h-rain"],
        observedEffectDigest: "digest:rain",
        evidenceDigest: "ev:gauge",
      },
    ],
    provenance: "test",
    ...over,
  };
}

describe("world-model lab: confirmed traces score cleanly", () => {
  it("scores a fully confirmed scenario", () => {
    const report = scoreScenario(scenario());
    expect(report.predictions).toHaveLength(1);
    expect(report.predictions[0]!.predictionId).toBe("p-1");
    expect(report.predictions[0]!.verdict).toBe("CONFIRMED");
    // |0.8 − 1| is 0.1999… in floating point, never exactly 0.2.
    expect(report.predictions[0]!.confidenceGap).toBeCloseTo(0.2, 9);
    expect(report.interventions).toEqual([{ interventionId: "i-1", verdict: "CONFIRMED", matchedCount: 1 }]);
    expect(report.quality.predictionHitRate).toBe(1);
    expect(report.quality.interventionConfirmRate).toBe(1);
    expect(report.quality.hypothesisSupport).toEqual([{ hypothesisId: "h-rain", support: 1, counter: 0 }]);
  });

  it("scores a refuted prediction with its confidence gap", () => {
    const report = scoreScenario(
      scenario({ outcomes: [{ predictionId: "p-1", observedValueDigest: "digest:dry", evidenceDigest: "ev:gauge", resolvedAt: 150 }] }),
    );
    expect(report.predictions[0]!.verdict).toBe("REFUTED");
    expect(report.predictions[0]!.confidenceGap).toBeCloseTo(0.8, 9);
    expect(report.quality.predictionHitRate).toBe(0);
  });

  it("refutes an intervention whose effect matches no declared expectation", () => {
    const report = scoreScenario(
      scenario({
        interventions: [
          {
            interventionId: "i-1",
            causeProperty: "clouds",
            causeValueDigest: "digest:clouds",
            matchedHypothesisIds: ["h-rain"],
            observedEffectDigest: "digest:hail",
            evidenceDigest: "ev:gauge",
          },
        ],
      }),
    );
    expect(report.interventions[0]!.verdict).toBe("REFUTED");
    expect(report.quality.interventionConfirmRate).toBe(0);
  });
});

describe("world-model lab: absent outcomes stay unresolved", () => {
  it("leaves a prediction without an outcome UNRESOLVED", () => {
    const report = scoreScenario(scenario({ outcomes: [] }));
    expect(report.predictions).toEqual([{ predictionId: "p-1", verdict: "UNRESOLVED" }]);
  });

  it("excludes unresolved predictions from every rate", () => {
    const report = scoreScenario(scenario({ outcomes: [] }));
    expect(report.quality.predictionHitRate).toBeNull();
    expect(report.quality.meanConfidenceGap).toBeNull();
    expect(report.quality.hypothesisSupport).toEqual([{ hypothesisId: "h-rain", support: 0, counter: 0 }]);
  });

  it("leaves an intervention without an observed effect UNRESOLVED", () => {
    const report = scoreScenario(
      scenario({
        interventions: [
          { interventionId: "i-1", causeProperty: "clouds", causeValueDigest: "digest:clouds", matchedHypothesisIds: ["h-rain"] },
        ],
      }),
    );
    expect(report.interventions[0]!.verdict).toBe("UNRESOLVED");
    expect(report.quality.interventionConfirmRate).toBeNull();
  });

  it("never zero-fills a rate with no resolved items", () => {
    const report = scoreScenario(scenario({ outcomes: [], interventions: [] }));
    expect(report.quality.predictionHitRate).toBeNull();
    expect(report.quality.interventionConfirmRate).toBeNull();
  });
});

describe("world-model lab: a result without evidence is malformed", () => {
  it("rejects an outcome that cites no evidence", () => {
    // An empty evidence string is "no evidence cited", not "a bad digest".
    expect(() =>
      scoreScenario(
        scenario({ outcomes: [{ predictionId: "p-1", observedValueDigest: "digest:rain", evidenceDigest: "", resolvedAt: 150 }] }),
      ),
    ).toThrowError(expect.objectContaining({ code: "LAB_OUTCOME_WITHOUT_EVIDENCE" }));
  });

  it("rejects half an intervention observation", () => {
    expect(() =>
      scoreScenario(
        scenario({
          interventions: [
            {
              interventionId: "i-1",
              causeProperty: "clouds",
              causeValueDigest: "digest:clouds",
              matchedHypothesisIds: ["h-rain"],
              observedEffectDigest: "digest:rain",
            },
          ],
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: "LAB_OUTCOME_WITHOUT_EVIDENCE" }));
    expect(() =>
      scoreScenario(
        scenario({
          interventions: [
            {
              interventionId: "i-1",
              causeProperty: "clouds",
              causeValueDigest: "digest:clouds",
              matchedHypothesisIds: ["h-rain"],
              evidenceDigest: "ev:gauge",
            },
          ],
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: "LAB_OUTCOME_WITHOUT_EVIDENCE" }));
  });
});

describe("world-model lab: structural validation", () => {
  it("rejects unknown fields anywhere in the trace", () => {
    expect(() => scoreScenario({ ...scenario(), wallMs: 12 })).toThrowError(
      expect.objectContaining({ code: "LAB_UNKNOWN_FIELD" }),
    );
    expect(() =>
      scoreScenario(scenario({ hypotheses: [{ ...scenario().hypotheses[0]!, throughput: 9 } as never] })),
    ).toThrowError(expect.objectContaining({ code: "LAB_UNKNOWN_FIELD" }));
  });

  it("keeps perf fields out structurally", () => {
    // Timing and throughput have no meaning in a quality eval.
    for (const key of ["wallMs", "latencyMs", "throughput", "tokensPerSecond"]) {
      expect(() => scoreScenario({ ...scenario(), [key]: 1 })).toThrowError(
        expect.objectContaining({ code: "LAB_UNKNOWN_FIELD" }),
      );
    }
  });

  it("rejects duplicate ids within each collection", () => {
    const base = scenario();
    expect(() => scoreScenario({ ...base, hypotheses: [base.hypotheses[0]!, base.hypotheses[0]!] })).toThrowError(
      expect.objectContaining({ code: "LAB_DUPLICATE_ID" }),
    );
    expect(() => scoreScenario({ ...base, predictions: [base.predictions[0]!, base.predictions[0]!] })).toThrowError(
      expect.objectContaining({ code: "LAB_DUPLICATE_ID" }),
    );
  });

  it("rejects references to unknown hypotheses and predictions", () => {
    const base = scenario();
    expect(() =>
      scoreScenario({ ...base, predictions: [{ ...base.predictions[0]!, hypothesisId: "h-ghost" }] }),
    ).toThrowError(expect.objectContaining({ code: "LAB_UNKNOWN_HYPOTHESIS" }));
    expect(() =>
      scoreScenario({ ...base, outcomes: [{ ...base.outcomes[0]!, predictionId: "p-ghost" }] }),
    ).toThrowError(expect.objectContaining({ code: "LAB_UNRESOLVED_REFERENCE" }));
    expect(() =>
      scoreScenario({
        ...base,
        interventions: [{ ...base.interventions[0]!, matchedHypothesisIds: ["h-ghost"] }],
      }),
    ).toThrowError(expect.objectContaining({ code: "LAB_UNKNOWN_HYPOTHESIS" }));
  });

  it("rejects impossible timestamps", () => {
    const base = scenario();
    expect(() =>
      scoreScenario({ ...base, predictions: [{ ...base.predictions[0]!, dueAt: 100, issuedAt: 100 }] }),
    ).toThrowError(expect.objectContaining({ code: "LAB_BAD_TIMESTAMP" }));
    expect(() =>
      scoreScenario({ ...base, outcomes: [{ ...base.outcomes[0]!, resolvedAt: 50 }] }),
    ).toThrowError(expect.objectContaining({ code: "LAB_BAD_TIMESTAMP" }));
  });

  it("rejects out-of-range confidences and empty digests", () => {
    const base = scenario();
    expect(() =>
      scoreScenario({ ...base, hypotheses: [{ ...base.hypotheses[0]!, calibratedConfidence: 1.5 }] }),
    ).toThrowError(expect.objectContaining({ code: "LAB_BAD_CONFIDENCE" }));
    expect(() =>
      scoreScenario({ ...base, hypotheses: [{ ...base.hypotheses[0]!, effectValueDigest: "  " }] }),
    ).toThrowError(expect.objectContaining({ code: "LAB_BAD_DIGEST" }));
  });

  it("rejects malformed top-level input", () => {
    expect(() => scoreScenario(null)).toThrowError(expect.objectContaining({ code: "LAB_INVALID_INPUT" }));
    expect(() => scoreScenario({ ...scenario(), hypotheses: "yes" })).toThrowError(
      expect.objectContaining({ code: "LAB_INVALID_INPUT" }),
    );
    expect(() => scoreScenario({ ...scenario(), scenarioId: "" })).toThrowError(
      expect.objectContaining({ code: "LAB_INVALID_INPUT" }),
    );
  });
});

describe("world-model lab: read-only and deterministic", () => {
  it("never mutates caller input, proven with frozen objects", () => {
    const given = scenario();
    const deepFreeze = (value: unknown): void => {
      if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
        Object.freeze(value);
        Object.values(value as Record<string, unknown>).forEach(deepFreeze);
      }
    };
    deepFreeze(given);
    expect(() => scoreScenario(given)).not.toThrow();
    expect(given.predictions).toHaveLength(1);
  });

  it("is deterministic from scrambled input order", () => {
    const base = scenario({
      predictions: [
        { predictionId: "p-2", hypothesisId: "h-rain", entityId: "f2", expectedValueDigest: "digest:rain", issuedConfidence: 0.6, issuedAt: 100, dueAt: 200 },
        { predictionId: "p-1", hypothesisId: "h-rain", entityId: "f1", expectedValueDigest: "digest:rain", issuedConfidence: 0.8, issuedAt: 100, dueAt: 200 },
      ],
      outcomes: [
        { predictionId: "p-1", observedValueDigest: "digest:rain", evidenceDigest: "ev:1", resolvedAt: 150 },
        { predictionId: "p-2", observedValueDigest: "digest:dry", evidenceDigest: "ev:2", resolvedAt: 150 },
      ],
    });
    const scrambled: WorldModelScenario = {
      ...base,
      predictions: [...base.predictions].reverse(),
      outcomes: [...base.outcomes].reverse(),
    };
    expect(JSON.stringify(scoreScenario(base))).toBe(JSON.stringify(scoreScenario(scrambled)));
  });

  it("sorts report entries canonically by id", () => {
    const report = scoreScenario(
      scenario({
        predictions: [
          { predictionId: "p-2", hypothesisId: "h-rain", entityId: "f2", expectedValueDigest: "digest:rain", issuedConfidence: 0.6, issuedAt: 100, dueAt: 200 },
          { predictionId: "p-1", hypothesisId: "h-rain", entityId: "f1", expectedValueDigest: "digest:rain", issuedConfidence: 0.8, issuedAt: 100, dueAt: 200 },
        ],
        outcomes: [],
      }),
    );
    expect(report.predictions.map((p) => p.predictionId)).toEqual(["p-1", "p-2"]);
  });

  it("emits per-dimension quality with no composite figure", () => {
    const report = scoreScenario(scenario()) as unknown as Record<string, unknown>;
    const quality = report.quality as Record<string, unknown>;
    for (const banned of ["score", "quality", "rating", "grade", "composite", "overall", "verdict"]) {
      expect(Object.keys(quality)).not.toContain(banned);
    }
  });

  it("accumulates per-hypothesis support across multiple outcomes", () => {
    const report = scoreScenario(
      scenario({
        predictions: [
          { predictionId: "p-1", hypothesisId: "h-rain", entityId: "f1", expectedValueDigest: "digest:rain", issuedConfidence: 0.8, issuedAt: 100, dueAt: 200 },
          { predictionId: "p-2", hypothesisId: "h-rain", entityId: "f2", expectedValueDigest: "digest:rain", issuedConfidence: 0.8, issuedAt: 100, dueAt: 200 },
        ],
        outcomes: [
          { predictionId: "p-1", observedValueDigest: "digest:rain", evidenceDigest: "ev:1", resolvedAt: 150 },
          { predictionId: "p-2", observedValueDigest: "digest:dry", evidenceDigest: "ev:2", resolvedAt: 150 },
        ],
      }),
    );
    expect(report.quality.hypothesisSupport).toEqual([{ hypothesisId: "h-rain", support: 1, counter: 1 }]);
    expect(report.quality.predictionHitRate).toBeCloseTo(0.5, 9);
    expect(report.quality.meanConfidenceGap).toBeCloseTo(0.5, 9);
  });
});
