import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Table {
  id: string;
  name: string;
  columns: string[];
}

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface DatabaseOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Database {
  private readonly tables = new Map<string, Table>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: DatabaseOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createTable(name: string, columns: string[]): Table {
    const table: Table = { id: newId("table"), name, columns };
    this.tables.set(table.id, table);
    this.ledger.append({ type: "database.created", actor: "database", subject: table.id });
    return table;
  }

  listTables(): Table[] {
    return Array.from(this.tables.values());
  }
}
