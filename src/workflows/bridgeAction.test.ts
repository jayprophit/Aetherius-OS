import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { ExecutorRegistry } from "./executors";
import {
  BridgeActionExecutor,
  HttpBridgeTransport,
  validateBridgeStepDef,
  type BridgeActionRequest,
  type BridgeActionResponse,
  type BridgeTransport,
} from "./bridgeAction";
import { WorkflowRuntime } from "./runtime";
import { SkillRegistry } from "./skills";
import type { Skill, WorkflowStep } from "./types";

const servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise<void>((r) => s.close(() => r()))));
});

/** Governed stub bridge: grants, approvals, protected set, dedup by action_id. */
class StubBridge implements BridgeTransport {
  executed = 0;
  sideEffects: string[] = [];
  private readonly results = new Map<string, BridgeActionResponse>();
  private readonly approvedIds = new Set<string>();
  constructor(
    private readonly grants: Set<string> = new Set(["filesystem:read", "filesystem:write"]),
    private readonly approvals: Set<string> = new Set(["filesystem:delete"]),
    private readonly protectedActions: Set<string> = new Set(["filesystem:delete", "finance:pay", "device:flash"]),
  ) {}
  /** Models out-of-band approval propagation to the bridge. */
  approveAction(actionId: string): void {
    this.approvedIds.add(actionId);
  }
  async submit(req: BridgeActionRequest): Promise<BridgeActionResponse> {
    const prior = this.results.get(req.actionId);
    if (prior) {
      // Redelivery after an approval wait succeeds exactly once, and only
      // if approval was explicitly propagated; otherwise the stored verdict
      // repeats without a new side effect.
      if (prior.outcome === "WAITING_APPROVAL" && this.approvedIds.has(req.actionId)) {
        this.executed += 1;
        this.sideEffects.push(req.actionId);
        const done: BridgeActionResponse = {
          outcome: "SUCCEEDED",
          output: { result: `did:${req.action}:${req.resource}` },
          evidence: { actionId: req.actionId, deduped: true },
        };
        this.results.set(req.actionId, { ...done, evidence: { actionId: req.actionId, deduped: false } });
        return done;
      }
      return { ...prior, evidence: { actionId: req.actionId, deduped: true } };
    }
    let response: BridgeActionResponse;
    const base = { evidence: { actionId: req.actionId, deduped: false } };
    if (this.protectedActions.has(req.action) && req.ownerMode !== "OWNER_FULL_CONTROL_APPROVED") {
      response = { ...base, outcome: "WAITING_APPROVAL", approvalId: `appr-${req.actionId}`, error: "protected action needs approval" };
    } else if (this.approvals.has(req.action) && req.ownerMode === "AUTO_SAFE") {
      response = { ...base, outcome: "WAITING_APPROVAL", approvalId: `appr-${req.actionId}`, error: "approval required" };
    } else if (!this.grants.has(req.action) && !req.ownerMode.startsWith("OWNER_FULL_CONTROL")) {
      response = { ...base, outcome: "DENIED", error: `no grant for ${req.action}` };
    } else {
      this.executed += 1;
      if (!req.action.endsWith(":read") && !req.action.endsWith(":list")) {
        this.sideEffects.push(req.actionId);
      }
      response = { ...base, outcome: "SUCCEEDED", output: { result: `did:${req.action}:${req.resource}` } };
    }
    this.results.set(req.actionId, response);
    return { ...response };
  }
}

function bstep(over: Partial<WorkflowStep> = {}): WorkflowStep {
  return {
    id: "b", kind: "bridge-action", ref: "bridge:filesystem:read", depends_on: [],
    inputs: { resource: "/ws/file.txt" }, outputs: ["result"], retry_safety: "safe", ...over,
  };
}

function ctxFor(inputs: Record<string, unknown> = {}, runId = "run-1") {
  return {
    inputs, attempt: 1, signal: new AbortController().signal, runId,
    step: bstep(),
  };
}

function executor(bridge: StubBridge, ownerMode = "AUTO_SAFE") {
  return new BridgeActionExecutor({
    transport: bridge,
    principal: "genesis/test-run",
    defaultWorkspace: "/ws",
    defaultOwnerMode: ownerMode,
  });
}

describe("bridge step definition", () => {
  it("validates ref, resource and owner mode", () => {
    expect(validateBridgeStepDef(bstep())).toEqual([]);
    expect(validateBridgeStepDef({ ...bstep(), kind: "skill" })).toEqual(
      expect.arrayContaining([expect.stringContaining("bridge-action")]),
    );
    expect(validateBridgeStepDef({ ...bstep(), ref: "nope" })).toEqual(
      expect.arrayContaining([expect.stringContaining("bridge:<domain>:<action>")]),
    );
    const noRes = bstep({ inputs: {} });
    expect(validateBridgeStepDef(noRes)).toEqual(
      expect.arrayContaining([expect.stringContaining("resource")]),
    );
  });
});

describe("bridge-action executor", () => {
  it("read and write succeed through grants with provenance", async () => {
    const bridge = new StubBridge();
    const ex = executor(bridge);
    const read = await ex.execute(bstep(), ctxFor({ resource: "/ws/a.txt" }, "run-r"));
    expect(read.ok).toBe(true);
    expect(read.output).toMatchObject({ result: "did:filesystem:read:/ws/a.txt" });
    const write = await ex.execute(
      bstep({ ref: "bridge:filesystem:write" }),
      ctxFor({ resource: "/ws/a.txt", content: "hi" }, "run-w"),
    );
    expect(write.ok).toBe(true);
    expect(bridge.executed).toBe(2);
  });
  it("denied actions fail without retry", async () => {
    const bridge = new StubBridge(new Set());
    const ex = executor(bridge);
    const r = await ex.execute(bstep(), ctxFor({ resource: "/ws/a.txt" }));
    expect(r.ok).toBe(false);
    expect(r.retryable).toBe(false);
    expect(r.error).toContain("denied");
  });
  it("approval-gated action pauses; ALLOW resumes exactly once", async () => {
    const bridge = new StubBridge(new Set(["filesystem:read"]), new Set(["filesystem:delete"]));
    const ex = executor(bridge);
    const waiting = await ex.execute(
      bstep({ ref: "bridge:filesystem:delete" }),
      ctxFor({ resource: "/ws/victim.txt" }, "run-direct"),
    );
    expect(waiting.ok).toBe(false);
    expect(waiting.waitingApproval).toBe(true);
    expect(waiting.approvalId).toContain("run-direct:b");
    // Resume re-submits the same action id: bridge dedups, no second side effect.
    const skills = new SkillRegistry();
    skills.register({
      skill_id: "s", version: "1.0.0", name: "s", description: "s", capability: "t",
      inputs: [], outputs: [], required_capabilities: [], required_permissions: [],
      required_tools: [], supported_platforms: ["*"], execution_kind: "bridge-action",
      implementation_ref: "bridge", risk_class: "high", provenance: "fixture", status: "REGISTERED",
    });
    const executors = new ExecutorRegistry();
    executors.register(ex);
    const runtime = new WorkflowRuntime(skills, executors, null, {
      now: () => "2026-09-22T00:00:00.000Z",
      id: () => "run-1",
    });
    runtime.define({
      workflow_id: "w", version: "1.0.0", description: "w", inputs: [],
      steps: [{ ...bstep({ ref: "bridge:filesystem:delete" }), retry_safety: "unsafe" }],
    });
    const started = runtime.start("w", "1.0.0");
    const paused = await runtime.advance(started.run_id);
    expect(paused.state).toBe("WAITING_APPROVAL");
    // Out-of-band approval propagation to the bridge, then P19 approve.
    bridge.approveAction("run-1:b");
    const done = await runtime.approve(paused.run_id, "b", "ALLOW", "owner");
    expect(done.state).toBe("SUCCEEDED");
    expect(bridge.sideEffects.filter((id) => id === "run-1:b").length).toBe(1);
  });
  it("DENY fails deterministically with evidence", async () => {
    const bridge = new StubBridge(new Set(["filesystem:read"]), new Set(["filesystem:delete"]));
    const skills = new SkillRegistry();
    skills.register({
      skill_id: "s", version: "1.0.0", name: "s", description: "s", capability: "t",
      inputs: [], outputs: [], required_capabilities: [], required_permissions: [],
      required_tools: [], supported_platforms: ["*"], execution_kind: "bridge-action",
      implementation_ref: "bridge", risk_class: "high", provenance: "fixture", status: "REGISTERED",
    });
    const executors = new ExecutorRegistry();
    executors.register(executor(bridge));
    const runtime = new WorkflowRuntime(skills, executors, null, {
      now: () => "2026-09-22T00:00:00.000Z",
      id: () => "run-1",
    });
    runtime.define({
      workflow_id: "w", version: "1.0.0", description: "w", inputs: [],
      steps: [{ ...bstep({ ref: "bridge:filesystem:delete" }), retry_safety: "unsafe" }],
    });
    const paused = await runtime.advance(runtime.start("w", "1.0.0").run_id);
    const done = await runtime.approve(paused.run_id, "b", "DENY", "owner");
    expect(done.state).toBe("FAILED");
    expect(done.failure).toContain("denied");
  });
  it("timeout, cancellation, unknown action and invalid resource", async () => {
    const hanging: BridgeTransport = { submit: () => new Promise(() => {}) };
    const ex = new BridgeActionExecutor({
      transport: hanging, principal: "p", defaultWorkspace: "/ws", defaultOwnerMode: "AUTO_SAFE",
    });
    const timed = await ex.execute(
      bstep(),
      { ...ctxFor({ resource: "/ws/x", timeout_ms: "40" }), signal: AbortSignal.timeout(5000) },
    );
    expect(timed.ok).toBe(false);
    expect(timed.error).toContain("timeout");
    const aborted = new AbortController();
    aborted.abort(new Error("stop"));
    const cancelled = await ex.execute(bstep(), { ...ctxFor({ resource: "/ws/x" }), signal: aborted.signal });
    expect(cancelled.ok).toBe(false);
    expect(cancelled.error).toContain("cancelled");
    const badRef = await ex.execute({ ...bstep(), ref: "bridge:nope" }, ctxFor({ resource: "/ws/x" }));
    expect(badRef.ok).toBe(false);
    const noRes = await ex.execute(bstep(), ctxFor({ resource: "   " }));
    expect(noRes.ok).toBe(false);
    expect(noRes.error).toContain("resource");
  });
  it("interrupted unsafe action becomes RECOVERING, never assumed", async () => {
    const flaky: BridgeTransport = {
      submit: (() => {
        let sent = false;
        return async (req: BridgeActionRequest) => {
          if (!sent) {
            sent = true;
            throw new Error("connection lost after transmit");
          }
          return {
            outcome: "SUCCEEDED" as const,
            output: { result: "reconciled" },
            evidence: { actionId: req.actionId, deduped: true },
          };
        };
      })(),
    };
    const ex = new BridgeActionExecutor({
      transport: flaky, principal: "p", defaultWorkspace: "/ws", defaultOwnerMode: "AUTO_SAFE",
    });
    const skills = new SkillRegistry();
    skills.register({
      skill_id: "s", version: "1.0.0", name: "s", description: "s", capability: "t",
      inputs: [], outputs: [], required_capabilities: [], required_permissions: [],
      required_tools: [], supported_platforms: ["*"], execution_kind: "bridge-action",
      implementation_ref: "bridge", risk_class: "critical", provenance: "fixture", status: "REGISTERED",
    });
    const executors = new ExecutorRegistry();
    executors.register(ex);
    const runtime = new WorkflowRuntime(skills, executors, null, {
      now: () => "2026-09-22T00:00:00.000Z",
      id: () => "run-1",
    });
    runtime.define({
      workflow_id: "w", version: "1.0.0", description: "w", inputs: [],
      steps: [{ ...bstep(), retry_safety: "unsafe" }],
    });
    const done = await runtime.advance(runtime.start("w", "1.0.0").run_id);
    expect(done.state).toBe("RECOVERING");
    expect(done.steps[0].state).toBe("RECOVERING");
    const retried = runtime.reconcile(done.run_id, "b", "retry");
    expect(retried.steps[0].state).toBe("PENDING");
    const finished = await runtime.advance(done.run_id);
    expect(finished.state).toBe("SUCCEEDED");
    expect(finished.steps[0].output).toMatchObject({ result: "reconciled" });
  });
  it("session/workspace mismatch is denied by the bridge", async () => {
    const scoped: BridgeTransport = {
      submit: async (req) =>
        req.workspace === "/ws"
          ? { outcome: "SUCCEEDED", output: {}, evidence: { actionId: req.actionId, deduped: false } }
          : { outcome: "DENIED", error: "workspace not granted", evidence: { actionId: req.actionId, deduped: false } },
    };
    const ex = new BridgeActionExecutor({
      transport: scoped, principal: "p", defaultWorkspace: "/ws", defaultOwnerMode: "AUTO_SAFE",
    });
    const r = await ex.execute(bstep(), ctxFor({ resource: "/ws/a", workspace: "/elsewhere" }));
    expect(r.ok).toBe(false);
    expect(r.error).toContain("not granted");
  });
});

describe("OWNER_FULL_CONTROL broad grants without bypass", () => {
  const ownerBridge = new StubBridge(
    new Set(["filesystem:read", "filesystem:write"]),
    new Set(),
    new Set(["filesystem:delete", "finance:pay", "device:flash"]),
  );
  it("reversible operations proceed without per-action approval", async () => {
    const ex = executor(ownerBridge, "OWNER_FULL_CONTROL");
    const r = await ex.execute(
      bstep({ ref: "bridge:filesystem:write" }),
      ctxFor({ resource: "/ws/note.txt", content: "x", owner_mode: "OWNER_FULL_CONTROL" }),
    );
    // Stub models broad grant: write is not protected → succeeds, no approval.
    expect(r.ok).toBe(true);
  });
  it("protected irreversible operations stay owner-gated", async () => {
    const ex = executor(ownerBridge, "OWNER_FULL_CONTROL");
    let n = 0;
    for (const [ref, resource] of [
      ["bridge:filesystem:delete", "/ws/victim.txt"],
      ["bridge:finance:pay", "invoice-1"],
    ]) {
      n += 1;
      const r = await ex.execute(
        bstep({ ref }),
        ctxFor({ resource, owner_mode: "OWNER_FULL_CONTROL" }, `run-p${n}`),
      );
      expect(r.waitingApproval).toBe(true);
    }
  });
});

describe("HTTP bridge transport", () => {
  function server(handler: (body: Record<string, unknown>) => { status: number; body: unknown }): Promise<string> {
    return new Promise((resolve) => {
      const s = createServer((req, res) => {
        let text = "";
        req.on("data", (chunk: Buffer) => { text += chunk.toString(); });
        req.on("end", () => {
          const parsed = JSON.parse(text) as Record<string, unknown>;
          const out = handler(parsed);
          res.writeHead(out.status, { "content-type": "application/json" });
          res.end(JSON.stringify(out.body));
        });
      });
      s.listen(0, "127.0.0.1", () => {
        const address = s.address();
        const port = typeof address === "object" && address ? address.port : 0;
        servers.push(s);
        resolve(`http://127.0.0.1:${port}`);
      });
    });
  }
  const baseReq = (actionId: string) => ({
    actionId, principal: "p", sessionId: "s", workspace: "/ws",
    action: "filesystem:read", resource: "/ws/a", ownerMode: "AUTO_SAFE",
    provenance: { runId: "r", stepId: "b", attempt: 1 }, timeoutMs: 5000,
  });
  it("maps success, deny, approval and malformed responses", async () => {
    const url = await server((body) => {
      if (body.action === "filesystem:read") {
        return { status: 200, body: { outcome: "SUCCEEDED", output: { result: 1 } } };
      }
      if (body.action === "filesystem:delete") {
        return { status: 200, body: { outcome: "WAITING_APPROVAL", approval_id: "a1" } };
      }
      return { status: 200, body: { outcome: "DENIED", error: "no" } };
    });
    const transport = new HttpBridgeTransport(url);
    expect((await transport.submit(baseReq("1"))).outcome).toBe("SUCCEEDED");
    const waiting = await transport.submit({ ...baseReq("2"), action: "filesystem:delete" });
    expect(waiting.outcome).toBe("WAITING_APPROVAL");
    expect(waiting.approvalId).toBe("a1");
    expect((await transport.submit({ ...baseReq("3"), action: "nope" })).outcome).toBe("DENIED");
    const badUrl = await server(() => ({ status: 200, body: { outcome: "BOGUS" } }));
    const bad = new HttpBridgeTransport(badUrl);
    expect((await bad.submit(baseReq("4"))).outcome).toBe("FAILED");
  });
  it("unreachable bridge becomes a normalized failure, never a throw", async () => {
    const transport = new HttpBridgeTransport("http://127.0.0.1:9");
    const r = await transport.submit(baseReq("x"));
    expect(r.outcome).toBe("TIMED_OUT");
    expect(r.error).toContain("unreachable");
  });
});
