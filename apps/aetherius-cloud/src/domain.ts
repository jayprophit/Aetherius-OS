import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Deployment {
  id: string;
  name: string;
  provider: string;
  region: string;
}

export interface CloudOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class CloudService {
  private readonly deployments = new Map<string, Deployment>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: CloudOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  deploy(name: string, provider: string, region: string): Deployment {
    const deployment: Deployment = { id: newId("deploy"), name, provider, region };
    this.deployments.set(deployment.id, deployment);
    this.ledger.append({ type: "cloud.deployed", actor: "cloud", subject: deployment.id });
    return deployment;
  }

  list(): Deployment[] {
    return Array.from(this.deployments.values());
  }
}
