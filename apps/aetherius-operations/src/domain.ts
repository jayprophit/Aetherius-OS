import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Alert {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
}

export interface OperationsOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Operations {
  private readonly alerts: Alert[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: OperationsOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  raise(severity: Alert["severity"], message: string): Alert {
    const alert: Alert = { id: newId("alert"), severity, message };
    this.alerts.push(alert);
    this.ledger.append({ type: "operations.raised", actor: "operations", subject: alert.id });
    return alert;
  }

  list(): Alert[] {
    return [...this.alerts];
  }
}
