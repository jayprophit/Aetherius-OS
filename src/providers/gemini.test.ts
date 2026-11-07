import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { GeminiAdapter } from "./gemini.ts";
import { AdapterRegistry, invokeRoute, type InvokeRequest } from "./invoke.ts";

const servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise<void>((r) => s.close(() => r()))));
});

type Handler = (url: string, body: unknown) => { status: number; body: unknown };

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
        const out = handler(req.url ?? "/", body);
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
    providerId: "gemini",
    modelId: "gemini-2.5-flash",
    runtimeId: "gemini",
    messages: [
      { role: "system", content: "be brief" },
      { role: "user", content: "hi" },
    ],
    timeoutMs: 5000,
    privacy: "cloud-allowed",
    ...over,
  };
}

const SECRET = "TEST_GEMINI_SECRET";

describe("GeminiAdapter", () => {
  it("reports AUTH_REQUIRED when no credential resolves", async () => {
    const adapter = new GeminiAdapter(async () => undefined);
    const result = await adapter.invoke(req());
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("AUTH_REQUIRED");
  });

  it("translates roles and normalizes a completion", async () => {
    const baseUrl = await stubServer((url, body) => {
      if (url.includes(":generateContent")) {
        const payload = body as {
          contents: Array<{ role: string }>;
          systemInstruction?: { parts: Array<{ text: string }> };
        };
        expect(payload.contents.map((c) => c.role)).toEqual(["user"]);
        expect(payload.systemInstruction?.parts?.[0]?.text).toBe("be brief");
        return {
          status: 200,
          body: {
            candidates: [{ content: { parts: [{ text: "OK" }] }, finishReason: "STOP" }],
            usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 1, totalTokenCount: 6 },
          },
        };
      }
      return { status: 200, body: { models: [{ name: "models/gemini-2.5-flash" }] } };
    });
    const adapter = new GeminiAdapter(async () => SECRET, { baseUrl });
    const result = await adapter.invoke(req());
    expect(result.ok).toBe(true);
    expect(result.output).toBe("OK");
    expect(result.usage?.totalTokens).toBe(6);
  });

  it("supports only listed models", async () => {
    const baseUrl = await stubServer(() => ({
      status: 200,
      body: { models: [{ name: "models/gemini-2.5-flash" }] },
    }));
    const adapter = new GeminiAdapter(async () => SECRET, { baseUrl });
    expect(await adapter.supports("gemini-2.5-flash")).toBe(true);
    expect(await adapter.supports("gemini-2.5-pro")).toBe(false);
  });

  it("maps HTTP 401 onto AUTH_REQUIRED", async () => {
    const baseUrl = await stubServer(() => ({ status: 401, body: { error: "bad key" } }));
    const adapter = new GeminiAdapter(async () => SECRET, { baseUrl });
    const result = await adapter.invoke(req());
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("AUTH_REQUIRED");
  });

  it("never exposes the credential in the result", async () => {
    const baseUrl = await stubServer(() => ({ status: 500, body: { error: "boom" } }));
    const adapter = new GeminiAdapter(async () => SECRET, { baseUrl });
    const result = await adapter.invoke(req());
    expect(JSON.stringify(result)).not.toContain(SECRET);
  });

  it("rejects LOCAL_ONLY requests through invokeRoute", async () => {
    const baseUrl = await stubServer(() => ({ status: 200, body: {} }));
    const registry = new AdapterRegistry();
    registry.register(new GeminiAdapter(async () => SECRET, { baseUrl }));
    const result = await invokeRoute(registry, {
      route: { providerId: "gemini", runtimeId: "gemini", modelId: "gemini-2.5-flash", observedHealth: "routed", benchmarkUsed: false },
      request: req({ privacy: "local-only" }),
    });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("POLICY_DENIED");
  });
});
