import { Buffer } from "node:buffer";
import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import type { AssetManifest } from "../../aetherius-app-suite/src/asset-exchange.ts";
import { sanitizeSvg, computeHash } from "../../aetherius-app-suite/src/asset-exchange.ts";
import { renderPng, canvasToScene } from "../../aetherius-renderer/src/domain.ts";

export type ShapeKind = "rect" | "circle" | "line" | "text" | "image";

export interface CanvasShape {
  id: string;
  kind: ShapeKind;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  src?: string;
  rotation?: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CanvasBoard {
  id: string;
  title: string;
  width: number;
  height: number;
  shapes: CanvasShape[];
  selectedIds: string[];
  createdAt: string;
  updatedAt: string;
  revision: number;
}

export interface CanvasOptions {
  ledger?: EventLedger;
  clock?: () => Date;
  storageDir?: string;
}

interface HistoryEntry {
  action: string;
  boardId: string;
  snapshot: CanvasBoard;
  timestamp: string;
}

export class Canvas {
  private readonly boards = new Map<string, CanvasBoard>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  private readonly storageDir: string;
  private readonly undoStack: HistoryEntry[] = [];
  private readonly redoStack: HistoryEntry[] = [];
  private readonly maxHistory = 50;

  constructor(options: CanvasOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.storageDir = options.storageDir ?? "./canvas-data";
  }

  createBoard(title: string, width = 1920, height = 1080): CanvasBoard {
    const now = nowIso(this.clock);
    const board: CanvasBoard = {
      id: newId("board"),
      title,
      width,
      height,
      shapes: [],
      selectedIds: [],
      createdAt: now,
      updatedAt: now,
      revision: 0,
    };
    this.boards.set(board.id, board);
    this.ledger.append({ type: "canvas.created", actor: "canvas", subject: board.id });
    this.persist();
    return board;
  }

  addShape(boardId: string, shape: Omit<CanvasShape, "id" | "createdAt" | "updatedAt" | "zIndex">): CanvasShape {
    const board = this.boards.get(boardId);
    if (!board) throw new Error("board not found");
    if (shape.locked) throw new Error("cannot add locked shape");

    const now = nowIso(this.clock);
    const s: CanvasShape = {
      ...shape,
      id: newId("shape"),
      zIndex: board.shapes.length,
      createdAt: now,
      updatedAt: now,
    };

    this.pushHistory(boardId, "addShape");
    board.shapes.push(s);
    board.updatedAt = now;
    board.revision += 1;
    this.ledger.append({ type: "canvas.shape.added", actor: "canvas", subject: s.id });
    this.persist();
    return s;
  }

  updateShape(boardId: string, shapeId: string, updates: Partial<Omit<CanvasShape, "id" | "createdAt">>): CanvasShape {
    const board = this.boards.get(boardId);
    if (!board) throw new Error("board not found");
    const shape = board.shapes.find((s) => s.id === shapeId);
    if (!shape) throw new Error("shape not found");
    if (shape.locked && updates.kind) throw new Error("cannot modify locked shape");

    this.pushHistory(boardId, "updateShape");

    if (updates.x !== undefined) shape.x = updates.x;
    if (updates.y !== undefined) shape.y = updates.y;
    if (updates.width !== undefined) shape.width = updates.width;
    if (updates.height !== undefined) shape.height = updates.height;
    if (updates.radius !== undefined) shape.radius = updates.radius;
    if (updates.text !== undefined) shape.text = updates.text;
    if (updates.src !== undefined) shape.src = updates.src;
    if (updates.rotation !== undefined) shape.rotation = updates.rotation;
    if (updates.visible !== undefined) shape.visible = updates.visible;
    if (updates.locked !== undefined) shape.locked = updates.locked;

    shape.updatedAt = nowIso(this.clock);
    board.updatedAt = nowIso(this.clock);
    board.revision += 1;
    this.ledger.append({ type: "canvas.shape.updated", actor: "canvas", subject: shapeId });
    this.persist();
    return shape;
  }

  removeShape(boardId: string, shapeId: string): void {
    const board = this.boards.get(boardId);
    if (!board) throw new Error("board not found");
    const idx = board.shapes.findIndex((s) => s.id === shapeId);
    if (idx === -1) throw new Error("shape not found");

    this.pushHistory(boardId, "removeShape");
    board.shapes.splice(idx, 1);
    this.reindexZ(board);
    board.updatedAt = nowIso(this.clock);
    board.revision += 1;
    this.ledger.append({ type: "canvas.shape.removed", actor: "canvas", subject: shapeId });
    this.persist();
  }

  reorderShape(boardId: string, shapeId: string, direction: "up" | "down" | "top" | "bottom"): void {
    const board = this.boards.get(boardId);
    if (!board) throw new Error("board not found");
    const idx = board.shapes.findIndex((s) => s.id === shapeId);
    if (idx === -1) throw new Error("shape not found");

    this.pushHistory(boardId, "reorderShape");
    const shape = board.shapes[idx];
    board.shapes.splice(idx, 1);

    let newIdx = idx;
    if (direction === "up") newIdx = Math.min(idx + 1, board.shapes.length);
    else if (direction === "down") newIdx = Math.max(idx - 1, 0);
    else if (direction === "top") newIdx = board.shapes.length;
    else if (direction === "bottom") newIdx = 0;

    board.shapes.splice(newIdx, 0, shape);
    this.reindexZ(board);
    board.updatedAt = nowIso(this.clock);
    board.revision += 1;
    this.ledger.append({ type: "canvas.shape.reordered", actor: "canvas", subject: shapeId });
    this.persist();
  }

  select(boardId: string, shapeIds: string[], additive = false): void {
    const board = this.boards.get(boardId);
    if (!board) throw new Error("board not found");

    if (!additive) board.selectedIds = [];
    for (const id of shapeIds) {
      if (board.shapes.some((s) => s.id === id) && !board.selectedIds.includes(id)) {
        board.selectedIds.push(id);
      }
    }
    board.updatedAt = nowIso(this.clock);
  }

  getBoard(boardId: string): CanvasBoard | undefined {
    return this.boards.get(boardId);
  }

  listBoards(): CanvasBoard[] {
    return Array.from(this.boards.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  undo(boardId: string): boolean {
    const board = this.boards.get(boardId);
    if (!board || this.undoStack.length === 0) return false;
    const entry = this.undoStack.pop()!;
    if (entry.boardId !== boardId) return false;

    this.redoStack.push({ action: entry.action, boardId: entry.boardId, snapshot: JSON.parse(JSON.stringify(board)), timestamp: nowIso(this.clock) });
    this.boards.set(boardId, JSON.parse(JSON.stringify(entry.snapshot)));
    this.persist();
    return true;
  }

  redo(boardId: string): boolean {
    const board = this.boards.get(boardId);
    if (!board || this.redoStack.length === 0) return false;
    const entry = this.redoStack.pop()!;
    if (entry.boardId !== boardId) return false;

    this.undoStack.push({ action: entry.action, boardId: entry.boardId, snapshot: JSON.parse(JSON.stringify(board)), timestamp: nowIso(this.clock) });
    this.boards.set(boardId, JSON.parse(JSON.stringify(entry.snapshot)));
    this.persist();
    return true;
  }

  svg(boardId: string): string {
    const board = this.boards.get(boardId);
    if (!board) throw new Error("board not found");

    const parts: string[] = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${board.width} ${board.height}" width="${board.width}" height="${board.height}">`,
      `  <title>${escapeXml(board.title)}</title>`,
    ];

    for (const shape of board.shapes) {
      if (!shape.visible) continue;
      const transform = shape.rotation ? ` transform="rotate(${shape.rotation} ${shape.x} ${shape.y})"` : "";
      switch (shape.kind) {
        case "rect":
          parts.push(`  <rect x="${shape.x}" y="${shape.y}" width="${shape.width ?? 0}" height="${shape.height ?? 0}"${transform} fill="none" stroke="black" stroke-width="2"/>`);
          break;
        case "circle":
          parts.push(`  <circle cx="${shape.x}" cy="${shape.y}" r="${shape.radius ?? 0}"${transform} fill="none" stroke="black" stroke-width="2"/>`);
          break;
        case "line":
          parts.push(`  <line x1="${shape.x}" y1="${shape.y}" x2="${shape.x + (shape.width ?? 0)}" y2="${shape.y + (shape.height ?? 0)}"${transform} stroke="black" stroke-width="2"/>`);
          break;
        case "text":
          parts.push(`  <text x="${shape.x}" y="${shape.y}"${transform}>${escapeXml(shape.text ?? "")}</text>`);
          break;
        case "image":
          if (shape.src) {
            parts.push(`  <image href="${escapeXml(shape.src)}" x="${shape.x}" y="${shape.y}" width="${shape.width ?? 0}" height="${shape.height ?? 0}"${transform}/>`);
          }
          break;
      }
    }

    parts.push("</svg>");
    return parts.join("\n");
  }

  json(boardId: string): string {
    const board = this.boards.get(boardId);
    if (!board) throw new Error("board not found");
    return JSON.stringify(board, null, 2);
  }

  exportAsset(boardId: string): { manifest: AssetManifest; svg: string } {
    const board = this.boards.get(boardId);
    if (!board) throw new Error("board not found");

    const rawSvg = this.svg(boardId);
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
        exporterVersion: "batch-23",
      },
      contentDimensions: {
        width: board.width,
        height: board.height,
      },
      sourceRelationship: {
        sourceId: boardId,
        sourceType: "canvas-board",
      },
      createdAt: nowIso(this.clock),
    };

    return { manifest, svg: sanitized };
  }

  renderPng(boardId: string): { manifest: AssetManifest; png: Uint8Array; snapshot: string } {
    const board = this.boards.get(boardId);
    if (!board) throw new Error("board not found");

    const scene = canvasToScene(board);
    const png = renderPng(scene);
    const pngBase64 = Buffer.from(png).toString("base64");
    const contentHash = computeHash(pngBase64);

    const manifest: AssetManifest = {
      id: newId("asset"),
      schemaVersion: "aetherius-asset-v1",
      mimeType: "image/png",
      contentHash,
      ownership: "aetherius-canvas",
      provenance: {
        sourceApp: "aetherius-canvas",
        exportedAt: nowIso(this.clock),
        exporterVersion: "batch-25",
      },
      contentDimensions: {
        width: board.width,
        height: board.height,
      },
      sourceRelationship: {
        sourceId: boardId,
        sourceType: "canvas-board",
      },
      createdAt: nowIso(this.clock),
    };

    return { manifest, png, snapshot: pngBase64 };
  }

  private pushHistory(boardId: string, action: string): void {
    const board = this.boards.get(boardId);
    if (!board) return;
    const snapshot: CanvasBoard = JSON.parse(JSON.stringify(board));
    this.undoStack.push({ action, boardId, snapshot, timestamp: nowIso(this.clock) });
    if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
    this.redoStack.length = 0;
  }

  private reindexZ(board: CanvasBoard): void {
    board.shapes.forEach((s, i) => (s.zIndex = i));
  }

  private persist(): void {
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true });
    }
    const all = Array.from(this.boards.values());
    writeFileSync(`${this.storageDir}/boards.json`, JSON.stringify(all, null, 2));
  }

  load(): void {
    if (!existsSync(this.storageDir)) return;
    const path = `${this.storageDir}/boards.json`;
    if (!existsSync(path)) return;
    const raw = readFileSync(path, "utf8");
    const data: CanvasBoard[] = JSON.parse(raw);
    this.boards.clear();
    for (const board of data) {
      this.boards.set(board.id, board);
    }
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
