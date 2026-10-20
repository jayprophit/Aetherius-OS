import type { Todo } from "./todoTypes";

/**
 * Deterministic Markdown rendering of the project todo list.
 *
 * The YAML is the source of truth. This is derived output and a sync test
 * enforces byte-equality, so the two can never drift apart.
 *
 * The rendering is written for the person deciding what to work on next,
 * so it leads with what is blocking what, and it keeps the source of every
 * task visible. A task that came from a previous document says so; a task
 * that came from the build audit says so too. A task with no source is a
 * task nobody can pick up.
 */

export const TODO_STATUSES = ["OPEN", "IN_PROGRESS", "BLOCKED", "OWNER_GATED", "DONE"] as const;
export type TodoStatus = (typeof TODO_STATUSES)[number];

function statusIcon(status: string): string {
  switch (status) {
    case "DONE":
      return "✅";
    case "IN_PROGRESS":
      return "🔨";
    case "BLOCKED":
      return "⛔";
    case "OWNER_GATED":
      return "🔑";
    default:
      return "⬜";
  }
}

function priorityLabel(priority: number): string {
  const labels: Record<number, string> = {
    1: "P1 blocking",
    2: "P2 high",
    3: "P3 medium",
    4: "P4 low",
    5: "P5 recorded",
  };
  return labels[priority] ?? `P${priority}`;
}

function escape(text: string): string {
  return text.replace(/\|/g, "\\|");
}

function flatten(text: string | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

export interface TodoGroup {
  priority: number;
  todos: Todo[];
}

/** Group todos by priority, then by project, both alphabetically. */
export function groupTodos(todos: readonly Todo[]): TodoGroup[] {
  const byPriority = new Map<number, Todo[]>();
  for (const t of todos) {
    const list = byPriority.get(t.priority) ?? [];
    list.push(t);
    byPriority.set(t.priority, list);
  }
  return [...byPriority.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([priority, list]) => ({
      priority,
      todos: [...list].sort(
        (a, b) => a.project.localeCompare(b.project) || a.id.localeCompare(b.id),
      ),
    }));
}

export interface TodoCounts {
  total: number;
  open: number;
  done: number;
  byProject: Record<string, { open: number; done: number }>;
}

export function countTodos(todos: readonly Todo[]): TodoCounts {
  const byProject: Record<string, { open: number; done: number }> = {};
  let open = 0;
  let done = 0;
  for (const t of todos) {
    const bucket = (byProject[t.project] ??= { open: 0, done: 0 });
    if (t.status === "DONE") {
      done += 1;
      bucket.done += 1;
    } else {
      open += 1;
      bucket.open += 1;
    }
  }
  return { total: todos.length, open, done, byProject };
}

/**
 * Render the todo list. Deterministic: the same input always produces
 * byte-identical output.
 */
export function generateTodoReport(todos: readonly Todo[], sourceDate: string): string {
  const counts = countTodos(todos);
  const groups = groupTodos(todos);
  const lines: string[] = [];

  lines.push("# Project Todos — outstanding work across the workspace");
  lines.push("");
  lines.push("> Generated from `docs/PROJECT-TODOS.yaml`. Do not hand-edit this");
  lines.push("> file; edit the YAML and regenerate.");
  lines.push("");
  lines.push(`- Source date: ${sourceDate}`);
  lines.push(`- Tasks: **${counts.total}** (${counts.open} open, ${counts.done} done)`);
  lines.push("");
  lines.push("## By project");
  lines.push("");
  lines.push("| Project | Open | Done |");
  lines.push("|---|---|---|");
  for (const project of Object.keys(counts.byProject).sort()) {
    const b = counts.byProject[project]!;
    lines.push(`| ${project} | ${b.open} | ${b.done} |`);
  }
  lines.push("");

  for (const group of groups) {
    lines.push(`## ${priorityLabel(group.priority)}`);
    lines.push("");
    for (const t of group.todos) {
      lines.push(`### ${statusIcon(t.status)} ${t.id} — ${escape(t.title)}`);
      lines.push("");
      lines.push(`- **Project:** ${t.project}`);
      lines.push(`- **Status:** ${t.status}`);
      lines.push(`- **Source:** ${t.source?.kind ?? "unrecorded"} — ${flatten(t.source?.ref)}`);
      if (t.depends_on?.length) {
        lines.push(`- **Depends on:** ${t.depends_on.join(", ")}`);
      }
      if (t.detail) {
        lines.push("");
        lines.push(t.detail.trim());
      }
      if (t.evidence) {
        lines.push("");
        lines.push("Evidence:");
        lines.push("");
        lines.push("```");
        lines.push(t.evidence.trim());
        lines.push("```");
      }
      if (t.resolution) {
        lines.push("");
        lines.push("Resolution:");
        lines.push("");
        lines.push(t.resolution.trim());
      }
      if (t.acceptance?.length) {
        lines.push("");
        lines.push("Acceptance:");
        lines.push("");
        for (const a of t.acceptance) {
          lines.push(`- [ ] ${a}`);
        }
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
