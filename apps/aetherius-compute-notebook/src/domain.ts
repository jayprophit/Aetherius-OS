import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Cell {
  id: string;
  type: "code" | "markdown";
  content: string;
}

export interface NotebookOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class ComputeNotebook {
  private readonly cells = new Map<string, Cell>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: NotebookOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addCell(type: Cell["type"], content: string): Cell {
    const cell: Cell = { id: newId("cell"), type, content };
    this.cells.set(cell.id, cell);
    this.ledger.append({ type: "compute-notebook.added", actor: "compute-notebook", subject: cell.id });
    return cell;
  }

  listCells(): Cell[] {
    return Array.from(this.cells.values());
  }
}
