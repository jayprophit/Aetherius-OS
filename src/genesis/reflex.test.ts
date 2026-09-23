import { describe, expect, it } from "vitest";
import { bootstrapReference } from "./identity";
import { S0RulesBackend, reflexGenesis, validateDecisionEnvelope } from "./reflex";
import type { DecisionEnvelope, ReflexBackend, S0Rule } from "./reflex";

function envelope(over: Partial<DecisionEnvelope> = {}): DecisionEnvelope {
  return {
    schemaVersion: "1",
    decisionId: "d1",
    taskType: "intent",
    inputFingerprint: "fp1",
    body: { kind: "categorical", labels: ["a", "b"], selected: "a", probabilities: [0.7, 0.3] },
    abstainProbability: 0.1,
    backend: "test",
    backendVersion: "0",
    evidenceRefs: [],
    provenance: "fixture",
    ...over,
  };
}

describe("decision envelopes", () => {
  it("accepts all six schema-bounded kinds", () => {
    expect(validateDecisionEnvelope(envelope())).toEqual([]);
    expect(
      validateDecisionEnvelope(envelope({ body: { kind: "binary", labels: ["x", "y"], selected: "y", probabilities: [0.2, 0.8] } })),
    ).toEqual([]);
    expect(
      validateDecisionEnvelope(envelope({ body: { kind: "ordinal", labels: ["low", "mid", "high"], selectedIndex: 2 } })),
    ).toEqual([]);
    expect(
      validateDecisionEnvelope(
        envelope({ body: { kind: "multilabel", labels: ["a", "b", "c"], selected: ["a", "c"], probabilities: [0.5, 0.0, 0.5] } }),
      ),
    ).toEqual([]);
    expect(validateDecisionEnvelope(envelope({ body: { kind: "rank", ranking: ["b", "a"] } }))).toEqual([]);
    expect(
      validateDecisionEnvelope(envelope({ body: { kind: "abstaining", abstainProbability: 0.9, fallback: "escalate" } })),
    ).toEqual([]);
  });

  it("rejects inconsistent selections, bad distributions and ranges", () => {
    expect(
      validateDecisionEnvelope(envelope({ body: { kind: "categorical", labels: ["a", "b"], selected: "zzz", probabilities: [0.5, 0.5] } })),
    ).toContain("selection-consistency");
    expect(
      validateDecisionEnvelope(envelope({ body: { kind: "categorical", labels: ["a", "b"], selected: "a", probabilities: [0.5, 0.6] } })),
    ).toContain("probability-distribution");
    expect(validateDecisionEnvelope(envelope({ abstainProbability: 2 }))).toContain("abstain-range");
    expect(
      validateDecisionEnvelope(envelope({ body: { kind: "ordinal", labels: ["a", "b"], selectedIndex: 5 } })),
    ).toContain("selection-consistency");
    expect(
      validateDecisionEnvelope(envelope({ body: { kind: "categorical", labels: ["a", "a"], selected: "a", probabilities: [0.5, 0.5] } })),
    ).toContain("labels-invalid");
    expect(validateDecisionEnvelope(envelope({ schemaVersion: "2" as never }))).toContain("envelope-shape");
  });

  it("claims schema bounds only, never semantic correctness", () => {
    const result = validateDecisionEnvelope(envelope());
    expect(result).toEqual([]);
    // A valid envelope is still just data: no authority, no correctness proof.
    expect(JSON.stringify(envelope()).toLowerCase()).not.toContain("zero hallucination");
  });
});

describe("S0 deterministic reflex", () => {
  const rules: S0Rule[] = [
    {
      ruleId: "route-billing",
      taskType: "intent",
      fingerprint: "billing-question",
      decision: { kind: "categorical", labels: ["billing", "other"], selected: "billing", probabilities: [1, 0] },
      evidenceRefs: ["skill:billing@1.0.0"],
    },
    {
      ruleId: "route-form",
      taskType: "intent",
      fields: { channel: "form" },
      decision: { kind: "categorical", labels: ["billing", "other"], selected: "other", probabilities: [0, 1] },
    },
  ];

  it("dispatches first exact match deterministically", () => {
    const backend = new S0RulesBackend(rules);
    const first = backend.decide({ taskType: "intent", fingerprint: "billing-question" });
    const second = backend.decide({ taskType: "intent", fingerprint: "billing-question" });
    expect(first.status).toBe("decided");
    if (first.status !== "decided" || second.status !== "decided") throw new Error("expected decided");
    expect(first.envelope.body).toEqual(second.envelope.body);
    expect(first.envelope.backend).toBe("deterministic-rules");
    expect(first.envelope.provenance).toBe("s0:route-billing");
    const fielded = backend.decide({ taskType: "intent", fingerprint: "other", fields: { channel: "form" } });
    expect(fielded.status).toBe("decided");
  });

  it("returns UNRESOLVED instead of guessing", () => {
    const backend = new S0RulesBackend(rules);
    const miss = backend.decide({ taskType: "intent", fingerprint: "unknown" });
    expect(miss).toEqual({ status: "unresolved", reason: "no S0 rule matches intent/unknown" });
    const wrongTask = backend.decide({ taskType: "other-task", fingerprint: "billing-question" });
    expect(wrongTask.status).toBe("unresolved");
    const empty = backend.decide({ taskType: " ", fingerprint: "x" });
    expect(empty.status).toBe("unresolved");
  });

  it("rejects bad rules at construction", () => {
    expect(() => new S0RulesBackend([])).not.toThrow();
    expect(
      () =>
        new S0RulesBackend([
          { ruleId: "bad", taskType: "intent", decision: { kind: "categorical", labels: ["a"], selected: "a", probabilities: [1] } },
        ]),
    ).toThrowError(/invalid decision/);
    expect(
      () =>
        new S0RulesBackend([
          { ruleId: "dup", taskType: "intent", fingerprint: "x", decision: { kind: "rank", ranking: ["a", "b"] } },
          { ruleId: "dup", taskType: "intent", fingerprint: "y", decision: { kind: "rank", ranking: ["a", "b"] } },
        ]),
    ).toThrowError(/duplicate/);
  });

  it("backends are replaceable through one seam", () => {
    const stub: ReflexBackend = {
      id: "stub-model",
      version: "9.9.9",
      decide: (input) => ({
        status: "decided",
        envelope: envelope({ backend: "stub-model", backendVersion: "9.9.9", inputFingerprint: input.fingerprint }),
      }),
    };
    const out = stub.decide({ taskType: "intent", fingerprint: "fp" });
    expect(out.status).toBe("decided");
    if (out.status !== "decided") throw new Error("expected decided");
    expect(validateDecisionEnvelope(out.envelope)).toEqual([]);
    expect(out.envelope.backend).toBe("stub-model");
  });

  it("reflex references the one Genesis without minting identity", () => {
    expect(reflexGenesis(bootstrapReference("genesis-prime", "fixture"))).toBe("genesis-prime");
  });
});
