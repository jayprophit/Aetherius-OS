import { describe, expect, it } from "vitest";
import {
  AdapterRegistry,
  type InvocationAdapter,
  type InvokeResult,
} from "../providers/invoke";
import {
  bindRuntime,
  bootstrapReference,
  bridgePrincipal,
  interfaceViewRef,
  parseIdentityRef,
  relateWorker,
} from "./identity";

const G1 = "genesis-prime";

function stubModel(modelId: string): InvocationAdapter {
  return {
    providerId: "local",
    runtimeId: "stub",
    local: true,
    supports: async () => true,
    invoke: async (req): Promise<InvokeResult> => ({
      ok: true,
      requestId: req.requestId,
      providerId: "local",
      modelId,
      runtimeId: "stub",
      output: `from-${modelId}`,
      latencyMs: 1,
      provenance: { route: `local/stub/${modelId}`, observedHealth: "UNKNOWN", benchmarkUsed: false },
    }),
  };
}

describe("genesis identity references", () => {
  it("bootstrap requires provenance and never silently mints", () => {
    const root = bootstrapReference(G1, "owner-bootstrap-2026-09-22", "lineage-1");
    expect(root.genesisId).toBe(G1);
    expect(root.schemaVersion).toBe("1");
    expect(() => bootstrapReference("", "prov")).toThrowError(/genesisId/);
    expect(() => bootstrapReference(G1, "")).toThrowError(/provenance/);
    expect(() => parseIdentityRef(null)).toThrowError();
    expect(() => parseIdentityRef({ genesisId: "  " })).toThrowError(/never generated silently/);
    expect(parseIdentityRef({ genesisId: G1 }).genesisId).toBe(G1);
  });
  it("model swap preserves identity across fixture providers", async () => {
    const root = bootstrapReference(G1, "test");
    const registry = new AdapterRegistry();
    registry.register(stubModel("model-a"));
    const first = await registry.find("local", "stub")?.invoke({
      requestId: "t1", providerId: "local", modelId: "model-a", runtimeId: "stub",
      messages: [{ role: "user", content: "hi" }], timeoutMs: 1000, privacy: "local-only",
    });
    const bindingA = bindRuntime(root, "model", "model-a");
    const bindingB = bindRuntime(root, "model", "model-b");
    expect(first?.ok).toBe(true);
    expect(bindingA.genesisId).toBe(G1);
    expect(bindingB.genesisId).toBe(G1);
    expect(bindingA.ref).not.toBe(bindingB.ref);
    // The root itself is untouched by binding.
    expect(root.genesisId).toBe(G1);
  });
  it("model failure, timeout and cancellation never touch identity", () => {
    const root = bootstrapReference(G1, "test");
    const failing: InvocationAdapter = {
      providerId: "local", runtimeId: "down", local: true,
      supports: async () => true,
      invoke: async (req): Promise<InvokeResult> => ({
        ok: false, requestId: req.requestId, providerId: "local", modelId: "m",
        runtimeId: "down", latencyMs: 1,
        provenance: { route: "local/down/m", observedHealth: "UNAVAILABLE", benchmarkUsed: false },
        error: { code: "RUNTIME_UNAVAILABLE", message: "down" },
      }),
    };
    return failing.invoke({
      requestId: "t", providerId: "local", modelId: "m", runtimeId: "down",
      messages: [{ role: "user", content: "hi" }], timeoutMs: 1000, privacy: "local-only",
    }).then((result) => {
      expect(result.ok).toBe(false);
      expect(bindRuntime(root, "model", "m").genesisId).toBe(G1);
      expect(root.genesisId).toBe(G1);
    });
  });
  it("sessions, projects and avatars bind without mutating identity", () => {
    const root = bootstrapReference(G1, "test");
    const before = { ...root };
    const session = bindRuntime(root, "session", "S1");
    const project = bindRuntime(root, "project", "proj-a");
    const avatar = bindRuntime(root, "avatar", "avatar-v3");
    expect(session.genesisId).toBe(G1);
    expect(project.genesisId).toBe(G1);
    expect(avatar.genesisId).toBe(G1);
    expect(root).toEqual(before);
    expect(() => bindRuntime(root, "session", "  ")).toThrowError(/binding ref/);
  });
  it("workers are distinct and subordinate; teardown keeps Genesis", () => {
    const root = bootstrapReference(G1, "test");
    const w1 = relateWorker(root, "worker-1", "task-1", ["filesystem:read"]);
    const w2 = relateWorker(root, "worker-2", "task-2");
    expect(w1.supervisedBy).toBe(G1);
    expect(w1.workerId).not.toBe(G1);
    expect(w2.workerId).not.toBe(w1.workerId);
    expect(() => relateWorker(root, G1)).toThrowError(/differ/);
    // Teardown is just dropping the relationship object; the root persists.
    expect(root.genesisId).toBe(G1);
  });
  it("chat and work reference the same Genesis without allocating", () => {
    const root = bootstrapReference(G1, "test");
    const chatRef = interfaceViewRef("chat", root);
    const workRef = interfaceViewRef("work", root);
    expect(chatRef).toBe(root);
    expect(workRef).toBe(root);
    expect(chatRef.genesisId).toBe(workRef.genesisId);
  });
  it("owner and Genesis stay distinct in bridge principal context", () => {
    const principal = bridgePrincipal(G1, "owner-jp");
    expect(principal).toEqual({ genesis: G1, on_behalf_of: "owner-jp" });
    expect(() => bridgePrincipal(G1, G1)).toThrowError(/distinct/);
    expect(() => bridgePrincipal("", "owner")).toThrowError();
  });
});
