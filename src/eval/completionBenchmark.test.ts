import { describe, expect, it } from "vitest";
import { compareHarness, type ControlledConditions, type Experiment, type TrialObservations } from "./harness";
import { assessContamination } from "./contamination";
import {
  COMPLETION_FACETS,
  buildCompletionTrial,
  projectFacets,
  runCompletionBenchmark,
  toHarnessTrials,
  validateCompletionTrial,
} from "./completionBenchmark";
import * as completionBenchmark from "./completionBenchmark";
import type { CompletionTrialInput } from "./completionBenchmark";

/**
 * Dimension-specific fixtures. Every condition field and observation field is
 * set explicitly, and a "no tokens/cost" trial is built by deleting those
 * fields rather than by relying on a shared default that would silently
 * satisfy the availability check.
 */
function conditions(over: Partial<ControlledConditions> = {}): ControlledConditions {
  return {
    model: "m1",
    modelVersion: "1.0.0",
    tools: ["fs.read", "shell.exec"],
    permissions: "none",
    environment: "clean-room-sim",
    startingState: "empty-repo",
    ...over,
  };
}

function observations(over: Partial<TrialObservations> = {}): TrialObservations {
  return {
    successClaimed: true,
    successVerified: true,
    toolCalls: 4,
    toolErrors: 0,
    retries: 0,
    manualInterventions: 0,
    wallMs: 1200,
    escalations: 0,
    verificationFailures: 0,
    evidenceComplete: true,
    ...over,
  };
}

function trialInput(over: Partial<CompletionTrialInput> = {}): CompletionTrialInput {
  return {
    trialId: "t-a-0",
    experimentId: "exp-1",
    variant: "A",
    runIndex: 0,
    conditions: conditions(),
    deliverableRef: "deliverable:report",
    benchmarkRef: "swe-bench-lite",
    partition: "held-out",
    observations: observations(),
    evidenceRefs: ["evidence:1"],
    ...over,
  };
}

describe("facet projection is honest about coverage", () => {
  it("names exactly the thirteen facets the requirement names", () => {
    expect([...COMPLETION_FACETS]).toEqual([
      "success",
      "correctness",
      "time",
      "calls",
      "errors",
      "retries",
      "intervention",
      "tokens",
      "cost",
      "evidence",
      "violations",
      "quality",
      "recovery",
    ]);
  });

  it("marks the four unsupported facets UNAVAILABLE with a reason", () => {
    const facets = projectFacets(observations());
    for (const facet of ["correctness", "violations", "quality", "recovery"] as const) {
      const found = facets.find((f) => f.facet === facet)!;
      expect(found.state).toBe("UNAVAILABLE");
      expect(found.value).toBeUndefined();
      expect(found.reason).toBeTruthy();
    }
  });

  it("never synthesises quality from the other facets", () => {
    const facets = projectFacets(observations());
    const quality = facets.find((f) => f.facet === "quality")!;
    expect(quality.state).toBe("UNAVAILABLE");
    expect(quality.reason).toContain("composite");
  });

  it("never proxies violations from escalations", () => {
    const facets = projectFacets(observations({ escalations: 7 }));
    const violations = facets.find((f) => f.facet === "violations")!;
    expect(violations.state).toBe("UNAVAILABLE");
    expect(violations.reason).toContain("escalations is not a violation count");
  });

  it("reports success as VERIFIED, not merely claimed", () => {
    const verified = projectFacets(observations({ successClaimed: true, successVerified: true }));
    expect(verified.find((f) => f.facet === "success")!.value).toBe(true);
    const unverified = projectFacets(observations({ successClaimed: true, successVerified: false }));
    const success = unverified.find((f) => f.facet === "success")!;
    expect(success.value).toBe(false);
    expect(success.reason).toContain("claimed but not verified");
  });

  it("treats unrecorded tokens and cost as UNAVAILABLE, not zero", () => {
    const bare = observations();
    delete (bare as { tokens?: number }).tokens;
    delete (bare as { costAmount?: number }).costAmount;
    const facets = projectFacets(bare);
    const tokens = facets.find((f) => f.facet === "tokens")!;
    const cost = facets.find((f) => f.facet === "cost")!;
    expect(tokens.state).toBe("UNAVAILABLE");
    expect(tokens.value).toBeUndefined();
    expect(cost.state).toBe("UNAVAILABLE");
    expect(cost.reason).toContain("not zero");
  });

  it("observes tokens and cost when they were actually recorded", () => {
    const facets = projectFacets(observations({ tokens: 900, costAmount: 0.02 }));
    expect(facets.find((f) => f.facet === "tokens")!.value).toBe(900);
    expect(facets.find((f) => f.facet === "cost")!.value).toBe(0.02);
  });

  it("orders facets deterministically", () => {
    const names = projectFacets(observations()).map((f) => f.facet);
    expect(names).toEqual([...COMPLETION_FACETS].sort());
  });
});

describe("fixed controlled block", () => {
  it("accepts a well-formed trial and rejects malformed ones", () => {
    expect(validateCompletionTrial(trialInput())).toEqual([]);
    expect(validateCompletionTrial(trialInput({ trialId: "" }))).toContain("trial-id");
    expect(validateCompletionTrial(trialInput({ variant: "C" as never }))).toContain("variant");
    expect(validateCompletionTrial(trialInput({ runIndex: -1 }))).toContain("run-index");
    expect(validateCompletionTrial(trialInput({ deliverableRef: " " }))).toContain("deliverable-ref");
    expect(validateCompletionTrial(trialInput({ observations: null as never }))).toContain("observations");
    expect(validateCompletionTrial(trialInput({ extra: 1 } as never))).toContain("unknown-field");
  });

  it("requires every controlled field, since the point is that they are fixed", () => {
    expect(validateCompletionTrial(trialInput({ conditions: conditions({ startingState: "" }) }))).toContain("conditions");
    expect(validateCompletionTrial(trialInput({ conditions: conditions({ model: "" }) }))).toContain("conditions");
  });

  it("flags a trial whose conditions drifted from the controlled block", () => {
    const report = runCompletionBenchmark({
      experimentId: "exp-1",
      controlled: conditions(),
      deliverableRef: "deliverable:report",
      benchmarkRef: "swe-bench-lite",
      partition: "held-out",
      trials: [
        trialInput({ trialId: "t-a-0" }),
        trialInput({ trialId: "t-b-0", variant: "B", conditions: conditions({ environment: "dirty" }) }),
      ],
    });
    expect(report.confoundedTrialIds).toEqual(["t-b-0"]);
  });

  it("treats tool order as irrelevant when matching the controlled block", () => {
    const report = runCompletionBenchmark({
      experimentId: "exp-1",
      controlled: conditions({ tools: ["a", "b"] }),
      deliverableRef: "d",
      benchmarkRef: "b",
      partition: "held-out",
      trials: [trialInput({ conditions: conditions({ tools: ["b", "a"] }) })],
    });
    expect(report.confoundedTrialIds).toEqual([]);
  });

  it("does not mutate the caller conditions or observations", () => {
    const input = trialInput();
    const before = JSON.stringify(input);
    buildCompletionTrial(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});

describe("contamination fairness and the sealed vault", () => {
  const clean = assessContamination({
    assessmentId: "bcont-bench",
    benchmarkRef: "swe-bench-lite",
    datasetVersion: "1.0.0",
    subjectRef: "m1",
    partition: "held-out",
    status: "NO_KNOWN_EXPOSURE",
    evidenceRefs: ["corpus-manifest:1"],
    assessedAt: "2026-09-26T00:00:00.000Z",
  });

  it("marks a trial independent only when its benchmark is independently evidenced", () => {
    const withEvidence = buildCompletionTrial(trialInput(), [clean]);
    expect(withEvidence.fairness).toBe("INDEPENDENT");
    expect(withEvidence.independentEvidence).toBe(true);
  });

  it("never grants independence to a sealed partition on its label alone", () => {
    // SEALED LABEL != PROVEN SEALED HISTORY. Even with a sealed-partition
    // assessment that IS independently evidenced, the sealed label itself
    // does not make the trial independent evidence.
    const sealedClean = assessContamination({
      assessmentId: "bcont-sealed",
      benchmarkRef: "swe-bench-lite",
      datasetVersion: "1.0.0",
      subjectRef: "m1",
      partition: "sealed",
      status: "NO_KNOWN_EXPOSURE",
      evidenceRefs: ["vault-custody-log:1"],
      assessedAt: "2026-09-26T00:00:00.000Z",
    });
    const sealed = buildCompletionTrial(trialInput({ partition: "sealed" }), [sealedClean]);
    // The contamination guard already refuses independence for a sealed
    // partition, so fairness is QUALIFIED; the additional guard here is
    // defence in depth and the outcome is the same.
    expect(sealed.fairness).toBe("QUALIFIED");
    expect(sealed.independentEvidence).toBe(false);
  });

  it("does not let one partition's assessment vouch for another partition", () => {
    // A clean held-out assessment must NOT apply to a train or sealed trial
    // of the same benchmark: the fairness lookup matches on partition too.
    expect(buildCompletionTrial(trialInput({ partition: "train" }), [clean]).fairness).toBe("NO_ASSESSMENT");
    expect(buildCompletionTrial(trialInput({ partition: "sealed" }), [clean]).fairness).toBe("NO_ASSESSMENT");
  });

  it("reports QUALIFIED when the benchmark is exposed or unknown", () => {
    const exposed = assessContamination({
      assessmentId: "bcont-bench",
      benchmarkRef: "swe-bench-lite",
      datasetVersion: "1.0.0",
      subjectRef: "m1",
      partition: "held-out",
      status: "KNOWN_EXPOSED",
      exposureRefs: ["corpus"],
      exposureSource: "VENDOR_REPORTED",
      assessedAt: "2026-09-26T00:00:00.000Z",
    });
    expect(buildCompletionTrial(trialInput(), [exposed]).fairness).toBe("QUALIFIED");
    expect(buildCompletionTrial(trialInput(), []).fairness).toBe("NO_ASSESSMENT");
  });

  it("keeps train and validation trials out of independent evidence", () => {
    for (const partition of ["train", "validation"] as const) {
      const built = buildCompletionTrial(trialInput({ partition }), [clean]);
      expect(built.independentEvidence).toBe(false);
    }
  });
});

describe("report coverage and no composite", () => {
  function report(over: Partial<Parameters<typeof runCompletionBenchmark>[0]> = {}) {
    return runCompletionBenchmark({
      experimentId: "exp-1",
      controlled: conditions(),
      deliverableRef: "deliverable:report",
      benchmarkRef: "swe-bench-lite",
      partition: "held-out",
      trials: [trialInput(), trialInput({ trialId: "t-a-1", runIndex: 1 })],
      ...over,
    });
  }

  it("reports per-facet observed and unavailable counts, sorted", () => {
    const result = report();
    expect(result.facetCoverage.map((f) => f.facet)).toEqual([...COMPLETION_FACETS].sort());
    const correctness = result.facetCoverage.find((f) => f.facet === "correctness")!;
    expect(correctness.observed).toBe(0);
    expect(correctness.unavailable).toBe(2);
    expect(correctness.reason).toBeTruthy();
  });

  it("carries no composite, winner or quality figure", () => {
    const result = report();
    expect(result.noCompositeQuality).toBe(true);
    for (const banned of ["winner", "score", "quality", "overall", "ranking", "best", "verdict"]) {
      expect(Object.keys(result)).not.toContain(banned);
    }
  });

  it("orders trials deterministically from scrambled input", () => {
    const result = report({
      trials: [
        trialInput({ trialId: "t-b-1", variant: "B", runIndex: 1 }),
        trialInput({ trialId: "t-a-1", runIndex: 1 }),
        trialInput({ trialId: "t-b-0", variant: "B", runIndex: 0 }),
        trialInput({ trialId: "t-a-0" }),
      ],
    });
    expect(result.trials.map((t) => t.trialId)).toEqual(["t-a-0", "t-a-1", "t-b-0", "t-b-1"]);
  });

  it("rejects a benchmark with no trials rather than reporting empty success", () => {
    expect(() => report({ trials: [] })).toThrowError(/no trials/);
  });
});

describe("extends the causal harness rather than replacing it", () => {
  function report() {
    return runCompletionBenchmark({
      experimentId: "exp-1",
      controlled: conditions(),
      deliverableRef: "deliverable:report",
      benchmarkRef: "swe-bench-lite",
      partition: "held-out",
      trials: [
        trialInput({ trialId: "t-a-0" }),
        trialInput({ trialId: "t-b-0", variant: "B", observations: observations({ wallMs: 2400 }) }),
      ],
    });
  }

  it("emits trials the EXISTING compareHarness consumes unchanged", () => {
    const produced = report();
    const harnessTrials = toHarnessTrials(produced);
    const experiment: Experiment = {
      experimentId: "exp-1",
      taskId: "t",
      harnessA: "a",
      harnessB: "b",
      controlled: conditions(),
      confounds: [],
    };
    // The existing comparator accepts them and computes its own deltas.
    const comparison = compareHarness(experiment, harnessTrials);
    expect(comparison.experimentId).toBe("exp-1");
    expect(comparison.aggregates.A.runs).toBe(1);
    expect(comparison.aggregates.B.runs).toBe(1);
    expect(comparison.deltas.wallMs).toBeCloseTo(1200, 12);
    expect(comparison.deltas.verifiedSuccess).toBeCloseTo(0, 12);
  });

  it("excludes confounded trials from the harness trials", () => {
    const produced = runCompletionBenchmark({
      experimentId: "exp-1",
      controlled: conditions(),
      deliverableRef: "d",
      benchmarkRef: "b",
      partition: "held-out",
      trials: [
        trialInput({ trialId: "t-a-0" }),
        trialInput({ trialId: "t-b-0", variant: "B", conditions: conditions({ model: "other" }) }),
      ],
    });
    expect(toHarnessTrials(produced).map((t) => `${t.variant}#${t.runIndex}`)).toEqual(["A#0"]);
  });

  it("does not re-implement comparison, aggregation or confound detection", () => {
    const names = Object.keys(completionBenchmark);
    for (const banned of ["compare", "aggregate", "mean", "delta", "confoundDetect", "aggregateBy"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
    expect(names).not.toContain("compareHarness");
  });

  it("reuses the harness contracts instead of redefining them", () => {
    const names = Object.keys(completionBenchmark);
    expect(names).not.toContain("ControlledConditions");
    expect(names).not.toContain("TrialObservations");
    expect(names).not.toContain("HarnessComparison");
  });

  it("creates no second framework surface", () => {
    const names = Object.keys(completionBenchmark);
    for (const banned of ["runner", "executor", "engine", "framework", "service", "registry", "store", "graph"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });
});
