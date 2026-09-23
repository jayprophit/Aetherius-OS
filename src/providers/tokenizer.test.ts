import { describe, expect, it } from "vitest";
import { TokenizerRegistry, resolveModelTokenizers, unknownTokenizerProfile, validateTokenizerProfile } from "./tokenizer";
import type { TokenizerProfile } from "./tokenizer";

function profile(over: Partial<TokenizerProfile> = {}): TokenizerProfile {
  return {
    profileId: "tok-bpe-32k",
    tokenizerId: "vendor-bpe-32k",
    tokenizerType: "BPE",
    family: "bpe-32k",
    vocabularySize: 32000,
    normalization: "nfc-lower",
    pretokenization: "byte-bpe",
    specialTokens: { bos: "<s>", eos: "</s>", unk: "<unk>", addedCount: 3 },
    byteFallback: true,
    maxSequence: 8192,
    sourceModelRef: "model-card:example-1",
    provenance: "OFFICIAL_MODEL_CARD",
    version: "1.0.0",
    evidenceRef: "https://example.invalid/card",
    ...over,
  };
}

describe("tokenizer profiles", () => {
  it("accepts explicit profiles and sparse metadata", () => {
    expect(validateTokenizerProfile(profile())).toEqual([]);
    expect(
      validateTokenizerProfile({ profileId: "sparse", tokenizerType: "UNKNOWN", provenance: "UNVERIFIED", version: "0.1.0" }),
    ).toEqual([]);
    const registry = new TokenizerRegistry();
    registry.register(profile());
    expect(registry.lookup("tok-bpe-32k")!.vocabularySize).toBe(32000);
    expect(() => registry.register(profile())).toThrowError(/duplicate/);
  });

  it("rejects malformed profiles", () => {
    expect(validateTokenizerProfile(profile({ profileId: "  " }))).toContain("profile-id");
    expect(validateTokenizerProfile(profile({ tokenizerType: "magic" as never }))).toContain("tokenizer-type");
    expect(validateTokenizerProfile(profile({ vocabularySize: 0 }))).toContain("vocabulary-size");
    expect(validateTokenizerProfile(profile({ vocabularySize: 1.5 }))).toContain("vocabulary-size");
    expect(
      validateTokenizerProfile(profile({ specialTokens: { bos: "", addedCount: -1 } })),
    ).toContain("special-tokens");
    expect(validateTokenizerProfile(profile({ maxSequence: 0 }))).toContain("max-sequence");
    expect(validateTokenizerProfile(profile({ provenance: "vibes" as never }))).toContain("provenance");
    expect(validateTokenizerProfile(profile({ version: "" }))).toContain("version");
  });

  it("unknown stays unknown: the canonical honest answer", () => {
    const unknown = unknownTokenizerProfile();
    expect(validateTokenizerProfile(unknown)).toEqual([]);
    expect(unknown).toEqual({ profileId: "unknown", tokenizerType: "UNKNOWN", provenance: "UNVERIFIED", version: "0.0.0" });
  });

  it("resolves only through explicit references, never names", () => {
    const registry = new TokenizerRegistry();
    registry.register(profile());
    const resolved = resolveModelTokenizers(
      [
        { modelId: "model-a", tokenizerProfileId: "tok-bpe-32k" },
        { modelId: "model-b", tokenizerProfileId: null },
        { modelId: "model-c", tokenizerProfileId: "missing" },
      ],
      registry,
    );
    expect(resolved).toEqual([
      { modelId: "model-a", profile: expect.objectContaining({ profileId: "tok-bpe-32k" }), known: true },
      { modelId: "model-b", profile: unknownTokenizerProfile(), known: false },
      { modelId: "model-c", profile: unknownTokenizerProfile(), known: false },
    ]);
    expect(() => resolveModelTokenizers([{ modelId: "  ", tokenizerProfileId: null }], registry)).toThrowError(
      /model id/,
    );
  });

  it("exposes no vendor/model-name guessing surface", () => {
    // Resolution takes profile ids, not model metadata: there is no
    // parameter that could carry a vendor or model name to guess from.
    // A model named like a famous family still resolves UNKNOWN.
    const registry = new TokenizerRegistry();
    const [result] = resolveModelTokenizers([{ modelId: "llama-like-70b", tokenizerProfileId: null }], registry);
    expect(result!.known).toBe(false);
    expect(result!.profile.tokenizerType).toBe("UNKNOWN");
  });

  it("lists deterministically", () => {
    const registry = new TokenizerRegistry();
    registry.register(profile({ profileId: "b" }));
    registry.register(profile({ profileId: "a" }));
    expect(registry.list().map((p) => p.profileId)).toEqual(["a", "b"]);
  });
});
