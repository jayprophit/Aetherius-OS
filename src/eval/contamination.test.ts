import { describe, expect, it } from "vitest";
import { DATASET_SPLITS } from "./evaluation";
import {
  CONTAMINATION_STATUSES,
  assessmentIdFor,
  assessContamination,
  canonicalAssessment,
  fingerprintItem,
  fingerprintItems,
  independentEvidenceFor,
  normalizeForFingerprint,
  partitionExpectation,
  queryAssessments,
  validateAssessment,
} from "./contamination";
import * as contamination from "./contamination";
import type { AssessmentInput, ContaminationAssessment } from "./contamination";
import type { DatasetSplit } from "./evaluation";

const AT = "2026-09-26T00:00:00.000Z";

/**
 * Dimension-specific fixture. Every ref, fingerprint and evidence list is set
 * explicitly, and omitted dimensions are set to undefined rather than relying
 * on a shared default — a shared default here would create a false exposure
 * relation between unrelated benchmark/subject pairs.
 */
function input(over: Partial<AssessmentInput> = {}): AssessmentInput {
  return {
    assessmentId: "bcont-gsm8k-llama",
    benchmarkRef: "gsm8k",
    datasetVersion: "1.0.0",
    subjectRef: "ollama/llama3:8b",
    partition: "held-out",
    status: "UNKNOWN",
    evidenceRefs: [],
    assessedAt: AT,
    ...over,
  };
}

const FP_A = fingerprintItem("What is 2+2?");
const FP_B = fingerprintItem("What is 3+3?");
const FP_C = fingerprintItem("What is 4+4?");

describe("partition vocabulary is reused, not duplicated", () => {
  it("reuses the existing DatasetSplit set as the partition vocabulary", () => {
    // The requirement's seven partitions already exist in evaluation.ts.
    expect([...DATASET_SPLITS]).toEqual([
      "train",
      "validation",
      "held-out",
      "out-of-domain",
      "adversarial",
      "temporal",
      "sealed",
    ]);
    for (const partition of DATASET_SPLITS) {
      expect(validateAssessment(input({ partition }))).not.toContain("partition");
    }
  });

  it("rejects a partition outside the reused vocabulary", () => {
    expect(validateAssessment(input({ partition: "private-never-trained" as never }))).toContain("partition");
  });

  it("classifies what a partition label alone establishes", () => {
    expect(partitionExpectation("train")).toBe("EXPECTED_EXPOSURE");
    expect(partitionExpectation("validation")).toBe("EXPECTED_EXPOSURE");
    expect(partitionExpectation("held-out")).toBe("INTENDED_INDEPENDENT");
    expect(partitionExpectation("out-of-domain")).toBe("INTENDED_INDEPENDENT");
    expect(partitionExpectation("adversarial")).toBe("INTENDED_INDEPENDENT");
    expect(partitionExpectation("temporal")).toBe("INTENDED_INDEPENDENT");
    expect(partitionExpectation("sealed")).toBe("POLICY_LABEL_ONLY");
  });
});

describe("status vocabulary is honest", () => {
  it("has no CLEAN member and no boolean", () => {
    expect(CONTAMINATION_STATUSES).not.toContain("CLEAN" as never);
    expect(CONTAMINATION_STATUSES).not.toContain("TRUSTED" as never);
    expect([...CONTAMINATION_STATUSES]).toEqual([
      "KNOWN_EXPOSED",
      "SUSPECTED",
      "NO_KNOWN_EXPOSURE",
      "UNKNOWN",
      "SEALED_BY_POLICY",
    ]);
  });

  it("requires evidence before NO_KNOWN_EXPOSURE, so no disclosure is never CLEAN", () => {
    expect(validateAssessment(input({ status: "NO_KNOWN_EXPOSURE", evidenceRefs: [] }))).toContain("status-evidence");
    expect(validateAssessment(input({ status: "NO_KNOWN_EXPOSURE", evidenceRefs: ["manifest:1"] }))).toEqual([]);
  });

  it("requires exposure evidence before KNOWN_EXPOSED", () => {
    expect(validateAssessment(input({ status: "KNOWN_EXPOSED", exposureRefs: [] }))).toContain("status-evidence");
    expect(
      validateAssessment(input({ status: "KNOWN_EXPOSED", exposureRefs: ["corpus-manifest"], exposureSource: "VENDOR_REPORTED" })),
    ).toEqual([]);
  });

  it("rejects an exposure asserted with an UNKNOWN source", () => {
    expect(
      validateAssessment(input({ status: "KNOWN_EXPOSED", exposureRefs: ["x"], exposureSource: "UNKNOWN" })),
    ).toContain("status-evidence");
  });

  it("rejects malformed identity, version and timestamp", () => {
    const cases: Record<string, Partial<AssessmentInput>> = {
      "assessment-id": { assessmentId: "gsm8k" },
      "benchmark-ref": { benchmarkRef: "" },
      "dataset-version": { datasetVersion: "1.0" },
      "subject-ref": { subjectRef: "  " },
      "assessed-at": { assessedAt: "today" },
      "exposure-refs": { exposureRefs: ["a", "a"] },
      "evidence-refs": { evidenceRefs: [""] },
      "exposure-source": { exposureSource: "guess" as never },
    };
    for (const [problem, over] of Object.entries(cases)) {
      expect(validateAssessment(input(over))).toContain(problem);
    }
  });

  it("requires real sha256 fingerprints, never a similarity score", () => {
    expect(validateAssessment(input({ knownFingerprints: ["0.87"] }))).toContain("fingerprints");
    expect(validateAssessment(input({ knownFingerprints: ["FP_A"] }))).toContain("fingerprints");
    expect(validateAssessment(input({ knownFingerprints: [FP_A] }))).toEqual([]);
  });

  it("assessContamination fails closed on malformed input", () => {
    expect(() => assessContamination(input({ status: "NO_KNOWN_EXPOSURE" }))).toThrowError(/status-evidence/);
  });
});

describe("fingerprinting and normalization", () => {
  it("is deterministic", () => {
    expect(fingerprintItem("hello")).toBe(fingerprintItem("hello"));
    expect(fingerprintItems(["a", "b"])).toEqual([fingerprintItem("a"), fingerprintItem("b")]);
  });

  it("normalizes only line endings and trailing whitespace, per the documented rule", () => {
    expect(normalizeForFingerprint("a\r\nb")).toBe("a\nb");
    expect(normalizeForFingerprint("a\rb")).toBe("a\nb");
    // Trailing whitespace per line is stripped, and the whole item is
    // trimmed, so a trailing newline is removed too.
    expect(normalizeForFingerprint("a  \nb\t\n")).toBe("a\nb");
    expect(normalizeForFingerprint("  a  ")).toBe("a");
  });

  it("does NOT case-fold, punctuation-strip or collapse inner whitespace", () => {
    // Over-normalizing manufactures false overlap, so these must differ.
    expect(fingerprintItem("Hello")).not.toBe(fingerprintItem("hello"));
    expect(fingerprintItem("a,b")).not.toBe(fingerprintItem("ab"));
    expect(fingerprintItem("a  b")).not.toBe(fingerprintItem("a b"));
    expect(fingerprintItem("café")).not.toBe(fingerprintItem("cafe"));
  });

  it("treats a line-ending-only difference as the same item", () => {
    expect(fingerprintItem("a\r\nb")).toBe(fingerprintItem("a\nb"));
  });
});

describe("fingerprint overlap is computed, never asserted", () => {
  it("computes the intersection and never accepts a caller-supplied one", () => {
    const assessment = assessContamination(
      input({
        knownFingerprints: [FP_C, FP_A],
        benchmarkFingerprints: [FP_B, FP_A],
      }),
    );
    expect(assessment.matchedFingerprints).toEqual([FP_A]);
  });

  it("upgrades a false no-exposure claim to SUSPECTED on a fingerprint match", () => {
    const assessment = assessContamination(
      input({
        status: "NO_KNOWN_EXPOSURE",
        evidenceRefs: ["manifest:1"],
        knownFingerprints: [FP_A],
        benchmarkFingerprints: [FP_A],
      }),
    );
    expect(assessment.status).toBe("SUSPECTED");
    expect(assessment.independentEvidence).toBe(false);
  });

  it("a fingerprint NO-MATCH never yields independent evidence by itself", () => {
    const assessment = assessContamination(
      input({ knownFingerprints: [FP_A], benchmarkFingerprints: [FP_B, FP_C] }),
    );
    expect(assessment.matchedFingerprints).toEqual([]);
    // UNKNOWN stays UNKNOWN: no match is not proof of no exposure.
    expect(assessment.status).toBe("UNKNOWN");
    expect(assessment.independentEvidence).toBe(false);
    expect(assessment.reasons.join(" ")).toContain("absence of disclosure is not evidence of cleanliness");
  });
});

describe("performance is never contamination evidence", () => {
  it("has no score, accuracy or performance input at all", () => {
    const keys = Object.keys(assessContamination(input()));
    for (const absent of ["score", "accuracy", "passed", "mean", "latencyMs", "performance", "result"]) {
      expect(keys).not.toContain(absent);
    }
  });

  it("rejects a performance-shaped field rather than silently dropping it", () => {
    // Silent repair is forbidden: an unrecognised key must be reported, not
    // quietly discarded, or a caller would believe a score had been recorded.
    expect(validateAssessment({ ...input(), score: 0.99 } as AssessmentInput)).toContain("unknown-field");
    expect(() => assessContamination({ ...input(), score: 0.99 } as AssessmentInput)).toThrowError(
      /unknown-field/,
    );
    expect(() => assessContamination({ ...input(), expected: "4" } as AssessmentInput)).toThrowError(
      /unknown-field/,
    );
  });

  it("reaches the same status regardless of any caller narrative", () => {
    const a = assessContamination(input({ status: "UNKNOWN" }));
    const b = assessContamination(input({ status: "UNKNOWN", subjectVersion: "8b-instruct" }));
    expect(a.status).toBe(b.status);
  });
});

describe("partition semantics qualify interpretation", () => {
  it("marks train and validation as expected exposure, not a defect", () => {
    for (const partition of ["train", "validation"] as DatasetSplit[]) {
      const assessment = assessContamination(
        input({ partition, status: "NO_KNOWN_EXPOSURE", evidenceRefs: ["dev-visibility"] }),
      );
      expect(assessment.expectation).toBe("EXPECTED_EXPOSURE");
      expect(assessment.independentEvidence).toBe(false);
      expect(assessment.reasons.join(" ")).toContain("expected exposure by design");
    }
  });

  it("never lets a sealed label alone establish independence", () => {
    const assessment = assessContamination(input({ partition: "sealed", status: "UNKNOWN" }));
    expect(assessment.expectation).toBe("POLICY_LABEL_ONLY");
    expect(assessment.independentEvidence).toBe(false);
    expect(assessment.reasons.join(" ")).toContain("not evidence of an uncontaminated history");
  });

  it("a sealed partition still cannot assert NO_KNOWN_EXPOSURE without evidence", () => {
    expect(validateAssessment(input({ partition: "sealed", status: "NO_KNOWN_EXPOSURE" }))).toContain(
      "sealed-claim",
    );
  });

  it("grants independent evidence only for an evidence-backed clean held-out pair", () => {
    const assessment = assessContamination(
      input({ status: "NO_KNOWN_EXPOSURE", evidenceRefs: ["training-corpus-manifest:1"] }),
    );
    expect(assessment.independentEvidence).toBe(true);
  });

  it("temporal separation qualifies but does not auto-prove", () => {
    const assessment = assessContamination(
      input({ partition: "temporal", status: "NO_KNOWN_EXPOSURE", evidenceRefs: ["cutoff:2025-01"] }),
    );
    expect(assessment.expectation).toBe("INTENDED_INDEPENDENT");
    expect(assessment.independentEvidence).toBe(true);
  });
});

describe("contamination is relational, not a global dataset property", () => {
  it("gives the same dataset different statuses for two subjects", () => {
    const seen = assessContamination(
      input({
        subjectRef: "model-a",
        status: "KNOWN_EXPOSED",
        exposureRefs: ["corpus-manifest"],
        exposureSource: "VENDOR_REPORTED",
        knownFingerprints: [FP_A],
        benchmarkFingerprints: [FP_A],
      }),
    );
    const unseen = assessContamination(
      input({ subjectRef: "model-b", status: "UNKNOWN", knownFingerprints: [FP_C], benchmarkFingerprints: [FP_A] }),
    );
    // KNOWN_EXPOSED is already the stronger claim; a fingerprint match adds
    // evidence to it and must not downgrade it to the weaker SUSPECTED.
    expect(seen.status).toBe("KNOWN_EXPOSED");
    expect(seen.matchedFingerprints).toEqual([FP_A]);
    expect(unseen.status).toBe("UNKNOWN");
    const all = queryAssessments([unseen, seen], { benchmarkRef: "gsm8k" });
    expect(all.map((a) => a.subjectRef)).toEqual(["model-a", "model-b"]);
  });

  it("treats a system subject as legitimately different from a model subject", () => {
    const system = assessContamination(input({ subjectRef: "aetherius-agent", status: "UNKNOWN" }));
    expect(system.subjectRef).toBe("aetherius-agent");
    expect(system.independentEvidence).toBe(false);
  });
});

describe("identity and determinism", () => {
  it("derives a deterministic id, replacing every invalid span", () => {
    expect(assessmentIdFor("GSM8K contamination")).toBe("bcont-gsm8k-contamination");
    expect(assessmentIdFor("a  b   c")).toBe("bcont-a-b-c");
    expect(assessmentIdFor("--lead and trail--")).toBe("bcont-lead-and-trail");
    expect(assessmentIdFor("!!!")).toBe("bcont-assessment");
  });

  it("cannot masquerade as a dataset, model, run, evidence or proposal id", () => {
    for (const id of ["gsm8k", "ollama/llama3:8b", "run-1", "evidence:1", "gov-release-scope", "bcont"]) {
      expect(validateAssessment(input({ assessmentId: id }))).toContain("assessment-id");
    }
  });

  it("orders queries deterministically from scrambled input", () => {
    const records: ContaminationAssessment[] = [
      assessContamination(input({ assessmentId: "bcont-z", subjectRef: "s1" })),
      assessContamination(input({ assessmentId: "bcont-a", subjectRef: "s2" })),
      assessContamination(input({ assessmentId: "bcont-a", subjectRef: "s1" })),
    ];
    expect(queryAssessments(records).map((a) => `${a.assessmentId}/${a.subjectRef}`)).toEqual([
      "bcont-a/s1",
      "bcont-a/s2",
      "bcont-z/s1",
    ]);
  });

  it("serializes canonically regardless of key insertion order", () => {
    const a = canonicalAssessment(assessContamination(input()));
    const b = canonicalAssessment(assessContamination(input({ subjectRef: "ollama/llama3:8b" })));
    expect(a).toBe(b);
  });

  it("deep-copies query results so callers cannot mutate stored state", () => {
    const stored = [assessContamination(input())];
    const read = queryAssessments(stored);
    read[0]!.status = "KNOWN_EXPOSED";
    expect(queryAssessments(stored)[0]!.status).toBe("UNKNOWN");
  });

  it("does not mutate its input", () => {
    const source = input({ knownFingerprints: [FP_C, FP_A] });
    const before = JSON.stringify(source);
    assessContamination(source);
    expect(JSON.stringify(source)).toBe(before);
  });
});

describe("guard boundary", () => {
  it("does not compute scores or replace the scorer", () => {
    const names = Object.keys(contamination);
    for (const banned of ["score", "grade", "scorer", "evaluate", "runEvaluation", "metric"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("creates no second dataset registry, benchmark registry or evidence graph", () => {
    const names = Object.keys(contamination);
    for (const banned of ["registry", "store", "graph", "database", "index"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("never serializes benchmark content, only identifiers and hashes", () => {
    const assessment = assessContamination(
      input({ knownFingerprints: [FP_A], benchmarkFingerprints: [FP_A], status: "SUSPECTED" }),
    );
    const serialized = JSON.stringify(assessment);
    expect(serialized).toContain(FP_A);
    // No raw item text, no answer key, no expected output.
    expect(serialized).not.toContain("What is 2+2?");
    expect(serialized).not.toContain("answer");
    expect(serialized).not.toContain("expected");
  });

  it("reports the strongest qualification without altering any observed result", () => {
    const clean = assessContamination(input({ status: "NO_KNOWN_EXPOSURE", evidenceRefs: ["m:1"] }));
    const unknown = assessContamination(input({ status: "UNKNOWN" }));
    const q = { benchmarkRef: "gsm8k" };
    expect(independentEvidenceFor([unknown], q)).toBe("QUALIFIED");
    expect(independentEvidenceFor([clean], q)).toBe("INDEPENDENT");
    expect(independentEvidenceFor([], q)).toBe("NO_ASSESSMENT");
    // The qualification is a separate value; no score field is touched.
    expect(Object.keys(clean)).not.toContain("score");
  });
});
