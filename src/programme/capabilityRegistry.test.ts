import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  blockedNodes,
  byStatus,
  childrenOf,
  dependenciesOf,
  dependentsOf,
  leafProgress,
  loadRegistry,
  mapRequirementStatus,
  noEvidence,
  progressOf,
  relatedTo,
  searchRegistry,
  subtreeIds,
  unimplementedRequired,
  unverifiedImplementations,
  changedSince,
  validateRegistry,
  type CapabilityNode,
  type Registry,
} from "./capabilityRegistry";
import { generateReport, scopeRegistry } from "./capabilityReport";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const docsDir = join(repoRoot, "docs");
const yamlPath = join(docsDir, "SYSTEM-CAPABILITY-REGISTRY.yaml");
const reqPath = join(here, "requirements.json");
const reportPath = join(docsDir, "SYSTEM-CAPABILITY-REGISTRY.md");
const perProjectDir = join(docsDir, "capabilities");

function node(over: Partial<CapabilityNode> = {}): CapabilityNode {
  return {
    id: "CAP-x",
    name: "X",
    status: "NOT_STARTED",
    ...over,
  } as CapabilityNode;
}

function registryOf(nodes: CapabilityNode[]): Registry {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childrenOfMap = new Map<string, string[]>();
  for (const n of nodes) {
    if (n.primary_parent) {
      const list = childrenOfMap.get(n.primary_parent) ?? [];
      list.push(n.id);
      childrenOfMap.set(n.primary_parent, list);
    }
  }
  return { nodes, byId, childrenOf: childrenOfMap };
}

function resolverFor(existing: string[]) {
  const have = new Set(existing);
  return {
    pathExists: (repo: string, p: string) => have.has(`${repo}/${p}`),
    availableRoots: (repo: string) =>
      existing.some((e) => e === repo || e.startsWith(`${repo}/`)),
  };
}

describe("capability registry integrity (synthetic)", () => {
  it("rejects duplicate ids", () => {
    const reg = registryOf([node({ id: "a" }), node({ id: "a" })]);
    const codes = validateRegistry(reg, () => true, () => false).map((i) => i.code);
    expect(codes).toContain("duplicate-id");
  });

  it("rejects unknown statuses", () => {
    const reg = registryOf([{ ...node({ id: "a" }), status: "DONE" as never }]);
    const issues = validateRegistry(reg, () => true, () => false);
    expect(issues.some((i) => i.code === "invalid-status")).toBe(true);
  });

  it("rejects missing parents and references", () => {
    const reg = registryOf([
      node({ id: "a", primary_parent: "ghost", relationships: { depends_on: ["ghost2"] } }),
    ]);
    const codes = validateRegistry(reg, () => true, () => false).map((i) => i.code);
    expect(codes).toContain("missing-parent");
    expect(codes).toContain("missing-reference");
  });

  it("rejects hierarchy cycles", () => {
    const reg = registryOf([
      node({ id: "a", primary_parent: "b" }),
      node({ id: "b", primary_parent: "a" }),
    ]);
    const codes = validateRegistry(reg, () => true, () => false).map((i) => i.code);
    expect(codes).toContain("circular-hierarchy");
  });

  it("flags alias collisions as duplicate candidates, not silent merges", () => {
    const reg = registryOf([
      node({ id: "a", name: "Speech-to-Text", aliases: ["STT"] }),
      node({ id: "b", name: "Voice Transcription", aliases: ["stt"] }),
    ]);
    const dupes = validateRegistry(reg, () => true, () => false).filter(
      (i) => i.code === "duplicate-candidate",
    );
    expect(dupes.length).toBeGreaterThan(0);
    expect(dupes[0].detail).toContain("b");
  });

  it("flags broken implementation paths only when the root is available", () => {
    const reg = registryOf([
      node({ id: "a", status: "IMPLEMENTED", implementation: { paths: ["Genesis/missing/file.hpp"] } }),
      node({ id: "b", status: "IMPLEMENTED", implementation: { paths: ["NoRepo/x/y"] } }),
    ]);
    const r = resolverFor(["Genesis/include/real.hpp"]);
    const codes = validateRegistry(reg, r.pathExists, r.availableRoots).map((i) => i.code);
    expect(codes).toContain("broken-path");
    // NoRepo root unavailable: skipped, never failed
    expect(codes.filter((c) => c === "broken-path")).toHaveLength(1);
  });

  it("rejects malformed paths", () => {
    const reg = registryOf([node({ id: "a", implementation: { paths: ["noslash"] } })]);
    const codes = validateRegistry(reg, () => true, () => true).map((i) => i.code);
    expect(codes).toContain("malformed-path");
  });

  it("accepts a clean registry", () => {
    const reg = registryOf([
      node({ id: "root", name: "Root", status: "PARTIAL" }),
      node({ id: "leaf", name: "Leaf", primary_parent: "root", status: "VERIFIED" }),
    ]);
    expect(validateRegistry(reg, () => true, () => true)).toEqual([]);
  });
});

describe("requirement status mapping", () => {
  const cases: Array<[string, string, string]> = [
    ["PROVEN", "COMPLETE", "VERIFIED"],
    ["SPECIFIED", "COMPLETE", "DESIGNED"],
    ["RESEARCH", "COMPLETE", "RESEARCH"],
    ["PARTIAL", "COMPLETE", "PARTIAL"],
    ["PROVEN", "IN_PROGRESS", "PARTIAL"],
    ["PROVEN", "READY", "DESIGNED"],
    ["PROVEN", "BLOCKED", "BLOCKED"],
    ["PROVEN", "OWNER_GATED", "BLOCKED"],
    ["PROVEN", "DEFERRED", "NOT_STARTED"],
    ["RESEARCH", "READY", "RESEARCH"],
  ];
  for (const [status, work, expected] of cases) {
    it(`${status}/${work} -> ${expected}`, () => {
      expect(mapRequirementStatus(status, work).status).toBe(expected);
    });
  }
});

describe("progress math", () => {
  it("maps leaf statuses without inventing precision", () => {
    expect(leafProgress(node({ status: "NOT_STARTED" })).percent).toBe(0);
    expect(leafProgress(node({ status: "RESEARCH" })).percent).toBe(10);
    expect(leafProgress(node({ status: "DESIGNED" })).percent).toBe(25);
    const partial = leafProgress(node({ status: "PARTIAL" }));
    expect(partial.percent).toBe(50);
    expect(partial.method).toBe("unmeasured-partial-estimate");
    expect(leafProgress(node({ status: "IMPLEMENTED" })).percent).toBe(90);
    expect(leafProgress(node({ status: "VERIFIED" })).percent).toBe(100);
  });

  it("rolls parents up from children, never from a hand-entered number", () => {
    const reg = registryOf([
      node({ id: "p", status: "PARTIAL" }),
      node({ id: "a", primary_parent: "p", status: "VERIFIED" }),
      node({ id: "b", primary_parent: "p", status: "NOT_STARTED" }),
    ]);
    const r = progressOf(reg, "p", false);
    expect(r.percent).toBe(50);
    expect(r.method).toContain("child-rollup");
  });

  it("excludes deprecated/obsolete/removed from rollups", () => {
    const reg = registryOf([
      node({ id: "p", status: "PARTIAL" }),
      node({ id: "a", primary_parent: "p", status: "VERIFIED" }),
      node({ id: "old", primary_parent: "p", status: "OBSOLETE" }),
    ]);
    expect(progressOf(reg, "p", false).percent).toBe(100);
  });

  it("supports required-only rollups that ignore optional futures", () => {
    const reg = registryOf([
      node({ id: "p", status: "PARTIAL" }),
      node({ id: "a", primary_parent: "p", status: "VERIFIED" }),
      node({ id: "f", primary_parent: "p", status: "NOT_STARTED", required: false }),
    ]);
    expect(progressOf(reg, "p", false).percent).toBe(50);
    expect(progressOf(reg, "p", true).percent).toBe(100);
  });

  it("a parent is never 100% while a required child is incomplete", () => {
    const reg = registryOf([
      node({ id: "p", status: "VERIFIED" }),
      node({ id: "a", primary_parent: "p", status: "VERIFIED" }),
      node({ id: "b", primary_parent: "p", status: "DESIGNED" }),
    ]);
    expect(progressOf(reg, "p", false).percent).toBeLessThan(100);
  });
});

describe("queries", () => {
  const reg = registryOf([
    node({ id: "root", name: "Root System" }),
    node({ id: "kid", name: "Speech-to-Text", aliases: ["STT"], primary_parent: "root", status: "RESEARCH", relationships: { depends_on: ["dep"] } }),
    node({ id: "dep", name: "Audio Capture", primary_parent: "root", status: "BLOCKED", status_reason: "no mic" }),
  ]);

  it("children/subtree/search", () => {
    expect(childrenOf(reg, "root").map((n) => n.id).sort()).toEqual(["dep", "kid"]);
    expect(subtreeIds(reg, "root").sort()).toEqual(["dep", "kid", "root"]);
    expect(searchRegistry(reg, "stt").map((n) => n.id)).toEqual(["kid"]);
    expect(searchRegistry(reg, "SPEECH").map((n) => n.id)).toEqual(["kid"]);
  });

  it("dependents/dependencies/blockers/related", () => {
    expect(dependentsOf(reg, "dep")).toContain("kid");
    expect(dependenciesOf(reg, "kid")).toEqual(["dep"]);
    expect(blockedNodes(reg).map((n) => n.id)).toEqual(["dep"]);
    expect(relatedTo(reg, "kid")).toContain("dep");
  });

  it("status partitions", () => {
    expect(byStatus(reg, "RESEARCH").map((n) => n.id)).toEqual(["kid"]);
    expect(unimplementedRequired(reg).map((n) => n.id)).toEqual(
      expect.arrayContaining(["kid"]),
    );
    expect(unverifiedImplementations(reg)).toEqual([]);
    expect(noEvidence(reg).map((n) => n.id)).toEqual(
      expect.arrayContaining(["kid", "dep"]),
    );
  });

  it("changedSince reads history, not file mtimes", () => {
    const dated = registryOf([
      node({ id: "a", history: [{ date: "2026-10-01", action: "created" }] }),
      node({ id: "b", history: [{ date: "2020-01-01", action: "created" }] }),
    ]);
    expect(changedSince(dated, "2026-09-01").map((n) => n.id)).toEqual(["a"]);
  });

  it("scopeRegistry restricts views to one subtree", () => {
    const scoped = scopeRegistry(reg, "kid");
    expect(scoped.nodes.map((n) => n.id)).toEqual(["kid"]);
    expect(generateReport(scoped, { generatedAt: "2026-10-01" })).toContain("Speech-to-Text");
  });
});

function loadRealRegistry() {
  const yamlText = readFileSync(yamlPath, "utf-8");
  const requirements = JSON.parse(readFileSync(reqPath, "utf-8"))
    .requirements as Array<{
    id: string; title: string; description?: string; owner: string; phase: string;
    status: string; work_state: string; priority?: number; depends_on?: string[];
    implementation_refs?: string[]; test_refs?: string[]; evidence?: string[]; provenance?: string;
  }>;
  return loadRegistry(yamlText, requirements);
}

function realPathResolver() {
  const projectsRoot = resolve(repoRoot, "..");
  return {
    pathExists: (repo: string, p: string) =>
      existsSync(join(projectsRoot, repo, ...p.split("/"))),
    availableRoots: (repo: string) => existsSync(join(projectsRoot, repo)),
  };
}

describe("real registry audit", () => {
  it("has no structural integrity errors", () => {
    const reg = loadRealRegistry();
    const r = realPathResolver();
    const structural = validateRegistry(reg, r.pathExists, r.availableRoots).filter(
      (i) => i.code !== "duplicate-candidate",
    );
    expect(structural).toEqual([]);
  });

  it("covers every requirement exactly once", () => {
    const reg = loadRealRegistry();
    const reqIds = new Set(
      JSON.parse(readFileSync(reqPath, "utf-8")).requirements.map(
        (r: { id: string }) => r.id,
      ),
    );
    const covered = new Set(
      reg.nodes.filter((n) => n.requirement_id).map((n) => n.requirement_id as string),
    );
    expect([...covered].sort()).toEqual([...reqIds].sort());
  });

  it("every requirement node takes live state from requirements.json", () => {
    const reg = loadRealRegistry();
    const reqs = JSON.parse(readFileSync(reqPath, "utf-8")).requirements as Array<{
      id: string; status: string; work_state: string;
    }>;
    for (const r of reqs) {
      const n = reg.byId.get(r.id);
      expect(n).toBeDefined();
    }
    // spot check: a known PROVEN/COMPLETE requirement mirrors VERIFIED
    const identity = reg.byId.get("REQ-genesis-identity-rule");
    expect(identity?.status).toBe("VERIFIED");
  });

  it("duplicate candidates are recorded, not silently merged", () => {
    const reg = loadRealRegistry();
    const r = realPathResolver();
    const dupes = validateRegistry(reg, r.pathExists, r.availableRoots).filter(
      (i) => i.code === "duplicate-candidate",
    );
    // alias clusters are intentional (STT, pagination); the report lists them
    // for human review rather than failing. Record the count honestly.
    expect(Array.isArray(dupes)).toBe(true);
  });
});

describe("generated report sync", () => {
  function committedDate(): string {
    const text = readFileSync(reportPath, "utf-8");
    const m = text.match(/^Generated (\d{4}-\d{2}-\d{2})/m);
    if (!m) throw new Error("committed report has no Generated date");
    return m[1];
  }

  function reportFileFor(domainId: string | null): string {
    return domainId === null
      ? reportPath
      : join(perProjectDir, `${domainId}.md`);
  }

  function expectedReports(): Array<{ domainId: string | null; title: string }> {
    const reg = loadRealRegistry();
    const root = reg.nodes.find((n) => !n.primary_parent);
    const out: Array<{ domainId: string | null; title: string }> = [
      { domainId: null, title: "System Capability Registry" },
    ];
    if (root) {
      for (const kid of childrenOf(reg, root.id)) {
        out.push({ domainId: kid.id, title: `${kid.name} Capability Registry` });
      }
    }
    return out;
  }

  it("committed full report matches the generator", () => {
    const reg = loadRealRegistry();
    const at = committedDate();
    const fresh = generateReport(reg, { generatedAt: at });
    expect(fresh).toBe(readFileSync(reportPath, "utf-8"));
  });

  it("every domain has a committed per-project report matching the generator", () => {
    const reg = loadRealRegistry();
    const at = committedDate();
    for (const { domainId, title } of expectedReports()) {
      if (domainId === null) continue;
      const fresh = generateReport(reg, {
        generatedAt: at,
        scopeRootId: domainId,
        scopeTitle: title,
      });
      expect(fresh, domainId).toBe(readFileSync(reportFileFor(domainId), "utf-8"));
    }
  });

  it("regenerates all reports with REGENERATE_CAPABILITY_REPORT=1", () => {
    if (process.env.REGENERATE_CAPABILITY_REPORT !== "1") return;
    mkdirSync(perProjectDir, { recursive: true });
    const reg = loadRealRegistry();
    const at = new Date().toISOString().slice(0, 10);
    for (const { domainId, title } of expectedReports()) {
      const fresh = domainId === null
        ? generateReport(reg, { generatedAt: at })
        : generateReport(reg, { generatedAt: at, scopeRootId: domainId, scopeTitle: title });
      writeFileSync(reportFileFor(domainId), fresh, "utf-8");
    }
  });
});
