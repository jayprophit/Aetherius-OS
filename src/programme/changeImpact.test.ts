import { describe, expect, it } from "vitest";
import { assertSafePath } from "../runners/sync";
import type { TouchEstimate } from "../workers/touch";
import {
  DEFAULT_MAX_DEPTH,
  IMPACT_RELATIONS,
  buildChangeImpactGraph,
  queryChangeImpact,
} from "./changeImpact";
import * as changeImpact from "./changeImpact";
import type { ChangeImpactGraph, DependencyEdge } from "./changeImpact";

/**
 * Dimension-specific fixtures. Every edge declares its own from/to/relation/
 * reason explicitly, so no edge can be inherited from a shared default and a
 * name-similar pair can never acquire an edge it did not declare.
 */
function edge(from: string, to: string, relation: DependencyEdge["relation"] = "IMPORTS"): DependencyEdge {
  return { from, to, relation, reason: `${from} imports ${to}` };
}

function graph(over: Partial<Parameters<typeof buildChangeImpactGraph>[0]> = {}): ChangeImpactGraph {
  return buildChangeImpactGraph({ nodes: ["src/a.ts", "src/b.ts", "src/c.ts"], edges: [], ...over });
}

function touch(paths: string[], over: Partial<TouchEstimate> = {}): TouchEstimate {
  return { paths: [...paths], sources: [], unknown: [], invalid: [], ...over };
}

describe("relation vocabulary is small and precise", () => {
  it("declares only four relation classes", () => {
    expect([...IMPACT_RELATIONS]).toEqual(["IMPORTS", "RE_EXPORTS", "REFERENCES", "DECLARED"]);
  });

  it("rejects an invented relation type and a missing reason", () => {
    expect(() => buildChangeImpactGraph({ nodes: ["a.ts"], edges: [{ from: "a.ts", to: "b.ts", relation: "CALLS" as never, reason: "r" }] })).toThrowError(
      /edge-relation/,
    );
    // A reviewer must be able to answer WHY a path is impacted.
    expect(() => buildChangeImpactGraph({ nodes: ["a.ts"], edges: [{ from: "a.ts", to: "b.ts", relation: "IMPORTS", reason: "" }] })).toThrowError(
      /edge-reason/,
    );
  });

  it("rejects a trivial self-loop as a resolution artifact", () => {
    expect(() => buildChangeImpactGraph({ nodes: ["a.ts"], edges: [edge("a.ts", "a.ts")] })).toThrowError(/self-edge/);
  });

  it("rejects unsafe paths using the shared sync.ts guard", () => {
    expect(() => buildChangeImpactGraph({ nodes: ["../escape.ts"], edges: [] })).toThrowError(/edge-path/);
    expect(() => buildChangeImpactGraph({ nodes: ["/etc/passwd"], edges: [] })).toThrowError(/edge-path/);
    expect(() => buildChangeImpactGraph({ nodes: ["a.ts"], edges: [edge("a.ts", "x/../../y.ts")] })).toThrowError(/edge-path/);
    // The guard is reused, not reimplemented, so a path it rejects is rejected here.
    expect(() => assertSafePath("../escape.ts")).toThrow();
  });

  it("rejects unrecognised keys rather than silently dropping them", () => {
    expect(() => buildChangeImpactGraph({ nodes: ["a.ts"], edges: [], fuzzy: true } as never)).toThrowError(/unknown-field/);
  });
});

describe("SIMILARITY IS NOT DEPENDENCY", () => {
  /**
   * The dedicated regression: three similarly named files with NO structural
   * edge between them must have no impact relation, and adding a real import
   * must produce one.
   */
  const SIMILAR = ["src/user.ts", "src/userService.ts", "src/userServiceHelper.ts"];

  it("creates no relation from name similarity alone", () => {
    const g = buildChangeImpactGraph({ nodes: SIMILAR, edges: [] });
    const result = queryChangeImpact({ graph: g, changedPaths: ["src/user.ts"] });
    // Only the changed path itself. No similar name is dragged in.
    expect(result.impacted.map((i) => i.path)).toEqual(["src/user.ts"]);
    expect(result.unresolved).toEqual([]);
  });

  it("creates a relation only once a real import is declared", () => {
    const g = buildChangeImpactGraph({
      nodes: SIMILAR,
      edges: [edge("src/userService.ts", "src/user.ts")],
    });
    const result = queryChangeImpact({ graph: g, changedPaths: ["src/user.ts"] });
    const impacted = result.impacted.map((i) => i.path).sort();
    expect(impacted).toEqual(["src/user.ts", "src/userService.ts"]);
    // The similarly named helper is still NOT related, because no edge exists.
    expect(impacted).not.toContain("src/userServiceHelper.ts");
  });

  it("does not relate files merely because they share a directory", () => {
    const g = buildChangeImpactGraph({ nodes: ["src/x/a.ts", "src/x/b.ts"], edges: [] });
    const result = queryChangeImpact({ graph: g, changedPaths: ["src/x/a.ts"] });
    expect(result.impacted).toHaveLength(1);
  });
});

describe("direction is explicit", () => {
  it("flows impact from an imported path to its importer, never the reverse", () => {
    const g = buildChangeImpactGraph({
      nodes: ["src/a.ts", "src/b.ts"],
      edges: [edge("src/a.ts", "src/b.ts")],
    });
    // a imports b, so a change to b affects a.
    const fromB = queryChangeImpact({ graph: g, changedPaths: ["src/b.ts"] });
    expect(fromB.impacted.map((i) => i.path).sort()).toEqual(["src/a.ts", "src/b.ts"]);
    // A change to a does not automatically affect b.
    const fromA = queryChangeImpact({ graph: g, changedPaths: ["src/a.ts"] });
    expect(fromA.impacted.map((i) => i.path)).toEqual(["src/a.ts"]);
  });

  it("marks depth 1 as direct and deeper nodes as transitive", () => {
    const g = buildChangeImpactGraph({
      nodes: ["src/a.ts", "src/b.ts", "src/c.ts"],
      edges: [edge("src/b.ts", "src/a.ts"), edge("src/c.ts", "src/b.ts")],
    });
    const result = queryChangeImpact({ graph: g, changedPaths: ["src/a.ts"] });
    const byPath = new Map(result.impacted.map((i) => [i.path, i]));
    expect(byPath.get("src/a.ts")!.depth).toBe(0);
    expect(byPath.get("src/a.ts")!.direct).toBe(false);
    expect(byPath.get("src/b.ts")!.depth).toBe(1);
    expect(byPath.get("src/b.ts")!.direct).toBe(true);
    expect(byPath.get("src/c.ts")!.depth).toBe(2);
    expect(byPath.get("src/c.ts")!.direct).toBe(false);
    expect(byPath.get("src/c.ts")!.via).toBe("src/b.ts");
  });

  it("keeps DIRECT IMPACT distinct from TRANSITIVE IMPACT", () => {
    const g = buildChangeImpactGraph({
      nodes: ["src/a.ts", "src/b.ts", "src/c.ts"],
      edges: [edge("src/b.ts", "src/a.ts"), edge("src/c.ts", "src/b.ts")],
    });
    const result = queryChangeImpact({ graph: g, changedPaths: ["src/a.ts"] });
    expect(result.impacted.filter((i) => i.direct).map((i) => i.path)).toEqual(["src/b.ts"]);
    expect(result.impacted.filter((i) => !i.direct && i.depth > 0).map((i) => i.path)).toEqual(["src/c.ts"]);
  });
});

describe("traversal is bounded and cycle-safe", () => {
  it("terminates on a cycle A -> B -> C -> A without duplicate explosion", () => {
    // b imports a, c imports b, a imports c: a genuine cycle.
    const g = buildChangeImpactGraph({
      nodes: ["src/a.ts", "src/b.ts", "src/c.ts"],
      edges: [edge("src/b.ts", "src/a.ts"), edge("src/c.ts", "src/b.ts"), edge("src/a.ts", "src/c.ts")],
    });
    const result = queryChangeImpact({ graph: g, changedPaths: ["src/a.ts"] });
    // Every node appears exactly once, despite the cycle.
    const paths = result.impacted.map((i) => i.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.sort()).toEqual(["src/a.ts", "src/b.ts", "src/c.ts"]);
  });

  it("honours maxDepth and marks the cut-off honestly by depth", () => {
    const g = buildChangeImpactGraph({
      nodes: ["src/a.ts", "src/b.ts", "src/c.ts"],
      edges: [edge("src/b.ts", "src/a.ts"), edge("src/c.ts", "src/b.ts")],
    });
    const result = queryChangeImpact({ graph: g, changedPaths: ["src/a.ts"], maxDepth: 1 });
    expect(result.maxDepth).toBe(1);
    expect(result.impacted.map((i) => i.path).sort()).toEqual(["src/a.ts", "src/b.ts"]);
    expect(DEFAULT_MAX_DEPTH).toBe(12);
  });

  it("rejects a non-positive maxDepth", () => {
    expect(() => queryChangeImpact({ graph: graph(), changedPaths: ["src/a.ts"], maxDepth: 0 })).toThrowError(/nodes/);
  });
});

describe("dedupe and determinism", () => {
  it("deduplicates an edge discovered through two routes but keeps distinct relations", () => {
    const g = buildChangeImpactGraph({
      nodes: ["src/a.ts", "src/b.ts"],
      edges: [edge("src/a.ts", "src/b.ts"), edge("src/a.ts", "src/b.ts"), edge("src/a.ts", "src/b.ts", "REFERENCES")],
    });
    const imports = g.edges.filter((e) => e.relation === "IMPORTS");
    expect(imports).toHaveLength(1);
    // A genuinely different relation type is NOT lost by dedupe.
    expect(g.edges.some((e) => e.relation === "REFERENCES")).toBe(true);
  });

  it("records every relation kind that reaches a node", () => {
    const g = buildChangeImpactGraph({
      nodes: ["src/a.ts", "src/b.ts", "src/c.ts"],
      edges: [edge("src/c.ts", "src/a.ts"), edge("src/c.ts", "src/a.ts", "REFERENCES")],
    });
    const result = queryChangeImpact({ graph: g, changedPaths: ["src/a.ts"] });
    const c = result.impacted.find((i) => i.path === "src/c.ts")!;
    expect(c.relations).toEqual(["IMPORTS", "REFERENCES"]);
  });

  it("orders deterministically from scrambled node and edge input", () => {
    const g = buildChangeImpactGraph({
      nodes: ["src/z.ts", "src/a.ts", "src/m.ts"],
      edges: [edge("src/z.ts", "src/a.ts"), edge("src/m.ts", "src/a.ts")],
    });
    expect(g.nodes).toEqual(["src/a.ts", "src/m.ts", "src/z.ts"]);
    const result = queryChangeImpact({ graph: g, changedPaths: ["src/a.ts"] });
    expect(result.impacted.map((i) => i.path)).toEqual(["src/a.ts", "src/m.ts", "src/z.ts"]);
  });

  it("produces identical output for identical input", () => {
    const build = () =>
      queryChangeImpact({
        graph: buildChangeImpactGraph({
          nodes: ["src/a.ts", "src/b.ts"],
          edges: [edge("src/b.ts", "src/a.ts")],
        }),
        changedPaths: ["src/a.ts"],
      });
    expect(JSON.stringify(build())).toBe(JSON.stringify(build()));
  });
});

describe("history weighting is not a risk score", () => {
  it("reports UNKNOWN history when none is supplied, never zero", () => {
    const g = buildChangeImpactGraph({
      nodes: ["src/a.ts", "src/b.ts"],
      edges: [edge("src/b.ts", "src/a.ts")],
    });
    const result = queryChangeImpact({ graph: g, changedPaths: ["src/a.ts"] });
    for (const node of result.impacted) {
      expect(node.historyState).toBe("UNKNOWN");
      expect(node.changeCount).toBeNull();
      expect(node.weight).toBeNull();
    }
  });

  it("observes history counts when supplied with a source", () => {
    const g = buildChangeImpactGraph({
      nodes: ["src/a.ts", "src/b.ts"],
      edges: [edge("src/b.ts", "src/a.ts")],
      history: [
        { path: "src/a.ts", changeCount: 3 },
        { path: "src/b.ts", changeCount: 12 },
      ],
      historySource: "git-log:2026",
    });
    const result = queryChangeImpact({ graph: g, changedPaths: ["src/a.ts"] });
    const b = result.impacted.find((i) => i.path === "src/b.ts")!;
    expect(b.changeCount).toBe(12);
    expect(b.historyState).toBe("OBSERVED");
    expect(b.weight).toBe(12);
  });

  it("treats a path absent from supplied history as UNKNOWN, not as zero changes", () => {
    const g = buildChangeImpactGraph({
      nodes: ["src/a.ts", "src/b.ts"],
      edges: [edge("src/b.ts", "src/a.ts")],
      history: [{ path: "src/a.ts", changeCount: 3 }],
      historySource: "git-log:2026",
    });
    const result = queryChangeImpact({ graph: g, changedPaths: ["src/a.ts"] });
    const b = result.impacted.find((i) => i.path === "src/b.ts")!;
    // Absent history is unknown. Zero changes is a measured fact, not a default.
    expect(b.changeCount).toBeNull();
    expect(b.historyState).toBe("UNKNOWN");
  });

  it("requires a source for supplied counts and rejects negative counts", () => {
    expect(() => buildChangeImpactGraph({ nodes: ["a.ts"], edges: [], history: [{ path: "a.ts", changeCount: 1 }] })).toThrowError(
      /history-source/,
    );
    expect(() => buildChangeImpactGraph({ nodes: ["a.ts"], edges: [], history: [{ path: "a.ts", changeCount: -1 }], historySource: "s" })).toThrowError(
      /history/,
    );
  });

  it("produces no risk, quality or review verdict", () => {
    const result = queryChangeImpact({
      graph: buildChangeImpactGraph({ nodes: ["src/a.ts", "src/b.ts"], edges: [edge("src/b.ts", "src/a.ts")] }),
      changedPaths: ["src/a.ts"],
    });
    expect(result.noVerdict).toBe(true);
    for (const banned of ["risk", "riskScore", "quality", "score", "verdict", "review", "severity", "rating"]) {
      expect(Object.keys(result)).not.toContain(banned);
    }
  });
});

describe("the join consumes TouchEstimate and never re-estimates", () => {
  it("takes changed paths from the estimate and carries its unknowns through", () => {
    const g = buildChangeImpactGraph({
      nodes: ["src/a.ts", "src/b.ts"],
      edges: [edge("src/b.ts", "src/a.ts")],
    });
    const result = queryChangeImpact({
      graph: g,
      touch: touch(["src/a.ts"], { unknown: ["could not resolve skill ref"], invalid: ["../escape.ts"] }),
    });
    expect(result.changedPaths).toEqual(["src/a.ts"]);
    // The estimator's own uncertainty survives the join instead of vanishing.
    expect(result.touchUnknown).toEqual(["could not resolve skill ref"]);
    expect(result.touchInvalid).toEqual(["../escape.ts"]);
  });

  it("rejects a malformed TouchEstimate rather than tolerating it", () => {
    const g = graph();
    expect(() => queryChangeImpact({ graph: g, touch: { paths: "nope" } as never })).toThrowError(/touch/);
  });

  it("requires changed paths from somewhere", () => {
    expect(() => queryChangeImpact({ graph: graph() })).toThrowError(/changed-paths/);
  });

  it("does not export an estimator or reimplement estimation", () => {
    const names = Object.keys(changeImpact);
    expect(names).not.toContain("estimateTouchSet");
    expect(names).not.toContain("TouchEstimateInput");
  });
});

describe("unknown impact stays unknown", () => {
  it("reports a changed path absent from the graph as unresolved, not as unaffected", () => {
    const g = buildChangeImpactGraph({ nodes: ["src/a.ts"], edges: [] });
    const result = queryChangeImpact({ graph: g, changedPaths: ["src/ghost.ts"] });
    expect(result.unresolved).toHaveLength(1);
    expect(result.unresolved[0]!.path).toBe("src/ghost.ts");
    expect(result.unresolved[0]!.reason).toContain("NOT proven isolation");
    // It is not reported as impacted either.
    expect(result.impacted).toEqual([]);
  });

  it("handles a deleted path, because impact never checks current existence", () => {
    const g = buildChangeImpactGraph({
      nodes: ["src/gone.ts", "src/consumer.ts"],
      edges: [edge("src/consumer.ts", "src/gone.ts")],
    });
    const result = queryChangeImpact({ graph: g, changedPaths: ["src/gone.ts"] });
    // The deleted path still carries its consumers.
    expect(result.impacted.map((i) => i.path).sort()).toEqual(["src/consumer.ts", "src/gone.ts"]);
  });

  it("handles a rename as both the old and the new path", () => {
    const g = buildChangeImpactGraph({
      nodes: ["src/new.ts", "src/consumer.ts"],
      edges: [edge("src/consumer.ts", "src/new.ts")],
    });
    const result = queryChangeImpact({ graph: g, changedPaths: ["src/old.ts", "src/new.ts"] });
    expect(result.unresolved.map((u) => u.path)).toEqual(["src/old.ts"]);
    expect(result.impacted.map((i) => i.path).sort()).toEqual(["src/consumer.ts", "src/new.ts"]);
  });
});

describe("graph construction versus query stay separate", () => {
  it("is in-memory and caller-constructed, with no durable store or registry", () => {
    const names = Object.keys(changeImpact);
    for (const banned of ["store", "registry", "database", "persist", "save", "cache", "server", "service"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("reuses the shared path guard rather than adding a traversal implementation", () => {
    const names = Object.keys(changeImpact);
    expect(names).not.toContain("assertSafePath");
  });

  it("does not depend on the evidence graph, touch estimator or review pack", () => {
    const names = Object.keys(changeImpact);
    expect(names).not.toContain("EvidenceGraph");
    expect(names).not.toContain("buildReviewContextPack");
    expect(names).not.toContain("compareHarness");
  });
});
