# Performance baseline (2026-11-07)

**Hardware (this machine, measured):** 4 cores, 16 GB RAM (from SystemWidget reading).
**Browser:** in-app Chromium (desktop) + local Vite build; Playwright not installed —
E2E uses the in-app browser skill + HTTP checks (see below).

## Initial load (measured from `dist/`)

| Asset | Size |
|---|---|
| `index-*.js` (main) | ~486 KB (138 KB gzip) |
| `vendor-*.js` (react) | ~12 KB |
| `index-*.css` | ~183 KB (24 KB gzip) |
| **Initial JS+CSS (downloaded at boot)** | **~681 KB (~175 KB gzip)** |
| All lazy app chunks (Finance, Social, …) | ~860 KB total, loaded on demand only |
| **Total `dist/assets/*.js`** | **~1,547 KB** |

The 447 KB → 486 KB main-chunk change is **not a regression**: 30 registry-wired apps
share ~39 KB of registry/provider code in the main chunk; each app's own code is a
lazy chunk that loads only when its window opens. Removing working apps to shrink the
bundle is explicitly out of scope.

## Budgets (for the next milestone to enforce)

- Initial JS+CSS ≤ 750 KB (today ~681 KB).
- Window open latency ≤ 500 ms for lazy apps (React.lazy + Suspense).
- No new eager framework dependency without a measured budget review.
- Genesis avatar render stays 2D canvas (no diffusion dependency).

## E2E evidence (in-app browser, live `master.aetherius-preview.pages.dev`)

- Fresh load: title "Aetherius Shell", build ID `0.1.0`, widgets S with move/resize
  controls, desktop icons (Genesis Human first).
- Launch Genesis Human via desktop icon: **canvas present, OFFLINE FALLBACK badge
  (correct for the cloud PWA), chat input present**.
- Console: globe icon path fixed (truncated `d`); loopback probes to
  `127.0.0.1:8471/8472` fail CORS from the public origin as expected — the UI
  reports them as honestly UNREACHABLE/NETWORK, not as app crashes.

## Gaps

- Playwright-based viewport E2E (desktop 1920×1080 + mobile 390×844) still to add.
- Time-to-interactive / memory fixtures not yet automated.
- Sync latency fixture (push/pull round-trip) not yet automated.
