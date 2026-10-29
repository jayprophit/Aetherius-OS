import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";
import { evaluate } from "./calculator.ts";

/**
 * Office cores: a writer document, a spreadsheet and a slide deck.
 *
 * These are document models with deterministic operations and exports. They
 * are not a full word processor, a calculation engine with all spreadsheet
 * functions, or a presentation renderer. The host supplies the UI, fonts and
 * file-format adapters.
 */

export type BlockKind = "heading" | "paragraph" | "bullet" | "code";

export interface DocBlock {
  id: string;
  kind: BlockKind;
  text: string;
  level?: number;
}

export interface SheetCell {
  ref: string;
  raw: string;
  value: number | string;
  error?: string;
}

export interface SlideElement {
  id: string;
  kind: "title" | "text" | "image";
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Slide {
  id: string;
  title: string;
  elements: SlideElement[];
  notes: string;
}

export interface OfficeOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

function columnIndex(column: string): number {
  let value = 0;
  for (const character of column) value = value * 26 + (character.charCodeAt(0) - 64);
  return value;
}

function normaliseRef(ref: string): string {
  const match = /^([A-Z]+)([1-9][0-9]*)$/.exec(ref.trim().toUpperCase());
  if (!match) throw new Error(`invalid cell reference: ${ref}`);
  return `${match[1]}${match[2]}`;
}

export class WriterDocument {
  private readonly blocks: DocBlock[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: OfficeOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  append(kind: BlockKind, text: string, level?: number): DocBlock {
    if (!text.trim()) throw new Error("a block needs text");
    if (kind === "heading" && level !== undefined && (level < 1 || level > 6)) {
      throw new Error("a heading level must be between 1 and 6");
    }
    const block: DocBlock = { id: newId("block"), kind, text, level: kind === "heading" ? level ?? 1 : undefined };
    this.blocks.push(block);
    this.ledger.append({ type: "writer.block.added", actor: "writer", subject: block.id });
    return structuredClone(block);
  }

  update(blockId: string, text: string): DocBlock {
    const block = this.blocks.find((entry) => entry.id === blockId);
    if (!block) throw new Error(`no block: ${blockId}`);
    if (!text.trim()) throw new Error("a block needs text");
    block.text = text;
    return structuredClone(block);
  }

  remove(blockId: string): boolean {
    const index = this.blocks.findIndex((entry) => entry.id === blockId);
    if (index === -1) return false;
    this.blocks.splice(index, 1);
    return true;
  }

  move(blockId: string, toIndex: number): DocBlock[] {
    const index = this.blocks.findIndex((entry) => entry.id === blockId);
    if (index === -1) throw new Error(`no block: ${blockId}`);
    if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= this.blocks.length) {
      throw new Error(`invalid block index: ${toIndex}`);
    }
    const [block] = this.blocks.splice(index, 1);
    this.blocks.splice(toIndex, 0, block!);
    return this.blocksList();
  }

  blocksList(): DocBlock[] {
    return this.blocks.map((block) => structuredClone(block));
  }

  wordCount(): number {
    return this.blocks
      .filter((block) => block.kind !== "code")
      .map((block) => block.text.trim().split(/\s+/).filter(Boolean).length)
      .reduce((total, count) => total + count, 0);
  }

  toMarkdown(): string {
    return this.blocks
      .map((block) => {
        if (block.kind === "heading") return `${"#".repeat(block.level ?? 1)} ${block.text}`;
        if (block.kind === "bullet") return `- ${block.text}`;
        if (block.kind === "code") return `\`\`\`\n${block.text}\n\`\`\``;
        return block.text;
      })
      .join("\n\n");
  }
}

export class Spreadsheet {
  private readonly cells = new Map<string, SheetCell>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  private cycleDetected = false;

  constructor(options: OfficeOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  set(ref: string, raw: string | number): SheetCell {
    const key = normaliseRef(ref);
    const text = String(raw);
    if (text.startsWith("=")) {
      const cell: SheetCell = { ref: key, raw: text, value: 0 };
      this.cells.set(key, cell);
      this.recalculate();
      this.ledger.append({ type: "sheet.cell.set", actor: "sheet", subject: key });
      return structuredClone(this.cells.get(key)!);
    }
    const numeric = typeof raw === "number" ? raw : Number(text);
    const cell: SheetCell = {
      ref: key,
      raw: text,
      value: text.trim() !== "" && Number.isFinite(numeric) ? numeric : text,
    };
    this.cells.set(key, cell);
    this.recalculate();
    this.ledger.append({ type: "sheet.cell.set", actor: "sheet", subject: key });
    return structuredClone(this.cells.get(key)!);
  }

  get(ref: string): SheetCell | undefined {
    const cell = this.cells.get(normaliseRef(ref));
    return cell ? structuredClone(cell) : undefined;
  }

  range(from: string, to: string): SheetCell[] {
    const start = /^([A-Z]+)([1-9][0-9]*)$/.exec(normaliseRef(from))!;
    const end = /^([A-Z]+)([1-9][0-9]*)$/.exec(normaliseRef(to))!;
    const startColumn = columnIndex(start[1]!);
    const endColumn = columnIndex(end[1]!);
    const startRow = Number(start[2]);
    const endRow = Number(end[2]);
    const cells: SheetCell[] = [];
    for (let row = startRow; row <= endRow; row += 1) {
      for (let column = startColumn; column <= endColumn; column += 1) {
        const ref = `${columnName(column)}${row}`;
        const cell = this.cells.get(ref);
        if (cell) cells.push(structuredClone(cell));
      }
    }
    return cells;
  }

  remove(ref: string): boolean {
    const key = normaliseRef(ref);
    const existed = this.cells.delete(key);
    if (existed) this.recalculate();
    return existed;
  }

  recalculate(): void {
    for (const cell of this.cells.values()) {
      this.cycleDetected = false;
      this.compute(cell.ref, new Set());
    }
  }

  toCsv(): string {
    const populated = [...this.cells.values()];
    if (populated.length === 0) return "";
    const rows = Math.max(...populated.map((cell) => Number(/([0-9]+)$/.exec(cell.ref)![1])));
    const columns = Math.max(...populated.map((cell) => columnIndex(/^([A-Z]+)/.exec(cell.ref)![1])));
    const lines: string[] = [];
    for (let row = 1; row <= rows; row += 1) {
      const values: string[] = [];
      for (let column = 1; column <= columns; column += 1) {
        const cell = this.cells.get(`${columnName(column)}${row}`);
        const value = cell ? String(cell.value) : "";
        values.push(/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
      }
      lines.push(values.join(","));
    }
    return lines.join("\n");
  }

  private compute(ref: string, visiting: Set<string>): number | string {
    const cell = this.cells.get(ref);
    if (!cell) return 0;
    if (!cell.raw.startsWith("=")) return cell.value;
    if (visiting.has(ref)) {
      cell.error = "circular reference";
      cell.value = 0;
      this.cycleDetected = true;
      return 0;
    }
    visiting.add(ref);
    try {
      const expression = cell.raw.slice(1).replace(/\b([A-Z]+[1-9][0-9]*)\b/g, (token) => {
        const value = this.compute(token, visiting);
        if (typeof value !== "number") throw new Error(`cell ${token} is not numeric`);
        return `(${value})`;
      });
      const value = evaluate(expression);
      if (this.cycleDetected) {
        cell.error = "circular reference";
        cell.value = 0;
        return 0;
      }
      cell.value = value;
      cell.error = undefined;
      return value;
    } catch (error) {
      cell.error = (error as Error).message;
      cell.value = 0;
      return 0;
    } finally {
      visiting.delete(ref);
    }
  }
}

export class SlideDeck {
  private readonly slides: Slide[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: OfficeOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addSlide(title: string): Slide {
    const slide: Slide = {
      id: newId("slide"),
      title: title.trim() || `Slide ${this.slides.length + 1}`,
      elements: [],
      notes: "",
    };
    this.slides.push(slide);
    this.ledger.append({ type: "slides.slide.added", actor: "slides", subject: slide.id });
    return structuredClone(slide);
  }

  addElement(
    slideId: string,
    input: Omit<SlideElement, "id">,
  ): SlideElement {
    const slide = this.requireSlide(slideId);
    if (!Number.isFinite(input.x) || !Number.isFinite(input.y)) throw new Error("an element needs a finite position");
    if (input.width <= 0 || input.height <= 0) throw new Error("an element needs a positive size");
    const element: SlideElement = { ...input, id: newId("element") };
    slide.elements.push(element);
    return structuredClone(element);
  }

  setNotes(slideId: string, notes: string): Slide {
    const slide = this.requireSlide(slideId);
    slide.notes = notes;
    return structuredClone(slide);
  }

  moveSlide(slideId: string, toIndex: number): Slide[] {
    const index = this.slides.findIndex((slide) => slide.id === slideId);
    if (index === -1) throw new Error(`no slide: ${slideId}`);
    if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= this.slides.length) {
      throw new Error(`invalid slide index: ${toIndex}`);
    }
    const [slide] = this.slides.splice(index, 1);
    this.slides.splice(toIndex, 0, slide!);
    return this.slidesList();
  }

  removeSlide(slideId: string): boolean {
    const index = this.slides.findIndex((slide) => slide.id === slideId);
    if (index === -1) return false;
    this.slides.splice(index, 1);
    return true;
  }

  slidesList(): Slide[] {
    return this.slides.map((slide) => structuredClone(slide));
  }

  toOutline(): string {
    return this.slides
      .map((slide, index) => {
        const elements = slide.elements.map((element) => `  - ${element.kind}: ${element.text}`).join("\n");
        return `${index + 1}. ${slide.title}${elements ? `\n${elements}` : ""}`;
      })
      .join("\n");
  }

  private requireSlide(slideId: string): Slide {
    const slide = this.slides.find((entry) => entry.id === slideId);
    if (!slide) throw new Error(`no slide: ${slideId}`);
    return slide;
  }
}

function columnName(index: number): string {
  let value = index;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}
