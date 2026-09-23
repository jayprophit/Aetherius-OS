import { describe, expect, it } from "vitest";
import { bootstrapReference } from "./identity";
import { WorkerPool } from "./workers";

function pool(maxActive = 2) {
  const root = bootstrapReference("genesis-prime", "fixture");
  let n = 0;
  return new WorkerPool(root, {
    maxActive,
    now: () => "2026-09-23T00:00:00.000Z",
    nowMs: () => 1_000_000,
    id: () => `worker-${++n}`,
  });
}

describe("temporary supervised workers", () => {
  it("spawns distinct task-bound workers under one Genesis", () => {
    const p = pool();
    const a = p.spawn("task-a", ["filesystem:read"]);
    const b = p.spawn("task-b");
    expect(a.workerId).toBe("worker-1");
    expect(b.workerId).toBe("worker-2");
    expect(a.genesisId).toBe("genesis-prime");
    expect(a.taskId).toBe("task-a");
    expect(a.capabilityScope).toEqual(["filesystem:read"]);
    expect(a.state).toBe("ACTIVE");
    expect(p.active()).toHaveLength(2);
  });

  it("enforces the parallel bound", () => {
    const p = pool(1);
    p.spawn("task-a");
    expect(() => p.spawn("task-b")).toThrowError(/worker bound reached: 1/);
    expect(() => new WorkerPool(bootstrapReference("g", "f"), { maxActive: 0 })).toThrowError(/positive integer/);
  });

  it("retirement is terminal and frees the slot without reviving the id", () => {
    const p = pool(1);
    const a = p.spawn("task-a");
    const retired = p.retire(a.workerId, "task done");
    expect(retired.state).toBe("RETIRED");
    expect(retired.retireReason).toBe("task done");
    expect(() => p.retire(a.workerId, "again")).toThrowError(/already RETIRED/);
    // A new task gets a NEW worker id; the retired id never reactivates.
    const b = p.spawn("task-b");
    expect(b.workerId).not.toBe(a.workerId);
    expect(p.get(a.workerId)!.state).toBe("RETIRED");
  });

  it("rejects unknown workers and bad input", () => {
    const p = pool();
    expect(() => p.retire("ghost", "x")).toThrowError(/unknown worker/);
    expect(() => p.spawn("  ")).toThrowError(/taskId is required/);
    expect(() => p.spawn("t", ["ok", " "])).toThrowError(/non-empty strings/);
    expect(() => p.spawn("t", [], 0)).toThrowError(/positive integer/);
    const w = p.spawn("t");
    expect(() => p.retire(w.workerId, "  ")).toThrowError(/reason is required/);
  });

  it("reaps expired leases and leaves the rest alone", () => {
    const p = pool(3);
    p.spawn("short", [], 1000);
    p.spawn("long", [], 60_000);
    p.spawn("forever");
    const expired = p.reap(1_001_000);
    expect(expired.map((w) => w.workerId)).toEqual(["worker-1"]);
    expect(expired[0]!.state).toBe("EXPIRED");
    expect(expired[0]!.retireReason).toBe("lease expired");
    expect(p.get("worker-2")!.state).toBe("ACTIVE");
    expect(p.get("worker-3")!.state).toBe("ACTIVE");
    expect(p.active()).toHaveLength(2);
  });

  it("worker ids can never equal the Genesis identity", () => {
    const root = bootstrapReference("genesis-prime", "fixture");
    const hostile = new WorkerPool(root, { maxActive: 1, id: () => "genesis-prime" });
    expect(() => hostile.spawn("task")).toThrowError(/differ/);
  });
});
