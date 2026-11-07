import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface InputMethod {
  id: string;
  name: string;
  type: "keyboard" | "voice" | "gesture";
  active: boolean;
}

export interface InputOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class InputService {
  private readonly methods = new Map<string, InputMethod>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: InputOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  register(method: Omit<InputMethod, "id">): InputMethod {
    const m: InputMethod = { ...method, id: newId("input") };
    this.methods.set(m.id, m);
    this.ledger.append({ type: "input.registered", actor: "input", subject: m.id });
    return m;
  }

  list(): InputMethod[] {
    return Array.from(this.methods.values());
  }
}
