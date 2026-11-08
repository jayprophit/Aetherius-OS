import { describe, it } from "node:test";
import assert from "node:assert";
import { HealthMonitor, probe, type HealthRecord } from "../src/health-monitor.ts";

function memorySink() {
  const rows: Omit<HealthRecord, "observed_at">[] = [];
  return { rows, sink: { async recordHealth(row: Omit<HealthRecord, "observed_at">) { rows.push(row); } } };
}

describe("HealthMonitor", () => {
  it("records one row per probe and persists every record", async () => {
    const { rows, sink } = memorySink();
    const monitor = new HealthMonitor([
      probe("local", async () => ({ state: "AVAILABLE" })),
      probe("groq", async () => ({ state: "DEGRADED", detail: "slow" })),
    ], sink);

    const result = await monitor.runOnce();
    assert.equal(result.length, 2);
    assert.equal(rows.length, 2);
    assert.deepEqual(
      result.map((r) => [r.provider_id, r.state]).sort(),
      [["groq", "DEGRADED"], ["local", "AVAILABLE"]],
    );
  });

  it("normalizes a throwing probe instead of aborting the sweep", async () => {
    const { rows, sink } = memorySink();
    const monitor = new HealthMonitor([
      probe("gemini", async () => ({ state: "AVAILABLE" })),
      probe("broken", async () => {
        throw new Error("boom");
      }),
    ], sink);

    const result = await monitor.runOnce();
    assert.equal(result.length, 2);
    const broken = result.find((r) => r.provider_id === "broken");
    assert.equal(broken?.state, "UNAVAILABLE");
    assert.match(broken?.detail ?? "", /boom/);
    assert.equal(rows.length, 2);
  });

  it("maps unknown states to UNKNOWN and clamps bad latency", async () => {
    const { sink } = memorySink();
    const monitor = new HealthMonitor([
      {
        id: "weird",
        async check() {
          return { state: "PURPLE" as never, latencyMs: Number.NaN, detail: "x".repeat(400) };
        },
      },
    ], sink);

    const [record] = await monitor.runOnce();
    assert.equal(record.state, "UNKNOWN");
    assert.equal(record.latency_ms, null);
    assert.ok((record.detail ?? "").length <= 200);
  });
});
