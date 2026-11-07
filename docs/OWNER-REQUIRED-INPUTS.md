# Owner-Required Inputs — Public Release Checklist

**Date:** 2026-11-04
**Purpose:** Everything only the owner can supply, decide, authorise, or legally sign before Aetherius OS can be called publicly released.
**Rule:** Nothing here is a claim that the build is complete. Each item states why it is needed and what it unblocks.

## Current automation status

Already done without owner input:

- CycloneDX SBOM at `release/evidence/sbom.cdx.json` (161 components, including the Python kernel dependency tree).
- Generated `THIRD_PARTY_NOTICES.md` (0 unknown licences).
- Fail-closed release gate at `scripts/release-gate.mjs`.
- Approved `0.1.0` self-hosted web/PWA scope at `release/release-scope.json`,
  recorded in `release/OWNER-APPROVAL-2026-11-03.md`.
- Hybrid licence map at `LICENSING.md`, with the root `LICENSE` and
  `LICENSES/` texts.
- Kernel package and self-host template are tested; ternary/quantum remain
  simulation-only by design.
- Web/PWA installability and launch evidence at `docs/evidence/install-matrix.json`
  and `release/evidence/pwa-report.json`.
- Measured web/PWA loopback performance at `docs/evidence/performance.json`
  (p95 8.093 ms over 1,600 requests).
- Exercised web-bundle rollback at `docs/evidence/rollback.json` and
  `release/evidence/rollback-report.json`.

Still owner-gated: legal entity, security contact, privacy policy, signing
identities, independent audits, device matrix, and cloud/domain/backup decisions.
The release gate currently reports `NOT_RELEASABLE` with 7 blockers.

---

## 0. How to supply secrets safely

- Never paste live keys into chat, source files, docs, commits, issues, screenshots, or the Codex/ChatGPT corpus.
- Put them in a secret manager (1Password, Bitwarden, Azure Key Vault, AWS Secrets Manager) or a local `.env.local` that is git-ignored.
- Supply **sandbox/test credentials first**. Production credentials only after the test gates pass.
- Use least-privilege, short-lived tokens where the provider supports them.
- Rotate any credential that has ever appeared in a transcript, log, or repository.

### URGENT — rotate existing exposed credentials

The existing audit records state:

- `TODO-SEC-001`: **12 live-looking OpenRouter keys** found in the conversation corpus.
- `TODO-SEC-002` / `TODO-TRADING-BOT-002`: **6 compromised credentials** to rotate before any deployment.

**Owner action:** revoke and reissue those keys now. Do not reuse them in this build. I can scan and redact the corpus, but only the owner can revoke provider-side keys.

---

## 1. P0 — Hard blockers for any public release

| # | Required from owner | Why | Unblocks |
|---|---|---|---|
| 1 | **Release scope decision**: exact product, version, supported OS/arch matrix, what is in/out | **DONE 2026-11-03** — `0.1.0` self-hosted web/PWA preview approved; broader 1.0 remains planned | Versioning, installers, test matrix, release notes |
| 2 | **Legal entity** name, registered address, contracting entity, VAT/tax ID | Needed for EULA, privacy policy, store accounts, invoices, DMCA/security contact | Store submissions, contracts, compliance |
| 3 | **Trademark clearance** for “Aetherius” and app names in target markets | Name may conflict with existing marks; I cannot give legal clearance | Branding, store listing, domain |
| 4 | **EULA, Terms of Service, Privacy Policy, Cookie Policy, DPA** (lawyer-reviewed) | Stores and GDPR/UK-GDPR require them; regulated finance adds more | Windows/macOS/Android/iOS stores, web launch |
| 5 | **Open-source licence audit sign-off** and third-party notices | Hybrid licence map selected; counsel review and any contribution-agreement setup still required | SBOM, source release obligations, store review |
| 6 | **Codec/format patent licence decision** (H.264/HEVC/AAC, fonts, Office/PDF compatibility) | Shipping codecs may require royalties or licensed components | Media apps, document apps, store compliance |
| 7 | **Export-control classification** (UK/EU/US) for cryptography and AI | Apps with encryption/AI may trigger notifications or restrictions | Store export questions, distribution |
| 8 | **Independent security penetration test** + remediation acceptance | Self-tests are not a security audit; current audit rules are empty | Public release gate |
| 9 | **Accessibility audit** (WCAG 2.2 AA) by a qualified auditor + assistive-tech testing | Current accessibility fixtures are all `verified=false` | Public-sector/enterprise sales, store accessibility claims |
| 10 | **DPIA / records of processing / retention schedule** + ICO registration if applicable | Processing accounts, files, telemetry, finance data | GDPR/UK-GDPR compliance |
| 11 | **Incident response plan**, security contact, `security.txt`, vulnerability disclosure policy | Required for credible public release | Security gate, enterprise review |
| 12 | **Backup/restore and disaster-recovery exercise sign-off** | The web bundle rollback drill passes, but server-side backup/restore and disaster recovery are untested | Reliability gate |

The web/PWA install, launch, rollback, and loopback performance evidence is now
produced without owner input. The remaining device matrix applies to native
Windows/macOS/Linux/Android/iOS artifacts in `0.2.0` and `1.0`, not to the
approved `0.1.0` web/PWA preview.

---

## 2. P0 — Signing identities and distribution accounts

No public installer can be produced without these. Unsigned builds are development artifacts only.

| Platform | Owner must supply | Notes / indicative cost |
|---|---|---|
| **Windows** | Authenticode code-signing certificate (OV or EV), or Azure Trusted Signing account; timestamp service | OV/EV cert typically ~£200–£600/yr; Azure Trusted Signing ~$10/month; EV may require hardware token/HSM |
| **Microsoft Store** | Developer account (individual ~$19, company ~$99) | Optional if distributing MSIX directly |
| **macOS** | Apple Developer Program membership; Developer ID Application + Developer ID Installer certificates; notarisation credentials (Apple ID + app-specific password, or App Store Connect API key) | ~$99/yr |
| **iOS/iPadOS** | Apple Developer Program; App Store Connect app record; provisioning profiles; approved entitlements | ~$99/yr; some entitlements need Apple approval |
| **Android** | Google Play Console account; upload key + Play App Signing; privacy policy URL; Data safety form | ~$25 one-time |
| **ChromeOS / Chrome Web Store** | Chrome Web Store developer account; PWA listing; optional Android APK | ~$5 one-time |
| **Ubuntu/Debian** | GPG package-signing key; repository hosting; optionally Flathub account | Free accounts; signing key custody required |
| **Fedora/Linux** | RPM signing key; Copr/OSC/Flathub account; AppImage signing key | Free accounts; signing key custody required |
| **Snap Store** | Ubuntu One / Snapcraft account | Free |
| **Aetherius native** | Aetherius store signing key + update-channel key; HSM/KMS custody | Owner-generated; must not live in repo |
| **Containers** | Docker Hub / GHCR account and scoped token if publishing images | Free/paid tiers |
| **SDKs** | npm / PyPI / NuGet accounts if publishing libraries | Free; 2FA required |
| **Signing-key custody** | HSM, Azure Key Vault, AWS KMS, or hardware token; named key custodians | Cost varies; mandatory for serious release |

**Free-first plan (2026-11-04):** no signing identity is purchased. The `0.1.0` web/PWA preview uses free Sigstore/cosign or minisign. Linux packages use free GPG keys and free repository hosting (GitHub Pages, Cloudflare Pages or R2). Flathub, Copr, Snapcraft, GHCR, npm, PyPI and NuGet accounts are free. Android direct APK or F-Droid is the free path; Google Play is deferred. Windows uses a local self-signed certificate for development only, or a SignPath application for eligible open source; macOS/iOS public distribution is deferred because it needs the paid Apple Developer Program. Aetherius native keys are generated locally and kept out of the repository; HSM/KMS custody remains an owner gate for public release. Free signing does not make an unsigned installer publicly trusted and does not expand the `0.1.0` scope. See `docs/FREE-STACK-SIGNING-DISTRIBUTION.md`.

**Store metadata the owner must approve:** app name, subtitle, description, category, age rating, screenshots, promo video, support URL, privacy URL, demo account, export-compliance answers, content declarations.

---

## 3. P1 — Cloud and network infrastructure

| Item | What to supply | Why |
|---|---|---|
| Domain | Registered domain + DNS control (or delegate API token) | Store verification, email, TLS, API |
| TLS | ACME/Let’s Encrypt automation or paid certificate | HTTPS for API/web |
| Cloud account | AWS / Azure / GCP / Cloudflare / Hetzner / on-prem decision + billing | Hosting, storage, KMS, backups |
| Compute | VM/container plan, region, autoscaling policy | API, workers, build runners |
| Database | Managed PostgreSQL (or connection string) | Accounts, sync, finance ledgers |
| Object storage | S3/R2 bucket + IAM credentials | Files, photos, backups, artifacts |
| Cache/queue | Redis / managed queue | Sessions, jobs, rate limiting |
| CDN/WAF | Cloudflare or equivalent API token | Distribution, DDoS, bot protection |
| CI/CD | GitHub Actions secrets or equivalent runner | Signed builds, tests, releases |
| Email | SMTP/API provider (SES, Postmark, Resend) + SPF/DKIM/DMARC | Verification, password reset, notifications |
| SMS | Twilio/MessageBird account + sender ID | 2FA, alerts (optional) |
| Push | APNs `.p8` key + key ID + team ID; FCM service-account JSON | Mobile notifications |
| Monitoring | Sentry DSN / OpenTelemetry endpoint / uptime monitor | Crash reporting, SLOs |
| Analytics | Privacy-friendly analytics (Plausible self-host or hosted) | Product metrics without silent tracking |
| Status page | Hosted status page or endpoint | Public incident communication |
| Backups | Off-site bucket + retention + encryption key | Recovery gate |
| DNS security | DNSSEC, CAA records, registrar lock | Domain integrity |
| Network lab | Router/firewall, VLANs, packet capture, bandwidth throttling | Real network testing, offline/degraded matrix |
| IP/ASN (only if hosting network) | RIR membership, IP allocation, BGP peering, transit contracts | Only needed if Aetherius runs its own network, not for app hosting |

**Free-first plan (2026-11-04):** use a free `*.pages.dev`, `*.vercel.app` or `*.github.io` subdomain for now; TLS via Let's Encrypt or Cloudflare Universal SSL. Use Cloudflare Workers, R2, D1, KV and Queues, Supabase free Postgres/Auth, Oracle Always Free ARM (if capacity), Firebase Spark, GitHub Actions and GHCR for the first stack. Use Cloudflare Email Routing plus a Resend or Brevo free tier for email; Uptime Kuma, Prometheus/Grafana local and Sentry free for monitoring; Umami or Cloudflare Web Analytics; R2 plus an encrypted local backup; Cloudflare DNSSEC and CAA. Defer a custom domain purchase, SMS, APNs, paid plans and IP/ASN. See `docs/FREE-STACK-CLOUD-NETWORK.md`.

---

## 4. P1 — Identity, accounts, and collaboration

| Item | What to supply | Why |
|---|---|---|
| OAuth providers | Google, Microsoft, Apple client IDs/secrets + redirect URIs | Sign-in, mail, calendar, drive |
| Passkeys/WebAuthn | Relying-party ID and origin configuration | Passwordless auth |
| SSO/SAML | Enterprise IdP test tenant (Okta/Entra) | Business/enterprise tier |
| Email sync | Gmail API / Microsoft Graph app registration, or IMAP/SMTP test accounts | Mail app |
| Calendar/contacts | Google Calendar/People API, Microsoft Graph scopes | Calendar/contacts apps |
| File sync | WebDAV/Nextcloud test server or S3-compatible store | Files/sync |
| Real-time messaging | Matrix homeserver or XMPP server + TURN/STUN | Messages/Meet |
| Video calls | LiveKit/Daily/Twilio credentials or self-hosted TURN | Meet |
| Collaboration backend | WebSocket/CRDT service host + persistence | Docs/Sheets/Slides multi-user |
| Search | Brave Search API key, Bing CSE, or self-hosted SearXNG | Browser/search |
| Maps | Mapbox/Google Maps key, or self-hosted OSM tile server | Maps |
| Weather | OpenWeather/Open-Meteo/Met Norway key | Weather |
| Translation | DeepL/Google Translate key, or local model | Language app |
| Speech | Whisper/local model or cloud speech key | Recorder, accessibility |
| OCR/vision | Tesseract (local) or cloud vision key | Scanner, photos, docs |
| Fonts | Licensed font files + web-font licence | Design/office apps |
| Stock assets | Licensed images/icons/music/sample files | Store screenshots, templates |

**Free-first plan (2026-11-04):** use the self-hosted Keycloak, Nextcloud, SeaweedFS, SearXNG, Matrix/LiveKit and Yjs stack for identity, files, search, messaging, video and collaboration; use free Google and Microsoft developer apps for OAuth, mail and calendar; use Open-Meteo or Met Norway for weather, OpenStreetMap for maps, LibreTranslate or a local model for translation, whisper.cpp and Kokoro for speech, Tesseract for OCR, and open-licensed fonts and assets. Apple Sign In is deferred because it requires the paid Apple Developer Program. No paid tier is enabled by default. See `docs/FREE-STACK-IDENTITY-COLLABORATION.md`.

---

## 5. P1 — AI / Genesis providers

The provider catalogue is reportedly configured but cold because no owner key is present (`TODO-OCM-001`).

| Item | Minimum | Production-grade |
|---|---|---|
| LLM provider | One key: OpenAI, Anthropic, Google Gemini, OpenRouter, or local Ollama | Contracted provider with DPA, no-training terms, data residency, rate limits |
| Embeddings | Local model or provider key | Same contract review |
| Vector store | Local pgvector/Qdrant | Managed with backups |
| Budget controls | Hard monthly cap + per-user quota | Alerts, chargeback, kill switch |
| Model evaluation | Approved model list + eval fixtures | Signed eval report per release |
| Content safety | Provider moderation or local classifier | Policy + appeal process |
| Prompt/data governance | Statement on what user data is sent to which provider | Privacy policy + DPIA |
| Offline fallback | Local model or explicit `UNAVAILABLE` state | Documented degraded mode |

**Owner decision (recorded 2026-11-04):** hybrid, local-first with optional cloud fallback. Local Ollama is the default; free cloud inference is a fallback; paid providers are disabled unless explicitly authorised. The default monthly budget is **£0**. See `docs/FREE-STACK-IDENTITY-COLLABORATION.md`.

**Recorded AI provider decision (2026-11-04):** local Ollama is the primary path and must work offline. A hosted provider is eligible only if the owner has supplied a key, its free-tier terms have been checked and dated, the data classification allows it, and free quota remains. Paid and premium models are disabled by default; if every free provider is exhausted or unavailable, the task queues, pauses or fails transparently rather than calling a paid model. Embeddings and the vector store stay local. Sensitive tasks are forced local, and no owner data is used for provider training. See `docs/adr/ADR-004-AI-PROVIDERS-LOCAL-FIRST.md`.

---

## 6. P1 — Finance and trading (only if live)

The finance and trading apps are currently paper/internal. **I will not connect live money without written authorisation and compliance evidence.**

**Recorded decision (2026-11-04, `docs/adr/ADR-003-FINANCE-PAPER-FIRST.md`):** finance and trading are paper-first. Three modes are defined:

- **PAPER**: simulated or replayed data, simulated fills, no money.
- **DEMO**: play money, simulated fills, with licensed live or delayed market data where a licence exists; separate demo ledger.
- **LIVE**: real venue, real money, disabled by default and outside the `0.1.0` scope.

`0.1.0` ships PAPER and may ship the DEMO mode with simulated or replayed data. A licensed live-data demo feed and every live connection are owner-gated. Demo balances are never withdrawable, transferable or convertible.

The compliance evidence below is still required before any live mode is enabled.

| Item | Why |
|---|---|
| Regulatory status / licence | FCA authorisation, EMI/PI licence, or partnered regulated entity |
| Open Banking provider | TrueLayer/Plaid/GoCardless credentials + consent flow |
| Card issuing/processing | Stripe Issuing/Adyen/Marqeta sandbox then production |
| Brokerage/exchange APIs | Alpaca/IBKR/Binance/etc. keys + permissions (read-only first) |
| Market-data licences | Exchange data is licensed; redistribution may be prohibited |
| KYC/AML provider | Onfido/Persona/ComplyAdvantage + sanctions screening |
| Transaction monitoring | Rules, thresholds, SAR/STR process |
| Safeguarding | Client-money account and reconciliation if holding funds |
| PCI DSS | Scope/SAQ, ASV scan, pen test if card data touches systems |
| Crypto custody | MPC/HSM, key ceremony, travel-rule compliance if applicable |
| Accounting/tax | VAT/GST rules, invoice numbering, audit trail |
| Financial promotions | FCA approval for marketing claims |
| Written authorisation | Explicit owner sign-off naming accounts, limits, and kill-switch procedure |

**Safe default:** keep paper trading and internal ledger; no live bank, card, or exchange adapter. A demo account uses play money and simulated fills, and is always labelled as a demo.

---

## 7. P1 — Kernel, ternary, and quantum requirements

### What is realistic

| Layer | Reality | What owner must provide |
|---|---|---|
| **Binary kernel** | `native/kernel` is a real x86_64 C kernel scaffold: GDT, IDT, scheduler, syscall ABI, host test executable. It is **not** a bootable general-purpose OS. | Test hardware/VMs, UEFI Secure Boot keys, serial console, QEMU/VMware/Hyper-V, kernel-module signing key if distributing modules |
| **Ternary processing** | No mainstream commercial ternary CPU exists. Balanced-ternary arithmetic and emulation are real and testable; hardware ternary is research/FPGA. | If hardware ternary is required: FPGA board + toolchain (Xilinx/Intel), or research partner; otherwise approve simulation-only classification |
| **Quantum processing** | A state-vector simulator is real and testable. Real quantum execution requires provider access and is noisy/limited. | IBM Quantum / AWS Braket / Azure Quantum / IonQ account and budget; or approve simulator-only classification |
| **Kernel drivers** | Need real devices for storage, network, GPU, audio, USB, power management | Hardware list + spare machines, or a hardware lab partner |
| **Secure boot / TPM** | Required for credible OS security claims | Test keys, TPM 2.0 devices, firmware access |
| **Fuzzing / soak** | Required for kernel reliability claims | Build runners with time budget; crash-dump collection |

### Recorded kernel platform decisions (2026-11-04, ADR-002)

The owner's answers are recorded in `docs/adr/ADR-002-KERNEL-PLATFORM.md`:

| Question | Recorded decision |
|---|---|
| Target architecture(s) | x86_64 first, ARM64 second, RISC-V third. One source tree and per-architecture artifacts, not one universal binary. |
| Boot firmware | UEFI first, with BIOS and Multiboot2 also in scope. One kernel entry contract with thin firmware shims. |
| Filesystem(s) | AetherFS native read/write root; FAT32 for the ESP and exchange; ISO9660 for installer and recovery; ext4 through a user-space implementation (lwext4, subject to licence review). |
| Networking | lwIP-based hybrid behind an Aetherius socket, capability and audit layer. |
| Driver policy | In-tree core drivers plus signed, versioned, capability-scoped loadable modules. |
| Userland ABI | Native Aether ABI primary; documented Linux x86_64 syscall subset; WASM/WASI portable sandbox. |
| Virtualisation | VM-first for development and CI, with bare-metal validation on named hardware before any support claim. |
| Quantum/ternary | Simulation-only in v1, offline and local. Optional online QPU/FPGA backends are disabled by default and fail closed. |

"AI read/write access" to filesystems means mediated access through the VFS and capability system, with audited writes. It does not mean raw block-device access.

**Honest position:** binary kernel work is real but early. The `0.1.0` release does not include a bootable general-purpose kernel, ARM64 or RISC-V support, full Linux compatibility, or hardware ternary/quantum execution. Ternary and quantum are simulation/emulation unless the owner supplies hardware or cloud quantum access. I will not label simulated qubits as quantum hardware.

---

## 8. P1 — Hardware and test devices

For an honest cross-platform claim, these must be physically tested:

| Category | Minimum devices |
|---|---|
| Windows | x64 PC (Windows 11), ARM64 device or VM, clean install + rollback snapshot |
| macOS | Intel Mac and Apple Silicon Mac (or CI runners), clean user account |
| Linux | Ubuntu LTS, Fedora, Debian; x64 + ARM64 (Raspberry Pi) |
| ChromeOS | Chromebook with Linux container and Android app support |
| Android | Pixel or equivalent (current API), low-RAM device, tablet |
| iOS/iPadOS | Current iPhone + iPad, TestFlight setup |
| Browsers | Chrome, Edge, Firefox, Safari; desktop + mobile |
| Accessibility | NVDA/JAWS (Windows), VoiceOver (macOS/iOS), TalkBack (Android), Orca (Linux), switch control, 200%/400% zoom, high contrast |
| Peripherals | Printer/scanner, camera, microphone, MIDI keyboard, external GPU if claimed |
| Network | Router with VLANs, DNS control, packet capture, throttling, IPv6 |
| Power | UPS, sleep/hibernate/resume tests, battery devices |
| Watch/TV/XR | Only if those builds are in release scope |

**Owner action:** name the devices available, or approve a reduced supported-platform matrix. Untested platforms must be labelled `UNVERIFIED`, not `SUPPORTED`.

**Recorded device position (2026-11-04):** the owner has an iPad Pro and an Android phone available for later testing. The `0.1.0` supported matrix is reduced to the self-hosted web/PWA preview opened in a current Chromium-based desktop browser. Safari, Firefox, Edge, Android Chrome, iPadOS Safari and every native package remain `UNVERIFIED` until tested. See `docs/TEST-DEVICE-MATRIX.md`.

---

## 9. P1 — Audits, certifications, and professional services

| Service | Why | Indicative cost |
|---|---|---|
| Independent pen test | Security release gate | £5k–£30k+ |
| WCAG 2.2 AA audit | Accessibility claims | £3k–£15k+ |
| Legal review (EULA/privacy/IP) | Store and regulatory | £2k–£10k+ |
| Trademark search/filing | Brand clearance | £500–£3k+ per mark |
| Open-source licence counsel | Copyleft/patent risk | £2k–£10k+ |
| Export-control review | Encryption/AI distribution | £1k–£5k+ |
| Accounting/tax adviser | Finance app compliance | varies |
| Insurance (cyber/professional indemnity) | Enterprise procurement | varies |
| Accessibility user testing | Real disabled-user evidence | £2k–£10k+ |
| Localisation vendors | i18n/RTL quality | per locale |

**Free-first plan (2026-11-04):** run free pre-audits now and keep the public-release gate red until the paid or owner-supplied evidence exists. Use OWASP ASVS/self-assessment, Semgrep, CodeQL, Trivy/Grype, OSV-Scanner, `npm audit`, SBOM/notices and secret scans for security; axe-core, Lighthouse, Pa11y, NVDA, VoiceOver and TalkBack for accessibility; open policy templates and ICO/GDPR guidance for drafts; UK IPO/EUIPO/WIPO/USPTO searches for a preliminary trademark check; REUSE/ScanCode/ORT for licence review; and a documented self-assessment for export control. Independent audits, legal review, filings, insurance and formal classifications remain owner-gated. Lawful cost reduction is limited to public specifications, open-source components, purchased interoperability licences, clean-room reimplementation and the UK CDPA section 50B exception with legal review; it does not include bypassing DRM, licence checks, paywalls or provider terms. See `docs/FREE-STACK-AUDIT-READINESS.md`.

---

## 10. P2 — Content, brand, and support

- Final product name, logo, icon set, colour tokens, and trademark clearance.
- Marketing site copy, screenshots, demo video, release notes.
- Support channel (email/helpdesk), SLA, escalation contacts.
- Public documentation: install, quickstart, troubleshooting, known limitations, data flows.
- Privacy notice with a plain-English “what leaves your device” section. Draft: `docs/PRIVACY-NOTICE-DRAFT.md`; legal review and owner sign-off still required.
- Security.txt and disclosure policy. Drafts: `docs/VULNERABILITY-DISCLOSURE-POLICY.md` and `docs/security.txt.template`; publication is blocked until a monitored contact exists.
- Status page and incident-comms templates. Incident plan: `docs/INCIDENT-RESPONSE-PLAN.md`; status page still to be chosen.
- Pricing/licensing model: **recorded 2026-11-05** as open-core freemium with a free community tier, a £9.99/month Plus target, a per-seat Business tier, one-time options and a gated transaction fee. See `docs/adr/ADR-005-OPEN-CORE-FREEMIUM.md`.
- Refund policy and consumer-rights wording if selling in the UK/EU. Still required before any paid tier, together with VAT/tax treatment and payment terms.

**Recorded brand position (2026-11-04):** no final product name, logo or trademark clearance yet. `Aetherius` is a temporary working prefix and `Aetherius OS` is the working product name for the `0.1.0` developer preview. It is not a trademark claim and does not imply exclusive rights. Do not commission paid brand clearance, logo merchandise or store branding until a shortlist exists and a preliminary UK IPO/EUIPO/WIPO/USPTO search is recorded. Use open-licensed fonts and icons for now. Marketing copy, support channel, status page and refund policy remain drafts. The commercial direction is recorded in `docs/adr/ADR-005-OPEN-CORE-FREEMIUM.md`: a free open-core community edition with a freemium tier, a £9.99/month headline target and paid business modules. No paid tier is active in `0.1.0`.

**Free drafts produced (2026-11-04):** `docs/INCIDENT-RESPONSE-PLAN.md`, `docs/PRIVACY-NOTICE-DRAFT.md`, `docs/VULNERABILITY-DISCLOSURE-POLICY.md`, `docs/security.txt.template`, `docs/BACKUP-RESTORE-DRILL.md`, `docs/SELFHOST-STACK-STATUS.md` and `docs/CLOUD-RESOURCE-INVENTORY.md`. These are drafts and runbooks, not audits, approvals or evidence that a drill or deployment has happened. The public security contact, privacy sign-off and a real backup/restore drill remain owner-gated.

---

## 11. Owner-only decisions

**Status as of 2026-11-05.** Recorded items are decisions, not evidence that the
related release gate has passed. Owner-gated items still need the owner's
written input or a paid/legal process. These are not credentials, but the build
cannot be closed without them:

1. **Release scope (recorded 2026-11-03):** `0.1.0` is a free, self-hosted web/PWA developer preview. Broader `1.0` remains planned and is not claimed. See `release/release-scope.json` and `docs/RELEASE-SCOPE-RECOMMENDATION.md`.
2. **Supported OS/arch matrix (recorded 2026-11-04):** for `0.1.0`, a self-hosted web/PWA served over HTTPS and opened in a current Chromium-based desktop browser. Safari, Firefox, Edge, mobile browsers and native packages remain `UNVERIFIED`. See `docs/TEST-DEVICE-MATRIX.md`.
3. **AI posture (recorded 2026-11-04):** local-first hybrid. Ollama is primary and offline-capable; free-tier cloud fallback only with an owner key, checked terms, allowed data class and remaining quota; paid/premium models disabled with a £0 cap. See `docs/adr/ADR-004-AI-PROVIDERS-LOCAL-FIRST.md`.
4. **Telemetry (recorded default 2026-11-05):** none by default in `0.1.0`. Any future telemetry must be opt-in, disclosed, minimal, retention-limited and owner-approved. No advertising auction, behavioural tracking or data sale.
5. **Data residency (recorded default 2026-11-04):** local by default. Self-hosted data stays on the owner's machine; no cloud region is approved. Any free-tier cloud use must record the provider, region, transfer mechanism and data class before data is sent. A provider without acceptable terms is not eligible for personal data.
6. **Licence (recorded direction 2026-11-05):** open-core, freemium, using the existing multi-licence map in `LICENSING.md`: Apache-2.0 for the foundation paths, AGPL-3.0-or-later for the default OS/app layer, dual AGPL/commercial for the finance and trading cores, and proprietary terms for live finance, managed hosting and enterprise modules. The community core is free to download, use, modify and self-host. Final legal text, a CLA, trademark clearance and third-party notices remain owner/legal-gated. See `docs/adr/ADR-005-OPEN-CORE-FREEMIUM.md`.
7. **Pricing (recorded direction 2026-11-05):** a free community tier; a Plus subscription with a **£9.99/month headline target**; a per-seat Business tier; one-time module and lifetime options; and a small transaction fee only for lawful commerce or authorised live trading. No fee applies to paper trading. No billing is enabled in `0.1.0`. £9.99 is a target, not an activated price; regional pricing may be lower; a cost model, VAT/tax treatment, payment fees, refund policy and consumer terms are required first. See `docs/adr/ADR-005-OPEN-CORE-FREEMIUM.md`.
8. **Finance/trading (recorded 2026-11-04):** PAPER and DEMO only for v1; LIVE is disabled and requires written authorisation plus compliance evidence. Transaction fees for commerce or live trading also require a licensed provider, regulatory review and reconciled ledger. See `docs/adr/ADR-003-FINANCE-PAPER-FIRST.md`.
9. **Kernel (recorded 2026-11-04):** x86_64 first, then ARM64 and RISC-V; UEFI first with BIOS/Multiboot2; AetherFS, FAT32, ISO9660 and user-space ext4; lwIP hybrid; in-tree core drivers plus signed modules; native ABI with a Linux subset and WASM/WASI; VM-first plus bare-metal validation; simulation-only ternary/quantum. The long-term ambition is a production OS; `0.1.0` is not a bootable general-purpose OS. The remaining owner inputs are test hardware, signing keys and audits. See `docs/adr/ADR-002-KERNEL-PLATFORM.md`.
10. **Risk acceptance (recorded default 2026-11-05):** fail-closed. No `PARTIAL_EVIDENCE` item may ship as `PASS`. Any disclosed partial item needs a named owner sign-off, a visible limitation in the release notes and a mitigation or rollback. The default is no acceptance, and the release gate stays red until every blocker passes.
11. **Brand/trademark (recorded 2026-11-04):** `Aetherius` is a temporary working prefix and `Aetherius OS` is the working `0.1.0` name. No trademark clearance, logo or final brand exists. See section 10.
12. **Launch date, staffing and budget (owner-gated):** not set. The operating budget for now is **£0** with free tiers only. Paid cloud, legal, audits, insurance and staffing require explicit owner approval. No launch date is claimed.

---

## 12. What I can do without owner inputs

- Write and test code, including binary/ternary arithmetic and quantum state-vector simulation.
- Build unsigned development artifacts and reproducible build scripts.
- Generate SBOMs, run dependency/secret scans, and write security rules.
- Build local-only APIs with auth/TLS test harnesses.
- Generate structural and large synthetic fixtures.
- Implement open-format import/export and clean-room compatible behaviour from public specs.
- Create installer **scripts** and signing **hooks** that fail closed when certificates are absent.
- Run measured web/PWA loopback performance and rollback drills, plus simulated soak and failure-injection tests for native paths.
- Produce honest gap reports and evidence manifests.

## 13. What I will not do

- Bypass DRM, licence checks, paywalls, or paid-tier enforcement.
- Forge code signatures, notarisation, store approvals, or audit certificates.
- Claim simulated ternary/qubits are physical hardware.
- Claim a platform is supported without a real install/launch/rollback test.
- Connect live bank, card, or exchange accounts without written authorisation and compliance evidence.
- Call the product “100% complete” when gates are open.

**Lawful alternative for competitor features:** public specifications, open formats, open-source implementations, purchased licences for interoperability testing, clean-room reimplementation, and the limited UK CDPA s.50B interoperability exception with legal review. Feature ideas are not copied code.

---

## 14. Minimum path to first public release

If the goal is the fastest *honest* release, supply these first:

1. Release scope + supported platform matrix.
2. Legal entity + lawyer-reviewed EULA/privacy policy.
3. Windows Authenticode certificate (or Azure Trusted Signing) and Apple Developer membership.
4. One cloud account + domain + TLS + Postgres + object storage.
5. One AI provider key (or approve local-only Ollama).
6. Test devices for Windows, macOS, Ubuntu, Android, iOS.
7. Pen-test and accessibility-audit bookings.
8. Rotation of the exposed provider credentials: two distinct OpenRouter keys found across four files, plus the other compromised credentials tracked by `TODO-SEC-002` and `TODO-TRADING-BOT-002`.
9. Paper-first finance decision: recorded 2026-11-04 in `docs/adr/ADR-003-FINANCE-PAPER-FIRST.md`. The remaining live input is a written authorisation naming the venue, accounts, instruments, limits and kill-switch procedure, plus the compliance evidence in section 6.
10. Kernel platform decision: recorded 2026-11-04 in `docs/adr/ADR-002-KERNEL-PLATFORM.md`. The remaining inputs are test hardware, signing keys and audits; the `0.1.0` kernel scope is unchanged.

Everything else can follow in staged releases.

---

## 15. Suggested secret names (values never committed)

```text
# Platform signing
WINDOWS_SIGNING_CERT_PATH
WINDOWS_SIGNING_CERT_PASSWORD
WINDOWS_TIMESTAMP_URL
APPLE_TEAM_ID
APPLE_DEVELOPER_ID_APPLICATION
APPLE_DEVELOPER_ID_INSTALLER
APPLE_NOTARY_APPLE_ID
APPLE_NOTARY_APP_PASSWORD
APPLE_NOTARY_API_KEY_PATH
APPLE_NOTARY_API_KEY_ID
APPLE_NOTARY_API_ISSUER
ANDROID_KEYSTORE_PATH
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
LINUX_GPG_KEY_ID
LINUX_GPG_PASSPHRASE

# Cloud / data
DATABASE_URL
S3_ENDPOINT
S3_BUCKET
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
REDIS_URL
CLOUDFLARE_API_TOKEN
SENTRY_DSN
SMTP_URL
PUSH_APNS_KEY_ID
PUSH_APNS_TEAM_ID
PUSH_APNS_KEY_PATH
PUSH_FCM_SERVICE_ACCOUNT_PATH

# Identity
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
APPLE_CLIENT_ID
APPLE_CLIENT_SECRET

# AI
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
OPENROUTER_API_KEY
OLLAMA_BASE_URL

# Feature providers
MAPBOX_TOKEN
OPENWEATHER_API_KEY
BRAVE_SEARCH_API_KEY
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
BROKER_API_KEY
BROKER_API_SECRET
KYC_API_KEY

# Quantum (only if real hardware execution is approved)
IBM_QUANTUM_TOKEN
AWS_BRAKET_ACCESS_KEY
AWS_BRAKET_SECRET_KEY
AZURE_QUANTUM_SUBSCRIPTION_ID
```

**Never commit `.env.local`, certificates, keystores, or private keys.** The release pipeline must fail closed if a required signing identity is missing.
