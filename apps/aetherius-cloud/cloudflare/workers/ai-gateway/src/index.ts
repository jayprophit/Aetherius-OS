/**
 * Aetherius AI Gateway — PROPOSED, NOT DEPLOYED.
 *
 * One authenticated inference entry point for the Aetherius fabric. Free-tier
 * only: a model allowlist is the £0 gate, because a free model falling back to
 * a paid one is the most common way a "free" gateway starts billing.
 *
 * The provider credential is a Worker secret and never leaves this Worker.
 */

interface Env {
  AI: Ai;
  GATEWAY_TOKEN: string;
  OPENROUTER_API_KEY: string;
  ALLOWED_ORIGIN?: string;
  SPEND_LIMIT_GBP?: string;
}

/**
 * Free models only. Each entry names the upstream model id and the route that
 * serves it. A model absent from this list is rejected with 400 — there is no
 * "try the paid one" path.
 */
const FREE_MODELS: Record<string, { route: "workers-ai"; id: string } | {
  route: "openrouter"; id: string;
}> = {
  "aetherius/gpt-oss-120b": { route: "workers-ai", id: "@cf/openai/gpt-oss-120b" },
  "aetherius/llama-3.2-3b": { route: "workers-ai", id: "@cf/meta/llama-3.2-3b-instruct" },
  "aetherius/gemma-2b": { route: "workers-ai", id: "@cf/google/gemma-2b-it-lora" },
};

const MAX_BODY_BYTES = 256 * 1024;

function corsOrigin(env: Env, request: Request): string {
  const allowed = (env.ALLOWED_ORIGIN ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  const origin = request.headers.get("Origin") ?? "";
  return allowed.includes(origin) ? origin : "";
}

function withCors(env: Env, request: Request, response: Response): Response {
  const origin = corsOrigin(env, request);
  const headers = new Headers(response.headers);
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, headers });
}

function json(payload: unknown, status = 200): Response {
  return Response.json(payload, { status });
}

function unauthorized(): Response {
  return json({ ok: false, error: "unauthorized" }, 401);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      const origin = corsOrigin(env, request);
      if (!origin) return new Response(null, { status: 403 });
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return withCors(env, request, json({
        ok: true,
        service: "aetherius-ai-gateway",
        spend_limit_gbp: Number(env.SPEND_LIMIT_GBP ?? "0"),
        free_models: Object.keys(FREE_MODELS),
      }));
    }

    // Every other route requires the gateway token.
    const auth = request.headers.get("Authorization") ?? "";
    if (auth !== `Bearer ${env.GATEWAY_TOKEN}`) return unauthorized();

    if (url.pathname !== "/v1/chat/completions" || request.method !== "POST") {
      return withCors(env, request, json({ ok: false, error: "not found" }, 404));
    }

    const contentLength = Number(request.headers.get("Content-Length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
      return withCors(env, request, json({ ok: false, error: "request too large" }, 413));
    }

    let body: { model?: string; messages?: unknown[] };
    try {
      body = (await request.json()) as { model?: string; messages?: unknown[] };
    } catch {
      return withCors(env, request, json({ ok: false, error: "invalid JSON" }, 400));
    }

    const route = body.model ? FREE_MODELS[body.model] : undefined;
    if (!route || !Array.isArray(body.messages)) {
      return withCors(env, request, json({
        ok: false,
        error: "unsupported model; only the free allowlist is served",
        free_models: Object.keys(FREE_MODELS),
      }, 400));
    }

    if (route.route === "workers-ai") {
      const answer = await env.AI.run(route.id, {
        messages: body.messages as { role: string; content: string }[],
      });
      return withCors(env, request, json({
        ok: true,
        model: route.id,
        route: "workers-ai",
        spend_gbp: 0,
        answer,
      }));
    }

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: route.id, messages: body.messages }),
    });

    const text = await upstream.text();
    return withCors(env, request, new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    }));
  },
};
