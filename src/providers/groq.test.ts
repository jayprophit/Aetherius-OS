import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { GroqAdapter } from "./groq.ts";
import { AdapterRegistry, invokeRoute, type InvokeRequest } from "./invoke.ts";

const servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise<void>((r) => s.close(() => r()))));
});

type Handler = (url: string, body: unknown, auth: string | null) => { status: number; body: unknown };

function stubServer(handler: Handler): Promise<string> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", () => {
        let body: unknown = null;
        try {
          body = raw ? JSON.parse(raw) : null;
        } catch {
          body = raw;
        }
        const out = handler(req.url ?? "/", body, req.headers.authorization ?? null);
        res.writeHead(out.status, { "content-type": "application/json" });
        res.end(JSON.stringify(out.body));
      });
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      servers.push(server);
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

function req(over: Partial<InvokeRequest> = {}): InvokeRequest {
  return {
    requestId: "r1",
    providerId: "groq",
    modelId: "openai/gpt-oss-20b",
    runtimeId: "groq",
    messages: [{ role: "user", content: "hi" }],
    timeoutMs: 5000,
    privacy: "cloud-allowed",
    ...over,
  };
}

const SECRET = "TEST_GROQ_SECRET";

describe("GroqAdapter", () => {
  it("reports AUTH_REQUIRED when no credential resolves", async () => {
    const adapter = new GroqAdapter(async () => undefined);
    const result = await adapter.invoke(req());
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("AUTH_REQUIRED");
  });

  it("sends the credential by reference and normalizes a completion", async () => {
    const baseUrl = await stubServer((url, body, auth) => {
      if (url.endsWith("/models")) {
        return { status: 200, body: { data: [{ id: "openai/gpt-oss-20b" }] } };
      }
      expect(auth).toBe(`Bearer ${SECRET}`);
      expect((body as { model: string }).model).toBe("openai/gpt-oss-20b");
      return {
        status: 200,
        body: {
          choices: [{ message: { content: "OK" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 3, completion_tokens: 1, total_tokens: 4 },
        },
      };
    });
    const adapter = new GroqAdapter(async () => SECRET, { baseUrl });
    const result = await adapter.invoke(req());
    expect(result.ok).toBe(true);
    expect(result.output).toBe("OK");
    expect(result.usage?.totalTokens).toBe(4);
  });

  it("supports only models the account can see", async () => {
    const baseUrl = await stubServer(() => ({
      status: 200,
      body: { data: [{ id: "openai/gpt-oss-20b" }] },
    }));
    const adapter = new GroqAdapter(async () => SECRET, { baseUrl });
    expect(await adapter.supports("openai/gpt-oss-20b")).toBe(true);
    expect(await adapter.supports("openai/gpt-oss-120b")).toBe(false);
  });

  it("maps HTTP failures onto the neutral vocabulary", async () => {
    const baseUrl = await stubServer(() => ({ status: 429, body: { error: "slow down" } }));
    const adapter = new GroqAdapter(async () => SECRET, { baseUrl });
    const result = await adapter.invoke(req());
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("RATE_LIMITED");
  });

  it("never exposes the credential in the result", async () => {
    const baseUrl = await stubServer(() => ({ status: 500, body: { error: "boom" } }));
    const adapter = new GroqAdapter(async () => SECRET, { baseUrl });
    const result = await adapter.invoke(req());
    expect(JSON.stringify(result)).not.toContain(SECRET);
  });

  it("rejects LOCAL_ONLY requests through invokeRoute", async () => {
    const baseUrl = await stubServer(() => ({ status: 200, body: {} }));
    const registry = new AdapterRegistry();
    registry.register(new GroqAdapter(async () => SECRET, { baseUrl }));
    const result = await invokeRoute(registry, {
      route: { providerId: "groq", runtimeId: "groq", modelId: "openai/gpt-oss-20b", observedHealth: "routed", benchmarkUsed: false },
      request: req({ privacy: "local-only" }),
    });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("POLICY_DENIED");
  });
});
