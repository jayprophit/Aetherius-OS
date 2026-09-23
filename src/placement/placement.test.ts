import { describe, expect, it } from "vitest";
import { decidePlacement } from "./placement";
import type { PlacementRequest } from "./placement";

const BACKENDS = {
  localSimAvailable: true,
  cloudAvailable: false,
  cloudReason: "no cloud runner exists on this workstation",
};

function request(over: Partial<PlacementRequest> = {}): PlacementRequest {
  return {
    workloadId: "nightly-heavy",
    kind: "scheduled",
    runnerKind: "local-directory",
    ttlMs: 3_600_000,
    recordChannel: "ops.runs",
    ...over,
  };
}

describe("cloud persistent execution placement", () => {
  it("places scheduled work locally under the worker bounds", () => {
    const decision = decidePlacement(request(), BACKENDS);
    expect(decision.verdict).toBe("PLACE_LOCAL");
    expect(decision.bounds.ttlMs).toBe(3_600_000);
    expect(decision.bounds.recordChannel).toBe("ops.runs");
    expect(decision.reasons.join(" ")).toContain("lease");
  });

  it("defers cloud placements honestly instead of pretending", () => {
    for (const runnerKind of ["ssh", "container"] as const) {
      const decision = decidePlacement(request({ runnerKind, kind: "always-on" }), BACKENDS);
      expect(decision.verdict).toBe("DEFER_CLOUD");
      expect(decision.bounds.ttlMs).toBe(3_600_000);
      expect(decision.reasons.join(" ")).toContain("deferred, never pretended");
    }
  });

  it("denies placements missing temporary/observable/killable bounds", () => {
    const noLease = decidePlacement(request({ ttlMs: undefined }), BACKENDS);
    expect(noLease.verdict).toBe("DENY");
    expect(noLease.reasons.join(" ")).toContain("ttlMs lease is required");

    const noChannel = decidePlacement(request({ recordChannel: "  " }), BACKENDS);
    expect(noChannel.verdict).toBe("DENY");
    expect(noChannel.reasons.join(" ")).toContain("recordChannel is required");

    const looseFs = decidePlacement(
      request({ isolation: { network: "none", filesystem: "workspace-rw", label: "x" } }),
      BACKENDS,
    );
    expect(looseFs.verdict).toBe("DENY");
    expect(looseFs.reasons.join(" ")).toContain("temp-only");
  });

  it("denies malformed requests", () => {
    expect(decidePlacement(request({ workloadId: "  " }), BACKENDS).verdict).toBe("DENY");
    expect(decidePlacement(request({ kind: "whenever" as never }), BACKENDS).verdict).toBe("DENY");
    expect(decidePlacement(request({ runnerKind: "vps" as never }), BACKENDS).verdict).toBe("DENY");
    expect(
      decidePlacement(request(), { ...BACKENDS, localSimAvailable: false }).reasons.join(" "),
    ).toContain("local sim runner unavailable");
  });

  it("places on cloud backends when they really exist", () => {
    const live = { ...BACKENDS, cloudAvailable: true, cloudReason: "" };
    const decision = decidePlacement(request({ runnerKind: "ssh" }), live);
    expect(decision.verdict).toBe("PLACE_LOCAL");
    expect(decision.runnerKind).toBe("ssh");
  });
});
