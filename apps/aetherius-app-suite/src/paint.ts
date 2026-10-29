import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Paint / vector drawing core.
 *
 * Layers, shapes, z-order, undo/redo and SVG export. It is a document model,
 * not a raster editor: there is no brush engine, colour management or GPU
 * compositor. The host renders the SVG or rasterises it.
 */

export type ShapeKind = "rect" | "ellipse" | "line" | "text";

export interface Shape {
  id: string;
  kind: ShapeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  text?: string;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  shapes: Shape[];
}

export interface PaintOptions {
  ledger?: EventLedger;
  clock?: () => Date;
  width?: number;
  height?: number;
}

interface Snapshot {
  layers: Layer[];
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export class PaintDocument {
  private readonly layers: Layer[] = [];
  private readonly undoStack: Snapshot[] = [];
  private readonly redoStack: Snapshot[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  readonly width: number;
  readonly height: number;

  constructor(options: PaintOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.width = options.width ?? 1920;
    this.height = options.height ?? 1080;
    if (this.width <= 0 || this.height <= 0) throw new Error("the canvas needs a positive size");
    this.layers.push({ id: newId("layer"), name: "Background", visible: true, opacity: 1, shapes: [] });
  }

  addLayer(name: string): Layer {
    this.checkpoint();
    const layer: Layer = {
      id: newId("layer"),
      name: name.trim() || `Layer ${this.layers.length + 1}`,
      visible: true,
      opacity: 1,
      shapes: [],
    };
    this.layers.push(layer);
    this.ledger.append({ type: "paint.layer.added", actor: "paint", subject: layer.id });
    return structuredClone(layer);
  }

  layersList(): Layer[] {
    return this.layers.map((layer) => structuredClone(layer));
  }

  addShape(layerId: string, input: Omit<Shape, "id">): Shape {
    const layer = this.requireLayer(layerId);
    this.checkpoint();
    const shape: Shape = {
      ...input,
      id: newId("shape"),
      x: finite(input.x, "x"),
      y: finite(input.y, "y"),
      width: Math.max(0, finite(input.width, "width")),
      height: Math.max(0, finite(input.height, "height")),
      strokeWidth: Math.max(0, finite(input.strokeWidth, "strokeWidth")),
    };
    if (shape.kind === "text" && !shape.text?.trim()) throw new Error("a text shape needs text");
    layer.shapes.push(shape);
    this.ledger.append({ type: "paint.shape.added", actor: "paint", subject: shape.id, data: { layerId } });
    return structuredClone(shape);
  }

  updateShape(layerId: string, shapeId: string, patch: Partial<Omit<Shape, "id" | "kind">>): Shape {
    const layer = this.requireLayer(layerId);
    const shape = layer.shapes.find((entry) => entry.id === shapeId);
    if (!shape) throw new Error(`no shape: ${shapeId}`);
    this.checkpoint();
    const updated: Shape = {
      ...shape,
      ...patch,
      x: patch.x !== undefined ? finite(patch.x, "x") : shape.x,
      y: patch.y !== undefined ? finite(patch.y, "y") : shape.y,
      width: patch.width !== undefined ? Math.max(0, finite(patch.width, "width")) : shape.width,
      height: patch.height !== undefined ? Math.max(0, finite(patch.height, "height")) : shape.height,
      strokeWidth:
        patch.strokeWidth !== undefined ? Math.max(0, finite(patch.strokeWidth, "strokeWidth")) : shape.strokeWidth,
    };
    const index = layer.shapes.indexOf(shape);
    layer.shapes[index] = updated;
    return structuredClone(updated);
  }

  removeShape(layerId: string, shapeId: string): boolean {
    const layer = this.requireLayer(layerId);
    const index = layer.shapes.findIndex((entry) => entry.id === shapeId);
    if (index === -1) return false;
    this.checkpoint();
    layer.shapes.splice(index, 1);
    return true;
  }

  setLayerVisible(layerId: string, visible: boolean): Layer {
    const layer = this.requireLayer(layerId);
    this.checkpoint();
    layer.visible = visible;
    return structuredClone(layer);
  }

  setLayerOpacity(layerId: string, opacity: number): Layer {
    const layer = this.requireLayer(layerId);
    if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) throw new Error("opacity must be between 0 and 1");
    this.checkpoint();
    layer.opacity = opacity;
    return structuredClone(layer);
  }

  reorderLayer(layerId: string, toIndex: number): Layer[] {
    const index = this.layers.findIndex((layer) => layer.id === layerId);
    if (index === -1) throw new Error(`no layer: ${layerId}`);
    if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= this.layers.length) {
      throw new Error(`invalid layer index: ${toIndex}`);
    }
    this.checkpoint();
    const [layer] = this.layers.splice(index, 1);
    this.layers.splice(toIndex, 0, layer!);
    return this.layersList();
  }

  undo(): boolean {
    const snapshot = this.undoStack.pop();
    if (!snapshot) return false;
    this.redoStack.push(this.snapshot());
    this.restore(snapshot);
    this.ledger.append({ type: "paint.undo", actor: "paint", subject: "document" });
    return true;
  }

  redo(): boolean {
    const snapshot = this.redoStack.pop();
    if (!snapshot) return false;
    this.undoStack.push(this.snapshot());
    this.restore(snapshot);
    this.ledger.append({ type: "paint.redo", actor: "paint", subject: "document" });
    return true;
  }

  toSvg(): string {
    const body = this.layers
      .filter((layer) => layer.visible)
      .map((layer) => {
        const shapes = layer.shapes.map((shape) => this.shapeToSvg(shape)).join("\n    ");
        return `  <g id="${escapeXml(layer.id)}" opacity="${layer.opacity}">\n    ${shapes}\n  </g>`;
      })
      .join("\n");
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">`,
      body,
      "</svg>",
    ].join("\n");
  }

  private shapeToSvg(shape: Shape): string {
    const common = `fill="${escapeXml(shape.fill)}" stroke="${escapeXml(shape.stroke)}" stroke-width="${shape.strokeWidth}"`;
    if (shape.kind === "rect") {
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" ${common}/>`;
    }
    if (shape.kind === "ellipse") {
      return `<ellipse cx="${shape.x + shape.width / 2}" cy="${shape.y + shape.height / 2}" rx="${shape.width / 2}" ry="${shape.height / 2}" ${common}/>`;
    }
    if (shape.kind === "line") {
      return `<line x1="${shape.x}" y1="${shape.y}" x2="${shape.x + shape.width}" y2="${shape.y + shape.height}" ${common}/>`;
    }
    return `<text x="${shape.x}" y="${shape.y}" ${common}>${escapeXml(shape.text ?? "")}</text>`;
  }

  private checkpoint(): void {
    this.undoStack.push(this.snapshot());
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack.length = 0;
  }

  private snapshot(): Snapshot {
    return { layers: this.layers.map((layer) => structuredClone(layer)) };
  }

  private restore(snapshot: Snapshot): void {
    this.layers.length = 0;
    this.layers.push(...snapshot.layers.map((layer) => structuredClone(layer)));
  }

  private requireLayer(layerId: string): Layer {
    const layer = this.layers.find((entry) => entry.id === layerId);
    if (!layer) throw new Error(`no layer: ${layerId}`);
    return layer;
  }
}

export function newPaintDocument(options: PaintOptions = {}): PaintDocument {
  const document = new PaintDocument(options);
  void nowIso;
  return document;
}
