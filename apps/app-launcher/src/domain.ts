import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * App Launcher domain core.
 *
 * A registry of launchable applications with categories, search, favourites
 * and recent-launch tracking. Launching itself is a host adapter concern.
 */

export interface LaunchableApp {
  id: string;
  name: string;
  category: string;
  pinned: boolean;
  lastLaunchedAt: string | null;
  launchCount: number;
}

export interface LauncherOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class AppLauncher {
  private readonly apps = new Map<string, LaunchableApp>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: LauncherOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  register(name: string, category: string): LaunchableApp {
    if (typeof name !== "string" || name.trim().length === 0) {
      throw new Error("an app needs a name");
    }
    const app: LaunchableApp = {
      id: newId("app"),
      name: name.trim(),
      category: category.trim() || "General",
      pinned: false,
      lastLaunchedAt: null,
      launchCount: 0,
    };
    this.apps.set(app.id, app);
    this.ledger.append({ type: "launcher.registered", actor: "launcher", subject: app.id, data: { name: app.name } });
    return structuredClone(app);
  }

  launch(appId: string): LaunchableApp {
    const app = this.require(appId);
    app.lastLaunchedAt = nowIso(this.clock);
    app.launchCount += 1;
    this.apps.set(appId, app);
    this.ledger.append({ type: "launcher.launched", actor: "launcher", subject: appId, data: { launches: app.launchCount } });
    return structuredClone(app);
  }

  pin(appId: string, pinned = true): LaunchableApp {
    const app = this.require(appId);
    app.pinned = pinned === true;
    this.apps.set(appId, app);
    this.ledger.append({ type: "launcher.pin_changed", actor: "launcher", subject: appId, data: { pinned: pinned === true } });
    return structuredClone(app);
  }

  search(query: string): LaunchableApp[] {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return this.list();
    return [...this.apps.values()]
      .filter((app) => app.name.toLowerCase().includes(needle) || app.category.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((app) => structuredClone(app));
  }

  categories(): string[] {
    return [...new Set([...this.apps.values()].map((app) => app.category))].sort();
  }

  recent(limit = 5): LaunchableApp[] {
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new Error("limit must be an integer between 1 and 50");
    }
    return [...this.apps.values()]
      .filter((app) => app.lastLaunchedAt !== null)
      .sort((a, b) => (b.lastLaunchedAt ?? "").localeCompare(a.lastLaunchedAt ?? ""))
      .slice(0, limit)
      .map((app) => structuredClone(app));
  }

  list(): LaunchableApp[] {
    return [...this.apps.values()]
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.name.localeCompare(b.name))
      .map((app) => structuredClone(app));
  }

  private require(appId: string): LaunchableApp {
    const found = this.apps.get(appId);
    if (!found) throw new Error(`no app: ${appId}`);
    return structuredClone(found);
  }
}
