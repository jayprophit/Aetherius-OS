import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Observation {
  id: string;
  region: string;
  band: string;
  date: string;
}

export interface EarthLabOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class EarthLab {
  private readonly observations = new Map<string, Observation>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: EarthLabOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  observe(region: string, band: string, date: string): Observation {
    const observation: Observation = { id: newId("observation"), region, band, date };
    this.observations.set(observation.id, observation);
    this.ledger.append({ type: "earth-lab.observed", actor: "earth-lab", subject: observation.id });
    return observation;
  }

  list(): Observation[] {
    return Array.from(this.observations.values());
  }
}
