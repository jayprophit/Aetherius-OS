import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface SpatialObject {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
}

export interface SpatialOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class SpatialService {
  private readonly objects = new Map<string, SpatialObject>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: SpatialOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(position: { x: number; y: number; z: number }): SpatialObject {
    const obj: SpatialObject = {
      id: newId("spatial"),
      position,
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
    };
    this.objects.set(obj.id, obj);
    this.ledger.append({ type: "spatial.created", actor: "spatial", subject: obj.id });
    return obj;
  }

  list(): SpatialObject[] {
    return Array.from(this.objects.values());
  }
}
