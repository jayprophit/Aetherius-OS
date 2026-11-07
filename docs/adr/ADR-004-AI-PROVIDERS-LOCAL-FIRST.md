# ADR-004: AI providers are local-first and free-tier only for now

**Status:** accepted
**Date:** 2026-11-04
**Owner:** Jonathan (Aetherius project)
**Related:** `docs/OPENCLAW-MODEL-CATALOGUE-2026-10-29.md`,
`apps/openclaw-models/`, `docs/FREE-STACK-IDENTITY-COLLABORATION.md`

## Context

The model catalogue is built and tested, but the live gateway is cold for
hosted providers because no owner key is set. Only the local Ollama turn has
been measured. The owner wants local and cloud execution available at the same
time, but the default budget is £0 until the system is proven. A paid model
must not be called silently because a free provider is unavailable.

## Decision

### 1. Local inference is the primary path

Ollama is the default provider. The first model is the installed local model
`qwen3.5:2b-q4_K_M` (or the model actually measured as available). A local
request must work with no network connection.

If the local runtime is unavailable, the result is an explicit `UNAVAILABLE`
state. It is not a silent fallback to a paid provider.

### 2. Cloud inference is a free-tier fallback only

A hosted provider may be used only when all of the following are true:

- the owner has supplied a key for that provider,
- the provider has a current free tier or a documented zero-cost allowance,
- the free-tier terms have been checked and dated,
- the request is allowed by the data-classification policy,
- the free quota has not been exhausted.

The free-tier candidates are the ones already catalogued: OpenRouter free
models, Google Gemini free tier, Groq, Cerebras, Mistral and NVIDIA. A provider
that has moved to a paid-only model is removed from the active chain.

### 3. Paid and premium tiers are disabled

The active configuration must not contain a paid or premium model in its
primary or fallback chain. This includes the paid OpenRouter models, OpenAI,
Anthropic, xAI, DeepSeek, Moonshot, Z.ai, Together, Fireworks and Bedrock.

A paid model can be evaluated only after an explicit owner approval naming the
provider, the model, the maximum spend and the person authorised to stop it.
The default is `paid_usage_allowed: false`.

### 4. The budget is £0 with hard admission control

- A hard monthly cap of £0.
- A per-user and per-task quota.
- Admission control that refuses a paid endpoint before the request is sent.
- If every eligible free provider is exhausted or unavailable, the task queues,
  pauses or fails transparently. It does not call a paid model.
- 70/80/90/95/100% quota warnings for free allowances.
- No automatic upgrade, automatic purchase or automatic credit purchase.

### 5. Embeddings and vector storage stay local

Embeddings use a local model or a local sentence-transformer. The vector store
is local Qdrant or pgvector. A cloud embedding provider is allowed only under
the same free-tier and data-classification rules as a cloud LLM.

### 6. Evaluation uses a local, approved model list

The approved list and the evaluation fixtures are local. A model is "approved"
only for the tasks it has been measured on. There is no signed evaluation
report until a release actually needs one. A catalogue entry is not a
benchmark result.

### 7. Sensitive data stays local

- A task marked `CONFIDENTIAL` or `SECRET` is forced to local inference.
- A cloud fallback may receive only the minimum prompt needed, with secrets and
  personal data removed.
- Every cloud request records the provider, model, purpose, data class and
  provenance.
- Owner data is not used for provider training. A provider without a no-training
  term is not eligible for owner data.

### 8. Offline behaviour is explicit

When the network is unavailable, the local model continues to work. Cloud
fallback is disabled, not retried in a loop. The user sees `LOCAL_ONLY` or
`UNAVAILABLE`, never a spinner that implies a cloud call is in progress.

## Staged gates

| Stage | Scope | Gate |
|---|---|---|
| A0 | Local Ollama only | A plain turn and a tool turn succeed with the network disabled. |
| A1 | Free-tier fallback | Each enabled provider has a key, a dated free-tier check and one recorded successful turn. |
| A2 | Quota and admission control | A paid endpoint is refused; an exhausted free provider fails over or pauses without a charge. |
| A3 | Data classification | A confidential prompt never leaves the machine; a redacted prompt records its provenance. |
| A4 | Evaluation | Approved local models have task-specific results; no unmeasured model is presented as better. |
| A5 | Paid evaluation (owner-gated) | Written approval, cap, kill switch and a measured cost report. |

`0.1.0` ships A0 and may ship A1 only if the owner supplies a key and the
free-tier check is recorded. A5 is outside the current release scope.

## Explicit non-goals

- No paid model call in the default configuration.
- No claim that a hosted provider is configured or proven before a real turn.
- No claim that a free tier is permanent.
- No claim that a catalogue entry is a benchmark result.
- No training on owner data without a separate written agreement.
- No automatic upgrade to a paid plan.

## Consequences

**Good:**

- The local path works offline and costs nothing.
- Free cloud models can be used when they are genuinely available.
- A quota exhaustion cannot create a surprise bill.
- Sensitive data has a clear local default.

**Bad, and accepted:**

- Local 2B-class models are less capable than paid frontier models.
- Free tiers have rate limits, cold starts and changing terms.
- The user may see `UNAVAILABLE` where a paid product would simply charge.
- Maintaining several free providers is more work than one paid contract.

**Neutral:**

- The model catalogue and OpenClaw remain the interface. This ADR changes the
  policy, not the catalogue format.

## Implementation and verification

- `apps/openclaw-models` renders the `free` tier; applying it to the live
  `openclaw.json` is a reviewed action with a backup and a measured turn.
- A policy test must prove that paid and premium models are rejected from the
  default selection.
- A local-only test must run with the network disabled.
- A free-tier test must record the provider, model, date, quota state and the
  exact turn.
- The live gateway is not claimed as configured until the turn is recorded.
