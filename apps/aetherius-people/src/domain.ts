import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
}

export interface PeopleOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class People {
  private readonly employees = new Map<string, Employee>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: PeopleOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  hire(name: string, role: string, department: string): Employee {
    const employee: Employee = { id: newId("employee"), name, role, department };
    this.employees.set(employee.id, employee);
    this.ledger.append({ type: "people.hired", actor: "people", subject: employee.id });
    return employee;
  }

  list(): Employee[] {
    return Array.from(this.employees.values());
  }
}
