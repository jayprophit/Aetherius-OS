import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FileStateStore } from "../state/store";
import { routeCapabilityRequest, type ModelCard } from "./capabilities";
import { OllamaProbe } from "./health";
import {
  AdapterRegistry,
  invokeRoute,
  validateInvokeRequest,
  type InvokeRequest,
  type InvocationAdapter,
  type InvokeResult,
} from "./invoke";
import { OllamaAdapter, type FetchFn } from "./ollama";

function req(over: Partial<InvokeRequest> = {}): InvokeRequest {
  return {
    requestId: "r1",
    providerId: "local",
    modelId: "qwen2.5-coder:3b",
    runtimeId: "ollama",
    messages: [{ role: "user", content: "Reply with exactly: PING" }],
    timeoutMs: 5000,
    privacy: "local-only",
    ...over,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function stubFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>): FetchFn & { calls: string[] } {
  const calls: string[] = [];
  const fn = (async (url: string, init: RequestInit) => {
    calls.push(`${init.method ?? "GET"} ${url}`);
    return handler(url, init);
  }) as FetchFn & { calls: string[] };
  fn.calls = calls;
  return fn;
}

const tagsOk = (models: string[] = ["qwen2.5-coder:3b"]) =>
  stubFetch((url) => {
    if (url.endsWith("/api/tags")) return jsonResponse({ models: models.map((name) => ({ name })) });
    if (url.endsWith("/api/version")) return jsonResponse({ version: "0.1.0" });
    throw new Error(`unexpected ${url}`);
  });

function chatOk(fetch: FetchFn, content = "PONG", usage: Record<string, number> = { prompt_eval_count: 10, eval_count: 2 }): FetchFn {
  const inner = fetch as FetchFn & { calls: string[] };
  const wrapped = stubFetch((url, init) => {
    if (url.endsWith("/api/chat")) {
      return jsonResponse({ message: { role: "assistant", content }, done_reason: "stop", ...usage });
    }
    return (fetch as (url: string, init: RequestInit) => Promise<Response>)(url, init);
  });
  const outer = wrapped as FetchFn & { calls: string[] };
  void inner;
  return outer;
}

describe("invocation contract", () => {
  it("rejects invalid requests", () => {
    expect(validateInvokeRequest(req({ modelId: "" }))).toContain("modelId");
    expect(validateInvokeRequest(req({ messages: [] }))).toContain("message");
    expect(validateInvokeRequest(req({ timeoutMs: 0 }))).toContain("timeoutMs");
    expect(validateInvokeRequest(req({ messages: [{ role: "system", content: "x" }] }))).toBeNull();
    expect(
      validateInvokeRequest(req({ messages: [{ role: "villain", content: "x" } as unknown as { role: "user"; content: string }] })),
    ).toContain("role");
  });
  it("missing adapter and unsupported model fail explicitly", async () => {
    const registry = new AdapterRegistry();
    const missing = await invokeRoute(registry, {
      route: { providerId: "nope", runtimeId: "nope", modelId: "m", observedHealth: "UNKNOWN", benchmarkUsed: false },
      request: req(),
    });
    expect(missing.ok).toBe(false);
    expect(missing.error?.code).toBe("PROVIDER_UNAVAILABLE");
    const adapter = new OllamaAdapter("http://127.0.0.1:9", tagsOk([]));
    registry.register(adapter);
    const unsupported = await invokeRoute(registry, {
      route: { providerId: "local", runtimeId: "ollama", modelId: "ghost", observedHealth: "UNKNOWN", benchmarkUsed: false },
      request: req({ modelId: "ghost" }),
    });
    expect(unsupported.error?.code).toBe("UNSUPPORTED_CAPABILITY");
  });
  it("privacy mismatch never reaches transport", async () => {
    let called = 0;
    const remote: InvocationAdapter = {
      providerId: "cloud", runtimeId: "x", local: false,
      supports: () => true,
      invoke: async (): Promise<InvokeResult> => { called += 1; throw new Error("must not run"); },
    };
    const registry = new AdapterRegistry();
    registry.register(remote);
    const denied = await invokeRoute(registry, {
      route: { providerId: "cloud", runtimeId: "x", modelId: "m", observedHealth: "UNKNOWN", benchmarkUsed: false },
      request: req({ providerId: "cloud", runtimeId: "x", privacy: "local-only" }),
    });
    expect(denied.error?.code).toBe("POLICY_DENIED");
    expect(called).toBe(0);
  });
  it("duplicate adapter registration is rejected", () => {
    const registry = new AdapterRegistry();
    registry.register(new OllamaAdapter());
    expect(() => registry.register(new OllamaAdapter())).toThrowError(/already registered/);
  });
});

describe("ollama adapter", () => {
  it("successful invocation normalizes output, usage and provenance", async () => {
    const fetch = chatOk(tagsOk());
    const adapter = new OllamaAdapter("http://127.0.0.1:9", fetch);
    const r = await adapter.invoke(req());
    expect(r.ok).toBe(true);
    expect(r.output).toBe("PONG");
    expect(r.usage).toMatchObject({ inputTokens: 10, outputTokens: 2, totalTokens: 12 });
    expect(r.finishReason).toBe("stop");
    expect(r.provenance.route).toContain("ollama");
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
  it("unknown usage fields stay unknown, never fabricated", async () => {
    const fetch = chatOk(tagsOk(), "PONG", {});
    const r = await new OllamaAdapter("http://127.0.0.1:9", fetch).invoke(req());
    expect(r.ok).toBe(true);
    expect(r.usage).toBeUndefined();
  });
  it("model missing is distinguished from daemon down; never auto-pulls", async () => {
    const fetch = tagsOk(["other-model"]);
    const adapter = new OllamaAdapter("http://127.0.0.1:9", fetch);
    const missing = await adapter.invoke(req());
    expect(missing.error?.code).toBe("MODEL_NOT_AVAILABLE");
    expect(fetch.calls.some((c) => c.includes("/api/pull"))).toBe(false);
    const dead = new OllamaAdapter(
      "http://127.0.0.1:9",
      stubFetch(() => { throw new Error("connect ECONNREFUSED"); }),
    );
    expect((await dead.invoke(req())).error?.code).toBe("RUNTIME_UNAVAILABLE");
  });
  it("timeout, cancellation, malformed and provider errors normalize", async () => {
    const hanging = new OllamaAdapter(
      "http://127.0.0.1:9",
      stubFetch((url, init) => {
        if (url.endsWith("/api/tags")) return jsonResponse({ models: [{ name: "qwen2.5-coder:3b" }] });
        // Hang like a stalled server, but honor abort like a real transport
        // (including an already-aborted signal).
        return new Promise((_resolve, reject) => {
          if (init.signal?.aborted) {
            reject(init.signal.reason instanceof Error ? init.signal.reason : new Error("timeout"));
            return;
          }
          init.signal?.addEventListener(
            "abort",
            () => reject(init.signal?.reason instanceof Error ? init.signal.reason : new Error("timeout")),
            { once: true },
          );
        });
      }),
    );
    const timed = await hanging.invoke(req({ requestId: "t", timeoutMs: 50 }));
    expect(timed.error?.code).toBe("TIMEOUT");
    const aborted = new AbortController();
    aborted.abort(new Error("user stop"));
    const cancelled = await hanging.invoke(req({ requestId: "c", timeoutMs: 5000, signal: aborted.signal }));
    expect(cancelled.error?.code).toBe("CANCELLED");
    const malformed = new OllamaAdapter(
      "http://127.0.0.1:9",
      stubFetch((url) => {
        if (url.endsWith("/api/tags")) return jsonResponse({ models: [{ name: "qwen2.5-coder:3b" }] });
        return new Response("not json{{", { status: 200 });
      }),
    );
    expect((await malformed.invoke(req({ requestId: "m" }))).error?.code).toBe("MALFORMED_RESPONSE");
    const http500 = new OllamaAdapter(
      "http://127.0.0.1:9",
      stubFetch((url) => {
        if (url.endsWith("/api/tags")) return jsonResponse({ models: [{ name: "qwen2.5-coder:3b" }] });
        return new Response("boom", { status: 500 });
      }),
    );
    expect((await http500.invoke(req({ requestId: "e" }))).error?.code).toBe("PROVIDER_ERROR");
  });
  it("same normalized interface independent of provider shape", async () => {
    const registry = new AdapterRegistry();
    registry.register(new OllamaAdapter("http://127.0.0.1:9", chatOk(tagsOk())));
    const stub: InvocationAdapter = {
      providerId: "local", runtimeId: "stub", local: true,
      supports: async () => true,
      invoke: async (request): Promise<InvokeResult> => ({
        ok: true, requestId: request.requestId, providerId: "local", modelId: request.modelId,
        runtimeId: "stub", output: "STUB", latencyMs: 1,
        provenance: { route: "local/stub", observedHealth: "UNKNOWN", benchmarkUsed: false },
      }),
    };
    registry.register(stub);
    for (const runtime of ["ollama", "stub"]) {
      const r = await invokeRoute(registry, {
        route: { providerId: "local", runtimeId: runtime, modelId: "m", observedHealth: "UNKNOWN", benchmarkUsed: false },
        request: req({ runtimeId: runtime }),
      });
      expect(r.ok).toBe(true);
      expect(typeof r.output).toBe("string");
      expect(r.provenance.route).toContain(runtime);
    }
  });
});

describe("route then invoke", () => {
  const models: ModelCard[] = [
    {
      id: "qwen2.5-coder:3b", providerId: "local", localRemote: "local",
      capabilities: {
        contextLimit: 32768, modalities: ["text"], reasoning: true, coding: true,
        vision: false, audio: false, toolUse: false, structuredOutput: false,
      },
      costRank: 1, healthy: true,
    },
  ];
  it("compatible + healthy selects and invokes; disappearance becomes normalized failure", async () => {
    const routed = routeCapabilityRequest(models, {
      minContext: 1000, modalities: ["text"], coding: true, privacy: "local-only",
    });
    expect(routed.ranked.map((m) => m.id)).toEqual(["qwen2.5-coder:3b"]);
    const registry = new AdapterRegistry();
    registry.register(new OllamaAdapter("http://127.0.0.1:9", chatOk(tagsOk())));
    const ok = await invokeRoute(registry, {
      route: { providerId: "local", runtimeId: "ollama", modelId: "qwen2.5-coder:3b", observedHealth: "HEALTHY", benchmarkUsed: false },
      request: req(),
    });
    expect(ok.ok).toBe(true);
    // Runtime disappears between routing and invocation (TOCTOU).
    const gone = new AdapterRegistry();
    gone.register(
      new OllamaAdapter("http://127.0.0.1:9", stubFetch(() => { throw new Error("connect ECONNREFUSED"); })),
    );
    const failed = await invokeRoute(gone, {
      route: { providerId: "local", runtimeId: "ollama", modelId: "qwen2.5-coder:3b", observedHealth: "HEALTHY", benchmarkUsed: false },
      request: req({ requestId: "gone" }),
    });
    expect(failed.ok).toBe(false);
    // Daemon vanished: availability unverifiable → honest transport failure,
    // never a fabricated "model missing".
    expect(failed.error?.code).toBe("TRANSPORT_ERROR");
  });
  it("invocation evidence persists metadata only through P17 state", () => {
    const store = new FileStateStore(mkdtempSync(join(tmpdir(), "invoke-evidence-")), 1);
    const result = {
      ok: true, requestId: "r1", providerId: "local", modelId: "m", runtimeId: "ollama",
      latencyMs: 12, status: "INVOCATION_SUCCESS",
      provenance: { route: "local/ollama/m", observedHealth: "HEALTHY", benchmarkUsed: false },
    };
    const saved = store.save({
      id: "inv-r1", kind: "invocation-evidence", schemaVersion: 1, recordVersion: 1,
      createdAt: "2026-09-22T00:00:00.000Z", updatedAt: "2026-09-22T00:00:00.000Z",
      owner: "aetherius-os", provenance: "unit test", sensitivity: "SYSTEM",
      integrity: "", payload: result,
    });
    const loaded = store.load<typeof result>("inv-r1");
    expect(loaded.payload).toEqual(result);
    expect(JSON.stringify(loaded.payload)).not.toContain("PONG");
    expect(saved.integrity).toBeTruthy();
  });
});

describe("real local runtime (safe, optional)", () => {
  it("ollama probe is truthful; minimal invoke only when healthy with model", async () => {
    const probe = new OllamaProbe();
    const { record, detail } = await probe.probe();
    if (record.status !== "HEALTHY") {
      expect(record.status).toBe("UNAVAILABLE");
      expect(record.reason.length).toBeGreaterThan(0);
      return;
    }
    const models = (detail.models as string[]).filter(Boolean);
    expect(models.length).toBeGreaterThan(0);
    const target = models.includes("qwen2.5-coder:3b") ? "qwen2.5-coder:3b" : models[0];
    const adapter = new OllamaAdapter();
    const r = await adapter.invoke({
      requestId: "p18-3-live-probe", providerId: "local", modelId: target, runtimeId: "ollama",
      messages: [{ role: "user", content: "Reply with exactly: P18LIVE" }],
      timeoutMs: 90000, privacy: "local-only",
    });
    expect(r.ok).toBe(true);
    expect(typeof r.output).toBe("string");
    expect((r.output ?? "").length).toBeGreaterThan(0);
  }, 120000);
});
