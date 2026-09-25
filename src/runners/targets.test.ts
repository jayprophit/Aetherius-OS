import { describe, expect, it } from "vitest";
import { ExecutionTargetRegistry, checkCompatibility, validateTargetProfile } from "./targets";
import type { ExecutionTargetProfile } from "./targets";

function profile(over: Partial<ExecutionTargetProfile> = {}): ExecutionTargetProfile {
  return {
    targetProfileId: "local-cpu",
    targetType: "local-directory",
    persistence: "session",
    minCores: 4,
    minRamBytes: 8 * 1024 ** 3,
    gpuRequired: false,
    network: "restricted",
    secrets: { classes: ["build-cache"], injectionAvailable: true },
    workspaceQuotaBytes: 1 * 1024 ** 3,
    cost: { basis: "unknown" },
    provenance: "LOCAL_MEASURED",
    ...over,
  };
}

describe("execution target profiles", () => {
  it("accepts valid local CPU targets and sparse profiles", () => {
    expect(validateTargetProfile(profile())).toEqual([]);
    expect(
      validateTargetProfile({
        targetProfileId: "sparse",
        targetType: "ssh",
        persistence: "ephemeral",
        gpuRequired: false,
        network: "none",
        provenance: "UNVERIFIED",
      }),
    ).toEqual([]);
    const registry = new ExecutionTargetRegistry();
    registry.register(profile());
    expect(registry.lookup("local-cpu")!.persistence).toBe("session");
    expect(() => registry.register(profile())).toThrowError(/duplicate/);
  });

  it("rejects malformed resources, costs and references", () => {
    expect(validateTargetProfile(profile({ targetProfileId: " " }))).toContain("profile-id");
    expect(validateTargetProfile(profile({ targetType: "mainframe" as never }))).toContain("target-type");
    expect(validateTargetProfile(profile({ persistence: "forever" as never }))).toContain("persistence");
    expect(validateTargetProfile(profile({ minCores: -1 }))).toContain("cpu");
    expect(validateTargetProfile(profile({ minCores: NaN }))).toContain("cpu");
    expect(validateTargetProfile(profile({ minRamBytes: Infinity }))).toContain("ram");
    expect(validateTargetProfile(profile({ network: "mesh" as never }))).toContain("network");
    expect(validateTargetProfile(profile({ secrets: { classes: [""], injectionAvailable: true } }))).toContain("secrets");
    expect(validateTargetProfile(profile({ workspaceQuotaBytes: 0 }))).toContain("workspace-quota");
    expect(validateTargetProfile(profile({ cost: { basis: "hourly" } }))).toContain("cost");
    expect(validateTargetProfile(profile({ cost: { basis: "unknown", amount: 0, currency: "USD" } }))).toContain("cost");
    expect(validateTargetProfile(profile({ cost: { basis: "internal-weight", amount: 3, currency: "USD" } }))).toContain("cost");
    expect(validateTargetProfile(profile({ provenance: "vibes" as never }))).toContain("provenance");
  });

  it("matches compatible targets with explicit exclusion reasons", () => {
    const registry = new ExecutionTargetRegistry();
    registry.register(profile());
    registry.register(
      profile({ targetProfileId: "tiny", minCores: 1, minRamBytes: 512 * 1024 ** 2, workspaceQuotaBytes: 100 }),
    );
    const result = checkCompatibility(registry.list(), {
      requirements: { minCores: 4, minRamBytes: 8 * 1024 ** 3, workspaceBytes: 500 },
    });
    expect(result.compatible.map((c) => c.profile.targetProfileId)).toEqual(["local-cpu"]);
    expect(result.incompatible).toHaveLength(1);
    expect(result.incompatible[0]!.reasons.join(" ")).toContain("CPU 1 < required 4");
  });

  it("enforces GPU, network, secret, persistence and cost gates", () => {
    const registry = new ExecutionTargetRegistry();
    registry.register(profile());
    const gpu = checkCompatibility(registry.list(), { requirements: { gpuRequired: true } });
    expect(gpu.compatible).toEqual([]);
    expect(gpu.incompatible[0]!.reasons).toEqual(["GPU required but target declares none"]);

    const net = checkCompatibility(registry.list(), { requirements: { network: "open" } });
    expect(net.incompatible[0]!.reasons).toEqual(["network restricted narrower than required open"]);

    const secret = checkCompatibility(registry.list(), { requirements: { secretClasses: ["prod-deploy"] } });
    expect(secret.incompatible[0]!.reasons).toEqual(["secret class prod-deploy not injectable on target"]);

    const persist = checkCompatibility(registry.list(), { requirements: { persistence: "persistent" } });
    expect(persist.incompatible[0]!.reasons).toEqual(["persistence session != required persistent"]);

    const cost = checkCompatibility(registry.list(), {
      requirements: { maxCost: { amount: 10, currency: "USD", basis: "hourly" } },
    });
    expect(cost.incompatible[0]!.reasons[0]).toContain("UNKNOWN != affordable");

    const mismatched = checkCompatibility(
      [profile({ targetProfileId: "paid", cost: { amount: 5, currency: "EUR", basis: "hourly" } })],
      { requirements: { maxCost: { amount: 10, currency: "USD", basis: "hourly" } } },
    );
    expect(mismatched.incompatible[0]!.reasons[0]).toContain("not comparable");
  });

  it("verifies precision only against linked hardware evidence", () => {
    const registry = new ExecutionTargetRegistry();
    registry.register(profile({ hardwareProfileRef: "hw-1" }));
    registry.register(profile({ targetProfileId: "nohw" }));
    const noResolver = checkCompatibility(registry.list(), { requirements: { precision: "FP32" } });
    expect(noResolver.compatible).toEqual([]);
    expect(noResolver.incompatible.map((i) => i.profile)).toEqual(["local-cpu", "nohw"]);

    const resolveHardware = (ref: string) =>
      ref === "hw-1" ? { profileId: "hw-1", precisions: [{ precision: "FP32", support: "MEASURED" }] } : null;
    const withEvidence = checkCompatibility(registry.list(), {
      requirements: { precision: "FP32" },
      resolveHardware,
    });
    expect(withEvidence.compatible.map((c) => c.profile.targetProfileId)).toEqual(["local-cpu"]);
    expect(withEvidence.incompatible[0]).toEqual({
      profile: "nohw",
      reasons: ["precision FP32 unverifiable: no hardware evidence linked"],
    });

    const unmeasured = checkCompatibility(registry.list(), {
      requirements: { precision: "INT8" },
      resolveHardware,
    });
    expect(unmeasured.compatible).toEqual([]);
    expect(unmeasured.incompatible.map((i) => i.profile)).toEqual(["local-cpu", "nohw"]);
  });

  it("profiles carry references, never secret values", () => {
    const p = profile();
    expect(JSON.stringify(p)).not.toContain("hunter2");
    expect(Object.keys(p)).not.toContain("secretValue");
    expect(Object.keys(p.secrets ?? {})).toEqual(["classes", "injectionAvailable"]);
  });

  it("lists deterministically", () => {
    const registry = new ExecutionTargetRegistry();
    registry.register(profile({ targetProfileId: "b" }));
    registry.register(profile({ targetProfileId: "a" }));
    expect(registry.list().map((p) => p.targetProfileId)).toEqual(["a", "b"]);
  });
});
