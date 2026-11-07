import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface CommandResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface TerminalOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Terminal {
  private readonly history: string[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: TerminalOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  execute(command: string): CommandResult {
    if (!command.trim()) throw new Error("command cannot be empty");
    const result: CommandResult = {
      command,
      exitCode: 0,
      stdout: `Executed: ${command}`,
      stderr: "",
    };
    this.history.push(command);
    this.ledger.append({ type: "terminal.executed", actor: "terminal", subject: command });
    return result;
  }

  getHistory(): string[] {
    return [...this.history];
  }
}
