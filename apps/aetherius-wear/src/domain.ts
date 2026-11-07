import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface WearableDevice {
  id: string;
  type: "watch" | "ring" | "glasses";
  batteryLevel: number;
}

export interface WearOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class WearService {
  private readonly devices = new Map<string, WearableDevice>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: WearOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  pair(device: Omit<WearableDevice, "id">): WearableDevice {
    const d: WearableDevice = { ...device, id: newId("wear") };
    this.devices.set(d.id, d);
    this.ledger.append({ type: "wear.paired", actor: "wear", subject: d.id });
    return d;
  }

  getPaired(): WearableDevice[] {
    return Array.from(this.devices.values());
  }
}
