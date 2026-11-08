# Cloudflare — Preparation Report

**Date:** 2026-11-08
**Status:** PREPARED — **nothing deployed, no public endpoint, no billing**
**Spend:** £0

## 1. Existing resources (verified read-only)

| Resource | Name | State |
|---|---|---|
| Pages | `aetherius-preview` | live at `master.aetherius-preview.pages.dev` (HTTP 200, Aetherius Shell) |
| Workers | `aetherius-sync` | deployed 2026-11-07; D1 binding `aetherius-preview` |
| D1 | `aetherius-preview` | 0 tables |
| KV | `aetherius-preview-kv` | provisioned |
| Queue | `aetherius-preview` | 0 producers / 0 consumers |
| R2 | `aetherius-blobs` | created 2026-11-07; unused |

OAuth token scopes now include `ai (write)`, `ai-search (write/run)`,
`workers_ai`-adjacent `ai`, `containers`, `queues`, `d1`, `pages`, `r2` — the
earlier 401/403 on AI endpoints is gone. `wrangler ai models list` returns 12+
models including `@cf/openai/gpt-oss-120b`, `@cf/meta/llama-3.2-3b-instruct`
and `@cf/google/gemma-2b-it-lora`.

**No duplicate resource was created and no plan was changed.**

## 2. Free-tier limits in play

| Service | Free allowance | Consequence |
|---|---|---|
| Workers | 100,000 requests/day, 10 ms CPU/request | fine for an auth/routing shim; not a compute host |
| Workers AI | 10,000 neurons/day | bounded; some models are paid-only |
| R2 | 10 GB-month, 1M Class A / 10M Class B ops, no egress fee | adequate for blobs; usage is zero |
| D1 | 5 GB, 5M rows read / 100k written per day | for structured sync state |
| Queue | 10,000 operations/day, 24 h retention | dispatch only, not durable task state |

The control plane stays in Supabase. Cloudflare is the edge entry point and
optional inference route — not the system of record.

## 3. Smallest proposed configuration

`workers/ai-gateway/` — one authenticated inference entry point:

- **Workers AI binding** for free hosted models (`@cf/openai/gpt-oss-120b`,
  `@cf/meta/llama-3.2-3b-instruct`, `@cf/google/gemma-2b-it-lora`).
- **OpenRouter** as a second free route, for models Cloudflare does not host.
- `GATEWAY_TOKEN` and `OPENROUTER_API_KEY` are **Worker secrets** — never in
  source, never in a browser bundle, never in a model prompt.
- CORS allowlist: the Pages origin plus localhost only.

### The £0 gate is a model allowlist

`FREE_MODELS` is the whole route table. A model not in it is rejected with 400.
There is deliberately no "fall back to the paid tier" path — that fallback is
how a free gateway starts billing. `/health` reports `spend_limit_gbp: 0` and
the current allowlist.

### Local validation performed

```
wrangler deploy --dry-run --outdir .wrangler-dry-run
  Total Upload: 4.06 KiB / gzip: 1.48 KiB
  bindings: env.AI, env.ALLOWED_ORIGIN, env.SPEND_LIMIT_GBP
  --dry-run: exiting now.
```

The manifest bundles and the AI binding resolves. **No request was sent and no
Worker was created.**

## 4. Security controls

- Token-gated routes; unauthenticated requests get 401.
- Provider credential only ever inside the Worker as a secret.
- Request bodies capped at 256 KiB.
- CORS closed to unknown origins; `Vary: Origin` set.
- `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`.
- No analytics, no logging of prompts, no third-party calls beyond the two
  named providers.

## 5. Rollback

`wrangler remove` (or delete the Worker in the dashboard). The Worker holds no
persistent state, so removal leaves nothing behind. Existing Pages, D1, KV,
Queue, R2 and the `aetherius-sync` Worker are untouched.

## 6. Requires owner approval

1. **Deploy** `aetherius-ai-gateway` (creates a public `workers.dev` endpoint).
2. **Set the secrets** `GATEWAY_TOKEN` and `OPENROUTER_API_KEY` (owner-driven;
   the values are never placed in source or chat).
3. **Confirm the free-model allowlist** — Workers AI model availability changes
   and paid-only models must stay unreachable.
4. **Remote execution** — a Worker is not an unrestricted Linux box. Any real
   remote worker needs its own design and approval.

Until then this directory is a reviewed artifact, not running software.
