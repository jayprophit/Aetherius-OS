# Free-first cloud and network infrastructure

**Status:** proposed mapping and setup order. No cloud resource has been created
or changed. Free-tier limits are marked `UNVERIFIED` until the official provider
page is checked and the date is recorded.

**Cost policy:** default **£0**. No automatic upgrade, no card on file, no
trial-only credit as core infrastructure. A paid tier needs a written owner
approval naming the service, cap and kill switch.

## 1. What "free" realistically means

Some items have no permanent free option:

- A custom domain is not free. Registrar and renewal fees apply.
- SMS is not permanently free at usable volume; trial credits are `TRIAL_ONLY`.
- Apple push and Sign in with Apple need the paid Apple Developer Program.
- A production-grade email reputation service has a free allowance, but it can
  change and may require a card.
- Oracle Always Free capacity depends on region and availability.

The honest zero-cost starting point is a free subdomain plus free-tier services,
with a paid domain deferred until the product needs one.

## 2. Capability map

| Item | Free option for now | Account/key needed | Status | Notes |
|---|---|---|---|---|
| Domain | `*.pages.dev`, `*.vercel.app`, `*.github.io`, or a free DuckDNS subdomain | Cloudflare/Vercel/GitHub account | Free subdomain available | A real custom domain costs money. Buy one only when needed. |
| TLS | Let's Encrypt via Caddy/Traefik; Cloudflare Universal SSL | None for ACME; Cloudflare account for Universal SSL | Free | Automate renewal and monitor expiry. |
| Cloud account | Cloudflare (edge/control plane), Supabase (Postgres/Auth), Oracle Always Free (VM), Firebase Spark, GitHub | Existing accounts | Owner-confirmed; resources unverified | Use Cloudflare first. |
| Compute | Cloudflare Workers; Oracle Always Free ARM VM; GitHub Actions | Cloudflare; Oracle; GitHub | Free tiers, capacity varies | Workers for the control plane; Oracle VM for persistent workers if capacity exists. |
| Database | Supabase Postgres; Cloudflare D1; Neon; local PostgreSQL | Supabase/Cloudflare/Neon accounts | Free tiers, verify current limits | Local Postgres is already in the self-host stack. |
| Object storage | Cloudflare R2; local SeaweedFS | Cloudflare account | 10 GB-month free tier commonly quoted; verify | R2 has no egress fee; local SeaweedFS is the offline mirror. |
| Cache/queue | Local Valkey; Cloudflare KV; Cloudflare Queues; Upstash Redis/QStash | Cloudflare/Upstash accounts | Free tiers, verify | Local Valkey is already in the stack. |
| CDN/WAF | Cloudflare Free plan | Cloudflare account | Free | Enable DNSSEC, CAA, bot fight mode and WAF managed rules. |
| CI/CD | GitHub Actions | GitHub account | Free minutes for public repos; limited private minutes | Keep builds reproducible and signed where required. |
| Email | Cloudflare Email Routing (inbound); Resend or Brevo free tier (outbound) | Cloudflare + Resend/Brevo | Free allowances, verify | Configure SPF, DKIM and DMARC. |
| SMS | None permanent | Twilio trial is `TRIAL_ONLY` | Deferred | Use email 2FA and passkeys first. |
| Push | FCM (Android/web); Web Push VAPID | Firebase project | Free | APNs/iOS needs the paid Apple Developer Program; defer. |
| Monitoring | Uptime Kuma local; Grafana/Prometheus local; Sentry free developer tier | None locally; Sentry account optional | Free | Start local, add Sentry only if needed. |
| Analytics | Umami or Plausible self-hosted; Cloudflare Web Analytics | None locally; Cloudflare account | Free | No silent tracking; document what is collected. |
| Status page | Uptime Kuma status page; static GitHub Pages page | None | Free | Publish only after incident-comms wording exists. |
| Backups | Cloudflare R2; local external drive; Backblaze B2 free allowance | Cloudflare/Backblaze account | Free allowances, verify | Encrypt before upload. Test restore. |
| DNS security | Cloudflare DNSSEC, CAA, registrar lock | Cloudflare/registrar | Free | Enable before public launch. |
| Network lab | Existing router, VLANs, WSL, QEMU, Docker networks | Local hardware | Available | No cloud cost. |
| IP/ASN | Not required for app hosting | None | Deferred | Only if Aetherius runs its own network. |

## 3. Proposed first stack

### Local (already in `deploy/selfhost`)

- PostgreSQL, Valkey, SeaweedFS, Forgejo, Ollama, Qdrant, Keycloak, Nextcloud,
  SearXNG, Uptime Kuma.
- This is the offline-capable core. It must work with the internet disconnected.

### Cloud free tier

1. **Cloudflare**
   - Worker `aetherius-cloud-control`: small API gateway and provisioning
     control plane.
   - R2 bucket `aetherius-objects`: object storage and backups.
   - D1 database `aetherius-cloud`: metadata, job records and sync checkpoints.
   - KV namespace `aetherius-cache`: short-lived state.
   - Queues `aetherius-jobs` if the free allowance is sufficient.
2. **Supabase**
   - Project `aetherius-cloud`: Postgres for accounts and sync metadata, Auth
     for email/OAuth.
   - Free projects can pause after low activity; the local database remains the
     source of truth.
3. **Oracle Cloud Always Free**
   - ARM VM `aetherius-worker-1`: persistent workers, MCP servers and scheduled
     jobs, only if capacity is available in the region.
   - Keep the worker stateless where possible; store state in Postgres/R2/D1.
4. **Firebase**
   - Project `aetherius-cloud`: FCM push and, later, web auth if Supabase Auth
     is not enough.
   - Do not use Firebase as the primary database.
5. **GitHub**
   - Source, issues and Actions. Public repositories get free CI minutes.
6. **KeePass**
   - Credential vault. A dedicated `Aetherius/Cloud` group holds provider
     credentials as references, never plaintext in the repository.

## 4. What must be verified before the registry records a limit

For each provider, check the official page and record:

- the exact free-tier limits and reset window,
- whether a card is required,
- whether commercial use is allowed,
- whether inactivity pauses or deletes resources,
- the current Terms of Service and automation policy,
- the date checked and the source URL.

Do not copy a limit from an old conversation into the registry. A limit that
has not been checked is `UNVERIFIED`.

## 5. Human gates

- Sign-in, MFA and CAPTCHA for Cloudflare, Supabase, Oracle, Firebase and
  GitHub.
- Legal acceptance of each provider's terms.
- Payment-card entry, even for a free tier that asks for a card.
- Domain purchase and DNS delegation.
- Oracle capacity selection and region choice.
- Any paid plan, trial conversion or overage approval.
- KeePass master-password entry.

## 6. First actions

1. Sign in to Cloudflare in the in-app browser.
2. Read-only inventory: billing plan, existing Workers/Pages, R2 and D1.
3. Confirm the free resource set before creating anything.
4. Create the Cloudflare control plane, R2 bucket and D1 database.
5. Verify each with a real request and record the evidence.
6. Repeat for Supabase, Oracle and Firebase, one provider at a time.
7. Do not create duplicate accounts to evade quotas.
