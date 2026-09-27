import { describe, expect, it } from "vitest";
import {
  FAILURE_CLASSES,
  SERVICE_STATES,
  declareService,
  effectiveStatus,
  planStartOrder,
  planStopOrder,
  transitionState,
} from "./serviceOrchestrator";
import type { ServiceDefinition, InstanceStates } from "./serviceOrchestrator";

const AT = "2026-09-27T11:00:00.000Z";

/** Dimension-specific fixtures: every definition declares its own fields. */
function definition(over: Partial<ServiceDefinition> = {}): ServiceDefinition {
  return {
    serviceId: "svc-a",
    version: "1.0.0",
    dependencies: [],
    capabilities: [],
    entrypointRef: "apps:agent-bridge",
    maxRestarts: 2,
    provenance: "test",
    ...over,
  } as ServiceDefinition;
}

function ev(over: Record<string, unknown> = {}): Record<string, unknown> {
  return { observedAt: AT, ...over };
}

/** Walk a service through install->configure->start->running->ready, threading prior states. */
function bringReady(defs: ServiceDefinition[], id = "svc-a", base: InstanceStates = {}): InstanceStates {
  let states: InstanceStates = { ...base };
  states = transitionState(defs, states, id, "INSTALLED", ev());
  states = transitionState(defs, states, id, "CONFIGURED", ev());
  states = transitionState(defs, states, id, "STARTING", ev());
  states = transitionState(defs, states, id, "RUNNING", ev({ effectObserved: true }));
  states = transitionState(defs, states, id, "READY", ev({ readinessObserved: true }));
  return states;
}

describe("service orchestrator: registered vocabulary", () => {
  it("declares the closed lifecycle states and failure classes", () => {
    expect([...SERVICE_STATES]).toEqual([
      "DECLARED", "INSTALLED", "CONFIGURED", "STARTING", "RUNNING", "READY",
      "DEGRADED", "STOPPING", "STOPPED", "FAILED", "RECOVERING", "UNKNOWN",
    ]);
    expect([...FAILURE_CLASSES]).toEqual([
      "DEPENDENCY_UNAVAILABLE", "DEPENDENCY_FAILED", "START_FAILED", "NOT_READY",
      "HEALTH_CHECK_FAILED", "TIMEOUT", "AUTH_BLOCKED", "UNKNOWN",
    ]);
  });
});

describe("service orchestrator: minimal valid definition", () => {
  it("registers a minimal definition with sorted outputs", () => {
    const defs = declareService([], definition({ serviceId: "svc-b" }));
    expect(defs).toHaveLength(1);
    expect(defs[0]!.serviceId).toBe("svc-b");
  });

  it("rejects duplicates, self-dependencies, and unknown fields", () => {
    const defs = declareService([], definition());
    expect(() => declareService(defs, definition())).toThrowError(
      expect.objectContaining({ code: "SERVICE_DUPLICATE_ID" }),
    );
    expect(() => declareService([], definition({ dependencies: ["svc-a"] }))).toThrowError(
      expect.objectContaining({ code: "SERVICE_BAD_DEPENDENCY" }),
    );
    expect(() => declareService([], { ...definition(), restartPolicy: "always" } as never)).toThrowError(
      expect.objectContaining({ code: "SERVICE_UNKNOWN_FIELD" }),
    );
  });

  it("accepts only reference-shaped entrypoints, never raw commands", () => {
    for (const ref of ["apps:mat", "toolchain:tool-gcc-13", "repo:scripts/svc.mjs"]) {
      expect(() => declareService([], definition({ entrypointRef: ref }))).not.toThrow();
    }
    for (const ref of ["rm -rf /", "./run.sh", "node server.js", "http://x/y", ""]) {
      expect(() => declareService([], definition({ entrypointRef: ref }))).toThrowError(
        expect.objectContaining({ code: "SERVICE_BAD_ENTRYPOINT" }),
      );
    }
  });

  it("requires an explicit restart budget and provenance", () => {
    expect(() => declareService([], { ...definition(), maxRestarts: undefined } as never)).toThrowError(
      expect.objectContaining({ code: "SERVICE_INVALID_INPUT" }),
    );
    expect(() => declareService([], { ...definition(), provenance: "" } as never)).toThrowError(
      expect.objectContaining({ code: "SERVICE_INVALID_INPUT" }),
    );
  });

  it("rejects authority, secret values, and persona keys before shape errors", () => {
    expect(() => declareService([], { ...definition(), policyBypass: true } as never)).toThrowError(
      expect.objectContaining({ code: "SERVICE_AUTHORITY_REJECTED" }),
    );
    expect(() => declareService([], { ...definition(), apiKey: "sk-x" } as never)).toThrowError(
      expect.objectContaining({ code: "SERVICE_SECRET_REJECTED" }),
    );
    expect(() => declareService([], { ...definition(), persona: "helper" } as never)).toThrowError(
      expect.objectContaining({ code: "SERVICE_PERSONALITY_REJECTED" }),
    );
  });

  it("accepts secret refs and a P25 grant ref, as references only", () => {
    const defs = declareService(
      [],
      definition({ secretRefs: ["secret:db/password"], authGrantRef: "p25-decision-7" }),
    );
    expect(defs[0]!.secretRefs).toEqual(["secret:db/password"]);
    expect(defs[0]!.authGrantRef).toBe("p25-decision-7");
  });

  it("does not mutate the input definition set", () => {
    const defs: ServiceDefinition[] = [];
    const snapshot = JSON.stringify(defs);
    declareService(defs, definition());
    expect(JSON.stringify(defs)).toBe(snapshot);
  });
});

describe("service orchestrator: dependency direction and order", () => {
  it("orders dependencies before dependents", () => {
    const defs = declareService(
      declareService(declareService([], definition({ serviceId: "svc-db" })), definition({ serviceId: "svc-api", dependencies: ["svc-db"] })),
      definition({ serviceId: "svc-ui", dependencies: ["svc-api"] }),
    );
    expect(planStartOrder(defs).order).toEqual(["svc-db", "svc-api", "svc-ui"]);
  });

  it("treats A-depends-on-B and B-depends-on-A as different graphs", () => {
    const forward = declareService(declareService([], definition({ serviceId: "a" })), definition({ serviceId: "b", dependencies: ["a"] }));
    const reverse = declareService(declareService([], definition({ serviceId: "a", dependencies: ["b"] })), definition({ serviceId: "b" }));
    expect(planStartOrder(forward).order).toEqual(["a", "b"]);
    expect(planStartOrder(reverse).order).toEqual(["b", "a"]);
  });

  it("is deterministic from scrambled declaration order", () => {
    const make = () => {
      let defs: ServiceDefinition[] = [];
      defs = declareService(defs, definition({ serviceId: "svc-z" }));
      defs = declareService(defs, definition({ serviceId: "svc-m", dependencies: ["svc-z"] }));
      defs = declareService(defs, definition({ serviceId: "svc-a" }));
      return defs;
    };
    expect(JSON.stringify(planStartOrder(make()))).toBe(
      JSON.stringify(planStartOrder([...make()].reverse())),
    );
    expect(planStartOrder(make()).order).toEqual(["svc-a", "svc-z", "svc-m"]);
  });

  it("rejects cycles with the cycle path as evidence", () => {
    const defs = declareService(
      declareService(declareService([], definition({ serviceId: "a", dependencies: ["c"] })), definition({ serviceId: "b", dependencies: ["a"] })),
      definition({ serviceId: "c", dependencies: ["b"] }),
    );
    try {
      planStartOrder(defs);
      throw new Error("expected cycle rejection");
    } catch (error) {
      expect((error as { code?: string }).code).toBe("SERVICE_CYCLE");
      expect((error as Error).message).toContain("a");
      expect((error as Error).message).toContain("b");
      expect((error as Error).message).toContain("c");
    }
  });

  it("reports unknown dependencies as blocked, never silently dropped", () => {
    const defs = declareService([], definition({ serviceId: "svc-a", dependencies: ["svc-ghost"] }));
    const plan = planStartOrder(defs);
    expect(plan.order).toEqual([]);
    expect(plan.blocked).toEqual([{ serviceId: "svc-a", reason: "unknown dependencies: svc-ghost" }]);
  });
});

describe("service orchestrator: stop order reverses start order", () => {
  it("stops dependents before their dependencies", () => {
    const defs = declareService(
      declareService([], definition({ serviceId: "svc-db" })),
      definition({ serviceId: "svc-api", dependencies: ["svc-db"] }),
    );
    expect(planStopOrder(defs).order).toEqual(["svc-api", "svc-db"]);
    expect(planStopOrder(defs).order).not.toEqual(planStartOrder(defs).order);
  });
});

describe("service orchestrator: evidence-gated lifecycle", () => {
  it("walks the full lifecycle with timestamps kept distinct", () => {
    const defs = declareService([], definition());
    const states = bringReady(defs);
    const instance = states["svc-a"]!;
    expect(instance.state).toBe("READY");
    expect(instance.timestamps.declaredAt).toBe(AT);
    expect(instance.timestamps.readyAt).toBe(AT);
    expect(instance.lastTransition).toMatchObject({ from: "RUNNING", to: "READY" });
  });

  it("rejects non-edges: DECLARED cannot jump to RUNNING", () => {
    const defs = declareService([], definition());
    expect(() => transitionState(defs, {}, "svc-a", "RUNNING", ev({ effectObserved: true }))).toThrowError(
      expect.objectContaining({ code: "SERVICE_BAD_TRANSITION" }),
    );
  });

  it("rejects entering UNKNOWN by transition", () => {
    const defs = declareService([], definition());
    expect(() => transitionState(defs, {}, "svc-a", "UNKNOWN", ev())).toThrowError(
      expect.objectContaining({ code: "SERVICE_BAD_TRANSITION" }),
    );
  });

  it("requires effect evidence for RUNNING and readiness evidence for READY", () => {
    const defs = declareService([], definition());
    let states = transitionState(defs, {}, "svc-a", "INSTALLED", ev());
    states = transitionState(defs, states, "svc-a", "CONFIGURED", ev());
    states = transitionState(defs, states, "svc-a", "STARTING", ev());
    expect(() => transitionState(defs, states, "svc-a", "RUNNING", ev())).toThrowError(
      expect.objectContaining({ code: "SERVICE_EVIDENCE_REQUIRED" }),
    );
    states = transitionState(defs, states, "svc-a", "RUNNING", ev({ effectObserved: true }));
    expect(() => transitionState(defs, states, "svc-a", "READY", ev())).toThrowError(
      expect.objectContaining({ code: "SERVICE_EVIDENCE_REQUIRED" }),
    );
  });

  it("requires a failure class and reason to enter FAILED", () => {
    const defs = declareService([], definition());
    let states = transitionState(defs, {}, "svc-a", "INSTALLED", ev());
    states = transitionState(defs, states, "svc-a", "CONFIGURED", ev());
    states = transitionState(defs, states, "svc-a", "STARTING", ev());
    expect(() => transitionState(defs, states, "svc-a", "FAILED", ev({ reason: "broke" }))).toThrowError(
      expect.objectContaining({ code: "SERVICE_EVIDENCE_REQUIRED" }),
    );
    states = transitionState(defs, states, "svc-a", "FAILED", ev({ failureClass: "START_FAILED", reason: "port taken" }));
    expect(states["svc-a"]!.lastFailure).toMatchObject({ failureClass: "START_FAILED", reason: "port taken" });
  });

  it("rejects transitions for undeclared services and missing timestamps", () => {
    const defs = declareService([], definition());
    expect(() => transitionState(defs, {}, "svc-ghost", "INSTALLED", ev())).toThrowError(
      expect.objectContaining({ code: "SERVICE_UNKNOWN_SERVICE" }),
    );
    expect(() => transitionState(defs, {}, "svc-a", "INSTALLED", { note: "x" })).toThrowError(
      expect.objectContaining({ code: "SERVICE_EVIDENCE_REQUIRED" }),
    );
  });

  it("never mutates the caller states map", () => {
    const defs = declareService([], definition());
    const states: InstanceStates = {};
    const snapshot = JSON.stringify(states);
    transitionState(defs, states, "svc-a", "INSTALLED", ev());
    expect(JSON.stringify(states)).toBe(snapshot);
  });
});

describe("service orchestrator: restart budget and recovery", () => {
  it("recovers within budget and counts attempts", () => {
    const defs = declareService([], definition({ maxRestarts: 1 }));
    let states = bringReady(defs);
    states = transitionState(defs, states, "svc-a", "FAILED", ev({ failureClass: "HEALTH_CHECK_FAILED", reason: "probe 500" }));
    states = transitionState(defs, states, "svc-a", "RECOVERING", ev({ note: "restart 1" }));
    expect(states["svc-a"]!.restartAttemptsUsed).toBe(1);
    states = transitionState(defs, states, "svc-a", "STARTING", ev());
    expect(states["svc-a"]!.state).toBe("STARTING");
  });

  it("reports exhaustion instead of retrying forever", () => {
    const defs = declareService([], definition({ maxRestarts: 1 }));
    let states = bringReady(defs);
    states = transitionState(defs, states, "svc-a", "FAILED", ev({ failureClass: "START_FAILED", reason: "x" }));
    states = transitionState(defs, states, "svc-a", "RECOVERING", ev());
    states = transitionState(defs, states, "svc-a", "FAILED", ev({ failureClass: "START_FAILED", reason: "x again" }));
    expect(() => transitionState(defs, states, "svc-a", "RECOVERING", ev())).toThrowError(
      expect.objectContaining({ code: "SERVICE_RESTART_EXHAUSTED" }),
    );
  });

  it("a zero budget means no recovery transition at all", () => {
    const defs = declareService([], definition({ maxRestarts: 0 }));
    let states = bringReady(defs);
    states = transitionState(defs, states, "svc-a", "FAILED", ev({ failureClass: "TIMEOUT", reason: "t" }));
    expect(() => transitionState(defs, states, "svc-a", "RECOVERING", ev())).toThrowError(
      expect.objectContaining({ code: "SERVICE_RESTART_EXHAUSTED" }),
    );
  });
});

describe("service orchestrator: dependency failure blocks, never blames", () => {
  it("a dependent of a non-ready service is BLOCKED with blockers named", () => {
    const defs = declareService(
      declareService([], definition({ serviceId: "svc-db" })),
      definition({ serviceId: "svc-api", dependencies: ["svc-db"] }),
    );
    const status = effectiveStatus(defs, {}, "svc-api");
    expect(status.status).toBe("BLOCKED");
    expect(status.blockedBy).toEqual(["svc-db"]);
    expect(status.storedState).toBe("DECLARED");
  });

  it("a dependent of a failed service is BLOCKED, not FAILED", () => {
    const defs = declareService(
      declareService([], definition({ serviceId: "svc-db" })),
      definition({ serviceId: "svc-api", dependencies: ["svc-db"] }),
    );
    let states = bringReady(defs, "svc-db");
    states = transitionState(defs, states, "svc-db", "FAILED", ev({ failureClass: "START_FAILED", reason: "disk" }));
    const status = effectiveStatus(defs, states, "svc-api");
    expect(status.status).toBe("BLOCKED");
    expect(states["svc-api"]).toBeUndefined();
  });

  it("a service with all dependencies READY reports its stored state", () => {
    const defs = declareService(
      declareService([], definition({ serviceId: "svc-db" })),
      definition({ serviceId: "svc-api", dependencies: ["svc-db"] }),
    );
    const states = bringReady(defs, "svc-api", bringReady(defs, "svc-db"));
    const status = effectiveStatus(defs, states, "svc-api");
    expect(status.status).toBe("READY");
    expect(status.blockedBy).toBeUndefined();
  });

  it("an undeclared dependency blocks as unknown, and unknown services report UNKNOWN", () => {
    const defs = declareService([], definition({ serviceId: "svc-a", dependencies: ["svc-ghost"] }));
    const status = effectiveStatus(defs, {}, "svc-a");
    expect(status.status).toBe("BLOCKED");
    expect(status.blockedBy).toEqual(["svc-ghost (unknown service)"]);
    expect(effectiveStatus(defs, {}, "svc-nope")).toEqual({
      serviceId: "svc-nope",
      status: "UNKNOWN",
      storedState: "UNDECLARED",
    });
  });
});

describe("service orchestrator: identity and versioning", () => {
  it("keeps definition version on the instance and refuses silent upgrades", () => {
    const v1 = declareService([], definition({ version: "1.0.0" }));
    let states = bringReady(v1);
    const v2 = v1.map((d) => (d.serviceId === "svc-a" ? { ...d, version: "2.0.0" } : d));
    expect(() => transitionState(v2, states, "svc-a", "STOPPING", ev())).toThrowError(
      expect.objectContaining({ code: "SERVICE_BAD_TRANSITION" }),
    );
    expect(states["svc-a"]!.definitionVersion).toBe("1.0.0");
  });

  it("distinguishes display name from identity", () => {
    const defs = declareService([], definition({ serviceId: "svc-a", displayName: "API" }));
    expect(defs[0]!.serviceId).toBe("svc-a");
    expect(() => transitionState(defs, {}, "API", "INSTALLED", ev())).toThrowError(
      expect.objectContaining({ code: "SERVICE_UNKNOWN_SERVICE" }),
    );
  });
});

describe("service orchestrator: no foreign surfaces", () => {
  it("exposes no process, network, placement, worker, or scheduling surface", async () => {
    const module = await import("./serviceOrchestrator");
    const names = Object.keys(module);
    expect(names.sort()).toEqual([
      "FAILURE_CLASSES",
      "SERVICE_STATES",
      "ServiceOrchestratorError",
      "declareService",
      "effectiveStatus",
      "planStartOrder",
      "planStopOrder",
      "transitionState",
    ]);
    for (const banned of ["spawn", "exec", "child", "process", "shell", "socket", "fetch", "place", "cloud", "worker", "pool", "schedule", "timer", "daemon", "watch", "poll", "upgrade", "migrate", "deploy", "approve", "grant", "store", "persist", "database", "registry", "server"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("running and ready stay distinct through degradation and recovery", () => {
    const defs = declareService([], definition());
    let states = bringReady(defs);
    states = transitionState(defs, states, "svc-a", "DEGRADED", ev({ note: "slow" }));
    expect(states["svc-a"]!.state).toBe("DEGRADED");
    states = transitionState(defs, states, "svc-a", "READY", ev({ readinessObserved: true }));
    expect(states["svc-a"]!.state).toBe("READY");
  });
});
