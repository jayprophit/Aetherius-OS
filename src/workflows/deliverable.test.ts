import { describe, expect, it } from "vitest";
import { assessDeliverable, attestVerification } from "./deliverable";
import type { Deliverable } from "./deliverable";
import type { EvidenceProvided as GateProvided } from "./evidenceGate";

function deliverable(): Deliverable {
  return {
    deliverableId: "d1",
    taskId: "t1",
    artifacts: [
      { key: "report.md" },
      { key: "bundle.zip", sha256: "0".repeat(64) },
    ],
    requiredEvidence: [{ key: "unit-tests", description: "unit tests pass" }],
    verificationState: "UNVERIFIED",
  };
}

function evidence(): GateProvided[] {
  return [{ key: "unit-tests", kind: "test-report", passed: true, ref: "run-1" }];
}

describe("deliverable contract", () => {
  it("delivers when artifacts present and evidence complete", () => {
    const result = assessDeliverable(
      deliverable(),
      [{ key: "report.md" }, { key: "bundle.zip", sha256: "0".repeat(64) }],
      evidence(),
    );
    expect(result.delivered).toBe(true);
    expect(result.verificationState).toBe("EVIDENCE_COMPLETE");
    expect(result.missingArtifacts).toEqual([]);
    expect(result.hashMismatches).toEqual([]);
  });

  it("reports missing artifacts and hash mismatches without advancing", () => {
    const missing = assessDeliverable(deliverable(), [{ key: "report.md" }], evidence());
    expect(missing.delivered).toBe(false);
    expect(missing.missingArtifacts).toEqual(["bundle.zip"]);
    expect(missing.verificationState).toBe("UNVERIFIED");

    const mismatch = assessDeliverable(
      deliverable(),
      [{ key: "report.md" }, { key: "bundle.zip", sha256: "1".repeat(64) }],
      evidence(),
    );
    expect(mismatch.delivered).toBe(false);
    expect(mismatch.hashMismatches).toEqual(["bundle.zip"]);

    const noEvidence = assessDeliverable(
      deliverable(),
      [{ key: "report.md" }, { key: "bundle.zip" }],
      [],
    );
    expect(noEvidence.delivered).toBe(false);
    expect(noEvidence.gate.missing).toEqual(["unit-tests"]);
  });

  it("regresses advanced states on new failures", () => {
    const stale = assessDeliverable(
      { ...deliverable(), verificationState: "EVIDENCE_COMPLETE" },
      [{ key: "report.md" }],
      evidence(),
    );
    expect(stale.verificationState).toBe("FAILED");
    const reverified = assessDeliverable(
      { ...deliverable(), verificationState: "VERIFIED" },
      [{ key: "report.md" }, { key: "bundle.zip", sha256: "0".repeat(64) }],
      evidence(),
    );
    expect(reverified.delivered).toBe(true);
    expect(reverified.verificationState).toBe("VERIFIED");
  });

  it("attestation is explicit and gated on passing evidence", () => {
    const assessed = assessDeliverable(
      deliverable(),
      [{ key: "report.md" }, { key: "bundle.zip" }],
      evidence(),
    );
    const verified = attestVerification(assessed, { verifier: "owner", method: "manual-review", at: "2026-09-24T00:00:00.000Z" });
    expect(verified.verificationState).toBe("VERIFIED");
    expect(() => attestVerification({ ...assessed, verificationState: "UNVERIFIED" }, { verifier: "o", method: "m", at: "t" })).toThrowError(
      /requires EVIDENCE_COMPLETE/,
    );
    expect(() => attestVerification(assessed, { verifier: " ", method: "m", at: "t" })).toThrowError(/requires verifier/);
  });

  it("rejects malformed deliverables", () => {
    expect(() => assessDeliverable({ ...deliverable(), deliverableId: " " }, [], [])).toThrowError(/deliverable-id/);
    expect(() => assessDeliverable({ ...deliverable(), artifacts: [{ key: "a" }, { key: "a" }] }, [], [])).toThrowError(
      /artifacts-invalid/,
    );
    expect(() =>
      assessDeliverable({ ...deliverable(), artifacts: [{ key: "a", sha256: "xyz" }] }, [], []),
    ).toThrowError(/artifacts-invalid/);
  });
});
