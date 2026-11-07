# Privacy Notice — Aetherius OS

> This notice describes the `0.1.0` free self-hosted web/PWA developer
> preview. It must be reviewed by the project owner before a wider public
> release. It does not yet carry an external legal review.

## What runs where

- The shell runs in your browser. Application data lives in your browser's
  local storage unless you connect a backend.
- The default AI path is **local Ollama** on your own machine. Prompts are
  not sent to any third party on that path.
- Optional remote AI providers (Gemini, Groq and others) are only used when
  you supply a credential at runtime. Nothing is sent to them otherwise.
- Optional cloud sync uses a Cloudflare Worker backed by D1. Sync is off
  until you enter an endpoint and a token in Settings → Cloud & Sync.

## What is collected

**By the preview itself: nothing.** There is no analytics, no advertising
tracker, and no account system. The shell does not phone home.

Infrastructure you host may keep its own logs:

- Cloudflare Pages/Workers/D1 follow Cloudflare's standard request logging
  and retention.
- The sync worker stores the synced records you choose to push, plus the
  append-only change log that makes offline reconciliation possible.
- Supabase (preview backend, `eu-west-2`) stores the data its tables hold
  under Supabase's standard terms.

## What you control

- Sync is opt-in per device. The token is session-only and is never saved.
- Clear the local replica any time from Settings → Cloud & Sync.
- Tombstones and the change log are how deletes propagate; there is no
  server-side erase beyond the retention window in `d1/0001_sync.sql`.

## Children

The preview is a developer tool. It is not directed at children and collects
no children's data.

## Contact

Security and privacy reports: use the private vulnerability reporting on
`https://github.com/jayprophit/Aetherius-OS/security/advisories`.

## Review status

**Not yet reviewed or approved by an external legal adviser.** This document
is required by the release gate before a public release; the gate will keep
failing on this check until an owner/external review is recorded here.
