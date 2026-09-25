import { describe, expect, it } from "vitest";
import { EvidenceGraph, validateEdge } from "./evidenceGraph";
import type { EvidenceEdge } from "./evidenceGraph";

function edge(from: string, relation: EvidenceEdge["relation"], to: string, provenance = "fixture"): EvidenceEdge {
  const split = (ref: string): [EvidenceEdge["from"]["kind"], string] => {
    const index = ref.indexOf(":");
    return [ref.slice(0, index) as EvidenceEdge["from"]["kind"], ref.slice(index + 1)];
  };
  const [fromKind, fromId] = split(from);
  const [toKind, toId] = split(to);
  return { from: { kind: fromKind, id: fromId }, to: { kind: toKind, id: toId }, relation, provenance };
}

function taskGraph(): EvidenceGraph {
  const graph = new EvidenceGraph();
  graph.record(edge("task:t1", "CHILD_OF", "workflow:w1"));
  graph.record(edge("workflow:w1", "CHILD_OF", "step:w1:s1"));
  graph.record(edge("step:w1:s1", "EXECUTED_BY", "action:run-1:s1"));
  graph.record(edge("action:run-1:s1", "VERIFIED_BY", "verification:v1"));
  graph.record(edge("verification:v1", "EVIDENCE_FOR", "evidence:e1"));
  graph.record(edge("evidence:e1", "EVIDENCE_FOR", "artifact:report.md"));
  graph.record(edge("step:w1:s1", "TESTED_BY", "test:test-auth"));
  graph.record(edge("action:run-1:s1", "DECIDED_BY", "policy:pol-1"));
  graph.record(edge("workflow:w1", "PRODUCED_BY", "model:genesis-prime"));
  graph.record(edge("artifact:report.md", "PRODUCED_BY", "commit:abc123"));
  return graph;
}

describe("evidence graph", () => {
  it("joins cross-system ids from task to evidence", () => {
    const graph = taskGraph();
    expect(graph.size()).toBe(10);
    const path = graph.path({ kind: "task", id: "t1" }, { kind: "evidence", id: "e1" });
    expect(path).toEqual([
      "task:t1",
      "workflow:w1",
      "step:w1:s1",
      "action:run-1:s1",
      "verification:v1",
      "evidence:e1",
    ]);
  });

  it("answers neighbours and transitive closure deterministically", () => {
    const graph = taskGraph();
    const neighbours = graph.neighbors("step", "w1:s1").map((e) => `${e.from.kind}:${e.from.id}|${e.relation}|${e.to.kind}:${e.to.id}`);
    expect(neighbours).toContain("step:w1:s1|EXECUTED_BY|action:run-1:s1");
    expect(neighbours).toContain("step:w1:s1|TESTED_BY|test:test-auth");
    const related = graph.related("task", "t1");
    expect(related).toContain("evidence:e1");
    expect(related).toContain("commit:abc123");
    expect(related).toContain("policy:pol-1");
    expect(related).toEqual([...related].sort());
    expect(graph.related("task", "ghost")).toEqual([]);
    expect(graph.path({ kind: "task", id: "t1" }, { kind: "evidence", id: "ghost" })).toEqual([]);
  });

  it("is idempotent for identical facts", () => {
    const graph = new EvidenceGraph();
    graph.record(edge("task:t1", "CHILD_OF", "workflow:w1"));
    graph.record(edge("task:t1", "CHILD_OF", "workflow:w1"));
    expect(graph.size()).toBe(1);
  });

  it("rejects malformed edges", () => {
    expect(() => new EvidenceGraph().record(edge("task:t1", "LOVES" as never, "workflow:w1"))).toThrowError(/relation/);
    expect(() => new EvidenceGraph().record(edge("task: ", "CHILD_OF", "workflow:w1"))).toThrowError(/node-id/);
    expect(() => new EvidenceGraph().record(edge("task:t1", "CHILD_OF", "task:t1"))).toThrowError(/self-loop/);
    expect(() => new EvidenceGraph().record({ ...edge("task:t1", "CHILD_OF", "workflow:w1"), provenance: " " })).toThrowError(
      /provenance/,
    );
    expect(validateEdge(edge("bogus:t1", "CHILD_OF", "workflow:w1"))).toContain("node-kind");
  });

  it("handles cycles without hanging", () => {
    const graph = new EvidenceGraph();
    graph.record(edge("task:a", "CHILD_OF", "workflow:b"));
    graph.record(edge("workflow:b", "EVIDENCE_FOR", "task:a"));
    expect(graph.related("task", "a")).toEqual(["workflow:b"]);
    expect(graph.path({ kind: "task", id: "a" }, { kind: "workflow", id: "b" })).toEqual(["task:a", "workflow:b"]);
  });
});
