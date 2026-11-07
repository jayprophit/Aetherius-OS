import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Experiment {
  id: string;
  name: string;
  dataset: string;
  metric: string;
}

export interface MlOpsOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class MlOps {
  private readonly experiments = new Map<string, Experiment>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: MlOpsOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  run(name: string, dataset: string, metric: string): Experiment {
    const experiment: Experiment = { id: newId("experiment"), name, dataset, metric };
    this.experiments.set(experiment.id, experiment);
    this.ledger.append({ type: "ml-ops.ran", actor: "ml-ops", subject: experiment.id });
    return experiment;
  }

  list(): Experiment[] {
    return Array.from(this.experiments.values());
  }
}
