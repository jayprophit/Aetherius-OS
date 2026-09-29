import { describe, expect, it } from "vitest";
import {
  DIMENSION_KINDS,
  PROFILE_DIMENSIONS,
  RISK_LEVELS,
  buildProfile,
  derivedRates,
  measuredCount,
} from "./deploymentProfile";
import type { DeploymentProfile } from "./deploymentProfile";

/** Dimension-specific fixtures: every measurement declares its own evidence. */
function rateMetric(over: Record<string, unknown> = {}) {
  return {
    rate: 0.92,
    observations: 240,
    method: "eval-harness-7",
    evidenceRefs: ["evidence:eval-7"],
    provenance: "test",
    observedAt: "2026-09-29T10:00:00.000Z",
    ...over,
  };
}

function input(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    profileId: "profile-1",
    subjectRef: "artifact:mat-query-1.0.0",
    measurements: [
      { dimension: "accuracy", metric: rateMetric() },
      { dimension: "reliability", metric: rateMetric({ rate: 0.98, observations: 500 }) },
      { dimension: "escalation-review-rate", metric: rateMetric({ rate: 0.07, observations: 900 }) },
      {
        dimension: "cost",
        metric: {
          model: 12.5, execution: 3.25, review: 1.0, unit: "USD",
          method: "billing-export", evidenceRefs: ["evidence:bill-3"],
          provenance: "test", observedAt: "2026-09-29T10:00:00.000Z",
        },
      },
      {
        dimension: "residual-risk",
        metric: {
          level: "LOW", rationale: "sandboxed, reviewed, reversible", method: "threat-review",
          evidenceRefs: ["evidence:threat-model-2"],
          provenance: "test", observedAt: "2026-09-29T10:00:00.000Z",
        },
      },
      {
        dimension: "evidence-coverage",
        metric: {
          covered: 41, total: 44, method: "evidence-audit",
          evidenceRefs: ["evidence:audit-1"],
          provenance: "test", observedAt: "2026-09-29T10:00:00.000Z",
        },
      },
      {
        dimension: "recovery-success",
        metric: {
          successes: 17, attempts: 19, method: "chaos-drill-4",
          evidenceRefs: ["evidence:drill-4"],
          provenance: "test", observedAt: "2026-09-29T10:00:00.000Z",
        },
      },
    ],
    provenance: "test",
    ...over,
  };
}

describe("deployment profile: registered vocabulary", () => {
  it("declares exactly the seven registered dimensions", () => {
    expect([...PROFILE_DIMENSIONS]).toEqual([
      "accuracy",
      "reliability",
      "escalation-review-rate",
      "cost",
      "residual-risk",
      "evidence-coverage",
      "recovery-success",
    ]);
  });

  it("fixes one metric kind per dimension", () => {
    expect(DIMENSION_KINDS).toEqual({
      accuracy: "rate",
      reliability: "rate",
      "escalation-review-rate": "rate",
      cost: "cost",
      "residual-risk": "risk",
      "evidence-coverage": "coverage",
      "recovery-success": "recovery",
    });
    expect([...RISK_LEVELS]).toEqual(["LOW", "MEDIUM", "HIGH"]);
  });

  it("rejects an eighth dimension", () => {
    expect(() =>
      buildProfile({
        ...input(),
        measurements: [{ dimension: "vibes", metric: rateMetric() }],
      }),
    ).toThrowError(expect.objectContaining({ code: "PROFILE_UNKNOWN_DIMENSION" }));
  });
});

describe("deployment profile: measured or missing, never zero-filled", () => {
  it("builds a fully measured profile", () => {
    const profile = buildProfile(input());
    expect(profile.slots).toHaveLength(7);
    expect(profile.slots.every((s) => s.state === "MEASURED")).toBe(true);
    expect(measuredCount(profile)).toBe(7);
  });

  it("marks absent dimensions UNAVAILABLE with reasons, never zeros", () => {
    const profile = buildProfile({
      ...input(),
      measurements: [{ dimension: "accuracy", metric: rateMetric() }],
    });
    const reliability = profile.slots.find((s) => s.dimension === "reliability")!;
    expect(reliability.state).toBe("UNAVAILABLE");
    expect(reliability.unavailableReason).toBe("not observed");
    expect(reliability.metric).toBeUndefined();
    expect(measuredCount(profile)).toBe(1);
  });

  it("accepts an explicit unavailable reason per dimension", () => {
    const profile = buildProfile({
      ...input(),
      measurements: [{ dimension: "cost", unavailableReason: "billing export not yet run" }],
    });
    const cost = profile.slots.find((s) => s.dimension === "cost")!;
    expect(cost.state).toBe("UNAVAILABLE");
    expect(cost.unavailableReason).toBe("billing export not yet run");
  });

  it("rejects a measurement carrying both metric and reason", () => {
    expect(() =>
      buildProfile({
        ...input(),
        measurements: [{ dimension: "accuracy", metric: rateMetric(), unavailableReason: "x" }],
      }),
    ).toThrowError(expect.objectContaining({ code: "PROFILE_INVALID_INPUT" }));
  });

  it("rejects absent-without-reason", () => {
    expect(() =>
      buildProfile({ ...input(), measurements: [{ dimension: "accuracy" }] }),
    ).toThrowError(expect.objectContaining({ code: "PROFILE_INVALID_INPUT" }));
  });
});

describe("deployment profile: per-kind validation", () => {
  it("rejects non-finite and out-of-range rates", () => {
    for (const rate of [Number.NaN, Number.POSITIVE_INFINITY, -0.1, 1.1]) {
      expect(() =>
        buildProfile({ ...input(), measurements: [{ dimension: "accuracy", metric: rateMetric({ rate }) }] }),
      ).toThrowError(expect.objectContaining({ code: "PROFILE_BAD_RATE" }));
    }
  });

  it("requires support counts and evidence on every measurement", () => {
    expect(() =>
      buildProfile({ ...input(), measurements: [{ dimension: "accuracy", metric: { ...rateMetric(), observations: -1 } }] }),
    ).toThrowError(expect.objectContaining({ code: "PROFILE_BAD_COUNT" }));
    expect(() =>
      buildProfile({ ...input(), measurements: [{ dimension: "accuracy", metric: { ...rateMetric(), method: "" } }] }),
    ).toThrowError(expect.objectContaining({ code: "PROFILE_INVALID_INPUT" }));
    expect(() =>
      buildProfile({ ...input(), measurements: [{ dimension: "accuracy", metric: { ...rateMetric(), observedAt: "" } }] }),
    ).toThrowError(expect.objectContaining({ code: "PROFILE_INVALID_INPUT" }));
  });

  it("rejects invented risk levels and reasonless risk", () => {
    expect(() =>
      buildProfile({
        ...input(),
        measurements: [{
          dimension: "residual-risk",
          metric: { level: "NEGLIGIBLE", rationale: "x", evidenceRefs: [], provenance: "t", observedAt: "2026-09-29T10:00:00.000Z" },
        }],
      }),
    ).toThrowError(expect.objectContaining({ code: "PROFILE_INVALID_INPUT" }));
    expect(() =>
      buildProfile({
        ...input(),
        measurements: [{
          dimension: "residual-risk",
          metric: { level: "LOW", rationale: "", evidenceRefs: [], provenance: "t", observedAt: "2026-09-29T10:00:00.000Z" },
        }],
      }),
    ).toThrowError(expect.objectContaining({ code: "PROFILE_INVALID_INPUT" }));
  });

  it("rejects covered-exceeds-total and successes-exceed-attempts", () => {
    expect(() =>
      buildProfile({
        ...input(),
        measurements: [{
          dimension: "evidence-coverage",
          metric: { covered: 50, total: 44, method: "m", evidenceRefs: [], provenance: "t", observedAt: "2026-09-29T10:00:00.000Z" },
        }],
      }),
    ).toThrowError(expect.objectContaining({ code: "PROFILE_BAD_COUNT" }));
    expect(() =>
      buildProfile({
        ...input(),
        measurements: [{
          dimension: "recovery-success",
          metric: { successes: 20, attempts: 19, method: "m", evidenceRefs: [], provenance: "t", observedAt: "2026-09-29T10:00:00.000Z" },
        }],
      }),
    ).toThrowError(expect.objectContaining({ code: "PROFILE_BAD_COUNT" }));
  });

  it("rejects negative costs and missing units", () => {
    expect(() =>
      buildProfile({
        ...input(),
        measurements: [{
          dimension: "cost",
          metric: { model: -1, execution: 0, review: 0, unit: "USD", method: "m", evidenceRefs: [], provenance: "t", observedAt: "2026-09-29T10:00:00.000Z" },
        }],
      }),
    ).toThrowError(expect.objectContaining({ code: "PROFILE_BAD_COUNT" }));
    expect(() =>
      buildProfile({
        ...input(),
        measurements: [{
          dimension: "cost",
          metric: { model: 1, execution: 0, review: 0, unit: "", method: "m", evidenceRefs: [], provenance: "t", observedAt: "2026-09-29T10:00:00.000Z" },
        }],
      }),
    ).toThrowError(expect.objectContaining({ code: "PROFILE_INVALID_INPUT" }));
  });
});

describe("deployment profile: derived rates computed here, never asserted", () => {
  it("derives coverage and recovery rates from counts", () => {
    const rates = derivedRates(buildProfile(input()));
    expect(rates["accuracy"]).toBeCloseTo(0.92, 9);
    expect(rates["evidence-coverage"]).toBeCloseTo(41 / 44, 9);
    expect(rates["recovery-success"]).toBeCloseTo(17 / 19, 9);
    expect(rates["cost"]).toBeNull();
    expect(rates["residual-risk"]).toBeNull();
  });

  it("reports null for unmeasured dimensions and zero denominators", () => {
    const rates = derivedRates(
      buildProfile({
        ...input(),
        measurements: [
          { dimension: "evidence-coverage", metric: { covered: 0, total: 0, method: "m", evidenceRefs: [], provenance: "t", observedAt: "2026-09-29T10:00:00.000Z" } },
        ],
      }),
    );
    expect(rates["accuracy"]).toBeNull();
    expect(rates["evidence-coverage"]).toBeNull();
  });
});

describe("deployment profile: duplicates, determinism, purity", () => {
  it("treats identical duplicate dimensions as idempotent", () => {
    const measurement = { dimension: "accuracy", metric: rateMetric() };
    const profile = buildProfile({ ...input(), measurements: [measurement, measurement] });
    expect(profile.slots.filter((s) => s.dimension === "accuracy")).toHaveLength(1);
  });

  it("rejects same dimension with changed content", () => {
    expect(() =>
      buildProfile({
        ...input(),
        measurements: [
          { dimension: "accuracy", metric: rateMetric() },
          { dimension: "accuracy", metric: rateMetric({ rate: 0.5 }) },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: "PROFILE_INVALID_INPUT" }));
  });

  it("is deterministic from scrambled measurement order", () => {
    const measurements = (input().measurements as unknown[]).filter(Boolean);
    const forward = buildProfile(input({ measurements }));
    const reversed = buildProfile(input({ measurements: [...measurements].reverse() }));
    expect(JSON.stringify(forward)).toBe(JSON.stringify(reversed));
    expect(forward.slots.map((s) => s.dimension)).toEqual([...PROFILE_DIMENSIONS]);
  });

  it("does not mutate caller input", () => {
    const given = input();
    const snapshot = JSON.stringify(given);
    buildProfile(given);
    expect(JSON.stringify(given)).toBe(snapshot);
  });

  it("rejects empty profileId, subjectRef, and provenance", () => {
    expect(() => buildProfile(input({ profileId: "" }))).toThrowError(
      expect.objectContaining({ code: "PROFILE_INVALID_INPUT" }),
    );
    expect(() => buildProfile(input({ subjectRef: "  " }))).toThrowError(
      expect.objectContaining({ code: "PROFILE_INVALID_INPUT" }),
    );
    expect(() => buildProfile("profile")).toThrowError(
      expect.objectContaining({ code: "PROFILE_INVALID_INPUT" }),
    );
  });
});

describe("deployment profile: strict shapes with security precedence", () => {
  it("rejects authority, secret, and persona keys with their own codes", () => {
    expect(() => buildProfile({ ...input(), releaseApproved: true } as never)).toThrowError(
      expect.objectContaining({ code: "PROFILE_AUTHORITY_REJECTED" }),
    );
    expect(() => buildProfile({ ...input(), score: 87 } as never)).toThrowError(
      expect.objectContaining({ code: "PROFILE_AUTHORITY_REJECTED" }),
    );
    expect(() => buildProfile({ ...input(), token: "t" } as never)).toThrowError(
      expect.objectContaining({ code: "PROFILE_SECRET_REJECTED" }),
    );
    expect(() => buildProfile({ ...input(), persona: "p" } as never)).toThrowError(
      expect.objectContaining({ code: "PROFILE_PERSONALITY_REJECTED" }),
    );
  });

  it("rejects unknown profile and measurement fields", () => {
    // verdict is authority-adjacent by design, so precedence reports it as
    // such; a neutral unknown key exercises the generic unknown-field path.
    expect(() => buildProfile({ ...input(), color: "blue" } as never)).toThrowError(
      expect.objectContaining({ code: "PROFILE_UNKNOWN_FIELD" }),
    );
    expect(() =>
      buildProfile({ ...input(), measurements: [{ dimension: "accuracy", metric: rateMetric(), weight: 2 } as never] }),
    ).toThrowError(expect.objectContaining({ code: "PROFILE_UNKNOWN_FIELD" }));
  });

  it("emits no score, verdict, grant, deploy, or release-scope surface", () => {
    const profile = buildProfile(input()) as unknown as Record<string, unknown>;
    expect(Object.keys(profile).sort()).toEqual(["profileId", "provenance", "slots", "subjectRef"]);
    const body = JSON.stringify(profile);
    for (const banned of ["score", "verdict", "grant", "deploy", "approv", "release", "complet"]) {
      expect(body.toLowerCase().split('"').filter((w, i) => i % 2 === 1)).not.toContain(banned);
    }
  });
});
