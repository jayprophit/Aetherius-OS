import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface TasksOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class TasksService {
  private readonly tasks = new Map<string, Task>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: TasksOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(title: string, dueDate?: string): Task {
    const task: Task = { id: newId("task"), title, completed: false, dueDate };
    this.tasks.set(task.id, task);
    this.ledger.append({ type: "tasks.created", actor: "tasks", subject: task.id });
    return task;
  }

  complete(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) throw new Error("task not found");
    task.completed = true;
    this.ledger.append({ type: "tasks.completed", actor: "tasks", subject: id });
    return task;
  }

  list(): Task[] {
    return Array.from(this.tasks.values());
  }
}
