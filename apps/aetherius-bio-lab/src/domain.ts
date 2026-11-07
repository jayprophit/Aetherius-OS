import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Experiment {
  id: string;
  name: string;
  modality: "microscopy" | "sequencing" | "imaging";
  sampleCount: number;
}

export interface BioLabOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class BioLab {
  private readonly experiments = new Map<string, Experiment>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: BioLabOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  run(name: string, modality: Experiment["modality"], sampleCount: number): Experiment {
    const experiment: Experiment = { id: newId("experiment"), name, modality, sampleCount };
    this.experiments.set(experiment.id, experiment);
    this.ledger.append({ type: "bio-lab.ran", actor: "bio-lab", subject: experiment.id });
    return experiment;
  }

  list(): Experiment[] {
    return Array.from(this.experiments.values());
  }
}
