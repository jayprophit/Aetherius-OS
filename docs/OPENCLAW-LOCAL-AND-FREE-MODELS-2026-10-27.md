# OpenClaw live gateway: local and free models — 2026-10-27

Scope: the **live** OpenClaw gateway on this host, not the separate Windows npm
install. Every result below was measured on 2026-10-27. Nothing here claims a
hosted provider works: the hosted providers are configured but cold until the
owner supplies their keys.

## 1. Result

The live gateway now runs on a locally installed model, not ChatGPT:

- **Primary model**: `ollama/qwen3.5:2b-q4_K_M` (local, 1.9 GB, vision + tools)
- **Utility model**: the same local model
- **Image model**: the same local model
- **Fallbacks**: six hosted free-tier providers, configured through SecretRefs
- **Measured**: a gateway turn returned `42` with no fallback, and a second turn
  called the `read` tool successfully and returned `DESKTOP-IONV32V`
- **Hosted providers**: cold/configured-unavailable because their environment
  variables are unset; the gateway stays healthy and reports the degradation

## 2. Live topology

| Item | Value |
|---|---|
| WSL distro | `OpenClawGateway` (WSL 2, Ubuntu, systemd enabled) |
| OpenClaw | `2026.9.6 (eb377ac)` |
| Node | `24.19.0` |
| Gateway service | `openclaw-gateway.service` (systemd **user** unit, enabled, running) |
| Gateway address | `ws://127.0.0.1:18789` (loopback, token auth) |
| State directory | `/home/openclaw/.openclaw` |
| Config | `/home/openclaw/.openclaw/openclaw.json` (mode 600) |
| Backup before this change | `~/.openclaw/openclaw.json.pre-aetherion-20261027` |
| Ollama | `0.40.11`, user-space, `127.0.0.1:11434` |
| Ollama service | `ollama.service` (systemd **user** unit, enabled, running) |
| Ollama models | `/home/openclaw/.ollama/models` |
| GPU | NVIDIA GTX 1050 Ti, 4 GB, CUDA 12 runtime |

The Windows npm install at `C:\Users\jpowe\.openclaw\openclaw.json` is a
separate installation. It is not the gateway on port 18789 and was not the
target of this change.

### Why Ollama runs inside WSL

The WSL distro cannot reach the Windows Ollama listener: the Windows firewall
filters the WSL subnet, the host has no administrator rights to add a rule, and
Windows 10 19045 does not support WSL mirrored networking. The chosen fix is a
user-space Ollama inside the gateway distro. It needs no root, no firewall
change and no second gateway. The trade-off is that the gateway distro's CPU and
GPU are shared with the Windows host.

## 3. Local model

`qwen3.5:2b-q4_K_M` reports these capabilities from `/api/tags`:

- `completion`
- `vision`
- `tools`
- `thinking`

The model is 1,945,781,358 bytes (1.9 GB). Its architectural context is 262,144
tokens, but the live runtime cap is **16,384 tokens** (`contextTokens` and
`params.num_ctx`), because the GPU has 4 GB of VRAM.

The first gateway attempt used an 8,192-token runtime cap and failed with:

```text
400 {"error":"request (14451 tokens) exceeds the available context size (8192 tokens), try increasing it"}
```

OpenClaw's system prompt plus tool schema for this agent is about 14.4k tokens,
so 8k cannot hold a turn. At 16k the turn succeeds and the GPU uses about
3.0 GB of 4.0 GB. That leaves limited headroom: a much longer conversation or a
larger tool surface will overflow 16k. A hosted model or a reduced tool surface
is the answer for those cases, not a larger local context on this GPU.

## 4. Measured verification

### Direct Ollama

| Check | Result |
|---|---|
| One-shot answer | `The capital of Nigeria is Abuja.` |
| Generation speed | **25.32 tok/s** (`eval_count` 242) |
| Wall time | 33.07 s including model load and thinking |
| Tool call | `get_weather({"city":"Lagos"})` returned as a structured `tool_calls` entry |

### Through the live OpenClaw gateway

| Check | Result |
|---|---|
| Plain turn | final text `42`; winner provider `ollama`; winner model `qwen3.5:2b-q4_K_M`; `fallbackUsed: false`; no error |
| Tool turn | `read` called once, zero failures; returned `DESKTOP-IONV32V` from `/etc/hostname` |
| Model list | `ollama/qwen3.5:2b-q4_K_M` is tagged `default,image,configured,alias:local` |
| Gateway status | `Gateway service: running`; `Sessions: 3 stored`; default model `qwen3.5:2b-q4_K_M (8.2k ctx)` at the time of the status snapshot |
| GPU after the turns | 3,052 MiB / 4,096 MiB |

The `8.2k ctx` line in `openclaw status` is the session's displayed context at
that moment, not the configured 16k cap; `openclaw models list --provider
ollama` shows `16k/262k` for the model.

## 5. Hosted free providers

All six use a SecretRef, never a stored key:

```json
{ "source": "env", "provider": "default", "id": "OPENROUTER_API_KEY" }
```

| Provider | Base URL | Env var | Configured models |
|---|---|---|---|
| OpenRouter | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` | Nemotron 3 Super 120B free, Gemma 4 31B free, Inkling Small free, North Mini Code free |
| Google AI Studio | `https://generativelanguage.googleapis.com/v1beta` | `GEMINI_API_KEY` | Gemini 4 Argon, Gemini 3.8 Flash |
| Groq | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` | GPT OSS 120B, Qwen 3.6 27B |
| Cerebras | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` | GPT OSS 120B |
| Mistral | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` | Mistral Large, Mistral Small 4, Codestral |
| NVIDIA | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` | Nemotron 3 Ultra 550B, Nemotron 3.5 Lightning 30B, Nemotron 3.5 Super VL 120B |

The fallback order is:

1. `openrouter/nvidia/nemotron-3-super-120b-a12b:free`
2. `nvidia/nvidia/nemotron-3.5-lightning-30b-a3b`
3. `groq/openai/gpt-oss-120b`
4. `google/gemini-3.8-flash`
5. `mistral/mistral-small-latest`
6. `cerebras/gpt-oss-120b`

Aliases are configured for the common models: `local`, `free`, `gemma-free`,
`inkling`, `north-code`, `nvidia-ultra`, `nvidia`, `groq`, `gemini`, `gemini-4`,
`mistral`, `codestral`, `cerebras`.

### What "cold" means

With no keys set, the gateway starts normally and marks the six providers
`configured-unavailable` / `cold`. `openclaw status` reports:

```text
Degraded secrets: 6 degraded · provider:openrouter, provider:google, provider:groq,
                  provider:cerebras, provider:mistral, provider:nvidia
```

The gateway log records `SECRETS_OWNER_UNAVAILABLE` and `SECRETS_DEGRADED` for
each provider. This is the documented non-fatal path for model-provider
SecretRefs: the owner is isolated, the gateway keeps serving, and a later
`openclaw secrets reload` can recover it. The local model is unaffected.

## 6. How the owner supplies keys

Do not put provider keys in `openclaw.json`, a workspace `.env`, or a commit.
OpenClaw's trusted sources are:

1. the gateway process environment (systemd unit, container secret, CI secret);
2. the global runtime dotenv at `~/.openclaw/.env` (recommended for this
   install, mode 600);
3. the config `env.vars` block (plaintext in config; not recommended here);
4. optional login-shell import (`env.shellEnv.enabled`).

For this systemd user service, the simplest owner-managed option is:

```sh
install -m 600 /dev/null ~/.openclaw/.env
# edit ~/.openclaw/.env and add, one per line:
# OPENROUTER_API_KEY=...
# GEMINI_API_KEY=...
# GROQ_API_KEY=...
# CEREBRAS_API_KEY=...
# MISTRAL_API_KEY=...
# NVIDIA_API_KEY=...
systemctl --user restart openclaw-gateway.service
```

Then verify:

```sh
openclaw secrets reload
openclaw status
openclaw models list
```

`openclaw status` should stop reporting the six providers as degraded, and
`openclaw models list` should show `Auth` for the providers whose keys are
present. Only the keys the owner actually has need to be set; the rest stay
cold and non-fatal.

A systemd `EnvironmentFile=` with mode 600 is equivalent for the service
process. A workspace `.env` is not: OpenClaw deliberately ignores provider
credentials from it.

## 7. Security audit

`openclaw secrets audit --check` on the live gateway reports:

- **1 plaintext**: `gateway.auth.token` (pre-existing; not introduced by this
  change; rotate/migrate separately if the owner wants a SecretRef there)
- **6 unresolved**: the six provider refs above, expected until keys are set
- **0 store residue, 0 legacy, 0 shadowed**

No provider key is stored in the config. The Ollama `apiKey` value is the
non-secret local placeholder `ollama-local`; it is not a credential.

## 8. Limitations and non-claims

- **No hosted provider has been exercised.** Their model IDs and base URLs are
  configured, but without keys there is no successful hosted inference to
  report. Do not treat the table above as a provider-compatibility proof.
- **The local model is a 2B model.** It answered a one-line question and made
  one successful tool call. That is a wiring proof, not a quality claim.
- **16k is tight.** OpenClaw's prompt is about 14.4k tokens before the user
  message. Longer sessions need a hosted model or a smaller tool surface.
- **LM Studio is not part of the live gateway.** The Windows `lms.exe` exits
  with `0xC000001D` (illegal instruction) on this CPU; that is a separate
  install issue and was not retried here.
- **The Windows npm install is separate.** Its config was not changed by this
  work and it does not own port 18789.

## 9. Reproduce

```sh
# Gateway and model state
wsl.exe -d OpenClawGateway -e openclaw status
wsl.exe -d OpenClawGateway -e openclaw models list --provider ollama
wsl.exe -d OpenClawGateway -e systemctl --user status ollama.service

# Direct local inference
wsl.exe -d OpenClawGateway -e curl -sS http://127.0.0.1:11434/api/tags

# A gateway turn on the local model
wsl.exe -d OpenClawGateway -e openclaw agent --agent main \
  --session-key agent:main:local-check \
  --model ollama/qwen3.5:2b-q4_K_M \
  --message "What is 17 + 25? Reply with just the number." --json
```

The gateway config is not in this repository. It lives in the WSL distro at
`/home/openclaw/.openclaw/openclaw.json`; the pre-change backup is beside it.

## 10. See also

The provider and model catalogue built on 2026-10-29 is in
`docs/OPENCLAW-MODEL-CATALOGUE-2026-10-29.md` and
`apps/openclaw-models`. It records 17 providers and 52 models in free, paid,
premium and other tiers, with env-reference auth and config renderers. It does
not change the live gateway: the state measured above remains the live state
until the owner applies a selection and proves it with a real turn.
