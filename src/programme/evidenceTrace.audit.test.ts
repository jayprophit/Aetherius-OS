import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { auditEvidenceTrace, summariseEvidenceTrace } from "./evidenceTrace";
import type { OwnerRoots, PathResolver } from "./evidenceTrace";
import type { Requirement } from "./types";

/**
 * Durable audit of the REAL registry, not a fixture. These assertions
 * encode what is actually true of src/programme/requirements.json today.
 *
 * If one of them starts failing, that is not a bug in the auditor: it means
 * the registry changed and the recorded finding must be re-examined and
 * updated deliberately. A silently-drifting evidence baseline is the exact
 * failure this module exists to prevent.
 */

const REGISTRY = "src/programme/requirements.json";

/**
 * Sibling repo directory name for each owner id appearing in the registry.
 *
 * Each project is searched in BOTH its own repository and the Aetherius-OS
 * monorepo, because `owner` names the accountable PROJECT, not the
 * repository holding the implementation. That is a verified fact about this
 * registry, not an assumption: the Genesis repo is a C++ tree (cmake,
 * include, components) with no TypeScript reflex/calibration/orchestrator
 * module, IDE-Workspace has no src/monitoring, and MAT has neither
 * docs/context-layers.md nor src/context/layers.ts — all six live in
 * Aetherius-OS under project-named paths. Recorded here so a reader can
 * check the reasoning rather than trust a mapping.
 */
const ROOT_DIRS: Record<string, string> = {
  "aetherius-os": "Aetherius-OS",
  mat: "Materials-Atlas-Table-Codex---MAT",
  ide: "IDE-Workspace",
  poietek: "Poietek",
  "agent-bridge": "Agent-Bridge",
  genesis: "Genesis",
};

const ROOTS: OwnerRoots = Object.fromEntries(
  Object.entries(ROOT_DIRS).map(([owner, dir]) => [owner, [dir, "Aetherius-OS"]]),
);

const resolve: PathResolver = (root, path) => existsSync(`${root}/${path}`) || existsSync(`../${root}/${path}`);

function registry(): Requirement[] {
  return JSON.parse(readFileSync(REGISTRY, "utf8")).requirements as Requirement[];
}

const traces = auditEvidenceTrace(registry(), ROOTS, resolve);
const summary = summariseEvidenceTrace(traces);

describe("audit: real requirement registry evidence traceability", () => {
  it("audits every requirement in the registry", () => {
    expect(traces.length).toBe(registry().length);
  });

  it("audits the whole registry including the traceability requirement itself", () => {
    expect(traces.length).toBe(108);
  });

  it("records that the machine-readable evidence fields were unused until this unit", () => {
    // The gap: the Requirement type declares test_refs/implementation_refs
    // for exactly this purpose and the registry populated neither. Exactly
    // one requirement now uses them - this one - so the number is 1, not 0,
    // and it is the first worked example for the remaining 107.
    expect(summary.requirementsWithMachineRefs).toBe(1);
    const withRefs = traces.filter((t) => t.implementationRefs.length > 0 || t.testRefs.length > 0);
    expect(withRefs.map((t) => t.id)).toEqual(["REQ-p16-evidence-traceability"]);
  });

  it("traces the traceability requirement to its own tests, machine-readably", () => {
    const self = traces.find((t) => t.id === "REQ-p16-evidence-traceability")!;
    expect(self.traceClass).toBe("MACHINE_REFS");
    expect(self.testRefs).toEqual([
      "src/programme/evidenceTrace.audit.test.ts",
      "src/programme/evidenceTrace.test.ts",
    ]);
    expect(self.implementationRefs).toEqual(["src/programme/evidenceTrace.ts"]);
    expect(self.hasTestCitation).toBe(true);
    expect(self.untraceableComplete).toBe(false);
  });

  it("currently records how many COMPLETE claims have no resolvable test citation", () => {
    expect(summary.complete).toBe(93);
    expect(summary.untraceableComplete).toBe(70);
  });

  it("records that a citation may use either declared path convention", () => {
    // The registry uses repo-root-relative citations almost everywhere and
    // src-relative shorthand in six older ones. Both resolve; the prefix
    // that matched is recorded rather than guessed at read time.
    const srcRelative = traces
      .flatMap((t) => t.resolved)
      .filter((c) => c.matchedPrefix === "src/")
      .map((c) => `${c.resolvedIn}:${c.resolvedPath}`)
      .sort();
    expect(srcRelative).toEqual([
      "Aetherius-OS:src/eval/contamination.ts",
      "Aetherius-OS:src/providers/trainingLifecycle.ts",
      "Aetherius-OS:src/runners/sync.ts",
      "Aetherius-OS:src/runners/targets.ts",
      "Aetherius-OS:src/steward/readiness.ts",
      "Aetherius-OS:src/steward/types.ts",
    ]);
  });

  it("records that owner names a project, not the repository holding the code", () => {
    // 8 requirements are owned by a project other than aetherius-os yet
    // resolve inside the Aetherius-OS monorepo. This is why resolution
    // searches both roots; it is a recorded fact, not a fallback.
    const crossOwner = traces
      .filter((t) => t.owner !== "aetherius-os")
      .filter((t) => t.resolved.some((c) => c.resolvedIn === "Aetherius-OS"))
      .map((t) => `${t.id}[${t.owner}]`)
      .sort();
    expect(crossOwner).toEqual([
      "REQ-context-layers[mat]",
      "REQ-p22-project-orchestrator[genesis]",
      "REQ-p22-reflex-abstention[genesis]",
      "REQ-p22-reflex-calibration[genesis]",
      "REQ-p22-reflex-fabric[genesis]",
      "REQ-p22-selective-escalation[genesis]",
      "REQ-p22-world-model-lab[genesis]",
      "REQ-p23-work-monitoring[ide]",
    ]);
  });

  it("classifies the rest of the registry without inventing new classes", () => {
    expect(Object.keys(summary.byClass).sort()).toEqual([
      "CITED_PATHS",
      "DANGLING_CITATION",
      "MACHINE_REFS",
      "NO_EVIDENCE",
      "PROSE_ONLY",
    ]);
    const counted = Object.values(summary.byClass).reduce((a, b) => a + b, 0);
    expect(counted).toBe(traces.length);
  });

  it("never classifies a requirement with prose evidence as empty evidence", () => {
    expect(summary.byClass.NO_EVIDENCE).toBe(0);
  });

  it("never reports a work_state the registry does not contain", () => {
    const known = new Set(registry().map((r) => `${r.id}:${r.work_state}`));
    for (const t of traces) {
      expect(known.has(`${t.id}:${t.work_state}`)).toBe(true);
    }
  });

  it("every COMPLETE requirement is either traceable or explicitly reported untraceable", () => {
    // No third state: the audit is exhaustive, so a COMPLETE requirement can
    // never be silently skipped by the auditor.
    for (const t of traces) {
      if (!t.claimsComplete) continue;
      expect(t.hasTestCitation || t.untraceableComplete).toBe(true);
    }
  });

  it("the auditor is deterministic on the real registry", () => {
    const again = summariseEvidenceTrace(auditEvidenceTrace(registry(), ROOTS, resolve));
    expect(again).toEqual(summary);
  });

  it("the registry file itself is unchanged by auditing", () => {
    const before = readFileSync(REGISTRY, "utf8");
    auditEvidenceTrace(registry(), ROOTS, resolve);
    expect(readFileSync(REGISTRY, "utf8")).toBe(before);
  });
});

describe("audit: dangling citations in the real registry", () => {
  it("reports exactly the four prose fixture filenames, and nothing else", () => {
    // These four are NOT file references. They are fixture filenames quoted
    // inside evidence prose describing a defect that tests found
    // (a dependent-write pair wrongly joined to 'src/consumer.ts'; a
    // no-structural-edge similarity case across user*.ts). Rewriting them
    // into src/-relative paths would fabricate files, so they stay
    // reported and a human classifies them. Nothing else in 107
    // requirements fails to resolve.
    const dangling = traces.filter((t) => t.dangling.length > 0);
    expect(dangling.map((t) => t.id).sort()).toEqual([
      "REQ-p20-change-impact",
      "REQ-p20-collision-predictor",
    ]);
    const paths = dangling.flatMap((t) => t.dangling.map((d) => d.path)).sort();
    expect(paths).toEqual([
      "src/consumer.ts",
      "src/user.ts",
      "src/userService.ts",
      "src/userServiceHelper.ts",
    ]);
    // src/programme/evidenceTrace.audit.test.ts audits the REAL registry
    // rather than a fixture and pins the true baseline.
    expect(summary.danglingCitations).toBe(4);
  });

  it("records which roots and prefixes were searched before declaring a citation dangling", () => {
    const d = traces.flatMap((t) => t.dangling);
    for (const c of d) {
      expect(c.searchedRoots.length).toBeGreaterThan(0);
      expect(c.searchedPrefixes).toEqual(["", "src/"]);
    }
  });
});
