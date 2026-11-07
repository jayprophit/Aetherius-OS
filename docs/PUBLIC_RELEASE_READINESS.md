# Public Release Readiness Audit (2026-09-25)

Honest release audit. No percentage, no universal score — explicit
gates with evidence. Conclusion up front: **NOT YET RELEASE-PROVEN**
(see gates). This is programme state, not failure.

## 2026-11-04 addendum (verdict unchanged)

- **Scope and licence:** owner approved `0.1.0` as a free-first, self-hosted
  web/PWA developer preview, recorded in `release/OWNER-APPROVAL-2026-11-03.md`.
  The hybrid open-core licence map is in `LICENSING.md`, with real texts in
  `LICENSE` and `LICENSES/`. Broader `1.0` remains planned.
- **SBOM:** CycloneDX 1.5 at `release/evidence/sbom.cdx.json`, 161 components (Node and Python).
- **Third-party notices:** generated `THIRD_PARTY_NOTICES.md`, 0 unknown licences.
- **Web/PWA:** `npm run verify:pwa` passes 24 installability/launch checks and
  records a loopback p95 of 8.093 ms over 1,600 requests (p50 3.079 ms,
  p99 13.992 ms). The user-driven browser install prompt is not automated.
- **Rollback:** `npm run verify:rollback` passes a headless-Chrome baseline A →
  upgrade B → rollback A drill on one origin. The baseline bundle hash matches
  after rollback, the service worker remains registered, the real
  `aetherius.shell.settings.v1` key survives, and there are 0 console
  errors/exceptions.
- **Shell:** the production bundle renders the desktop with app icons and
  provider status. Static fake battery/network/volume indicators were replaced
  with observable status or removed.
- **Release gate:** `scripts/release-gate.mjs` returns `NOT_RELEASABLE`
  with 11 passes / 7 blockers / 1 warning. It rejects placeholder legal files
  instead of passing on file existence.
- **Kernel:** `kernel/compute/` passes 49 pytest checks and
  `node kernel/compute/verify.mjs` including a claim-honesty cross-check;
  native kernel host tests pass 126/126. Ternary and quantum remain simulated;
  remote QPU remains `BLOCKED_DEPENDENCY`; the native kernel is not bootable.
- **Self-host:** 14-service compose template validates with
  `docker compose config --quiet`; it is not started, hardened, or backed up.
- **Still open:** SECURITY.md with a monitored contact, reviewed privacy policy,
  signed artifacts, independent security and accessibility audits, full
  acceptance fixtures, and the 5-star benchmark.
- **Approved scope reference:** `docs/RELEASE-SCOPE-RECOMMENDATION.md` and
  `release/release-scope.json` record the free-first developer preview.

The 2026-09-25 gate table below is retained as the historical baseline. Do not
read it as the current state where the addendum supersedes it.

## 2026-09-25 update (no verdict change)

- Exhaustive legacy reconciliation complete: `registry/
  legacy-coverage.json` (960 rows, counts sum to 960) + sampled
  human verification. Verdict unchanged.
- Human validation pack created: `docs/HUMAN_RELEASE_VALIDATION.md`
  (offline, platform, IDE UI, accessibility, privacy/telemetry —
  all remain HUMAN_REQUIRED, none self-passed).
- Bridge failure disposition created: `Agent-Bridge/docs/
  BRIDGE_FAILURE_DISPOSITION.md` (14 file-behaviour =
  environment-specific release-blocking until fixed/scoped; 7
  Ollama-down = backend-gated lanes, owner scope decision pending).
- Release-scope owner decision registered:
  `REQ-p31-release-scope` (OWNER_GATED). Scope remains UNDEFINED
  until the owner decides.
- Causal harness + evidence graph completed since the last audit;
  they are primitives, not end-to-end release proof (§85 holds).

## 0. Release scope: UNDEFINED (headline finding)

Programme truth defines no release scope: no in-release component
list, no product version (Aetherius-OS `0.0.0`, IDE
`ide-name-tbd-shell 0.1.0`, both `private: true`), no installer, no
release notes. Candidate scope below is a PROPOSAL requiring owner
decision, not programme truth:

- IN_RELEASE (proposed): Aetherius-OS core contracts, Agent-Bridge
  CLI/service, IDE shell (dev-gated), Genesis organism (dev-gated).
- OPTIONAL: MAT connector, Poietek (local-first audio), Universal-Bridge
  (experimental protocols).
- POST_V1: application verticals, blockchain/economy, regulated
  domains, cloud provisioning.
- EXPERIMENTAL: VM-B, ternary/BitNet lanes, World Model Lab,
  superposition lab, quantum research.
- SEPARATE_PRODUCT: Poietek commercial, finance/commerce apps.

## 1. Gate results

| Gate | Status | Evidence |
|---|---|---|
| Source / repository health | PASS* | Trees known: Aetherius clean except documented pre-existing native/BUILD-TODO.md edit (header untouched); Bridge/IDE ahead counts known; no temp probes. *Known exception recorded. |
| Build reproducibility | BLOCKED | Developer checkout only; no fresh-checkout proof; clean-room backend unavailable (REQ-p20-clean-room BLOCKED). |
| Tests (unit/integration) | PASS* | Aetherius 410/410; IDE 48/48 + 42/42 smoke; Bridge 1174 + targeted suites. *Pre-existing failures below are not covered by this gate. |
| Known failures disposition | FAIL | Bridge 21 env failures (14 file-behaviour + 7 Ollama-down) have no per-test release disposition (environment-only vs blocking vs unsupported). Pre-existing != acceptable. |
| Packaging / installation | PARTIAL (superseded 2026-11-04) | Web/PWA installability and launch PASS; no native installer, packaged artifact, or first-run setup (IDE is `vite preview`, Bridge is source checkout). Developer checkout != installer. |
| Update / migration / rollback | PARTIAL (superseded 2026-11-04) | Web-bundle upgrade and rollback PASS with browser storage preserved; no server-side schema migration or native release rollback. |
| Versioning | FAIL | 0.0.0 / 0.1.0 / name-tbd; no product/protocol/migration version scheme. |
| Release artifacts / hashes / signing | FAIL | No release artifacts, manifests, or signatures. Supply-chain requirement READY, not built. |
| SBOM / licences / attribution | PARTIAL (superseded 2026-11-03: SBOM, notices and the hybrid licence map PASS) | CycloneDX SBOM 161 components (Node and Python), generated notices, and real licence texts now exist; AI/model BOM and counsel sign-off remain open. |
| Security | FAIL | Strong architecture (default-deny, P25, redaction, path guards) but no release security audit, secret-scan evidence, or dependency-vulnerability review. Green tests != proof. |
| Privacy / data ownership | FAIL | No user-facing data-disclosure doc (what leaves the device); telemetry posture unstated. LOCAL-FIRST target, not evidenced. |
| Telemetry / network disclosure | FAIL | Same as privacy: no disclosure doc. |
| Consent (speech/media) | FAIL | Profiles require consent metadata; no enforcement proof; no human validation. |
| Offline / degraded operation | HUMAN_REQUIRED | Honest NOT_INSTALLED/UNAVAILABLE states exist; no offline behaviour matrix proven. |
| Hardware / platform matrix | PARTIAL (superseded 2026-11-04) | Web/PWA verified on one Windows host (i7-870); no supported-OS/arch/RAM matrix or native device evidence. |
| Windows / WSL / cross-platform | HUMAN_REQUIRED | Developed on Windows; no support matrix proven. |
| First-run UX | FAIL | No installer, no first-run surface. |
| Error handling | PARTIAL→FAIL | Honest errors exist; no release error-behaviour audit. |
| Recovery | PARTIAL (superseded 2026-11-04) | Web-bundle rollback drill PASS; no tested server-side recovery, migration, or native release path. |
| Observability | FAIL | Envelopes/logs exist; no release logging/redaction/rotation audit. |
| Evidence integration | FAIL | Primitives exist (envelope, gate, deliverable, audit); no end-to-end production enforcement proof. |
| Clean-Room impact | BLOCKED | REQ-p20-clean-room BLOCKED; required for higher assurance. |
| Model Fabric impact | BLOCKED | REQ-p18-model-fabric BLOCKED; launch needs local/limited-provider decision (owner). |
| Owner-gated release impact | OWNER_GATED | genesis-actuator, native-header-provenance, memory-integrity-boundary, regulated-evidence open. |
| Human UI testing | HUMAN_REQUIRED | Zero signed human validation (IDE create/edit/save/Git/build/run, navigation, errors, recovery). Automated != human proof. |
| Accessibility | HUMAN_REQUIRED | No audit for any UI. |
| Performance | PARTIAL (superseded 2026-11-04) | Web/PWA loopback p95 8.093 ms, p50 3.079 ms, p99 13.992 ms on one named host; no wide-area, client rendering, native, soak, or resource matrix. |
| Public documentation | FAIL | No public README/install/quickstart/troubleshooting/known-limitations set (BUILD-TODO is internal). |
| Support / issue reporting | FAIL | No version surface, diagnostics guidance, or known-issues doc for users. |
| Backup / export / delete | FAIL | User-data lifecycle untracked at release level; p17-owned-state IN_PROGRESS elsewhere (untouched). |
| Experimental labelling | FAIL | No systematic prerelease/experimental flags. |

Counts: PASS 2 (both *-qualified) · FAIL 21 · BLOCKED 3 · OWNER_GATED 4 (as items) · HUMAN_REQUIRED 5 · POST_V1 n/a (scope proposed) · UNMEASURED 1.

## 2. Release-critical gaps registered

- Public installer/packaging/update pipeline (new requirement; installer,
  first-run, update/migration/rollback for the defined scope).
- Everything else maps to existing BLOCKED (clean-room, model-fabric),
  READY (supply-chain/SBOM/signing), HUMAN_REQUIRED (UI/a11y/offline),
  or OWNER_GATED items. No duplicates.

## 3. Claim rule

NOT YET RELEASE-PROVEN: FAILs remain, BLOCKED items open,
OWNER_GATED release impact undecided, HUMAN_REQUIRED evidence
missing. No PUBLIC-RELEASE READY claim is made.
