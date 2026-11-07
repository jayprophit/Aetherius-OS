import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Device {
  id: string;
  name: string;
  protocol: string;
  status: "online" | "offline";
}

export interface IndustrialOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Industrial {
  private readonly devices = new Map<string, Device>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: IndustrialOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  register(name: string, protocol: string): Device {
    const device: Device = { id: newId("device"), name, protocol, status: "online" };
    this.devices.set(device.id, device);
    this.ledger.append({ type: "industrial.registered", actor: "industrial", subject: device.id });
    return device;
  }

  list(): Device[] {
    return Array.from(this.devices.values());
  }
}
