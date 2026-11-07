import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import type { AssetManifest, AssetRecord } from "../../aetherius-app-suite/src/asset-exchange.ts";
import { validatePath } from "../../aetherius-app-suite/src/asset-exchange.ts";

export interface SlideElement {
  id: string;
  kind: "title" | "text" | "image" | "asset";
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  assetId?: string;
  assetSnapshot?: string;
}

export interface Slide {
  id: string;
  title: string;
  elements: SlideElement[];
  notes: string;
  order: number;
}

export interface Deck {
  id: string;
  name: string;
  slides: Slide[];
  assets: AssetManifest[];
  createdAt: string;
  updatedAt: string;
}

export interface SlidesOptions {
  ledger?: EventLedger;
  clock?: () => Date;
  storageDir?: string;
}

export class Slides {
  private readonly decks = new Map<string, Deck>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  private readonly storageDir: string;

  constructor(options: SlidesOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.storageDir = options.storageDir ?? "./slides-data";
  }

  createDeck(name: string): Deck {
    const now = nowIso(this.clock);
    const deck: Deck = {
      id: newId("deck"),
      name,
      slides: [],
      assets: [],
      createdAt: now,
      updatedAt: now,
    };
    this.decks.set(deck.id, deck);
    this.ledger.append({ type: "slides.created", actor: "slides", subject: deck.id });
    this.persist();
    return deck;
  }

  addSlide(deckId: string, title: string): Slide {
    const deck = this.decks.get(deckId);
    if (!deck) throw new Error("deck not found");
    const slide: Slide = {
      id: newId("slide"),
      title,
      elements: [],
      notes: "",
      order: deck.slides.length,
    };
    deck.slides.push(slide);
    deck.updatedAt = nowIso(this.clock);
    this.ledger.append({ type: "slides.slide.added", actor: "slides", subject: slide.id });
    this.persist();
    return slide;
  }

  removeSlide(deckId: string, slideId: string): void {
    const deck = this.decks.get(deckId);
    if (!deck) throw new Error("deck not found");
    const idx = deck.slides.findIndex((s) => s.id === slideId);
    if (idx === -1) throw new Error("slide not found");
    deck.slides.splice(idx, 1);
    // Reorder remaining slides
    deck.slides.forEach((s, i) => (s.order = i));
    deck.updatedAt = nowIso(this.clock);
    this.ledger.append({ type: "slides.slide.removed", actor: "slides", subject: slideId });
    this.persist();
  }

  reorderSlide(deckId: string, slideId: string, newOrder: number): void {
    const deck = this.decks.get(deckId);
    if (!deck) throw new Error("deck not found");
    const idx = deck.slides.findIndex((s) => s.id === slideId);
    if (idx === -1) throw new Error("slide not found");
    if (newOrder < 0 || newOrder >= deck.slides.length) throw new Error("invalid order");
    const [slide] = deck.slides.splice(idx, 1);
    deck.slides.splice(newOrder, 0, slide);
    deck.slides.forEach((s, i) => (s.order = i));
    deck.updatedAt = nowIso(this.clock);
    this.ledger.append({ type: "slides.slide.reordered", actor: "slides", subject: slideId });
    this.persist();
  }

  addElement(deckId: string, slideId: string, element: Omit<SlideElement, "id">): SlideElement {
    const deck = this.decks.get(deckId);
    if (!deck) throw new Error("deck not found");
    const slide = deck.slides.find((s) => s.id === slideId);
    if (!slide) throw new Error("slide not found");
    const el: SlideElement = { ...element, id: newId("el") };
    slide.elements.push(el);
    deck.updatedAt = nowIso(this.clock);
    this.ledger.append({ type: "slides.element.added", actor: "slides", subject: el.id });
    this.persist();
    return el;
  }

  updateElement(deckId: string, slideId: string, elementId: string, updates: Partial<SlideElement>): SlideElement {
    const deck = this.decks.get(deckId);
    if (!deck) throw new Error("deck not found");
    const slide = deck.slides.find((s) => s.id === slideId);
    if (!slide) throw new Error("slide not found");
    const el = slide.elements.find((e) => e.id === elementId);
    if (!el) throw new Error("element not found");
    Object.assign(el, updates);
    deck.updatedAt = nowIso(this.clock);
    this.ledger.append({ type: "slides.element.updated", actor: "slides", subject: elementId });
    this.persist();
    return el;
  }

  removeElement(deckId: string, slideId: string, elementId: string): void {
    const deck = this.decks.get(deckId);
    if (!deck) throw new Error("deck not found");
    const slide = deck.slides.find((s) => s.id === slideId);
    if (!slide) throw new Error("slide not found");
    const idx = slide.elements.findIndex((e) => e.id === elementId);
    if (idx === -1) throw new Error("element not found");
    slide.elements.splice(idx, 1);
    deck.updatedAt = nowIso(this.clock);
    this.ledger.append({ type: "slides.element.removed", actor: "slides", subject: elementId });
    this.persist();
  }

  setNotes(deckId: string, slideId: string, notes: string): void {
    const deck = this.decks.get(deckId);
    if (!deck) throw new Error("deck not found");
    const slide = deck.slides.find((s) => s.id === slideId);
    if (!slide) throw new Error("slide not found");
    slide.notes = notes;
    deck.updatedAt = nowIso(this.clock);
    this.ledger.append({ type: "slides.notes.updated", actor: "slides", subject: slideId });
    this.persist();
  }

  importAsset(deckId: string, slideId: string, manifest: AssetManifest, snapshot: string, placement: { x: number; y: number; width: number; height: number }): SlideElement {
    const deck = this.decks.get(deckId);
    if (!deck) throw new Error("deck not found");
    const slide = deck.slides.find((s) => s.id === slideId);
    if (!slide) throw new Error("slide not found");

    if (manifest.schemaVersion !== "aetherius-asset-v1") {
      throw new Error(`unsupported asset schema version: ${manifest.schemaVersion}`);
    }
    if (!manifest.contentHash || manifest.contentHash.length !== 64) {
      throw new Error("asset contentHash is missing or invalid");
    }
    validatePath(manifest.id);
    if (manifest.sourceRelationship?.sourceType === "external") {
      throw new Error("external asset sources are not allowed");
    }

    const existing = deck.assets.find((a) => a.id === manifest.id);
    if (!existing) {
      deck.assets.push(structuredClone(manifest));
    } else if (existing.contentHash !== manifest.contentHash) {
      throw new Error(`asset ${manifest.id} already imported with different contentHash`);
    }

    const el: SlideElement = {
      id: newId("el"),
      kind: "asset",
      text: manifest.id,
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
      assetId: manifest.id,
      assetSnapshot: snapshot,
    };

    slide.elements.push(el);
    deck.updatedAt = nowIso(this.clock);
    this.ledger.append({ type: "slides.asset.imported", actor: "slides", subject: manifest.id });
    this.persist();
    return el;
  }

  importRasterAsset(deckId: string, slideId: string, manifest: AssetManifest, pngBase64: string, placement: { x: number; y: number; width: number; height: number }): SlideElement {
    if (manifest.mimeType !== "image/png") {
      throw new Error("raster asset import expects image/png manifest");
    }
    return this.importAsset(deckId, slideId, manifest, pngBase64, placement);
  }

  getAsset(deckId: string, assetId: string): AssetManifest | undefined {
    const deck = this.decks.get(deckId);
    if (!deck) return undefined;
    const asset = deck.assets.find((a) => a.id === assetId);
    return asset ? structuredClone(asset) : undefined;
  }

  listAssets(deckId: string): AssetManifest[] {
    const deck = this.decks.get(deckId);
    if (!deck) return [];
    return deck.assets.map((a) => structuredClone(a));
  }

  getDeck(deckId: string): Deck | undefined {
    return this.decks.get(deckId);
  }

  listDecks(): Deck[] {
    return Array.from(this.decks.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  json(deckId: string): string {
    const deck = this.decks.get(deckId);
    if (!deck) throw new Error("deck not found");
    return JSON.stringify(deck, null, 2);
  }

  private persist(): void {
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true });
    }
    const all = Array.from(this.decks.values());
    writeFileSync(`${this.storageDir}/decks.json`, JSON.stringify(all, null, 2));
  }

  load(): void {
    if (!existsSync(this.storageDir)) return;
    const path = `${this.storageDir}/decks.json`;
    if (!existsSync(path)) return;
    const raw = readFileSync(path, "utf8");
    const data: Deck[] = JSON.parse(raw);
    this.decks.clear();
    for (const deck of data) {
      this.decks.set(deck.id, deck);
    }
  }
}
