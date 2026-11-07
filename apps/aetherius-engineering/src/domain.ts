import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Part {
  id: string;
  name: string;
  material: string;
  quantity: number;
}

export interface EngineeringOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class EngineeringService {
  private readonly parts = new Map<string, Part>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: EngineeringOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addPart(part: Omit<Part, "id">): Part {
    const p: Part = { ...part, id: newId("part") };
    this.parts.set(p.id, p);
    this.ledger.append({ type: "engineering.part.added", actor: "engineering", subject: p.id });
    return p;
  }

  listParts(): Part[] {
    return Array.from(this.parts.values());
  }
}
