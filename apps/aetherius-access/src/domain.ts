import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface AccessibilityProfile {
  id: string;
  screenReader: boolean;
  highContrast: boolean;
  fontSize: number;
}

export interface AccessOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class AccessibilityService {
  private readonly profiles = new Map<string, AccessibilityProfile>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: AccessOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  apply(profile: Omit<AccessibilityProfile, "id">): AccessibilityProfile {
    const p: AccessibilityProfile = { ...profile, id: newId("access") };
    this.profiles.set(p.id, p);
    this.ledger.append({ type: "access.profile.applied", actor: "access", subject: p.id });
    return p;
  }

  current(): AccessibilityProfile | undefined {
    const entries = Array.from(this.profiles.values());
    return entries[entries.length - 1];
  }
}
