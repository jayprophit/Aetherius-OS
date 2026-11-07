import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface FamilyProfile {
  id: string;
  guardian: string;
  child: string;
  restrictions: string[];
}

export interface FamilyOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class FamilyService {
  private readonly profiles = new Map<string, FamilyProfile>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: FamilyOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(guardian: string, child: string, restrictions: string[] = []): FamilyProfile {
    const profile: FamilyProfile = { id: newId("family"), guardian, child, restrictions };
    this.profiles.set(profile.id, profile);
    this.ledger.append({ type: "family.created", actor: "family", subject: profile.id });
    return profile;
  }

  list(): FamilyProfile[] {
    return Array.from(this.profiles.values());
  }
}
