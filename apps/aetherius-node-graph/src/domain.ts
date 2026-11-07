import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Node {
  id: string;
  type: string;
  inputs: string[];
  outputs: string[];
}

export interface Edge {
  id: string;
  from: string;
  to: string;
}

export interface NodeGraphOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class NodeGraph {
  private readonly nodes = new Map<string, Node>();
  private readonly edges = new Map<string, Edge>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: NodeGraphOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addNode(type: string, inputs: string[], outputs: string[]): Node {
    const node: Node = { id: newId("node"), type, inputs, outputs };
    this.nodes.set(node.id, node);
    this.ledger.append({ type: "node-graph.added", actor: "node-graph", subject: node.id });
    return node;
  }

  connect(from: string, to: string): Edge {
    const edge: Edge = { id: newId("edge"), from, to };
    this.edges.set(edge.id, edge);
    this.ledger.append({ type: "node-graph.connected", actor: "node-graph", subject: edge.id });
    return edge;
  }

  listNodes(): Node[] {
    return Array.from(this.nodes.values());
  }
}
