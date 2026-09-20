// Local settings store (P10-APPREG). Real localStorage-backed settings with
// validation; every toggle does something. No cloud, no fake controls.
export type ThemeName = "dark" | "light" | "system";

export interface ShellSettings {
  theme: ThemeName;
  providerPollMs: number;
  bridgeEndpoint: string;
  matEndpoint: string;
}

export const DEFAULT_SETTINGS: ShellSettings = {
  theme: "dark",
  providerPollMs: 15000,
  bridgeEndpoint: "http://127.0.0.1:8471",
  matEndpoint: "http://127.0.0.1:8472",
};

const STORAGE_KEY = "aetherius.shell.settings.v1";

export interface SettingsStorage {
  load(): string | null;
  save(raw: string): void;
}

function browserStorage(): SettingsStorage | null {
  try {
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    if (!ls) return null;
    return {
      load: () => ls.getItem(STORAGE_KEY),
      save: (raw: string) => ls.setItem(STORAGE_KEY, raw),
    };
  } catch {
    return null;
  }
}

export function validateSettings(value: unknown): ShellSettings {
  const record = (value ?? {}) as Partial<Record<keyof ShellSettings, unknown>>;
  const theme = record.theme;
  const pollMs = Number(record.providerPollMs);
  const bridge = String(record.bridgeEndpoint ?? DEFAULT_SETTINGS.bridgeEndpoint);
  const mat = String(record.matEndpoint ?? DEFAULT_SETTINGS.matEndpoint);
  return {
    theme: theme === "light" || theme === "dark" || theme === "system" ? theme : "dark",
    providerPollMs:
      Number.isFinite(pollMs) && pollMs >= 1000 && pollMs <= 300000
        ? Math.floor(pollMs)
        : DEFAULT_SETTINGS.providerPollMs,
    bridgeEndpoint: bridge.startsWith("http://127.0.0.1:") || bridge.startsWith("http://localhost:")
      ? bridge
      : DEFAULT_SETTINGS.bridgeEndpoint,
    matEndpoint: mat.startsWith("http://127.0.0.1:") || mat.startsWith("http://localhost:")
      ? mat
      : DEFAULT_SETTINGS.matEndpoint,
  };
}

export class SettingsStore {
  private settings: ShellSettings;
  private storage: SettingsStorage | null;
  private listeners = new Set<(settings: ShellSettings) => void>();

  constructor(storage: SettingsStorage | null = browserStorage()) {
    this.storage = storage;
    let parsed: unknown = null;
    try {
      const raw = storage?.load();
      parsed = raw ? (JSON.parse(raw) as unknown) : null;
    } catch {
      parsed = null;
    }
    this.settings = validateSettings(parsed);
  }

  get(): ShellSettings {
    return { ...this.settings };
  }

  update(patch: Partial<ShellSettings>): ShellSettings {
    this.settings = validateSettings({ ...this.settings, ...patch });
    try {
      this.storage?.save(JSON.stringify(this.settings));
    } catch {
      // Storage full/blocked: keep in-memory settings, report via get().
    }
    for (const listener of this.listeners) listener(this.get());
    return this.get();
  }

  reset(): ShellSettings {
    return this.update({ ...DEFAULT_SETTINGS });
  }

  subscribe(listener: (settings: ShellSettings) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
