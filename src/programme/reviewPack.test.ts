import { describe, expect, it } from "vitest";
import {
  DEFAULT_PACK_MAX_ITEMS,
  PACK_DIMENSIONS,
  PACK_TEST_STATES,
  buildReviewContextPack,
  packChangedFiles,
  packIdFor,
  packRequirementContext,
  packTouchComparison,
  packUnresolved,
  validateReviewContext,
} from "./reviewPack";
import * as reviewPack from "./reviewPack";
import type { PackTestOutcome, ReviewContextInput } from "./reviewPack";
import type { Requirement } from "./types";
import type { WorkspaceDiff } from "../runners/sync";
import type { TouchEstimate } from "../workers/touch";

const AT = "2026-09-26T00:00:00.000Z";
const KNOWN = ["REQ-p16-review-context-pack", "REQ-p20-expected-touch-set"];

/**
 * Dimension-specific fixture builders. Each overrides the refs it owns so a
 * query can never be satisfied by an inherited default from another
 * dimension.
 */
function requirement(id: string, over: Partial<Requirement> = {}): Requirement {
  return {
    id,
    title: `Requirement ${id}`,
    description: `why ${id} exists`,
    source: { class: "RESEARCH_NOTE", ref: "fixture", location: "test" },
    owner: "aetherius-os",
    phase: "P16",
    status: "PROVEN",
    priority: 1,
    depends_on: [],
    blockers: [],
    evidence: ["fixture"],
    provenance: "fixture",
    owner_gate: false,
    work_state: "COMPLETE",
    ...over,
  };
}

function diff(over: Partial<WorkspaceDiff> = {}): WorkspaceDiff {
  return { added: [], modified: [], deleted: [], ...over };
}

function touch(paths: string[], over: Partial<TouchEstimate> = {}): TouchEstimate {
  return { paths: [...paths].sort(), sources: [], unknown: [], invalid: [], ...over };
}

function outcome(ref: string, suite: string, state: PackTestOutcome["state"] = "PASSED"): PackTestOutcome {
  return { ref, suite, state };
}

function input(over: Partial<ReviewContextInput> = {}): ReviewContextInput {
  return {
    packId: "rcp-change-cohort-review",
    changeRef: "515eb0b",
    changeKind: "COMMIT",
    generatedAt: AT,
    ...over,
  };
}

describe("pack validation", () => {
  it("accepts a minimal pack and a full one", () => {
    expect(validateReviewContext(input())).toEqual([]);
    expect(
      validateReviewContext(
        input({
          requirementRefs: KNOWN,
          requirements: [requirement("REQ-p16-review-context-pack")],
          diff: diff({ modified: ["src/programme/reviewPack.ts"] }),
          touch: touch(["src/programme/reviewPack.ts", "docs/review-context-pack.md"]),
          impactRefs: ["impact:transitive-1"],
          testOutcomes: [outcome("vitest:reviewPack", "unit")],
          policyRefs: ["fs.read"],
          capabilityRefs: ["skill:review@1.0.0"],
          verificationState: "EVIDENCE_COMPLETE",
          verificationRefs: ["run-1"],
          sources: [{ dimension: "diff", provenance: "git", detail: "515eb0b" }],
          maxItemsPerDimension: 10,
        }),
        KNOWN,
      ),
    ).toEqual([]);
  });

  it("rejects malformed ids, change refs, kinds, bounds and timestamps", () => {
    const cases: Record<string, Partial<ReviewContextInput>> = {
      "pack-id": { packId: "REQ-p16-review-context-pack" },
      "change-ref": { changeRef: "  " },
      "change-kind": { changeKind: "branch" as never },
      "max-items": { maxItemsPerDimension: 0 },
      "generated-at": { generatedAt: "today" },
      "sources": { sources: [{ dimension: "vibes" as never, provenance: "" }] },
    };
    for (const [problem, over] of Object.entries(cases)) {
      expect(validateReviewContext(input(over))).toContain(problem);
    }
  });

  it("rejects duplicate and blank references", () => {
    expect(validateReviewContext(input({ policyRefs: ["a", "a"] }))).toContain("duplicate-ref");
    expect(validateReviewContext(input({ capabilityRefs: [""] }))).toContain("duplicate-ref");
  });

  it("rejects malformed requirement context records", () => {
    expect(validateReviewContext(input({ requirements: [{ ...requirement("X"), owner: "" }] }))).toContain(
      "requirement-context",
    );
  });

  it("rejects unknown test states", () => {
    expect(validateReviewContext(input({ testOutcomes: [outcome("r", "s", "FLAKY" as never)] }))).toContain("test-state");
  });

  it("rejects unsafe changed paths using the shared sync.ts guard", () => {
    expect(validateReviewContext(input({ diff: diff({ modified: ["../escape.ts"] }) }))).toContain("path");
    expect(validateReviewContext(input({ diff: diff({ added: ["/etc/passwd"] }) }))).toContain("path");
    expect(validateReviewContext(input({ diff: diff({ deleted: ["a/../../b.ts"] }) }))).toContain("path");
    expect(validateReviewContext(input({ diff: diff({ modified: ["src/ok.ts"] }) }))).not.toContain("path");
  });

  it("rejects authority fields and raw secrets", () => {
    for (const key of ["approved", "verdict", "authorized", "merge_authority", "canMerge", "policyBypass", "ownerOverride"]) {
      expect(validateReviewContext({ ...input(), [key]: "x" } as ReviewContextInput)).toContain("authority-field");
    }
    for (const key of ["apiKey", "token", "privateKey", "password", "secret"]) {
      expect(validateReviewContext({ ...input(), [key]: "x" } as ReviewContextInput)).toContain("authority-field");
    }
    expect(validateReviewContext(input({ changeRef: 'api_key: "sk-live-abc12345"' }))).toContain("raw-secret");
    expect(validateReviewContext(input({ policyRefs: ["Bearer eyJhbGciOiJIUzI1NiJ9.zz"] }))).toContain("raw-secret");
  });

  it("reports unknown requirement refs only when the known set is supplied", () => {
    expect(validateReviewContext(input({ requirementRefs: ["REQ-ghost"] }))).toEqual([]);
    expect(validateReviewContext(input({ requirementRefs: ["REQ-ghost"] }), KNOWN)).toContain("requirement-refs");
  });

  it("buildReviewContextPack fails closed rather than returning a partial pack", () => {
    expect(() => buildReviewContextPack(input({ packId: "bad id" }))).toThrowError(/pack-id/);
  });
});

describe("pack join", () => {
  it("projects the diff paths without copying content", () => {
    const pack = buildReviewContextPack(
      input({ diff: diff({ added: ["b.ts"], modified: ["a.ts"], deleted: ["c.ts"] }) }),
    );
    expect(pack.changedFiles).toEqual(["a.ts", "b.ts", "c.ts"]);
  });

  it("separates expected from actual touch and never calls a mismatch a defect", () => {
    const pack = buildReviewContextPack(
      input({
        diff: diff({ modified: ["src/a.ts", "src/unexpected.ts"] }),
        touch: touch(["src/a.ts", "src/never-touched.ts"]),
      }),
    );
    expect(pack.touch.overlap).toEqual(["src/a.ts"]);
    expect(pack.touch.expectedOnly).toEqual(["src/never-touched.ts"]);
    expect(pack.touch.unexpected).toEqual(["src/unexpected.ts"]);
    // EXPECTED TOUCH != ACTUAL TOUCH, and neither is a verdict.
    expect(Object.keys(pack.touch).sort()).toEqual(["expectedOnly", "overlap", "unexpected"]);
  });

  it("reports impact as unavailable with a reason instead of inventing it", () => {
    const pack = buildReviewContextPack(input());
    expect(pack.impact.status).toBe("UNAVAILABLE");
    expect(pack.impact.refs).toEqual([]);
    expect(pack.impact.reason).toContain("REQ-p20-change-impact");
  });

  it("references caller-owned impact without recomputing it", () => {
    const pack = buildReviewContextPack(input({ impactRefs: ["impact:b", "impact:a"] }));
    expect(pack.impact.status).toBe("REFERENCED");
    expect(pack.impact.refs).toEqual(["impact:a", "impact:b"]);
  });

  it("keeps test outcomes distinct and never summarises them as good", () => {
    const pack = buildReviewContextPack(
      input({
        testOutcomes: [
          outcome("t:3", "unit", "SKIPPED"),
          outcome("t:1", "unit", "PASSED"),
          outcome("t:2", "unit", "FAILED"),
          outcome("t:4", "unit", "NOT_RUN"),
        ],
      }),
    );
    expect(pack.testOutcomes.map((t) => t.state)).toEqual(["PASSED", "FAILED", "SKIPPED", "NOT_RUN"]);
    // SKIPPED is never collapsed into PASSED, and NOT_RUN stays unknown.
    const passed = pack.testOutcomes.filter((t) => t.state === "PASSED");
    expect(passed).toHaveLength(1);
  });

  it("reuses the existing verification state vocabulary and defaults to UNVERIFIED", () => {
    expect(buildReviewContextPack(input()).verification.state).toBe("UNVERIFIED");
    expect(buildReviewContextPack(input({ verificationState: "VERIFIED" })).verification.state).toBe("VERIFIED");
    expect(() => buildReviewContextPack(input({ verificationState: "APPROVED" as never }))).toThrowError(/verification state/);
  });

  it("projects bounded requirement context and never the whole registry", () => {
    const supplied = [requirement("REQ-p16-review-context-pack"), requirement("REQ-p20-expected-touch-set")];
    const pack = buildReviewContextPack(
      input({ requirementRefs: ["REQ-p16-review-context-pack"], requirements: supplied }),
    );
    expect(pack.requirementContext.map((r) => r.id)).toEqual(["REQ-p16-review-context-pack"]);
    expect(pack.requirementContext[0]!.work_state).toBe("COMPLETE");
    // A supplied-but-unreferenced requirement is not smuggled into the pack.
    expect(pack.requirementRefs).toEqual(["REQ-p16-review-context-pack"]);
  });

  it("keeps source provenance as structured records, not prose", () => {
    const pack = buildReviewContextPack(
      input({
        sources: [
          { dimension: "touch", provenance: "estimateTouchSet" },
          { dimension: "diff", provenance: "git", detail: "515eb0b" },
        ],
      }),
    );
    expect(pack.sources.map((s) => s.dimension)).toEqual(["diff", "touch"]);
    expect(pack.provenance).toBe("p16-review-context-pack");
  });
});

describe("pack honesty and bounds", () => {
  it("surfaces missing requirement context instead of dropping it", () => {
    const pack = buildReviewContextPack(input({ requirementRefs: ["REQ-ghost"] }));
    expect(pack.unresolved).toEqual([
      { dimension: "requirement", ref: "REQ-ghost", reason: "no supplied requirement record for this reference" },
    ]);
    // There is deliberately no completeness flag anywhere.
    expect(Object.keys(pack)).not.toContain("complete");
    expect(Object.keys(pack)).not.toContain("isComplete");
  });

  it("flags unresolved capability refs rather than pretending they resolved", () => {
    const pack = buildReviewContextPack(input({ capabilityRefs: ["skill:review@1.0.0"] }));
    expect(pack.unresolved.map((u) => u.dimension)).toEqual(["policy"]);
  });

  it("bounds each dimension and records what was truncated", () => {
    const many = Array.from({ length: 12 }, (_, i) => `f${String(i).padStart(2, "0")}.ts`);
    const pack = buildReviewContextPack(
      input({ diff: diff({ modified: many }), maxItemsPerDimension: 5 }),
    );
    expect(pack.changedFiles).toHaveLength(5);
    expect(pack.truncated).toContain("diff");
    expect(DEFAULT_PACK_MAX_ITEMS).toBe(25);
  });

  it("does not mutate its sources", () => {
    const source = diff({ modified: ["src/a.ts"] });
    const estimate = touch(["src/a.ts"]);
    const before = JSON.stringify({ source, estimate });
    buildReviewContextPack(input({ diff: source, touch: estimate }));
    expect(JSON.stringify({ source, estimate })).toBe(before);
  });
});

describe("pack determinism and immutability", () => {
  it("orders changed files and outcomes canonically from scrambled insertion", () => {
    const scrambled = ["z.ts", "m.ts", "a.ts"];
    const pack = buildReviewContextPack(
      input({
        diff: diff({ added: scrambled }),
        testOutcomes: [outcome("t:9", "z"), outcome("t:1", "a"), outcome("t:1", "b")],
      }),
    );
    expect(pack.changedFiles).toEqual(["a.ts", "m.ts", "z.ts"]);
    expect(pack.testOutcomes.map((t) => `${t.ref}/${t.suite}`)).toEqual(["t:1/a", "t:1/b", "t:9/z"]);
  });

  it("produces an identical pack for identical input, whatever the insertion order", () => {
    const a = buildReviewContextPack(
      input({ diff: diff({ modified: ["a.ts", "b.ts"] }), policyRefs: ["p2", "p1"] }),
    );
    const b = buildReviewContextPack(
      input({ diff: diff({ modified: ["b.ts", "a.ts"] }), policyRefs: ["p1", "p2"] }),
    );
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("normalizes ids globally, including repeated separators and punctuation", () => {
    expect(packIdFor("Review Context Pack")).toBe("rcp-review-context-pack");
    // Every invalid span replaced, not just the first.
    expect(packIdFor("a  b   c")).toBe("rcp-a-b-c");
    expect(packIdFor("--lead and trail--")).toBe("rcp-lead-and-trail");
    expect(packIdFor("Mixed!!!punctuation???here")).toBe("rcp-mixed-punctuation-here");
    expect(packIdFor("  ")).toBe("rcp-pack");
  });

  it("cannot masquerade as a verdict, commit, requirement, proposal or evidence id", () => {
    for (const id of [
      "REQ-p16-review-context-pack",
      "gov-release-scope",
      "515eb0b",
      "verdict:1",
      "rcp",
      "evidence:1",
    ]) {
      expect(validateReviewContext(input({ packId: id }))).toContain("pack-id");
    }
  });

  it("deep-copies reads so callers cannot mutate pack state", () => {
    const pack = buildReviewContextPack(
      input({
        diff: diff({ modified: ["src/a.ts"] }),
        touch: touch(["src/a.ts"]),
        requirementRefs: ["REQ-p16-review-context-pack"],
        requirements: [requirement("REQ-p16-review-context-pack")],
        capabilityRefs: ["skill:review@1.0.0"],
      }),
    );
    const files = packChangedFiles(pack);
    files.push("injected.ts");
    expect(packChangedFiles(pack)).toEqual(["src/a.ts"]);

    const touchCopy = packTouchComparison(pack);
    touchCopy.unexpected.push("injected.ts");
    expect(packTouchComparison(pack).unexpected).toEqual([]);

    const context = packRequirementContext(pack);
    context[0]!.work_state = "OWNER_GATED";
    expect(packRequirementContext(pack)[0]!.work_state).toBe("COMPLETE");

    const unresolved = packUnresolved(pack);
    expect(unresolved).toHaveLength(1);
    unresolved.length = 0;
    expect(packUnresolved(pack)).toHaveLength(1);
  });

  it("does not leak live references to caller-owned structures", () => {
    const paths = ["src/a.ts"];
    const pack = buildReviewContextPack(input({ diff: diff({ modified: paths }) }));
    paths.push("src/injected.ts");
    expect(pack.changedFiles).toEqual(["src/a.ts"]);
  });
});

describe("pack boundary invariants", () => {
  it("declares exactly the registered join dimensions", () => {
    expect([...PACK_DIMENSIONS]).toEqual(["diff", "touch", "impact", "tests", "provenance", "policy", "verification"]);
  });

  it("contains no authority or verdict field", () => {
    const pack = buildReviewContextPack(
      input({ diff: diff({ modified: ["a.ts"] }), verificationState: "VERIFIED" as never }),
    );
    const keys = Object.keys(pack).sort();
    expect(keys).toEqual([
      "capabilityRefs",
      // Default sort is by char code, so "changeK"/"changeR" precede "changed".
      "changeKind",
      "changeRef",
      "changedFiles",
      "generatedAt",
      "impact",
      "packId",
      "policyRefs",
      "provenance",
      "requirementContext",
      "requirementRefs",
      "sources",
      "testOutcomes",
      "touch",
      "truncated",
      "unresolved",
      "verification",
    ]);
    expect(JSON.stringify(pack)).not.toContain("approved");
  });

  it("exposes no review-execution, verdict, merge, execution or token-budget surface", () => {
    // "review" is deliberately NOT banned: naming a review-context projection
    // is the whole purpose. What must not exist is a surface that PERFORMS a
    // review or produces a verdict.
    const names = Object.keys(reviewPack);
    for (const banned of [
      "verdict",
      "reviewVerdict",
      "approve",
      "authorize",
      "merge",
      "execute",
      "apply",
      "deploy",
      "budget",
      "tokenize",
      "estimate",
      "impact",
      "persist",
      "save",
      "store",
    ]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
    // The only review-shaped export builds a pack; none of them judges.
    expect(names.filter((n) => n.toLowerCase().includes("review"))).toEqual([
      "validateReviewContext",
      "buildReviewContextPack",
    ]);
  });

  it("test state vocabulary cannot express a pass for something that did not run", () => {
    for (const banned of ["PASSED_AND_SKIPPED", "ASSUMED_PASS", "UNKNOWN_PASS"]) {
      expect(PACK_TEST_STATES).not.toContain(banned as never);
    }
    expect(PACK_TEST_STATES).toContain("NOT_RUN");
    expect(PACK_TEST_STATES).toContain("SKIPPED");
  });

  it("is not persisted: a projection owns no storage", () => {
    expect(Object.keys(reviewPack).some((n) => /Store$/.test(n))).toBe(false);
  });
});
