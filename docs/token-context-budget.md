# Token Context Budget (REQ-p26-token-context-budget, P26)

Tokenizer-aware budgeting of L0–L7 layers and compiler output in
effective tokens under advertised limits. Extends the layers policy;
never a second Context fabric; never estimates.

## Contract (`src/context/budget.ts`)

`budgetContext({advertisedLimit, outputReserve?, fixedOverhead?,
layers, compiledText?, tokenizer?})`:

- **No runtime → UNAVAILABLE.** Without an executable
  `TokenizerRuntime{id, count(text)}` the answer carries zero layer
  rows and the reason "never estimated, never guessed" — even for
  trivial text (tested). TokenizerProfile metadata is rejected as a
  runtime; famous model names change nothing.
- **With runtime → exact accounting.** Per-layer token rows (sorted,
  deterministic), raw layer total (source accounting) kept separate
  from the effective total (compiled text when provided, raw sum
  otherwise) — never summed together as prompt size.
- **Budget math:** available = advertised − reserve − overhead;
  reserves validated explicit, finite, within capacity (no
  percentages invented). Status FITS/EXCEEDS with remaining/overflow;
  overflow names the largest layers.
- **Honesty details:** empty present layers count 0 (explicit empty,
  not unknown); populated layers without runtime are UNAVAILABLE, not
  zero; broken runtimes (NaN/negative/non-integer counts) fail loudly;
  malformed limits/reserves/layers rejected; duplicate layers
  rejected. No layer priority imposed (compiler owns content policy).

Future path: MODEL → TOKENIZER PROFILE → (runtime, later) → TOKEN
COUNT → CONTEXT BUDGET → compiler. This unit is the budget contract;
the runtime and compiler remain future.

Tests: `src/context/budget.test.ts` (11 tests: exact budgeting,
UNAVAILABLE honesty, metadata rejection, name-independence,
no-double-count, overflow, sparse/empty/exact-fit, malformed
rejection, broken runtimes, determinism, no built-in estimator).
Test doubles are labeled fixtures, never production evidence.
