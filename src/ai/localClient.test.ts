import { describe, it, expect, vi, afterEach } from "vitest";
import { chooseLocalModel, chatWithLocalModel, listLocalModels } from "./localClient";

// These tests mock fetch and never touch a real Ollama daemon. They cover the
// Nov 9 repair: empty output must fail, thinking-only must fail, truncation must fail.

function mockFetch(payload: unknown, ok = true, status = 200) {
  return vi.fn(async (url: string) => {
    if (String(url).includes("/api/tags")) {
      return { ok: true, status: 200, text: async () => JSON.stringify({ models: [{ name: "qwen3.5:0.8b" }] }) } as Response;
    }
    return { ok, status, text: async () => JSON.stringify(payload) } as Response;
  });
}

afterEach(() => vi.restoreAllMocks());

describe("chooseLocalModel", () => {
  it("prefers the measured-functioning qwen3.5:0.8b", () => {
    expect(chooseLocalModel(["llama3.2:3b", "qwen3.5:0.8b"])).toBe("qwen3.5:0.8b");
  });
  it("explicit requested always wins", () => {
    expect(chooseLocalModel(["qwen3.5:0.8b", "llama3.2:3b"], "llama3.2:3b")).toBe("llama3.2:3b");
  });
  it("falls back to first installed", () => {
    expect(chooseLocalModel(["zzz:latest"])).toBe("zzz:latest");
  });
  it("returns null when empty", () => {
    expect(chooseLocalModel([])).toBeNull();
  });
});

describe("chatWithLocalModel empty/thinking/truncation", () => {
  it("succeeds on valid content with eval metadata", async () => {
    vi.stubGlobal("fetch", mockFetch({ model: "qwen3.5:0.8b", message: { content: "HELLO WORLD" }, done: true, done_reason: "stop", eval_count: 4 }));
    const r = await chatWithLocalModel([{ role: "user", content: "hi" }], { timeoutMs: 5000 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.text).toBe("HELLO WORLD");
      expect(r.evalCount).toBe(4);
      expect(r.doneReason).toBe("stop");
    }
  });

  it("treats empty content as EMPTY_OUTPUT, not success", async () => {
    vi.stubGlobal("fetch", mockFetch({ model: "qwen3.5:0.8b", message: { content: "" }, done: true, done_reason: "stop" }));
    const r = await chatWithLocalModel([{ role: "user", content: "hi" }], { timeoutMs: 5000 });
    expect(r.ok).toBe(false);
    if (r.ok === false) expect(r.code).toBe("EMPTY_OUTPUT");
  });

  it("treats whitespace-only as EMPTY_OUTPUT", async () => {
    vi.stubGlobal("fetch", mockFetch({ model: "qwen3.5:0.8b", message: { content: "   \n  " }, done: true, done_reason: "stop" }));
    const r = await chatWithLocalModel([{ role: "user", content: "hi" }], { timeoutMs: 5000 });
    expect(r.ok).toBe(false);
    if (r.ok === false) expect(r.code).toBe("EMPTY_OUTPUT");
  });

  it("treats reasoning-only (thinking, no content) as EMPTY_OUTPUT", async () => {
    vi.stubGlobal("fetch", mockFetch({ model: "qwen3.5:0.8b", message: { content: "", thinking: "let me think..." }, done: true, done_reason: "stop" }));
    const r = await chatWithLocalModel([{ role: "user", content: "hi" }], { timeoutMs: 5000 });
    expect(r.ok).toBe(false);
    if (r.ok === false) expect(r.code).toBe("EMPTY_OUTPUT");
  });

  it("treats length truncation with empty content as TRUNCATED", async () => {
    vi.stubGlobal("fetch", mockFetch({ model: "qwen3.5:0.8b", message: { content: "" }, done: true, done_reason: "length" }));
    const r = await chatWithLocalModel([{ role: "user", content: "hi" }], { timeoutMs: 5000 });
    expect(r.ok).toBe(false);
    if (r.ok === false) expect(r.code).toBe("TRUNCATED");
  });

  it("sends think:false by default", async () => {
    const seen: string[] = [];
    vi.stubGlobal("fetch", async (url: string, init?: { body?: string }) => {
      if (String(url).includes("/api/tags")) {
        return { ok: true, status: 200, text: async () => JSON.stringify({ models: [{ name: "qwen3.5:0.8b" }] }) } as Response;
      }
      seen.push(String(init?.body ?? ""));
      return { ok: true, status: 200, text: async () => JSON.stringify({ model: "qwen3.5:0.8b", message: { content: "HELLO WORLD" }, done: true, done_reason: "stop" }) } as Response;
    });
    await chatWithLocalModel([{ role: "user", content: "hi" }], { timeoutMs: 5000 });
    expect(JSON.parse(seen[0]!).think).toBe(false);
  });

  it("returns CANCELLED when caller aborts before sending", async () => {
    const controller = new AbortController();
    // Mock fetch must respect abort: it checks signal before resolving.
    vi.stubGlobal("fetch", async (_url: string, init?: { signal?: AbortSignal }) => {
      if (init?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (String(_url).includes("/api/tags")) {
        return { ok: true, status: 200, text: async () => JSON.stringify({ models: [{ name: "qwen3.5:0.8b" }] }) } as Response;
      }
      return { ok: true, status: 200, text: async () => JSON.stringify({ model: "qwen3.5:0.8b", message: { content: "x" }, done: true, done_reason: "stop" }) } as Response;
    });
    controller.abort();
    const r = await chatWithLocalModel([{ role: "user", content: "hi" }], { timeoutMs: 5000, signal: controller.signal });
    expect(r.ok).toBe(false);
    if (r.ok === false) {
      const code: string = (r as unknown as { code: string }).code;
      expect(code).toBe("CANCELLED");
    }
  });

  it("listLocalModels returns [] when daemon errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, text: async () => "{}" } as Response)));
    expect(await listLocalModels("http://127.0.0.1:9999")).toEqual([]);
  });
});
