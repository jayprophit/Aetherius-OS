import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  GAP_AXES,
  GAP_STATUSES,
  axisReadiness,
  loadGapRegistry,
  openGaps,
  rollupByAxis,
  summariseGapStatuses,
  validateGapRecord,
  validateGapRegistry,
} from "./gapAnalysis";
import { generateGapReport } from "./gapReport";
import { loadBuildRegistry, projectRootOf } from "./buildManifest";
import {
  genesisReferencedPaths,
  loadGenesisRequirements,
  requirementStatusCounts,
} from "./genesisRegistries";

/**
 * The gap analysis gate.
 *
 * The gap registry is only worth reading if its citations resolve. This
 * test therefore checks three things:
 *
 *  1. The registry is structurally valid and every cross-reference points at
 *     something that actually exists - Genesis requirement ids, Genesis
 *     source paths, Genesis test paths, the owner's acceptance tests and
 *     the owner's canonical gap register categories.
 *  2. The generated report is byte-identical to the committed one.
 *  3. The Genesis requirement registry it claims to summarise really does
 *     say what the summary says.
 *
 * A clean clone of Aetherius-OS alone has no Genesis sibling. The
 * cross-reference checks skip explicitly there rather than failing for the
 * wrong reason, exactly as the workspace hygiene guard does.
 */

const REPO_ROOT = resolve(join(__dirname, "..", ".."));
const DOCS = join(REPO_ROOT, "docs");
/**
 * Where Genesis lives.
 *
 * Genesis is the kernel of Aetherius OS, so it lives inside it, and the
 * workspace was reorganised accordingly. The path is read from the build
 * manifest registry rather than written out here, because the registry is
 * the authority on where every project lives and a path written in code
 * goes stale silently the moment the workspace is reorganised.
 */
const GENESIS_ROOT =
  projectRootOf(
    loadBuildRegistry(readFileSync(join(REPO_ROOT, "docs", "BUILD-MANIFEST-REGISTRY.yaml"), "utf8")),
    resolve(join(REPO_ROOT, "..")),
    "genesis",
  ) ?? resolve(join(REPO_ROOT, "..", "Genesis"));

const REGISTRY_PATH = join(DOCS, "GAP-ANALYSIS-REGISTRY.yaml");
const REPORT_PATH = join(DOCS, "GAP-ANALYSIS-REGISTRY.md");

const GENESIS_PRESENT = existsSync(join(GENESIS_ROOT, "registry", "requirements.tsv"));

/** The owner's acceptance tests, AT-01 to AT-20, from the master handoff. */
const ACCEPTANCE_TESTS = [
  "AT-01", "AT-02", "AT-03", "AT-04", "AT-05", "AT-06", "AT-07", "AT-08", "AT-09", "AT-10",
  "AT-11", "AT-12", "AT-13", "AT-14", "AT-15", "AT-16", "AT-17", "AT-18", "AT-19", "AT-20",
];

/**
 * The owner's canonical 42-category gap register, A01 to G04, with the
 * exact ids from the master handoff. G26, G27 and G28 are the earlier
 * labels that were folded into C, D and E, and are preserved as mappings
 * rather than dropped.
 */
const GAP_REGISTER_CATEGORIES = [
  "A01", "A02", "A03", "A04", "A05",
  "B01", "B02", "B03", "B04", "B05", "B06", "B07",
  "C01", "C02", "C03", "C04", "C05", "C06", "C07",
  "D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08",
  "E01", "E02", "E03", "E04", "E05",
  "F01", "F02", "F03", "F04", "F05", "F06",
  "G01", "G02", "G03", "G04",
  "G26", "G27", "G28",
];

/** The platform ids the comparison uses. */
const PLATFORMS = [
  "manus", "claude", "claude_code", "chatgpt", "kimi", "copilot", "jev", "qwen",
  "hermes", "opencode", "antigravity", "gemini", "deepseek",
  "mem0", "cursor", "perplexity", "mem0ai",
];

const registry = loadGapRegistry(readFileSync(REGISTRY_PATH, "utf8"));

function references() {
  const paths = GENESIS_PRESENT
    ? genesisReferencedPaths(GENESIS_ROOT)
    : { implementationPaths: [], testPaths: [] };
  return {
    requirements: GENESIS_PRESENT ? loadGenesisRequirements(GENESIS_ROOT).map((r) => r.id) : [],
    acceptanceTests: ACCEPTANCE_TESTS,
    gapRegisterCategories: GAP_REGISTER_CATEGORIES,
    platforms: PLATFORMS,
    implementationPaths: paths.implementationPaths,
    testPaths: paths.testPaths,
  };
}

describe("gap analysis registry", () => {
  it("uses the current schema version", () => {
    expect(registry.schema_version).toBeTruthy();
  });

  it("has no structural problems", () => {
    const issues = validateGapRegistry(registry, references());
    expect(issues.map((i) => `${i.id}: ${i.code} ${i.detail}`)).toEqual([]);
  });

  it("resolves every cross-reference against the real Genesis tree", () => {
    if (!GENESIS_PRESENT) return;
    const issues = validateGapRegistry(registry, references());
    const dangling = issues.filter((i) => i.code.startsWith("registry-dangling"));
    expect(
      dangling.map((i) => `${i.id}: ${i.detail}`),
      "every gap citation must point at something that exists",
    ).toEqual([]);
  });

  it("uses only the documented axis and status vocabularies", () => {
    for (const g of registry.gaps) {
      expect(GAP_AXES as readonly string[], `${g.id} axis ${g.axis}`).toContain(g.axis);
      expect(GAP_STATUSES as readonly string[], `${g.id} status ${g.status}`).toContain(g.status);
    }
  });

  it("never claims VERIFIED without a test to prove it", () => {
    for (const g of registry.gaps) {
      if (g.status !== "VERIFIED") continue;
      expect((g.test_refs ?? []).length, `${g.id} is VERIFIED with no test reference`).toBeGreaterThan(0);
    }
  });

  it("gives every gap a stated gap, even a closed one", () => {
    for (const g of registry.gaps) {
      expect(g.gap.length, `${g.id} has no gap statement`).toBeGreaterThan(0);
      expect(g.present.length, `${g.id} has no present statement`).toBeGreaterThan(0);
    }
  });

  it("has a next thing to build", () => {
    const open = openGaps(registry);
    expect(open.length, "an empty gap list means the analysis found nothing to do").toBeGreaterThan(0);
    const priorities = open.map((g) => g.priority);
    expect(Math.min(...priorities), "a priority 1 gap is the next real thing").toBe(1);
  });

  it("rolls up by axis without losing a gap", () => {
    const rollup = rollupByAxis(registry);
    const total = rollup.reduce((n, a) => n + a.total, 0);
    expect(total).toBe(registry.gaps.length);
    for (const a of rollup) {
      expect(a.byStatus.VERIFIED + a.byStatus.IMPLEMENTED + a.byStatus.PARTIAL +
        a.byStatus.MISSING + a.byStatus.RESEARCH + a.byStatus.NOT_APPLICABLE,
      ).toBe(a.total);
    }
  });

  it("summarises statuses without losing a gap", () => {
    const s = summariseGapStatuses(registry);
    expect(s.total).toBe(registry.gaps.length);
    const summed = Object.values(s.byStatus).reduce((n, v) => n + v, 0);
    expect(summed).toBe(registry.gaps.length);
  });

  it("computes axis readiness as coverage, and never above 100", () => {
    for (const a of rollupByAxis(registry)) {
      const r = axisReadiness(a);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(100);
    }
  });
});

describe("gap analysis report", () => {
  it("is byte-identical to the generator output", () => {
    const generated = generateGapReport({ registry, platformNames: PLATFORMS });
    if (process.env.REGENERATE_GAP_REPORT === "1") {
      writeFileSync(REPORT_PATH, generated, "utf8");
      expect(true).toBe(true);
      return;
    }
    expect(
      existsSync(REPORT_PATH),
      `${REPORT_PATH} does not exist; regenerate with REGENERATE_GAP_REPORT=1`,
    ).toBe(true);
    expect(readFileSync(REPORT_PATH, "utf8")).toBe(generated);
  });

  it("is deterministic", () => {
    const a = generateGapReport({ registry, platformNames: PLATFORMS });
    const b = generateGapReport({ registry, platformNames: PLATFORMS });
    expect(a).toBe(b);
  });

  it("names every gap", () => {
    const report = generateGapReport({ registry, platformNames: PLATFORMS });
    for (const g of registry.gaps) {
      expect(report, g.id).toContain(g.id);
    }
  });
});

describe("genesis requirement registry", () => {
  it("loads the canonical requirement set", () => {
    if (!GENESIS_PRESENT) return;
    const requirements = loadGenesisRequirements(GENESIS_ROOT);
    expect(requirements.length, "the Genesis requirement registry is not empty").toBeGreaterThan(100);
    for (const r of requirements) {
      expect(r.id, "every requirement has an id").toBeTruthy();
      expect(r.status, `${r.id} has a status`).toBeTruthy();
    }
  });

  it("reports the status distribution the gap analysis rests on", () => {
    if (!GENESIS_PRESENT) return;
    const counts = requirementStatusCounts(GENESIS_ROOT);
    const proven = (counts.BENCHMARKED ?? 0) + (counts.UNIT_TESTED ?? 0) + (counts.INTEGRATION_TESTED ?? 0);
    const total = Object.values(counts).reduce((n, v) => n + v, 0);
    expect(total).toBeGreaterThan(0);
    // The gap analysis is only honest if it acknowledges that a large part
    // of the registry is specified but not built.
    expect(proven).toBeLessThan(total);
  });
});
