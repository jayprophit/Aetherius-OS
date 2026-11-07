import { describe, it } from "node:test";
import assert from "node:assert";
import { NodeGraph } from "../src/domain.ts";

describe("NodeGraph", () => {
  it("adds nodes and connects them", () => {
    const graph = new NodeGraph();
    const nodeA = graph.addNode("input", [], ["value"]);
    const nodeB = graph.addNode("output", ["value"], []);
    const edge = graph.connect(nodeA.id, nodeB.id);
    assert.equal(edge.from, nodeA.id);
    assert.equal(graph.listNodes().length, 2);
  });
});
