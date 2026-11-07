import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface AppEntry {
  id: string;
  name: string;
  version: string;
  description: string;
}

export interface InstallPlan {
  appId: string;
  target: string;
}

export interface StoreOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class AppStore {
  private readonly catalogue = new Map<string, AppEntry>();
  private readonly plans = new Map<string, InstallPlan>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: StoreOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  register(app: Omit<AppEntry, "id">): AppEntry {
    const entry: AppEntry = { ...app, id: newId("app") };
    this.catalogue.set(entry.id, entry);
    this.ledger.append({ type: "store.registered", actor: "store", subject: entry.id });
    return entry;
  }

  search(query: string): AppEntry[] {
    const q = query.toLowerCase();
    return Array.from(this.catalogue.values()).filter(
      (a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
  }

  planInstall(appId: string, target: string): InstallPlan {
    const app = this.catalogue.get(appId);
    if (!app) throw new Error("application not found");
    const plan: InstallPlan = { appId, target };
    this.plans.set(appId, plan);
    this.ledger.append({ type: "store.install.planned", actor: "store", subject: appId });
    return plan;
  }
}
