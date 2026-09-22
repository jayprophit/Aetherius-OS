import { describe, expect, it } from "vitest";
import {
  AdapterRegistry,
  type InvocationAdapter,
  type InvokeRequest,
  type InvokeResult,
} from "../providers/invoke";
import { OllamaAdapter } from "../providers/ollama";
import type { ModelCard } from "../providers/capabilities";
import { ExecutorRegistry } from "./executors";
import { ModelInvokeExecutor, validateModelStepDef } from "./modelInvoke";
import { WorkflowRuntime } from "./runtime";
import { SkillRegistry } from "./skills";
import type { Skill, WorkflowStep } from "./types";

function card(over: Partial<ModelCard> & { id: string }): ModelCard {
  return {
    providerId: "local",
    runtimeId: "ollama",
    localRemote: "local",
    capabilities: {
      contextLimit: 32768, modalities: ["text"], reasoning: true, coding: true,
      vision: false, audio: false, toolUse: false, structuredOutput: false,
    },
    costRank: 1,
    healthy: true,
    ...over,
  };
}

function mstep(over: Partial<WorkflowStep> = {}): WorkflowStep {
  return {
    id: "m", kind: "model-invoke", ref: "model:code", depends_on: [],
    inputs: { prompt: "Say hi", capability: "coding", min_context: "1000", privacy: "local-only" },
    outputs: ["text"], retry_safety: "safe", ...over,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

type RawFetch = (url: string, init: RequestInit) => Response | Promise<Response>;

function stubFetch(handler: RawFetch): (url: string, init: RequestInit) => Promise<Response> {
  return async (url: string, init: RequestInit) => handler(url, init);
}

function stubAdapter(behavior: (req: InvokeRequest) => Promise<InvokeResult>): InvocationAdapter & { calls: InvokeRequest[] } {
  const calls: InvokeRequest[] = [];
  return {
    providerId: "local",
    runtimeId: "ollama",
    local: true,
    calls,
    supports: async () => true,
    invoke: async (req) => {
      calls.push(req);
      return behavior(req);
    },
  };
}

const okResult = (text: string): InvokeResult => ({
  ok: true, requestId: "r", providerId: "local", modelId: "q", runtimeId: "ollama",
  output: text, finishReason: "stop", latencyMs: 5,
  provenance: { route: "local/ollama/q", observedHealth: "HEALTHY", benchmarkUsed: false },
});

function ctxFor(inputs: Record<string, unknown> = {}) {
  return {
    inputs, attempt: 1, signal: new AbortController().signal, runId: "run-1",
    step: mstep(),
  };
}

describe("model step definition", () => {
  it("validates kind, literals, privacy and prompt", () => {
    expect(validateModelStepDef(mstep())).toEqual([]);
    expect(validateModelStepDef({ ...mstep(), kind: "skill" })).toEqual(
      expect.arrayContaining([expect.stringContaining("model-invoke")]),
    );
    expect(validateModelStepDef(mstep({ inputs: { prompt: "x", min_context: "soon" } }))).toEqual(
      expect.arrayContaining([expect.stringContaining("min_context")]),
    );
    expect(validateModelStepDef(mstep({ inputs: { prompt: "x", privacy: "everywhere" } }))).toEqual(
      expect.arrayContaining([expect.stringContaining("privacy")]),
    );
    expect(validateModelStepDef(mstep({ inputs: { capability: "coding" } }))).toEqual(
      expect.arrayContaining([expect.stringContaining("prompt")]),
    );
  });
});

describe("model-invoke executor", () => {
  const cards = [card({ id: "qwen2.5-coder:3b" })];
  it("routes and normalizes a successful invocation", async () => {
    const adapter = stubAdapter(async (req) => okResult(`echo:${(req.messages[0].content as string).slice(0, 2)}`));
    const registry = new AdapterRegistry();
    registry.register(adapter);
    const ex = new ModelInvokeExecutor({ cards, adapters: registry });
    const out = await ex.execute(mstep(), ctxFor({ prompt: "Hello", capability: "coding", min_context: "100", privacy: "local-only" }));
    expect(out.ok).toBe(true);
    expect(out.output).toMatchObject({ text: "echo:He", provider: "local" });
    expect(adapter.calls.length).toBe(1);
    expect(adapter.calls[0].privacy).toBe("local-only");
    expect(adapter.calls[0].trace).toMatchObject({ workflow_run: "run-1" });
  });
  it("fails explicitly with no candidate and propagates P18 errors", async () => {
    const registry = new AdapterRegistry();
    registry.register(stubAdapter(async () => okResult("x")));
    const ex = new ModelInvokeExecutor({ cards: [], adapters: registry });
    const empty = await ex.execute(mstep(), ctxFor({ prompt: "x" }));
    expect(empty.ok).toBe(false);
    expect(empty.error).toContain("no compatible model");
    const denyAdapter = stubAdapter(async () => ({
      ...okResult(""), ok: false,
      error: { code: "MODEL_NOT_AVAILABLE" as const, message: "gone" },
    }));
    const registry2 = new AdapterRegistry();
    registry2.register(denyAdapter);
    const ex2 = new ModelInvokeExecutor({ cards, adapters: registry2 });
    const failed = await ex2.execute(mstep(), ctxFor({ prompt: "x" }));
    expect(failed.ok).toBe(false);
    expect(failed.error).toContain("MODEL_NOT_AVAILABLE");
  });
  it("privacy mismatch never invokes", async () => {
    let called = 0;
    const adapter = stubAdapter(async () => { called += 1; return okResult("x"); });
    const registry = new AdapterRegistry();
    registry.register(adapter);
    const cloudCards = [card({ id: "c", providerId: "cloud", runtimeId: "x", localRemote: "remote" })];
    const ex = new ModelInvokeExecutor({ cards: cloudCards, adapters: registry });
    // Registry holds a local adapter but routing finds only the cloud card;
    // adapter lookup for cloud/x fails → explicit provider failure, no call.
    const r = await ex.execute(mstep(), ctxFor({ prompt: "x", privacy: "local-only" }));
    expect(r.ok).toBe(false);
    expect(called).toBe(0);
  });
  it("timeout and cancellation normalize without provider coupling", async () => {
    // Hanging transport that honors abort exactly like a real fetch.
    const hangingFetch = stubFetch((url, init) => {
      if (url.endsWith("/api/tags")) {
        return jsonResponse({ models: [{ name: "qwen2.5-coder:3b" }] });
      }
      return new Promise((_resolve, reject) => {
        const reason = init.signal?.reason;
        if (init.signal?.aborted) {
          reject(reason instanceof Error ? reason : new Error("timeout"));
          return;
        }
        init.signal?.addEventListener(
          "abort",
          () => reject(init.signal?.reason instanceof Error ? init.signal.reason : new Error("timeout")),
          { once: true },
        );
      });
    });
    const hanging = new OllamaAdapter("http://127.0.0.1:9", hangingFetch, "ollama");
    const registry = new AdapterRegistry();
    registry.register(hanging);
    const ex = new ModelInvokeExecutor({ cards, adapters: registry });
    // Request-level timeout with no caller signal → TIMEOUT.
    const timed = await ex.execute(
      mstep(),
      ctxFor({ prompt: "x", timeout_ms: "50" }),
    );
    expect(timed.ok).toBe(false);
    expect(timed.error).toContain("TIMEOUT");
    // Pre-aborted caller signal → CANCELLED takes precedence.
    const aborted = new AbortController();
    aborted.abort(new Error("stop"));
    const cancelled = await ex.execute(
      mstep(),
      { ...ctxFor({ prompt: "x", timeout_ms: "5000" }), signal: aborted.signal },
    );
    expect(cancelled.ok).toBe(false);
    expect(cancelled.error).toContain("CANCELLED");
  });
  it("manual pin is honored when compatible", async () => {
    const adapter = stubAdapter(async () => okResult("pinned"));
    const registry = new AdapterRegistry();
    registry.register(adapter);
    const ex = new ModelInvokeExecutor({
      cards: [card({ id: "a" }), card({ id: "qwen2.5-coder:3b" })],
      adapters: registry,
    });
    const out = await ex.execute(
      mstep(),
      ctxFor({ prompt: "x", pin: "qwen2.5-coder:3b" }),
    );
    expect(out.ok).toBe(true);
    expect(adapter.calls[0].modelId).toBe("qwen2.5-coder:3b");
  });
});

describe("model workflow integration", () => {
  function testSkill(): Skill {
    return {
      skill_id: "s", version: "1.0.0", name: "s", description: "s", capability: "t",
      inputs: [], outputs: [], required_capabilities: [], required_permissions: [],
      required_tools: [], supported_platforms: ["*"], execution_kind: "model-invoke",
      implementation_ref: "p18", risk_class: "low", provenance: "fixture", status: "REGISTERED",
    };
  }
  it("model step runs inside a workflow with retry on timeout", async () => {
    let calls = 0;
    const adapter = stubAdapter(async () => {
      calls += 1;
      if (calls === 1) {
        return { ...okResult(""), ok: false, error: { code: "TIMEOUT" as const, message: "slow" } };
      }
      return okResult("second try");
    });
    const registry = new AdapterRegistry();
    registry.register(adapter);
    const skills = new SkillRegistry();
    skills.register(testSkill());
    const executors = new ExecutorRegistry();
    executors.register(new ModelInvokeExecutor({ cards: [card({ id: "qwen2.5-coder:3b" })], adapters: registry }));
    const runtime = new WorkflowRuntime(skills, executors, null, {
      now: () => "2026-09-22T00:00:00.000Z",
      id: () => "run-1",
    });
    runtime.define({
      workflow_id: "w", version: "1.0.0", description: "w", inputs: ["q"],
      steps: [{
        id: "m", kind: "model-invoke", ref: "model:code", depends_on: [],
        inputs: { prompt: "$input.q" }, outputs: ["text"],
        retry: { max_attempts: 2, retry_on: "transient" }, retry_safety: "safe",
      }],
    });
    const done = await runtime.advance(runtime.start("w", "1.0.0", { q: "hi" }).run_id);
    expect(done.state).toBe("SUCCEEDED");
    expect(done.steps[0].attempts.length).toBe(2);
    expect(done.steps[0].output).toMatchObject({ text: "second try" });
  });
});
