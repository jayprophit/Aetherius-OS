import { describe, expect, it } from "vitest";
import {
  attentionNeeded,
  canonicalReadiness,
  isCurrentFor,
  validateReadiness,
} from "./readiness";
import type { DimensionResult, ReadinessAssessment } from "./readiness";

function dimension(over: Partial<DimensionResult> = {}): DimensionResult {
  return {
    dimension: "BUILD",
    status: "PASS",
    evidenceRefs: ["build-log-1"],
    reason: "vite build exit 0 in 4.6s",
    command: "npm run build",
    ...over,
  };
}

function assessment(over: Partial<ReadinessAssessment> = {}): ReadinessAssessment {
  return {
    assessmentId: "ra-1",
    repositoryId: "aetherius-os",
    commitRef: "abc123",
    environment: "win11-x64-node22",
    assessedAt: "2026-09-25T00:00:00.000Z",
    dimensions: [dimension()],
    ...over,
  };
}

describe("autonomy readiness", () => {
  it("accepts evidenced dimensions", () => {
    expect(validateReadiness(assessment())).toEqual([]);
    expect(
      validateReadiness(
        assessment({
          dimensions: [
            dimension(),
            dimension({ dimension: "LINT", status: "NOT_APPLICABLE", evidenceRefs: [], reason: "no lint gate in repo" }),
            dimension({ dimension: "SANDBOX", status: "BLOCKED", evidenceRefs: ["clean-room-blocked"], reason: "no isolated backend" }),
          ],
        }),
      ),
    ).toEqual([]);
  });

  it("rejects PASS without evidence and malformed records", () => {
    expect(validateReadiness(assessment({ dimensions: [dimension({ evidenceRefs: [] })] }))).toContain(
      "pass-without-evidence",
    );
    expect(validateReadiness(assessment({ assessmentId: " " }))).toContain("assessment-id");
    expect(validateReadiness(assessment({ repositoryId: "" }))).toContain("repository-id");
    expect(validateReadiness(assessment({ commitRef: "" }))).toContain("commit-ref");
    expect(validateReadiness(assessment({ environment: "" }))).toContain("environment");
    expect(validateReadiness(assessment({ assessedAt: "someday" }))).toContain("assessed-at");
    expect(
      validateReadiness(assessment({ dimensions: [dimension({ dimension: "VIBES" as never })] })),
    ).toContain("dimension-unknown");
    expect(validateReadiness(assessment({ dimensions: [dimension(), dimension()] }))).toContain("dimension-duplicate");
    expect(validateReadiness(assessment({ dimensions: [dimension({ status: "READY" as never })] }))).toContain(
      "status-unknown",
    );
    expect(validateReadiness(assessment({ dimensions: [dimension({ reason: "  " })] }))).toContain("reason-required");
  });

  it("lists attention without scoring", () => {
    const result = attentionNeeded(
      assessment({
        dimensions: [
          dimension(),
          dimension({ dimension: "LINT", status: "NOT_APPLICABLE", evidenceRefs: [], reason: "none" }),
          dimension({ dimension: "RECOVERY", status: "MISSING_EVIDENCE", evidenceRefs: [], reason: "no recovery proof" }),
          dimension({ dimension: "BUILD", status: "FAIL", evidenceRefs: ["log"], reason: "exit 1" }),
        ],
      }),
    );
    // Duplicate BUILD dimension is a fixture artifact for attention ordering; validate separately.
    expect(result.map((d) => d.dimension)).toEqual(["BUILD", "RECOVERY"]);
    expect(JSON.stringify(assessment())).not.toContain("score");
    expect(JSON.stringify(assessment())).not.toContain("percent");
    expect(Object.keys(assessment())).not.toContain("overall");
    expect(Object.keys(assessment())).not.toContain("grade");
  });

  it("binds currentness to the exact commit", () => {
    const current = assessment();
    expect(isCurrentFor(current, "abc123")).toBe(true);
    expect(isCurrentFor(current, "def456")).toBe(false);
  });

  it("serializes deterministically", () => {
    const a = assessment({ dimensions: [dimension({ dimension: "LINT" }), dimension({ dimension: "BUILD" })] });
    const b = assessment({ dimensions: [dimension({ dimension: "BUILD" }), dimension({ dimension: "LINT" })] });
    expect(canonicalReadiness(a)).toBe(canonicalReadiness(b));
  });

  it("keeps maturity/PR/release concepts structurally separate", () => {
    const keys = Object.keys(assessment());
    for (const banned of ["stars", "maturity", "prReadiness", "releaseReady", "release"]) {
      expect(keys).not.toContain(banned);
    }
  });
});
