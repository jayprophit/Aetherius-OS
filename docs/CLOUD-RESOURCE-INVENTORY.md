# Cloud resource inventory — free tier only

**Status:** 2026-11-06. Verified against the signed-in provider consoles.
Free tiers only. No paid plan, no payment method and no billing agreement has
been added. The monthly budget remains **£0**.

**Policy:** free tiers only until the system is proven. Paid tiers are a later,
owner-gated option. Do not add a payment method, enable overages, buy credits or
accept a data-processing agreement without the owner's explicit approval.

**Important:** Aetherius OS is currently a personal hobby project, not a
registered company. Account names such as “Aetherius OS” are project labels, not
legal entities. Company formation, tax registration and merchant billing are
owner decisions that must happen before any paid tier is sold.

## 1. Verified state

| Provider | Account state | Resources | Evidence |
|---|---|---|---|
| Cloudflare | Free plan; account `87bcfffe9dac799fa69e44d3e0abeb4d`; Workers Free active; no payment method | Pages project `aetherius-preview`; D1 `aetherius-preview`; KV `aetherius-preview-kv`; Queue `aetherius-preview` (inactive, no consumer); R2 not enabled | Signed-in dashboard, 2026-11-06 |
| Supabase | Free plan; org `jayprophit's Org`; no payment method | Project `aetherius-preview`, ref `uympblyzeckxngglifnz`, region `eu-west-2` (London), nano compute, healthy | Signed-in dashboard, 2026-11-06 |
| Sentry | Free plan after a 14-day trial; org `aetherius-os`; EU (`de`) data region; no payment method; no project created yet | None yet | Signed-in dashboard, 2026-11-06 |
| GitHub | Public repository `jayprophit/Aetherius-OS`; free plan | Actions, Dependabot alerts, secret scanning | `gh` CLI and signed-in dashboard |
| Oracle Cloud | Account exists; free tier not yet provisioned | No VM, no Object Storage bucket | `UNVERIFIED` — not inspected in this session |
| Firebase | Account exists; Spark plan assumed, not verified | No resources created | `UNVERIFIED` |
| Brevo | Free account setup opened; not completed | None yet | Browser session, 2026-11-06 |
| Let's Encrypt | Not used directly | TLS is provided by Cloudflare Pages for `*.pages.dev` | Cloudflare Pages |

## 2. Created resources

| Resource | Provider | Identifier | Region / plan | Created | Cost |
|---|---|---|---|---|---|
| Pages project `aetherius-preview` | Cloudflare | `aetherius-preview` | Global edge; Free | 2026-11-06 | £0 |
| Pages deployment | Cloudflare | `https://29e63323.aetherius-preview.pages.dev` (production alias `https://aetherius-preview.pages.dev`) | Global edge; Free | 2026-11-06 | £0 |
| D1 database `aetherius-preview` | Cloudflare | `53c247a9-4dd2-43c8-b3fc-f8f0d643b0f0` | Free | 2026-11-06 | £0 |
| KV namespace `aetherius-preview-kv` | Cloudflare | `aacde4c65fff4787914e019492230ffc` | Free | 2026-11-06 | £0 |
| Queue `aetherius-preview` | Cloudflare | `0596ad6081a84e688dae040384dc4ba8` | Free; inactive, no consumer | 2026-11-06 | £0 |
| Supabase project `aetherius-preview` | Supabase | `uympblyzeckxngglifnz` | `eu-west-2` London; nano; Free | 2026-11-05 | £0 |
| Sentry organisation `aetherius-os` | Sentry | `aetherius-os` | EU (`de`); Free after trial | 2026-11-06 | £0 |

No secret values, API keys, database passwords or recovery codes belong in this
document. They are stored in KeePass under `Aetherius/Cloud/…`.

## 3. Blocked or deferred free resources

| Resource | Blocker | Decision |
|---|---|---|
| Cloudflare R2 bucket | Dashboard requires “Add R2 subscription” and a payment method | Deferred. Do not add a card just for R2. Use GitHub Releases or another free store for release bundles until an alternative is approved. |
| Cloudflare Queue consumer | No Worker consumer exists yet | Resource is created but inactive. Wire it only when a real background job exists. |
| Oracle Always Free VM | Capacity, network and SSH setup not tested | Deferred. Inspect the free-tier shape before creating anything. |
| Firebase Spark | Not needed for the Pages/Supabase path | Deferred to avoid running every free tier at once. |
| Brevo free account | Signup not completed | Retry. Free plan only; no card. |
| UptimeRobot | `ERR_TUNNEL_CONNECTION_FAILED` through the browser's network tunnel | Try an alternate URL or use a free self-hosted monitor such as Uptime Kuma. |
| Codecov | Not set up | Free for public repositories; sign in with GitHub. |
| Sentry project/DSN | No project created yet | Create only when an opt-in error-reporting path is approved. Local-first default remains no telemetry. |

## 4. Free-tier guardrails

- The monthly budget is **£0**. A paid plan is disabled.
- No automatic upgrade, overage purchase or credit top-up.
- Billing alerts and a hard stop are required where the provider supports them.
  If the provider cannot enforce a hard stop, do not use it for anything
  billable.
- Record the free-tier terms and the date they were checked. Free tiers change.
- Record the region and data class before sending data.
- Do not put secrets in Worker variables, KV, D1 or a repository. Use the
  provider's secret store and the approved credential vault.
- Free-tier services may sleep, cold-start, rate-limit or delete inactive data.
  Do not describe them as production-grade.
- A free tier is not a data-processing agreement. A provider without acceptable
  terms is not eligible for personal data.
- Delete demo resources when the test ends. An unused resource is still an
  inventory item and a potential cost or data risk.
- Sentry stays opt-in. The default build must not send telemetry or error
  reports to any third party.

## 5. Owner decisions still required

1. Keep or delete the unused Queue and the paused Supabase `Commerce` project.
2. Decide whether to pursue Oracle Always Free for an offline-capable VM; do not
   create it until the free shape and network exposure are understood.
3. Approve any public custom domain; until then the project uses the free
   `aetherius-preview.pages.dev` hostname.
4. Approve the final data-residency story. Cloudflare is global edge; Supabase is
   London; Sentry is EU. Do not send personal data to any of them yet.
5. Approve any paid tier, company formation, tax registration or merchant
   billing before money is accepted.

## 6. Read-only inventory record

| Field | Value |
|---|---|
| Provider | Cloudflare |
| Account ID | `87bcfffe9dac799fa69e44d3e0abeb4d` |
| Plan | Free; Workers Free active |
| Region | Global edge |
| Zones / domains | `aetherius-preview.pages.dev` (provider-assigned) |
| Workers | None deployed |
| Pages projects | `aetherius-preview` |
| R2 buckets | None |
| D1 databases | `aetherius-preview` |
| KV namespaces | `aetherius-preview-kv` |
| Queues | `aetherius-preview` (inactive) |
| Billing method present | No |
| Spending limit | Not applicable; no paid plan |
| Free-tier terms checked on | 2026-11-06 |
| Inventory performed by | OpenCode session, signed-in owner console |
| Inventory performed at | 2026-11-06 |

| Field | Value |
|---|---|
| Provider | Supabase |
| Organisation | `jayprophit's Org` |
| Project ref | `uympblyzeckxngglifnz` |
| Plan | Free; nano compute |
| Region | `eu-west-2` (London) |
| API URL | `https://uympblyzeckxngglifnz.supabase.co` |
| Billing method present | No |
| Free-tier terms checked on | 2026-11-06 |
| Inventory performed by | OpenCode session, signed-in owner console |
| Inventory performed at | 2026-11-06 |

## 7. Related documents

- `docs/FREE-STACK-CLOUD-NETWORK.md` — provider mapping and free-tier notes.
- `docs/FREE-STACK-SIGNING-DISTRIBUTION.md` — signing and artifact distribution.
- `docs/adr/ADR-004-AI-PROVIDERS-LOCAL-FIRST.md` — free-tier AI rules.
- `docs/adr/ADR-005-OPEN-CORE-FREEMIUM.md` — free core, optional paid tiers.
- `docs/BACKUP-RESTORE-DRILL.md` — backup target requirements.
