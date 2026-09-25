import { describe, expect, it } from "vitest";
import { compareHarness } from "./harness";
import type { Experiment, Trial } from "./harness";

const CONTROLLED = {
  model: "local-m",
  modelVersion: "1.0.0",
  tools: ["fs", "shell"],
  permissions: "standard",
  environment: "lab-win",
  startingState: "commit-abc",
};

function experiment(over: Partial<Experiment> = {}): Experiment {
  return {
    experimentId: "exp-1",
    taskId: "task-1",
    harnessA: "native",
    harnessB: "candidate",
    controlled: { ...CONTROLLED },
    confounds: [],
    ...over,
  };
}

function trial(variant: "A" | "B", runIndex: number, over: Partial<Trial["observations"]> = {}): Trial {
  return {
    experimentId: "exp-1",
    variant,
    runIndex,
    conditions: {
      model: "local-m",
      modelVersion: "1.0.0",
      tools: ["shell", "fs"],
      permissions: "standard",
      environment: "lab-win",
    },
    observations: {
      successClaimed: true,
      successVerified: true,
      toolCalls: 10,
      toolErrors: 1,
      retries: 0,
      manualInterventions: 0,
      wallMs: 1000,
      escalations: 0,
      verificationFailures: 0,
      evidenceComplete: true,
      ...over,
    },
  };
}

describe("causal harness", () => {
  it("compares controlled A/B runs per metric without a composite", () => {
    const result = compareHarness(experiment(), [
      trial("A", 0),
      trial("A", 1, { toolErrors: 3, wallMs: 2000 }),
      trial("B", 0, { toolCalls: 6, wallMs: 500 }),
    ]);
    expect(result.comparable).toBe(true);
    expect(result.aggregates.A.runs).toBe(2);
    expect(result.aggregates.B.runs).toBe(1);
    expect(result.deltas.toolCalls).toBe(6 - 10);
    expect(result.deltas.wallMs).toBe(500 - 1500);
    expect(result.deltas.verifiedSuccess).toBe(1 - 2);
    expect(Object.keys(result)).not.toContain("winner");
    expect(Object.keys(result)).not.toContain("score");
    expect(result.confoundedTrials).toEqual([]);
  });

  it("separates claimed from verified success", () => {
    const result = compareHarness(experiment(), [
      trial("A", 0, { successClaimed: true, successVerified: false }),
      trial("B", 0, { successClaimed: true, successVerified: true }),
    ]);
    expect(result.aggregates.A.claimedSuccess).toBe(1);
    expect(result.aggregates.A.verifiedSuccess).toBe(0);
    expect(result.deltas.verifiedSuccess).toBe(1);
  });

  it("excludes confounded trials and lists them", () => {
    const offModel: Trial = {
      ...trial("B", 1),
      conditions: { ...trial("B", 1).conditions, model: "other-m" },
    };
    const offTools: Trial = {
      ...trial("B", 2),
      conditions: { ...trial("B", 2).conditions, tools: ["fs"] },
    };
    const offPerms: Trial = {
      ...trial("A", 1),
      conditions: { ...trial("A", 1).conditions, permissions: "elevated" },
    };
    const result = compareHarness(experiment(), [trial("A", 0), trial("B", 0), offModel, offTools, offPerms]);
    expect(result.aggregates.B.runs).toBe(1);
    expect(result.aggregates.B.confoundedRuns).toBe(2);
    expect(result.confoundedTrials).toHaveLength(3);
    expect(result.deltas.toolCalls).toBe(0);
  });

  it("declared confounds limit causal reading honestly", () => {
    const result = compareHarness(experiment({ confounds: ["network jitter uncontrolled"] }), [trial("A", 0)]);
    expect(result.comparable).toBe(false);
    expect(result.incomparabilityReasons.join(" ")).toContain("network jitter uncontrolled");
  });

  it("rejects malformed experiments and trials", () => {
    expect(() => compareHarness(experiment({ harnessA: "x", harnessB: "x" }), [])).toThrowError(/harness-ids/);
    expect(() => compareHarness(experiment(), [trial("C" as never, 0)])).toThrowError(/variant/);
    expect(() =>
      compareHarness(experiment(), [{ ...trial("A", 0), experimentId: "other" }]),
    ).toThrowError(/belongs to other/);
    expect(() =>
      compareHarness(experiment(), [trial("A", 0, { toolCalls: -1 })]),
    ).toThrowError(/observations/);
  });

  it("is deterministic", () => {
    const trials = [trial("B", 1), trial("A", 1), trial("B", 0), trial("A", 0)];
    const first = compareHarness(experiment(), trials);
    const second = compareHarness(experiment(), trials);
    expect(first).toEqual(second);
  });
});
