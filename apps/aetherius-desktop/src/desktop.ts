import { EventLedger, nowIso } from "../../app-kit/src/index.ts";

/**
 * Aetherius Desktop domain slice.
 *
 * Three things live here:
 *   1. a layered settings/preferences service (system < user < app);
 *   2. a catalogue of the default-app roles on Apple, Linux, Microsoft,
 *      Android, iOS and Google OS, with an Aetherius equivalent per role;
 *   3. an installer/package planner that states the real signing and
 *      installation steps per platform.
 *
 * The planner produces a plan. It does not sign, install, elevate or claim
 * that a native shell exists. The README is explicit about that boundary.
 */

export const DESKTOP_VERSION = "0.1.0";

/* ------------------------------------------------------------------- OS set */

export type OsFamily = "apple" | "linux" | "microsoft" | "android" | "ios" | "google";

export const OS_FAMILIES: readonly OsFamily[] = ["apple", "linux", "microsoft", "android", "ios", "google"];

export const OS_LABELS: Record<OsFamily, string> = {
  apple: "Apple macOS",
  linux: "Linux",
  microsoft: "Microsoft Windows",
  android: "Android",
  ios: "Apple iOS",
  google: "Google ChromeOS",
};

/* ---------------------------------------------------------------- settings */

export type SettingType = "string" | "number" | "boolean" | "enum" | "json";
export type SettingScope = "system" | "user" | "app";
export type SettingValue = string | number | boolean | null | Record<string, unknown> | unknown[];

export interface SettingField {
  key: string;
  label: string;
  description: string;
  type: SettingType;
  default: SettingValue;
  scope: SettingScope | "any";
  appId?: string;
  enum?: readonly string[];
  min?: number;
  max?: number;
  secret?: boolean;
}

export interface ResolvedSetting {
  key: string;
  value: SettingValue;
  source: SettingScope | "default";
}

export interface SettingsExport {
  schema: "aetherius.settings.v1";
  os: OsFamily;
  exportedAt: string;
  values: Record<string, SettingValue>;
}

export interface SettingsOptions {
  os?: OsFamily;
  ledger?: EventLedger;
  clock?: () => Date;
}

const KEY = /^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$/;
const SCOPES: readonly SettingScope[] = ["system", "user", "app"];

export class SettingsService {
  private readonly fields = new Map<string, SettingField>();
  private readonly layers: Record<SettingScope, Map<string, SettingValue>> = {
    system: new Map(),
    user: new Map(),
    app: new Map(),
  };
  private readonly locks = new Map<string, string>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  readonly os: OsFamily;

  constructor(fields: readonly SettingField[], options: SettingsOptions = {}) {
    this.os = options.os ?? "linux";
    if (!OS_FAMILIES.includes(this.os)) throw new Error(`unknown OS family: ${this.os}`);
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    for (const field of fields) this.register(field);
  }

  register(field: SettingField): void {
    if (!KEY.test(field.key)) throw new Error(`invalid setting key: ${field.key}`);
    if (this.fields.has(field.key)) throw new Error(`setting is declared twice: ${field.key}`);
    if (!field.label.trim() || !field.description.trim()) throw new Error(`setting ${field.key} needs a label and a description`);
    if (field.type === "enum" && (!field.enum || field.enum.length === 0)) {
      throw new Error(`enum setting ${field.key} needs values`);
    }
    this.check(field, field.default);
    this.fields.set(field.key, { ...field, enum: field.enum ? [...field.enum] : undefined });
  }

  field(key: string): SettingField {
    const field = this.fields.get(key);
    if (!field) throw new Error(`unknown setting: ${key}`);
    return { ...field, enum: field.enum ? [...field.enum] : undefined };
  }

  keys(): string[] {
    return [...this.fields.keys()].sort();
  }

  set(key: string, value: SettingValue, scope: SettingScope): ResolvedSetting {
    const field = this.field(key);
    if (!SCOPES.includes(scope)) throw new Error(`unknown setting scope: ${scope}`);
    if (field.scope !== "any" && field.scope !== scope) {
      throw new Error(`setting ${key} belongs to the ${field.scope} scope, not ${scope}`);
    }
    if (this.locks.has(key) && scope !== "system") {
      throw new Error(`setting ${key} is locked by policy: ${this.locks.get(key)}`);
    }
    this.check(field, value);
    this.layers[scope].set(key, clone(value));
    this.ledger.append({
      type: "settings.changed",
      actor: scope,
      subject: key,
      data: { value: field.secret ? "[redacted]" : clone(value) },
    });
    return this.get(key);
  }

  lock(key: string, reason: string): void {
    this.field(key);
    if (!reason.trim()) throw new Error("a policy lock needs a reason");
    this.locks.set(key, reason.trim());
    this.ledger.append({ type: "settings.locked", actor: "system", subject: key, data: { reason: reason.trim() } });
  }

  unlock(key: string): void {
    this.field(key);
    this.locks.delete(key);
  }

  locked(key: string): string | null {
    return this.locks.get(key) ?? null;
  }

  get(key: string): ResolvedSetting {
    const field = this.field(key);
    for (const scope of ["app", "user", "system"] as const) {
      const value = this.layers[scope].get(key);
      if (value !== undefined) return { key, value: clone(value), source: scope };
    }
    return { key, value: clone(field.default), source: "default" };
  }

  effective(): Record<string, SettingValue> {
    const result: Record<string, SettingValue> = {};
    for (const key of this.keys()) result[key] = this.get(key).value;
    return result;
  }

  validate(): { ok: boolean; problems: { key: string; message: string }[] } {
    const problems: { key: string; message: string }[] = [];
    for (const field of this.fields.values()) {
      for (const scope of SCOPES) {
        const value = this.layers[scope].get(field.key);
        if (value === undefined) continue;
        try {
          this.check(field, value);
        } catch (caught) {
          problems.push({ key: field.key, message: caught instanceof Error ? caught.message : String(caught) });
        }
      }
    }
    return { ok: problems.length === 0, problems };
  }

  export(options: { redactSecrets?: boolean } = {}): SettingsExport {
    const redact = options.redactSecrets ?? true;
    const values: Record<string, SettingValue> = {};
    for (const key of this.keys()) {
      const field = this.field(key);
      const resolved = this.get(key);
      values[key] = redact && field.secret ? "[redacted]" : resolved.value;
    }
    return {
      schema: "aetherius.settings.v1",
      os: this.os,
      exportedAt: nowIso(this.clock),
      values,
    };
  }

  import(payload: SettingsExport, scope: SettingScope = "user"): number {
    if (payload.schema !== "aetherius.settings.v1") throw new Error("unsupported settings schema");
    if (!OS_FAMILIES.includes(payload.os)) throw new Error(`unknown OS family: ${payload.os}`);
    let applied = 0;
    for (const [key, value] of Object.entries(payload.values)) {
      const field = this.field(key);
      if (value === "[redacted]") continue;
      if (field.scope !== "any" && field.scope !== scope) continue;
      if (this.locks.has(key) && scope !== "system") continue;
      this.check(field, value);
      this.layers[scope].set(key, clone(value));
      applied += 1;
    }
    this.ledger.append({ type: "settings.imported", actor: scope, subject: this.os, data: { applied } });
    return applied;
  }

  reset(scope?: SettingScope): void {
    if (scope) {
      if (!SCOPES.includes(scope)) throw new Error(`unknown setting scope: ${scope}`);
      this.layers[scope].clear();
    } else {
      for (const layer of SCOPES) this.layers[layer].clear();
    }
    this.ledger.append({ type: "settings.reset", actor: "system", subject: scope ?? "all" });
  }

  /** Apply an OS preset without overwriting an explicit value in a user-facing layer. */
  applyPreset(preset: Record<string, SettingValue>, scope: SettingScope = "system"): number {
    let applied = 0;
    for (const [key, value] of Object.entries(preset)) {
      const field = this.field(key);
      const target: SettingScope = field.scope === "any" ? scope : field.scope;
      if (target !== "system" && this.layers[target].has(key)) continue;
      this.check(field, value);
      this.layers[target].set(key, clone(value));
      applied += 1;
    }
    return applied;
  }

  private check(field: SettingField, value: SettingValue): void {
    if (field.type === "json") {
      if (value !== null && typeof value !== "object") throw new Error(`setting ${field.key} expects an object or array`);
      return;
    }
    if (field.type === "enum") {
      if (typeof value !== "string" || !field.enum?.includes(value)) {
        throw new Error(`setting ${field.key} must be one of: ${field.enum?.join(", ")}`);
      }
      return;
    }
    if (typeof value !== field.type) throw new Error(`setting ${field.key} expects ${field.type}`);
    if (field.type === "number") {
      const number = value as number;
      if (!Number.isFinite(number)) throw new Error(`setting ${field.key} expects a finite number`);
      if (field.min !== undefined && number < field.min) throw new Error(`setting ${field.key} is below ${field.min}`);
      if (field.max !== undefined && number > field.max) throw new Error(`setting ${field.key} is above ${field.max}`);
    }
    // An empty secret means "not configured"; other strings may not be blank.
    if (field.type === "string" && !field.secret && !(value as string).trim()) {
      throw new Error(`setting ${field.key} cannot be empty`);
    }
  }
}

function clone<T>(value: T): T {
  return value === null || typeof value !== "object" ? value : (structuredClone(value) as T);
}

/* --------------------------------------------------------- OS presets */

export const OS_PRESETS: Record<OsFamily, Record<string, SettingValue>> = {
  apple: {
    "appearance.theme": "system",
    "appearance.accent": "blue",
    "appearance.fontScale": 1,
    "motion.reduce": false,
    "accessibility.screenReader": false,
    "window.controls": "traffic-lights",
    "window.dockPosition": "bottom",
    "input.gestureNavigation": true,
    "browser.default": "aetherius.browser",
  },
  linux: {
    "appearance.theme": "dark",
    "appearance.accent": "teal",
    "appearance.fontScale": 1,
    "motion.reduce": false,
    "accessibility.screenReader": false,
    "window.controls": "right",
    "window.dockPosition": "left",
    "input.gestureNavigation": false,
    "browser.default": "aetherius.browser",
  },
  microsoft: {
    "appearance.theme": "system",
    "appearance.accent": "blue",
    "appearance.fontScale": 1,
    "motion.reduce": false,
    "accessibility.screenReader": false,
    "window.controls": "right",
    "window.dockPosition": "bottom",
    "input.gestureNavigation": false,
    "browser.default": "aetherius.browser",
  },
  android: {
    "appearance.theme": "system",
    "appearance.accent": "dynamic",
    "appearance.fontScale": 1,
    "motion.reduce": false,
    "accessibility.screenReader": false,
    "window.controls": "gesture",
    "window.dockPosition": "bottom",
    "input.gestureNavigation": true,
    "browser.default": "aetherius.browser",
  },
  ios: {
    "appearance.theme": "system",
    "appearance.accent": "blue",
    "appearance.fontScale": 1,
    "motion.reduce": false,
    "accessibility.screenReader": false,
    "window.controls": "gesture",
    "window.dockPosition": "bottom",
    "input.gestureNavigation": true,
    "browser.default": "aetherius.browser",
  },
  google: {
    "appearance.theme": "system",
    "appearance.accent": "blue",
    "appearance.fontScale": 1,
    "motion.reduce": false,
    "accessibility.screenReader": false,
    "window.controls": "right",
    "window.dockPosition": "bottom",
    "input.gestureNavigation": true,
    "browser.default": "aetherius.browser",
  },
};

export const DEFAULT_SETTING_FIELDS: readonly SettingField[] = [
  { key: "appearance.theme", label: "Theme", description: "Light, dark or follow the system.", type: "enum", enum: ["light", "dark", "system"], default: "system", scope: "user" },
  { key: "appearance.accent", label: "Accent colour", description: "The highlight colour used by controls.", type: "enum", enum: ["blue", "teal", "purple", "orange", "red", "green", "dynamic"], default: "blue", scope: "user" },
  { key: "appearance.fontScale", label: "Font scale", description: "Text size multiplier from 0.8 to 2.0.", type: "number", min: 0.8, max: 2, default: 1, scope: "user" },
  { key: "motion.reduce", label: "Reduce motion", description: "Disable non-essential animation.", type: "boolean", default: false, scope: "user" },
  { key: "accessibility.screenReader", label: "Screen reader", description: "Enable the accessibility tree narration.", type: "boolean", default: false, scope: "user" },
  { key: "accessibility.highContrast", label: "High contrast", description: "Increase contrast beyond the theme default.", type: "boolean", default: false, scope: "user" },
  { key: "window.controls", label: "Window controls", description: "The control layout used by the window chrome.", type: "enum", enum: ["left", "right", "traffic-lights", "gesture"], default: "right", scope: "system" },
  { key: "window.dockPosition", label: "Dock position", description: "Where the launcher sits.", type: "enum", enum: ["left", "right", "bottom"], default: "bottom", scope: "user" },
  { key: "input.gestureNavigation", label: "Gesture navigation", description: "Use edge gestures instead of a navigation bar.", type: "boolean", default: false, scope: "user" },
  { key: "browser.default", label: "Default browser", description: "The app that handles http and https links.", type: "string", default: "aetherius.browser", scope: "user" },
  { key: "locale.language", label: "Language", description: "BCP-47 language tag.", type: "string", default: "en-GB", scope: "user" },
  { key: "locale.timeZone", label: "Time zone", description: "IANA time zone name.", type: "string", default: "Europe/London", scope: "user" },
  { key: "network.proxy", label: "Proxy", description: "Optional proxy URL; null means direct.", type: "json", default: null, scope: "system" },
  { key: "update.channel", label: "Update channel", description: "Which release channel the device follows.", type: "enum", enum: ["stable", "beta", "dev"], default: "stable", scope: "system" },
  { key: "telemetry.enabled", label: "Telemetry", description: "Send anonymous diagnostics.", type: "boolean", default: false, scope: "user" },
  { key: "privacy.shareUsage", label: "Share usage", description: "Allow usage analytics across apps.", type: "boolean", default: false, scope: "user" },
];

/* ------------------------------------------------------ default app roles */

export type AppRole =
  | "browser" | "mail" | "calendar" | "photos" | "music" | "notes" | "calculator"
  | "files" | "terminal" | "settings" | "store" | "camera" | "messages" | "maps"
  | "clock" | "weather" | "contacts" | "reminders" | "documents" | "pdf"
  | "archive" | "mediaPlayer" | "taskManager" | "diskUtility" | "screenshot" | "textEditor";

export const APP_ROLES: readonly AppRole[] = [
  "browser", "mail", "calendar", "photos", "music", "notes", "calculator",
  "files", "terminal", "settings", "store", "camera", "messages", "maps",
  "clock", "weather", "contacts", "reminders", "documents", "pdf",
  "archive", "mediaPlayer", "taskManager", "diskUtility", "screenshot", "textEditor",
];

export interface DefaultApp {
  role: AppRole;
  aetherius: string;
  native: string;
  thirdPartyAlternatives: string[];
}

export const DEFAULT_APP_CATALOG: Record<OsFamily, Record<AppRole, DefaultApp>> = {
  apple: {
    browser: { role: "browser", aetherius: "aetherius.browser", native: "Safari", thirdPartyAlternatives: ["Chrome", "Firefox"] },
    mail: { role: "mail", aetherius: "aetherius.mail", native: "Mail", thirdPartyAlternatives: ["Outlook", "Thunderbird"] },
    calendar: { role: "calendar", aetherius: "aetherius.calendar", native: "Calendar", thirdPartyAlternatives: ["Fantastical"] },
    photos: { role: "photos", aetherius: "aetherius.photos", native: "Photos", thirdPartyAlternatives: ["Lightroom"] },
    music: { role: "music", aetherius: "aetherius.music", native: "Music", thirdPartyAlternatives: ["Spotify"] },
    notes: { role: "notes", aetherius: "aetherius.notes", native: "Notes", thirdPartyAlternatives: ["Obsidian"] },
    calculator: { role: "calculator", aetherius: "aetherius.calculator", native: "Calculator", thirdPartyAlternatives: [] },
    files: { role: "files", aetherius: "aetherius.files", native: "Finder", thirdPartyAlternatives: ["Path Finder"] },
    terminal: { role: "terminal", aetherius: "aetherius.terminal", native: "Terminal", thirdPartyAlternatives: ["iTerm2"] },
    settings: { role: "settings", aetherius: "aetherius.settings", native: "System Settings", thirdPartyAlternatives: [] },
    store: { role: "store", aetherius: "aetherius.store", native: "App Store", thirdPartyAlternatives: [] },
    camera: { role: "camera", aetherius: "aetherius.camera", native: "Camera", thirdPartyAlternatives: [] },
    messages: { role: "messages", aetherius: "aetherius.messages", native: "Messages", thirdPartyAlternatives: ["Signal"] },
    maps: { role: "maps", aetherius: "aetherius.maps", native: "Maps", thirdPartyAlternatives: ["Google Maps"] },
    clock: { role: "clock", aetherius: "aetherius.clock", native: "Clock", thirdPartyAlternatives: [] },
    weather: { role: "weather", aetherius: "aetherius.weather", native: "Weather", thirdPartyAlternatives: [] },
    contacts: { role: "contacts", aetherius: "aetherius.contacts", native: "Contacts", thirdPartyAlternatives: [] },
    reminders: { role: "reminders", aetherius: "aetherius.reminders", native: "Reminders", thirdPartyAlternatives: ["Things"] },
    documents: { role: "documents", aetherius: "aetherius.documents", native: "Pages", thirdPartyAlternatives: ["Word", "LibreOffice"] },
    pdf: { role: "pdf", aetherius: "aetherius.pdf", native: "Preview", thirdPartyAlternatives: ["Adobe Acrobat"] },
    archive: { role: "archive", aetherius: "aetherius.archive", native: "Archive Utility", thirdPartyAlternatives: ["7-Zip"] },
    mediaPlayer: { role: "mediaPlayer", aetherius: "aetherius.mediaPlayer", native: "QuickTime Player", thirdPartyAlternatives: ["VLC"] },
    taskManager: { role: "taskManager", aetherius: "aetherius.taskManager", native: "Activity Monitor", thirdPartyAlternatives: [] },
    diskUtility: { role: "diskUtility", aetherius: "aetherius.diskUtility", native: "Disk Utility", thirdPartyAlternatives: [] },
    screenshot: { role: "screenshot", aetherius: "aetherius.screenshot", native: "Screenshot", thirdPartyAlternatives: [] },
    textEditor: { role: "textEditor", aetherius: "aetherius.textEditor", native: "TextEdit", thirdPartyAlternatives: ["VS Code"] },
  },
  linux: {
    browser: { role: "browser", aetherius: "aetherius.browser", native: "Firefox", thirdPartyAlternatives: ["Chromium", "Epiphany"] },
    mail: { role: "mail", aetherius: "aetherius.mail", native: "Thunderbird", thirdPartyAlternatives: ["Evolution"] },
    calendar: { role: "calendar", aetherius: "aetherius.calendar", native: "GNOME Calendar", thirdPartyAlternatives: ["KOrganizer"] },
    photos: { role: "photos", aetherius: "aetherius.photos", native: "Shotwell", thirdPartyAlternatives: ["digiKam"] },
    music: { role: "music", aetherius: "aetherius.music", native: "Rhythmbox", thirdPartyAlternatives: ["Strawberry"] },
    notes: { role: "notes", aetherius: "aetherius.notes", native: "gedit", thirdPartyAlternatives: ["Obsidian"] },
    calculator: { role: "calculator", aetherius: "aetherius.calculator", native: "GNOME Calculator", thirdPartyAlternatives: ["KCalc"] },
    files: { role: "files", aetherius: "aetherius.files", native: "Files (Nautilus)", thirdPartyAlternatives: ["Dolphin"] },
    terminal: { role: "terminal", aetherius: "aetherius.terminal", native: "GNOME Terminal", thirdPartyAlternatives: ["Konsole", "Kitty"] },
    settings: { role: "settings", aetherius: "aetherius.settings", native: "GNOME Settings", thirdPartyAlternatives: ["KDE System Settings"] },
    store: { role: "store", aetherius: "aetherius.store", native: "GNOME Software", thirdPartyAlternatives: ["Flathub"] },
    camera: { role: "camera", aetherius: "aetherius.camera", native: "Cheese", thirdPartyAlternatives: [] },
    messages: { role: "messages", aetherius: "aetherius.messages", native: "Fractal", thirdPartyAlternatives: ["Signal"] },
    maps: { role: "maps", aetherius: "aetherius.maps", native: "GNOME Maps", thirdPartyAlternatives: ["Organic Maps"] },
    clock: { role: "clock", aetherius: "aetherius.clock", native: "GNOME Clocks", thirdPartyAlternatives: [] },
    weather: { role: "weather", aetherius: "aetherius.weather", native: "GNOME Weather", thirdPartyAlternatives: [] },
    contacts: { role: "contacts", aetherius: "aetherius.contacts", native: "GNOME Contacts", thirdPartyAlternatives: [] },
    reminders: { role: "reminders", aetherius: "aetherius.reminders", native: "GNOME To Do", thirdPartyAlternatives: [] },
    documents: { role: "documents", aetherius: "aetherius.documents", native: "LibreOffice Writer", thirdPartyAlternatives: ["OnlyOffice"] },
    pdf: { role: "pdf", aetherius: "aetherius.pdf", native: "Evince", thirdPartyAlternatives: ["Okular"] },
    archive: { role: "archive", aetherius: "aetherius.archive", native: "File Roller", thirdPartyAlternatives: ["Ark"] },
    mediaPlayer: { role: "mediaPlayer", aetherius: "aetherius.mediaPlayer", native: "VLC", thirdPartyAlternatives: ["Totem"] },
    taskManager: { role: "taskManager", aetherius: "aetherius.taskManager", native: "GNOME System Monitor", thirdPartyAlternatives: ["htop"] },
    diskUtility: { role: "diskUtility", aetherius: "aetherius.diskUtility", native: "GParted", thirdPartyAlternatives: ["GNOME Disks"] },
    screenshot: { role: "screenshot", aetherius: "aetherius.screenshot", native: "GNOME Screenshot", thirdPartyAlternatives: ["Flameshot"] },
    textEditor: { role: "textEditor", aetherius: "aetherius.textEditor", native: "gedit", thirdPartyAlternatives: ["Kate", "VS Code"] },
  },
  microsoft: {
    browser: { role: "browser", aetherius: "aetherius.browser", native: "Microsoft Edge", thirdPartyAlternatives: ["Chrome", "Firefox"] },
    mail: { role: "mail", aetherius: "aetherius.mail", native: "Outlook", thirdPartyAlternatives: ["Thunderbird"] },
    calendar: { role: "calendar", aetherius: "aetherius.calendar", native: "Calendar", thirdPartyAlternatives: ["Google Calendar"] },
    photos: { role: "photos", aetherius: "aetherius.photos", native: "Photos", thirdPartyAlternatives: ["digiKam"] },
    music: { role: "music", aetherius: "aetherius.music", native: "Media Player", thirdPartyAlternatives: ["Spotify"] },
    notes: { role: "notes", aetherius: "aetherius.notes", native: "Notepad", thirdPartyAlternatives: ["OneNote", "Obsidian"] },
    calculator: { role: "calculator", aetherius: "aetherius.calculator", native: "Calculator", thirdPartyAlternatives: [] },
    files: { role: "files", aetherius: "aetherius.files", native: "File Explorer", thirdPartyAlternatives: ["Files"] },
    terminal: { role: "terminal", aetherius: "aetherius.terminal", native: "Windows Terminal", thirdPartyAlternatives: ["PowerShell"] },
    settings: { role: "settings", aetherius: "aetherius.settings", native: "Settings", thirdPartyAlternatives: [] },
    store: { role: "store", aetherius: "aetherius.store", native: "Microsoft Store", thirdPartyAlternatives: ["winget"] },
    camera: { role: "camera", aetherius: "aetherius.camera", native: "Camera", thirdPartyAlternatives: [] },
    messages: { role: "messages", aetherius: "aetherius.messages", native: "Phone Link", thirdPartyAlternatives: ["Signal"] },
    maps: { role: "maps", aetherius: "aetherius.maps", native: "Maps", thirdPartyAlternatives: ["Google Maps"] },
    clock: { role: "clock", aetherius: "aetherius.clock", native: "Clock", thirdPartyAlternatives: [] },
    weather: { role: "weather", aetherius: "aetherius.weather", native: "Weather", thirdPartyAlternatives: [] },
    contacts: { role: "contacts", aetherius: "aetherius.contacts", native: "People", thirdPartyAlternatives: [] },
    reminders: { role: "reminders", aetherius: "aetherius.reminders", native: "Microsoft To Do", thirdPartyAlternatives: ["Todoist"] },
    documents: { role: "documents", aetherius: "aetherius.documents", native: "Word", thirdPartyAlternatives: ["LibreOffice"] },
    pdf: { role: "pdf", aetherius: "aetherius.pdf", native: "Edge PDF viewer", thirdPartyAlternatives: ["Adobe Acrobat"] },
    archive: { role: "archive", aetherius: "aetherius.archive", native: "File Explorer ZIP", thirdPartyAlternatives: ["7-Zip"] },
    mediaPlayer: { role: "mediaPlayer", aetherius: "aetherius.mediaPlayer", native: "Media Player", thirdPartyAlternatives: ["VLC"] },
    taskManager: { role: "taskManager", aetherius: "aetherius.taskManager", native: "Task Manager", thirdPartyAlternatives: ["Process Explorer"] },
    diskUtility: { role: "diskUtility", aetherius: "aetherius.diskUtility", native: "Disk Management", thirdPartyAlternatives: [] },
    screenshot: { role: "screenshot", aetherius: "aetherius.screenshot", native: "Snipping Tool", thirdPartyAlternatives: ["ShareX"] },
    textEditor: { role: "textEditor", aetherius: "aetherius.textEditor", native: "Notepad", thirdPartyAlternatives: ["Notepad++", "VS Code"] },
  },
  android: {
    browser: { role: "browser", aetherius: "aetherius.browser", native: "Chrome", thirdPartyAlternatives: ["Firefox"] },
    mail: { role: "mail", aetherius: "aetherius.mail", native: "Gmail", thirdPartyAlternatives: ["K-9 Mail"] },
    calendar: { role: "calendar", aetherius: "aetherius.calendar", native: "Google Calendar", thirdPartyAlternatives: ["Etar"] },
    photos: { role: "photos", aetherius: "aetherius.photos", native: "Google Photos", thirdPartyAlternatives: ["Aves"] },
    music: { role: "music", aetherius: "aetherius.music", native: "YouTube Music", thirdPartyAlternatives: ["VLC"] },
    notes: { role: "notes", aetherius: "aetherius.notes", native: "Google Keep", thirdPartyAlternatives: ["Obsidian"] },
    calculator: { role: "calculator", aetherius: "aetherius.calculator", native: "Calculator", thirdPartyAlternatives: [] },
    files: { role: "files", aetherius: "aetherius.files", native: "Files by Google", thirdPartyAlternatives: ["Material Files"] },
    terminal: { role: "terminal", aetherius: "aetherius.terminal", native: "Termux (third-party)", thirdPartyAlternatives: ["Termux"] },
    settings: { role: "settings", aetherius: "aetherius.settings", native: "Settings", thirdPartyAlternatives: [] },
    store: { role: "store", aetherius: "aetherius.store", native: "Play Store", thirdPartyAlternatives: ["F-Droid"] },
    camera: { role: "camera", aetherius: "aetherius.camera", native: "Camera", thirdPartyAlternatives: ["Open Camera"] },
    messages: { role: "messages", aetherius: "aetherius.messages", native: "Messages", thirdPartyAlternatives: ["Signal"] },
    maps: { role: "maps", aetherius: "aetherius.maps", native: "Google Maps", thirdPartyAlternatives: ["Organic Maps"] },
    clock: { role: "clock", aetherius: "aetherius.clock", native: "Clock", thirdPartyAlternatives: [] },
    weather: { role: "weather", aetherius: "aetherius.weather", native: "Google Weather", thirdPartyAlternatives: ["Breezy"] },
    contacts: { role: "contacts", aetherius: "aetherius.contacts", native: "Contacts", thirdPartyAlternatives: [] },
    reminders: { role: "reminders", aetherius: "aetherius.reminders", native: "Google Tasks", thirdPartyAlternatives: ["Tasks.org"] },
    documents: { role: "documents", aetherius: "aetherius.documents", native: "Google Docs", thirdPartyAlternatives: ["Collabora"] },
    pdf: { role: "pdf", aetherius: "aetherius.pdf", native: "Drive PDF Viewer", thirdPartyAlternatives: ["MuPDF"] },
    archive: { role: "archive", aetherius: "aetherius.archive", native: "Files by Google", thirdPartyAlternatives: ["ZArchiver"] },
    mediaPlayer: { role: "mediaPlayer", aetherius: "aetherius.mediaPlayer", native: "YouTube", thirdPartyAlternatives: ["VLC"] },
    taskManager: { role: "taskManager", aetherius: "aetherius.taskManager", native: "Digital Wellbeing", thirdPartyAlternatives: [] },
    diskUtility: { role: "diskUtility", aetherius: "aetherius.diskUtility", native: "Storage", thirdPartyAlternatives: [] },
    screenshot: { role: "screenshot", aetherius: "aetherius.screenshot", native: "Screenshot", thirdPartyAlternatives: [] },
    textEditor: { role: "textEditor", aetherius: "aetherius.textEditor", native: "Google Keep", thirdPartyAlternatives: ["Acode"] },
  },
  ios: {
    browser: { role: "browser", aetherius: "aetherius.browser", native: "Safari", thirdPartyAlternatives: ["Chrome", "Firefox"] },
    mail: { role: "mail", aetherius: "aetherius.mail", native: "Mail", thirdPartyAlternatives: ["Outlook"] },
    calendar: { role: "calendar", aetherius: "aetherius.calendar", native: "Calendar", thirdPartyAlternatives: ["Fantastical"] },
    photos: { role: "photos", aetherius: "aetherius.photos", native: "Photos", thirdPartyAlternatives: ["Darkroom"] },
    music: { role: "music", aetherius: "aetherius.music", native: "Music", thirdPartyAlternatives: ["Spotify"] },
    notes: { role: "notes", aetherius: "aetherius.notes", native: "Notes", thirdPartyAlternatives: ["Obsidian"] },
    calculator: { role: "calculator", aetherius: "aetherius.calculator", native: "Calculator", thirdPartyAlternatives: [] },
    files: { role: "files", aetherius: "aetherius.files", native: "Files", thirdPartyAlternatives: ["Documents"] },
    terminal: { role: "terminal", aetherius: "aetherius.terminal", native: "Terminal (third-party)", thirdPartyAlternatives: ["a-Shell"] },
    settings: { role: "settings", aetherius: "aetherius.settings", native: "Settings", thirdPartyAlternatives: [] },
    store: { role: "store", aetherius: "aetherius.store", native: "App Store", thirdPartyAlternatives: [] },
    camera: { role: "camera", aetherius: "aetherius.camera", native: "Camera", thirdPartyAlternatives: ["Halide"] },
    messages: { role: "messages", aetherius: "aetherius.messages", native: "Messages", thirdPartyAlternatives: ["Signal"] },
    maps: { role: "maps", aetherius: "aetherius.maps", native: "Maps", thirdPartyAlternatives: ["Google Maps"] },
    clock: { role: "clock", aetherius: "aetherius.clock", native: "Clock", thirdPartyAlternatives: [] },
    weather: { role: "weather", aetherius: "aetherius.weather", native: "Weather", thirdPartyAlternatives: ["Carrot Weather"] },
    contacts: { role: "contacts", aetherius: "aetherius.contacts", native: "Contacts", thirdPartyAlternatives: [] },
    reminders: { role: "reminders", aetherius: "aetherius.reminders", native: "Reminders", thirdPartyAlternatives: ["Things"] },
    documents: { role: "documents", aetherius: "aetherius.documents", native: "Pages", thirdPartyAlternatives: ["Word"] },
    pdf: { role: "pdf", aetherius: "aetherius.pdf", native: "Books", thirdPartyAlternatives: ["Adobe Acrobat"] },
    archive: { role: "archive", aetherius: "aetherius.archive", native: "Files", thirdPartyAlternatives: ["iZip"] },
    mediaPlayer: { role: "mediaPlayer", aetherius: "aetherius.mediaPlayer", native: "TV", thirdPartyAlternatives: ["VLC"] },
    taskManager: { role: "taskManager", aetherius: "aetherius.taskManager", native: "Settings > Battery", thirdPartyAlternatives: [] },
    diskUtility: { role: "diskUtility", aetherius: "aetherius.diskUtility", native: "Settings > General > Storage", thirdPartyAlternatives: [] },
    screenshot: { role: "screenshot", aetherius: "aetherius.screenshot", native: "Screenshot", thirdPartyAlternatives: [] },
    textEditor: { role: "textEditor", aetherius: "aetherius.textEditor", native: "Notes", thirdPartyAlternatives: ["Textastic"] },
  },
  google: {
    browser: { role: "browser", aetherius: "aetherius.browser", native: "Chrome", thirdPartyAlternatives: ["Firefox"] },
    mail: { role: "mail", aetherius: "aetherius.mail", native: "Gmail", thirdPartyAlternatives: ["Thunderbird"] },
    calendar: { role: "calendar", aetherius: "aetherius.calendar", native: "Google Calendar", thirdPartyAlternatives: [] },
    photos: { role: "photos", aetherius: "aetherius.photos", native: "Google Photos", thirdPartyAlternatives: [] },
    music: { role: "music", aetherius: "aetherius.music", native: "YouTube Music", thirdPartyAlternatives: ["Spotify"] },
    notes: { role: "notes", aetherius: "aetherius.notes", native: "Google Keep", thirdPartyAlternatives: ["Obsidian"] },
    calculator: { role: "calculator", aetherius: "aetherius.calculator", native: "Calculator", thirdPartyAlternatives: [] },
    files: { role: "files", aetherius: "aetherius.files", native: "Files", thirdPartyAlternatives: [] },
    terminal: { role: "terminal", aetherius: "aetherius.terminal", native: "Terminal (Linux container)", thirdPartyAlternatives: [] },
    settings: { role: "settings", aetherius: "aetherius.settings", native: "Settings", thirdPartyAlternatives: [] },
    store: { role: "store", aetherius: "aetherius.store", native: "Play Store", thirdPartyAlternatives: ["Web Store"] },
    camera: { role: "camera", aetherius: "aetherius.camera", native: "Camera", thirdPartyAlternatives: [] },
    messages: { role: "messages", aetherius: "aetherius.messages", native: "Messages", thirdPartyAlternatives: ["Signal"] },
    maps: { role: "maps", aetherius: "aetherius.maps", native: "Google Maps", thirdPartyAlternatives: [] },
    clock: { role: "clock", aetherius: "aetherius.clock", native: "Clock", thirdPartyAlternatives: [] },
    weather: { role: "weather", aetherius: "aetherius.weather", native: "Weather", thirdPartyAlternatives: [] },
    contacts: { role: "contacts", aetherius: "aetherius.contacts", native: "Contacts", thirdPartyAlternatives: [] },
    reminders: { role: "reminders", aetherius: "aetherius.reminders", native: "Google Tasks", thirdPartyAlternatives: [] },
    documents: { role: "documents", aetherius: "aetherius.documents", native: "Google Docs", thirdPartyAlternatives: ["LibreOffice"] },
    pdf: { role: "pdf", aetherius: "aetherius.pdf", native: "Chrome PDF viewer", thirdPartyAlternatives: [] },
    archive: { role: "archive", aetherius: "aetherius.archive", native: "Files", thirdPartyAlternatives: ["Archive Utility"] },
    mediaPlayer: { role: "mediaPlayer", aetherius: "aetherius.mediaPlayer", native: "YouTube", thirdPartyAlternatives: ["VLC"] },
    taskManager: { role: "taskManager", aetherius: "aetherius.taskManager", native: "Task Manager", thirdPartyAlternatives: [] },
    diskUtility: { role: "diskUtility", aetherius: "aetherius.diskUtility", native: "Storage", thirdPartyAlternatives: [] },
    screenshot: { role: "screenshot", aetherius: "aetherius.screenshot", native: "Screenshot", thirdPartyAlternatives: [] },
    textEditor: { role: "textEditor", aetherius: "aetherius.textEditor", native: "Text Editor", thirdPartyAlternatives: ["VS Code"] },
  },
};

export interface DefaultAppResolution {
  role: AppRole;
  os: OsFamily;
  aetherius: string;
  native: string;
  alternatives: string[];
  chosen: string;
}

/**
 * Resolve the default app for a role. The Aetherius app is the default in an
 * Aetherius desktop session; the native app is the equivalent on the host OS.
 */
export class DefaultAppService {
  private readonly overrides = new Map<string, string>();
  private readonly os: OsFamily;

  constructor(os: OsFamily) {
    if (!OS_FAMILIES.includes(os)) throw new Error(`unknown OS family: ${os}`);
    this.os = os;
  }

  catalog(): DefaultApp[] {
    return APP_ROLES.map((role) => ({ ...DEFAULT_APP_CATALOG[this.os][role] }));
  }

  resolve(role: AppRole): DefaultAppResolution {
    const entry = DEFAULT_APP_CATALOG[this.os][role];
    if (!entry) throw new Error(`unknown app role: ${role}`);
    const chosen = this.overrides.get(role) ?? entry.aetherius;
    return {
      role,
      os: this.os,
      aetherius: entry.aetherius,
      native: entry.native,
      alternatives: [...entry.thirdPartyAlternatives],
      chosen,
    };
  }

  setDefault(role: AppRole, appId: string): DefaultAppResolution {
    if (!APP_ROLES.includes(role)) throw new Error(`unknown app role: ${role}`);
    if (!appId.trim()) throw new Error("a default app needs an id");
    this.overrides.set(role, appId.trim());
    return this.resolve(role);
  }

  reset(role?: AppRole): void {
    if (role) this.overrides.delete(role);
    else this.overrides.clear();
  }

  /** Which role handles a MIME type or URL scheme. */
  roleFor(target: string): AppRole {
    const value = target.trim().toLowerCase();
    if (value.startsWith("http:") || value.startsWith("https:")) return "browser";
    if (value.startsWith("mailto:")) return "mail";
    if (value.startsWith("tel:")) return "messages";
    if (value === "text/plain" || value.endsWith(".txt") || value.endsWith(".md")) return "textEditor";
    if (value === "application/pdf" || value.endsWith(".pdf")) return "pdf";
    if (value.startsWith("image/")) return "photos";
    if (value.startsWith("audio/")) return "music";
    if (value.startsWith("video/")) return "mediaPlayer";
    if (value.includes("zip") || value.includes("tar") || value.endsWith(".7z")) return "archive";
    if (value.includes("word") || value.includes("document")) return "documents";
    throw new Error(`no default app role for: ${target}`);
  }
}

/* ------------------------------------------------------------- installers */

export type PackageFormat =
  | "msix" | "msi" | "dmg" | "pkg" | "deb" | "rpm" | "appimage"
  | "flatpak" | "snap" | "apk" | "aab" | "ipa" | "pwa";

export interface InstallerRequest {
  appId: string;
  version: string;
  publisher: string;
  signed: boolean;
  notarised?: boolean;
  architecture: "x64" | "arm64" | "universal";
}

export interface InstallerPlan {
  os: OsFamily;
  format: PackageFormat;
  artifactName: string;
  signing: string[];
  installSteps: string[];
  uninstallSteps: string[];
  rollback: string[];
  verification: string[];
  blocked: string[];
}

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;

export class InstallerPlanner {
  plan(os: OsFamily, request: InstallerRequest): InstallerPlan {
    if (!OS_FAMILIES.includes(os)) throw new Error(`unknown OS family: ${os}`);
    if (!request.appId.trim()) throw new Error("an installer needs an app id");
    if (!SEMVER.test(request.version)) throw new Error(`installer version is not semver: ${request.version}`);
    if (!request.publisher.trim()) throw new Error("an installer needs a publisher");

    switch (os) {
      case "microsoft":
        return this.windows(request);
      case "apple":
        return this.macos(request);
      case "linux":
        return this.linux(request);
      case "android":
        return this.android(request);
      case "ios":
        return this.ios(request);
      case "google":
        return this.chromeos(request);
    }
  }

  private windows(request: InstallerRequest): InstallerPlan {
    return {
      os: "microsoft",
      format: "msix",
      artifactName: `${request.appId}_${request.version}_${request.architecture}.msix`,
      signing: [
        "Sign the MSIX with a trusted Authenticode certificate (signtool sign /fd SHA256).",
        "Timestamp the signature so it remains valid after the certificate expires.",
        "Publish the certificate thumbprint in the release manifest.",
      ],
      installSteps: [
        "Verify the MSIX signature and the SHA-256 in the release manifest.",
        "Add-AppxPackage -Path <artifact>.msix",
        "Register the app's protocol handlers and file associations.",
        "Create the Start menu entry and the optional desktop shortcut.",
      ],
      uninstallSteps: ["Remove-AppxPackage -Package <package-full-name>", "Remove per-user data only after an explicit choice."],
      rollback: ["Keep the previous MSIX staged.", "Add-AppxPackage -Path <previous>.msix", "Restore the previous association set."],
      verification: ["Get-AppxPackage <identity> reports the expected version.", "The app launches and its signature chain is valid."],
      blocked: request.signed ? [] : ["A stable Windows package must be Authenticode-signed before distribution."],
    };
  }

  private macos(request: InstallerRequest): InstallerPlan {
    return {
      os: "apple",
      format: "dmg",
      artifactName: `${request.appId}-${request.version}-${request.architecture}.dmg`,
      signing: [
        "codesign --deep --force --options runtime --sign 'Developer ID Application' <app>",
        "xcrun notarytool submit <dmg> --wait",
        "xcrun stapler staple <dmg>",
      ],
      installSteps: [
        "Verify the notarisation ticket and the SHA-256 in the release manifest.",
        "hdiutil attach <artifact>.dmg",
        "Copy the .app bundle to /Applications.",
        "hdiutil detach <mount>",
        "spctl --assess --type execute /Applications/<app>.app",
      ],
      uninstallSteps: ["Move the .app to the Trash.", "Remove ~/Library/Application Support/<app> only after an explicit choice."],
      rollback: ["Keep the previous .app bundle.", "Replace the current bundle and re-run spctl --assess."],
      verification: ["spctl --assess exits 0.", "The bundle version matches the release manifest."],
      blocked: request.signed && request.notarised
        ? []
        : ["macOS distribution requires a Developer ID signature and notarisation."],
    };
  }

  private linux(request: InstallerRequest): InstallerPlan {
    return {
      os: "linux",
      format: "deb",
      artifactName: `${request.appId}_${request.version}_${request.architecture}.deb`,
      signing: [
        "Sign the repository Release file with an offline GPG key.",
        "Ship the public key in /usr/share/keyrings and pin the repository.",
        "Publish the SHA-256 and the detached signature in the release manifest.",
      ],
      installSteps: [
        "Verify the repository signature and the package SHA-256.",
        "sudo apt install ./<artifact>.deb",
        "Install the desktop entry, icons and AppStream metadata.",
      ],
      uninstallSteps: ["sudo apt remove <package>", "Purge configuration only after an explicit choice."],
      rollback: ["Pin the previous version in the repository.", "sudo apt install <package>=<previous-version>"],
      verification: ["dpkg-query -W <package> reports the expected version.", "desktop-file-validate passes."],
      blocked: request.signed ? [] : ["A distribution repository must be GPG-signed."],
    };
  }

  private android(request: InstallerRequest): InstallerPlan {
    return {
      os: "android",
      format: request.signed ? "aab" : "apk",
      artifactName: `${request.appId}-${request.version}-${request.architecture}.${request.signed ? "aab" : "apk"}`,
      signing: [
        "Generate an upload key and store it outside the repository.",
        "apksigner sign --ks <keystore> --out <apk> <unsigned.apk>",
        "Upload the AAB to Play Console and enrol in Play App Signing.",
      ],
      installSteps: [
        "For a Play release, upload the AAB and let Play generate the split APKs.",
        "For a local test, adb install -r <artifact>.apk",
        "Grant only the permissions declared in the manifest.",
      ],
      uninstallSteps: ["adb uninstall <application-id>", "Clear app data only after an explicit choice."],
      rollback: ["Use Play Console staged rollout halt and the previous release track.", "For local tests, adb install -r <previous>.apk"],
      verification: ["apksigner verify --print-certs <apk>", "The versionCode increases monotonically."],
      blocked: request.signed ? [] : ["A Play release must be signed with an upload key."],
    };
  }

  private ios(request: InstallerRequest): InstallerPlan {
    return {
      os: "ios",
      format: "ipa",
      artifactName: `${request.appId}-${request.version}-${request.architecture}.ipa`,
      signing: [
        "Archive with Xcode and sign with an Apple Distribution certificate.",
        "Install the provisioning profile that matches the bundle id.",
        "Upload to App Store Connect or TestFlight.",
      ],
      installSteps: [
        "Distribute through TestFlight or the App Store; sideloading is not claimed.",
        "The device installs the signed IPA from the store.",
      ],
      uninstallSteps: ["Delete the app from the device.", "Remove its container only after an explicit choice."],
      rollback: ["Use App Store Connect to make the previous version available again."],
      verification: ["The provisioning profile and certificate match the bundle id.", "TestFlight installs the build on a registered device."],
      blocked: ["iOS installation requires Apple signing and a distribution channel; no sideloading claim is made."],
    };
  }

  private chromeos(request: InstallerRequest): InstallerPlan {
    return {
      os: "google",
      format: "pwa",
      artifactName: `${request.appId}-${request.version}.webmanifest`,
      signing: [
        "Serve the PWA over HTTPS with a valid certificate.",
        "Sign the service worker and the manifest hash in the release manifest.",
      ],
      installSteps: [
        "Open the HTTPS origin in Chrome.",
        "Install the PWA from the address bar or the Install App menu.",
        "Optionally publish the Android package to Play Store for ChromeOS.",
      ],
      uninstallSteps: ["Uninstall the PWA from the launcher.", "Clear the origin's storage only after an explicit choice."],
      rollback: ["Serve the previous manifest and service worker version.", "The service worker update activates on the next launch."],
      verification: ["Lighthouse PWA installability checks pass.", "The manifest id, start_url and icons resolve."],
      blocked: request.signed ? [] : ["A PWA release manifest must be signed before distribution."],
    };
  }
}
