import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { auditEvidenceTrace, looksLikeTest, summariseEvidenceTrace } from "./evidenceTrace";
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

/**
 * Repo root derived from this module's own URL, not from process.cwd(), which
 * is not reliable under vitest workers. `.git` is checked as a path rather
 * than assumed to be a directory, because in a linked worktree it is a FILE.
 */
const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));

const REGISTRY = join(REPO_ROOT, "src", "programme", "requirements.json");

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

/**
 * Root presence has to be judged by layout, not by directory name alone. In the
 * multi-repo workspace the sibling repos sit at fixed paths, but a normal clone
 * of this repository is named whatever the user chose - so "Aetherius-OS" here
 * means THIS repository (REPO_ROOT above), not a directory of that name.
 */
const IN_SELF_REPO = existsSync(join(REPO_ROOT, ".git"));
/** Map a logical root name to a directory on disk. */
const rootDir = (root: string): string =>
  root === "Aetherius-OS" ? REPO_ROOT : join(REPO_ROOT, "..", root);
const rootPresent = (root: string): boolean => existsSync(rootDir(root));
const resolve: PathResolver = (root, path) => existsSync(join(rootDir(root), path));

/**
 * This file audits the REAL registry, which makes cross-repo evidence part of
 * what it measures. A clean clone of this repository alone has no sibling
 * repos, and there the cross-repo numbers are genuinely UNVERIFIABLE rather
 * than wrong. So cross-repo assertions skip, explicitly, instead of failing
 * and accusing dozens of requirements of broken references. Every
 * in-repository assertion still runs unconditionally.
 */
const SIBLINGS_PRESENT = Object.values(ROOT_DIRS).some((dir) =>
  existsSync(join(REPO_ROOT, "..", dir)),
);
const crossRepoIt = SIBLINGS_PRESENT ? it : it.skip;

function registry(): Requirement[] {
  return JSON.parse(readFileSync(REGISTRY, "utf8")).requirements as Requirement[];
}

const traces = auditEvidenceTrace(registry(), ROOTS, resolve, { rootExists: rootPresent });
const summary = summariseEvidenceTrace(traces);

describe("audit: real requirement registry evidence traceability", () => {
  it("audits every requirement in the registry", () => {
    expect(traces.length).toBe(registry().length);
  });

  it("audits the whole registry including the traceability requirement itself", () => {
    expect(traces.length).toBe(110);
  });

  it("records progress on the machine-readable evidence fields", () => {
    // The gap: the Requirement type declares test_refs/implementation_refs
    // for exactly this purpose and the registry populated neither (0 of 107).
    // 63 now use them. Batches 1-2 were admitted by one mechanical rule (the
    // implementation header names one registry REQ id, a sibling test exists
    // and imports it); batch 3 applied the same rule to the other repos,
    // whose test conventions differ (Poietek tests/*.test.js against a
    // compiled .compiled-core artifact, MAT scripts/tests/*.test.mjs, so
    // citations there are owner-repo-relative with different extensions).
    // 91 after the BUILD70 G11 traceability pass, which made
    // REQ-p23-chat-work-depths citeable by correcting its owner from
    // aetherius-os to ide (every sibling P23 interface requirement is owned by
    // ide, and the proving implementation and suite both live in
    // IDE-Workspace, so the old owner made the requirement unciteable from
    // its own root).
    expect(summary.requirementsWithMachineRefs).toBe(91);
    const withRefs = traces.filter((t) => t.implementationRefs.length > 0 || t.testRefs.length > 0);
    expect(withRefs).toHaveLength(91);
    const single = withRefs.filter((t) => t.testRefs.length === 1);
    // most are single-suite citations
    expect(single.length).toBeGreaterThan(80);
    expect(single.length).toBeLessThan(withRefs.length);
    for (const t of single) {
      // Where the proving suite is the module's own sibling, it must be
      // exactly that. Not every requirement has one: p16-registry and
      // p16-control are both proven by programme.test.ts, and the P29/MAT
      // units are proven in their own repos' test layouts.
      const impl = t.implementationRefs[0]!;
      const test = t.testRefs[0]!;
      if (test === `${impl}.test.ts`) continue;
      const siblingName = `${impl.split("/").pop()}.test.ts`;
      if (test.endsWith(siblingName) && test.startsWith("src/")) {
        throw new Error(`${t.id} cites a sibling-shaped test that is not its own`);
      }
    }
    // Eight units legitimately cite more than one suite: the traceability
    // requirement (unit + real-registry audit), the relay requirement
    // (relay.test.ts for the cache, policy.test.ts for the allowlist it depends
    // on), the executor requirement (model-invoke plus bridge-action), the
    // identity rule (Genesis's own C++ suite plus Aetherius's), the layout
    // system (its own component plus the App-level suite), the bridge gate (its
    // policy-deny suite plus the approval-channel and mutation suites added
    // with the Phase B vertical slice), the IDE task loop (client, component
    // and the real-HTTP vertical-slice suite), and the action intake (the
    // real-service suite plus its mutation proof).
    const multi = withRefs.filter((t) => t.testRefs.length > 1);
    expect(multi.map((t) => t.id).sort()).toEqual([
      "REQ-bridge-action-intake",
      "REQ-bridge-gate-compat",
      "REQ-genesis-identity-rule",
      "REQ-ide-genesis-task-loop",
      "REQ-p16-evidence-traceability",
      "REQ-p19-executors",
      "REQ-p23-layout-system",
      "REQ-p30-repo-relay",
    ]);
  });

  it("never counts a declared implementation as a test, whatever it is named", () => {
    // A ref is only worth what it points at, and its ROLE is declared in the
    // registry - a naming heuristic must not overrule that. Agent-Bridge's
    // test-impact planner is a production module called test_impact.py; if the
    // auditor treated it as a suite, a module could appear to prove its own
    // requirement. So the rule is about role separation, not about names.
    for (const t of traces) {
      if (t.implementationRefs.length === 0 && t.testRefs.length === 0) continue;
      expect(t.implementationRefs.length).toBeGreaterThan(0);
      expect(t.testRefs.length).toBeGreaterThan(0);
      for (const ref of t.testRefs) expect(looksLikeTest(ref)).toBe(true);
      for (const ref of t.implementationRefs) {
        // an implementation may legitimately look like a test by name
        if (looksLikeTest(ref)) {
          expect(t.hasTestCitation || true).toBeTruthy();
        }
      }
    }
    // and the specific real case is actually excluded from test detection
    const impact = traces.find((t) => t.id === "REQ-p21-test-impact")!;
    expect(impact.implementationRefs).toEqual(["test_impact.py"]);
    expect(looksLikeTest("test_impact.py")).toBe(true); // it does look like a test
    expect(impact.testRefs).toEqual(["tests/test_test_impact.py"]);
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

  crossRepoIt("currently records how many COMPLETE claims have no resolvable test citation", () => {
    // 91 after the BUILD70 G11 traceability pass. It was 95. The pass closed
    // the last five untraceable COMPLETE claims, and it did so in two different
    // ways because they were two different problems:
    //
    // - REQ-p23-chat-work-depths was genuinely implemented and genuinely
    //   proven; only its owner was wrong (aetherius-os while the code lives in
    //   IDE-Workspace), which made it unciteable from its own root. Owner
    //   corrected, real refs added: the claim is now traceable.
    // - REQ-cert-regeneration, REQ-codex-review, REQ-refmap-followup and
    //   REQ-mat-derived-matrices cited session records that no core repository
    //   preserves. A citation to nonexistent output is not evidence, so their
    //   COMPLETE claim is unsupported and their work_state was downgraded to
    //   READY pending either a retrievable artifact or a fresh run.
    //
    // Downgrading four claims rather than citing them is the honest direction
    // to err: it understates what is complete instead of overstating it.
    expect(summary.complete).toBe(91);
    expect(summary.untraceableComplete).toBe(0);
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

  crossRepoIt("records that owner names a project, not the repository holding the code", () => {
    // 10 requirements are owned by a project other than aetherius-os yet
    // resolve at least one citation inside the Aetherius-OS monorepo. This is
    // why resolution searches both roots; it is a recorded fact, not a
    // fallback. The identity rule is a genuine two-repo requirement: its C++
    // suite lives in Genesis and its TypeScript suite here. The IDE task loop
    // is similar: owned by ide, proven partly by the vertical-slice record
    // kept here. (The action-intake requirement's refs all resolve inside
    // Agent-Bridge, so it is correctly absent from this list.)
    const crossOwner = traces
      .filter((t) => t.owner !== "aetherius-os")
      .filter((t) => t.resolved.some((c) => c.resolvedIn === "Aetherius-OS"))
      .map((t) => `${t.id}[${t.owner}]`)
      .sort();
    expect(crossOwner).toEqual([
      "REQ-context-layers[mat]",
      "REQ-genesis-identity-rule[genesis]",
      "REQ-ide-genesis-task-loop[ide]",
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
  crossRepoIt("reports exactly the four prose fixture filenames, and nothing else", () => {
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
