/**
 * Free model discovery for the Aetherius router.
 *
 * The router never trusts a model name. A model is free only when a provider
 * catalog says its price is zero, or when the provider is a local/free-tier
 * service whose terms we have recorded. Discovery writes a cache; it never
 * writes credentials.
 *
 * Pure parsers are exported separately so the tests can use fixtures without
 * touching the network.
 */

import { readFileSync } from "node:fs";

export const DISCOVERY_VERSION = 1;

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
}

export function isZeroPriced(pricing) {
  if (!pricing) return false;
  return asNumber(pricing.prompt) === 0 && asNumber(pricing.completion) === 0;
}

export function openRouterFreeModels(payload) {
  const items = Array.isArray(payload?.data) ? payload.data : [];
  return items
    .filter((model) => typeof model?.id === "string")
    .filter((model) => isZeroPriced(model.pricing))
    .filter((model) => !/:batch$/.test(model.id))
    .filter((model) => {
      const input = model.architecture?.input_modalities;
      const output = model.architecture?.output_modalities;
      // Older catalog entries omit modalities; absence is not a paid signal.
      if (!Array.isArray(input) || !Array.isArray(output)) return true;
      return input.includes("text") && output.includes("text");
    })
    .map((model) => ({
      provider: "openrouter",
      model: model.id,
      free: true,
      tier: 2,
      context: model.context_length || model.top_provider?.context_length || null,
      source: "openrouter-catalog",
    }));
}

export function ollamaModels(payload) {
  const items = Array.isArray(payload?.models) ? payload.models : [];
  return items
    .filter((model) => typeof model?.name === "string")
    .map((model) => ({
      provider: "ollama",
      model: model.name,
      free: true,
      tier: 0,
      context: null,
      source: "ollama-tags",
    }));
}

export function openAiStyleModels(providerId, payload, tier = 3) {
  const items = Array.isArray(payload?.data) ? payload.data : [];
  return items
    .filter((model) => typeof model?.id === "string")
    .map((model) => ({
      provider: providerId,
      model: model.id,
      free: true,
      tier,
      context: model.context_window || model.context_length || null,
      source: `${providerId}-catalog`,
    }));
}

export function googleModels(payload) {
  const items = Array.isArray(payload?.models) ? payload.models : [];
  return items
    .filter((model) => typeof model?.name === "string")
    .filter((model) => (model.supportedGenerationMethods || []).includes("generateContent"))
    .map((model) => ({
      provider: "google",
      model: model.name.replace(/^models\//, ""),
      free: true,
      tier: 4,
      context: model.inputTokenLimit || null,
      source: "google-catalog",
    }))
    // AI Studio's permanent free allowance is for Flash/Gemma class models.
    .filter((model) => /flash|gemma/i.test(model.model));
}

export function githubModels(payload) {
  const items = Array.isArray(payload) ? payload : Array.isArray(payload?.models) ? payload.models : [];
  return items
    .filter((model) => typeof model?.id === "string" || typeof model?.name === "string")
    .map((model) => ({
      provider: "github",
      model: model.id || model.name,
      free: true,
      tier: 1,
      context: model.limits?.max_input_tokens || model.context_length || null,
      source: "github-catalog",
    }))
    .slice(0, 40);
}

function uniqueModels(models) {
  const seen = new Set();
  const output = [];
  for (const model of models) {
    const key = `${model.provider}/${model.model}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(model);
  }
  return output.sort((a, b) => a.tier - b.tier || a.provider.localeCompare(b.provider) || a.model.localeCompare(b.model));
}

function redactUrl(url) {
  try {
    const parsed = new URL(String(url));
    for (const key of parsed.searchParams.keys()) {
      if (/key|token|secret|password|auth/i.test(key)) parsed.searchParams.set(key, "<redacted>");
    }
    return `${parsed.origin}${parsed.pathname}${parsed.search ? "?<redacted>" : ""}`;
  } catch {
    return "<redacted-url>";
  }
}

async function getJson(fetchImpl, url, headers = {}, timeoutMs = 15_000) {
  const response = await fetchImpl(url, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`${redactUrl(url)} returned HTTP ${response.status}`);
  return response.json();
}

function bearer(token) {
  return token ? { authorization: `Bearer ${token}` } : {};
}

/**
 * Discover every free model the configured providers will admit. Each source
 * is independent: one provider being down never empties the catalog.
 */
export async function discoverFreeModels({ providers, env = process.env, fetchImpl = fetch, googleKey, githubToken, hfToken } = {}) {
  const results = [];
  const errors = [];
  const byId = new Map(providers.map((provider) => [provider.id, provider]));

  const run = async (id, fn) => {
    try {
      const models = await fn();
      results.push(...models);
      return models.length;
    } catch (error) {
      const message = String(error?.message || error).replace(/([?&](?:key|token|secret|password|auth)=)[^&\s"']+/gi, "$1<redacted>");
      errors.push({ provider: id, error: message.slice(0, 300) });
      return 0;
    }
  };

  if (byId.has("ollama")) {
    await run("ollama", async () => {
      const base = byId.get("ollama").baseUrl.replace(/\/v1\/?$/, "").replace(/\/$/, "");
      const payload = await getJson(fetchImpl, `${base}/api/tags`);
      return ollamaModels(payload);
    });
  }

  if (byId.has("openrouter")) {
    await run("openrouter", async () => {
      const payload = await getJson(fetchImpl, "https://openrouter.ai/api/v1/models");
      return openRouterFreeModels(payload);
    });
  }

  const openAiProviders = ["groq", "cerebras", "mistral", "huggingface"].filter((id) => byId.has(id));
  for (const id of openAiProviders) {
    const provider = byId.get(id);
    const token = env[provider.apiKeyEnv];
    if (!token) continue;
    await run(id, async () => {
      const payload = await getJson(fetchImpl, `${provider.baseUrl.replace(/\/$/, "")}/models`, bearer(token));
      const models = openAiStyleModels(id, payload, provider.tier);
      if (id === "mistral") {
        // Mistral's free tier is a named subset, not every model in the catalog.
        const free = new Set(["mistral-small-latest", "open-mistral-nemo", "ministral-8b-latest", "ministral-3b-latest"]);
        return models.filter((model) => free.has(model.model));
      }
      if (id === "huggingface") {
        // The HF router exposes many models; keep the free-tier text subset.
        return models.filter((model) => /instruct|chat|qwen|llama|deepseek|gemma|mistral/i.test(model.model)).slice(0, 30);
      }
      return models;
    });
  }

  if (byId.has("google")) {
    const key = googleKey || env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
    if (key) {
      await run("google", async () => {
        const payload = await getJson(
          fetchImpl,
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
        );
        return googleModels(payload);
      });
    }
  }

  if (byId.has("github")) {
    const token = githubToken || env.GITHUB_TOKEN || env.GH_TOKEN;
    if (token) {
      await run("github", async () => {
        const payload = await getJson(fetchImpl, "https://models.github.ai/catalog/models", bearer(token));
        return githubModels(payload);
      });
    }
  }

  if (byId.has("cloudflare-ai")) {
    const provider = byId.get("cloudflare-ai");
    const url = provider.baseUrl || env.CLOUDFLARE_AI_GATEWAY_URL;
    if (url) {
      await run("cloudflare-ai", async () => {
        const payload = await getJson(fetchImpl, `${url.replace(/\/$/, "")}/v1/models`);
        return openAiStyleModels("cloudflare-ai", payload, provider.tier);
      });
    }
  }

  return {
    version: DISCOVERY_VERSION,
    generated_at: new Date().toISOString(),
    models: uniqueModels(results),
    errors,
  };
}

export function loadDiscoveredModels(path) {
  try {
    const payload = JSON.parse(readFileSync(path, "utf8"));
    if (!Array.isArray(payload?.models)) return { version: DISCOVERY_VERSION, generated_at: null, models: [], errors: [] };
    return payload;
  } catch {
    return { version: DISCOVERY_VERSION, generated_at: null, models: [], errors: [] };
  }
}

export function mergeProviderModels(provider, discovered) {
  const extra = (discovered?.models || [])
    .filter((model) => model.provider === provider.id && model.free)
    .map((model) => model.model);
  return [...new Set([...(provider.models || []), ...extra])];
}
