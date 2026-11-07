# Executable Status — Verified Results
Updated: 2026-11-04

## Verified passing
- Full app verification: `node apps/verify.mjs` → **15/15 slices passed** (including trading-bot 28/28, app-suite 32/32, sovereign-finance 14/14).
- Root test suite: `npm test` → **100/100 test files, 1,802 passed, 3 skipped, exit 0**.
- All-app smoke import: `node apps/smoke-all.mjs` → **108/108 app entry points import, 0 fail, 0 empty**.
- TypeScript: `npx tsc -p apps/tsconfig.json --noEmit` → **exit 0**.
- Secret scan: `python tools/scan_for_secrets.py` → **clean (1,079 files, 6 documented allowlists)**.
- Fixtures: `node tests/fixtures/run-fixtures.mjs` → **4/4 structural fixtures pass** (DOCX, XLSX, PPTX, PDF signatures + content).
- Benchmark simulation: `node tests/fixtures/simulate-benchmark.mjs` → `overall: NOT_5_STAR`, `weightedScore: null` (fail-closed).
- Live API: `node api/server.mjs` on http://127.0.0.1:4317 → health, financial state/post, trading state/order, benchmark fixtures, deploy status all **200**; unknown path **404**.
- Deployment bundle: `dist/aetherius-dev-bundle-20261102-2158.zip` — 29,018 bytes, SHA-256 `13FF44D15E61D92E7C8B907A0650F609582F62E405A229BF7CEB91BFA0577F7F` (unsigned development bundle).

## Web/PWA and rollback — verified this cycle
- PWA build and installability: `npm run verify:pwa` → **PASS**, 24 checks. The manifest, 192/512 PNG icons, maskable icon, service worker, generated precache manifest and hashed JavaScript bundle all pass; the app is served from a localhost secure context.
- Install/launch matrix: `docs/evidence/install-matrix.json` → `web-pwa-selfhost` has `install: PASS`, `launch: PASS`. This verifies installability criteria programmatically, not the browser's user-driven install prompt.
- Performance baseline: `docs/evidence/performance.json` → **PASS**, p95 **8.093 ms** over 1,600 loopback requests (10 warmups + 200 samples across 8 endpoints), p50 3.079 ms, p99 13.992 ms, on the named Windows host. This is a loopback static-server baseline, not wide-area latency or client rendering time.
- Rollback: `npm run verify:rollback` → **PASS**. Two production builds with distinct stamps were served on one origin; headless Chrome verified baseline A → upgrade B → rollback A, identical baseline bundle hash, one registered service worker, and survival of the real `aetherius.shell.settings.v1` key plus a drill key. 0 console errors/exceptions. Evidence: `docs/evidence/rollback.json` and `release/evidence/rollback-report.json`.
- Shell: the production bundle boots in headless Chrome with a rendered root, desktop app icons, provider status, and no uncaught exception. The taskbar now reports online/offline from `navigator.onLine` and battery only when the browser exposes `getBattery()`; static fake battery/network/volume claims were removed.
- Limits: no production DNS/TLS/CDN switch was exercised, no prior public release exists, and browser storage was tested in a fresh temporary Chrome profile.

## Kernel — verified this cycle
- Canonical package: `kernel/compute/aetherius_kernel/` (`binary.py`, `ternary.py`, `quantum.py`, `capabilities.py`, `dispatch.py`).
- Python tests: `python -m pytest kernel/compute/tests -q` → **49 passed**.
- Unified verify: `node kernel/compute/verify.mjs` → **PASS** (Python tests + capability JSON + native C host tests).
- Native x86_64 scaffold: `native/kernel/build/host/test_kernel.exe` → **126 checks, 0 failures**.
- Capability report (source of truth):
  - binary `NATIVE_HOST` — packed `uint64` XNOR + popcount, **not** a custom ISA.
  - ternary `SIMULATED` — dual `uint64` bit-masks, **no** ternary hardware.
  - quantum `SIMULATED` — local state-vector simulator, max 24 qubits, **no** quantum hardware.
  - remote QPU `BLOCKED_DEPENDENCY` — fails closed with `QUANTUM_HARDWARE_BLOCKED_DEPENDENCY`.
  - native kernel `NATIVE_HOST` — host-tested scaffold, **not** a bootable general-purpose OS.
- Provenance: promoted from `research/build85/kernel_binary`, `kernel_ternary`, `kernel_quantum`; research copies retained as evidence. See `kernel/compute/manifest.json`.

## Self-hosted stack — verified this cycle
- `deploy/selfhost/docker-compose.yml`: **14 services** (PostgreSQL, Valkey, Keycloak, Nextcloud, Collabora, SeaweedFS, Metabase, Forgejo, Prometheus, Grafana OSS, Uptime Kuma, Ollama, Qdrant, SearXNG).
- Validation: `docker compose --env-file .env.example config --quiet` → **exit 0**.
- All ports bind to `127.0.0.1`. TLS, backups, secrets management, SMTP, DNS, and WAF are **not** configured.
- Licence obligations documented in `deploy/selfhost/README.md` (AGPL: Nextcloud, Metabase, Grafana, SearXNG; GPL: Forgejo; MPL: Collabora).
- This proves the compose file is valid and variables resolve. It does **not** prove the services start, stay healthy, or are secure.

## Release gate — verified this cycle
- `node scripts/release-gate.mjs` → **`NOT_RELEASABLE`**, exit 1.
- Result: **11 passed, 7 blockers, 1 warning**.
- Passing: release scope (approved `0.1.0`, self-hosted web/PWA), package version (`0.1.0`, `private: false`), licence (hybrid `LICENSING.md` plus real licence texts), third-party notices, owner-inputs documented, SBOM (161 components, Node and Python), kernel honesty, self-host stack present, web/PWA install and launch matrix, exercised web-bundle rollback, and measured loopback performance.
- Blockers: missing SECURITY.md contact and reviewed privacy policy, no signed artifacts, no independent security/accessibility audits, structural-only fixtures, benchmark `NOT_5_STAR`.
- The gate rejects empty/placeholder legal files instead of passing on existence alone.
- Warning: kernel status `PARTIAL_COMPLETE`.
- Gate logic and green-path checklist: `release/README.md`; approved scope: `release/release-scope.json`; approval record: `release/OWNER-APPROVAL-2026-11-03.md`; evidence templates: `docs/evidence/`.
- Release evidence now lives in `release/evidence/` (SBOM and `gate-report.json`) and signed artifacts belong in `release/artifacts/`, both outside `dist/`, so `npm run build` cannot delete them. Verified: build exit 0 and gate evidence still present.

## Repaired this cycle
- Trading test syntax corruption (`))));`, missing parentheses, CLOCK) — fixed; 28/28 pass.
- 100 `aetherius-*` `src/index.ts` invalid export identifiers — rewritten; tsc passes.
- `paint.ts` / `canvas.ts` `Layer` collision — renamed to `PaintLayer`.
- `catalog.ts` invalid `uniqueTo: ""` / `category: "business"` — fixed.
- `catalog.ts` had closed the default-app array early, orphaning 39 app entries; they were rejoined, invalid `uniqueTo: ""` fields removed, and the catalogue test updated to the renamed app IDs.
- `aetherius-canvas`, `aetherius-sheets`, `aetherius-slides`, `aetherius-writer` index exports corrected to the real class names; two empty generated app directories removed.
- `aetherius-sheets` range evaluation now uses an explicit array-capable intermediate type and refuses to store an array as a scalar cell; `aetherius-renderer` tests annotate scenes as `Scene`. `tsc` is clean again.
- SBOM generation now merges the kernel's installed Python dependency tree from package metadata (runtime and dev scope, 7 components; 161 total) and regenerates notices with 0 unknown licences.
- `journal.ts`, `recorder.ts`, `slides.ts` type errors — fixed.
- `durable.ts`, `newId()` arity, interface import paths, settings index type — fixed.
- Build manifests: invalid `PARTIAL_COMPLETE` state in sovereign-finance and trading-bot changed to schema-valid `PARTIAL`; commerce/store placeholder IDs and missing issue evidence fixed.
- Source registry regenerated (1,124 documents) and build report regenerated, closing 6 root-test failures.

## Still NOT verified / open
- Full acceptance fixtures: 200-page DOCX, 1M-row XLSX, media, CAD, BIM, MIDI, collaboration 1,000-op — not run. Web/PWA install, launch and rollback are verified; native installers and per-OS hardware matrices are not.
- Security audit: rules empty; no passed review.
- Accessibility: fixtures defined, all `verified=false`.
- Deployment: no signed MSIX/DEB/RPM/APK/DMG/PKG and no installation on hardware; the web/PWA artifact is built and installability-verified but unsigned.
- Performance: the web/PWA loopback baseline is measured; no native client, browser rendering, wide-area network, soak, or crash-recovery measurements exist.
- Workspaces: Studio / Engineering / Built Environment / Science / IDE / Business / Poietek — scaffolds/domain cores only, not 5-star applications.
- Live integrations: no bank/card/exchange adapter; API is localhost with no auth/TLS.
- Kernel: ternary and quantum are simulated; remote QPU blocked; native kernel not bootable.
- Self-host: not started or smoke-tested; no TLS, backups, secrets manager, SMTP, DNS, or WAF.
- Codex/ChatGPT corpus: only `summary.md` reviewed; full requirement extraction from `index.jsonl` / `threads.json` remains open.

## Commands
```sh
node apps/verify.mjs
node apps/smoke-all.mjs
npx tsc -p apps/tsconfig.json --noEmit
node tests/fixtures/generate-fixtures.mjs
node tests/fixtures/run-fixtures.mjs
node tests/fixtures/simulate-benchmark.mjs
node api/server.mjs

# Web/PWA, launch and rollback
npm run verify:pwa
npm run verify:rollback
npm run pwa:icons

# Kernel
python -m pytest kernel/compute/tests -q
node kernel/compute/verify.mjs
python -m aetherius_kernel capabilities
python -m aetherius_kernel selftest

# Self-host
docker compose --env-file deploy/selfhost/.env.example -f deploy/selfhost/docker-compose.yml config --quiet
docker compose --env-file deploy/selfhost/.env.example -f deploy/selfhost/docker-compose.yml config --services

# Release gate (expected NOT_RELEASABLE until owner evidence exists)
node scripts/release-gate.mjs
```
