import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface DataFlow {
  id: string;
  name: string;
  source: string;
  target: string;
  transform: string;
}

export interface DataFlowsOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class DataFlows {
  private readonly flows = new Map<string, DataFlow>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: DataFlowsOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(name: string, source: string, target: string, transform: string): DataFlow {
    const flow: DataFlow = { id: newId("flow"), name, source, target, transform };
    this.flows.set(flow.id, flow);
    this.ledger.append({ type: "data-flows.created", actor: "data-flows", subject: flow.id });
    return flow;
  }

  list(): DataFlow[] {
    return Array.from(this.flows.values());
  }
}
