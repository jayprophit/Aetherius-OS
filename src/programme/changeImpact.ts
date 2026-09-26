import { assertSafePath } from "../runners/sync";
import type { TouchEstimate } from "../workers/touch";

/**
 * REQ-p20-change-impact: change impact graph over touch sets.
 *
 * The registered requirement is the scope authority:
 *
 *   "Dependency-graph join with transitive impact and history weighting over
 *    TouchEstimate inputs; consumes touch.ts, never re-implements estimation."
 *
 * So this unit is a JOIN, not an estimator and not a source-code parser: it
 * takes a dependency graph plus a `TouchEstimate` and answers "given these
 * changed paths, which other paths are affected, how directly, and how often
 * have they changed before?"
 *
 * `TouchEstimate` is CONSUMED, never recomputed. `estimateTouchSet` is not
 * called, wrapped or reimplemented here:
 *
 *   TOUCH PREDICTION   != CODE DEPENDENCY
 *   CHANGE IMPACT      != EXPECTED TOUCH SET
 *   CHANGE IMPACT      != TEST IMPACT
 *   CHANGE IMPACT      != EVIDENCE GRAPH
 *   CHANGE IMPACT      != SYSTEM DEPENDENCY GRAPH
 *   CHANGE IMPACT      != REVIEW VERDICT
 *
 * DIRECTION. An edge means "from imports to". So a change to `to` may affect
 * `from`, and impact traversal therefore walks edges BACKWARDS from a changed
 * path to its importers. A change to an importer does not automatically
 * affect what it imports.
 *
 *   IF A IMPORTS B, A CHANGE TO B MAY AFFECT A
 *   A CHANGE TO A DOES NOT AUTOMATICALLY AFFECT B
 *
 * NO NAME-SIMILARITY INFERENCE. An edge exists only when a caller supplies
 * explicit structural evidence for it. Filenames, symbol names, shared
 * prefixes, shared directories and concept overlap never create an edge:
 *
 *   SIMILARITY  != DEPENDENCY
 *   SAME NAME   != DEPENDENCY
 *   SAME DIRECTORY != DEPENDENCY
 *   IMPORTED BY != NECESSARILY BEHAVIOURALLY AFFECTED
 */

/** A deliberately small set of precise relation classes. */
export const IMPACT_RELATIONS = ["IMPORTS", "RE_EXPORTS", "REFERENCES", "DECLARED"] as const;
export type ImpactRelation = (typeof IMPACT_RELATIONS)[number];

export interface DependencyEdge {
  /** The importing path. */
  from: string;
  /** The imported path. */
  to: string;
  relation: ImpactRelation;
  /** WHY this edge exists. A reviewer must be able to answer that. */
  reason: string;
}

export interface HistoryEntry {
  path: string;
  /** Times this path has changed, per the supplied history source. */
  changeCount: number;
}

export interface ChangeImpactGraph {
  /** Every path the graph knows about. */
  nodes: string[];
  edges: DependencyEdge[];
  /**
   * Optional caller-supplied change history. ABSENT history is not zero
   * history: an entry with no history reports historyState UNKNOWN and a null
   * count, never 0.
   */
  history: HistoryEntry[];
  /** Provenance for the history counts. Required when history is supplied. */
  historySource?: string;
  provenance: string;
}

export type ImpactProblem =
  | "nodes"
  | "edges"
  | "edge-path"
  | "edge-relation"
  | "edge-reason"
  | "self-edge"
  | "history"
  | "history-source"
  | "changed-paths"
  | "touch"
  | "unknown-field";

const IMPACT_PROVENANCE = "p20-change-impact";
const ALLOWED_GRAPH_KEYS: ReadonlySet<string> = new Set([
  "nodes",
  "edges",
  "history",
  "historySource",
  "provenance",
]);

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Real comparator (never a factory): a factory passed to sort yields NaN. */
function compareEdges(a: DependencyEdge, b: DependencyEdge): number {
  return (
    compareStrings(a.from, b.from) ||
    compareStrings(a.to, b.to) ||
    compareStrings(a.relation, b.relation) ||
    compareStrings(a.reason, b.reason)
  );
}

function safePath(path: string): boolean {
  try {
    assertSafePath(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Build the graph. Edges are deduplicated by canonical identity
 * (from, to, relation, reason) and sorted, so a relation discovered through
 * two routes cannot produce unstable duplicates while a genuinely distinct
 * relation type is preserved.
 */
export function buildChangeImpactGraph(input: {
  nodes: readonly string[];
  edges: readonly DependencyEdge[];
  history?: readonly HistoryEntry[];
  historySource?: string;
  provenance?: string;
}): ChangeImpactGraph {
  const problems: ImpactProblem[] = [];
  for (const key of Object.keys(input ?? {})) {
    if (!ALLOWED_GRAPH_KEYS.has(key)) problems.push("unknown-field");
  }
  if (!Array.isArray(input?.nodes) || input.nodes.length === 0) problems.push("nodes");
  else if (input.nodes.some((n) => !safePath(n))) problems.push("edge-path");
  if (!Array.isArray(input?.edges)) problems.push("edges");
  else {
    for (const edge of input.edges) {
      if (!nonEmpty(edge?.from) || !nonEmpty(edge?.to) || !safePath(edge.from) || !safePath(edge.to)) {
        problems.push("edge-path");
      }
      if (!IMPACT_RELATIONS.includes(edge?.relation)) problems.push("edge-relation");
      if (!nonEmpty(edge?.reason)) problems.push("edge-reason");
      // A trivial self-loop is a resolution artifact, not a real relation.
      if (edge?.from === edge?.to) problems.push("self-edge");
    }
  }
  if (input?.history !== undefined) {
    if (!Array.isArray(input.history)) problems.push("history");
    else {
      for (const entry of input.history) {
        if (!nonEmpty(entry?.path) || !safePath(entry.path)) problems.push("history");
        if (!Number.isInteger(entry?.changeCount) || (entry?.changeCount as number) < 0) problems.push("history");
      }
    }
    // Counts with no source are not observations.
    if (input.history.length > 0 && !nonEmpty(input?.historySource)) problems.push("history-source");
  }
  if (problems.length > 0) {
    throw new Error(`invalid change impact graph: ${[...new Set(problems)].sort().join(",")}`);
  }

  return {
    nodes: [...new Set(input.nodes)].sort(compareStrings),
    edges: [...new Map(input.edges.map((e) => [JSON.stringify(e), e])).values()].sort(compareEdges),
    history: [...(input.history ?? [])]
      .sort((a, b) => compareStrings(a.path, b.path) || a.changeCount - b.changeCount)
      .filter((entry, i, all) => all.findIndex((e) => e.path === entry.path) === i),
    ...(input.historySource === undefined ? {} : { historySource: input.historySource }),
    provenance: input.provenance ?? IMPACT_PROVENANCE,
  };
}

export interface ImpactedNode {
  path: string;
  /** True when this path directly imports a changed path. */
  direct: boolean;
  /** 0 for a changed path itself, 1 for a direct importer, and so on. */
  depth: number;
  /** The immediate dependency that leads here. Absent at depth 0. */
  via?: string;
  /** Which relation kinds connect it, sorted. */
  relations: ImpactRelation[];
  /** Null when no history was supplied. Absent history is NOT zero. */
  changeCount: number | null;
  historyState: "OBSERVED" | "UNKNOWN";
  /**
   * History-derived ordering weight. This is NOT a risk score, not a quality
   * score and not a review verdict: it exists so a frequently-changed
   * consumer is not buried below a never-touched one.
   */
  weight: number | null;
}

export interface UnresolvedPath {
  path: string;
  reason: string;
}

export interface ChangeImpactResult {
  changedPaths: string[];
  impacted: ImpactedNode[];
  /** Changed paths absent from the graph. Absence is not proven isolation. */
  unresolved: UnresolvedPath[];
  /** The estimator's own unknowns, carried through rather than discarded. */
  touchUnknown: string[];
  touchInvalid: string[];
  /** Bounded, cycle-safe traversal. */
  maxDepth: number;
  /** Always true: no risk, quality or review verdict is produced. */
  noVerdict: true;
  provenance: string;
}

/** Default traversal bound. Kept explicit so impact stays bounded. */
export const DEFAULT_MAX_DEPTH = 12;

/**
 * Join the graph with a `TouchEstimate` and compute impact.
 *
 * `touch` is CONSUMED. Its `paths` are the changed-path candidates and its
 * own `unknown`/`invalid` lists are carried through so the estimator's
 * uncertainty is not silently dropped by the join.
 *
 * `changedPaths` may be given directly instead, which is how deleted or
 * renamed paths are handled: impact never depends on a path still existing,
 * because existence is never checked.
 */
export function queryChangeImpact(input: {
  graph: ChangeImpactGraph;
  touch?: TouchEstimate;
  changedPaths?: readonly string[];
  maxDepth?: number;
  provenance?: string;
}): ChangeImpactResult {
  const problems: ImpactProblem[] = [];
  if (input?.graph === undefined) problems.push("nodes");
  if (input?.touch !== undefined) {
    if (!Array.isArray(input.touch.paths) || !Array.isArray(input.touch.unknown) || !Array.isArray(input.touch.invalid)) {
      problems.push("touch");
    }
  }
  if (input?.changedPaths !== undefined) {
    if (!Array.isArray(input.changedPaths) || input.changedPaths.some((p) => !nonEmpty(p))) problems.push("changed-paths");
  }
  if (input?.changedPaths === undefined && input?.touch === undefined) problems.push("changed-paths");
  const maxDepth = input?.maxDepth ?? DEFAULT_MAX_DEPTH;
  if (!Number.isInteger(maxDepth) || maxDepth < 1) problems.push("nodes");
  if (problems.length > 0) {
    throw new Error(`invalid change impact query: ${[...new Set(problems)].sort().join(",")}`);
  }

  const graph = input.graph;
  const known = new Set(graph.nodes);
  // Changed paths come from the estimator's own output when supplied.
  const changed = dedupePaths([
    ...(input.changedPaths ?? []),
    ...(input.touch?.paths ?? []),
  ]).filter((p) => safePath(p));

  const unresolved: UnresolvedPath[] = changed
    .filter((p) => !known.has(p))
    .map((p) => ({
      path: p,
      reason: "path is not present in the dependency graph; not-found is NOT proven isolation",
    }));

  const historyByPath = new Map<string, number>();
  for (const entry of graph.history) historyByPath.set(entry.path, entry.changeCount);
  const hasHistory = graph.history.length > 0;

  // Reverse adjacency: for each imported path, the importers that depend on
  // it. Impact flows from a changed path to whoever imports it.
  const importers = new Map<string, DependencyEdge[]>();
  for (const edge of graph.edges) {
    const list = importers.get(edge.to);
    if (list === undefined) importers.set(edge.to, [edge]);
    else list.push(edge);
  }

  const historyFor = (path: string): { changeCount: number | null; state: "OBSERVED" | "UNKNOWN" } => {
    if (!hasHistory) return { changeCount: null, state: "UNKNOWN" };
    const found = historyByPath.get(path);
    return found === undefined ? { changeCount: null, state: "UNKNOWN" } : { changeCount: found, state: "OBSERVED" };
  };

  const impacted: ImpactedNode[] = [];
  // Seed the visited set with the changed paths themselves, so a cycle that
  // routes back to a changed path cannot re-add it as an impacted node.
  const settled = new Set<string>(changed.filter((p) => known.has(p)));

  for (const path of changed) {
    if (known.has(path)) {
      const { changeCount, state } = historyFor(path);
      impacted.push({
        path,
        direct: false,
        depth: 0,
        relations: [],
        changeCount,
        historyState: state,
        weight: changeCount,
      });
    }
  }

  // Breadth-first, backwards along edges, with a visited set so a cycle
  // terminates instead of expanding forever.
  let frontier = changed.filter((p) => known.has(p));
  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth++) {
    const next: string[] = [];
    for (const target of frontier) {
      // Group incoming edges by importer, so every relation kind reaching
      // that importer from this target is collected rather than lost when
      // the second edge is skipped as already-settled.
      const byImporter = new Map<string, DependencyEdge[]>();
      for (const candidate of (importers.get(target) ?? []).sort(compareEdges)) {
        const list = byImporter.get(candidate.from);
        if (list === undefined) byImporter.set(candidate.from, [candidate]);
        else list.push(candidate);
      }
      for (const [from, incoming] of [...byImporter.entries()].sort((a, b) => compareStrings(a[0], b[0]))) {
        if (settled.has(from) || from === target) continue;
        settled.add(from);
        next.push(from);
        const { changeCount, state } = historyFor(from);
        impacted.push({
          path: from,
          direct: depth === 1,
          depth,
          via: target,
          relations: [...new Set(incoming.map((e) => e.relation))].sort(compareStrings),
          changeCount,
          historyState: state,
          weight: changeCount,
        });
      }
    }
    frontier = [...new Set(next)].sort(compareStrings);
  }

  return {
    changedPaths: changed,
    impacted: impacted.sort(
      (a, b) => a.depth - b.depth || compareStrings(a.path, b.path),
    ),
    unresolved: unresolved.sort((a, b) => compareStrings(a.path, b.path)),
    touchUnknown: [...(input.touch?.unknown ?? [])].sort(compareStrings),
    touchInvalid: [...(input.touch?.invalid ?? [])].sort(compareStrings),
    maxDepth,
    noVerdict: true,
    provenance: input.provenance ?? graph.provenance,
  };
}

function dedupePaths(paths: readonly string[]): string[] {
  return [...new Set(paths.map((p) => p.trim()))].filter((p) => p.length > 0);
}
