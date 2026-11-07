# ADR-005: Open-core community edition with a freemium business model

**Status:** accepted as commercial direction on 2026-11-05. Final licence
text, consumer terms, tax treatment and payment integration remain owner- and
lawyer-gated.
**Amended:** 2026-11-07 (pricing pause; token-free proof prioritised).
**Owner:** Jonathan (Aetherius project)
**Related:** `docs/OWNER-REQUIRED-INPUTS.md`, `docs/RELEASE-SCOPE-RECOMMENDATION.md`,
`docs/adr/ADR-003-FINANCE-PAPER-FIRST.md`, `docs/adr/ADR-004-AI-PROVIDERS-LOCAL-FIRST.md`

## Context

The owner wants the product to be downloadable from a repository and usable
for free, with a freemium model on top. Paid access is for services that help
users make money — trading, commerce and similar business workflows — plus
subscriptions and one-time purchases. The target headline subscription is
around **£9.99** so that it is affordable across markets. A small transaction
fee is also a long-term option, as it is for many mass-adopted businesses.

The `0.1.0` release is still a free, self-hosted web/PWA developer preview. No
billing, paid tier, live money or transaction fee is enabled in it. This ADR
records the destination so the code and documents do not drift into a
proprietary-only or ad-funded model by accident.

## Decision

### 1. Open-core, not a single licence for everything

- The **community core** is publicly downloadable, free to use and
  self-hostable. It includes the personal-productivity apps, local-first
  assistant, paper finance and paper trading, data export and the self-host
  stack.
- **Premium business modules** are separately licensed and may be closed
  source. They cover the workflows that make money for the user: commerce
  operations, live trading when authorised, advanced automation, multi-user
  administration, managed cloud, priority support and regulated integrations.
- The boundary is a **separate module and service boundary**, not a hidden
  switch inside the free code. A user must be able to see what is free and
  what is paid before installing it.

**Existing licence structure:** `LICENSING.md` already records the owner-selected
multi-licence model. It is open-core, not a single licence:

| Path | Licence |
|---|---|
| `apps/app-kit/`, `kernel/compute/`, `native/kernel/` | Apache-2.0 |
| Default OS, application layer, self-host stack and documentation | AGPL-3.0-or-later |
| `apps/sovereign-financial-os/`, `apps/Multi-Cross-Platform-Trading-Bot/` | AGPL-3.0-or-later or a commercial licence |
| Live finance, managed hosting, enterprise administration and future `commercial/` or `enterprise/` paths | Proprietary commercial terms |

This ADR does not change those grants. It records the **commercial tiering** on
top of them. Final licence text, contribution terms (a CLA or equivalent
relicensing grant is required before outside contributions), trademark
clearance and third-party notices remain legal-gated. A public deployment of
AGPL code must offer the corresponding source, as the licence requires.

### 2. Free community tier

The free tier must be genuinely useful, not a demo that expires. It includes:

- Files, Notes, Calendar, Photos and the document editors within their
  documented format subset.
- Local-first Athena assistant with the owner's own local model or key.
- Sovereign Finance internal ledger and **paper** accounting.
- Trading Bot **paper trading and backtesting only**.
- Self-hosted deployment, local backup and restore, and full data export.
- Security, accessibility, privacy and data-portability features.
- Community support and public documentation.

No core safety, security, accessibility, privacy or export feature may be
paywalled. A user must always be able to get their data out and run the
community core without a paid account.

The community build must compile and run from the public repository without any
closed module, entitlement server or network call. Paid modules are optional and
load separately. A free user must not be forced to create a billing account to
use the community edition.

### 3. Paid tiers

Prices below are **targets**, not activated prices. No price is final until
the cost model, tax treatment, payment fees and consumer terms are approved.

| Tier | Target price | Intended value |
|---|---|---|
| Community | Free | Core local/self-hosted productivity, paper finance, paper trading, BYO AI |
| Plus | **£9.99/month** headline target; annual option to be modelled | Managed sync and backup, a fair-use AI allowance, premium templates, remove operational limits, priority updates |
| Business | Per-seat, to be modelled | Multi-user administration, commerce workflows, advanced audit/export, SSO/SCIM, support |
| One-time purchase | Per module or lifetime option, to be modelled | A specific premium module, a lifetime community licence, or a packaged offline/business bundle |
| Transaction fee | Small percentage, only where lawful | Commerce and live-trading flows, taken through a licensed payment provider, never on paper trading |

The £9.99 target is a **ceiling for the headline consumer subscription**, not
a floor. Regional pricing may be lower where purchasing power is lower. Any
price increase, new mandatory fee or removal of a free feature needs explicit
owner approval and a notice period.

### 4. What the subscription must cover

At £9.99 the unit economics must work. Before activation, the owner needs a
model covering:

- payment processing and chargeback costs,
- VAT/GST and invoicing,
- app-store commission if sold through a store (15–30%),
- cloud storage, compute, bandwidth and backups,
- AI inference and embeddings at the fair-use allowance,
- support time and incident response,
- refunds, currency conversion and regional pricing,
- a reserve for unpaid usage and abuse.

If £9.99 cannot cover the included usage, the answer is a smaller allowance,
a metered add-on or a higher business tier — not a hidden fee or a degraded
free tier.

For UK/EU consumers, the displayed price must be VAT-inclusive. The unit
economics must be calculated on the net-of-VAT amount, after payment and
store commission. A £9.99 headline price is therefore not £9.99 of revenue.

### 5. Transaction fees and regulated money

- No transaction fee is enabled in `0.1.0`.
- Paper trading and backtesting carry no fee.
- A live-trading or commerce transaction fee requires a licensed payment
  provider, clear customer terms, tax treatment, refund rules and the
  compliance evidence in `ADR-003`.
- The project does not hold customer funds, provide custody or execute live
  trades without the authorisation and licences that apply.
- A fee must be disclosed before the transaction, shown in the ledger and
  reversible under the refund policy.
- Do not describe a planned fee as revenue that already exists.

### 6. Entitlements and offline use

- Paid entitlements are enforced server-side where a service is hosted.
- A self-hosted or offline paid module uses a signed licence with a published
  grace period.
- On expiry, the application enters a read-only or limited mode. It does not
  delete, encrypt or hold data hostage.
- Export and backup remain available after a paid plan ends.
- Entitlement checks must not become a surveillance channel. Record only what
  billing and fraud prevention require.
- No DRM bypass, licence-check bypass or paywall circumvention is part of this
  model. Enforcement must be honest and testable.

### 7. Privacy and advertising

- No advertising auction, behavioural tracking or data sale in the free tier.
- Telemetry is **none by default** for `0.1.0`. Any future product telemetry
  must be opt-in, disclosed, minimal, retention-limited and approved by the
  owner.
- Billing records are handled under the privacy notice and the tax retention
  rules, not mixed with product analytics.
- A free user is not the product.

### 8. Brand and marketplace

`Aetherius` remains a temporary working prefix. A paid tier must not be
launched under a name that has not had a preliminary trademark search and a
legal clearance decision. Store listings, pricing pages and refund terms need
owner approval.

## Staged gates

| Stage | Scope | Gate |
|---|---|---|
| C0 — now | Free `0.1.0` preview | No billing code, no paid gate, no live money; free licence and notices present |
| C1 — paid beta | Plus/Business entitlements, test payments only | Cost model, payment provider test mode, entitlement tests, refund and tax drafts, owner approval |
| C2 — public paid launch | Real subscriptions and one-time purchases | Lawyer-reviewed terms and privacy, VAT/tax setup, live payment account, support process, measured unit economics |
| C3 — transaction fees | Commerce and authorised live-trading fees | Licensed provider, regulatory review, reconciled ledger, dispute/refund process, written owner authorisation |

`0.1.0` ships only C0. A paid feature that is visible but disabled must say
`NOT_AVAILABLE`; it must not imply that a working paid service exists.

## Explicit non-goals

- No paid tier in the `0.1.0` release.
- No live trading, custody, payment facilitation or transaction fee now.
- No advertising or data sale.
- No paywalling of security, accessibility, privacy or data export.
- No claim that £9.99 is profitable before a cost model exists.
- No claim that a trademark, company, payment account or tax registration exists
  before it does.
- No licence change without owner and legal review.

## Consequences

**Good:**

- The free core drives adoption and trust.
- Paid business workflows align the price with the value the user receives.
- A low headline price is affordable across markets.
- Open-core keeps the community able to audit, fork and self-host.
- AGPL protects the hosted core from silent proprietary forks, while Apache-2.0
  foundations and the commercial option serve different adopters.

**Bad, and accepted:**

- AGPL obligations deter some commercial adopters; the commercial licence is
  the answer, not a hidden exception.
- Premium modules add a build, licensing and support boundary.
- £9.99 with heavy AI or storage use can lose money without fair-use limits.
- Transaction fees add regulatory, payment and reconciliation work.
- The mixed licence map needs clear notices, a CLA and a third-party licence
  audit before outside contributions or paid distribution.

## Implementation and verification

Before any paid code is enabled:

1. Confirm the existing multi-licence map in `LICENSING.md`; generate a
   third-party notices file and an SBOM that match the actual distribution.
   Put a CLA or equivalent relicensing grant in place before accepting outside
   code contributions.
2. Publish a free-versus-paid feature matrix with no hidden gates.
3. Implement entitlements behind a testable interface with a read-only expiry
   state and an export path.
4. Test a free user, an expired user, an offline user and a paid user.
5. Test that a paid API is refused without an entitlement and that no core
   safety or export feature is refused.
6. Run the cost model against low, target and heavy usage.
7. Record the owner's written approval before a real price or payment account
   goes live.

## Amendment 2026-11-07: pricing paused, token-free proof first

The original decision above stands as the destination, but the order of work
changed on 2026-11-07:

- **The £9.99/month target is paused.** No billing, paid plan, payment method
  or live-money code is in scope until the system is proven to work for free.
  The tables in §3 are targets, not an implementation plan for `0.1.0`.
- **Token-free AI is the priority.** The default AI path is local Ollama
  (no per-token cost). Remote providers (Gemini, Groq) are optional and use
  only a runtime-supplied session credential; the Vite build carries none.
  "Token-free" means no paid API tokens — it does not mean zero electricity
  or compute cost, and must never be described that way.
- **Free cloud is the production path.** Cloudflare (Worker + D1) powers
  local/cloud sync; Supabase remains the preview backend. R2 is excluded
  because it requires a payment method.
- **Nothing here changes licences.** All commercial-gated items (CLA,
  trademark, consumer terms, tax, payment accounts) stay owner- and
  lawyer-gated. This amendment is sequencing, not a licence change.
