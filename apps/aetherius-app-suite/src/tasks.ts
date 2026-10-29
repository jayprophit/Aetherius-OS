import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Tasks and reminders core.
 *
 * Lists, priorities, due dates, tags, search and recurrence. Completing a
 * recurring task creates the next occurrence. It does not deliver an OS
 * notification; the host does that.
 */

export type Priority = 0 | 1 | 2 | 3;
export type RecurrenceUnit = "day" | "week" | "month";

export interface TaskRecurrence {
  every: RecurrenceUnit;
  interval: number;
}

export interface TaskList {
  id: string;
  name: string;
  createdAt: string;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  notes: string;
  dueAt?: string;
  priority: Priority;
  tags: string[];
  completed: boolean;
  completedAt?: string;
  recurrence?: TaskRecurrence;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  listId: string;
  title: string;
  notes?: string;
  dueAt?: string;
  priority?: Priority;
  tags?: string[];
  recurrence?: TaskRecurrence;
}

export interface TaskOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

function normaliseTags(tags: string[] = []): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].sort();
}

function assertPriority(priority: number): Priority {
  if (![0, 1, 2, 3].includes(priority)) throw new Error(`invalid priority: ${priority}`);
  return priority as Priority;
}

function nextOccurrence(dueAt: string, recurrence: TaskRecurrence): string {
  const next = new Date(dueAt);
  if (Number.isNaN(next.getTime())) throw new Error(`invalid due date: ${dueAt}`);
  const interval = recurrence.interval;
  if (!Number.isInteger(interval) || interval < 1) throw new Error("a recurrence interval must be a positive integer");
  if (recurrence.every === "day") next.setUTCDate(next.getUTCDate() + interval);
  else if (recurrence.every === "week") next.setUTCDate(next.getUTCDate() + interval * 7);
  else if (recurrence.every === "month") next.setUTCMonth(next.getUTCMonth() + interval);
  else throw new Error(`unknown recurrence unit: ${recurrence.every}`);
  return next.toISOString();
}

export class TasksApp {
  private readonly taskLists = new Map<string, TaskList>();
  private readonly tasks = new Map<string, Task>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: TaskOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createList(name: string): TaskList {
    const value = name.trim();
    if (!value) throw new Error("a list needs a name");
    const list: TaskList = { id: newId("list"), name: value, createdAt: nowIso(this.clock) };
    this.taskLists.set(list.id, list);
    this.ledger.append({ type: "tasks.list.created", actor: "tasks", subject: list.id });
    return structuredClone(list);
  }

  lists(): TaskList[] {
    return [...this.taskLists.values()].map((list) => structuredClone(list));
  }

  create(input: TaskInput): Task {
    this.requireList(input.listId);
    const title = input.title.trim();
    if (!title) throw new Error("a task needs a title");
    const at = nowIso(this.clock);
    const task: Task = {
      id: newId("task"),
      listId: input.listId,
      title,
      notes: input.notes ?? "",
      dueAt: input.dueAt ? new Date(input.dueAt).toISOString() : undefined,
      priority: assertPriority(input.priority ?? 0),
      tags: normaliseTags(input.tags),
      completed: false,
      recurrence: input.recurrence ? { ...input.recurrence } : undefined,
      createdAt: at,
      updatedAt: at,
    };
    this.tasks.set(task.id, task);
    this.ledger.append({ type: "tasks.created", actor: "tasks", subject: task.id });
    return structuredClone(task);
  }

  update(taskId: string, input: Partial<Omit<TaskInput, "listId">> & { completed?: boolean }): Task {
    const task = this.requireTask(taskId);
    const updated: Task = {
      ...task,
      title: input.title?.trim() ?? task.title,
      notes: input.notes ?? task.notes,
      dueAt: input.dueAt ? new Date(input.dueAt).toISOString() : task.dueAt,
      priority: input.priority !== undefined ? assertPriority(input.priority) : task.priority,
      tags: input.tags ? normaliseTags(input.tags) : task.tags,
      recurrence: input.recurrence ?? task.recurrence,
      completed: input.completed ?? task.completed,
      completedAt: input.completed === true ? nowIso(this.clock) : input.completed === false ? undefined : task.completedAt,
      updatedAt: nowIso(this.clock),
    };
    this.tasks.set(taskId, updated);
    this.ledger.append({ type: "tasks.updated", actor: "tasks", subject: taskId });
    return structuredClone(updated);
  }

  /**
   * Complete a task. A recurring task creates its next occurrence in the same
   * list and returns both the completed task and the new one.
   */
  complete(taskId: string): { completed: Task; next?: Task } {
    const task = this.requireTask(taskId);
    if (task.completed) throw new Error("the task is already complete");
    const completed = this.update(taskId, { completed: true });
    let next: Task | undefined;
    if (task.recurrence && task.dueAt) {
      next = this.create({
        listId: task.listId,
        title: task.title,
        notes: task.notes,
        dueAt: nextOccurrence(task.dueAt, task.recurrence),
        priority: task.priority,
        tags: task.tags,
        recurrence: task.recurrence,
      });
    }
    return { completed, next };
  }

  remove(taskId: string): boolean {
    if (!this.tasks.has(taskId)) return false;
    this.tasks.delete(taskId);
    this.ledger.append({ type: "tasks.removed", actor: "tasks", subject: taskId });
    return true;
  }

  get(taskId: string): Task | undefined {
    const task = this.tasks.get(taskId);
    return task ? structuredClone(task) : undefined;
  }

  list(options: {
    listId?: string;
    completed?: boolean;
    tag?: string;
    dueBefore?: string | Date;
    query?: string;
  } = {}): Task[] {
    const tag = options.tag?.trim().toLowerCase();
    const dueBefore = options.dueBefore ? new Date(options.dueBefore).getTime() : undefined;
    const terms = options.query?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? [];
    return [...this.tasks.values()]
      .filter((task) => (options.listId ? task.listId === options.listId : true))
      .filter((task) => (options.completed !== undefined ? task.completed === options.completed : true))
      .filter((task) => (tag ? task.tags.includes(tag) : true))
      .filter((task) => (dueBefore !== undefined && task.dueAt ? new Date(task.dueAt).getTime() <= dueBefore : true))
      .filter((task) => {
        if (terms.length === 0) return true;
        const haystack = `${task.title} ${task.notes} ${task.tags.join(" ")}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .sort((left, right) => {
        const leftDue = left.dueAt ?? "9999";
        const rightDue = right.dueAt ?? "9999";
        if (leftDue !== rightDue) return leftDue.localeCompare(rightDue);
        if (left.priority !== right.priority) return right.priority - left.priority;
        return left.createdAt.localeCompare(right.createdAt);
      })
      .map((task) => structuredClone(task));
  }

  overdue(at: Date = this.clock()): Task[] {
    const now = at.getTime();
    return [...this.tasks.values()]
      .filter((task) => !task.completed && task.dueAt !== undefined && new Date(task.dueAt).getTime() < now)
      .sort((left, right) => (left.dueAt ?? "").localeCompare(right.dueAt ?? ""))
      .map((task) => structuredClone(task));
  }

  private requireList(listId: string): TaskList {
    const list = this.taskLists.get(listId);
    if (!list) throw new Error(`no task list: ${listId}`);
    return list;
  }

  private requireTask(taskId: string): Task {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`no task: ${taskId}`);
    return task;
  }
}
