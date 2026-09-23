import { describe, expect, it } from "vitest";
import { DatasetRegistry, ScorerRegistry, runEvaluation } from "./evaluation";

function datasets(): DatasetRegistry {
  const r = new DatasetRegistry();
  r.register({
    datasetId: "intent-v1",
    version: "1.0.0",
    task: "intent",
    split: "held-out",
    items: [
      { inputId: "q1", input: "bill?", expected: "billing" },
      { inputId: "q2", input: "hi", expected: "other" },
    ],
    provenance: "fixture",
  });
  return r;
}

function scorers(): ScorerRegistry {
  const r = new ScorerRegistry();
  r.register({ scorerId: "exact", version: "1.0.0", metric: "reasoning_eval", description: "exact match" });
  return r;
}

const exact = (expected: unknown, predicted: unknown): number => (expected === predicted ? 1 : 0);

describe("benchmark registries", () => {
  it("registers versioned datasets and scorers", () => {
    const d = datasets();
    expect(d.lookup("intent-v1", "1.0.0")!.split).toBe("held-out");
    expect(d.lookup("intent-v1", "9.9.9")).toBeNull();
    const s = scorers();
    expect(s.lookup("exact", "1.0.0")!.metric).toBe("reasoning_eval");
    expect(() =>
      d.register({
        datasetId: "intent-v1", version: "1.0.0", task: "t", split: "train", items: [{ inputId: "x", input: 1, expected: 1 }],
        provenance: "f",
      }),
    ).toThrowError(/duplicate dataset/);
  });

  it("rejects malformed datasets and scorers", () => {
    const d = new DatasetRegistry();
    expect(() =>
      d.register({ datasetId: "", version: "1", task: "", split: "train" as never, items: [], provenance: "" }),
    ).toThrowError(/invalid dataset/);
    expect(() =>
      d.register({
        datasetId: "dup", version: "1.0.0", task: "t", split: "train",
        items: [{ inputId: "x", input: 1, expected: 1 }, { inputId: "x", input: 2, expected: 2 }],
        provenance: "f",
      }),
    ).toThrowError(/invalid dataset/);
    const s = new ScorerRegistry();
    expect(() => s.register({ scorerId: "s", version: "1.0.0", metric: "vibes", description: "d" })).toThrowError(
      /invalid scorer/,
    );
    expect(() => s.register({ scorerId: "s", version: "v1", metric: "cost", description: "d" })).toThrowError(
      /invalid scorer/,
    );
  });

  it("runs one scorer over one dataset with provenance", () => {
    const result = runEvaluation(
      datasets(), scorers(), "intent-v1", "1.0.0", "exact", "1.0.0",
      new Map([["q1", "billing"], ["q2", "billing"]]),
      exact, "fixture-run", () => "2026-09-23T00:00:00.000Z",
    );
    expect(result.mean).toBe(0.5);
    expect(result.scored).toBe(2);
    expect(result.missing).toEqual([]);
    expect(result.metric).toBe("reasoning_eval");
    expect(result.ranAt).toBe("2026-09-23T00:00:00.000Z");
  });

  it("reports missing predictions instead of hiding them", () => {
    const result = runEvaluation(
      datasets(), scorers(), "intent-v1", "1.0.0", "exact", "1.0.0",
      new Map([["q1", "billing"]]), exact, "fixture-run",
    );
    expect(result.scored).toBe(1);
    expect(result.missing).toEqual(["q2"]);
    expect(result.mean).toBe(1);
  });

  it("fails honestly on unknown refs and bad scores", () => {
    expect(() =>
      runEvaluation(datasets(), scorers(), "nope", "1.0.0", "exact", "1.0.0", new Map(), exact, "f"),
    ).toThrowError(/unknown dataset/);
    expect(() =>
      runEvaluation(datasets(), scorers(), "intent-v1", "1.0.0", "nope", "1.0.0", new Map(), exact, "f"),
    ).toThrowError(/unknown scorer/);
    expect(() =>
      runEvaluation(datasets(), scorers(), "intent-v1", "1.0.0", "exact", "1.0.0",
        new Map([["q1", "x"], ["q2", "y"]]), () => 7, "f"),
    ).toThrowError(/out-of-range/);
    expect(() =>
      runEvaluation(datasets(), scorers(), "intent-v1", "1.0.0", "exact", "1.0.0", new Map(), exact, "  "),
    ).toThrowError(/provenance is required/);
  });

  it("offers no cross-metric combination", () => {
    const moduleKeys = ["runEvaluation", "DatasetRegistry", "ScorerRegistry"];
    expect(moduleKeys.every((k) => !k.toLowerCase().includes("combin") && !k.toLowerCase().includes("universal"))).toBe(true);
  });
});
