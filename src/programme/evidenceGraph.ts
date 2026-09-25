/**
 * REQ-p16-evidence-graph: cross-system evidence graph (read model).
 *
 * Unified join over task/workflow/step/model/policy/action/
 * verification/test/artifact/commit/evidence ids. Programme depgraph
 * (system dependencies) and memory graphs (associations) are
 * wrong-scope neighbours; this graph joins per-system identifiers so a
 * completion claim can be traced to its evidence across systems.
 *
 * Read model only: nodes and edges are recorded facts with provenance.
 * No execution, no authority, no scoring. Deterministic throughout.
 */

export type EvidenceNodeKind =
  | "task"
  | "workflow"
  | "step"
  | "model"
  | "policy"
  | "action"
  | "verification"
  | "test"
  | "artifact"
  | "commit"
  | "evidence";

export const NODE_KINDS: readonly EvidenceNodeKind[] = [
  "task",
  "workflow",
  "step",
  "model",
  "policy",
  "action",
  "verification",
  "test",
  "artifact",
  "commit",
  "evidence",
];

export type EvidenceRelation =
  | "CHILD_OF"
  | "PRODUCED_BY"
  | "VERIFIED_BY"
  | "EVIDENCE_FOR"
  | "DECIDED_BY"
  | "EXECUTED_BY"
  | "TESTED_BY";

export const RELATIONS: readonly EvidenceRelation[] = [
  "CHILD_OF",
  "PRODUCED_BY",
  "VERIFIED_BY",
  "EVIDENCE_FOR",
  "DECIDED_BY",
  "EXECUTED_BY",
  "TESTED_BY",
];

export interface EvidenceNode {
  kind: EvidenceNodeKind;
  id: string;
}

export interface EvidenceEdge {
  from: EvidenceNode;
  to: EvidenceNode;
  relation: EvidenceRelation;
  provenance: string;
}

export type GraphProblem =
  | "node-kind"
  | "node-id"
  | "relation"
  | "provenance"
  | "self-loop";

function key(node: EvidenceNode): string {
  return `${node.kind}:${node.id}`;
}

function validNode(node: EvidenceNode, problems: GraphProblem[], code: GraphProblem): boolean {
  if (!NODE_KINDS.includes(node?.kind)) {
    problems.push("node-kind");
    return false;
  }
  if (typeof node?.id !== "string" || !node.id.trim()) {
    problems.push(code);
    return false;
  }
  return true;
}

/** Validate an edge. Empty problems = recordable. */
export function validateEdge(edge: EvidenceEdge): GraphProblem[] {
  const problems: GraphProblem[] = [];
  const fromOk = validNode(edge.from, problems, "node-id");
  const toOk = validNode(edge.to, problems, "node-id");
  if (!RELATIONS.includes(edge.relation)) problems.push("relation");
  if (typeof edge.provenance !== "string" || !edge.provenance.trim()) problems.push("provenance");
  if (fromOk && toOk && key(edge.from) === key(edge.to)) problems.push("self-loop");
  return [...new Set(problems)].sort() as GraphProblem[];
}

export class EvidenceGraph {
  private readonly edges = new Map<string, EvidenceEdge>();

  private edgeKey(edge: EvidenceEdge): string {
    return `${key(edge.from)}|${edge.relation}|${key(edge.to)}`;
  }

  /** Record a fact. Idempotent for identical edges; conflicts impossible (facts carry provenance). */
  record(edge: EvidenceEdge): void {
    const problems = validateEdge(edge);
    if (problems.length > 0) throw new Error(`invalid evidence edge: ${problems.join(",")}`);
    const stored: EvidenceEdge = JSON.parse(JSON.stringify(edge)) as EvidenceEdge;
    this.edges.set(this.edgeKey(stored), stored);
  }

  size(): number {
    return this.edges.size;
  }

  /** Direct neighbours of a node (both directions), deterministically ordered. */
  neighbors(kind: EvidenceNodeKind, id: string): EvidenceEdge[] {
    const target = `${kind}:${id}`;
    return [...this.edges.values()]
      .filter((e) => key(e.from) === target || key(e.to) === target)
      .sort((a, b) => (this.edgeKey(a) < this.edgeKey(b) ? -1 : 1));
  }

  /** Transitive closure from a node (bounded BFS, cycle-safe, deterministic). */
  related(kind: EvidenceNodeKind, id: string, maxDepth = 10): string[] {
    if (!Number.isInteger(maxDepth) || maxDepth < 1) throw new Error("maxDepth must be a positive integer");
    const start = `${kind}:${id}`;
    const seen = new Set<string>([start]);
    let frontier = [start];
    for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
      const next: string[] = [];
      for (const node of frontier) {
        const adjacent = [...this.edges.values()]
          .filter((e) => key(e.from) === node || key(e.to) === node)
          .flatMap((e) => [key(e.from), key(e.to)])
          .filter((k) => !seen.has(k))
          .sort();
        for (const k of adjacent) {
          seen.add(k);
          next.push(k);
        }
      }
      frontier = next;
    }
    seen.delete(start);
    return [...seen].sort();
  }

  /** Shortest path between nodes (BFS, deterministic). Empty when unconnected. */
  path(from: EvidenceNode, to: EvidenceNode): string[] {
    const start = key(from);
    const goal = key(to);
    if (start === goal) return [start];
    const prev = new Map<string, string>();
    const seen = new Set<string>([start]);
    const queue = [start];
    while (queue.length > 0) {
      const node = queue.shift()!;
      const adjacent = [...this.edges.values()]
        .filter((e) => key(e.from) === node || key(e.to) === node)
        .flatMap((e) => [key(e.from), key(e.to)])
        .filter((k) => !seen.has(k))
        .sort();
      for (const next of adjacent) {
        if (seen.has(next)) continue;
        seen.add(next);
        prev.set(next, node);
        if (next === goal) {
          const path = [goal];
          let cursor = goal;
          while (cursor !== start) {
            cursor = prev.get(cursor)!;
            path.unshift(cursor);
          }
          return path;
        }
        queue.push(next);
      }
    }
    return [];
  }
}
