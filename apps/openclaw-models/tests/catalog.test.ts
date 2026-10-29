import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  MODEL_CATALOGUE,
  allModels,
  modelsByTier,
  renderAgentDefaults,
  renderProviderConfig,
  resolveModel,
  selectionFor,
  selectionForTier,
  tierSummary,
  validateCatalogue,
  type ModelTier,
} from "../src/index.ts";

const SLICE_ROOT = fileURLToPath(new URL("..", import.meta.url));
const TIERS: ModelTier[] = ["free", "paid", "premium", "other"];

interface RenderedProvider {
  baseUrl: string;
  apiKey?: string;
  auth?: string;
  api: string;
  models: Array<Record<string, unknown>>;
}

interface RenderedConfig {
  models: { mode: string; providers: Record<string, RenderedProvider> };
}

interface RenderedAgents {
  agents: {
    defaults: {
      model: { primary: string; fallbacks: string[] };
      models: Record<string, { alias: string }>;
    };
  };
}

function renderedConfig(options: Parameters<typeof renderProviderConfig>[0] = {}): RenderedConfig {
  return renderProviderConfig(options) as unknown as RenderedConfig;
}

function renderedAgents(target: ModelTier | string): RenderedAgents {
  return renderAgentDefaults(target) as unknown as RenderedAgents;
}

test("the catalogue validates: ids, tiers, aliases and selections are consistent", () => {
  assert.deepEqual(validateCatalogue(), []);
  assert.equal(MODEL_CATALOGUE.schemaVersion, 1);
  assert.equal(MODEL_CATALOGUE.sourceDate, "2026-10-29");
});

test("all four tiers exist and every selection resolves to a catalogue model", () => {
  for (const tier of TIERS) {
    assert.ok(modelsByTier(tier).length > 0, `${tier} has no models`);
    const selection = selectionForTier(tier);
    assert.equal(selection.tier, tier);
    assert.ok(resolveModel(selection.primary));
    for (const ref of selection.fallbacks) assert.ok(resolveModel(ref));
    assert.ok(!selection.fallbacks.includes(selection.primary));
  }
});

test("the catalogue covers local, hosted free, paid and premium providers", () => {
  const ids = MODEL_CATALOGUE.providers.map((provider) => provider.id);
  for (const expected of [
    "ollama",
    "lmstudio",
    "openrouter",
    "google",
    "groq",
    "cerebras",
    "mistral",
    "nvidia",
    "openai",
    "anthropic",
    "xai",
    "deepseek",
    "moonshot",
    "zai",
    "together",
    "fireworks",
    "bedrock",
  ]) {
    assert.ok(ids.includes(expected), `missing provider ${expected}`);
  }
  assert.equal(new Set(ids).size, ids.length);
  const summary = tierSummary();
  assert.equal(
    TIERS.reduce((total, tier) => total + summary[tier].models, 0),
    allModels().length,
  );
  assert.ok(summary.free.providers.includes("ollama"));
  assert.ok(summary.premium.providers.includes("openai"));
});

test("aliases resolve, and an unknown or empty reference is refused", () => {
  assert.equal(resolveModel("local").ref, "ollama/qwen3.5:2b-q4_K_M");
  assert.equal(resolveModel("astra").ref, "openai/gpt-6-astra");
  assert.equal(resolveModel("kimi").ref, "moonshot/kimi-k3");
  assert.equal(resolveModel("lmstudio").ref, "lmstudio/qwen3.5-9b");
  for (const alias of Object.keys(MODEL_CATALOGUE.aliases)) {
    assert.ok(resolveModel(alias));
  }
  assert.throws(() => resolveModel("nope/nope"), /no model in the catalogue/);
  assert.throws(() => resolveModel("   "), /empty/);
});

test("a single model selection keeps that model first and its tier as the fallback chain", () => {
  const selection = selectionFor("astra");
  assert.equal(selection.primary, "openai/gpt-6-astra");
  assert.equal(selection.tier, "premium");
  assert.ok(!selection.fallbacks.includes(selection.primary));
  assert.ok(selection.fallbacks.includes("anthropic/claude-opus-5-5"));
});

test("the rendered provider config uses environment references and stores no credential", () => {
  const config = renderedConfig();
  assert.equal(config.models.mode, "merge");
  assert.equal(config.models.providers.openai.apiKey, "${OPENAI_API_KEY}");
  assert.equal(config.models.providers.anthropic.apiKey, "${ANTHROPIC_API_KEY}");
  assert.equal(config.models.providers.ollama.apiKey, "ollama-local");
  assert.equal(config.models.providers.bedrock.apiKey, undefined);
  assert.equal(config.models.providers.bedrock.auth, "aws-sdk");
  assert.equal(config.models.providers.openai.api, "openai-responses");
  assert.equal(config.models.providers.anthropic.api, "anthropic-messages");
  assert.equal(config.models.providers.google.api, "google-generative-ai");
  assert.equal(config.models.providers.ollama.api, "ollama");

  const serialised = JSON.stringify(config);
  assert.doesNotMatch(serialised, /sk-[A-Za-z0-9]{10,}/);
  assert.doesNotMatch(serialised, /AIza[0-9A-Za-z_-]{20,}/);
  assert.doesNotMatch(serialised, /xai-[A-Za-z0-9]{10,}/);
  for (const provider of Object.values(config.models.providers)) {
    if (provider.apiKey && provider.apiKey.startsWith("${")) {
      assert.match(provider.apiKey, /^\$\{[A-Z][A-Z0-9_]+\}$/);
    }
  }
});

test("tier and provider filters render only the requested models", () => {
  const free = renderedConfig({ tier: "free" });
  for (const provider of Object.values(free.models.providers)) {
    assert.ok(provider.models.length > 0);
  }
  assert.ok(free.models.providers.openai === undefined);
  assert.ok(free.models.providers.ollama);

  const premium = renderedConfig({ tier: "premium" });
  const premiumRefs = Object.entries(premium.models.providers).flatMap(([id, provider]) =>
    provider.models.map((model) => `${id}/${String(model.id)}`),
  );
  assert.ok(premiumRefs.includes("openai/gpt-6-astra"));
  assert.ok(!premiumRefs.includes("openai/gpt-6-luna"));

  const onlyOpenAi = renderedConfig({ providerIds: ["openai"] });
  assert.deepEqual(Object.keys(onlyOpenAi.models.providers), ["openai"]);
});

test("unknown metadata is omitted rather than guessed", () => {
  const config = renderedConfig({ providerIds: ["xai", "openai"] });
  const grok = config.models.providers.xai.models.find((model) => model.id === "grok-4.7");
  assert.ok(grok);
  assert.equal("contextWindow" in grok, false);
  assert.equal("cost" in grok, false);

  const astra = config.models.providers.openai.models.find((model) => model.id === "gpt-6-astra");
  assert.ok(astra);
  assert.equal(astra.contextWindow, 1050000);
  assert.equal(astra.maxTokens, 128000);
});

test("agent defaults render a primary, fallbacks and matching aliases for each tier", () => {
  const free = renderedAgents("free");
  assert.equal(free.agents.defaults.model.primary, "ollama/qwen3.5:2b-q4_K_M");
  assert.equal(free.agents.defaults.models["ollama/qwen3.5:2b-q4_K_M"].alias, "local");

  const paid = renderedAgents("paid");
  assert.equal(paid.agents.defaults.model.primary, "openai/gpt-6-luna");

  const premium = renderedAgents("premium");
  assert.equal(premium.agents.defaults.model.primary, "openai/gpt-6-astra");
  assert.equal(premium.agents.defaults.models["openai/gpt-6-astra"].alias, "astra");

  const other = renderedAgents("other");
  assert.equal(other.agents.defaults.model.primary, "lmstudio/qwen3.5-9b");

  const single = renderedAgents("kimi");
  assert.equal(single.agents.defaults.model.primary, "moonshot/kimi-k3");
  assert.equal(single.agents.defaults.models["moonshot/kimi-k3"].alias, "kimi");
});

test("every model has valid modalities, limits and non-negative costs", () => {
  for (const entry of allModels()) {
    assert.ok(entry.model.input.length > 0, `${entry.ref} has no input modalities`);
    assert.ok(Number.isInteger(entry.model.maxTokens ?? 1) && (entry.model.maxTokens ?? 1) > 0);
    if (entry.model.contextWindow !== undefined) {
      assert.ok(Number.isInteger(entry.model.contextWindow) && entry.model.contextWindow > 0);
    }
    if (entry.model.cost) {
      for (const value of Object.values(entry.model.cost)) {
        assert.ok(Number.isFinite(value) && value >= 0);
      }
    }
  }
});

test("the CLI validates the catalogue and emits machine-readable model lists", () => {
  const validate = spawnSync(process.execPath, ["src/cli.ts", "validate"], {
    cwd: SLICE_ROOT,
    encoding: "utf8",
  });
  assert.equal(validate.status, 0, validate.stderr);
  assert.match(validate.stdout, /catalogue valid: 17 providers/);

  const models = spawnSync(process.execPath, ["src/cli.ts", "models", "--tier", "premium", "--json"], {
    cwd: SLICE_ROOT,
    encoding: "utf8",
  });
  assert.equal(models.status, 0, models.stderr);
  const parsed = JSON.parse(models.stdout) as Array<{ ref: string; tier: string }>;
  assert.ok(parsed.length > 0);
  assert.ok(parsed.every((entry) => entry.tier === "premium"));
  assert.ok(parsed.some((entry) => entry.ref === "openai/gpt-6-astra"));

  const bad = spawnSync(process.execPath, ["src/cli.ts", "models", "--tier", "cheap"], {
    cwd: SLICE_ROOT,
    encoding: "utf8",
  });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /unknown tier/);
});
