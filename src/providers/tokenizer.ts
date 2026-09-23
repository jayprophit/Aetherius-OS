/**
 * REQ-p18-tokenizer-profile: tokenizer metadata leaf on ModelCard.
 *
 * Tokenizer METADATA, not runtime: families, vocab sizes, special
 * tokens and sequence bounds with explicit provenance — no
 * encode/decode functions live here, and none are claimed.
 *
 * Permanent anti-guessing rule: MODEL NAME != TOKENIZER IDENTITY,
 * PROVIDER != TOKENIZER, UNKNOWN != DEFAULT. There is no function in
 * this module mapping vendor/model names to tokenizers; profiles attach
 * only through explicit ModelCard references, and anything unreferenced
 * resolves to the canonical UNKNOWN profile.
 *
 * Model Fabric stays BLOCKED: no cloud calls, no credentials, no
 * provider probing, no hardcoded vendor mappings as workaround.
 */

export type TokenizerType =
  | "BPE"
  | "WordPiece"
  | "Unigram"
  | "SentencePiece"
  | "byte-level"
  | "character-level"
  | "hybrid"
  | "UNKNOWN";

export const TOKENIZER_TYPES: readonly TokenizerType[] = [
  "BPE",
  "WordPiece",
  "Unigram",
  "SentencePiece",
  "byte-level",
  "character-level",
  "hybrid",
  "UNKNOWN",
];

export type TokenizerProvenance =
  | "LOCAL_EMPIRICAL"
  | "MODEL_METADATA"
  | "OFFICIAL_MODEL_CARD"
  | "PROVIDER_REPORTED"
  | "EXTERNAL_REFERENCE"
  | "USER_SUPPLIED"
  | "UNVERIFIED";

const PROVENANCES: readonly TokenizerProvenance[] = [
  "LOCAL_EMPIRICAL",
  "MODEL_METADATA",
  "OFFICIAL_MODEL_CARD",
  "PROVIDER_REPORTED",
  "EXTERNAL_REFERENCE",
  "USER_SUPPLIED",
  "UNVERIFIED",
];

export interface TokenizerSpecialTokens {
  bos?: string;
  eos?: string;
  pad?: string;
  unk?: string;
  addedCount?: number;
}

export interface TokenizerProfile {
  profileId: string;
  tokenizerId?: string;
  tokenizerType: TokenizerType;
  family?: string;
  vocabularySize?: number;
  normalization?: string;
  pretokenization?: string;
  specialTokens?: TokenizerSpecialTokens;
  byteFallback?: boolean;
  maxSequence?: number;
  sourceModelRef?: string;
  provenance: TokenizerProvenance;
  version: string;
  evidenceRef?: string;
}

export type TokenizerProblem =
  | "profile-id"
  | "tokenizer-type"
  | "vocabulary-size"
  | "special-tokens"
  | "max-sequence"
  | "provenance"
  | "version";

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Canonical UNKNOWN profile: the honest answer when nothing is known. */
export function unknownTokenizerProfile(): TokenizerProfile {
  return {
    profileId: "unknown",
    tokenizerType: "UNKNOWN",
    provenance: "UNVERIFIED",
    version: "0.0.0",
  };
}

/** Validate a profile. Sparse metadata allowed; guessed values forbidden by shape. */
export function validateTokenizerProfile(profile: TokenizerProfile): TokenizerProblem[] {
  const problems: TokenizerProblem[] = [];
  if (!nonEmpty(profile.profileId)) problems.push("profile-id");
  if (!TOKENIZER_TYPES.includes(profile.tokenizerType)) problems.push("tokenizer-type");
  if (profile.vocabularySize !== undefined &&
      (!Number.isInteger(profile.vocabularySize) || profile.vocabularySize < 1)) {
    problems.push("vocabulary-size");
  }
  if (profile.specialTokens !== undefined) {
    const st = profile.specialTokens;
    const tokens = [st.bos, st.eos, st.pad, st.unk].filter((t) => t !== undefined);
    if (tokens.some((t) => !nonEmpty(t))) problems.push("special-tokens");
    if (st.addedCount !== undefined && (!Number.isInteger(st.addedCount) || st.addedCount < 0)) {
      problems.push("special-tokens");
    }
  }
  if (profile.maxSequence !== undefined &&
      (!Number.isInteger(profile.maxSequence) || profile.maxSequence < 1)) {
    problems.push("max-sequence");
  }
  if (!PROVENANCES.includes(profile.provenance)) problems.push("provenance");
  if (!nonEmpty(profile.version)) problems.push("version");
  return [...new Set(problems)].sort() as TokenizerProblem[];
}

export class TokenizerRegistry {
  private readonly profiles = new Map<string, TokenizerProfile>();

  register(profile: TokenizerProfile): TokenizerProfile {
    const problems = validateTokenizerProfile(profile);
    if (problems.length > 0) throw new Error(`invalid tokenizer profile: ${problems.join(",")}`);
    if (this.profiles.has(profile.profileId)) throw new Error(`duplicate tokenizer profile ${profile.profileId}`);
    const stored: TokenizerProfile = JSON.parse(JSON.stringify(profile)) as TokenizerProfile;
    this.profiles.set(profile.profileId, stored);
    return stored;
  }

  lookup(profileId: string): TokenizerProfile | null {
    return this.profiles.get(profileId) ?? null;
  }

  list(): TokenizerProfile[] {
    return [...this.profiles.values()].sort((a, b) => (a.profileId < b.profileId ? -1 : 1));
  }
}

export interface ModelTokenizerLink {
  modelId: string;
  tokenizerProfileId: string | null;
}

/**
 * Resolve tokenizer profiles for models through EXPLICIT references
 * only. Models without a reference resolve to UNKNOWN — never to a
 * guessed default, never inferred from the model or provider name.
 * (There is deliberately no parameter here that could carry a vendor
 * name: resolution takes profile ids, not model metadata.)
 */
export function resolveModelTokenizers(
  links: readonly ModelTokenizerLink[],
  registry: TokenizerRegistry,
): { modelId: string; profile: TokenizerProfile; known: boolean }[] {
  return [...links]
    .sort((a, b) => (a.modelId < b.modelId ? -1 : 1))
    .map((link) => {
      if (!link.modelId.trim()) throw new Error("model link requires a model id");
      const profile = link.tokenizerProfileId ? registry.lookup(link.tokenizerProfileId) : null;
      if (profile) return { modelId: link.modelId, profile, known: true };
      return { modelId: link.modelId, profile: unknownTokenizerProfile(), known: false };
    });
}
