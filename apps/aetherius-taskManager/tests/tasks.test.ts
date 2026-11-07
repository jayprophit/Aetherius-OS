import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { TaskManager } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("TaskManager", () => {
  it("observes processes and totals live usage", () => {
    const tasks = new TaskManager({ clock: CLOCK });
    const browser = tasks.observe({ name: "browser", cpuPercent: 12, memoryMb: 800 });
    tasks.observe({ name: "ide", cpuPercent: 8, memoryMb: 1200 });
    assert.equal(tasks.list().length, 2);
    assert.deepEqual(tasks.totals(), { processes: 2, cpuPercent: 20, memoryMb: 2000 });

    tasks.updateUsage(browser.pid, 20, 900);
    assert.equal(tasks.get(browser.pid)!.cpuPercent, 20);
    assert.throws(() => tasks.updateUsage(browser.pid, 101, 1), /between 0 and 100/);
  });

  it("ends processes and keeps them out of the live list", () => {
    const tasks = new TaskManager({ clock: CLOCK });
    const worker = tasks.observe({ name: "worker", cpuPercent: 5, memoryMb: 100 });
    const ended = tasks.end(worker.pid);
    assert.equal(ended.endedAt, "2026-11-07T12:00:00.000Z");
    assert.equal(tasks.list().length, 0);
    assert.equal(tasks.list(true).length, 1);
    assert.throws(() => tasks.end(worker.pid), /already ended/);
  });

  it("validates observed processes", () => {
    const tasks = new TaskManager({ clock: CLOCK });
    assert.throws(() => tasks.observe({ name: "", cpuPercent: 1, memoryMb: 1 }), /needs a name/);
    assert.throws(() => tasks.observe({ name: "x", cpuPercent: -1, memoryMb: 1 }), /between 0 and 100/);
    assert.throws(() => tasks.observe({ name: "x", cpuPercent: 1, memoryMb: -5 }), /non-negative/);
    assert.throws(() => tasks.end(999999), /no process/);
  });
});
