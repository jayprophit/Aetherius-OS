import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * On-Screen Keyboard domain core.
 *
 * Layouts, language packs, themes and typing prediction. Key presses are
 * recorded as text output; the actual input injection is a host adapter
 * concern.
 */

export type KeyType = "letter" | "digit" | "symbol" | "space" | "enter" | "backspace" | "modifier";

export interface Key {
  label: string;
  type: KeyType;
}

export interface KeyboardLayout {
  id: string;
  name: string;
  rows: Key[][];
  language: string;
}

export interface KeyboardTheme {
  id: string;
  name: string;
  dark: boolean;
}

export interface KeyboardOptions {
  ledger?: EventLedger;
  clock?: () => Date;
  dictionary?: string[];
}

const KEY_TYPES: KeyType[] = ["letter", "digit", "symbol", "space", "enter", "backspace", "modifier"];

export class OnScreenKeyboard {
  private readonly layouts = new Map<string, KeyboardLayout>();
  private readonly themes = new Map<string, KeyboardTheme>();
  private activeLayoutId: string | null = null;
  private activeThemeId: string | null = null;
  private output = "";
  private readonly dictionary: string[];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: KeyboardOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.dictionary = [...new Set((options.dictionary ?? []).map((word) => word.trim().toLowerCase()).filter(Boolean))];
  }

  addLayout(input: { name: string; rows: Key[][]; language?: string }): KeyboardLayout {
    if (typeof input.name !== "string" || input.name.trim().length === 0) {
      throw new Error("a layout needs a name");
    }
    if (!Array.isArray(input.rows) || input.rows.length === 0) {
      throw new Error("a layout needs at least one row");
    }
    for (const row of input.rows) {
      if (!Array.isArray(row) || row.length === 0) throw new Error("a row needs at least one key");
      for (const key of row) {
        if (typeof key.label !== "string" || key.label.length === 0) throw new Error("a key needs a label");
        if (!KEY_TYPES.includes(key.type)) throw new Error(`key type must be one of: ${KEY_TYPES.join(", ")}`);
      }
    }
    const layout: KeyboardLayout = {
      id: newId("layout"),
      name: input.name.trim(),
      rows: input.rows.map((row) => row.map((key) => ({ ...key }))),
      language: (input.language ?? "en").trim() || "en",
    };
    this.layouts.set(layout.id, layout);
    if (this.activeLayoutId === null) this.activeLayoutId = layout.id;
    return structuredClone(layout);
  }

  addTheme(input: { name: string; dark?: boolean }): KeyboardTheme {
    if (typeof input.name !== "string" || input.name.trim().length === 0) {
      throw new Error("a theme needs a name");
    }
    const theme: KeyboardTheme = { id: newId("theme"), name: input.name.trim(), dark: input.dark === true };
    this.themes.set(theme.id, theme);
    if (this.activeThemeId === null) this.activeThemeId = theme.id;
    return structuredClone(theme);
  }

  setActiveLayout(layoutId: string): void {
    if (!this.layouts.has(layoutId)) throw new Error(`no layout: ${layoutId}`);
    this.activeLayoutId = layoutId;
  }

  setActiveTheme(themeId: string): void {
    if (!this.themes.has(themeId)) throw new Error(`no theme: ${themeId}`);
    this.activeThemeId = themeId;
  }

  press(keyLabel: string): string {
    if (typeof keyLabel !== "string" || keyLabel.length === 0) throw new Error("a press needs a key label");
    const layout = this.layouts.get(this.activeLayoutId ?? "");
    if (!layout) throw new Error("no active layout");
    const key = layout.rows.flat().find((candidate) => candidate.label === keyLabel);
    if (!key) throw new Error(`no key: ${keyLabel}`);
    switch (key.type) {
      case "backspace":
        this.output = this.output.slice(0, -1);
        break;
      case "space":
        this.output += " ";
        break;
      case "enter":
        this.output += "\n";
        break;
      case "letter":
      case "digit":
      case "symbol":
        this.output += key.label;
        break;
      case "modifier":
        break;
    }
    this.ledger.append({ type: "keyboard.pressed", actor: "keyboard", subject: key.label === " " ? "space" : key.label || "key", data: { type: key.type } });
    return this.output;
  }

  /** Prediction for the current word being typed. */
  predict(limit = 5): string[] {
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error("limit must be between 1 and 50");
    const current = this.output.split(/\s+/).pop()?.toLowerCase() ?? "";
    if (current.length < 2) return [];
    return this.dictionary.filter((word) => word.startsWith(current) && word !== current).slice(0, limit);
  }

  outputText(): string {
    return this.output;
  }

  clearOutput(): void {
    this.output = "";
  }

  layoutsList(): KeyboardLayout[] {
    return [...this.layouts.values()].map((layout) => structuredClone(layout));
  }
}
