/**
 * Static model cards for remote providers (P18/1).
 *
 * Cards declare COMPATIBILITY ONLY — never a credential, endpoint or key.
 * `healthy` is the static assumption; live state is layered on by
 * routeWithLiveState and never invented here. Free-tier models only.
 */

import type { ModelCard } from "./capabilities.ts";

const TEXT: ModelCard["capabilities"] = {
  contextLimit: 32_768,
  modalities: ["text"],
  reasoning: false,
  coding: true,
  vision: false,
  audio: false,
  toolUse: true,
  structuredOutput: true,
};

export const GROQ_CARDS: ModelCard[] = [
  {
    id: "openai/gpt-oss-20b",
    providerId: "groq",
    runtimeId: "groq",
    localRemote: "remote",
    capabilities: { ...TEXT, contextLimit: 131_072, reasoning: true },
    costRank: 1,
    healthy: true,
  },
  {
    id: "openai/gpt-oss-120b",
    providerId: "groq",
    runtimeId: "groq",
    localRemote: "remote",
    capabilities: { ...TEXT, contextLimit: 131_072, reasoning: true },
    costRank: 2,
    healthy: true,
  },
  {
    id: "qwen/qwen3.8-27b",
    providerId: "groq",
    runtimeId: "groq",
    localRemote: "remote",
    capabilities: { ...TEXT, contextLimit: 32_768 },
    costRank: 1,
    healthy: true,
  },
];

export const GEMINI_CARDS: ModelCard[] = [
  {
    id: "gemini-3.5-flash",
    providerId: "gemini",
    runtimeId: "gemini",
    localRemote: "remote",
    capabilities: { ...TEXT, contextLimit: 1_048_576, reasoning: true, vision: true },
    costRank: 1,
    healthy: true,
  },
  {
    id: "gemini-3.1-flash-lite",
    providerId: "gemini",
    runtimeId: "gemini",
    localRemote: "remote",
    capabilities: { ...TEXT, contextLimit: 1_048_576, reasoning: true },
    costRank: 1,
    healthy: true,
  },
  {
    id: "gemini-flash-latest",
    providerId: "gemini",
    runtimeId: "gemini",
    localRemote: "remote",
    capabilities: { ...TEXT, contextLimit: 1_048_576, reasoning: true, vision: true },
    costRank: 1,
    healthy: true,
  },
  {
    id: "gemini-2.5-pro",
    providerId: "gemini",
    runtimeId: "gemini",
    localRemote: "remote",
    capabilities: { ...TEXT, contextLimit: 1_048_576, reasoning: true, vision: true },
    costRank: 3,
    healthy: true,
  },
];

/** Every remote card currently declared. Free-tier only. */
export const REMOTE_CARDS: ModelCard[] = [...GROQ_CARDS, ...GEMINI_CARDS];

export const CARDS_BY_PROVIDER: Record<string, ModelCard[]> = {
  groq: GROQ_CARDS,
  gemini: GEMINI_CARDS,
};
