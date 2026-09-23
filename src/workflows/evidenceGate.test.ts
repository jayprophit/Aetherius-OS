import { describe, expect, it } from "vitest";
import { checkEvidenceGate } from "./evidenceGate";
import type { EvidenceProvided, EvidenceRequirement } from "./evidenceGate";

const required: EvidenceRequirement[] = [
  { key: "unit-tests", description: "unit test report passes" },
  { key: "security-review", description: "security review approves" },
];

function provided(over: Partial<EvidenceProvided> = {}): EvidenceProvided {
  return { key: "unit-tests", kind: "test-report", passed: true, ref: "run-1", ...over };
}

describe("evidence-bound completion gate", () => {
  it("reports COMPLETE only when every requirement has passing evidence", () => {
    const result = checkEvidenceGate(required, [
      provided(),
      { key: "security-review", kind: "approval", passed: true, ref: "owner-1" },
    ]);
    expect(result).toEqual({ verdict: "COMPLETE", missing: [], failed: [], extra: [] });
  });

  it("lists missing and failed keys separately", () => {
    const missing = checkEvidenceGate(required, [provided()]);
    expect(missing.verdict).toBe("NOT_PROVEN");
    expect(missing.missing).toEqual(["security-review"]);
    expect(missing.failed).toEqual([]);

    const failed = checkEvidenceGate(required, [
      provided(),
      { key: "security-review", kind: "approval", passed: false, ref: "owner-1" },
    ]);
    expect(failed.verdict).toBe("NOT_PROVEN");
    expect(failed.missing).toEqual([]);
    expect(failed.failed).toEqual(["security-review"]);
  });

  it("reports extra evidence without failing", () => {
    const result = checkEvidenceGate([required[0]!], [
      provided(),
      { key: "bonus-benchmark", kind: "evaluation", passed: true, ref: "bench-1" },
    ]);
    expect(result.verdict).toBe("COMPLETE");
    expect(result.extra).toEqual(["bonus-benchmark"]);
  });

  it("empty requirements are vacuously COMPLETE and documented", () => {
    expect(checkEvidenceGate([], []).verdict).toBe("COMPLETE");
  });

  it("rejects malformed requirements and evidence", () => {
    expect(() => checkEvidenceGate([{ key: " ", description: "x" }], [])).toThrowError(/invalid evidence requirement/);
    expect(() =>
      checkEvidenceGate(
        [{ key: "a", description: "x" }, { key: "a", description: "y" }],
        [],
      ),
    ).toThrowError(/invalid evidence requirement/);
    expect(() => checkEvidenceGate(required, [{ ...provided(), kind: "vibes" as never }])).toThrowError(
      /unknown evidence kind/,
    );
    expect(() => checkEvidenceGate(required, [{ ...provided(), key: " " }])).toThrowError(/needs a key/);
  });

  it("grants nothing: the gate has no approve/merge/execute surface", () => {
    const result = checkEvidenceGate(required, [
      provided(),
      { key: "security-review", kind: "approval", passed: true, ref: "owner-1" },
    ]);
    expect(result.verdict).toBe("COMPLETE");
    expect(Object.keys(result).sort()).toEqual(["extra", "failed", "missing", "verdict"]);
  });
});
