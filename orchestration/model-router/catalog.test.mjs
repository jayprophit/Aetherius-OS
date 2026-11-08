import { describe, expect, it } from "vitest";

import {
  discoverFreeModels,
  googleModels,
  mergeProviderModels,
  ollamaModels,
  openAiStyleModels,
  openRouterFreeModels,
} from "./catalog.mjs";

const openRouterFixture = {
  data: [
    {
      id: "vendor/free-model:free",
      pricing: { prompt: "0", completion: "0" },
      context_length: 131072,
      architecture: { input_modalities: ["text"], output_modalities: ["text"] },
    },
    {
      id: "vendor/paid-model",
      pricing: { prompt: "0.000001", completion: "0.000002" },
      architecture: { input_modalities: ["text"], output_modalities: ["text"] },
    },
    {
      id: "vendor/free-batch:batch",
      pricing: { prompt: "0", completion: "0" },
      architecture: { input_modalities: ["text"], output_modalities: ["text"] },
    },
    {
      id: "vendor/free-vision:free",
      pricing: { prompt: "0", completion: "0" },
      architecture: { input_modalities: ["text", "image"], output_modalities: ["text"] },
    },
  ],
};

describe("free catalog parsers", () => {
  it("admits only zero-priced OpenRouter text models", () => {
    const models = openRouterFreeModels(openRouterFixture);
    expect(models.map((model) => model.model)).toEqual([
      "vendor/free-model:free",
      "vendor/free-vision:free",
    ]);
    expect(models.every((model) => model.free && model.provider === "openrouter")).toBe(true);
  });

  it("parses local Ollama tags", () => {
    const models = ollamaModels({ models: [{ name: "qwen3.5:2b" }, { name: "gemma3:4b" }] });
    expect(models.map((model) => model.model)).toEqual(["qwen3.5:2b", "gemma3:4b"]);
    expect(models[0].tier).toBe(0);
  });

  it("filters Google to the free Flash/Gemma class", () => {
    const models = googleModels({
      models: [
        { name: "models/gemini-3.8-flash", supportedGenerationMethods: ["generateContent"], inputTokenLimit: 1000000 },
        { name: "models/gemini-3.8-pro", supportedGenerationMethods: ["generateContent"] },
        { name: "models/text-embedding-004", supportedGenerationMethods: ["embedContent"] },
      ],
    });
    expect(models.map((model) => model.model)).toEqual(["gemini-3.8-flash"]);
  });

  it("parses OpenAI-style provider catalogs", () => {
    const models = openAiStyleModels("groq", { data: [{ id: "openai/gpt-oss-120b" }] }, 4);
    expect(models).toEqual([
      {
        provider: "groq",
        model: "openai/gpt-oss-120b",
        free: true,
        tier: 4,
        context: null,
        source: "groq-catalog",
      },
    ]);
  });

  it("merges discovered models into a provider without duplicates", () => {
    const merged = mergeProviderModels(
      { id: "ollama", models: ["qwen3.5:2b"] },
      { models: [{ provider: "ollama", model: "gemma3:4b", free: true }, { provider: "ollama", model: "qwen3.5:2b", free: true }] }
    );
    expect(merged).toEqual(["qwen3.5:2b", "gemma3:4b"]);
  });
});

describe("free catalog discovery", () => {
  it("discovers local and cloud models without touching a real network", async () => {
    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(String(url));
      if (String(url).includes("/api/tags")) {
        return { ok: true, json: async () => ({ models: [{ name: "qwen3.5:2b" }] }) };
      }
      if (String(url).includes("openrouter.ai")) {
        return { ok: true, json: async () => openRouterFixture };
      }
      throw new Error(`unexpected URL ${url}`);
    };

    const result = await discoverFreeModels({
      providers: [
        { id: "ollama", baseUrl: "http://127.0.0.1:11434/v1", tier: 0 },
        { id: "openrouter", baseUrl: "https://openrouter.ai/api/v1", tier: 3 },
      ],
      env: {},
      fetchImpl,
    });

    expect(result.models.map((model) => `${model.provider}/${model.model}`)).toEqual([
      "ollama/qwen3.5:2b",
      "openrouter/vendor/free-model:free",
      "openrouter/vendor/free-vision:free",
    ]);
    expect(result.errors).toEqual([]);
    expect(calls.some((url) => url.endsWith("/api/tags"))).toBe(true);
  });

  it("keeps the catalog alive when one provider fails", async () => {
    const fetchImpl = async (url) => {
      if (String(url).includes("openrouter.ai")) throw new Error("offline");
      return { ok: true, json: async () => ({ models: [{ name: "local" }] }) };
    };
    const result = await discoverFreeModels({
      providers: [
        { id: "ollama", baseUrl: "http://127.0.0.1:11434/v1", tier: 0 },
        { id: "openrouter", baseUrl: "https://openrouter.ai/api/v1", tier: 3 },
      ],
      env: {},
      fetchImpl,
    });
    expect(result.models).toHaveLength(1);
    expect(result.errors[0].provider).toBe("openrouter");
  });
});
