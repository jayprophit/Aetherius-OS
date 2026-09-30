import { describe, expect, it } from "vitest";
import { auditEvidenceTrace, extractPathCitations, summariseEvidenceTrace } from "./evidenceTrace";
import type { EvidenceTrace, OwnerRoots, PathResolver } from "./evidenceTrace";
import type { Requirement } from "./types";

const ROOTS: OwnerRoots = { aetherius_os: ["aetherius-os"], poietek: ["poietek"], "aetherius-os": ["aetherius-os"] };

/** In-memory disk: only the listed paths exist, keyed "root/path". */
function diskOf(paths: string[]): PathResolver {
  const have = new Set(paths);
  return (root, p) => have.has(`${root}/${p}`);
}

function req(over: Partial<Requirement> = {}): Requirement {
  return {
    id: "REQ-x",
    title: "t",
    description: "d",
    source: { class: "RESEARCH_NOTE", ref: "r" },
    owner: "aetherius-os",
    phase: "P16",
    status: "PROVEN",
    priority: 3,
    depends_on: [],
    blockers: [],
    evidence: ["something happened"],
    provenance: "p",
    owner_gate: false,
    work_state: "COMPLETE",
    ...over,
  };
}

function audit(requirements: Requirement[], paths: string[]): EvidenceTrace[] {
  return auditEvidenceTrace(requirements, ROOTS, diskOf(paths));
}

describe("evidenceTrace: path extraction", () => {
  it("finds a bare path in prose", () => {
    expect(extractPathCitations("implemented in src/release/packaging.ts (19 tests)")).toEqual([
      "src/release/packaging.ts",
    ]);
  });

  it("finds several paths and sorts them", () => {
    expect(extractPathCitations("see src/b.ts and src/a.ts")).toEqual(["src/a.ts", "src/b.ts"]);
  });

  it("strips a leading ./", () => {
    expect(extractPathCitations("at ./src/a.ts")).toEqual(["src/a.ts"]);
  });

  it("strips sentence punctuation from the end", () => {
    expect(extractPathCitations("recorded in src/a.ts, src/b.ts.")).toEqual(["src/a.ts", "src/b.ts"]);
  });

  it("returns nothing for prose with no extension", () => {
    expect(extractPathCitations("19 tests pass and the scheduler is clean")).toEqual([]);
  });

  it("does not treat a slash inside a sentence as a path without an extension", () => {
    expect(extractPathCitations("owner/gate and n/a and yes/no")).toEqual([]);
  });

  it("finds a bare filename only when it carries a directory", () => {
    expect(extractPathCitations("packaging.ts alone")).toEqual([]);
    expect(extractPathCitations("src/packaging.ts")).toEqual(["src/packaging.ts"]);
  });
});

describe("evidenceTrace: classification", () => {
  it("reports PROSE_ONLY when evidence names no path at all", () => {
    const [t] = audit([req({ evidence: ["23 tests pass, typecheck clean"] })], []);
    expect(t!.traceClass).toBe("PROSE_ONLY");
    expect(t!.hasTestCitation).toBe(false);
  });

  it("reports CITED_PATHS when a cited path resolves", () => {
    const [t] = audit([req({ evidence: ["see src/a.ts"] })], ["aetherius-os/src/a.ts"]);
    expect(t!.traceClass).toBe("CITED_PATHS");
    expect(t!.resolved[0]!.path).toBe("src/a.ts");
    expect(t!.resolved[0]!.resolvedIn).toBe("aetherius-os");
  });

  it("reports DANGLING_CITATION when the named path does not exist", () => {
    const [t] = audit([req({ evidence: ["see src/ghost.ts"] })], []);
    expect(t!.traceClass).toBe("DANGLING_CITATION");
    expect(t!.dangling[0]!.path).toBe("src/ghost.ts");
    expect(t!.dangling[0]!.searchedRoots).toEqual(["aetherius-os"]);
  });

  it("a resolved path outranks a dangling one in the same requirement", () => {
    const [t] = audit([req({ evidence: ["src/real.ts and src/ghost.ts"] })], ["aetherius-os/src/real.ts"]);
    expect(t!.resolved.map((c) => c.path)).toEqual(["src/real.ts"]);
    expect(t!.dangling.map((c) => c.path)).toEqual(["src/ghost.ts"]);
    // class stays DANGLING_CITATION: the unresolved claim is still on record
    expect(t!.traceClass).toBe("DANGLING_CITATION");
  });

  it("reports NO_EVIDENCE for an empty evidence array", () => {
    const [t] = audit([req({ evidence: [] })], []);
    expect(t!.traceClass).toBe("NO_EVIDENCE");
  });

  it("reports NO_EVIDENCE for whitespace-only evidence", () => {
    const [t] = audit([req({ evidence: ["   ", "\t"] })], []);
    expect(t!.traceClass).toBe("NO_EVIDENCE");
  });

  it("reports MACHINE_REFS when the machine-readable fields are populated and resolve", () => {
    const [t] = audit(
      [req({ evidence: ["done"], test_refs: ["src/release/packaging.test.ts"] })],
      ["aetherius-os/src/release/packaging.test.ts"],
    );
    expect(t!.traceClass).toBe("MACHINE_REFS");
    expect(t!.testRefs).toEqual(["src/release/packaging.test.ts"]);
    expect(t!.hasTestCitation).toBe(true);
  });

  it("a declared machine ref that does not resolve is still a dangling citation", () => {
    // Declaring a machine-readable path does not make it true. An absent file
    // is the more serious finding, so it must not be absorbed by MACHINE_REFS.
    const [t] = audit([req({ evidence: ["done"], test_refs: ["src/ghost.test.ts"] })], []);
    expect(t!.traceClass).toBe("DANGLING_CITATION");
    expect(t!.testRefs).toEqual(["src/ghost.test.ts"]);
    expect(t!.untraceableComplete).toBe(true);
  });
});

describe("evidenceTrace: cross-repo resolution", () => {
  it("resolves a path in the owner's own repo, not only the local one", () => {
    const [t] = audit([req({ owner: "poietek", evidence: ["src/poietek/qa/visualQa.ts"] })], [
      "poietek/src/poietek/qa/visualQa.ts",
    ]);
    expect(t!.traceClass).toBe("CITED_PATHS");
    expect(t!.resolved[0]!.resolvedIn).toBe("poietek");
  });

  it("does not resolve a poietek path against the aetherius disk", () => {
    const [t] = audit([req({ owner: "poietek", evidence: ["src/poietek/qa/visualQa.ts"] })], [
      "aetherius-os/src/poietek/qa/visualQa.ts",
    ]);
    expect(t!.traceClass).toBe("DANGLING_CITATION");
  });

  it("falls back to the owner name as its own root when unmapped", () => {
    const [t] = audit([req({ owner: "genesis", evidence: ["src/g.ts"] })], ["genesis/src/g.ts"]);
    expect(t!.resolved[0]!.resolvedIn).toBe("genesis");
  });
});

describe("evidenceTrace: declared search prefixes", () => {
  it("resolves src-relative shorthand and records which prefix matched", () => {
    const [t] = audit([req({ evidence: ["sha256HexBytes (runners/sync.ts)"] })], [
      "aetherius-os/src/runners/sync.ts",
    ]);
    expect(t!.traceClass).toBe("CITED_PATHS");
    expect(t!.resolved[0]!.matchedPrefix).toBe("src/");
    expect(t!.resolved[0]!.resolvedPath).toBe("src/runners/sync.ts");
  });

  it("prefers the repo-root-relative convention when both would match", () => {
    const [t] = audit([req({ evidence: ["src/a.ts"] })], [
      "aetherius-os/src/a.ts",
      "aetherius-os/src/src/a.ts",
    ]);
    expect(t!.resolved[0]!.matchedPrefix).toBe("");
    expect(t!.resolved[0]!.resolvedPath).toBe("src/a.ts");
  });

  it("reports a citation that matches no declared prefix instead of guessing", () => {
    const [t] = audit(
      [req({ evidence: ["docs/a.md"] })],
      ["aetherius-os/website/docs/a.md", "aetherius-os/packages/core/docs/a.md"],
    );
    expect(t!.traceClass).toBe("DANGLING_CITATION");
    expect(t!.dangling[0]!.searchedPrefixes).toEqual(["", "src/"]);
  });

  it("honours a caller that declares no prefixes at all", () => {
    const traces = auditEvidenceTrace(
      [req({ evidence: ["runners/sync.ts"] })],
      ROOTS,
      diskOf(["aetherius-os/src/runners/sync.ts"]),
      { prefixes: [""] },
    );
    expect(traces[0]!.traceClass).toBe("DANGLING_CITATION");
  });

  it("records the resolved path distinct from the citation as written", () => {
    const [t] = audit([req({ evidence: ["./src/a.ts"] })], ["aetherius-os/src/a.ts"]);
    expect(t!.resolved[0]!.citation).toBe("src/a.ts");
    expect(t!.resolved[0]!.resolvedPath).toBe("src/a.ts");
  });
});

describe("evidenceTrace: untraceable COMPLETE claims", () => {
  it("flags a COMPLETE requirement whose evidence is prose only", () => {
    const [t] = audit([req({ evidence: ["clean run, nothing to check"] })], []);
    expect(t!.claimsComplete).toBe(true);
    expect(t!.untraceableComplete).toBe(true);
  });

  it("does not flag a COMPLETE requirement with a resolvable test citation", () => {
    const [t] = audit([req({ evidence: ["19 tests in src/release/packaging.test.ts"] })], [
      "aetherius-os/src/release/packaging.test.ts",
    ]);
    expect(t!.untraceableComplete).toBe(false);
  });

  it("a test file that does not exist leaves the claim untraceable", () => {
    const [t] = audit([req({ evidence: ["23 tests in src/workers/collisionPrediction.test.ts"] })], []);
    expect(t!.hasTestCitation).toBe(false);
    expect(t!.untraceableComplete).toBe(true);
  });

  it("an implementation citation alone does not trace a COMPLETE claim", () => {
    const [t] = audit([req({ evidence: ["implemented in src/a.ts"] })], ["aetherius-os/src/a.ts"]);
    expect(t!.traceClass).toBe("CITED_PATHS");
    expect(t!.hasTestCitation).toBe(false);
    expect(t!.untraceableComplete).toBe(true);
  });

  it("does not flag a non-COMPLETE requirement", () => {
    const [t] = audit([req({ work_state: "IN_PROGRESS", evidence: ["wip"] })], []);
    expect(t!.claimsComplete).toBe(false);
    expect(t!.untraceableComplete).toBe(false);
  });
});

describe("evidenceTrace: purity and determinism", () => {
  it("never mutates the requirements it is given", () => {
    const input = req({ evidence: ["see src/a.ts"], test_refs: ["src/a.test.ts"] });
    const before = JSON.stringify(input);
    audit([input], ["aetherius-os/src/a.ts"]);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("returns identical output across repeated runs", () => {
    const rs = [req({ id: "REQ-b" }), req({ id: "REQ-a", evidence: ["src/a.ts"] })];
    const one = JSON.stringify(audit(rs, ["aetherius-os/src/a.ts"]));
    const two = JSON.stringify(audit(rs, ["aetherius-os/src/a.ts"]));
    expect(one).toBe(two);
  });

  it("sorts output by requirement id regardless of input order", () => {
    const rs = [req({ id: "REQ-z" }), req({ id: "REQ-a" }), req({ id: "REQ-m" })];
    expect(audit(rs, []).map((t) => t.id)).toEqual(["REQ-a", "REQ-m", "REQ-z"]);
  });

  it("handles an empty registry", () => {
    expect(auditEvidenceTrace([], ROOTS, diskOf([]))).toEqual([]);
  });
});

describe("evidenceTrace: cross-repo test naming conventions", () => {
  it("recognises Python prefix-style test files", () => {
    const [t] = audit(
      [req({ owner: "agent-bridge", evidence: ["11 speech tests"], test_refs: ["tests/test_speech_profile.py"] })],
      ["agent-bridge/tests/test_speech_profile.py"],
    );
    expect(t!.hasTestCitation).toBe(true);
    expect(t!.untraceableComplete).toBe(false);
  });

  it("recognises a tests/ directory convention", () => {
    const [t] = audit(
      [req({ owner: "poietek", evidence: ["see it"], test_refs: ["tests/some_suite.js"] })],
      ["poietek/tests/some_suite.js"],
    );
    expect(t!.hasTestCitation).toBe(true);
  });

  it("does not treat an ordinary module as a test", () => {
    const [t] = audit(
      [req({ owner: "agent-bridge", evidence: ["see it"], test_refs: ["world_audit.py"] })],
      ["agent-bridge/world_audit.py"],
    );
    expect(t!.hasTestCitation).toBe(false);
  });

  it("does not treat a bare tests/ directory as a test file", () => {
    const [t] = audit([req({ evidence: ["see it"], implementation_refs: ["tests/"] })], ["x/tests/"]);
    expect(t!.hasTestCitation).toBe(false);
  });
});

describe("evidenceTrace: absent owner repository is not a dangling citation", () => {
  it("marks a citation rootUnavailable when no root exists at all", () => {
    const traces = auditEvidenceTrace(
      [req({ owner: "poietek", evidence: ["src/poietek/qa/visualQa.ts"] })],
      ROOTS,
      diskOf([]),
      { rootExists: () => false },
    );
    expect(traces[0]!.dangling[0]!.rootUnavailable).toBe(true);
  });

  it("does not accuse the citation of being broken when the repo is absent", () => {
    // In a clean clone of this repository alone, no sibling repo exists. A
    // citation that could not be checked is unverifiable here, not broken.
    const traces = auditEvidenceTrace(
      [req({ owner: "poietek", evidence: ["src/poietek/qa/visualQa.ts"] })],
      ROOTS,
      diskOf([]),
      { rootExists: () => false },
    );
    expect(traces[0]!.traceClass).not.toBe("DANGLING_CITATION");
  });

  it("still reports the requirement as untraceable rather than upgrading it", () => {
    const traces = auditEvidenceTrace(
      [req({ owner: "poietek", evidence: ["prose only"] })],
      ROOTS,
      diskOf([]),
      { rootExists: () => false },
    );
    expect(traces[0]!.untraceableComplete).toBe(true);
    expect(traces[0]!.hasTestCitation).toBe(false);
  });

  it("still calls it dangling when the repo IS present and the file is not", () => {
    const traces = auditEvidenceTrace(
      [req({ owner: "poietek", evidence: ["src/poietek/qa/ghost.ts"] })],
      ROOTS,
      diskOf([]),
      { rootExists: () => true },
    );
    expect(traces[0]!.traceClass).toBe("DANGLING_CITATION");
    expect(traces[0]!.dangling[0]!.rootUnavailable).toBe(false);
  });

  it("defaults to roots-present when no rootExists is supplied", () => {
    const traces = auditEvidenceTrace(
      [req({ owner: "poietek", evidence: ["src/poietek/qa/ghost.ts"] })],
      ROOTS,
      diskOf([]),
    );
    expect(traces[0]!.dangling[0]!.rootUnavailable).toBe(false);
  });
});

describe("evidenceTrace: summary", () => {
  it("counts classes, complete claims and dangling citations", () => {
    const traces = audit(
      [
        req({ id: "REQ-1", evidence: ["prose"] }),
        req({ id: "REQ-2", evidence: ["src/a.ts"] }),
        req({ id: "REQ-3", evidence: ["src/ghost.ts"] }),
        req({ id: "REQ-4", work_state: "IN_PROGRESS", evidence: ["wip"] }),
      ],
      ["aetherius-os/src/a.ts"],
    );
    const s = summariseEvidenceTrace(traces);
    expect(s.total).toBe(4);
    expect(s.byClass.PROSE_ONLY).toBe(2); // REQ-1 and the IN_PROGRESS REQ-4
    expect(s.byClass.CITED_PATHS).toBe(1);
    expect(s.byClass.DANGLING_CITATION).toBe(1);
    expect(s.complete).toBe(3);
    // REQ-1 prose, REQ-2 implementation-only, REQ-3 dangling. REQ-4 is not COMPLETE.
    expect(s.untraceableComplete).toBe(3);
    expect(s.danglingCitations).toBe(1);
    expect(s.requirementsWithMachineRefs).toBe(0);
  });

  it("counts a requirement using machine refs once", () => {
    const traces = audit([req({ test_refs: ["src/a.test.ts"], implementation_refs: ["src/a.ts"] })], []);
    expect(summariseEvidenceTrace(traces).requirementsWithMachineRefs).toBe(1);
  });

  it("summary of an empty registry is all zeros", () => {
    const s = summariseEvidenceTrace([]);
    expect(s.total).toBe(0);
    expect(s.untraceableComplete).toBe(0);
  });
});
