import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

import { countTodos, generateTodoReport, groupTodos, TODO_STATUSES } from "./todoReport";
import type { Todo } from "./todoTypes";

/**
 * The todo list report sync gate.
 *
 * The Markdown is derived from the YAML. This test fails when the
 * committed report differs from what the generator produces, so the
 * readable view can never quietly go out of date with the machine
 * readable one. Regenerate with:
 *
 *   REGENERATE_TODO_REPORT=1 npm test
 */

const REPO_ROOT = resolve(join(__dirname, "..", ".."));
const DOCS = join(REPO_ROOT, "docs");
const TODOS_PATH = join(DOCS, "PROJECT-TODOS.yaml");
const REPORT_PATH = join(DOCS, "PROJECT-TODOS.md");

interface TodoDoc {
  schema_version?: string;
  source_date?: string;
  todos?: Todo[];
}

const doc = parseYaml(readFileSync(TODOS_PATH, "utf8")) as TodoDoc;
const todos = doc.todos ?? [];

describe("project todo report", () => {
  it("is byte-identical to the generator output", () => {
    const generated = generateTodoReport(todos, doc.source_date ?? "");
    if (process.env.REGENERATE_TODO_REPORT === "1") {
      writeFileSync(REPORT_PATH, generated, "utf8");
      expect(true).toBe(true);
      return;
    }
    expect(
      existsSync(REPORT_PATH),
      `${REPORT_PATH} does not exist; regenerate with REGENERATE_TODO_REPORT=1`,
    ).toBe(true);
    expect(readFileSync(REPORT_PATH, "utf8")).toBe(generated);
  });

  it("is deterministic: the same input produces the same bytes", () => {
    const a = generateTodoReport(todos, doc.source_date ?? "");
    const b = generateTodoReport(todos, doc.source_date ?? "");
    expect(a).toBe(b);
  });

  it("names every todo in the report", () => {
    const report = generateTodoReport(todos, doc.source_date ?? "");
    for (const t of todos) {
      expect(report, t.id).toContain(t.id);
    }
  });

  it("counts open and done tasks without losing any", () => {
    const counts = countTodos(todos);
    expect(counts.total).toBe(todos.length);
    expect(counts.open + counts.done).toBe(todos.length);
    const summed = Object.values(counts.byProject).reduce((n, b) => n + b.open + b.done, 0);
    expect(summed).toBe(todos.length);
  });

  it("groups by priority in ascending order", () => {
    const groups = groupTodos(todos);
    const priorities = groups.map((g) => g.priority);
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b));
  });

  it("uses only the documented status vocabulary", () => {
    for (const t of todos) {
      expect(TODO_STATUSES as readonly string[], `${t.id} status ${t.status}`).toContain(t.status);
    }
  });
});
