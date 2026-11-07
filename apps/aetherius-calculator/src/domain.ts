import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface CalculationHistory {
  id: string;
  expression: string;
  result: number | string;
}

export interface CalculatorOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Calculator {
  private readonly history: CalculationHistory[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: CalculatorOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  evaluate(expression: string): number | string {
    try {
      const result = Function('"use strict"; return (' + expression + ')')();
      if (typeof result !== "number" || !Number.isFinite(result)) {
        throw new Error("invalid result");
      }
      const history: CalculationHistory = {
        id: newId("calc"),
        expression,
        result,
      };
      this.history.push(history);
      this.ledger.append({ type: "calculator.evaluated", actor: "calculator", subject: history.id });
      return result;
    } catch {
      const err = "Error";
      const history: CalculationHistory = { id: newId("calc"), expression, result: err };
      this.history.push(history);
      this.ledger.append({ type: "calculator.error", actor: "calculator", subject: history.id });
      return err;
    }
  }

  getHistory(): CalculationHistory[] {
    return [...this.history];
  }
}
