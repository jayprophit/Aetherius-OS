import { describe, expect, it } from "vitest";
import { HardwareProfileRegistry, rankForPrecision, unmeasuredProfile, validateHardwareProfile } from "./hardware";
import { CPU_PROBE_WORKLOAD_ID, CPU_PROBE_WORKLOAD_VERSION, probeCpuMatmul } from "./hardwareProbe";
import type { HardwareProfile } from "./hardware";

function cpuProfile(over: Partial<HardwareProfile> = {}): HardwareProfile {
  return {
    profileId: "workstation-cpu",
    deviceClass: "CPU",
    vendor: "GenuineIntel",
    architecture: "x86_64",
    measuredAt: "2026-09-23T00:00:00.000Z",
    workloadId: CPU_PROBE_WORKLOAD_ID,
    workloadVersion: CPU_PROBE_WORKLOAD_VERSION,
    provenance: "LOCAL_EMPIRICAL",
    precisions: [
      { precision: "FP32", support: "MEASURED", latencyMs: 12.5, throughputOps: 1000, samples: 3 },
      { precision: "INT8", support: "UNMEASURED" },
    ],
    ...over,
  };
}

describe("hardware profiles", () => {
  it("accepts measured CPU profiles with provenance", () => {
    expect(validateHardwareProfile(cpuProfile())).toEqual([]);
    const registry = new HardwareProfileRegistry();
    registry.register(cpuProfile());
    expect(registry.lookup("workstation-cpu")!.provenance).toBe("LOCAL_EMPIRICAL");
    expect(() => registry.register(cpuProfile())).toThrowError(/duplicate/);
  });

  it("accepts GPU/NPU fixtures and honest unmeasured declarations", () => {
    const gpu: HardwareProfile = {
      ...cpuProfile(),
      profileId: "lab-gpu",
      deviceClass: "GPU",
      precisions: [
        { precision: "FP16", support: "MEASURED", latencyMs: 2, samples: 5 },
        { precision: "INT4", support: "KNOWN_UNSUPPORTED" },
      ],
    };
    expect(validateHardwareProfile(gpu)).toEqual([]);
    const npu = unmeasuredProfile("no-npu", "NPU", ["INT8"], "no NPU on this host", "2026-09-23T00:00:00.000Z");
    expect(validateHardwareProfile(npu)).toEqual([]);
    expect(npu.precisions).toEqual([{ precision: "INT8", support: "UNMEASURED" }]);
  });

  it("rejects fabrication: numbers required iff MEASURED", () => {
    expect(
      validateHardwareProfile(cpuProfile({ precisions: [{ precision: "FP32", support: "MEASURED" }] })),
    ).toContain("numbers-required");
    expect(
      validateHardwareProfile(cpuProfile({ precisions: [{ precision: "FP32", support: "UNMEASURED", latencyMs: 5 }] })),
    ).toContain("numbers-forbidden");
    expect(validateHardwareProfile(cpuProfile({ deviceClass: "TPU" as never }))).toContain("device-class");
    expect(validateHardwareProfile(cpuProfile({ measuredAt: "someday" }))).toContain("timestamp");
    expect(
      validateHardwareProfile(
        cpuProfile({ precisions: [{ precision: "FP32", support: "MEASURED", latencyMs: 1, samples: 1 }, { precision: "FP32", support: "UNMEASURED" }] }),
      ),
    ).toContain("precision-label");
  });

  it("routing ranks measured support over names", () => {
    const aaaUnmeasured = unmeasuredProfile("aaa-slow", "CPU", ["FP32"], "fixture", "2026-09-23T00:00:00.000Z");
    const registry = new HardwareProfileRegistry();
    registry.register(aaaUnmeasured);
    registry.register(cpuProfile({ profileId: "zzz-fast" }));
    const result = rankForPrecision(registry.list(), "FP32");
    // Alphabetically-first profile has no measurement: measured wins.
    expect(result.ranked.map((r) => r.profile.profileId)).toEqual(["zzz-fast"]);
    expect(result.excluded).toEqual([
      { profile: "aaa-slow", reason: "precision FP32 unmeasured on aaa-slow" },
    ]);
  });

  it("excludes unsupported and unlisted precisions with reasons", () => {
    const registry = new HardwareProfileRegistry();
    registry.register(cpuProfile());
    const missing = rankForPrecision(registry.list(), "INT4");
    expect(missing.ranked).toEqual([]);
    expect(missing.excluded[0]!.reason).toContain("not listed");
  });

  it("empirical CPU probe measures locally without fabrication", () => {
    const result = probeCpuMatmul(16, 2);
    expect(Number.isFinite(result.latencyMs)).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.samples).toBe(2);
    expect(result.throughputOps).toBeGreaterThanOrEqual(0);
    expect(() => probeCpuMatmul(4, 1)).toThrowError(/8\.\.256/);
    expect(() => probeCpuMatmul(16, 0)).toThrowError(/1\.\.10/);
  });

  it("serializes deterministically", () => {
    const registry = new HardwareProfileRegistry();
    registry.register(cpuProfile({ profileId: "b" }));
    registry.register(cpuProfile({ profileId: "a" }));
    expect(registry.list().map((p) => p.profileId)).toEqual(["a", "b"]);
    expect(JSON.stringify(registry.lookup("a"))).toBe(JSON.stringify(registry.lookup("a")));
  });
});
