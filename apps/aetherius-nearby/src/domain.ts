import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Device {
  id: string;
  name: string;
  type: "phone" | "tablet" | "laptop" | "desktop";
  distanceM: number;
}

export interface NearbyOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class NearbyService {
  private readonly devices = new Map<string, Device>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: NearbyOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  discover(device: Omit<Device, "id">): Device {
    const d: Device = { ...device, id: newId("device") };
    this.devices.set(d.id, d);
    this.ledger.append({ type: "nearby.discovered", actor: "nearby", subject: d.id });
    return d;
  }

  getNearby(maxDistanceM = 100): Device[] {
    return Array.from(this.devices.values()).filter((d) => d.distanceM <= maxDistanceM);
  }
}
