import { describe, expect, it } from "vitest";
import { canonicalInvention, inventionIdFor, registerInvention, validateInvention } from "./inventions";
import type { InventionInput } from "./inventions";

function input(over: Partial<InventionInput> = {}): InventionInput {
  return {
    title: "Evidence-bound completion gate",
    inventors: ["aetherius-team"],
    dateConceived: "2026-09-23",
    problem: "Tasks marked done without required evidence",
    priorApproaches: "Manual checklists and prose claims",
    mechanism: "A platform rule linking task state to required evidence presence",
    effect: "Completion claims become verifiable instead of asserted",
    projects: ["aetherius-os"],
    sources: ["programme registry"],
    prototypeEvidence: ["promotion test report gate"],
    priorArt: [{ ref: "SWE-bench verified workflows", relation: "external evaluation precedent, not the mechanism" }],
    status: "CANDIDATE",
    evidenceRefs: ["promotion.ts:235-244"],
    provenance: "fixture",
    relatedRequirements: ["REQ-p19-evidence-bound-completion"],
    ...over,
  };
}

const KNOWN = ["REQ-p19-evidence-bound-completion", "REQ-p16-control"];

describe("invention disclosure", () => {
  it("registers a valid record with a deterministic id", () => {
    const { records, outcome } = registerInvention([], input(), KNOWN, () => "2026-09-23T00:00:00.000Z");
    expect(outcome.status).toBe("registered");
    if (outcome.status !== "registered") throw new Error("expected registered");
    expect(outcome.record.inventionId).toMatch(/^inv-evidence-bound-completion-gate-[0-9a-f]{8}$/);
    expect(outcome.record.inventionId).toBe(inventionIdFor(input().title, input().mechanism));
    expect(records).toHaveLength(1);
    expect(outcome.record.registeredAt).toBe("2026-09-23T00:00:00.000Z");
  });

  it("is idempotent for identical content and conflicts on overwrite", () => {
    const first = registerInvention([], input(), KNOWN);
    if (first.outcome.status !== "registered") throw new Error("expected registered");
    const again = registerInvention(first.records, input(), KNOWN);
    expect(again.outcome.status).toBe("identical");
    expect(again.records).toHaveLength(1);
    const clash = registerInvention(first.records, input({ effect: "Something else entirely" }), KNOWN);
    expect(clash.outcome.status).toBe("conflict");
    expect(clash.records).toHaveLength(1);
    if (clash.outcome.status !== "conflict") throw new Error("expected conflict");
    expect(clash.outcome.reason).toContain("immutable");
  });

  it("rejects missing fields, bad dates and unknown statuses", () => {
    expect(validateInvention(input({ title: "  " }))).toContain("title-required");
    expect(validateInvention(input({ inventors: [] }))).toContain("inventors-required");
    expect(validateInvention(input({ dateConceived: "someday" }))).toContain("date-invalid");
    expect(validateInvention(input({ problem: "" }))).toContain("problem-required");
    expect(validateInvention(input({ mechanism: "" }))).toContain("mechanism-required");
    expect(validateInvention(input({ effect: "" }))).toContain("effect-required");
    expect(validateInvention(input({ projects: [] }))).toContain("projects-required");
    expect(validateInvention(input({ provenance: "" }))).toContain("provenance-required");
    expect(validateInvention(input({ status: "PATENTED" as never }))).toContain("status-invalid");
    expect(validateInvention(input({ publicDisclosureDate: "never" }))).toContain("disclosure-date-invalid");
    expect(validateInvention(input({ priorArt: [{ ref: "", relation: "x" }] }))).toContain("prior-art-invalid");
    const bad = registerInvention([], input({ title: "" }), KNOWN);
    expect(bad.outcome.status).toBe("conflict");
    expect(bad.records).toHaveLength(0);
  });

  it("rejects legal conclusions and requires external attribution", () => {
    expect(validateInvention(input({ mechanism: "A patentable breakthrough device" }))).toContain("legal-conclusion");
    expect(validateInvention(input({ effect: "This is clearly non-obvious" }))).toContain("legal-conclusion");
    expect(validateInvention(input({ title: "Our novel invention for review" }))).toContain("legal-conclusion");
    // Ordinary prose mentioning novelty comparatively is not a legal claim.
    expect(validateInvention(input({ priorApproaches: "a novel approach compared to manual lists" }))).not.toContain(
      "legal-conclusion",
    );
    expect(validateInvention(input({ derivedFromExternal: true }))).toContain("attribution-required");
    expect(
      validateInvention(input({ derivedFromExternal: true, externalAttribution: "Saraev 2026, STUDY_ONLY" })),
    ).toEqual([]);
  });

  it("validates related requirements against the registry", () => {
    const unknown = registerInvention([], input({ relatedRequirements: ["REQ-nope"] }), KNOWN);
    expect(unknown.outcome.status).toBe("conflict");
    if (unknown.outcome.status !== "conflict") throw new Error("expected conflict");
    expect(unknown.outcome.reason).toContain("REQ-nope");
    const linked = registerInvention([], input(), KNOWN);
    expect(linked.outcome.status).toBe("registered");
  });

  it("serializes deterministically and preserves provenance", () => {
    const a = registerInvention([], input(), KNOWN, () => "2026-09-23T00:00:00.000Z");
    const b = registerInvention([], input(), KNOWN, () => "2026-09-23T00:00:00.000Z");
    if (a.outcome.status !== "registered" || b.outcome.status !== "registered") throw new Error("expected registered");
    expect(canonicalInvention(a.outcome.record)).toBe(canonicalInvention(b.outcome.record));
    expect(a.outcome.record.provenance).toBe("fixture");
    expect(a.outcome.record.priorArt).toEqual([
      { ref: "SWE-bench verified workflows", relation: "external evaluation precedent, not the mechanism" },
    ]);
  });
});
