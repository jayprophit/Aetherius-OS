import { LAYERS, type LayerId } from "./layers";

/**
 * REQ-p26-token-context-budget: tokenizer-aware context budgeting over
 * L0–L7 layers and compiler output.
 *
 * Budgets L0–L7 layer content and compiled output in EFFECTIVE TOKENS
 * under ADVERTISED LIMITS. Extends the layers policy; never a second
 * Context fabric; never estimates.
 *
 * Permanent distinctions (enforced):
 * - CHARACTER/WORD COUNT != TOKEN COUNT (no char/word approximation).
 * - TOKENIZER METADATA != EXECUTABLE TOKENIZATION (a TokenizerProfile
 *   is not a runtime; passing one fails validation).
 * - ADVERTISED CONTEXT != EFFECTIVE CONTEXT (limit is a ceiling).
 * - UNKNOWN TOKEN COUNT != ZERO TOKENS (populated layers without a
 *   runtime are UNAVAILABLE, never zero).
 * - NO TOKENIZER != DEFAULT TOKENIZER (no fallback, no vendor guess).
 *
 * Without an executable TokenizerRuntime the answer is UNAVAILABLE —
 * mocked, vendor-guessed and approximate-as-exact counts are forbidden
 * (no ESTIMATE path exists: the requirement defines none).
 */

export interface TokenizerRuntime {
  runtimeId: string;
  count(text: string): number;
}

export interface BudgetLayer {
  layer: LayerId;
  text: string;
}

export interface BudgetInput {
  advertisedLimit: number;
  outputReserve?: number;
  fixedOverhead?: number;
  layers: BudgetLayer[];
  /** Compiler output when available (what actually gets sent). */
  compiledText?: string;
  tokenizer?: TokenizerRuntime;
}

export type BudgetStatus = "FITS" | "EXCEEDS" | "UNAVAILABLE";

export interface LayerTokenReport {
  layer: LayerId;
  tokens: number;
}

export interface TokenBudgetReport {
  status: BudgetStatus;
  advertisedLimit: number;
  outputReserve: number;
  fixedOverhead: number;
  availableInput: number;
  /** Raw per-layer footprint (source accounting, not prompt size). */
  rawLayerTotal: number;
  layers: LayerTokenReport[];
  /** Effective footprint actually sent (compiled when provided). */
  effectiveTotal: number;
  compiledUsed: boolean;
  remaining: number;
  overflow: number;
  tokenizerRuntimeId: string;
  reasons: string[];
}

export type BudgetProblem =
  | "advertised-limit"
  | "output-reserve"
  | "fixed-overhead"
  | "layers"
  | "compiled"
  | "tokenizer";

function positiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function nonNegativeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function validTokenizer(value: unknown): value is TokenizerRuntime {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate["runtimeId"] === "string" &&
    (candidate["runtimeId"] as string).trim().length > 0 &&
    typeof candidate["count"] === "function";
}

/**
 * Budget context in effective tokens. Pure + deterministic. Without an
 * executable tokenizer runtime the result is UNAVAILABLE — never an
 * estimate smuggled into an exact field.
 */
export function budgetContext(input: BudgetInput): TokenBudgetReport {
  if (!positiveInt(input.advertisedLimit)) {
    throw new Error("advertisedLimit must be a positive integer");
  }
  const outputReserve = input.outputReserve ?? 0;
  if (!nonNegativeInt(outputReserve) || outputReserve > input.advertisedLimit) {
    throw new Error("outputReserve must be a non-negative integer within the advertised limit");
  }
  const fixedOverhead = input.fixedOverhead ?? 0;
  if (!nonNegativeInt(fixedOverhead) || fixedOverhead > input.advertisedLimit) {
    throw new Error("fixedOverhead must be a non-negative integer within the advertised limit");
  }
  if (!Array.isArray(input.layers)) throw new Error("layers must be an array");
  const seen = new Set<LayerId>();
  for (const entry of input.layers) {
    if (!LAYERS.includes(entry.layer)) throw new Error(`unknown context layer ${String(entry.layer)}`);
    if (seen.has(entry.layer)) throw new Error(`duplicate context layer ${entry.layer}`);
    seen.add(entry.layer);
    if (typeof entry.text !== "string") throw new Error(`layer ${entry.layer} text must be a string`);
  }
  if (input.compiledText !== undefined && typeof input.compiledText !== "string") {
    throw new Error("compiledText must be a string when present");
  }
  if (input.tokenizer !== undefined && !validTokenizer(input.tokenizer)) {
    throw new Error("tokenizer must be an executable TokenizerRuntime (metadata profiles are not runtimes)");
  }
  if (input.tokenizer === undefined) {
    return {
      status: "UNAVAILABLE",
      advertisedLimit: input.advertisedLimit,
      outputReserve,
      fixedOverhead,
      availableInput: input.advertisedLimit - outputReserve - fixedOverhead,
      rawLayerTotal: 0,
      layers: [],
      effectiveTotal: 0,
      compiledUsed: false,
      remaining: 0,
      overflow: 0,
      tokenizerRuntimeId: "",
      reasons: ["no executable tokenizer runtime: token count UNAVAILABLE (never estimated, never guessed)"],
    };
  }
  const layers: LayerTokenReport[] = input.layers.map((entry) => ({
    layer: entry.layer,
    tokens: countOrThrow(input.tokenizer as TokenizerRuntime, entry.text, entry.layer),
  }));
  layers.sort((a, b) => (a.layer < b.layer ? -1 : 1));
  const rawLayerTotal = layers.reduce((sum, l) => sum + l.tokens, 0);
  let effectiveTotal = rawLayerTotal;
  let compiledUsed = false;
  if (input.compiledText !== undefined) {
    effectiveTotal = countOrThrow(input.tokenizer as TokenizerRuntime, input.compiledText, "compiled");
    compiledUsed = true;
  }
  const availableInput = input.advertisedLimit - outputReserve - fixedOverhead;
  const remaining = Math.max(0, availableInput - effectiveTotal);
  const overflow = Math.max(0, effectiveTotal - availableInput);
  const reasons: string[] = [];
  if (overflow > 0) {
    const ranked = [...layers].sort((a, b) => (b.tokens !== a.tokens ? b.tokens - a.tokens : a.layer < b.layer ? -1 : 1));
    reasons.push(
      `overflow ${overflow} tokens; largest layers: ${ranked.slice(0, 3).map((l) => `${l.layer}=${l.tokens}`).join(", ")}`,
    );
  }
  return {
    status: overflow > 0 ? "EXCEEDS" : "FITS",
    advertisedLimit: input.advertisedLimit,
    outputReserve,
    fixedOverhead,
    availableInput,
    rawLayerTotal,
    layers,
    effectiveTotal,
    compiledUsed,
    remaining,
    overflow,
    tokenizerRuntimeId: (input.tokenizer as TokenizerRuntime).runtimeId,
    reasons,
  };
}

function countOrThrow(tokenizer: TokenizerRuntime, text: string, what: string): number {
  const count = tokenizer.count(text);
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`tokenizer ${tokenizer.runtimeId} returned invalid count for ${what}`);
  }
  return count;
}
