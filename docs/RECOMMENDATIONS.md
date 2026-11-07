# Aetherius OS — Recommendations (Added)
**Date:** 2026-10-30 | **Status:** RECOMMENDATIONS — IMPLEMENT IN ORDER

Based on gap analysis (`GAP_ANALYSIS_COMPLETE.md`) and the completed interface/persistence modules for finance, trading, and core apps.

---

## 1. Immediate (this week)

1. **Link interfaces to persistence.** All new interface modules (`files`, `notes`, `calendar`, `photos`, `browser`, `settings`, `security`, `backup`, `vault`, `terminal`, `monitor`) use in-memory state. Replace with durable adapters (JSON/file or shared `app-kit` repository) before claiming persistence complete.
2. **Build fixtures for DOCX / XLSX / PDF / IFC.** These are P1 gaps across Workspace / Studio / Engineering / Built Environment. Start with 200-page DOCX and 1M-row spreadsheet fixtures.
3. **Complete Poietek core.** The existing Poietek README reports 53/100 (not independently verified). Do not claim public-use release until fixtures pass.
4. **Rotate upstream credentials** (TRADING-BOT-001 critical). External admin action required; document rotation evidence in `build.yaml`.

---

## 2. Short-term (next month)

5. **Shared creative engine (Studio).** Build one raster + vector + colour + typography + audio/video + node-graph engine shared across Studio, Poietek, Science, and Engineering. Do not build separate engines per workspace.
6. **Shared collaboration / business primitives.** Multi-user editing, permissions, CRM, finance workflows should consume `app-kit`, Agent Bridge, and `sovereign-financial-os` — not duplicate.
7. **Accessibility audits.** Screen reader / keyboard / high-contrast tests for all default OS apps (Files, Settings, Terminal, Monitor, Access, Guide).
8. **Security review.** Threat review, least privilege, consent/audit for Vault, Security, Backup, and audit chain.

---

## 3. Medium-term (next quarter)

9. **Deployment artifacts.** Build and test MSIX (Windows), DEB (Ubuntu/Debian), RPM (Fedora), APK/AAB (Android), DMG/PKG (macOS), PWA (ChromeOS/Web). Install, launch, rollback tested on physical or VM targets.
10. **Performance benchmarks.** Resource budgets, crash recovery, 99th-percentile timings for document, media, CAD, and collaboration fixtures.
11. **Benchmark scoring.** Only after fixtures pass: assign dimension scores (fail-closed). Do not award 5-star until all dimensions = 5 and gates PASS.
12. **Reverse-engineering documentation.** For Adobe, Autodesk, M365, Google Workspace, Apple Creator, Blender, DaVinci, Siemens/Dassault/PTC, MathWorks/Ansys: record versions, derive settings, run fixtures, compare outputs, document provenance.

---

## 4. Architecture recommendations

- **No duplicate engines.** Studio, Engineering, Science, and Poietek must consume shared engines (geometry, scene, typography, media timeline, DSP, rendering, data, search, identity, permissions).
- **No second account / storage.** An app should not need a separate identity or file storage just because it launches separately.
- **Canonical registry only.** All new entries must merge through `docs/PROGRAMME-CATALOGUE.yaml`, `docs/SYSTEM-CAPABILITY-REGISTRY.yaml`, and `apps/aetherius-app-suite/src/catalog.ts`. Do not install a second registry.
- **Paper-only boundaries preserved.** Sovereign Financial OS and Trading Bot remain internal/paper. Document clearly in README, build.yaml, and marketing — no regulatory or live-market claims implied.
- **Legal check before decompilation.** UK s.50B allows limited decompilation for interoperability; it is not a blanket permission to reproduce proprietary software. Original code must remain independent.

---

## 5. Risk / limitation reminder

- Zero verified 5-star checks exist.
- No live bank, card, or exchange adapter is claimed.
- No regulatory certification, audit opinion, or tax filing is claimed.
- Poietek v0.5 is pre-release; public-use is NO-GO until benchmarked.
- Universal Bridge / Cubase / Reason writer and two-way sync are not available.

All recommendations feed back into the 8 benchmark dimensions; progress should be tracked per dimension, not just per feature.
