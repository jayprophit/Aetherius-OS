import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";
import { Spreadsheet } from "./office.ts";

/**
 * Sheets app.
 *
 * A cell-based spreadsheet with deterministic formula evaluation,
 * CSV export and circular-reference detection. The core uses the
 * office Spreadsheet; the host supplies UI, fonts and format adapters.
 */

export interface SheetDocumentState {
  id: string;
  title: string;
  data: string; // CSV snapshot for persistence
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSheetInput {
  title?: string;
}

export interface SheetsOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class SheetsApp {
  private readonly sheets = new Map<string, SheetDocumentState>();
  private readonly ledgers = new Map<string, Spreadsheet>(); // live session per sheet
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: SheetsOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(input: CreateSheetInput = {}): SheetDocumentState {
    const at = nowIso(this.clock);
    const sheet: SheetDocumentState = {
      id: newId("sheet"),
      title: input.title?.trim() || "Untitled spreadsheet",
      data: "",
      version: 1,
      createdAt: at,
      updatedAt: at,
    };
    this.sheets.set(sheet.id, sheet);
    this.ledgers.set(sheet.id, new Spreadsheet({ ledger: this.ledger, clock: this.clock }));
    this.ledger.append({ type: "sheets.created", actor: "sheets", subject: sheet.id, data: { title: sheet.title } });
    return structuredClone(sheet);
  }

  get(sheetId: string): SheetDocumentState | undefined {
    const sheet = this.sheets.get(sheetId);
    return sheet ? structuredClone(sheet) : undefined;
  }

  delete(sheetId: string): boolean {
    this.require(sheetId);
    this.sheets.delete(sheetId);
    this.ledgers.delete(sheetId);
    this.ledger.append({ type: "sheets.deleted", actor: "sheets", subject: sheetId, data: {} });
    return true;
  }

  list(): SheetDocumentState[] {
    return [...this.sheets.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.title.localeCompare(b.title))
      .map((sheet) => structuredClone(sheet));
  }

  /** Get the live spreadsheet session for editing. */
  session(sheetId: string): Spreadsheet {
    this.require(sheetId);
    if (!this.ledgers.has(sheetId)) {
      const spreadsheet = new Spreadsheet({ ledger: this.ledger, clock: this.clock });
      this.ledgers.set(sheetId, spreadsheet);
    }
    return this.ledgers.get(sheetId)!;
  }

  /** Persist a session's current state back to storage. */
  commit(sheetId: string): SheetDocumentState {
    const sheet = this.require(sheetId);
    const spreadsheet = this.session(sheetId);
    const data = spreadsheet.toCsv();
    const next: SheetDocumentState = {
      ...sheet,
      data,
      version: sheet.version + 1,
      updatedAt: nowIso(this.clock),
    };
    this.sheets.set(sheetId, next);
    this.ledger.append({
      type: "sheets.updated",
      actor: "sheets",
      subject: sheetId,
      data: { version: next.version, dataLength: data.length },
    });
    return structuredClone(next);
  }

  exportCsv(sheetId: string): string {
    const spreadsheet = this.session(sheetId);
    return spreadsheet.toCsv();
  }

  private require(sheetId: string): SheetDocumentState {
    const sheet = this.sheets.get(sheetId);
    if (!sheet) throw new Error(`no sheet: ${sheetId}`);
    return structuredClone(sheet);
  }
}