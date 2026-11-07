import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Visual {
  id: string;
  title: string;
  kind: "plot" | "volume" | "mesh";
}

export interface ScientificVisualsOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class ScientificVisuals {
  private readonly visuals = new Map<string, Visual>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: ScientificVisualsOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(title: string, kind: Visual["kind"]): Visual {
    const visual: Visual = { id: newId("visual"), title, kind };
    this.visuals.set(visual.id, visual);
    this.ledger.append({ type: "scientific-visuals.created", actor: "scientific-visuals", subject: visual.id });
    return visual;
  }

  list(): Visual[] {
    return Array.from(this.visuals.values());
  }
}
