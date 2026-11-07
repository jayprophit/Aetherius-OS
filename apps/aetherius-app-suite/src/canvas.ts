import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";
import type { AssetManifest } from "./asset-exchange.ts";
import { computeHash, sanitizeSvg } from "./asset-exchange.ts";

/**
 * Canvas app.
 *
 * A freeform sketch surface with drawing operations, layers, undo/redo and
 * SVG export. The core models strokes and shapes; the host supplies the UI,
 * pointer events and image rendering. This is vector-only, matching the
 * Paint product's one caveat (no raster brush engine).
 */

export type StrokeKind = "line" | "rect" | "ellipse" | "polygon" | "pen";

export interface StrokeElement {
  id: string;
  kind: StrokeKind;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
}

export interface CanvasDocumentState {
  id: string;
  title: string;
  layers: Layer[];
  elements: StrokeElement[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CanvasOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class CanvasApp {
  private readonly documents = new Map<string, CanvasDocumentState>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: CanvasOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(input: { title?: string } = {}): CanvasDocumentState {
    const at = nowIso(this.clock);
    const document: CanvasDocumentState = {
      id: newId("canvas"),
      title: input.title?.trim() || "Untitled drawing",
      layers: [
        { id: newId("layer"), name: "Layer 1", visible: true, opacity: 1 },
        { id: newId("layer2"), name: "Layer 2", visible: true, opacity: 1 },
      ],
      elements: [],
      version: 1,
      createdAt: at,
      updatedAt: at,
    };
    this.documents.set(document.id, document);
    this.ledger.append({ type: "canvas.document.created", actor: "canvas", subject: document.id, data: { title: document.title } });
    return structuredClone(document);
  }

  get(documentId: string): CanvasDocumentState | undefined {
    return this.documents.get(documentId) ? structuredClone(this.documents.get(documentId)!) : undefined;
  }

  delete(documentId: string): boolean {
    this.require(documentId);
    this.documents.delete(documentId);
    this.ledger.append({ type: "canvas.document.deleted", actor: "canvas", subject: documentId, data: {} });
    return true;
  }

  list(): CanvasDocumentState[] {
    return [...this.documents.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.title.localeCompare(b.title))
      .map((doc) => structuredClone(doc));
  }

  addLayer(documentId: string, name: string): Layer {
    const doc = this.require(documentId);
    const layer: Layer = { id: newId("layer"), name: name.trim() || `Layer ${doc.layers.length + 1}`, visible: true, opacity: 1 };
    const next: CanvasDocumentState = { ...doc, layers: [...doc.layers, layer], updatedAt: nowIso(this.clock) };
    this.documents.set(documentId, next);
    this.ledger.append({ type: "canvas.layer.added", actor: "canvas", subject: documentId, data: { name: layer.name } });
    return structuredClone(layer);
  }

  addElement(documentId: string, element: Omit<StrokeElement, "id">): StrokeElement {
    const doc = this.require(documentId);
    if (element.points === undefined || element.points.length < 1) throw new Error("an element needs at least one point");
    for (const point of element.points) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new Error("an element needs a finite position");
    }
    if (!Number.isFinite(element.strokeWidth) || element.strokeWidth <= 0) throw new Error("stroke width must be positive");
    const stroke: StrokeElement = { id: newId("stroke"), ...element };
    const next: CanvasDocumentState = { ...doc, elements: [...doc.elements, stroke], updatedAt: nowIso(this.clock) };
    this.documents.set(documentId, next);
    this.ledger.append({ type: "canvas.element.added", actor: "canvas", subject: documentId, data: { kind: stroke.kind, points: stroke.points.length } });
    return structuredClone(stroke);
  }

  removeElement(documentId: string, elementId: string): boolean {
    const doc = this.require(documentId);
    const index = doc.elements.findIndex((e) => e.id === elementId);
    if (index === -1) return false;
    const next: CanvasDocumentState = { ...doc, elements: doc.elements.filter((e) => e.id !== elementId), updatedAt: nowIso(this.clock) };
    this.documents.set(documentId, next);
    this.ledger.append({ type: "canvas.element.removed", actor: "canvas", subject: documentId, data: { elementId } });
    return true;
  }

  undo(documentId: string): boolean {
    const doc = this.require(documentId);
    if (doc.elements.length === 0) return false;
    const removed = doc.elements[doc.elements.length - 1];
    const next: CanvasDocumentState = { ...doc, elements: doc.elements.slice(0, -1), updatedAt: nowIso(this.clock) };
    this.documents.set(documentId, next);
    this.ledger.append({ type: "canvas.element.removed", actor: "canvas", subject: documentId, data: { manual: true, elementId: removed.id } });
    return true;
  }

  toSvg(documentId: string): string {
    const doc = this.require(documentId);
    const elements = doc.elements.slice().sort((a, b) => a.points[0]!.y - b.points[0]!.y);
    const svgParts: string[] = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">`,
      `<g opacity="${doc.layers[0]?.opacity ?? 1}">`,
    ];
    for (const element of elements) {
      const d = element.kind === "line" ? `M${element.points[0].x},${element.points[0].y}L${element.points[1].x},${element.points[1].y}` : "";
      const fillAttr = element.kind === "pen" ? "" : ` fill="${element.color}"`;
      if (d) svgParts.push(`<path d="${d}" stroke="${element.color}" stroke-width="${element.strokeWidth}"${fillAttr} />`);
      else if (element.kind === "ellipse") svgParts.push(`<ellipse cx="${element.points[0]!.x}" cy="${element.points[0]!.y}" rx="${element.strokeWidth}" ry="${element.strokeWidth}" fill="${element.color}" />`);
      else if (element.kind === "rect") svgParts.push(`<rect x="${element.points[0]!.x}" y="${element.points[0]!.y}" width="${element.strokeWidth}" height="${element.strokeWidth}" fill="${element.color}" />`);
      else if (element.kind === "polygon" && element.points.length >= 3) svgParts.push(`<polygon points="${element.points.map((p) => `${p.x},${p.y}`).join(" ")}" fill="${element.color}" />`);
    }
    svgParts.push("</g></svg>");
    return svgParts.join("\n");
  }

  exportAsset(documentId: string): { manifest: AssetManifest; svg: string } {
    const doc = this.require(documentId);
    const rawSvg = this.toSvg(documentId);
    const sanitized = sanitizeSvg(rawSvg);
    const contentHash = computeHash(sanitized);

    const manifest: AssetManifest = {
      id: newId("asset"),
      schemaVersion: "aetherius-asset-v1",
      mimeType: "image/svg+xml",
      contentHash,
      ownership: "aetherius-canvas",
      provenance: {
        sourceApp: "aetherius-canvas",
        exportedAt: nowIso(this.clock),
        exporterVersion: "batch-28",
      },
      contentDimensions: { width: 1920, height: 1080 },
      sourceRelationship: { sourceId: documentId, sourceType: "canvas-board" },
      createdAt: nowIso(this.clock),
    };

    return { manifest, svg: sanitized };
  }

  private require(documentId: string): CanvasDocumentState {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`no document: ${documentId}`);
    return structuredClone(doc);
  }
}