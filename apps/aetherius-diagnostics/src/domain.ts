import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface DiagnosticResult {
  id: string;
  component: string;
  status: "ok" | "warning" | "error";
  message: string;
}

export interface DiagnosticsOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class DiagnosticsService {
  private readonly results: DiagnosticResult[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: DiagnosticsOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  run(component: string): DiagnosticResult {
    const result: DiagnosticResult = {
      id: newId("diag"),
      component,
      status: "ok",
      message: "Component healthy",
    };
    this.results.push(result);
    this.ledger.append({ type: "diagnostics.ran", actor: "diagnostics", subject: result.id });
    return result;
  }

  list(): DiagnosticResult[] {
    return [...this.results];
  }
}
