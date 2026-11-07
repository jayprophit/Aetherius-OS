# Release Scope Recommendation — v1

**Status:** approved on 2026-11-03. The active scope in
`release/release-scope.json` is `APPROVED` for `0.1.0` as a free-first,
self-hosted web/PWA developer preview. The recommendation below was adopted;
the release gate still stays red until the remaining evidence exists.

## Recommendation

Ship **`0.1.0` as a free-first, self-hosted foundation developer preview**, not a
consumer 1.0. The current codebase has tested domain cores, a tested compute
kernel, and a valid self-host template, but no production UI, no signed
installers, no independent audits, and no live financial adapters.

A narrow, honest preview is better than a broad release that fails its own gate.

**Decision records (2026-11-04):** `docs/adr/ADR-002-KERNEL-PLATFORM.md` records the target kernel platform: x86_64 first, then ARM64 and RISC-V; UEFI first with BIOS/Multiboot2; AetherFS, FAT32, ISO9660 and user-space ext4; an lwIP hybrid; in-tree core drivers plus signed modules; a native ABI with a Linux subset and WASM/WASI; VM-first plus bare-metal validation; and simulation-only ternary/quantum. `docs/adr/ADR-003-FINANCE-PAPER-FIRST.md` records the PAPER/DEMO/LIVE finance model. Neither record expands the `0.1.0` scope below: there is still no bootable general-purpose kernel and no live money.

**Commercial model (2026-11-05):** `docs/adr/ADR-005-OPEN-CORE-FREEMIUM.md` records an open-core, freemium direction. The community edition is free to download and self-host. Premium business modules, managed services and support are paid. The headline Plus subscription target is **£9.99/month**, with a per-seat Business tier, one-time module/lifetime options and a possible small transaction fee for lawful commerce or authorised live trading. None of that is active in `0.1.0`: the preview remains free, with no billing, no paid gate and no transaction fee.

### Platforms in the first scope

**Active `0.1.0` scope (recorded 2026-11-04):** self-hosted web/PWA only. The
Linux Flatpak and DEB rows below are later-stage recommendations, not `0.1.0`
commitments. See `docs/TEST-DEVICE-MATRIX.md`.

| Platform | How it is delivered | Signing | Cost |
|---|---|---|---|
| Self-hosted web/PWA | Release bundle served over HTTPS from your domain | Sigstore/cosign or minisign detached signature | Free |
| Linux x86_64 Flatpak (later) | Flathub | Flathub repository signing | Free |
| Linux x86_64 DEB (later) | Self-hosted apt repository | GPG-signed repository | Free |

### Explicitly out of the first scope

- Live banking, cards, brokerage, exchange, market data, KYC/AML, custody.
- Ternary hardware and FPGA claims.
- Quantum hardware and remote QPU claims.
- A bootable general-purpose Aetherius kernel.
- macOS notarisation, iOS, Microsoft Store, Google Play.
- Studio/Engineering/Built Environment/Science/IDE/Business workspaces beyond
  domain scaffolds.
- Full Office/PDF/media/CAD/BIM/MIDI fidelity and real-time collaboration.
- Any 5-star parity claim.

### What is actually in scope

- Foundation packages: app-kit, desktop, crossplatform, store domain cores.
- Files, Notes, Calendar, Photos domain cores with durable local persistence.
- Writer, Sheets, Slides, Preview domain cores with a documented format subset.
- Athena local-first assistant with default-deny tools and an audit chain.
- Sovereign Finance internal ledger and paper accounting.
- Trading Bot paper trading and backtesting.
- Compute kernel: native binary; ternary and quantum simulation.
- Self-host stack template with licence obligations and SBOM/notices.

## Why not Windows/macOS/Android yet

| Platform | Free path | Blocker |
|---|---|---|
| Windows | SignPath.io free code signing for eligible open-source projects | Requires an approved open-source licence and project application; SmartScreen reputation takes time |
| Android | F-Droid | Requires a reproducible build recipe and an open-source licence; Google Play needs a $25 account |
| macOS/iOS | None | Apple Developer membership is paid (~$99/yr); notarisation cannot be faked |
| Microsoft Store | Paid developer account | Not needed for direct distribution |

If you want Windows in v1, the cheapest honest path is an open-source licence plus
SignPath, or an OV/EV certificate. A self-signed MSIX is not a public release.

## Signing reality

- A checksum is not a signature.
- Sigstore/cosign keyless signing and minisign are free and verifiable.
- Linux repository packages need a GPG key with custody and rotation.
- Windows Authenticode and Apple notarisation require paid identities.
- The release gate checks for a detached `.sig`, `.asc`, `.p7s`, or `.minisig`
  next to every artifact. It does not verify the signer identity; that is a
  separate supply-chain step.

## Evidence that must exist before flipping the scope to `APPROVED`

1. Your written approval of product, version, channel, platforms, and in/out lists.
2. A real `LICENSE` matching the distribution model.
3. `SECURITY.md` with a monitored disclosure contact.
4. A lawyer-reviewed privacy policy with a review marker.
5. Signed artifacts for every declared platform.
6. Independent security and WCAG 2.2 AA audits with named auditors.
7. Install/launch/rollback evidence on every declared platform.
8. Measured p95 performance on named hardware.
9. Full acceptance fixtures for every format claimed in the release notes.
10. A benchmark result that either measures 5/5 or is disclosed as a gap.

## Copy-paste starting point

`release/release-scope.recommended.json` contains a machine-readable version of
this recommendation. Do **not** copy it over the active scope until you have
approved it and the evidence exists. When you are ready:

```sh
# After owner approval and evidence collection:
copy release\release-scope.recommended.json release\release-scope.json
# Edit status to APPROVED, set the final version/platforms/inRelease, then:
node scripts/release-gate.mjs
```

The gate must still fail until every blocker passes. Changing `status` alone is
not a release.

## Decisions only you can make

1. Licence: **recorded direction 2026-11-05** - open-core, freemium, using the existing multi-licence map in `LICENSING.md`: Apache-2.0 foundation paths, AGPL-3.0-or-later default OS/app layer, dual AGPL/commercial finance and trading cores, and proprietary live/enterprise modules. Final legal text, a CLA, trademark clearance and third-party notices remain owner/legal-gated. See `docs/adr/ADR-005-OPEN-CORE-FREEMIUM.md`.
2. Channel: **recorded 2026-11-03** - `0.1.0` developer preview, not a full public 1.0.
3. Platforms: **recorded 2026-11-04** - the active `0.1.0` scope is the self-hosted web/PWA in a current Chromium-based desktop browser. The Linux Flatpak/DEB paths above are later recommendations, not `0.1.0` commitments. See `docs/TEST-DEVICE-MATRIX.md`.
4. Finance: **recorded 2026-11-04** - PAPER and DEMO only for v1; LIVE requires written authorisation and compliance evidence. The remaining input is that authorisation if live is pursued. See `docs/adr/ADR-003-FINANCE-PAPER-FIRST.md`.
5. Kernel: **recorded 2026-11-04** - binary kernel with simulation-only ternary/quantum; x86_64 first, then ARM64 and RISC-V; VM-first with bare-metal validation. The remaining inputs are test hardware, signing keys and audits. See `docs/adr/ADR-002-KERNEL-PLATFORM.md`.
6. Pricing: **recorded direction 2026-11-05** - free community tier; Plus target £9.99/month; per-seat Business tier; one-time module/lifetime options; small transaction fee only for lawful commerce or authorised live trading. No billing in `0.1.0`. A cost model, VAT/tax, payment fees, refund policy and consumer terms are still required. See `docs/adr/ADR-005-OPEN-CORE-FREEMIUM.md`.
7. Security contact and legal entity: still owner-gated. The security policy and `security.txt` cannot be published without a monitored contact.
8. Domain, TLS, cloud account, backup target and launch date: still owner-gated. Free tiers only until proof and explicit approval.
