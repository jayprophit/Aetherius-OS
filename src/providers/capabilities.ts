/**
 * P18/1 model-fabric capability contract + deterministic routing.
 *
 * Genesis asks for CAPABILITIES, never vendor names. This module filters
 * provider cards by hard requirements, then orders deterministically.
 * Documented order semantics (no invented scores):
 *   1. satisfy every hard requirement or be excluded (with reason);
 *   2. prefer local execution when the request allows it (privacy first);
 *   3. prefer larger context windows (capability headroom);
 *   4. stable provider/model id order (total, deterministic).
 * Manual pinning bypasses ranking but still enforces hard requirements.
 */

export type PrivacyClass = "local-only" | "cloud-allowed";
export type LocalRemote = "local" | "remote";

export interface ModelCapabilities {
  contextLimit: number;
  modalities: string[];
  reasoning: boolean;
  coding: boolean;
  vision: boolean;
  audio: boolean;
  toolUse: boolean;
  structuredOutput: boolean;
}

export interface ModelCard {
  id: string;
  providerId: string;
  /** Runtime carrying this model; defaults resolve per provider at invoke time. */
  runtimeId?: string;
  localRemote: LocalRemote;
  capabilities: ModelCapabilities;
  /** Lower is cheaper; relative units, documented per registry. */
  costRank: number;
  healthy: boolean;
  /**
   * Explicit tokenizer profile reference (REQ-p18-tokenizer-profile).
   * Absent means UNKNOWN — never inferred from vendor/model names.
   */
  tokenizerProfileId?: string;
}

export interface CapabilityRequest {
  minContext: number;
  modalities: string[];
  reasoning?: boolean;
  coding?: boolean;
  vision?: boolean;
  audio?: boolean;
  toolUse?: boolean;
  structuredOutput?: boolean;
  privacy: PrivacyClass;
  /** Manual pin: only this model id is eligible (still must satisfy requirements). */
  pin?: string;
}

export interface RouteExclusion {
  model: string;
  reason: string;
}

export interface RouteResult {
  /** Ranked eligible models, best first. Empty when nothing qualifies. */
  ranked: ModelCard[];
  excluded: RouteExclusion[];
}

function satisfies(model: ModelCard, request: CapabilityRequest): string | null {
  const c = model.capabilities;
  if (!model.healthy) return "provider unhealthy";
  if (request.pin && model.id !== request.pin) return "not the pinned model";
  if (c.contextLimit < request.minContext) {
    return `context ${c.contextLimit} < required ${request.minContext}`;
  }
  for (const m of request.modalities) {
    if (!c.modalities.includes(m)) return `missing modality ${m}`;
  }
  const flags: Array<[keyof CapabilityRequest, keyof ModelCapabilities, string]> = [
    ["reasoning", "reasoning", "reasoning"],
    ["coding", "coding", "coding"],
    ["vision", "vision", "vision"],
    ["audio", "audio", "audio"],
    ["toolUse", "toolUse", "tool use"],
    ["structuredOutput", "structuredOutput", "structured output"],
  ];
  for (const [rk, ck, label] of flags) {
    if (request[rk] === true && c[ck] !== true) return `missing capability ${label}`;
  }
  if (request.privacy === "local-only" && model.localRemote !== "local") {
    return "violates local-only privacy requirement";
  }
  return null;
}

function compareModels(a: ModelCard, b: ModelCard): number {
  // Privacy first: local before remote (when both passed the filter,
  // the request allows cloud, but local remains preferable).
  if (a.localRemote !== b.localRemote) return a.localRemote === "local" ? -1 : 1;
  // Capability headroom: larger context first.
  if (a.capabilities.contextLimit !== b.capabilities.contextLimit) {
    return b.capabilities.contextLimit - a.capabilities.contextLimit;
  }
  // Cheaper first (relative documented ranks).
  if (a.costRank !== b.costRank) return a.costRank - b.costRank;
  // Total deterministic order.
  if (a.providerId !== b.providerId) return a.providerId < b.providerId ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Rank eligible models best-first; pure + deterministic. */
export function routeCapabilityRequest(models: ModelCard[], request: CapabilityRequest): RouteResult {
  const ranked: ModelCard[] = [];
  const excluded: RouteExclusion[] = [];
  for (const model of models) {
    const reason = satisfies(model, request);
    if (reason === null) ranked.push(model);
    else excluded.push({ model: model.id, reason });
  }
  ranked.sort(compareModels);
  excluded.sort((a, b) => (a.model < b.model ? -1 : a.model > b.model ? 1 : 0));
  return { ranked, excluded };
}

/** Failover order is the ranked order: try best, then next on failure. */
export function failoverOrder(result: RouteResult): string[] {
  return result.ranked.map((m) => m.id);
}

/** Best pick or null when nothing qualifies (explicit failure, never silent). */
export function pickBest(result: RouteResult): ModelCard | null {
  return result.ranked[0] ?? null;
}
