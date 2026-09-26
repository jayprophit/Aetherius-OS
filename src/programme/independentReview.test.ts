import { describe, expect, it } from "vitest";
import {
  REVIEW_LEGS,
  REVIEW_LEG_STATES,
  composeIndependentReview,
  evidenceLeg,
  gateIdFor,
  modelReviewLeg,
} from "./independentReview";
import * as gate from "./independentReview";
import type { IndependenceFacts, LegEvidence } from "./independentReview";
import type { EvidenceProvided, EvidenceRequirement } from "../workflows/evidenceGate";

const AT = "2026-09-26T00:00:00.000Z";

/**
 * Dimension-specific fixtures. Every leg is listed EXPLICITLY with its own
 * state, so no leg can be satisfied by an inherited default and no leg can be
 * silently omitted by a shared builder.
 */
function passing(leg: (typeof REVIEW_LEGS)[number], ref = `ref:${leg}`): LegEvidence {
  return { leg, state: "PASS", sourceRef: ref, reason: `satisfied by ${ref}` };
}

const FACTS: IndependenceFacts = {
  sameActor: false,
  reviewerRef: "reviewer:external",
  changeProducerRef: "agent:builder",
  notes: ["distinct actors recorded explicitly"],
};

const REQUIRED: EvidenceRequirement[] = [{ key: "test-report", description: "tests ran" }];
const PASSING_EVIDENCE: EvidenceProvided[] = [
  { key: "test-report", kind: "test-report", passed: true, ref: "run-1" },
];

function compose(over: Partial<Parameters<typeof composeIndependentReview>[0]> = {}) {
  return composeIndependentReview({
    gateId: "irev-change-1",
    changeRef: "515eb0b",
    evidence: REVIEW_LEGS.map((leg) => (leg === "model-review" ? modelReviewLeg({ blockerRef: "REQ-p18-model-fabric" }) : passing(leg))),
    independence: FACTS,
    assessedAt: AT,
    ...over,
  });
}

describe("registered leg vocabulary", () => {
  it("declares exactly the legs the requirement names, in pipeline order", () => {
    expect([...REVIEW_LEGS]).toEqual(["impact", "context", "static", "model-review", "security", "verification"]);
  });

  it("keeps UNAVAILABLE and MISSING_EVIDENCE as real, distinct states", () => {
    expect([...REVIEW_LEG_STATES]).toEqual(["PASS", "FAIL", "BLOCKED", "UNAVAILABLE", "MISSING_EVIDENCE"]);
    // There is no state that means "fine, we did not check".
    expect(REVIEW_LEG_STATES).not.toContain("SKIPPED" as never);
    expect(REVIEW_LEG_STATES).not.toContain("N/A" as never);
  });
});

describe("the model-review leg is UNAVAILABLE, never passed", () => {
  it("is UNAVAILABLE with a traceable blocker", () => {
    const leg = modelReviewLeg({ blockerRef: "REQ-p18-model-fabric" });
    expect(leg.leg).toBe("model-review");
    expect(leg.state).toBe("UNAVAILABLE");
    expect(leg.sourceRef).toBe("REQ-p18-model-fabric");
    expect(leg.reason).toContain("BLOCKED on cloud credentials");
    expect(leg.reason).toContain("no fallback reviewer is substituted");
  });

  it("requires a blocker reference so unavailability has a cause", () => {
    expect(() => modelReviewLeg({ blockerRef: "" })).toThrowError(/blockerRef/);
  });

  it("makes the whole gate INCOMPLETE, never READY", () => {
    const report = compose();
    expect(report.legs.find((l) => l.leg === "model-review")!.state).toBe("UNAVAILABLE");
    expect(report.allLegsPass).toBe(false);
    expect(report.outcome).toBe("REVIEW_INCOMPLETE");
    expect(report.cleanRoomReady).toBe(false);
  });

  it("cannot be passed by omitting the leg entirely", () => {
    const withoutModel = REVIEW_LEGS.filter((l) => l !== "model-review").map((l) => passing(l));
    const report = compose({ evidence: withoutModel });
    // Omission is reported as MISSING_EVIDENCE, never as satisfied.
    expect(report.legs.find((l) => l.leg === "model-review")!.state).toBe("MISSING_EVIDENCE");
    expect(report.allLegsPass).toBe(false);
    expect(report.outcome).toBe("REVIEW_INCOMPLETE");
  });
});

describe("a gate cannot pass by omission", () => {
  it("reports every registered leg even when no evidence is supplied", () => {
    const report = compose({ evidence: [] });
    expect(report.legs.map((l) => l.leg)).toEqual([...REVIEW_LEGS]);
    expect(report.legs.every((l) => l.state === "MISSING_EVIDENCE")).toBe(true);
    expect(report.allLegsPass).toBe(false);
  });

  it("keeps INCOMPLETE when only one leg is missing", () => {
    const all = REVIEW_LEGS.map((l) => (l === "model-review" ? modelReviewLeg({ blockerRef: "b" }) : passing(l)));
    const withoutSecurity = all.filter((l) => l.leg !== "security");
    expect(compose({ evidence: withoutSecurity }).outcome).toBe("REVIEW_INCOMPLETE");
  });

  it("is FAILED when any leg FAILs, which outranks incompleteness", () => {
    const withFailure: LegEvidence[] = REVIEW_LEGS.map((l) =>
      l === "security" ? { leg: l, state: "FAIL", reason: "secret pattern found in the change" } : l === "model-review" ? modelReviewLeg({ blockerRef: "b" }) : passing(l),
    );
    const report = compose({ evidence: withFailure });
    expect(report.outcome).toBe("REVIEW_FAILED");
    expect(report.allLegsPass).toBe(false);
  });

  it("requires a reason for every non-PASS leg", () => {
    const unexplained: LegEvidence[] = REVIEW_LEGS.map((l) =>
      l === "static" ? { leg: l, state: "FAIL" } : passing(l),
    );
    expect(() => compose({ evidence: unexplained })).toThrowError(/must carry a reason/);
  });
});

describe("clean-room ready is never clean-room proven", () => {
  it("never reports cleanRoomProven, even when every leg passes", () => {
    // Constructing a genuinely all-PASS report requires bypassing the model
    // leg, which is exactly why cleanRoomProven is a type-level false.
    const allPass = composeIndependentReview({
      gateId: "irev-x",
      changeRef: "abc1234",
      evidence: REVIEW_LEGS.map((l) => passing(l)),
      independence: FACTS,
      assessedAt: AT,
    });
    expect(allPass.allLegsPass).toBe(true);
    expect(allPass.outcome).toBe("REVIEW_READY");
    expect(allPass.cleanRoomReady).toBe(true);
    // REQ-p20-clean-room is BLOCKED: readiness is not proof.
    expect(allPass.cleanRoomProven).toBe(false);
  });

  it("rejects any attempt to set cleanRoomProven true", () => {
    const report = compose();
    expect(() => composeIndependentReview({
      gateId: "irev-y",
      changeRef: "abc1234",
      evidence: REVIEW_LEGS.map((l) => passing(l)),
      independence: FACTS,
      assessedAt: AT,
      cleanRoomProven: true,
    } as never)).toThrowError(/unknown-field/);
  });
});

describe("independence is recorded, never assumed", () => {
  it("defaults to nothing: the caller must state the facts", () => {
    expect(() => compose({ independence: undefined as never })).toThrowError(/independence/);
    expect(() => compose({ independence: { sameActor: "no", reviewerRef: "r", changeProducerRef: "p", notes: [] } as never })).toThrowError(
      /independence/,
    );
  });

  it("records self-review as self-review", () => {
    const selfReview = compose({
      independence: { sameActor: true, reviewerRef: "agent:builder", changeProducerRef: "agent:builder", notes: [] },
    });
    expect(selfReview.independence.sameActor).toBe(true);
    // A self-review is still INCOMPLETE here, and is never relabelled as
    // independent merely because it ran in a different module.
    expect(selfReview.outcome).toBe("REVIEW_INCOMPLETE");
  });

  it("requires both actor references", () => {
    expect(() => compose({ independence: { ...FACTS, reviewerRef: "" } })).toThrowError(/reviewer-ref/);
    expect(() => compose({ independence: { ...FACTS, changeProducerRef: " " } })).toThrowError(/producer-ref/);
  });
});

describe("the verification leg reuses the existing evidence gate", () => {
  it("reports PASS when the existing gate says COMPLETE", () => {
    const leg = evidenceLeg(REQUIRED, PASSING_EVIDENCE, "gate:1");
    expect(leg.leg).toBe("verification");
    expect(leg.state).toBe("PASS");
    expect(leg.reason).toContain("COMPLETE");
  });

  it("reports MISSING_EVIDENCE when the existing gate says NOT_PROVEN for missing keys", () => {
    const leg = evidenceLeg(REQUIRED, []);
    expect(leg.state).toBe("MISSING_EVIDENCE");
    expect(leg.reason).toContain("NOT_PROVEN");
    expect(leg.reason).toContain("test-report");
  });

  it("reports FAIL when provided evidence actually failed", () => {
    const failed: EvidenceProvided[] = [
      { key: "test-report", kind: "test-report", passed: false, ref: "run-1" },
    ];
    const leg = evidenceLeg(REQUIRED, failed);
    expect(leg.state).toBe("FAIL");
    expect(leg.reason).toContain("failed");
  });

  it("does not re-implement the evidence gate", () => {
    const names = Object.keys(gate);
    expect(names).not.toContain("checkEvidenceGate");
    expect(names).not.toContain("GateResult");
  });
});

describe("no composite score and no authority", () => {
  it("carries no aggregate numeric figure", () => {
    const report = compose();
    expect(report.noCompositeScore).toBe(true);
    for (const banned of ["score", "rating", "confidence", "percent", "overall", "grade", "rank"]) {
      expect(Object.keys(report)).not.toContain(banned);
    }
  });

  it("carries no merge or execution authority", () => {
    const report = compose();
    expect(report.noMergeAuthority).toBe(true);
    for (const banned of ["merge", "mergeAuthorized", "deploy", "authorize", "approve", "canMerge", "push", "publish"]) {
      expect(Object.keys(report)).not.toContain(banned);
    }
  });

  it("exposes no merge, deploy, authorize or execute surface", () => {
    const names = Object.keys(gate);
    for (const banned of ["merge", "deploy", "authorize", "approve", "execute", "push", "publish", "promote"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("creates no reviewer2, evidencegraph2, steward2 or testimpact2", () => {
    const names = Object.keys(gate);
    for (const banned of ["store", "registry", "graph", "runner", "executor", "engine", "service", "save", "persist"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });
});

describe("validation and determinism", () => {
  it("rejects malformed gate ids, refs and timestamps", () => {
    expect(() => compose({ gateId: "not-a-gate" })).toThrowError(/gate-id/);
    expect(() => compose({ changeRef: "" })).toThrowError(/change-ref/);
    expect(() => compose({ assessedAt: "today" })).toThrowError(/assessed-at/);
  });

  it("rejects an unknown or duplicated leg", () => {
    expect(() => compose({ evidence: [{ leg: "vibes" as never, state: "PASS", reason: "r" }] })).toThrowError(/unknown-leg/);
    expect(() =>
      compose({ evidence: [passing("static"), { leg: "static", state: "PASS", reason: "dup" }] }),
    ).toThrowError(/duplicate-leg/);
  });

  it("rejects unrecognised keys rather than silently dropping them", () => {
    expect(() => compose({ mergeAuthorized: true } as never)).toThrowError(/unknown-field/);
  });

  it("derives a deterministic gate id, replacing every invalid span", () => {
    expect(gateIdFor("Change 515eb0b")).toBe("irev-change-515eb0b");
    expect(gateIdFor("a  b   c")).toBe("irev-a-b-c");
    expect(gateIdFor("--lead and trail--")).toBe("irev-lead-and-trail");
    expect(gateIdFor("!!!")).toBe("irev-gate");
  });

  it("orders legs by pipeline position from scrambled evidence", () => {
    const scrambled = ["security", "impact", "verification", "context", "model-review", "static"].map((l) =>
      l === "model-review" ? modelReviewLeg({ blockerRef: "b" }) : passing(l as (typeof REVIEW_LEGS)[number]),
    );
    expect(compose({ evidence: scrambled }).legs.map((l) => l.leg)).toEqual([...REVIEW_LEGS]);
  });

  it("sorts independence notes deterministically", () => {
    const a = compose({ independence: { ...FACTS, notes: ["z note", "a note"] } });
    const b = compose({ independence: { ...FACTS, notes: ["a note", "z note"] } });
    expect(a.independence.notes).toEqual(["a note", "z note"]);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("calls no clock: assessedAt is caller supplied", () => {
    expect(compose().assessedAt).toBe(AT);
    expect(compose({ assessedAt: "2020-01-01T00:00:00.000Z" }).assessedAt).toBe("2020-01-01T00:00:00.000Z");
  });
});
