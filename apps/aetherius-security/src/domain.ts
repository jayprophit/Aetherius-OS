import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface ScanResult {
  id: string;
  status: "clean" | "threat" | "warning";
  details: string;
}

export interface SecurityOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class SecurityScanner {
  private readonly results: ScanResult[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: SecurityOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  quickScan(): ScanResult {
    const result: ScanResult = {
      id: newId("scan"),
      status: "clean",
      details: "No threats detected",
    };
    this.results.push(result);
    this.ledger.append({ type: "security.scan.completed", actor: "security", subject: result.id });
    return result;
  }

  getResults(): ScanResult[] {
    return [...this.results];
  }
}
