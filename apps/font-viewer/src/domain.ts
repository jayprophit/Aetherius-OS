import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Font Viewer domain core.
 *
 * A catalogue of font families with weights/styles, preview renders and
 * install state. Actual glyph rendering and font file parsing are host
 * adapter concerns.
 */

export interface FontFamily {
  id: string;
  name: string;
  weights: number[];
  styles: string[];
  installed: boolean;
  addedAt: string;
}

export interface FontPreview {
  familyId: string;
  sampleText: string;
  fontSize: number;
  renderedAt: string;
}

export interface FontViewerOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class FontViewer {
  private readonly families = new Map<string, FontFamily>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: FontViewerOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addFamily(input: { name: string; weights: number[]; styles?: string[] }): FontFamily {
    if (typeof input.name !== "string" || input.name.trim().length === 0) {
      throw new Error("a font family needs a name");
    }
    const weights = [...new Set(input.weights)].filter((w) => Number.isInteger(w) && w >= 100 && w <= 900).sort((a, b) => a - b);
    if (weights.length === 0) throw new Error("a font family needs at least one valid weight (100-900)");
    const family: FontFamily = {
      id: newId("font"),
      name: input.name.trim(),
      weights,
      styles: [...new Set((input.styles ?? ["normal"]).map((s) => s.trim()).filter(Boolean))],
      installed: false,
      addedAt: nowIso(this.clock),
    };
    this.families.set(family.id, family);
    this.ledger.append({ type: "font.family_added", actor: "fonts", subject: family.id, data: { name: family.name } });
    return structuredClone(family);
  }

  setInstalled(familyId: string, installed: boolean): FontFamily {
    const family = this.require(familyId);
    family.installed = installed === true;
    this.families.set(familyId, family);
    this.ledger.append({ type: "font.install_changed", actor: "fonts", subject: familyId, data: { installed: installed === true } });
    return structuredClone(family);
  }

  preview(familyId: string, sampleText: string, fontSize: number): FontPreview {
    const family = this.require(familyId);
    if (typeof sampleText !== "string" || sampleText.trim().length === 0) {
      throw new Error("a preview needs sample text");
    }
    if (!Number.isFinite(fontSize) || fontSize <= 0 || fontSize > 200) {
      throw new Error("fontSize must be between 1 and 200");
    }
    return {
      familyId,
      sampleText: sampleText.trim(),
      fontSize,
      renderedAt: nowIso(this.clock),
    };
  }

  search(query: string): FontFamily[] {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return this.list();
    return [...this.families.values()]
      .filter((family) => family.name.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((family) => structuredClone(family));
  }

  list(installedOnly = false): FontFamily[] {
    return [...this.families.values()]
      .filter((family) => !installedOnly || family.installed)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((family) => structuredClone(family));
  }

  private require(familyId: string): FontFamily {
    const found = this.families.get(familyId);
    if (!found) throw new Error(`no font family: ${familyId}`);
    return structuredClone(found);
  }
}
