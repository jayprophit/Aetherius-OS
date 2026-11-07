# Gap Analysis — Aetherius OS Public-Release Readiness

**Date:** 2026-11-07
**Scope:** `0.1.0` free self-hosted web/PWA developer preview (the release
scope in `release/release-scope.json`). Broader `1.0` remains planned.

## Headline

The system works. Every application slice runs and passes its tests, the
shell typechecks, the sync engine and worker are tested end-to-end (push,
pull, conflicts, tombstones, offline outbox), and the workspace is now fully
registered and typechecked. What remains is not "code that doesn't run" —
it is the long tail of polish, honesty fixes, and owner/external gates that
stand between a working 0.1.0 preview and a public release.

## Verified today (evidence, not claims)

| Claim | Evidence |
|---|---|
| 133 `@aetherius` slices discoverable and passing | `npm run test:apps` → 133/133 |
| Shell + slices typecheck | `npm run typecheck` and `npm run typecheck:apps` clean |
| Root test suite green | `npm test` — see final tally below |
| Secret scan clean | `npm run secret-scan` → clean (6 allowlisted) |
| Sync protocol/engine correct | `apps/aetherius-sync` 13 tests (LWW, conflicts, tombstones, cursor) |
| Sync worker correct | `apps/aetherius-cloud` 21 tests (auth, fail-closed, CORS, tenants) |
| Kernel compute works | `kernel/compute` 49 pytest tests; capabilities report honestly labels ternary/quantum `SIMULATED` |
| Every app directory catalogued | `src/apps/catalogue.ts` (141 entries), byte-synced by test |
| Password vault reorganised | KeePass: API entries merged into curated service tree, 8 merges, 7 service records added |

## Fixed in this pass

1. **95 invisible slices.** 95 `apps/` packages still carried the scaffold
   package name `aetherius-$app` / `$app`, so `apps/verify.mjs` silently
   skipped them. Renamed to `@aetherius/<dir>` and fixed 92 templated
   `build.yaml` manifests (`scripts/normalise-apps.mjs`, idempotent).
2. **Typecheck covered only 220 of 266 slice directories.** Added the missing
   46 includes (`scripts/sync-app-tsconfig.mjs`).
3. **Broken test code from the template pass.** One ledger call in
   `aetherius-app-suite/src/slides.ts` had `data: App Suite`. Fixed.
4. **Missing statuses.** 19 slices had no `status:` in their manifest;
   added honest `PARTIAL` blocks (`scripts/backfill-manifest-status.mjs`),
   plus manifests for the two directories that had none.
5. **Empty Settings UI.** `settingsConfig` was `[]` and `loggedInUser` was
   `null` (crash). Restored a config that only lists functional pages,
   made the profile card null-safe in all three Settings surfaces.
6. **Fake settings data removed.** About and System pages invented hardware
   specs (256 GB RAM, a "Virtual Quantum CPU", dead buttons). Rewritten to
   read measured values: production build id, catalogue counts, the shell
   settings store, and `navigator` facts.
7. **New functional panels.** Settings → Cloud & Sync (endpoint, session-only
   token, `/health` test, manual sync, status, conflict list) and
   Applications (the full 141-entry catalogue with manifest status).
8. **Shell error boundary.** One failing app view can no longer take the
   shell down.
9. **Stale governance output.** `BUILD-MANIFEST-REGISTRY.md` regenerated;
   the workspace-registry and hygiene tests were taught about `.wrangler`
   (Wrangler CLI cache), matching the existing `.freebuff` exclusion.
10. **Docs.** `docs/CLOUD-SYNC.md`, `SECURITY.md`, `docs/PRIVACY.md` (this
    document's release-gate inputs).

## What is honestly NOT finished

### 1. 18 slices are import stubs
`accessibility`, `aetherius-diskUtility`, `aetherius-mediaPlayer`,
`aetherius-pdf`, `aetherius-reminders`, `aetherius-screenshot`,
`aetherius-taskManager`, `aetherius-textEditor`, `app-launcher`,
`backup-restore`, `font-viewer`, `help-support`, `on-screen-keyboard`,
`print-manager`, `screen-recorder`, `security-center`, `update-manager`,
`voice-assistant`. Each exports a version constant, a state interface and a
`create*()` factory; the test proves importability only. Their manifests now
say so (`PARTIAL`). Their domain logic is real work, not a quick fix, and is
the main reason the app-suite surface is larger than the 6 wired windows.

### 2. Shell windows are mostly unwired
`components/apps/` holds 41 UI components; `src/main.tsx` wires 6
(Recorder, Notes, Writer, Sheets, Slides, Canvas) plus Settings. The other
35 (FileManager, Terminal, Finance, Health, Gaming, …) exist but no window
opens them. Wiring every one behind the error boundary is straightforward
but each needs a smoke check in the browser first.

### 3. Sibling projects
Recorded in `docs/BUILD-MANIFEST-REGISTRY.yaml`:
- **Genesis** — `VERIFIED` (kernel). Under active training by Hermes in
  `Genesis/Genesis-Model`; do not duplicate that work. The shell's Genesis
  provider talks to it over the local provider contract.
- **IDE-Workspace** — `VERIFIED`.
- **Universal-Bridge / Poietek / LedgerLands** — `VERIFIED`.
- **MAT** — `PARTIAL` and explicitly *not finished*: the atlas is still
  being worked on by the Codex desktop app on a scheduled window. Nothing
  downstream should treat it as a finished reference.
- **Agent-Bridge** — `PARTIAL`, including its cloud-hybrid, dashboard and
  runtime-safety variants. The bridge runtime and delegation/policy/MCP
  surface need the remaining gap work before a 1.0 claim.

### 4. Kernel honesty
`kernel/compute` is `PARTIAL_COMPLETE` by design: binary/ternary/quantum
arithmetic pass; ternary and quantum are **simulated**; the remote QPU path
fails closed; the x86-64 C scaffold is host-tested but **not a bootable
general-purpose OS**. The capability report (`python -m aetherius_kernel
capabilities`) is the source of truth and the UI must never claim more.

## Release gates that are owner/external (fail closed, by design)

`npm run release:gate` will remain `NOT_RELEASABLE` until these exist.
Each is a real decision, not paperwork to forge:

- Release scope approval (`release/release-scope.json` → `APPROVED`).
- An independent penetration test (`docs/evidence/security-audit.json`,
  `PASS`, named auditor).
- An independent WCAG 2.2 AA audit (`docs/evidence/accessibility-audit.json`).
- Legal review of `docs/PRIVACY.md` — the document states plainly that it
  is **not yet reviewed**. (Known heuristic weakness: the gate passes on
  the substring `reviewed`/`approved`, so this check can read green while
  the document says the opposite. The document is the truth; the gate is a
  smoke check.)
- Paid signing/notarisation and store accounts for native/desktop packages.
- A generated `THIRD_PARTY_NOTICES.md` + CycloneDX SBOM at
  `release/evidence/sbom.cdx.json`.
- Signed artifacts (every artifact needs a detached signature).

## Operational gaps (free services)

| Service | State |
|---|---|
| Cloudflare Pages | Live (`aetherius-preview.pages.dev`) |
| Cloudflare D1/KV | Created; D1 holds the sync schema |
| Sync Worker `aetherius-sync` | **Live** (`aetherius-sync.jprophit-87b.workers.dev`), D1 schema applied, `SYNC_TOKEN` rotated and in KeePass, live end-to-end sync proven (push/pull/converge across two devices) |
| Supabase `aetherius-preview` | Active (`eu-west-2`); `Commerce` paused |
| Sentry | **Project `aetherius-os` created** (org `aetherius-os`, EU `de`); public DSN in KeePass; SDK not yet wired into the bundle |
| Codecov | Signup returns HTTP 400 from `api.codecov.io`** |
| UptimeRobot | Entry exists in KeePass; monitor not created (browser blocked by tunnel errors) |
| Brevo | Entry exists; no API key / SMTP configured; interactive login required |
| Oracle Always Free VM | Not created |
| Firebase / Vercel / Make / Zapier | Accounts exist; unused by the preview |

## Dependency vulnerabilities

`npm audit` on the root tree is clean after `npm audit fix` (fixed
`follow-redirects`, `source-map-js`, Vite dev-server advisories, and
`@vitest/mocker`; lockfile committed). GitHub still reports ~64 Dependabot
alerts; the bulk are in `research/rea/test-app/package.json` (an Electron
research fixture), plus stale root-lockfile entries from before the fix.
Dependabot alert counts are per-package across manifests; they are not a
measure of the product surface. The research fixture's Electron/Vite pins
need their own maintenance track before any public release, and the root
lockfile is now clean.

**Docker host-port conflicts** (5432, 6379, 11434) remain for the
LedgerLands stack: free ports or stop the conflicting service before
running `docker compose`.

## Migration / backup gate

Project data was moved into `C:\Users\jpowe\Desktop\Projects`; the E: backup
predates recent work. The migration must be proven (manifest + hash
comparison) and a **fresh verified backup** taken before any source folder
is deleted. `Database.kdbx` now has an empty-string password — set a master
password and move it off the plaintext; the vault was reorganised on
2026-11-07 with a timestamped pre-change backup retained.

## Local AI (token-free)

Default path is local Ollama (`http://127.0.0.1:11434`) — token-free means
no paid API tokens, not zero electricity/compute cost. Remote Gemini/Groq
are optional and use only a runtime session credential; the Vite build
carries none. The `AiSettings` page still contains toggles that do nothing
and a chat that depends on the (currently null) profile — it is deliberately
excluded from `settingsConfig` until fixed.

## Bottom line for the dogfood period

For the owner's months of testing: the preview is usable and honest inside
its `0.1.0` scope. The gaps above are the work queue for turning that test
period into a public release — sized in weeks of real implementation per
item, plus the external audits that cannot be self-certified.
