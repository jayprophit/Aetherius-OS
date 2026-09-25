import { describe, expect, it } from "vitest";
import { APPLICATIONS } from "../apps/registry";
import { CapabilityView, composeCapabilityView, lintView } from "./capabilityGraph";
import type { CapabilityNode } from "./capabilityGraph";

function node(over: Partial<CapabilityNode> = {}): CapabilityNode {
  return {
    capabilityId: "skill:review@1.0.0",
    owner: "P19",
    schemaRef: "Skill",
    requirementRefs: ["REQ-p19-skill-discovery"],
    risk: "low",
    grantRefs: ["fs.read"],
    adapterRefs: ["bridge"],
    targetRefs: ["local-cpu"],
    verificationRefs: ["run-1"],
    privacyNote: "local-only",
    evidenceRefs: ["e1"],
    benchmarkRefs: ["bench-1"],
    provenance: "fixture",
    ...over,
  };
}

describe("capability graph view", () => {
it("projects valid nodes and queries them deterministically", () => {
    // The app node deliberately carries its own refs so each query below
    // proves the dimension discriminates, rather than matching both nodes.
    const view = new CapabilityView({
      nodes: [
        node(),
        node({
          capabilityId: "app:ide:edit",
          owner: "P23",
          schemaRef: "AppEntry",
          requirementRefs: ["REQ-p23-ide-layout"],
          grantRefs: ["fs.write"],
          adapterRefs: ["ide-host"],
          targetRefs: ["local-gui"],
          verificationRefs: ["run-2"],
          evidenceRefs: [],
          benchmarkRefs: [],
          provenance: "app-registry:ide@1.0.0",
        }),
      ],
    });
    expect(view.list().map((n) => n.capabilityId)).toEqual(["app:ide:edit", "skill:review@1.0.0"]);
    expect(view.byOwner("P23").map((n) => n.capabilityId)).toEqual(["app:ide:edit"]);
    expect(view.byRequirement("REQ-p19-skill-discovery").map((n) => n.capabilityId)).toEqual(["skill:review@1.0.0"]);
    expect(view.byRequirement("REQ-p23-ide-layout").map((n) => n.capabilityId)).toEqual(["app:ide:edit"]);
    expect(view.byAdapter("bridge").map((n) => n.capabilityId)).toEqual(["skill:review@1.0.0"]);
    expect(view.byAdapter("ide-host").map((n) => n.capabilityId)).toEqual(["app:ide:edit"]);
    expect(view.byTarget("local-cpu").map((n) => n.capabilityId)).toEqual(["skill:review@1.0.0"]);
    expect(view.byTarget("local-gui").map((n) => n.capabilityId)).toEqual(["app:ide:edit"]);
    expect(view.byGrant("fs.read").map((n) => n.capabilityId)).toEqual(["skill:review@1.0.0"]);
    expect(view.byGrant("fs.write").map((n) => n.capabilityId)).toEqual(["app:ide:edit"]);
    expect(view.withEvidence().map((n) => n.capabilityId)).toEqual(["skill:review@1.0.0"]);
    expect(view.withoutEvidence().map((n) => n.capabilityId)).toEqual(["app:ide:edit"]);
    // Unknown dimensions resolve to nothing rather than matching everything.
    expect(view.byRequirement("REQ-does-not-exist")).toEqual([]);
  });

  it("rejects malformed nodes and duplicates", () => {
    expect(() => new CapabilityView({ nodes: [node({ capabilityId: " " })] })).toThrowError(/capability-id/);
    expect(() => new CapabilityView({ nodes: [node({ owner: "" })] })).toThrowError(/owner/);
    expect(() => new CapabilityView({ nodes: [node({ requirementRefs: [""] })] })).toThrowError(/requirement-refs/);
    expect(() => new CapabilityView({ nodes: [node({ risk: "scary" as never })] })).toThrowError(/risk/);
    expect(() => new CapabilityView({ nodes: [node({ latencyMs: 5 })] })).toThrowError(/latency/);
    expect(() => new CapabilityView({ nodes: [node(), node()] })).toThrowError(/duplicate capability ids/);
    expect(
      new CapabilityView({
        nodes: [node({ latencyMs: 2.5, latencySource: "hardware:lab", risk: "unknown" })],
      }).byId("skill:review@1.0.0")!.latencyMs,
    ).toBe(2.5);
  });

  it("exposes no mutation, authorization or execution surface", () => {
    const view = new CapabilityView({ nodes: [node()] });
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(view));
    for (const banned of ["mutate", "authorize", "execute", "install", "provision", "merge", "delete", "update"]) {
      expect(methods.some((m) => m.toLowerCase().includes(banned))).toBe(false);
    }
    // "byGrant" is a read-only ref query, not an authorization grant, so
    // "grant" is deliberately not in the banned-method list above.
    expect(JSON.stringify(view.list())).not.toContain("authorized");
  });

  it("reports stale references without dropping or inventing", () => {
    const view = new CapabilityView({
      nodes: [node(), node({ capabilityId: "x", requirementRefs: ["REQ-ghost"], adapterRefs: ["ghost-adapter"] })],
    });
    const lint = lintView(view, { requirements: ["REQ-p19-skill-discovery"], adapters: ["bridge"], targets: [] });
    expect(lint.requirementRefs).toEqual(["REQ-ghost"]);
    expect(lint.adapterRefs).toEqual(["ghost-adapter"]);
    expect(lint.targetRefs).toEqual(["local-cpu"]);
    // Unchecked dimensions stay silent, never fabricated.
    const unchecked = lintView(view, {});
    expect(unchecked).toEqual({ requirementRefs: [], adapterRefs: [], targetRefs: [] });
  });

  it("composes nodes from authoritative registries without minting ids", () => {
    const view = composeCapabilityView({
      skills: [
        {
          skill_id: "review", version: "1.0.0", name: "Review", description: "r", capability: "review",
          inputs: [], outputs: [], required_capabilities: [], required_permissions: ["fs.read"],
          required_tools: [], supported_platforms: ["*"], execution_kind: "test",
          implementation_ref: "test:review", risk_class: "medium", provenance: "fixture", status: "REGISTERED",
        },
      ],
      apps: APPLICATIONS.slice(0, 1),
      targets: [
        {
          targetProfileId: "local-cpu", targetType: "local-directory", persistence: "session",
          gpuRequired: false, network: "restricted", provenance: "CONFIGURED",
        },
      ],
      hardware: [
        {
          profileId: "lab", deviceClass: "CPU", measuredAt: "2026-09-25T00:00:00.000Z",
          workloadId: "w", workloadVersion: "1", provenance: "LOCAL_EMPIRICAL",
          precisions: [{ precision: "FP32", support: "MEASURED", latencyMs: 2.5, samples: 3 }],
        },
      ],
    });
    expect(view.byId("skill:review@1.0.0")!.risk).toBe("medium");
    expect(view.byId("skill:review@1.0.0")!.grantRefs).toEqual(["fs.read"]);
    expect(view.byOwner("P10").length).toBeGreaterThan(0);
    expect(view.byId("target:local-cpu")!.requirementRefs).toEqual(["REQ-p20-execution-target-profile"]);
    expect(view.byId("hardware:lab")!.latencyMs).toBe(2.5);
    // Desktop-capability-fabric data is never read: no fabric ids present.
    expect(view.list().every((n) => !n.capabilityId.includes("desktop") && !n.provenance.includes("fabric"))).toBe(true);
  });

  it("unknown risk stays unknown, never low", () => {
    const view = new CapabilityView({ nodes: [node({ risk: "unknown" })] });
    expect(view.byId("skill:review@1.0.0")!.risk).toBe("unknown");
  });
});
