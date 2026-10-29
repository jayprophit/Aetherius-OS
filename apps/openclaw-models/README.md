# OpenClaw Model Catalogue

A tested catalogue of the models OpenClaw can run, grouped into four honest tiers: **free**, **paid**, **premium** and **other**. It renders the two config fragments OpenClaw needs — `models.providers` and `agents.defaults` — without ever storing a credential.

**Built:** the catalogue, tier selections, aliases, validation, config renderers, a read-only CLI and 11 tests. **Not built:** live provider calls, model downloads, a config writer, a gateway client or a UI.

## Tiers

| Tier | Meaning | Models | Providers |
|---|---|---|---|
| `free` | Zero marginal cost: local inference or a documented free tier | 16 | ollama, openrouter, google, groq, cerebras, mistral, nvidia |
| `paid` | Standard metered API pricing | 24 | openrouter, openai, anthropic, xai, deepseek, moonshot, zai, together, fireworks |
| `premium` | Flagship or high-cost models for difficult work | 8 | google, openai, anthropic, xai, bedrock |
| `other` | Local runtimes, routers, limited-access or experimental models | 4 | openrouter, anthropic, deepseek, lmstudio |

The default chains are:

- **free** — `ollama/qwen3.5:2b-q4_K_M` first, then hosted free tiers only as fallbacks.
- **paid** — `openai/gpt-6-luna`, then DeepSeek, Anthropic, Moonshot, Z.ai, Together and Fireworks.
- **premium** — `openai/gpt-6-astra`, then Claude Opus 5.5, Grok 4.7, Claude Fable 5.1 and Gemini 3.1 Pro.
- **other** — `lmstudio/qwen3.5-9b`, then the OpenRouter auto router and Claude Mythos 5.

Every fallback resolves to a real catalogue entry. A model can also be selected directly by reference or alias (`astra`, `opus`, `kimi`, `local`, `lmstudio`, …), and the renderer keeps its tier as the fallback chain.

## Usage

```sh
node src/cli.ts tiers
node src/cli.ts models --tier free
node src/cli.ts models --tier premium --json
node src/cli.ts select free
node src/cli.ts providers --tier free
node src/cli.ts providers --provider openai
node src/cli.ts agents premium
node src/cli.ts validate
```

`providers` prints a `models.providers` fragment with `mode: "merge"`. `agents` prints an `agents.defaults` fragment. Both are plain JSON on stdout; the CLI never edits `openclaw.json`.

Hosted credentials are environment references, never values:

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "apiKey": "${OPENAI_API_KEY}",
        "api": "openai-responses"
      }
    }
  }
}
```

Ollama uses the non-secret placeholder `ollama-local`; Bedrock uses the AWS SDK credential chain and renders no API key.

## Honest limits

- **No hosted inference has been proven.** The owner has not supplied keys, so hosted providers are catalogued cold. Only the local Ollama turn measured on 2026-10-27 is verified.
- **LM Studio is unavailable.** The Windows `lms.exe` exits `0xC000001D`; the installed 9B GGUF is catalogued but not served.
- **Metadata is a snapshot.** Context windows, output limits and prices are recorded where the shipped OpenClaw 2026.9.6 docs or the live config publish them. Unknown fields are omitted, not guessed. Prices are USD per million tokens.
- **Free-tier terms can change.** The classification reflects published terms on 2026-10-29. No quota or rate-limit probe was run.
- **The slice does not apply config.** It renders fragments; applying them to a live gateway is an owner action, and the result must be measured before it is claimed.
- **No UI.** This is a library and CLI, not a settings screen.

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24+ runs the TypeScript directly via type stripping. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Provenance

Built for the owner's requirement that OpenClaw support any model, selectable installed local models and free/paid/premium/other provider tiers. Model ids and endpoints come from the provider documentation shipped with OpenClaw 2026.9.6 (`docs/providers/*.md`) and from the live gateway configuration measured on 2026-10-29.
