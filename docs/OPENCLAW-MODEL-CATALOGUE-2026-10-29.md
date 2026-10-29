# OpenClaw model catalogue — 2026-10-29

Scope: the catalogue and renderer in `apps/openclaw-models`. It records **17
providers and 52 models** across four tiers, with 29 aliases and a
primary/fallback chain per tier. It is not a claim that hosted inference works.
The live gateway was measured on 2026-10-27 with the local Ollama model; every
hosted provider is cold because the owner has not supplied its key.

The live `openclaw.json` was **not changed** by this slice. The catalogue
renders config fragments; applying them is an owner action that must be
measured afterwards.

## 1. Tiers

| Tier | Meaning | Models | Providers |
|---|---|---|---|
| `free` | Zero marginal cost: local inference or a documented free tier | 16 | ollama, openrouter, google, groq, cerebras, mistral, nvidia |
| `paid` | Standard metered API pricing | 24 | openrouter, openai, anthropic, xai, deepseek, moonshot, zai, together, fireworks |
| `premium` | Flagship or high-cost models for difficult work | 8 | google, openai, anthropic, xai, bedrock |
| `other` | Local runtimes, routers, limited-access or experimental models | 4 | openrouter, anthropic, deepseek, lmstudio |
| **Total** | | **52** | **17** |

Default chains:

| Tier | Primary | Fallbacks |
|---|---|---|
| `free` | `ollama/qwen3.5:2b-q4_K_M` | OpenRouter Nemotron free, Gemini 3.8 Flash, Groq GPT-OSS, Cerebras GPT-OSS, Mistral Small, NVIDIA Nemotron Lightning |
| `paid` | `openai/gpt-6-luna` | DeepSeek V4 Flash, Claude Sonnet 5, Kimi K2.7 Code, GLM 5.2, Together Kimi K2.6, Fireworks GLM 5.2 Fast |
| `premium` | `openai/gpt-6-astra` | Claude Opus 5.5, Grok 4.7, Claude Fable 5.1, Gemini 3.1 Pro |
| `other` | `lmstudio/qwen3.5-9b` | OpenRouter auto router, Claude Mythos 5 |

The free chain is local-first on purpose: a hosted free tier is a fallback, not
the primary. The premium chain is ordered by published capability and price,
not by a benchmark run: no premium model has been benchmarked in this pass.

## 2. Provider status

| Status | Meaning | Providers |
|---|---|---|
| `CONFIGURED_VERIFIED` | Present in the live gateway and a real turn succeeded | `ollama` |
| `CONFIGURED_COLD` | Present in the live gateway, key unset, no successful turn | `openrouter`, `google`, `groq`, `cerebras`, `mistral`, `nvidia` |
| `NEEDS_OWNER_KEY` | Catalogued with an exact endpoint, not in the live gateway | `openai`, `anthropic`, `xai`, `deepseek`, `moonshot`, `zai`, `together`, `fireworks`, `bedrock` |
| `LOCAL_UNAVAILABLE` | Runtime installed but not serving | `lmstudio` |

The live gateway measured on 2026-10-29 has 7 providers, 15 hosted free models
and 13 aliases. The catalogue is deliberately larger: the additional providers
are the ones that need an owner key, and cataloguing them without a key does
not make them usable.

## 3. Providers

| Provider | Label | API | Base URL | Auth | Status | Models |
|---|---|---|---|---|---|---|
| `ollama` | Ollama (local) | `ollama` | `http://127.0.0.1:11434` | local placeholder `ollama-local` | CONFIGURED_VERIFIED | 1 |
| `openrouter` | OpenRouter | `openai-completions` | `https://openrouter.ai/api/v1` | env `OPENROUTER_API_KEY` | CONFIGURED_COLD | 7 |
| `google` | Google AI Studio | `google-generative-ai` | `https://generativelanguage.googleapis.com/v1beta` | env `GEMINI_API_KEY` | CONFIGURED_COLD | 3 |
| `groq` | Groq | `openai-completions` | `https://api.groq.com/openai/v1` | env `GROQ_API_KEY` | CONFIGURED_COLD | 2 |
| `cerebras` | Cerebras | `openai-completions` | `https://api.cerebras.ai/v1` | env `CEREBRAS_API_KEY` | CONFIGURED_COLD | 1 |
| `mistral` | Mistral | `openai-completions` | `https://api.mistral.ai/v1` | env `MISTRAL_API_KEY` | CONFIGURED_COLD | 3 |
| `nvidia` | NVIDIA | `openai-completions` | `https://integrate.api.nvidia.com/v1` | env `NVIDIA_API_KEY` | CONFIGURED_COLD | 3 |
| `openai` | OpenAI | `openai-responses` | `https://api.openai.com/v1` | env `OPENAI_API_KEY` | NEEDS_OWNER_KEY | 3 |
| `anthropic` | Anthropic | `anthropic-messages` | `https://api.anthropic.com` | env `ANTHROPIC_API_KEY` | NEEDS_OWNER_KEY | 5 |
| `xai` | xAI | `openai-responses` | `https://api.x.ai/v1` | env `XAI_API_KEY` | NEEDS_OWNER_KEY | 4 |
| `deepseek` | DeepSeek | `openai-completions` | `https://api.deepseek.com` | env `DEEPSEEK_API_KEY` | NEEDS_OWNER_KEY | 4 |
| `moonshot` | Moonshot AI | `openai-completions` | `https://api.moonshot.ai/v1` | env `MOONSHOT_API_KEY` | NEEDS_OWNER_KEY | 2 |
| `zai` | Z.ai | `openai-completions` | `https://api.z.ai/api/paas/v4` | env `ZAI_API_KEY` | NEEDS_OWNER_KEY | 4 |
| `together` | Together AI | `openai-completions` | `https://api.together.xyz/v1` | env `TOGETHER_API_KEY` | NEEDS_OWNER_KEY | 4 |
| `fireworks` | Fireworks AI | `openai-completions` | `https://api.fireworks.ai/inference/v1` | env `FIREWORKS_API_KEY` | NEEDS_OWNER_KEY | 3 |
| `bedrock` | Amazon Bedrock | `bedrock-converse-stream` | `https://bedrock-runtime.us-east-1.amazonaws.com` | AWS SDK chain | NEEDS_OWNER_KEY | 2 |
| `lmstudio` | LM Studio (local) | `openai-completions` | `http://localhost:1234/v1` | env `LM_API_TOKEN` | LOCAL_UNAVAILABLE | 1 |

Provider ids, API types, base URLs and model ids were checked against the
provider documentation shipped with OpenClaw 2026.9.6 (`docs/providers/*.md`,
including `docs/providers/openai/models.md`) and the live gateway
configuration. Unknown context, output and price fields are omitted rather than
guessed.

## 4. Free tier

Primary: `ollama/qwen3.5:2b-q4_K_M`

| Model | Name | Context | Max out | Input | USD per Mtok in/out |
|---|---|---|---|---|---|
| `ollama/qwen3.5:2b-q4_K_M` | Qwen3.5 2B Q4_K_M (local, vision + tools) | 262,144 | 16,384 | text, image | 0 / 0 |
| `openrouter/nvidia/nemotron-3-super-120b-a12b:free` | Nemotron 3 Super 120B (free) | 262,144 | 8,192 | text | 0 / 0 |
| `openrouter/google/gemma-4-31b-it:free` | Gemma 4 31B IT (free) | 262,144 | 8,192 | text | 0 / 0 |
| `openrouter/thinkingmachines/inkling-small:free` | Inkling Small (free) | 1,048,576 | 8,192 | text | 0 / 0 |
| `openrouter/cohere/north-mini-code:free` | North Mini Code (free) | 256,000 | 8,192 | text | 0 / 0 |
| `google/gemini-4-argon` | Gemini 4 Argon (free tier) | 1,048,576 | 65,536 | text, image | 0 / 0 |
| `google/gemini-3.8-flash` | Gemini 3.8 Flash (free tier) | 1,048,576 | 65,536 | text, image | 0 / 0 |
| `groq/openai/gpt-oss-120b` | GPT OSS 120B (free tier) | 131,072 | 8,192 | text | 0 / 0 |
| `groq/qwen/qwen3.6-27b` | Qwen 3.6 27B (free tier) | 131,072 | 8,192 | text | 0 / 0 |
| `cerebras/gpt-oss-120b` | GPT OSS 120B (free tier) | 131,072 | 40,960 | text | 0 / 0 |
| `mistral/mistral-large-latest` | Mistral Large (free tier) | 262,144 | 16,384 | text, image | 0 / 0 |
| `mistral/mistral-small-latest` | Mistral Small 4 (free tier) | 262,144 | 16,384 | text, image | 0 / 0 |
| `mistral/codestral-latest` | Codestral (free tier) | 128,000 | 4,096 | text | 0 / 0 |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B (free) | 1,048,576 | 8,192 | text | 0 / 0 |
| `nvidia/nvidia/nemotron-3.5-lightning-30b-a3b` | Nemotron 3.5 Lightning 30B (free) | 1,048,576 | 16,384 | text | 0 / 0 |
| `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b` | Nemotron 3.5 Super VL 120B (free, vision) | 1,048,576 | 8,192 | text, image | 0 / 0 |

## 5. Paid tier

Primary: `openai/gpt-6-luna`

| Model | Name | Context | Max out | Input | USD per Mtok in/out |
|---|---|---|---|---|---|
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 (paid) | 262,144 | 32,768 | text, image | - |
| `openrouter/deepseek/deepseek-v4-pro` | DeepSeek V4 Pro (paid) | 1,000,000 | 384,000 | text | - |
| `openai/gpt-6-sol` | GPT-6 Sol | 1,050,000 | 128,000 | text, image | 2 / 10 |
| `openai/gpt-6-luna` | GPT-6 Luna | 1,050,000 | 128,000 | text, image | 0.1 / 0.5 |
| `anthropic/claude-sonnet-5` | Claude Sonnet 5 | 1,000,000 | 128,000 | text, image | 2 / 10 |
| `xai/grok-4.6` | Grok 4.6 | - | - | text, image | - |
| `xai/grok-4.5` | Grok 4.5 | - | - | text, image | - |
| `xai/grok-code-fast-1` | Grok Code Fast 1 | - | - | text | - |
| `deepseek/deepseek-v4-pro` | DeepSeek V4 Pro | 1,000,000 | 384,000 | text | 0.3 / 1.2 |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | 1,000,000 | 384,000 | text | 0.3 / 1.2 |
| `deepseek/deepseek-flash` | DeepSeek V4.1 Flash | 1,000,000 | 384,000 | text, image | 0.3 / 1.2 |
| `moonshot/kimi-k3` | Kimi K3 | 1,048,576 | 1,048,576 | text, image, video | 3 / 15 |
| `moonshot/kimi-k2.7-code` | Kimi K2.7 Code | 262,144 | 262,144 | text, image, video | - |
| `zai/glm-5.3` | GLM 5.3 | 1,048,576 | - | text | - |
| `zai/glm-5.3-flash` | GLM 5.3 Flash | 1,048,576 | - | text, image | - |
| `zai/glm-5.2` | GLM 5.2 | 1,048,576 | - | text | - |
| `zai/glm-5-turbo` | GLM 5 Turbo | 200,000 | - | text | - |
| `together/moonshotai/Kimi-K2.6` | Kimi K2.6 FP4 | 262,144 | 32,768 | text, image | 1.2 / 4.5 |
| `together/deepseek-ai/DeepSeek-V4-Pro` | DeepSeek V4 Pro | 512,000 | 384,000 | text | 1.74 / 3.48 |
| `together/zai-org/GLM-5.2` | GLM 5.2 FP4 | 262,144 | 131,072 | text | 1.4 / 4.4 |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | 131,072 | 8,192 | text | 1.04 / 1.04 |
| `fireworks/accounts/fireworks/routers/glm-5p2-fast` | GLM 5.2 Fast | 256,000 | 256,000 | text | - |
| `fireworks/accounts/fireworks/models/kimi-k2p6` | Kimi K2.6 | 262,144 | 262,144 | text, image | - |
| `fireworks/accounts/fireworks/routers/kimi-k2p6-turbo` | Kimi K2.6 Fast | 262,144 | 256,000 | text, image | - |

## 6. Premium tier

Primary: `openai/gpt-6-astra`

| Model | Name | Context | Max out | Input | USD per Mtok in/out |
|---|---|---|---|---|---|
| `google/gemini-3.1-pro-preview` | Gemini 3.1 Pro Preview | 1,048,576 | 65,536 | text, image | - |
| `openai/gpt-6-astra` | GPT-6 Astra | 1,050,000 | 128,000 | text, image | 10 / 50 |
| `anthropic/claude-opus-5-5` | Claude Opus 5.5 | 1,000,000 | 128,000 | text, image | 4 / 20 |
| `anthropic/claude-opus-5` | Claude Opus 5 | 1,000,000 | 128,000 | text, image | 5 / 25 |
| `anthropic/claude-fable-5-1` | Claude Fable 5.1 | 1,000,000 | 128,000 | text, image | 10 / 50 |
| `xai/grok-4.7` | Grok 4.7 | - | - | text, image | - |
| `bedrock/anthropic.claude-opus-5` | Claude Opus 5 (Bedrock) | 1,000,000 | 128,000 | text, image | - |
| `bedrock/anthropic.claude-fable-5` | Claude Fable 5 (Bedrock) | 1,000,000 | 128,000 | text, image | - |

## 7. Other tier

Primary: `lmstudio/qwen3.5-9b`

| Model | Name | Context | Max out | Input | USD per Mtok in/out | Notes |
|---|---|---|---|---|---|---|
| `openrouter/openrouter/auto` | OpenRouter Auto router | - | - | text | - | The router chooses a model; metadata and price depend on the chosen model. |
| `anthropic/claude-mythos-5` | Claude Mythos 5 (limited access) | 1,000,000 | 128,000 | text, image | 10 / 50 | Limited-access model; availability depends on the account. |
| `deepseek/deepseek-v4-flash-vision-exp` | DeepSeek V4 Flash Vision (experimental) | 1,000,000 | 384,000 | text, image | - | Experimental vision surface. |
| `lmstudio/qwen3.5-9b` | Qwen3.5 9B Q4_K_M (LM Studio) | 262,144 | 16,384 | text, image | 0 / 0 | Installed as Qwen3.5-9B-Q4_K_M.gguf with an mmproj file; runtime is unavailable. |

## 8. Aliases

| Alias | Ref |
|---|---|
| `local` | `ollama/qwen3.5:2b-q4_K_M` |
| `free` | `openrouter/nvidia/nemotron-3-super-120b-a12b:free` |
| `gemma-free` | `openrouter/google/gemma-4-31b-it:free` |
| `inkling` | `openrouter/thinkingmachines/inkling-small:free` |
| `north-code` | `openrouter/cohere/north-mini-code:free` |
| `nvidia-ultra` | `nvidia/nvidia/nemotron-3-ultra-550b-a55b` |
| `nvidia` | `nvidia/nvidia/nemotron-3.5-lightning-30b-a3b` |
| `groq` | `groq/openai/gpt-oss-120b` |
| `gemini` | `google/gemini-3.8-flash` |
| `gemini-4` | `google/gemini-4-argon` |
| `mistral` | `mistral/mistral-small-latest` |
| `codestral` | `mistral/codestral-latest` |
| `cerebras` | `cerebras/gpt-oss-120b` |
| `astra` | `openai/gpt-6-astra` |
| `sol` | `openai/gpt-6-sol` |
| `luna` | `openai/gpt-6-luna` |
| `opus` | `anthropic/claude-opus-5` |
| `opus-5.5` | `anthropic/claude-opus-5-5` |
| `sonnet` | `anthropic/claude-sonnet-5` |
| `fable` | `anthropic/claude-fable-5-1` |
| `grok` | `xai/grok-4.7` |
| `deepseek` | `deepseek/deepseek-v4-pro` |
| `kimi` | `moonshot/kimi-k3` |
| `glm` | `zai/glm-5.3` |
| `together-kimi` | `together/moonshotai/Kimi-K2.6` |
| `fireworks-glm` | `fireworks/accounts/fireworks/routers/glm-5p2-fast` |
| `bedrock-opus` | `bedrock/anthropic.claude-opus-5` |
| `lmstudio` | `lmstudio/qwen3.5-9b` |
| `router` | `openrouter/openrouter/auto` |

## 9. Auth and secrets

- Hosted providers render `apiKey: "${ENV_VAR}"`. The catalogue stores the
  environment variable name, never its value.
- Ollama renders the non-secret placeholder `ollama-local`.
- Bedrock renders no `apiKey` and sets `auth: "aws-sdk"`, so the AWS SDK
  credential chain supplies the credential.
- `validateCatalogue()` rejects duplicate provider ids, duplicate model refs,
  aliases that point at missing models, aliases containing `/`, invalid tiers,
  empty modalities, non-positive context/output limits and negative costs.
- The test suite serialises the whole rendered config and asserts that it
  contains no key-shaped strings (`sk-…`, `AIza…`, `xai-…`).

## 10. Applying a selection

The CLI is read-only. To apply a selection, the owner merges the rendered
fragments into the live config and then proves the result with a real turn.

```sh
cd apps/openclaw-models
node src/cli.ts validate
node src/cli.ts providers --tier free
node src/cli.ts agents free
```

Merge rules:

1. Back up `/home/openclaw/.openclaw/openclaw.json` first.
2. Merge the rendered `providers` object into `models.providers`. Keep
   `models.mode: "merge"` so existing providers are not discarded.
3. Merge the rendered `agents.defaults.model` and `agents.defaults.models`
   into `agents.defaults`. Keep the existing utility and image model settings
   unless the owner intends to change them.
4. Set the environment variables named by the providers being enabled. Do not
   paste a key into the JSON file.
5. Restart the gateway with the host's normal service command and make one
   real turn with the selected model. Record the exact model ref and whether a
   fallback was used.

Verification caveat: `openclaw models list --json` was attempted on this host
on 2026-10-29 and returned 0 bytes with exit 0; the plain `models list` command
hung under shell quoting. Neither result is accepted here as evidence that the
catalogue is live. The only accepted evidence is a successful gateway turn
whose model ref is recorded.

## 11. Live state and non-claims

Measured live state (2026-10-29):

- Gateway: OpenClaw 2026.9.6 in the `OpenClawGateway` WSL distro, port 18789.
- Providers in the live config: `ollama`, `openrouter`, `google`, `groq`,
  `cerebras`, `mistral`, `nvidia` — 7.
- Hosted models in the live config: 15, all free-tier.
- Aliases in the live config: 13.
- Primary: `ollama/qwen3.5:2b-q4_K_M`, 16,384-token runtime cap, vision and
  tools. A plain turn and a tool turn succeeded on 2026-10-27.
- Hosted providers: cold. Their environment variables are unset; the gateway
  stays healthy and reports the degradation.

This document does **not** claim:

- that any hosted provider works, has a valid key, or has been called;
- that the live gateway has been switched to a paid or premium model;
- that the catalogue is exhaustive or that provider catalogues are stable;
- that free-tier quotas, rate limits or prices will remain as published;
- that LM Studio serves the installed 9B model (it does not; `lms.exe` exits
  `0xC000001D`);
- that the CLI applies config, edits `openclaw.json`, downloads a model or
  provides a UI;
- that any model in this catalogue is better than another on a benchmark. No
  such benchmark was run.

## 12. Evidence

- `node --test "tests/*.test.ts"` in `apps/openclaw-models` — 11 passed, 0
  failed.
- `node src/cli.ts validate` — `catalogue valid: 17 providers, 52 models,
  source 2026-10-29`.
- `npx tsc -p apps/tsconfig.json --noEmit` — exit 0.
- `node apps/verify.mjs` — 17/17 slices passed.
- `npx vitest run src/programme/buildManifest.test.ts
  src/programme/workspaceRegistry.test.ts` — 50 passed.
- `docs/BUILD-MANIFEST-REGISTRY.yaml` — 45 projects, including
  `openclaw-models`.

The catalogue's own source is `apps/openclaw-models/src/catalog.ts`; the
renderers and validators are in the same file; the CLI is
`apps/openclaw-models/src/cli.ts`.
