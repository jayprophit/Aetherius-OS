# Free-first signing and distribution

**Status:** proposed zero-cost path. No certificate, store account or signing
identity has been purchased. Public trusted signing remains owner-gated.

**Rule:** a free certificate or a self-signed key does not make an unsigned
Windows or macOS installer publicly trusted. It produces a development artifact
or a free/open-source distribution path. The release gate stays fail-closed.

## 1. Platform map

| Platform | Free option for now | What is still owner-gated | Honest status |
|---|---|---|---|
| **Windows** | Local self-signed Authenticode certificate for development; SignPath.io free code signing for eligible open-source projects (application and review required) | A paid OV/EV certificate or Azure Trusted Signing for a publicly trusted installer | Development builds only until a trusted signer is approved |
| **Microsoft Store** | None; the developer account is paid | Individual/company account and store metadata | Deferred |
| **macOS** | Xcode free provisioning for development on the owner's own machines | Apple Developer Program, Developer ID certificates and notarisation | Public distribution deferred |
| **iOS/iPadOS** | Xcode free provisioning on registered development devices only | Apple Developer Program, App Store Connect, provisioning profiles and entitlements | Public distribution deferred |
| **Android** | Direct APK signed with a locally generated upload key; F-Droid for an open-source, reproducible build | Google Play Console account and Play App Signing if using Play | Direct APK/F-Droid only |
| **ChromeOS / Chrome Web Store** | Install the PWA from the web; no store listing needed | Chrome Web Store developer account if listing | PWA only |
| **Ubuntu/Debian** | Free GPG package-signing key; apt repository hosted on GitHub Pages, Cloudflare Pages or R2 | Key custody and a public repository policy | Free path available |
| **Fedora/Linux** | Free RPM signing key; Copr free account; AppImage signed with a free GPG key | Key custody and repository policy | Free path available |
| **Snap Store** | Free Ubuntu One/Snapcraft account | Store review | Free path available |
| **Aetherius native** | Locally generated Ed25519 store key and update-channel key; private key in the OS keystore/DPAPI plus an offline encrypted backup | HSM/KMS and named key custodians for a serious public release | Development keys only until custody is approved |
| **Containers** | GHCR free for public images; scoped token | Registry policy and image signing | Free path available |
| **SDKs** | npm, PyPI and NuGet accounts with 2FA | Package ownership and release policy | Free path available |
| **Signing-key custody** | DPAPI-protected key plus an offline encrypted backup for development | HSM, Azure Key Vault, AWS KMS or hardware token; named custodians | Mandatory owner gate for public release |

## 2. What can be signed for free now

- The `0.1.0` web/PWA bundle can use free Sigstore/cosign keyless signing or a
  minisign key.
- Linux packages can use free GPG keys and free repository hosting.
- Flathub, Copr, Snapcraft, GHCR, npm, PyPI and NuGet accounts are free.
- Android can use a locally generated upload key and direct APK distribution;
  F-Droid is the free store path for an eligible open-source project.
- Aetherius native development images can be signed with a locally generated
  Ed25519 key. The key must not be committed, printed or stored in a registry.

## 3. What cannot be signed for free

- A publicly trusted Windows Authenticode signature. SignPath's free programme
  is an application, not an entitlement, and it is limited to eligible
  open-source projects.
- A notarised macOS or iOS build. Apple notarisation and App Store distribution
  require the paid Apple Developer Program.
- A Google Play release. The Play Console account is a one-time paid fee.
- A Chrome Web Store listing. The developer account is a one-time paid fee.
- A hardware-backed HSM or KMS custody chain. A development key is not
  equivalent to an HSM.

## 4. Recommended zero-cost order

1. Keep `0.1.0` as the approved self-hosted web/PWA preview.
2. Sign the web bundle with cosign or minisign.
3. Generate a local GPG key for the Linux apt/RPM/AppImage repositories and
   store the private key outside the repository.
4. Generate a local Ed25519 key for Aetherius native development images.
5. Publish containers to GHCR with a scoped token.
6. Use GitHub Actions for CI. Public repositories get free minutes.
7. Apply to SignPath only if a Windows public installer becomes a real target
   and the project meets its eligibility rules.
8. Defer Windows Authenticode, macOS/iOS notarisation, Microsoft Store, Google
   Play and Chrome Web Store until the owner approves the spend.

## 5. Key custody for the free phase

- Private keys live outside the repository, in a directory ignored by Git.
- The private key is protected with DPAPI on Windows and backed up in an
  encrypted archive on offline media.
- The public key and its fingerprint are committed so a verifier can check a
  signature.
- A key generated for development is labelled `DEVELOPMENT` and is not
  presented as a production signing identity.
- No key, password or recovery code goes into `docs/`, a build manifest, a YAML
  registry, a log or a chat transcript.
- Moving to HSM/KMS custody is a separate owner-approved project.

## 6. Store metadata

The following need owner approval before any store submission:

- app name, subtitle and description,
- category and age rating,
- screenshots and promo video,
- support URL and privacy URL,
- demo account, if a store requires one,
- export-compliance answers,
- content declarations and data-safety answers.

Until then, store metadata is `DRAFT` and must not be submitted.

## 7. Effect on release scope

This document does not expand `0.1.0`. It records how to use free signing and
free distribution for the approved web/PWA preview and for development builds.
A publicly trusted native installer remains outside the current scope until the
owner supplies or approves a trusted signing identity.
