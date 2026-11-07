import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Device {
  id: string;
  name: string;
  type: string;
  status: "connected" | "disconnected" | "error";
}

export interface DevicesOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class DeviceManager {
  private readonly devices = new Map<string, Device>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: DevicesOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  register(device: Omit<Device, "id">): Device {
    const d: Device = { ...device, id: newId("device") };
    this.devices.set(d.id, d);
    this.ledger.append({ type: "devices.registered", actor: "devices", subject: d.id });
    return d;
  }

  list(): Device[] {
    return Array.from(this.devices.values());
  }
}
