import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Container {
  id: string;
  image: string;
  status: "running" | "stopped" | "paused";
}

export interface ComputeOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class ComputeService {
  private readonly containers = new Map<string, Container>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: ComputeOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  run(image: string): Container {
    const container: Container = { id: newId("container"), image, status: "running" };
    this.containers.set(container.id, container);
    this.ledger.append({ type: "compute.started", actor: "compute", subject: container.id });
    return container;
  }

  list(): Container[] {
    return Array.from(this.containers.values());
  }
}
