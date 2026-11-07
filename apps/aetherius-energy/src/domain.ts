import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface EnergyModel {
  id: string;
  building: string;
  consumption: number;
  source: string;
}

export interface EnergyOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Energy {
  private readonly models = new Map<string, EnergyModel>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: EnergyOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  model(building: string, consumption: number, source: string): EnergyModel {
    const model: EnergyModel = { id: newId("energy"), building, consumption, source };
    this.models.set(model.id, model);
    this.ledger.append({ type: "energy.modelled", actor: "energy", subject: model.id });
    return model;
  }

  list(): EnergyModel[] {
    return Array.from(this.models.values());
  }
}
