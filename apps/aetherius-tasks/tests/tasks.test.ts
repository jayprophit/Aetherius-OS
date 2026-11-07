import { describe, it } from "node:test";
import assert from "node:assert";
import { TasksService } from "../src/domain.ts";

describe("TasksService", () => {
  it("creates and completes tasks", () => {
    const tasks = new TasksService();
    const task = tasks.create("Buy milk");
    assert.equal(task.completed, false);
    tasks.complete(task.id);
    assert.equal(tasks.list()[0].completed, true);
  });

  it("throws on missing task", () => {
    const tasks = new TasksService();
    assert.throws(() => tasks.complete("nonexistent"), /task not found/);
  });
});
