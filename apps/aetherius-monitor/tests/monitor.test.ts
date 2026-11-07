import { describe, it } from "node:test";
import assert from "node:assert";
import { SystemMonitor } from "../src/domain.ts";

describe("SystemMonitor", () => {
  it("registers and snapshots processes", () => {
    const monitor = new SystemMonitor();
    monitor.register({ name: "node", cpuPercent: 10, memoryBytes: 1024 });
    const snapshot = monitor.snapshot();
    assert.equal(snapshot.length, 1);
    assert.equal(snapshot[0].name, "node");
  });

  it("generates unique pids", () => {
    const monitor = new SystemMonitor();
    const a = monitor.register({ name: "a", cpuPercent: 1, memoryBytes: 100 });
    const b = monitor.register({ name: "b", cpuPercent: 1, memoryBytes: 100 });
    assert.notEqual(a.pid, b.pid);
  });
});
