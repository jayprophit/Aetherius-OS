import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startRouter } from "./server.mjs";

/**
 * Contract tests for the free-only router. They never call a provider: the
 * paid-model refusal happens in the allowlist before any network request.
 */

let router;
let base;

async function call(path, { method = "GET", body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

beforeAll(async () => {
  router = startRouter({ port: 0 });
  if (!router.server.listening) {
    await new Promise((resolvePromise) => router.server.once("listening", resolvePromise));
  }
  base = `http://127.0.0.1:${router.port}`;
});

afterAll(() => router?.close());

describe("free model router", () => {
  it("advertises a free-only service", async () => {
    const { status, body } = await call("/health");
    expect(status).toBe(200);
    expect(body).toMatchObject({ ok: true, free_only: true });
  });

  it("lists only allowlisted free models", async () => {
    const { status, body } = await call("/v1/models");
    expect(status).toBe(200);
    expect(body.object).toBe("list");
    expect(body.data.length).toBeGreaterThan(0);
    for (const model of body.data) {
      expect(model.free, model.id).toBe(true);
      expect(model.id).toMatch(/^[a-z-]+\/.+/);
    }
  });

  it("refuses an explicit paid model with HTTP 402", async () => {
    const { status, body } = await call("/v1/chat/completions", {
      method: "POST",
      body: {
        model: "openrouter/anthropic/claude-sonnet-4",
        messages: [{ role: "user", content: "hi" }],
      },
    });
    expect(status).toBe(402);
    expect(body.error.type).toBe("paid_model_refused");
  });

  it("refuses an unknown provider instead of silently routing it", async () => {
    const { status, body } = await call("/v1/chat/completions", {
      method: "POST",
      body: {
        model: "openai/gpt-6-astra",
        messages: [{ role: "user", content: "hi" }],
      },
    });
    expect(status).toBe(402);
    expect(body.error.type).toBe("paid_model_refused");
  });

  it("reports provider credentials without exposing them", async () => {
    const { status, body } = await call("/status");
    expect(status).toBe(200);
    expect(body.free_only).toBe(true);
    for (const provider of body.providers) {
      expect(["present", "missing", "not-required"]).toContain(provider.credential);
    }
    expect(JSON.stringify(body)).not.toMatch(/sk-|Bearer /);
  });
});
