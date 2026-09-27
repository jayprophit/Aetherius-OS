import { describe, expect, it } from "vitest";
import {
  ACTION_OUTCOMES,
  ATTRIBUTIONS,
  rateAll,
  rateSubject,
  validateAction,
} from "./contribution";
import type { ContributionAction } from "./contribution";

/** Dimension-specific fixtures: every action declares its own fields. */
function action(over: Partial<ContributionAction> = {}): ContributionAction {
  return {
    actionId: "act-1",
    subjectRef: "worker:temp-7",
    kind: "code-review",
    verified: true,
    verificationRef: "evidence:review-9",
    outcome: "SUCCESS",
    attribution: "SUBJECT",
    evidenceRefs: ["evidence:diff-3"],
    observedAt: "2026-09-27T11:00:00.000Z",
    provenance: "test",
    ...over,
  };
}

describe("reputation: registered vocabulary", () => {
  it("declares the outcome and attribution vocabularies", () => {
    expect([...ACTION_OUTCOMES]).toEqual(["SUCCESS", "FAILURE", "UNKNOWN"]);
    expect([...ATTRIBUTIONS]).toEqual(["SUBJECT", "EXTERNAL", "UNKNOWN"]);
  });
});

describe("reputation: strict action shape", () => {
  it("accepts a minimal valid action", () => {
    expect(() => validateAction(action())).not.toThrow();
  });

  it("rejects unknown fields", () => {
    expect(() => validateAction({ ...action(), score: 87 })).toThrowError(
      expect.objectContaining({ code: "REPUTATION_UNKNOWN_FIELD" }),
    );
  });

  it("rejects malformed identities and timestamps", () => {
    expect(() => validateAction({ ...action(), actionId: "" })).toThrowError(
      expect.objectContaining({ code: "REPUTATION_INVALID_INPUT" }),
    );
    expect(() => validateAction({ ...action(), subjectRef: "  " })).toThrowError(
      expect.objectContaining({ code: "REPUTATION_INVALID_INPUT" }),
    );
    expect(() => validateAction({ ...action(), observedAt: "" })).toThrowError(
      expect.objectContaining({ code: "REPUTATION_INVALID_INPUT" }),
    );
    expect(() => validateAction({ ...action(), provenance: "" })).toThrowError(
      expect.objectContaining({ code: "REPUTATION_INVALID_INPUT" }),
    );
    expect(() => validateAction("act-1")).toThrowError(
      expect.objectContaining({ code: "REPUTATION_INVALID_INPUT" }),
    );
  });

  it("rejects bad outcome, attribution, and evidence values", () => {
    expect(() => validateAction({ ...action(), outcome: "PARTIAL" })).toThrowError(
      expect.objectContaining({ code: "REPUTATION_INVALID_INPUT" }),
    );
    expect(() => validateAction({ ...action(), attribution: "TEAM" })).toThrowError(
      expect.objectContaining({ code: "REPUTATION_INVALID_INPUT" }),
    );
    expect(() => validateAction({ ...action(), evidenceRefs: [""] })).toThrowError(
      expect.objectContaining({ code: "REPUTATION_INVALID_INPUT" }),
    );
    expect(() => validateAction({ ...action(), verified: "yes" })).toThrowError(
      expect.objectContaining({ code: "REPUTATION_INVALID_INPUT" }),
    );
  });

  it("requires a verification ref for a verified action", () => {
    expect(() => validateAction({ ...action(), verificationRef: undefined })).toThrowError(
      expect.objectContaining({ code: "REPUTATION_VERIFICATION_REF_REQUIRED" }),
    );
  });

  it("rejects authority, secret, and persona keys with their own codes", () => {
    expect(() => validateAction({ ...action(), authorized: true } as never)).toThrowError(
      expect.objectContaining({ code: "REPUTATION_AUTHORITY_REJECTED" }),
    );
    expect(() => validateAction({ ...action(), role: "admin" } as never)).toThrowError(
      expect.objectContaining({ code: "REPUTATION_AUTHORITY_REJECTED" }),
    );
    expect(() => validateAction({ ...action(), permissionGranted: true } as never)).toThrowError(
      expect.objectContaining({ code: "REPUTATION_AUTHORITY_REJECTED" }),
    );
    expect(() => validateAction({ ...action(), apiKey: "sk-x" } as never)).toThrowError(
      expect.objectContaining({ code: "REPUTATION_SECRET_REJECTED" }),
    );
    expect(() => validateAction({ ...action(), persona: "helper" } as never)).toThrowError(
      expect.objectContaining({ code: "REPUTATION_PERSONALITY_REJECTED" }),
    );
  });

  it("finds violations nested inside evidence-adjacent objects", () => {
    expect(() =>
      validateAction({ ...action(), evidenceRefs: ["ok"], provenance: { note: "x", ownerOverride: true } } as never),
    ).toThrowError(expect.objectContaining({ code: "REPUTATION_AUTHORITY_REJECTED" }));
  });
});

describe("reputation: only validated actions count", () => {
  it("counts a verified subject-attributed success", () => {
    const view = rateSubject([action()], "worker:temp-7", "test");
    expect(view).toMatchObject({ state: "RATED", verifiedSuccesses: 1, verifiedFailures: 0, supportCount: 1 });
  });

  it("excludes an unverified self-claim entirely", () => {
    const view = rateSubject(
      [action({ verified: false, verificationRef: undefined, outcome: "SUCCESS" })],
      "worker:temp-7",
      "test",
    );
    expect(view.state).toBe("UNKNOWN");
    expect(view.supportCount).toBe(0);
  });

  it("excludes unknown outcomes from tallies but keeps their evidence", () => {
    const view = rateSubject([action({ outcome: "UNKNOWN" })], "worker:temp-7", "test");
    expect(view.state).toBe("UNKNOWN");
    expect(view.verifiedSuccesses).toBe(0);
    expect(view.evidenceRefs).toContain("evidence:diff-3");
  });
});

describe("reputation: attribution gates both directions", () => {
  it("does not count an externally-caused failure against the subject", () => {
    const view = rateSubject(
      [action({ outcome: "FAILURE", attribution: "EXTERNAL" })],
      "worker:temp-7",
      "test",
    );
    expect(view.state).toBe("UNKNOWN");
    expect(view.verifiedFailures).toBe(0);
  });

  it("does not count an externally-caused success for the subject either", () => {
    const view = rateSubject(
      [action({ outcome: "SUCCESS", attribution: "EXTERNAL" })],
      "worker:temp-7",
      "test",
    );
    expect(view.state).toBe("UNKNOWN");
    expect(view.verifiedSuccesses).toBe(0);
  });

  it("does not count unknown-attribution outcomes", () => {
    const view = rateSubject(
      [action({ outcome: "FAILURE", attribution: "UNKNOWN" })],
      "worker:temp-7",
      "test",
    );
    expect(view.verifiedFailures).toBe(0);
  });

  it("counts a subject-attributed failure", () => {
    const view = rateSubject([action({ outcome: "FAILURE" })], "worker:temp-7", "test");
    expect(view).toMatchObject({ state: "RATED", verifiedSuccesses: 0, verifiedFailures: 1, supportCount: 1 });
  });
});

describe("reputation: cold start is UNKNOWN, never zero-rated", () => {
  it("reports UNKNOWN with no actions at all", () => {
    const view = rateSubject([], "worker:new", "test");
    expect(view.state).toBe("UNKNOWN");
    expect(view.supportCount).toBe(0);
  });

  it("keeps subjects separate: one subject's history never leaks", () => {
    const views = rateAll(
      [action({ subjectRef: "worker:a" }), action({ subjectRef: "worker:b", outcome: "FAILURE" })],
      "test",
    );
    expect(views.map((v) => v.subjectRef)).toEqual(["worker:a", "worker:b"]);
    expect(views[0]).toMatchObject({ verifiedSuccesses: 1, verifiedFailures: 0 });
    expect(views[1]).toMatchObject({ verifiedSuccesses: 0, verifiedFailures: 1 });
  });
});

describe("reputation: duplicate reference is not additional evidence", () => {
  it("rejects the same actionId recorded twice", () => {
    expect(() => rateSubject([action(), action()], "worker:temp-7", "test")).toThrowError(
      expect.objectContaining({ code: "REPUTATION_DUPLICATE_ACTION" }),
    );
  });

  it("deduplicates shared evidence refs across actions", () => {
    const view = rateSubject(
      [
        action({ actionId: "act-1", evidenceRefs: ["evidence:shared"] }),
        action({ actionId: "act-2", evidenceRefs: ["evidence:shared", "evidence:other"] }),
      ],
      "worker:temp-7",
      "test",
    );
    expect(view.evidenceRefs).toEqual(["evidence:other", "evidence:review-9", "evidence:shared"]);
    expect(view.supportCount).toBe(2);
  });
});

describe("reputation: determinism and purity", () => {
  it("is identical from scrambled input order", () => {
    const actions = [
      action({ actionId: "act-3", outcome: "FAILURE" }),
      action({ actionId: "act-1", outcome: "SUCCESS" }),
      action({ actionId: "act-2", outcome: "SUCCESS" }),
    ];
    const forward = rateSubject(actions, "worker:temp-7", "test");
    const reversed = rateSubject([...actions].reverse(), "worker:temp-7", "test");
    expect(JSON.stringify(forward)).toBe(JSON.stringify(reversed));
    expect(forward).toMatchObject({ verifiedSuccesses: 2, verifiedFailures: 1, supportCount: 3 });
  });

  it("does not mutate caller actions", () => {
    const actions = [action({ evidenceRefs: ["b", "a"] })];
    const snapshot = JSON.stringify(actions);
    rateSubject(actions, "worker:temp-7", "test");
    expect(JSON.stringify(actions)).toBe(snapshot);
  });

  it("rejects malformed rate inputs", () => {
    expect(() => rateSubject("nope" as never, "worker:temp-7", "test")).toThrowError(
      expect.objectContaining({ code: "REPUTATION_INVALID_INPUT" }),
    );
    expect(() => rateSubject([], "", "test")).toThrowError(
      expect.objectContaining({ code: "REPUTATION_INVALID_INPUT" }),
    );
    expect(() => rateAll("nope" as never, "test")).toThrowError(
      expect.objectContaining({ code: "REPUTATION_INVALID_INPUT" }),
    );
  });
});

describe("reputation: the view grants nothing", () => {
  it("carries no authorization, role, capability, or verdict fields", () => {
    const keys = Object.keys(rateSubject([action()], "worker:temp-7", "test"));
    expect(keys.sort()).toEqual(
      ["evidenceRefs", "provenance", "state", "subjectRef", "supportCount", "verifiedFailures", "verifiedSuccesses"].sort(),
    );
  });

  it("emits no score, grade, rank, or composite", () => {
    const body = JSON.stringify(rateSubject([action()], "worker:temp-7", "test"));
    for (const banned of ["score", "grade", "rank", "stars", "composite", "overall", "trust"]) {
      expect(body.toLowerCase()).not.toContain(banned);
    }
  });
});
