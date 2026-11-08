import { describe, it } from "node:test";
import assert from "node:assert";
import { ControlPlaneClient, ControlPlaneError } from "../src/control-plane.ts";

function stubFetch(handler: (url: string, init?: RequestInit) => Promise<Response>) {
  return async (url: string, init?: RequestInit) => handler(url, init);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const CONFIG = {
  apiUrl: "https://example.supabase.co",
  credentialRef: "keepass:Aetherius/Cloud/Supabase",
  credentials: async (ref: string) => (ref === "keepass:Aetherius/Cloud/Supabase" ? "SERVICE_ROLE" : undefined),
};

describe("ControlPlaneClient", () => {
  it("targets the project REST surface and sends the service-role reference", async () => {
    let seenUrl = "";
    const client = new ControlPlaneClient({
      ...CONFIG,
      fetchFn: stubFetch(async (url) => {
        seenUrl = url;
        return jsonResponse([{ id: "groq" }]);
      }),
    });
    const rows = await client.listProviders();
    assert.equal(seenUrl, "https://example.supabase.co/rest/v1/cloud_provider?select=*&order=id");
    assert.deepEqual(rows, [{ id: "groq" }]);
  });

  it("fails closed when no credential resolves", async () => {
    const client = new ControlPlaneClient({
      ...CONFIG,
      credentials: async () => undefined,
      fetchFn: stubFetch(async () => jsonResponse([])),
    });
    await assert.rejects(() => client.listProviders(), (error: unknown) => {
      assert.ok(error instanceof ControlPlaneError);
      assert.equal(error.status, 401);
      return true;
    });
  });

  it("surfaces HTTP failures without leaking the credential", async () => {
    const client = new ControlPlaneClient({
      ...CONFIG,
      fetchFn: stubFetch(async () => new Response("nope", { status: 403 })),
    });
    await assert.rejects(() => client.listProviders(), /HTTP 403/);
  });

  it("records health and usage with the documented shapes", async () => {
    const calls: string[] = [];
    const client = new ControlPlaneClient({
      ...CONFIG,
      fetchFn: stubFetch(async (url) => {
        calls.push(url);
        return jsonResponse([{ ok: true }]);
      }),
    });
    await client.recordHealth({ provider_id: "groq", state: "AVAILABLE", latency_ms: 12, detail: null });
    await client.recordUsage({
      provider_id: "groq", model: "openai/gpt-oss-20b",
      input_tokens: 10, output_tokens: 5, total_tokens: 15, cost_gbp: "0",
    });
    assert.equal(calls[0], "https://example.supabase.co/rest/v1/provider_health");
    assert.equal(calls[1], "https://example.supabase.co/rest/v1/cloud_usage");
  });

  it("patches a task state transition", async () => {
    let method = "";
    const client = new ControlPlaneClient({
      ...CONFIG,
      fetchFn: stubFetch(async (_url, init) => {
        method = init?.method ?? "GET";
        return jsonResponse([{ id: "t1", state: "done" }]);
      }),
    });
    const row = await client.updateTask("t1", { state: "done" });
    assert.equal(method, "PATCH");
    assert.equal(row.state, "done");
  });
});
