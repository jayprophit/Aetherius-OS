import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface NetworkProfile {
  id: string;
  ssid: string;
  iface: string;
  connected: boolean;
}

export interface NetworkOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class NetworkService {
  private readonly profiles = new Map<string, NetworkProfile>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: NetworkOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  connect(ssid: string, iface: string): NetworkProfile {
    const profile: NetworkProfile = { id: newId("net"), ssid, iface, connected: true };
    this.profiles.set(profile.id, profile);
    this.ledger.append({ type: "network.connected", actor: "network", subject: profile.id });
    return profile;
  }

  list(): NetworkProfile[] {
    return Array.from(this.profiles.values());
  }
}
