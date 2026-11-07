# Aetherius OS — the $0 stack

**Decision: 2026-11-07.** Use free tiers only, stay inside the limits, and
the card on file never gets charged. Anything that would require paying is
skipped. This file is the record of what is used, what it costs, and why.

## What we use (all live, all free inside limits)

| Service | Used for | Free tier | State |
|---|---|---|---|
| Cloudflare Pages | Aetherius OS shell hosting | Unlimited bandwidth/builds | Live |
| Cloudflare Workers | Sync API (`aetherius-sync`) | 100k requests/day | Live |
| Cloudflare D1 | Sync database | 5M reads / 100k writes / 5 GB per day | Live (schema applied) |
| Cloudflare R2 | Blob storage (future photo/audio sync) | 10 GB storage, 1M writes, 10M reads/mo | Live (bucket `aetherius-blobs`, empty) |
| Cloudflare KV | Key-value cache | 100k reads/day, 1k writes/day | Created, unused |
| Vercel | Shell deploy mirror | 100 GB bandwidth/mo, Hobby | Live (GitHub auto-deploy) |
| Supabase | Preview backend (eu-west-2) | 500 MB DB, 1 GB storage | Active |
| Sentry | Error monitoring | 5k errors/mo (EU) | Project created, DSN in KeePass, SDK not yet wired |
| GitHub | Repo + Actions CI | Unlimited public-repo minutes | In use |

## What we deliberately skip ($0 rule)

| Service | Why skipped |
|---|---|
| AWS (6-month free tier) | Requires account signup with a card. Everything it would add (S3, EC2, Lambda) is already covered free by R2, Workers, and D1. Not needed. |
| Oracle Always Free VM | No use case yet; compute is covered by Workers. |
| Codecov | Signup endpoint returns HTTP 400 (upstream bug). Coverage evidence comes from the test suites themselves. |
| UptimeRobot | Browser blocked by tunnel errors. Free, no card needed — addable later. |
| Brevo | Needs interactive login + API key. Not needed for 0.1.0 (no transactional email in a dev preview). |
| Firebase / Make / Zapier | Accounts exist; unused by the preview. |

## The card rule

Cloudflare holds a card **only as billing authorization** for R2 usage
above the free tier. Inside the limits it is never charged (Cloudflare may
place a temporary preauthorization hold — that is not a charge). This is the
same pattern as every free tier: the card is a guarantee, not a purchase.

**How staying free works in practice:**

- R2: keep blobs under 10 GB, writes under 1M/mo, reads under 10M/mo → $0.
- Workers: sync traffic is dozens of requests a day → far under 100k/day → $0.
- D1: sync reads/writes are thousands a day → far under limits → $0.
- If a limit were ever approached, the honest fix is to reduce usage or
  move the workload — never to silently exceed it.

## Free-services catalogue

KeePass holds a per-category catalogue (`Aetherius/Free Services/*`):
Cloud, Storage, AI, Development, Communication, Automation, Creative,
Infrastructure, Other. Each entry records the free tier terms and whether it
is live, has an account, or is only a candidate. Nothing claims an account
exists unless one does.

## Rule for adding new services

1. It must be free without a card, or the card must be billing-auth only.
2. Staying inside the free tier must cost $0 (written down before signup).
3. Record it in KeePass **the same day** (free tier, status, URL).
4. If it ever needs more than the free tier, that decision is the owner's.
