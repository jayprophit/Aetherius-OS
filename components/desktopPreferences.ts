// Shared in-shell preferences for desktop organisation, widgets, windows,
// input and the Genesis Human agent. Every key is a localStorage JSON blob
// under the `aetherius.` namespace. Components read on mount and listen for
// `aetherius:prefs` so a Settings page change applies live without a reload.
// Nothing here touches OS-level or hardware settings: the browser preview can
// only control its own shell, and pages say so honestly.

export const PREFS_EVENT = "aetherius:prefs";

export type DesktopPrefs = {
  iconSize: "small" | "medium" | "large";
  snapToGrid: boolean;
  autoArrange: boolean;
  sortBy: "none" | "name" | "type";
  groupBy: "none" | "type" | "firstLetter";
  showIconLabels: boolean;
  locked: boolean;
  wallpaper: string; // gradient CSS or URL; empty = default gradient
};

export const DEFAULT_DESKTOP_PREFS: DesktopPrefs = {
  iconSize: "medium",
  snapToGrid: true,
  autoArrange: false,
  sortBy: "none",
  groupBy: "none",
  showIconLabels: true,
  locked: false,
  wallpaper: "",
};

export type WidgetId = "weather" | "calendar" | "system";

export type WidgetPlacement = {
  x: number;
  y: number;
  size: "S" | "M" | "L";
  visible: boolean;
};

export type WidgetPrefs = Record<WidgetId, WidgetPlacement>;

export const DEFAULT_WIDGET_PREFS: WidgetPrefs = {
  weather: { x: 24, y: 24, size: "S", visible: true },
  calendar: { x: 24, y: 180, size: "S", visible: true },
  system: { x: 24, y: 336, size: "S", visible: true },
};

export type WindowPrefs = {
  defaultSize: "compact" | "standard" | "large";
  snapToEdges: boolean;
  animations: boolean;
};

export const DEFAULT_WINDOW_PREFS: WindowPrefs = {
  defaultSize: "standard",
  snapToEdges: true,
  animations: true,
};

export type InputPrefs = {
  longPressMs: number; // touch context-menu hold duration
  dragThresholdPx: number; // mouse drag vs click threshold
  touchTargets: "standard" | "large";
  showKeyboardHints: boolean;
};

export const DEFAULT_INPUT_PREFS: InputPrefs = {
  longPressMs: 500,
  dragThresholdPx: 5,
  touchTargets: "standard",
  showKeyboardHints: true,
};

export type GenesisPrefs = {
  speakReplies: boolean;
  listenWithMic: boolean;
  enableCamera: boolean;
  preferLocalModel: boolean;
  showResearchPanel: boolean;
};

export const DEFAULT_GENESIS_PREFS: GenesisPrefs = {
  speakReplies: true,
  listenWithMic: false,
  enableCamera: false,
  preferLocalModel: true,
  showResearchPanel: false,
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem("aetherius." + key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem("aetherius." + key, JSON.stringify(value));
  } catch {
    // storage may be blocked (private mode); the in-memory value still applies
  }
  try {
    window.dispatchEvent(new CustomEvent(PREFS_EVENT, { detail: { section: key } }));
  } catch {
    // non-DOM environment (tests): ignore
  }
}

export const desktopPrefs = {
  read: (): DesktopPrefs => readJson("desktop", DEFAULT_DESKTOP_PREFS),
  write: (prefs: DesktopPrefs): void => writeJson("desktop", prefs),
};

export const widgetPrefs = {
  read: (): WidgetPrefs => {
    try {
      const raw = localStorage.getItem("aetherius.widgets");
      if (!raw) return { ...DEFAULT_WIDGET_PREFS };
      const parsed = JSON.parse(raw) as Partial<WidgetPrefs>;
      return {
        weather: { ...DEFAULT_WIDGET_PREFS.weather, ...(parsed.weather ?? {}) },
        calendar: { ...DEFAULT_WIDGET_PREFS.calendar, ...(parsed.calendar ?? {}) },
        system: { ...DEFAULT_WIDGET_PREFS.system, ...(parsed.system ?? {}) },
      };
    } catch {
      return { ...DEFAULT_WIDGET_PREFS };
    }
  },
  write: (prefs: WidgetPrefs): void => writeJson("widgets", prefs),
};

export const windowPrefs = {
  read: (): WindowPrefs => readJson("windows", DEFAULT_WINDOW_PREFS),
  write: (prefs: WindowPrefs): void => writeJson("windows", prefs),
};

export const inputPrefs = {
  read: (): InputPrefs => readJson("input", DEFAULT_INPUT_PREFS),
  write: (prefs: InputPrefs): void => writeJson("input", prefs),
};

export const genesisPrefs = {
  read: (): GenesisPrefs => readJson("genesis", DEFAULT_GENESIS_PREFS),
  write: (prefs: GenesisPrefs): void => writeJson("genesis", prefs),
};
