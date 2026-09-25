import { describe, expect, it } from "vitest";
import {
  canonicalAbstention,
  escalationSignal,
  evaluateAbstention,
  hasSelectedValue,
  makeAbstention,
  validateAbstention,
  validAbstainProbability,
} from "./abstain";
import type { Abstention } from "./abstain";

function abstention(over: Partial<Abstention> = {}): Abstention {
  return {
    decisionId: "d1",
    taskType: "intent",
    inputFingerprint: "fp1",
    abstained: true,
    abstainProbability: 0.8,
    reasons: ["AMBIGUOUS"],
    candidates: [{ value: "a", probability: 0.45 }, { value: "b", probability: 0.4 }],
    calibrated: false,
    backend: "s1-stub",
    backendVersion: "0.1.0",
    evidenceRefs: [],
    provenance: "fixture",
    ...over,
  };
}

describe("reflex abstention", () => {
  it("accepts explicit abstentions with preserved candidates", () => {
    expect(validateAbstention(abstention())).toEqual([]);
    expect(makeAbstention({ ...abstention(), decisionId: "d2" }).decisionId).toBe("d2");
  });

  it("validates probability bounds strictly", () => {
    expect(validAbstainProbability(0)).toBe(true);
    expect(validAbstainProbability(1)).toBe(true);
    expect(validAbstainProbability(-0.1)).toBe(false);
    expect(validAbstainProbability(1.1)).toBe(false);
    expect(validAbstainProbability(NaN)).toBe(false);
    expect(validAbstainProbability(Infinity)).toBe(false);
    expect(validateAbstention(abstention({ abstainProbability: 2 }))).toContain("probability");
    expect(() =>
      makeAbstention({ ...abstention(), abstainProbability: NaN, decisionId: "d3" }),
    ).toThrowError(/probability/);
  });

  it("rejects malformed abstentions", () => {
    expect(validateAbstention(abstention({ decisionId: " " }))).toContain("decision-id");
    expect(validateAbstention(abstention({ reasons: [] }))).toContain("reasons");
    expect(validateAbstention(abstention({ reasons: ["HUMAN_SAID_SO" as never] }))).toContain("reasons");
    expect(validateAbstention(abstention({ candidates: [{ value: " " }] }))).toContain("candidates");
    expect(validateAbstention(abstention({ backend: "" }))).toContain("backend");
    expect(validateAbstention(abstention({ provenance: "" }))).toContain("provenance");
  });

  it("abstained decisions carry no selected value", () => {
    expect(hasSelectedValue(abstention())).toBe(false);
    expect(hasSelectedValue(makeAbstention({ ...abstention(), decisionId: "d4" }))).toBe(false);
  });

  it("evaluates explicit thresholds without inventing any", () => {
    expect(evaluateAbstention(0.8, 0.7)).toEqual({ abstain: true, reason: "BELOW_THRESHOLD" });
    expect(evaluateAbstention(0.5, 0.7)).toEqual({ abstain: false, reason: null });
    expect(evaluateAbstention(0.7, 0.7)).toEqual({ abstain: true, reason: "BELOW_THRESHOLD" });
    expect(() => evaluateAbstention(0.5, NaN)).toThrowError(/explicit/);
    expect(() => evaluateAbstention(NaN, 0.5)).toThrowError(/finite/);
  });

  it("marks probabilities uncalibrated until calibration exists", () => {
    expect(abstention().calibrated).toBe(false);
    expect(makeAbstention({ ...abstention(), decisionId: "d5" }).calibrated).toBe(false);
  });

  it("projects escalation signals without deciding escalation", () => {
    const signal = escalationSignal(abstention());
    expect(signal.abstained).toBe(true);
    expect(signal.abstainProbability).toBe(0.8);
    expect(signal.reasons).toEqual(["AMBIGUOUS"]);
    expect(signal.candidates).toHaveLength(2);
    expect(signal.requiresHuman).toBe(false);
    expect("requiresEscalation" in signal).toBe(false);
  });

  it("serializes deterministically", () => {
    const a = makeAbstention({ ...abstention(), decisionId: "d6" });
    const b = makeAbstention({ ...abstention(), decisionId: "d6" });
    expect(canonicalAbstention(a)).toBe(canonicalAbstention(b));
  });

  it("abstention is not authorization, denial, or escalation", () => {
    const record = abstention();
    expect(Object.keys(record)).not.toContain("authorized");
    expect(Object.keys(record)).not.toContain("denied");
    expect(Object.keys(record)).not.toContain("escalated");
    expect(Object.keys(record)).not.toContain("requiresHuman");
  });
});
