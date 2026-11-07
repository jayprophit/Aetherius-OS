# Free-first identity, accounts and collaboration stack

**Status:** proposed mapping and local setup plan. No paid tier is enabled. No
cloud account has been changed. This document maps each owner requirement to a
free or self-hosted option and records the human gates.

**Cost policy:** the default monthly budget is **£0**. Free-tier resources are
preferred. A trial-only credit is not core infrastructure. A paid tier is
enabled only after a written owner approval naming the service, the cap and the
person authorised to stop it.

## 1. What can run locally now

`deploy/selfhost/docker-compose.yml` already defines a free/open-source stack.
The local core is started with:

```powershell
docker compose --env-file deploy/selfhost/.env -f deploy/selfhost/docker-compose.yml up -d `
  postgres valkey seaweedfs forgejo ollama qdrant keycloak nextcloud searxng uptime-kuma
```

| Service | Free option | Purpose | Status |
|---|---|---|---|
| PostgreSQL | Self-hosted | Shared database | Local container |
| Valkey | Self-hosted | Cache and sessions | Local container |
| SeaweedFS | Self-hosted | S3-compatible object storage | Local container |
| Forgejo | Self-hosted | Git forge and CI source | Local container |
| Ollama | Self-hosted | Local model runtime | Local container |
| Qdrant | Self-hosted | Vector store | Local container |
| Keycloak | Self-hosted | OIDC, OAuth 2.0, SAML, passkeys | Local container |
| Nextcloud | Self-hosted | Files, WebDAV, CalDAV, CardDAV, collaboration | Local container |
| SearXNG | Self-hosted | Private metasearch | Local container |
| Uptime Kuma | Self-hosted | Health monitoring | Local container |

This is a development stack. It binds to `127.0.0.1` and has no public TLS,
backup target or production hardening yet.

## 2. Capability map

| Capability | Free/self-hosted option | Key or account needed | Notes |
|---|---|---|---|
| OAuth sign-in | Keycloak local OIDC; Google Cloud OAuth client; Microsoft Entra app registration | Google client ID/secret; Microsoft tenant/client ID/secret | Google and Microsoft developer tiers are free. Apple Sign In needs the paid Apple Developer Program, so it is deferred. |
| Passkeys/WebAuthn | Keycloak WebAuthn | Relying-party ID and origin | Use `localhost` for development and the real domain after DNS/TLS. No paid service. |
| SSO/SAML | Keycloak as identity provider and service-provider test | Local realm and test users | Microsoft Entra ID Free does not include SAML SSO; Keycloak is the free test IdP. |
| Email sync | Gmail API; Microsoft Graph; IMAP/SMTP test account | Google OAuth client; Microsoft app registration; test mailbox | Start read-only. Gmail restricted scopes may need verification before external users. |
| Calendar/contacts | Google Calendar/People API; Microsoft Graph; Nextcloud CalDAV/CardDAV | Same OAuth apps | Nextcloud is the local/offline fallback. |
| File sync | Nextcloud WebDAV; SeaweedFS S3; Cloudflare R2 free tier later | None locally; Cloudflare account for R2 | Do not put secrets in ordinary file storage. |
| Real-time messaging | Matrix Synapse + Element; Prosody XMPP; coturn for TURN/STUN | None for self-host; domain/TLS for federation | Add to the local compose stack in a later step. |
| Video calls | LiveKit self-hosted; Jitsi Meet self-hosted; coturn | None for self-host; domain/TLS for public use | Start with a two-party loopback test before exposing anything. |
| Collaboration backend | Yjs + Hocuspocus; Postgres persistence | None | Add a small Node service and WebSocket routing later. |
| Search | SearXNG | None | Already in the local stack. Brave Search API has a free tier but needs a key and attribution; it is a fallback. |
| Maps | OpenStreetMap tiles with attribution; self-hosted tile server later | None for light use | Respect the OSM tile usage policy. Mapbox/Google are paid or key-gated and are deferred. |
| Weather | Open-Meteo; Met Norway | None | Both are free with attribution; Met Norway requires an identifying User-Agent. |
| Translation | LibreTranslate self-hosted; local Ollama model | None | Add LibreTranslate or a local model later. DeepL/Google are deferred. |
| Speech | whisper.cpp; Kokoro-82M | None | CPU-first on the current GTX 1050 / 3 GB VRAM. |
| OCR/vision | Tesseract; PaddleOCR optional | None | Local only; no cloud vision key required for the first version. |
| Fonts | SIL OFL and Apache-2.0 fonts (Inter, Noto, Source Sans, JetBrains Mono) | None | Record the licence for every font file. Do not bundle a font without a licence. |
| Stock assets | Unsplash, Pexels, Pixabay, Wikimedia Commons, Openclipart | None | Check each asset's licence and attribution requirement. Do not assume a site-wide licence covers every file. |

## 3. What is not free

These are explicitly deferred until the owner authorises a paid tier:

- Apple Developer Program for Sign in with Apple, macOS notarisation or iOS.
- Google Workspace or Microsoft 365 paid seats.
- Microsoft Entra ID P1/P2 for SAML SSO and conditional access.
- Okta beyond its free developer tenant, if the free tenant is insufficient.
- Mapbox/Google Maps paid quotas.
- DeepL, Google Translate, Twilio, Daily, or other metered APIs.
- Licensed fonts, stock assets, music or sample libraries.
- Any cloud plan that removes the free tier or requires a card.

## 4. First setup order

1. **Local core**: start the containers listed above and verify each health
   endpoint. This gives identity, files, calendar/contacts, Git, object storage,
   search, local AI and vectors without a cloud account.
2. **Keycloak realm**: create an `aetherius` realm, a test user, an OIDC client
   for the local app, and a WebAuthn policy. Do not reuse the Keycloak admin
   account as an application user.
3. **Nextcloud**: finish the first-run setup, create a test user, and confirm
   WebDAV and CalDAV/CardDAV access.
4. **Matrix and video**: add Synapse/Element and LiveKit or Jitsi to the compose
   stack, then test two local users. Add coturn only when a public domain and
   TLS exist.
5. **Collaboration**: add Yjs/Hocuspocus and prove a two-client edit with a
   reconnect.
6. **OAuth apps**: create Google and Microsoft developer apps only after the
   local stack works. Keep redirect URIs on `localhost` until a domain exists.
7. **Cloud storage**: connect Cloudflare R2 only after the local object store
   and the backup/restore drill pass.

## 5. Human gates

These cannot be completed by an agent alone:

- Google Cloud project creation, OAuth consent screen and client secret.
- Microsoft Entra app registration, redirect URI and admin consent.
- Apple Developer Program payment and Sign in with Apple.
- Domain registration, DNS changes, TLS certificates and public exposure.
- MFA, passkeys, CAPTCHA and KYC.
- Legal acceptance of provider terms.
- Payment-card entry or any paid upgrade.
- KeePass master-password entry and vault unlock.

## 6. Secret handling

- The owner vault is `C:\Users\jpowe\Documents\Database.kdbx`. It is the
  credential store, not an ordinary data store.
- The vault currently has no master password. **Set a strong master password
  before storing any API key in it.** An unprotected vault is readable by any
  process that can read the file.
- Agents use references such as `secret://google/oauth/client-id`, never
  plaintext values in a repository, YAML registry, log or chat.
- A dedicated `Aetherius/Cloud` group keeps cloud and identity credentials
  separate from personal entries.
- Do not put the KeePass master password in an environment file, a repository,
  a shell history or this conversation.
- The self-host `.env` is local-only and gitignored. It is a development
  convenience, not the long-term credential store.

## 7. Verification

A service is not "set up" because a container is running. Each one needs:

- a health check or a successful login,
- a recorded test with the exact command or URL,
- a note of the data it holds and the security class,
- a backup and restore check before it holds anything important,
- an honest status in the provider registry.

The current status of every item is `PROPOSED` or `LOCAL_CONTAINER` until those
checks are recorded.
