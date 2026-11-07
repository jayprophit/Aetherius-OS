import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Accessibility domain core.
 *
 * Text scaling, contrast, motion and announcement preferences, plus an
 * announcement queue for screen-reader style messaging. Pure state with an
 * audit ledger; nothing here touches the host display.
 */

export type ContrastMode = "normal" | "high" | "extra-high";
export type MotionMode = "full" | "reduced";

export interface AccessibilitySettings {
  textScale: number;
  contrast: ContrastMode;
  motion: MotionMode;
  screenReaderAnnounce: boolean;
  keyboardNavigation: boolean;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  message: string;
  priority: "polite" | "assertive";
  at: string;
}

export interface AccessibilityOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

const CONTRASTS: ContrastMode[] = ["normal", "high", "extra-high"];
const MOTIONS: MotionMode[] = ["full", "reduced"];

export class Accessibility {
  private settings: AccessibilitySettings = {
    textScale: 1,
    contrast: "normal",
    motion: "full",
    screenReaderAnnounce: false,
    keyboardNavigation: false,
    updatedAt: new Date(0).toISOString(),
  };
  private readonly announcements: Announcement[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: AccessibilityOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.settings.updatedAt = nowIso(this.clock);
  }

  getSettings(): AccessibilitySettings {
    return structuredClone(this.settings);
  }

  setTextScale(scale: number): AccessibilitySettings {
    if (!Number.isFinite(scale) || scale < 0.5 || scale > 3) {
      throw new Error("textScale must be between 0.5 and 3");
    }
    this.settings = { ...this.settings, textScale: scale, updatedAt: nowIso(this.clock) };
    this.ledger.append({ type: "accessibility.text_scale", actor: "accessibility", subject: "settings", data: { scale } });
    return this.getSettings();
  }

  setContrast(mode: ContrastMode): AccessibilitySettings {
    if (!CONTRASTS.includes(mode)) throw new Error(`contrast must be one of: ${CONTRASTS.join(", ")}`);
    this.settings = { ...this.settings, contrast: mode, updatedAt: nowIso(this.clock) };
    this.ledger.append({ type: "accessibility.contrast", actor: "accessibility", subject: "settings", data: { mode } });
    return this.getSettings();
  }

  setMotion(mode: MotionMode): AccessibilitySettings {
    if (!MOTIONS.includes(mode)) throw new Error(`motion must be one of: ${MOTIONS.join(", ")}`);
    this.settings = { ...this.settings, motion: mode, updatedAt: nowIso(this.clock) };
    this.ledger.append({ type: "accessibility.motion", actor: "accessibility", subject: "settings", data: { mode } });
    return this.getSettings();
  }

  setScreenReaderAnnounce(enabled: boolean): AccessibilitySettings {
    this.settings = { ...this.settings, screenReaderAnnounce: enabled === true, updatedAt: nowIso(this.clock) };
    this.ledger.append({ type: "accessibility.announce_setting", actor: "accessibility", subject: "settings", data: { enabled: enabled === true } });
    return this.getSettings();
  }

  setKeyboardNavigation(enabled: boolean): AccessibilitySettings {
    this.settings = { ...this.settings, keyboardNavigation: enabled === true, updatedAt: nowIso(this.clock) };
    this.ledger.append({ type: "accessibility.keyboard_nav", actor: "accessibility", subject: "settings", data: { enabled: enabled === true } });
    return this.getSettings();
  }

  /** Announce a message (queued for the screen-reader adapter). */
  announce(message: string, priority: "polite" | "assertive" = "polite"): Announcement {
    if (typeof message !== "string" || message.trim().length === 0) {
      throw new Error("an announcement needs a message");
    }
    if (priority !== "polite" && priority !== "assertive") {
      throw new Error("priority must be polite or assertive");
    }
    const announcement: Announcement = { id: newId("ann"), message: message.trim(), priority, at: nowIso(this.clock) };
    this.announcements.push(announcement);
    this.ledger.append({ type: "accessibility.announced", actor: "accessibility", subject: announcement.id, data: { priority } });
    return structuredClone(announcement);
  }

  announcementsFor(priority?: "polite" | "assertive"): Announcement[] {
    return this.announcements
      .filter((a) => priority === undefined || a.priority === priority)
      .map((a) => structuredClone(a));
  }

  clearAnnouncements(): void {
    this.announcements.length = 0;
  }
}
