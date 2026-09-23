# Tokenizer Profile (REQ-p18-tokenizer-profile, P18)

Tokenizer metadata leaf on ModelCard. METADATA, not runtime: no
encode/decode functions live here, and none are claimed.

## Schema (`src/providers/tokenizer.ts`)

- `TokenizerProfile`: profileId, tokenizerId?, type (BPE, WordPiece,
  Unigram, SentencePiece, byte-level, character-level, hybrid, UNKNOWN),
  family?, vocabularySize?, normalization?, pretokenization?,
  specialTokens (bos/eos/pad/unk/addedCount)?, byteFallback?,
  maxSequence?, sourceModelRef?, provenance, version, evidenceRef?.
  Sparse metadata allowed; unknown stays absent.
- Provenance: LOCAL_EMPIRICAL, MODEL_METADATA, OFFICIAL_MODEL_CARD,
  PROVIDER_REPORTED, EXTERNAL_REFERENCE, USER_SUPPLIED, UNVERIFIED —
  compatible with programme vocabulary, no second taxonomy.
- `TokenizerRegistry`: validated registration, duplicate rejection,
  deterministic listing.
- `unknownTokenizerProfile()`: the canonical honest answer
  (UNKNOWN/UNVERIFIED/0.0.0).

## ModelCard integration

`ModelCard.tokenizerProfileId?` (additive, `capabilities.ts`):
`resolveModelTokenizers` resolves explicit references only. Models
without a reference — including ones named like famous families —
resolve UNKNOWN. Resolution takes profile ids, never model metadata,
so there is no parameter vendor/model-name guessing could flow
through. UNKNOWN != DEFAULT: no fallback tokenizer is ever assigned.

## Anti-guessing and Model Fabric boundary

No provider/model-name → tokenizer mapping exists anywhere in this
unit. No cloud calls, no credentials, no provider probing, no
hardcoded vendor mappings. REQ-p18-model-fabric stays BLOCKED; this
unit neither completes nor bypasses it.

Future path: MODEL → TOKENIZER PROFILE → (runtime, later) → TOKEN
COUNT → CONTEXT BUDGET → P26 compiler. This unit is the first step
only.

Tests: `src/providers/tokenizer.test.ts` (6 tests: explicit/sparse
profiles, malformed rejection, UNKNOWN canonical, explicit-only
resolution, no-guessing surface, deterministic listing).
