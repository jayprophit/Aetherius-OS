# REQ-p26-context-compiler — Context Compiler over L0–L7

Status: PROVEN / COMPLETE. Owner: aetherius-os.

## Registered scope

Assemble/collapse resolved L0-L7 layers under budget into skill-ready context
(rules into skills, dedup, prioritization); retrieval policy exists,
compilation does not.

Prior state: `resolveLayers()` selects but never compiles; `budgetContext()`
already accepts a `compiledText` slot. The compiler is the missing step
between them — nothing else.

## What was built

`src/context/compiler.ts` — `compileContext()`, `candidatesFromLayers()`.
`src/context/compiler.test.ts` — 30 tests.

## Binding distinctions (tested)

- CONTEXT LAYERS != CONTEXT COMPILER; BUDGET CALCULATION != CONTEXT
  COMPILATION — resolveLayers output consumed via a mechanical adapter;
  budgetContext called for measurement/enforcement, never reimplemented.
  No ContextLayer2/TokenBudget2/ReviewContextPack2/EvidenceGraph2.
- EXPLICIT skillRef != INFERRED RELEVANCE — rules into skills runs only on
  caller-declared refs; unattributed rules stay in flow, never dropped.
- SAME TEXT != SAME SOURCE (kept separate); DUPLICATE != CONTRADICTION
  (never merged).
- REQUIRED CONTEXT DOES NOT FIT != SUCCESSFUL COMPILATION — required never
  displaced by optional; over-budget required reported as unresolvedRequired
  with OVER_BUDGET status; dropping all optionals still counts as compiled
  with omissions listed.
- UNKNOWN TOKEN COST != ZERO; NO TOKENIZER != DEFAULT TOKENIZER — without a
  runtime, compilation proceeds with budget UNAVAILABLE, never estimated.
- TOKENIZER PROFILE != TOKENIZER RUNTIME (passed through untouched).
- TRUNCATED != COMPLETE — item-boundary omissions recorded with reasons.
- Provenance and epistemic status ride through untouched (RETRIEVED !=
  ENDORSED); no lossy summarization exists (units carry source text verbatim).
- No model invocation, tool execution, retrieval side effects, memory writes,
  or authorization decisions. MAT items arrive caller-provided; no MAT import.
- Deterministic canonical ordering with explicit id tie-breaks;
  scrambled-input equality; no caller mutation; no clock/network.
- Validation precedence: authority/secret/persona before unknown-field.
  Strict closed shapes.
