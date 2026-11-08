/**
 * Aetherius model gateway — free Cloudflare Workers AI front end.
 *
 * Key-free inference: the Worker uses the `AI` binding, not uploaded provider
 * keys. It exposes the same OpenAI-compatible shape the local router uses,
 * so the router can point `CLOUDFLARE_AI_GATEWAY_URL` here.
 *
 * Free only. No paid model, plan or API key.
 */

const SERVICE = "aetherius-model-gateway";
const DEFAULT_MODEL = "@cf/openai/gpt-oss-20b";

function json(status, body) {
  const payload = JSON.stringify(body);
  return new Response(payload, {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    },
  });
}

function readJson(request) {
  return request.json().catch(() => ({})).then((body) => (body && typeof body === "object" ? body : {}));
}

async function chat(env, body) {
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const model = DEFAULT_MODEL;
  const prompt = messages
    .map((message) => {
      const content = typeof message.content === "string" ? message.content : "";
      return `${message.role || "user"}: ${content}`;
    })
    .filter((line) => !/:\s*$/.test(line))
    .join("\n");
  const payload = prompt ? { prompt, max_tokens: 1024 } : { messages, max_tokens: 1024 };
  const result = await env.AI.run(model, payload);
  if (result && typeof result === "object" && result.choices) {
    const first = result.choices[0];
    if (first?.message?.content == null) {
      const reasoning = first?.message?.reasoning_content ?? first?.message?.reasoning ?? "";
      if (reasoning) first.message.content = reasoning;
    }
    return result;
  }
  const text = typeof result === "string" ? result : result?.response ?? result?.text ?? "";
  return {
    id: `chatcmpl-${Date.now().toString(36)}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") return json(204, { ok: true });
    if (request.method === "GET" && (path === "/health" || path === "/")) {
      return json(200, { ok: true, service: SERVICE, free_only: true, model: DEFAULT_MODEL });
    }
    if (request.method === "GET" && (path === "/v1/models" || path === "/models")) {
      return json(200, {
        object: "list",
        data: [{ id: `cloudflare-ai/${DEFAULT_MODEL}`, object: "model", owned_by: "workers-ai", free: true }],
      });
    }
    if (request.method === "POST" && path === "/v1/chat/completions") {
      const body = await readJson(request);
      try {
        return json(200, await chat(env, body));
      } catch (error) {
        return json(502, { error: { message: String(error?.message || error) } });
      }
    }
    return json(404, { error: { message: "not found", path } });
  },
};
