import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Profile {
  id: string;
  name: string;
  screenReader: boolean;
  highContrast: boolean;
}

export interface AccessibleOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Accessible {
  private readonly profiles = new Map<string, Profile>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: AccessibleOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(name: string, screenReader: boolean, highContrast: boolean): Profile {
    const profile: Profile = { id: newId("profile"), name, screenReader, highContrast };
    this.profiles.set(profile.id, profile);
    this.ledger.append({ type: "accessible.created", actor: "accessible", subject: profile.id });
    return profile;
  }

  list(): Profile[] {
    return Array.from(this.profiles.values());
  }
}
