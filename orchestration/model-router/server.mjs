#!/usr/bin/env node
/**
 * Aetherius free-model router.
 *
 * An OpenAI-compatible localhost endpoint that only ever calls free models:
 * local Ollama, GitHub Models free tier, OpenRouter :free models, Groq,
 * Google AI Studio, Cerebras and Mistral free tiers. When a provider returns
 * quota/rate-limit/auth errors the router cools it down and rotates to the
 * next free model. A requested paid model is refused with HTTP 402.
 *
 * Credentials are read from environment variables (injected from KeePass by
 * scripts/keepass.py), the local OpenClaw config, or `gh auth token`. They are
 * never printed, logged or persisted by this process.
 */

import { createServer } from "node:http";
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync, readdirSync } from "node:fs";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { discoverFreeModels, loadDiscoveredModels, mergeProviderModels } from "./catalog.mjs";

const execFileAsync = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const PROVIDERS = JSON.parse(readFileSync(join(ROOT, "providers.json"), "utf8"));
const POLICY = PROVIDERS.policy;
const STATE_PATH = process.env.ROUTER_STATE || join(ROOT, "state.json");
const USAGE_PATH = process.env.ROUTER_USAGE || join(ROOT, "usage.jsonl");
const DISCOVERED_PATH = process.env.ROUTER_DISCOVERED || join(ROOT, "free-models.json");
let discovered = loadDiscoveredModels(DISCOVERED_PATH);

const PAID_PROVIDERS = (() => {
  try {
    return JSON.parse(readFileSync(join(ROOT, "providers-paid.json"), "utf8")).providers || [];
  } catch {
    return [];
  }
})();
const ALLOW_PAID_ENV = POLICY.paid_opt_in_env || "AETHERIUS_ALLOW_PAID";

function allowPaid() {
  return process.env[ALLOW_PAID_ENV] === "1";
}

function allProviders() {
  return allowPaid() ? [...PROVIDERS.providers, ...PAID_PROVIDERS] : PROVIDERS.providers;
}

function providerBaseUrl(provider) {
  if (provider.baseUrl) return provider.baseUrl;
  if (provider.baseUrlEnv) return process.env[provider.baseUrlEnv] || null;
  return null;
}

const state = existsSync(STATE_PATH)
  ? (() => {
      try {
        return JSON.parse(readFileSync(STATE_PATH, "utf8"));
      } catch {
        return { cooldowns: {} };
      }
    })()
  : { cooldowns: {} };
state.cooldowns ||= {};

function persist() {
  try {
    mkdirSync(dirname(STATE_PATH), { recursive: true });
    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  } catch {
    /* state is advisory */
  }
}

function openClawKey(id) {
  try {
    const path = join(process.env.USERPROFILE || process.env.HOME || "", ".openclaw", "openclaw.json");
    const config = JSON.parse(readFileSync(path, "utf8"));
    const fallback = id === "openrouter-paid" ? "openrouter" : id;
    return config.models?.providers?.[fallback]?.apiKey || null;
  } catch {
    return null;
  }
}

const keyCache = new Map();
function resolveKey(provider) {
  if (keyCache.has(provider.id)) return keyCache.get(provider.id);
  let key = null;
  if (provider.apiKey) key = provider.apiKey;
  else if (provider.apiKeyEnv && process.env[provider.apiKeyEnv]) key = process.env[provider.apiKeyEnv];
  else if (provider.apiKeyFrom === "gh") {
    try {
      key = execFileSync("gh", ["auth", "token"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
      key = null;
    }
  }
  if (!key && provider.id !== "ollama") key = openClawKey(provider.id);
  keyCache.set(provider.id, key);
  return key;
}

function cooling(key) {
  return Number(state.cooldowns[key] || 0) > Date.now();
}

function cool(key, reason) {
  state.cooldowns[key] = Date.now() + POLICY.cooldown_seconds * 1000;
  state.cooldowns[`${key}#reason`] = reason;
  persist();
}

function recordUsage(entry) {
  const line = { ts: new Date().toISOString(), ...entry };
  try {
    mkdirSync(dirname(USAGE_PATH), { recursive: true });
    appendFileSync(USAGE_PATH, `${JSON.stringify(line)}\n`);
  } catch {
    /* usage log is advisory */
  }
}

function allCandidates() {
  const list = [];
  for (const provider of allProviders()) {
    if (provider.free === false && !allowPaid()) continue;
    if (provider.paid && !allowPaid()) continue;
    // Enforce verified free-tier: skip providers that are not marked as verified free
    if (POLICY.require_verified_free && !provider.verified_free && !allowPaid()) continue;
    if (provider.requiresKey !== false && !resolveKey(provider)) continue;
    const baseUrl = providerBaseUrl(provider);
    if (!baseUrl) continue;
    for (const model of mergeProviderModels(provider, discovered)) list.push({ provider, model, baseUrl });
  }
  return list.sort((a, b) => a.provider.tier - b.provider.tier);
}

function resolveCandidates(requested) {
  const all = allCandidates();
  if (!requested || /^(auto|free|free-auto|router)$/i.test(requested)) {
    return all.filter((item) => item.provider.free !== false);
  }
  const exact = all.find((item) => `${item.provider.id}/${item.model}` === requested || item.model === requested);
  if (exact) return [exact];
  const paidProvider = allProviders().find(
    (provider) => provider.free === false && String(requested).startsWith(`${provider.id}/`)
  );
  const reason = paidProvider && !allowPaid()
    ? `paid provider ${paidProvider.id} is disabled; set ${ALLOW_PAID_ENV}=1 to opt in`
    : `model ${requested} is not in the allowlist`;
  const error = new Error(reason);
  error.status = 402;
  throw error;
}

function findOpenCodeCli() {
  if (process.env.OPENCODE_CLI) return process.env.OPENCODE_CLI;
  if (process.env.OPENCODE_CLI_PATH) return process.env.OPENCODE_CLI_PATH;
  const root = join(process.env.APPDATA || process.env.USERPROFILE || "", "ai.opencode.desktop", "cli");
  try {
    const versions = readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory());
    for (const version of versions.sort((a, b) => b.name.localeCompare(a.name, "en"))) {
      const candidate = join(root, version.name, process.platform === "win32" ? "opencode-cli.exe" : "opencode-cli");
      if (existsSync(candidate)) return candidate;
    }
  } catch {
    /* CLI is optional */
  }
  return null;
}

function messageText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : part?.text || ""))
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

async function callCliProvider(provider, model, body) {
  const command = process.env[provider.commandEnv] || findOpenCodeCli();
  if (!command) {
    const error = new Error("OpenCode CLI not found");
    error.code = "NO_KEY";
    throw error;
  }
  const transcript = (body.messages || [])
    .map((message) => `${message.role}: ${messageText(message.content)}`)
    .join("\n");
  const prompt = `Answer directly in text. Do not use tools or edit files.\n\n${transcript}\nassistant:`;
  const started = Date.now();
  const { stdout } = await execFileAsync(
    command,
    [
      "run",
      "--model",
      `opencode/${model}`,
      "--format",
      "json",
      "--archived",
      "--title",
      "Aetherius router",
      prompt,
    ],
    {
      cwd: tmpdir(),
      timeout: POLICY.attempt_timeout_ms,
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true,
    }
  );
  const text = String(stdout)
    .split(/\r?\n/)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter((event) => event.type === "text" && event.part?.text)
    .map((event) => event.part.text)
    .join("");
  if (!text) {
    const error = new Error("CLI returned no assistant text");
    error.status = 502;
    throw error;
  }
  return {
    data: {
      id: `chatcmpl-cli-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: `opencode/${model}`,
      choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    },
    latency: Date.now() - started,
  };
}

async function callProvider({ provider, model, baseUrl }, body) {
  if (provider.kind === "cli") return callCliProvider(provider, model, body);
  const key = resolveKey(provider);
  if (!key) {
    const error = new Error(`no credential for ${provider.id}`);
    error.code = "NO_KEY";
    throw error;
  }
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const headers = { "content-type": "application/json" };
  headers.authorization = `Bearer ${key}`;
  const payload = { ...body, model, stream: false };
  delete payload.stream_options;
  const started = Date.now();
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(POLICY.attempt_timeout_ms),
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 1000) };
  }
  if (!response.ok) {
    const error = new Error(data?.error?.message || data?.message || text.slice(0, 300));
    error.status = response.status;
    error.latency = Date.now() - started;
    throw error;
  }
  return { data, latency: Date.now() - started };
}

async function chat(body) {
  const requested = body.model;
  const candidates = resolveCandidates(requested).slice(0, POLICY.max_attempts);
  const attempts = [];
  for (const candidate of candidates) {
    const key = `${candidate.provider.id}/${candidate.model}`;
    if (cooling(key)) {
      attempts.push({ model: key, skipped: "cooldown" });
      continue;
    }
    try {
      const { data, latency } = await callProvider(candidate, body);
      recordUsage({
        provider: candidate.provider.id,
        model: candidate.model,
        latency_ms: latency,
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
        outcome: "ok",
      });
      return { data, key, provider: candidate.provider.id, free: candidate.provider.free !== false, attempts };
    } catch (error) {
      attempts.push({ model: key, status: error.status || 0, error: String(error.message).slice(0, 200) });
      const rotate =
        error.code === "NO_KEY" ||
        [408, 409, 425, 429, 500, 502, 503, 504].includes(error.status) ||
        [401, 402, 403, 404].includes(error.status) ||
        (error.status === 400 && /model|tool|function|unsupported|not found/i.test(String(error.message))) ||
        error.name === "TimeoutError" ||
        error.name === "AbortError";
      if (rotate) {
        cool(key, String(error.message).slice(0, 120));
        continue;
      }
      error.attempts = attempts;
      throw error;
    }
  }
  const error = new Error("all free models are cooling down or unavailable");
  error.status = 503;
  error.attempts = attempts;
  throw error;
}

function readBody(req, limit = 8 * 1024 * 1024) {
  return new Promise((resolvePromise, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolvePromise(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type,authorization",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(payload);
}

function streamAnswer(res, data) {
  const content = data?.choices?.[0]?.message?.content ?? "";
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive",
    "access-control-allow-origin": "*",
  });
  res.write(
    `data: ${JSON.stringify({
      id: data.id || `chatcmpl-${Date.now()}`,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: data.model,
      choices: [{ index: 0, delta: { role: "assistant", content }, finish_reason: "stop" }],
    })}\n\n`
  );
  res.write("data: [DONE]\n\n");
  res.end();
}

async function refreshDiscovery() {
  const github = PROVIDERS.providers.find((provider) => provider.id === "github");
  const google = PROVIDERS.providers.find((provider) => provider.id === "google");
  discovered = await discoverFreeModels({
    providers: PROVIDERS.providers,
    env: process.env,
    githubToken: github ? resolveKey(github) : null,
    googleKey: google ? resolveKey(google) : null,
  });
  writeFileSync(DISCOVERED_PATH, JSON.stringify(discovered, null, 2));
  return discovered;
}

export function startRouter({ port = Number(process.env.ROUTER_PORT || 7318) } = {}) {
  const startedAt = new Date().toISOString();
  const server = createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "content-type,authorization",
        "access-control-allow-methods": "GET,POST,OPTIONS",
      });
      return res.end();
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
    const path = url.pathname;

    if (req.method === "GET" && (path === "/health" || path === "/")) {
      return sendJson(res, 200, {
        ok: true,
        service: "aetherius-free-model-router",
        free_only: !allowPaid(),
        free_default: true,
        allow_paid: allowPaid(),
        started_at: startedAt,
        providers: allProviders().filter((provider) => provider.free !== false).length,
        discovered_at: discovered.generated_at,
      });
    }

    if (req.method === "GET" && (path === "/v1/models" || path === "/models")) {
      const data = allCandidates().map(({ provider, model }) => ({
        id: `${provider.id}/${model}`,
        object: "model",
        owned_by: provider.id,
        free: provider.free !== false,
        paid: provider.free === false,
      }));
      return sendJson(res, 200, { object: "list", data, discovered_at: discovered.generated_at });
    }

    if (req.method === "GET" && path === "/status") {
      const now = Date.now();
      const providers = allProviders().map((provider) => {
        const models = mergeProviderModels(provider, discovered).map((model) => {
          const cooldown = Number(state.cooldowns[`${provider.id}/${model}`] || 0);
          return {
            id: `${provider.id}/${model}`,
            cooldown_seconds: cooldown > now ? Math.ceil((cooldown - now) / 1000) : 0,
          };
        });
        return {
          id: provider.id,
          label: provider.label,
          free: provider.free !== false,
          paid: provider.free === false,
          credential: provider.requiresKey === false ? "not-required" : resolveKey(provider) ? "present" : "missing",
          models,
        };
      });
      return sendJson(res, 200, {
        ok: true,
        free_only: !allowPaid(),
        free_default: true,
        allow_paid: allowPaid(),
        policy: POLICY,
        discovered_at: discovered.generated_at,
        discovery_errors: discovered.errors || [],
        providers,
      });
    }

    if (req.method === "POST" && path === "/admin/reset") {
      state.cooldowns = {};
      persist();
      return sendJson(res, 200, { ok: true, cooldowns: "cleared" });
    }

    if (req.method === "POST" && path === "/admin/refresh") {
      try {
        const refreshed = await refreshDiscovery();
        return sendJson(res, 200, {
          ok: true,
          models: refreshed.models.length,
          providers: [...new Set(refreshed.models.map((model) => model.provider))],
          errors: refreshed.errors,
          generated_at: refreshed.generated_at,
        });
      } catch (error) {
        return sendJson(res, 502, { error: { message: String(error.message || error) } });
      }
    }

    if (req.method === "POST" && (path === "/v1/chat/completions" || path === "/chat/completions")) {
      try {
        const body = await readBody(req);
        const result = await chat(body);
        if (body.stream) return streamAnswer(res, result.data);
        return sendJson(res, 200, {
          ...result.data,
          model: result.key,
          x_aetherius_provider: result.provider,
          x_aetherius_free_only: result.free,
          x_aetherius_paid: !result.free,
          x_aetherius_attempts: result.attempts.length,
        });
      } catch (error) {
        return sendJson(res, error.status || 502, {
          error: {
            message: error.message,
            type: error.status === 402 ? "paid_model_refused" : "free_models_unavailable",
            attempts: error.attempts || [],
          },
        });
      }
    }

    if (req.method === "POST" && path === "/v1/embeddings") {
      try {
        const body = await readBody(req);
        const provider = PROVIDERS.providers.find((item) => item.id === "ollama");
        const key = resolveKey(provider);
        const response = await fetch(`${provider.baseUrl.replace(/\/$/, "")}/embeddings`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(POLICY.attempt_timeout_ms),
        });
        const text = await response.text();
        res.writeHead(response.status, { "content-type": "application/json", "access-control-allow-origin": "*" });
        return res.end(text);
      } catch (error) {
        return sendJson(res, 502, { error: { message: error.message } });
      }
    }

    return sendJson(res, 404, { error: { message: "not found", path } });
  });

  server.listen(port, "127.0.0.1", () => {
    const address = server.address();
    console.log(`[router] free-only OpenAI endpoint on http://127.0.0.1:${address.port}/v1`);
    if (!process.env.VITEST && process.env.ROUTER_DISCOVER_ON_START !== "0") {
      refreshDiscovery()
        .then((catalog) => console.log(`[router] discovered ${catalog.models.length} free models`))
        .catch((error) => console.error(`[router] discovery failed: ${error.message}`));
    }
  });

  return {
    server,
    get port() {
      return server.address()?.port ?? port;
    },
    close() {
      server.close();
    },
  };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  startRouter();
}
