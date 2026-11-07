import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface VehicleProfile {
  id: string;
  make: string;
  model: string;
  year: number;
}

export interface DriveOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class DriveService {
  private readonly profiles = new Map<string, VehicleProfile>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: DriveOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  registerVehicle(make: string, model: string, year: number): VehicleProfile {
    const profile: VehicleProfile = { id: newId("vehicle"), make, model, year };
    this.profiles.set(profile.id, profile);
    this.ledger.append({ type: "drive.vehicle.registered", actor: "drive", subject: profile.id });
    return profile;
  }

  getVehicle(id: string): VehicleProfile | undefined {
    return this.profiles.get(id);
  }
}
