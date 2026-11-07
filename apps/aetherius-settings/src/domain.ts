import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Setting {
  id: string;
  key: string;
  value: string | number | boolean;
  category: string;
}

export interface SettingsOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class SettingsService {
  private readonly settings = new Map<string, Setting>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: SettingsOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  set(key: string, value: string | number | boolean, category = "general"): Setting {
    const setting: Setting = {
      id: newId("setting"),
      key,
      value,
      category,
    };
    this.settings.set(key, setting);
    this.ledger.append({ type: "settings.updated", actor: "settings", subject: key });
    return setting;
  }

  get(key: string): Setting | undefined {
    return this.settings.get(key);
  }

  listByCategory(category: string): Setting[] {
    return Array.from(this.settings.values()).filter((s) => s.category === category);
  }
}
