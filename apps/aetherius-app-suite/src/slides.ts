import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";
import type { AssetManifest } from "./asset-exchange.ts";
import { validatePath } from "./asset-exchange.ts";
import { SlideDeck, type SlideElement } from "./office.ts";

/**
 * Slides app.
 *
 * A slide-deck model with elements, notes, reorder and outline export.
 * The core uses the office SlideDeck; the host supplies UI, fonts and
 * rendering adapters.
 */

export interface SlideDeckState {
  id: string;
  title: string;
  slides: readonly SlideElement[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSlideInput {
  title?: string;
}

export interface SlideOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class SlidesApp {
  private readonly decks = new Map<string, SlideDeckState>();
  private readonly deckSessions = new Map<string, SlideDeck>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: SlideOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(input: CreateSlideInput = {}): SlideDeckState {
    const at = nowIso(this.clock);
    const title = input.title?.trim() || `Presentation ${this.decks.size + 1}`;
    const deck: SlideDeckState = {
      id: newId("deck"),
      title,
      slides: [],
      version: 1,
      createdAt: at,
      updatedAt: at,
    };
    this.decks.set(deck.id, deck);
    this.deckSessions.set(deck.id, new SlideDeck({ ledger: this.ledger, clock: this.clock }));
    this.ledger.append({ type: "slides.created", actor: "slides", subject: deck.id, data: { title: deck.title, slides: 0 } });
    return structuredClone(deck);
  }

  get(deckId: string): SlideDeckState | undefined {
    const deck = this.decks.get(deckId);
    return deck ? structuredClone(deck) : undefined;
  }

  delete(deckId: string): boolean {
    this.require(deckId);
    this.decks.delete(deckId);
    this.deckSessions.delete(deckId);
    this.ledger.append({ type: "slides.deleted", actor: "slides", subject: deckId, data: {} });
    return true;
  }

  list(): SlideDeckState[] {
    return [...this.decks.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.title.localeCompare(b.title))
      .map((deck) => structuredClone(deck));
  }

  /** Get the live slide-deck session for editing. */
  session(deckId: string): SlideDeck {
    this.require(deckId);
    if (!this.deckSessions.has(deckId)) {
      const session = new SlideDeck({ ledger: this.ledger, clock: this.clock });
      this.deckSessions.set(deckId, session);
    }
    return this.deckSessions.get(deckId)!;
  }

  /** Persist a session's current state back to storage. */
  commit(deckId: string): SlideDeckState {
    const deck = this.require(deckId);
    const session = this.session(deckId);
    const outline = session.toOutline();
    const next: SlideDeckState = {
      ...deck,
      slides: session.slidesList().map((s) => ({
        id: s.id,
        kind: "title",
        text: s.title,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      })),
      version: deck.version + 1,
      updatedAt: nowIso(this.clock),
    };
    this.decks.set(deckId, next);
    this.ledger.append({
      type: "slides.updated",
      actor: "slides",
      subject: deckId,
      data: { version: next.version, slideCount: next.slides.length },
    });
    return structuredClone(next);
  }

  /** Outline export. */
  toOutline(deckId: string): string {
    const deck = this.require(deckId);
    const session = this.session(deckId);
    return session.toOutline();
  }

  importAsset(deckId: string, slideId: string, manifest: AssetManifest, snapshot: string, placement: { x: number; y: number; width: number; height: number }): SlideElement {
    this.require(deckId);
    const session = this.session(deckId);
    const slide = session.slidesList().find((s) => s.id === slideId);
    if (!slide) throw new Error(`no slide: ${slideId}`);

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

    const element: SlideElement = {
      id: newId("element"),
      kind: "asset",
      text: manifest.id,
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
      assetId: manifest.id,
      assetSnapshot: snapshot,
    };

    slide.elements.push(element);
    return structuredClone(element);
  }

  private require(deckId: string): SlideDeckState {
    const deck = this.decks.get(deckId);
    if (!deck) throw new Error(`no deck: ${deckId}`);
    return structuredClone(deck);
  }
}