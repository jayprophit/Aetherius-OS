/**
 * OpenClaw model catalogue.
 *
 * The catalogue records provider endpoints, model ids, tiers and auth
 * references. It never stores a credential: hosted providers use an
 * environment reference, local providers use a non-secret placeholder, and
 * AWS uses the SDK credential chain.
 *
 * Tiers:
 *   free    - zero marginal cost: local inference or a documented free tier
 *   paid    - standard metered API pricing
 *   premium - flagship or high-cost models
 *   other   - local runtimes, routers, limited-access or experimental models
 *
 * Model ids and metadata are taken from the OpenClaw provider documentation
 * shipped with 2026.9.6 and from the live gateway configuration measured on
 * 2026-10-29. Where a provider does not publish a context or price, the field
 * is omitted rather than guessed.
 */

export type ModelTier = "free" | "paid" | "premium" | "other";

export type ProviderApi =
  | "ollama"
  | "openai-completions"
  | "openai-responses"
  | "anthropic-messages"
  | "google-generative-ai"
  | "bedrock-converse-stream";

export type ProviderStatus =
  | "LOCAL"
  | "LOCAL_UNAVAILABLE"
  | "CONFIGURED_VERIFIED"
  | "CONFIGURED_COLD"
  | "NEEDS_OWNER_KEY";

export type ModelInput = "text" | "image" | "audio" | "video";

export interface ModelCost {
  /** USD per million input tokens. */
  input: number;
  /** USD per million output tokens. */
  output: number;
  /** USD per million cached input tokens. */
  cacheRead?: number;
  /** USD per million cache-write tokens. */
  cacheWrite?: number;
}

export interface CatalogModel {
  id: string;
  name: string;
  tier: ModelTier;
  contextWindow?: number;
  maxTokens?: number;
  input: ModelInput[];
  reasoning: boolean;
  cost?: ModelCost;
  notes?: string;
}

export type ProviderAuth =
  | { kind: "env"; env: string }
  | { kind: "aws-sdk" }
  | { kind: "local"; placeholder: string };

export interface CatalogProvider {
  id: string;
  label: string;
  api: ProviderApi;
  baseUrl: string;
  auth: ProviderAuth;
  status: ProviderStatus;
  models: CatalogModel[];
  notes?: string;
}

export interface ModelSelection {
  tier: ModelTier;
  primary: string;
  fallbacks: string[];
  rationale: string;
}

export interface ModelCatalogue {
  schemaVersion: number;
  sourceDate: string;
  tiers: Record<ModelTier, string>;
  providers: CatalogProvider[];
  aliases: Record<string, string>;
  selections: Record<ModelTier, ModelSelection>;
}

const ZERO_COST: ModelCost = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };

export const MODEL_CATALOGUE: ModelCatalogue = {
  schemaVersion: 1,
  sourceDate: "2026-10-29",
  tiers: {
    free: "Zero marginal cost: local inference or a documented free tier.",
    paid: "Standard metered API pricing.",
    premium: "Flagship or high-cost models for difficult work.",
    other: "Local runtimes, routers, limited-access or experimental models.",
  },
  providers: [
    {
      id: "ollama",
      label: "Ollama (local)",
      api: "ollama",
      baseUrl: "http://127.0.0.1:11434",
      auth: { kind: "local", placeholder: "ollama-local" },
      status: "CONFIGURED_VERIFIED",
      notes: "Measured live on 2026-10-27: one plain turn and one tool turn succeeded.",
      models: [
        {
          id: "qwen3.5:2b-q4_K_M",
          name: "Qwen3.5 2B Q4_K_M (local, vision + tools)",
          tier: "free",
          contextWindow: 262144,
          maxTokens: 16384,
          input: ["text", "image"],
          reasoning: true,
          cost: ZERO_COST,
          notes: "1.9 GB; the live runtime cap is 16,384 tokens on the 4 GB GPU.",
        },
      ],
    },
    {
      id: "openrouter",
      label: "OpenRouter",
      api: "openai-completions",
      baseUrl: "https://openrouter.ai/api/v1",
      auth: { kind: "env", env: "OPENROUTER_API_KEY" },
      status: "CONFIGURED_COLD",
      notes: "Free and paid models share one provider; the key is unset on this host.",
      models: [
        {
          id: "nvidia/nemotron-3-super-120b-a12b:free",
          name: "Nemotron 3 Super 120B (free)",
          tier: "free",
          contextWindow: 262144,
          maxTokens: 8192,
          input: ["text"],
          reasoning: true,
          cost: ZERO_COST,
        },
        {
          id: "google/gemma-4-31b-it:free",
          name: "Gemma 4 31B IT (free)",
          tier: "free",
          contextWindow: 262144,
          maxTokens: 8192,
          input: ["text"],
          reasoning: true,
          cost: ZERO_COST,
        },
        {
          id: "thinkingmachines/inkling-small:free",
          name: "Inkling Small (free)",
          tier: "free",
          contextWindow: 1048576,
          maxTokens: 8192,
          input: ["text"],
          reasoning: true,
          cost: ZERO_COST,
        },
        {
          id: "cohere/north-mini-code:free",
          name: "North Mini Code (free)",
          tier: "free",
          contextWindow: 256000,
          maxTokens: 8192,
          input: ["text"],
          reasoning: false,
          cost: ZERO_COST,
        },
        {
          id: "moonshotai/kimi-k2.6",
          name: "Kimi K2.6 (paid)",
          tier: "paid",
          contextWindow: 262144,
          maxTokens: 32768,
          input: ["text", "image"],
          reasoning: true,
        },
        {
          id: "deepseek/deepseek-v4-pro",
          name: "DeepSeek V4 Pro (paid)",
          tier: "paid",
          contextWindow: 1000000,
          maxTokens: 384000,
          input: ["text"],
          reasoning: true,
        },
        {
          id: "openrouter/auto",
          name: "OpenRouter Auto router",
          tier: "other",
          input: ["text"],
          reasoning: false,
          notes: "The router chooses a model; metadata and price depend on the chosen model.",
        },
      ],
    },
    {
      id: "google",
      label: "Google AI Studio",
      api: "google-generative-ai",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      auth: { kind: "env", env: "GEMINI_API_KEY" },
      status: "CONFIGURED_COLD",
      notes: "The free tier is configured; the key is unset on this host.",
      models: [
        {
          id: "gemini-4-argon",
          name: "Gemini 4 Argon (free tier)",
          tier: "free",
          contextWindow: 1048576,
          maxTokens: 65536,
          input: ["text", "image"],
          reasoning: true,
          cost: ZERO_COST,
        },
        {
          id: "gemini-3.8-flash",
          name: "Gemini 3.8 Flash (free tier)",
          tier: "free",
          contextWindow: 1048576,
          maxTokens: 65536,
          input: ["text", "image"],
          reasoning: true,
          cost: ZERO_COST,
        },
        {
          id: "gemini-3.1-pro-preview",
          name: "Gemini 3.1 Pro Preview",
          tier: "premium",
          contextWindow: 1048576,
          maxTokens: 65536,
          input: ["text", "image"],
          reasoning: true,
        },
      ],
    },
    {
      id: "groq",
      label: "Groq",
      api: "openai-completions",
      baseUrl: "https://api.groq.com/openai/v1",
      auth: { kind: "env", env: "GROQ_API_KEY" },
      status: "CONFIGURED_COLD",
      models: [
        {
          id: "openai/gpt-oss-120b",
          name: "GPT OSS 120B (free tier)",
          tier: "free",
          contextWindow: 131072,
          maxTokens: 8192,
          input: ["text"],
          reasoning: true,
          cost: ZERO_COST,
        },
        {
          id: "qwen/qwen3.6-27b",
          name: "Qwen 3.6 27B (free tier)",
          tier: "free",
          contextWindow: 131072,
          maxTokens: 8192,
          input: ["text"],
          reasoning: true,
          cost: ZERO_COST,
        },
      ],
    },
    {
      id: "cerebras",
      label: "Cerebras",
      api: "openai-completions",
      baseUrl: "https://api.cerebras.ai/v1",
      auth: { kind: "env", env: "CEREBRAS_API_KEY" },
      status: "CONFIGURED_COLD",
      models: [
        {
          id: "gpt-oss-120b",
          name: "GPT OSS 120B (free tier)",
          tier: "free",
          contextWindow: 131072,
          maxTokens: 40960,
          input: ["text"],
          reasoning: true,
          cost: ZERO_COST,
        },
      ],
    },
    {
      id: "mistral",
      label: "Mistral",
      api: "openai-completions",
      baseUrl: "https://api.mistral.ai/v1",
      auth: { kind: "env", env: "MISTRAL_API_KEY" },
      status: "CONFIGURED_COLD",
      models: [
        {
          id: "mistral-large-latest",
          name: "Mistral Large (free tier)",
          tier: "free",
          contextWindow: 262144,
          maxTokens: 16384,
          input: ["text", "image"],
          reasoning: true,
          cost: ZERO_COST,
        },
        {
          id: "mistral-small-latest",
          name: "Mistral Small 4 (free tier)",
          tier: "free",
          contextWindow: 262144,
          maxTokens: 16384,
          input: ["text", "image"],
          reasoning: true,
          cost: ZERO_COST,
        },
        {
          id: "codestral-latest",
          name: "Codestral (free tier)",
          tier: "free",
          contextWindow: 128000,
          maxTokens: 4096,
          input: ["text"],
          reasoning: false,
          cost: ZERO_COST,
        },
      ],
    },
    {
      id: "nvidia",
      label: "NVIDIA",
      api: "openai-completions",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      auth: { kind: "env", env: "NVIDIA_API_KEY" },
      status: "CONFIGURED_COLD",
      models: [
        {
          id: "nvidia/nemotron-3-ultra-550b-a55b",
          name: "Nemotron 3 Ultra 550B (free)",
          tier: "free",
          contextWindow: 1048576,
          maxTokens: 8192,
          input: ["text"],
          reasoning: true,
          cost: ZERO_COST,
        },
        {
          id: "nvidia/nemotron-3.5-lightning-30b-a3b",
          name: "Nemotron 3.5 Lightning 30B (free)",
          tier: "free",
          contextWindow: 1048576,
          maxTokens: 16384,
          input: ["text"],
          reasoning: true,
          cost: ZERO_COST,
        },
        {
          id: "nvidia/nemotron-3.5-super-vl-120b-a12b",
          name: "Nemotron 3.5 Super VL 120B (free, vision)",
          tier: "free",
          contextWindow: 1048576,
          maxTokens: 8192,
          input: ["text", "image"],
          reasoning: true,
          cost: ZERO_COST,
        },
      ],
    },
    {
      id: "openai",
      label: "OpenAI",
      api: "openai-responses",
      baseUrl: "https://api.openai.com/v1",
      auth: { kind: "env", env: "OPENAI_API_KEY" },
      status: "NEEDS_OWNER_KEY",
      notes: "Direct API-key route. A ChatGPT/Codex subscription is a separate auth profile.",
      models: [
        {
          id: "gpt-6-astra",
          name: "GPT-6 Astra",
          tier: "premium",
          contextWindow: 1050000,
          maxTokens: 128000,
          input: ["text", "image"],
          reasoning: true,
          cost: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 },
        },
        {
          id: "gpt-6-sol",
          name: "GPT-6 Sol",
          tier: "paid",
          contextWindow: 1050000,
          maxTokens: 128000,
          input: ["text", "image"],
          reasoning: true,
          cost: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
        },
        {
          id: "gpt-6-luna",
          name: "GPT-6 Luna",
          tier: "paid",
          contextWindow: 1050000,
          maxTokens: 128000,
          input: ["text", "image"],
          reasoning: true,
          cost: { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
        },
      ],
    },
    {
      id: "anthropic",
      label: "Anthropic",
      api: "anthropic-messages",
      baseUrl: "https://api.anthropic.com",
      auth: { kind: "env", env: "ANTHROPIC_API_KEY" },
      status: "NEEDS_OWNER_KEY",
      models: [
        {
          id: "claude-opus-5-5",
          name: "Claude Opus 5.5",
          tier: "premium",
          contextWindow: 1000000,
          maxTokens: 128000,
          input: ["text", "image"],
          reasoning: true,
          cost: { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
        },
        {
          id: "claude-opus-5",
          name: "Claude Opus 5",
          tier: "premium",
          contextWindow: 1000000,
          maxTokens: 128000,
          input: ["text", "image"],
          reasoning: true,
          cost: { input: 5, output: 25 },
        },
        {
          id: "claude-sonnet-5",
          name: "Claude Sonnet 5",
          tier: "paid",
          contextWindow: 1000000,
          maxTokens: 128000,
          input: ["text", "image"],
          reasoning: true,
          cost: { input: 2, output: 10 },
        },
        {
          id: "claude-fable-5-1",
          name: "Claude Fable 5.1",
          tier: "premium",
          contextWindow: 1000000,
          maxTokens: 128000,
          input: ["text", "image"],
          reasoning: true,
          cost: { input: 10, output: 50, cacheRead: 0.25 },
        },
        {
          id: "claude-mythos-5",
          name: "Claude Mythos 5 (limited access)",
          tier: "other",
          contextWindow: 1000000,
          maxTokens: 128000,
          input: ["text", "image"],
          reasoning: true,
          cost: { input: 10, output: 50 },
          notes: "Limited-access model; availability depends on the account.",
        },
      ],
    },
    {
      id: "xai",
      label: "xAI",
      api: "openai-responses",
      baseUrl: "https://api.x.ai/v1",
      auth: { kind: "env", env: "XAI_API_KEY" },
      status: "NEEDS_OWNER_KEY",
      models: [
        {
          id: "grok-4.7",
          name: "Grok 4.7",
          tier: "premium",
          input: ["text", "image"],
          reasoning: true,
        },
        {
          id: "grok-4.6",
          name: "Grok 4.6",
          tier: "paid",
          input: ["text", "image"],
          reasoning: true,
        },
        {
          id: "grok-4.5",
          name: "Grok 4.5",
          tier: "paid",
          input: ["text", "image"],
          reasoning: true,
        },
        {
          id: "grok-code-fast-1",
          name: "Grok Code Fast 1",
          tier: "paid",
          input: ["text"],
          reasoning: true,
        },
      ],
    },
    {
      id: "deepseek",
      label: "DeepSeek",
      api: "openai-completions",
      baseUrl: "https://api.deepseek.com",
      auth: { kind: "env", env: "DEEPSEEK_API_KEY" },
      status: "NEEDS_OWNER_KEY",
      models: [
        {
          id: "deepseek-v4-pro",
          name: "DeepSeek V4 Pro",
          tier: "paid",
          contextWindow: 1000000,
          maxTokens: 384000,
          input: ["text"],
          reasoning: true,
          cost: { input: 0.3, output: 1.2, cacheRead: 0.006 },
        },
        {
          id: "deepseek-v4-flash",
          name: "DeepSeek V4 Flash",
          tier: "paid",
          contextWindow: 1000000,
          maxTokens: 384000,
          input: ["text"],
          reasoning: true,
          cost: { input: 0.3, output: 1.2, cacheRead: 0.006 },
        },
        {
          id: "deepseek-flash",
          name: "DeepSeek V4.1 Flash",
          tier: "paid",
          contextWindow: 1000000,
          maxTokens: 384000,
          input: ["text", "image"],
          reasoning: true,
          cost: { input: 0.3, output: 1.2, cacheRead: 0.006 },
        },
        {
          id: "deepseek-v4-flash-vision-exp",
          name: "DeepSeek V4 Flash Vision (experimental)",
          tier: "other",
          contextWindow: 1000000,
          maxTokens: 384000,
          input: ["text", "image"],
          reasoning: true,
          notes: "Experimental vision surface.",
        },
      ],
    },
    {
      id: "moonshot",
      label: "Moonshot AI",
      api: "openai-completions",
      baseUrl: "https://api.moonshot.ai/v1",
      auth: { kind: "env", env: "MOONSHOT_API_KEY" },
      status: "NEEDS_OWNER_KEY",
      models: [
        {
          id: "kimi-k3",
          name: "Kimi K3",
          tier: "paid",
          contextWindow: 1048576,
          maxTokens: 1048576,
          input: ["text", "image", "video"],
          reasoning: true,
          cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 },
        },
        {
          id: "kimi-k2.7-code",
          name: "Kimi K2.7 Code",
          tier: "paid",
          contextWindow: 262144,
          maxTokens: 262144,
          input: ["text", "image", "video"],
          reasoning: true,
        },
      ],
    },
    {
      id: "zai",
      label: "Z.ai",
      api: "openai-completions",
      baseUrl: "https://api.z.ai/api/paas/v4",
      auth: { kind: "env", env: "ZAI_API_KEY" },
      status: "NEEDS_OWNER_KEY",
      models: [
        {
          id: "glm-5.3",
          name: "GLM 5.3",
          tier: "paid",
          contextWindow: 1048576,
          input: ["text"],
          reasoning: true,
        },
        {
          id: "glm-5.3-flash",
          name: "GLM 5.3 Flash",
          tier: "paid",
          contextWindow: 1048576,
          input: ["text", "image"],
          reasoning: true,
        },
        {
          id: "glm-5.2",
          name: "GLM 5.2",
          tier: "paid",
          contextWindow: 1048576,
          input: ["text"],
          reasoning: true,
        },
        {
          id: "glm-5-turbo",
          name: "GLM 5 Turbo",
          tier: "paid",
          contextWindow: 200000,
          input: ["text"],
          reasoning: true,
        },
      ],
    },
    {
      id: "together",
      label: "Together AI",
      api: "openai-completions",
      baseUrl: "https://api.together.xyz/v1",
      auth: { kind: "env", env: "TOGETHER_API_KEY" },
      status: "NEEDS_OWNER_KEY",
      models: [
        {
          id: "moonshotai/Kimi-K2.6",
          name: "Kimi K2.6 FP4",
          tier: "paid",
          contextWindow: 262144,
          maxTokens: 32768,
          input: ["text", "image"],
          reasoning: true,
          cost: { input: 1.2, output: 4.5 },
        },
        {
          id: "deepseek-ai/DeepSeek-V4-Pro",
          name: "DeepSeek V4 Pro",
          tier: "paid",
          contextWindow: 512000,
          maxTokens: 384000,
          input: ["text"],
          reasoning: true,
          cost: { input: 1.74, output: 3.48 },
        },
        {
          id: "zai-org/GLM-5.2",
          name: "GLM 5.2 FP4",
          tier: "paid",
          contextWindow: 262144,
          maxTokens: 131072,
          input: ["text"],
          reasoning: true,
          cost: { input: 1.4, output: 4.4 },
        },
        {
          id: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
          name: "Llama 3.3 70B Instruct Turbo",
          tier: "paid",
          contextWindow: 131072,
          maxTokens: 8192,
          input: ["text"],
          reasoning: false,
          cost: { input: 1.04, output: 1.04 },
        },
      ],
    },
    {
      id: "fireworks",
      label: "Fireworks AI",
      api: "openai-completions",
      baseUrl: "https://api.fireworks.ai/inference/v1",
      auth: { kind: "env", env: "FIREWORKS_API_KEY" },
      status: "NEEDS_OWNER_KEY",
      models: [
        {
          id: "accounts/fireworks/routers/glm-5p2-fast",
          name: "GLM 5.2 Fast",
          tier: "paid",
          contextWindow: 256000,
          maxTokens: 256000,
          input: ["text"],
          reasoning: true,
        },
        {
          id: "accounts/fireworks/models/kimi-k2p6",
          name: "Kimi K2.6",
          tier: "paid",
          contextWindow: 262144,
          maxTokens: 262144,
          input: ["text", "image"],
          reasoning: false,
        },
        {
          id: "accounts/fireworks/routers/kimi-k2p6-turbo",
          name: "Kimi K2.6 Fast",
          tier: "paid",
          contextWindow: 262144,
          maxTokens: 256000,
          input: ["text", "image"],
          reasoning: false,
        },
      ],
    },
    {
      id: "bedrock",
      label: "Amazon Bedrock",
      api: "bedrock-converse-stream",
      baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
      auth: { kind: "aws-sdk" },
      status: "NEEDS_OWNER_KEY",
      notes: "Uses the AWS SDK credential chain. Override the base URL for another region.",
      models: [
        {
          id: "anthropic.claude-opus-5",
          name: "Claude Opus 5 (Bedrock)",
          tier: "premium",
          contextWindow: 1000000,
          maxTokens: 128000,
          input: ["text", "image"],
          reasoning: true,
        },
        {
          id: "anthropic.claude-fable-5",
          name: "Claude Fable 5 (Bedrock)",
          tier: "premium",
          contextWindow: 1000000,
          maxTokens: 128000,
          input: ["text", "image"],
          reasoning: true,
        },
      ],
    },
    {
      id: "lmstudio",
      label: "LM Studio (local)",
      api: "openai-completions",
      baseUrl: "http://localhost:1234/v1",
      auth: { kind: "env", env: "LM_API_TOKEN" },
      status: "LOCAL_UNAVAILABLE",
      notes: "The Windows lms.exe exits 0xC000001D on this CPU; the 9B GGUF is installed but not served.",
      models: [
        {
          id: "qwen3.5-9b",
          name: "Qwen3.5 9B Q4_K_M (LM Studio)",
          tier: "other",
          contextWindow: 262144,
          maxTokens: 16384,
          input: ["text", "image"],
          reasoning: true,
          cost: ZERO_COST,
          notes: "Installed as Qwen3.5-9B-Q4_K_M.gguf with an mmproj file; runtime is unavailable.",
        },
      ],
    },
  ],
  aliases: {
    local: "ollama/qwen3.5:2b-q4_K_M",
    free: "openrouter/nvidia/nemotron-3-super-120b-a12b:free",
    "gemma-free": "openrouter/google/gemma-4-31b-it:free",
    inkling: "openrouter/thinkingmachines/inkling-small:free",
    "north-code": "openrouter/cohere/north-mini-code:free",
    "nvidia-ultra": "nvidia/nvidia/nemotron-3-ultra-550b-a55b",
    nvidia: "nvidia/nvidia/nemotron-3.5-lightning-30b-a3b",
    groq: "groq/openai/gpt-oss-120b",
    gemini: "google/gemini-3.8-flash",
    "gemini-4": "google/gemini-4-argon",
    mistral: "mistral/mistral-small-latest",
    codestral: "mistral/codestral-latest",
    cerebras: "cerebras/gpt-oss-120b",
    astra: "openai/gpt-6-astra",
    sol: "openai/gpt-6-sol",
    luna: "openai/gpt-6-luna",
    opus: "anthropic/claude-opus-5",
    "opus-5.5": "anthropic/claude-opus-5-5",
    sonnet: "anthropic/claude-sonnet-5",
    fable: "anthropic/claude-fable-5-1",
    grok: "xai/grok-4.7",
    deepseek: "deepseek/deepseek-v4-pro",
    kimi: "moonshot/kimi-k3",
    glm: "zai/glm-5.3",
    "together-kimi": "together/moonshotai/Kimi-K2.6",
    "fireworks-glm": "fireworks/accounts/fireworks/routers/glm-5p2-fast",
    "bedrock-opus": "bedrock/anthropic.claude-opus-5",
    lmstudio: "lmstudio/qwen3.5-9b",
    router: "openrouter/openrouter/auto",
  },
  selections: {
    free: {
      tier: "free",
      primary: "ollama/qwen3.5:2b-q4_K_M",
      fallbacks: [
        "openrouter/nvidia/nemotron-3-super-120b-a12b:free",
        "google/gemini-3.8-flash",
        "groq/openai/gpt-oss-120b",
        "cerebras/gpt-oss-120b",
        "mistral/mistral-small-latest",
        "nvidia/nvidia/nemotron-3.5-lightning-30b-a3b",
      ],
      rationale: "Local first; hosted free tiers only as fallbacks. Every entry has zero marginal cost.",
    },
    paid: {
      tier: "paid",
      primary: "openai/gpt-6-luna",
      fallbacks: [
        "deepseek/deepseek-v4-flash",
        "anthropic/claude-sonnet-5",
        "moonshot/kimi-k2.7-code",
        "zai/glm-5.2",
        "together/moonshotai/Kimi-K2.6",
        "fireworks/accounts/fireworks/routers/glm-5p2-fast",
      ],
      rationale: "Metered models ordered by published cost and capability; the owner supplies the keys.",
    },
    premium: {
      tier: "premium",
      primary: "openai/gpt-6-astra",
      fallbacks: [
        "anthropic/claude-opus-5-5",
        "xai/grok-4.7",
        "anthropic/claude-fable-5-1",
        "google/gemini-3.1-pro-preview",
      ],
      rationale: "Flagship models for difficult work. These are the highest published prices in the catalogue.",
    },
    other: {
      tier: "other",
      primary: "lmstudio/qwen3.5-9b",
      fallbacks: ["openrouter/openrouter/auto", "anthropic/claude-mythos-5"],
      rationale: "Local runtime, router and limited-access models. The LM Studio runtime is currently unavailable.",
    },
  },
};

export function fullRef(providerId: string, modelId: string): string {
  return `${providerId}/${modelId}`;
}

export function allModels(): Array<{ provider: CatalogProvider; model: CatalogModel; ref: string }> {
  return MODEL_CATALOGUE.providers.flatMap((provider) =>
    provider.models.map((model) => ({ provider, model, ref: fullRef(provider.id, model.id) })),
  );
}

export function modelsByTier(tier: ModelTier): Array<{ provider: CatalogProvider; model: CatalogModel; ref: string }> {
  return allModels().filter((entry) => entry.model.tier === tier);
}

export function resolveModel(refOrAlias: string): { provider: CatalogProvider; model: CatalogModel; ref: string } {
  const value = refOrAlias.trim();
  if (!value) throw new Error("a model reference is empty");
  const alias = MODEL_CATALOGUE.aliases[value];
  const target = alias ?? value;
  const entry = allModels().find((candidate) => candidate.ref === target);
  if (!entry) throw new Error(`no model in the catalogue: ${refOrAlias}`);
  return entry;
}

export function selectionForTier(tier: ModelTier): ModelSelection {
  const selection = MODEL_CATALOGUE.selections[tier];
  if (!selection) throw new Error(`unknown tier: ${tier}`);
  return structuredClone(selection);
}

export function selectionFor(refOrAlias: string): ModelSelection {
  const entry = resolveModel(refOrAlias);
  const selection = MODEL_CATALOGUE.selections[entry.model.tier];
  return {
    ...structuredClone(selection),
    primary: entry.ref,
    fallbacks: selection.fallbacks.filter((ref) => ref !== entry.ref),
    rationale: `${entry.model.name} selected by reference; the ${entry.model.tier} chain supplies fallbacks.`,
  };
}

/**
 * Render the `models.providers` fragment. The result is safe to commit: hosted
 * credentials are `${ENV_VAR}` references and local credentials are non-secret
 * placeholders. The caller decides whether to merge it into a live config.
 */
export function renderProviderConfig(options: { tier?: ModelTier; providerIds?: string[] } = {}): Record<string, unknown> {
  const providers: Record<string, unknown> = {};
  for (const provider of MODEL_CATALOGUE.providers) {
    if (options.providerIds && !options.providerIds.includes(provider.id)) continue;
    const models = options.tier
      ? provider.models.filter((model) => model.tier === options.tier)
      : provider.models;
    if (models.length === 0) continue;
    const apiKey =
      provider.auth.kind === "env"
        ? `\${${provider.auth.env}}`
        : provider.auth.kind === "local"
          ? provider.auth.placeholder
          : undefined;
    providers[provider.id] = {
      baseUrl: provider.baseUrl,
      ...(apiKey ? { apiKey } : {}),
      ...(provider.auth.kind === "aws-sdk" ? { auth: "aws-sdk" } : {}),
      api: provider.api,
      models: models.map((model) => ({
        id: model.id,
        name: model.name,
        ...(model.contextWindow ? { contextWindow: model.contextWindow } : {}),
        ...(model.maxTokens ? { maxTokens: model.maxTokens } : {}),
        reasoning: model.reasoning,
        input: model.input,
        ...(model.cost ? { cost: model.cost } : {}),
      })),
    };
  }
  return { models: { mode: "merge", providers } };
}

/** Render the `agents.defaults` fragment for a tier or a single model. */
export function renderAgentDefaults(target: ModelTier | string): Record<string, unknown> {
  const selection =
    target === "free" || target === "paid" || target === "premium" || target === "other"
      ? selectionForTier(target)
      : selectionFor(target);
  const aliases: Record<string, { alias: string }> = {};
  for (const [alias, ref] of Object.entries(MODEL_CATALOGUE.aliases)) {
    if (ref === selection.primary || selection.fallbacks.includes(ref)) {
      aliases[ref] = { alias };
    }
  }
  return {
    agents: {
      defaults: {
        model: {
          primary: selection.primary,
          fallbacks: selection.fallbacks,
        },
        models: aliases,
      },
    },
  };
}

export function validateCatalogue(): string[] {
  const problems: string[] = [];
  const providerIds = new Set<string>();
  const refs = new Set<string>();
  const aliases = new Set<string>();
  const tiers: ModelTier[] = ["free", "paid", "premium", "other"];

  for (const provider of MODEL_CATALOGUE.providers) {
    if (providerIds.has(provider.id)) problems.push(`duplicate provider id: ${provider.id}`);
    providerIds.add(provider.id);
    if (!provider.baseUrl) problems.push(`${provider.id} has no base URL`);
    if (provider.auth.kind === "env" && !/^[A-Z][A-Z0-9_]+$/.test(provider.auth.env)) {
      problems.push(`${provider.id} has an invalid environment reference: ${provider.auth.env}`);
    }
    if (provider.auth.kind === "local" && !provider.auth.placeholder) {
      problems.push(`${provider.id} has an empty local placeholder`);
    }
    if (provider.auth.kind === "env" && /^(sk-|xai-|fw-|AIza)/.test(provider.auth.env)) {
      problems.push(`${provider.id} appears to store a credential instead of an environment name`);
    }
    for (const model of provider.models) {
      const ref = fullRef(provider.id, model.id);
      if (refs.has(ref)) problems.push(`duplicate model reference: ${ref}`);
      refs.add(ref);
      if (!tiers.includes(model.tier)) problems.push(`${ref} has an unknown tier: ${model.tier}`);
      if (model.input.length === 0) problems.push(`${ref} has no input modalities`);
      if (model.contextWindow !== undefined && (!Number.isInteger(model.contextWindow) || model.contextWindow <= 0)) {
        problems.push(`${ref} has an invalid context window`);
      }
      if (model.maxTokens !== undefined && (!Number.isInteger(model.maxTokens) || model.maxTokens <= 0)) {
        problems.push(`${ref} has an invalid output limit`);
      }
      if (model.cost) {
        for (const [name, value] of Object.entries(model.cost)) {
          if (!Number.isFinite(value) || value < 0) problems.push(`${ref} has an invalid ${name} cost`);
        }
      }
    }
  }

  for (const [alias, ref] of Object.entries(MODEL_CATALOGUE.aliases)) {
    if (aliases.has(alias)) problems.push(`duplicate alias: ${alias}`);
    aliases.add(alias);
    if (!refs.has(ref)) problems.push(`alias ${alias} points at a missing model: ${ref}`);
    if (alias.includes("/")) problems.push(`alias ${alias} contains a slash, which is reserved for model refs`);
  }

  for (const tier of tiers) {
    if (modelsByTier(tier).length === 0) problems.push(`tier ${tier} has no models`);
    const selection = MODEL_CATALOGUE.selections[tier];
    if (!selection) {
      problems.push(`tier ${tier} has no selection`);
      continue;
    }
    if (selection.tier !== tier) problems.push(`tier ${tier} selection names ${selection.tier}`);
    for (const ref of [selection.primary, ...selection.fallbacks]) {
      if (!refs.has(ref)) problems.push(`tier ${tier} selects a missing model: ${ref}`);
    }
    if (selection.fallbacks.includes(selection.primary)) problems.push(`tier ${tier} repeats its primary in the fallbacks`);
  }

  return problems;
}

export function tierSummary(): Record<ModelTier, { models: number; providers: string[] }> {
  const summary = {
    free: { models: 0, providers: [] as string[] },
    paid: { models: 0, providers: [] as string[] },
    premium: { models: 0, providers: [] as string[] },
    other: { models: 0, providers: [] as string[] },
  };
  for (const entry of allModels()) {
    const bucket = summary[entry.model.tier];
    bucket.models += 1;
    if (!bucket.providers.includes(entry.provider.id)) bucket.providers.push(entry.provider.id);
  }
  return summary;
}
