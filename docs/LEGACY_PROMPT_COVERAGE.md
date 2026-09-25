# Legacy Prompt Coverage Ledger (2026-09-25)

Read-only reconciliation of older programme directives against the
current programme (101 requirements at audit time). Four parallel
audit agents; no files written by auditors; no builds run.

Conventions: one primary classification per item (EXACT, LIKELY,
RELATED, CONFLICT, SUPERSEDED, NEW, OUT_OF_CURRENT_RELEASE_SCOPE,
RESEARCH_ONLY) plus separate implementation state
(VERIFIED_IMPLEMENTED, PARTIAL, SPECIFICATION, PROTOTYPE_CODE,
BACKLOG, RESEARCH, EXPERIMENTAL, DEFERRED, BLOCKED, OWNER_GATED,
IN_PROGRESS_ELSEWHERE). `NO CURRENT COVERAGE FOUND` is stated
explicitly where true. Proposed action is NONE unless noted —
genuine gaps route through P16 classification only.

## A. Master requirements 1–1040

- Historical `.txt` source: SOURCE_NOT_FOUND as a file (census scripts
  read it via `AGENT_BRIDGE_REQUIREMENTS_SRC` env). Closest directive
  text: CONTINUOUS BUILD19 §30 (declares final ID 1040, ~960 records,
  801–880 discontinuity).
- Derived parse product FOUND and parsed: `Agent-Bridge/
  true_gap_index.json` — total_distinct 960, id_min 1, id_max 1040,
  missing 801–880 (80 IDs, confirmed, never manufactured).
- Sampled mapping (20 rows): 0 EXACT REQ-* hits; 13 RELATED, 7 NEW
  (all BACKLOG, action NONE), 3 RESEARCH_ONLY, 1 EXACT (Agent-Bridge
  inventory row itself), 1 CONFLICT-classified push rule (see §E),
  1 OUT_OF_CURRENT_RELEASE_SCOPE (workspace paths).
- New/backlog samples (networking foundations, RPA, low-code builder,
  universal connector, marketplace governance, web change detection,
  document discovery): NO CURRENT COVERAGE FOUND; NOT registered
  (no mass-registration; route via P16 only if later confirmed).
- Research-only samples (ocean twins, energy optimization, cross-scale
  modelling): RESEARCH_ONLY, no release claim.

## B. Repository inventory (~382 claim)

- No 382-row file located (claim exists only as prose). Closest:
  `Agent-Bridge/github_repos.txt` (200 TSV rows with
  name/description/visibility/fork/timestamp) plus
  `repos_categorization.json`, `repository_classification.json`,
  `AETHERIUS_REPOSITORY_REGISTRY.json` (LICENCE frequently UNKNOWN).
- Sample: Agent-Bridge EXACT/VERIFIED_IMPLEMENTED (active
  first-party); ComfyUI/9front RELATED fork-references (no fork
  taken); n8n RELATED dependency-candidate (fair-code noted,
  blind-fork forbidden); meson RELATED toolchain reference
  (STUDY_ONLY). Superseded/archive rows live in
  `SUPERSESSION_REGISTER.json` / `CONTRADICTION_REGISTER.json`.
- Count mismatch recorded; no forks/resurrections proposed.

## C. Environment / provisioning family

| Directive | Classification | State | Current mapping / delta |
|---|---|---|---|
| Environment & Provisioning Manager (discover→diagnose→plan→install/repair→verify→register) | RELATED | PARTIAL | Runners provision contract + targets (describe, never provision) + placement policy; delta: real install/configure/repair + verify/register lifecycle. Action NONE. |
| Machine Capability Registry (CPU→devices) | RELATED | PARTIAL | HardwareProfile (measured CPU) + ExecutionTargetProfile + compute signals; fabric IN_PROGRESS elsewhere (untouched); delta: OS/shells/WSL/distros/compilers/runtimes/SDKs/devices inventory. Action NONE. |
| Toolchain registry (compilers→provenance) | NEW | BACKLOG | NO CURRENT COVERAGE FOUND (toolRefs are bare requested ids). Genuine gap → registered (see §K). |
| DeviceCapabilityPassport | RELATED | IN_PROGRESS_ELSEWHERE | HardwareProfile + targets + fabric neighbor; exact mapping deferred to fabric owner, no duplicate. Action NONE. |
| System Adaptation Layer (6 dimensions, P20/P21/P24/P27/P30) | RELATED | BACKLOG | NO CURRENT COVERAGE FOUND (only InvocationAdapter/MCP/remote-desktop, none is resource adaptation). Delta recorded; monolith refused. Action NONE. |
| Kernel Capability Adapter / HAL / drivers; P24 ownership | OUT_OF_CURRENT_RELEASE_SCOPE | DEFERRED | NO CURRENT COVERAGE FOUND (sole HAL line aspirational). Action NONE. |
| Mixed-language project graph (C→manifests) | NEW | RESEARCH | NO CURRENT COVERAGE FOUND (depgraph.json is programme systems; test_impact is Python-only by design). Genuine gap → registered (see §K). |

## D. Service / execution families

| Directive | Classification | State | Current mapping / delta |
|---|---|---|---|
| Service orchestrator (install→recovery) | NEW | BACKLOG | NO CURRENT COVERAGE FOUND (P19 is workflow, not OS orchestration). Genuine gap → registered (see §K). |
| Tool Installation Manager (8-step lifecycle) | RELATED | PARTIAL | `installs.py` probe + gated-exec fragment + machine_capability read-only probing; no plan/policy/verify/rollback chain. Action NONE. |
| Build/artifact/release pipeline | RELATED | PARTIAL | build_pipeline.py + packages + deliverable + evidenceGate + promotion (skill-scoped); gaps already registered (supply-chain, artifact-library, deployment-profile). Action NONE. |
| Immutable kernel / signed update | OUT_OF_CURRENT_RELEASE_SCOPE | BACKLOG | NO CURRENT COVERAGE FOUND (Git discipline ≠ kernel safety). Action NONE. |
| HyperVM / VM-B | RELATED | PARTIAL | `vm-b` enum describes capability (REQ-p20-execution-target-profile); no backend. Action NONE. |
| Unified compute fabric | RELATED | PARTIAL | HardwareProfile + targets + placement fragments; no fabric join; fabric execution owned elsewhere (untouched). Action NONE. |
| Model availability inventory | RELATED | BLOCKED | Honest tri-states exist (ollama supports, speech NOT_INSTALLED, tokenizer UNKNOWN); no canonical inventory; P18 blocker inherits, no bypass. Action NONE. |
| Provider failover lifecycle | RELATED | PARTIAL | Ranked order + logged fallback exist; DIAGNOSE→ADAPT→RETRY engine missing. Action NONE. |
| Build-loop enforcement as code | RELATED | PARTIAL | Steward/promotion/gates/audit fragments; no platform law. Per-directive PARTIAL/SPECIFICATION bucket. Action NONE. |
| Bridge entry-point governance | LIKELY | PARTIAL | Fail-closed/policy/journal/audit proven on covered entries (gate-compat 186/186, detexec 15, MCP/webhook/remote/audit suites); every-entry inventory unproven. Action NONE. |
| Owner-full-control grant | EXACT | VERIFIED_IMPLEMENTED | `owner_full_control.py` + `ownerProfile.ts` (closed V1 vocabulary, owner-only, scoped/session-tagged/revocable/expiring/audited, workers never inherit, protected categories). Action NONE. |
| Parent/Child/Grandchild network model | NEW | BACKLOG | NO CURRENT COVERAGE FOUND (Genesis-side guards reject the anti-pattern; OS network model absent). Genuine gap → registered (see §K). Must never be built as Genesis identities. |

## E. Push rules / workspace constraints

- Automatic build/test/verify/commit/push/verify-remote: CONFLICT vs OWNER_GATED push truth (select.ts gates, programme.json deny-rule). Rule supplanted, not a gap. Action NONE. Nothing pushed.
- Machine-specific absolute workspace roots: OUT_OF_CURRENT_RELEASE_SCOPE (historical dev-environment constraints; release paths must be portable). Action NONE.

## F. Comms / supply-chain / specialist / app families

- Comms: realtime EXACT/VERIFIED_IMPLEMENTED; async/remote RELATED PARTIAL; local RELATED; device IN_PROGRESS_ELSEWHERE (untouched); degraded-link + messaging EXACT/RESEARCH (registered, not built); repo-relay RELATED (repo-only, not comms-relay). No second fabric.
- Supply chain: SBOM/AI-BOM/signatures EXACT/RESEARCH (REQ-p25-supply-chain, absent per its own evidence); dependency inventory LIKELY/PARTIAL; source/builder/toolchain RELATED/PARTIAL (promotion/packages/deliverable fragments); hashes RELATED (scoped); provenance RELATED/PARTIAL; transparency log EXACT/BACKLOG (no coverage); rollback RELATED (scoped proofs only).
- Universal-Bridge: MIDI 1 + VST3 EXACT/EXPERIMENTAL (repo reality, gated); MIDI 2/UMP/CI + CLAP RESEARCH_ONLY/BACKLOG (no code); hardware bridging LIKELY/EXPERIMENTAL (bounded probes, live use gated); UB != Agent Bridge upheld (SPECIFICATION).
- Poietek: load/save + undo + crash/recovery EXACT/VERIFIED_IMPLEMENTED; audio engine + MIDI LIKELY/PARTIAL (working local parts, explicit non-claims); render/automation/timing/corruption RELATED/PARTIAL; plugins OUT_OF_CURRENT_RELEASE_SCOPE/BACKLOG; XRUN RELATED/EXPERIMENTAL (no DAW XRUN coverage — UB WASAPI counters only); determinism LIKELY/PARTIAL. App control != DAW implementation upheld.
- IDE human-use: create/edit/save/Git/build/run RELATED/PARTIAL (procedure exists, no signed human-retest record); launch/navigate/recovery RELATED/PARTIAL; accessibility RESEARCH_ONLY (no IDE coverage); performance RELATED/RESEARCH. Human validation gate: BACKLOG. Automated green != human proof.
- App verticals: no P28 REQ IDs; social/blog/communities/chat OUT_OF_CURRENT_RELEASE_SCOPE/BACKLOG (POST_V1); ecommerce/finance/wallet SEPARATE_PRODUCT (econ/legal gates; treasury DEFERRED); learning/jobs RESEARCH_ONLY; search RELATED/IN_PROGRESS_ELSEWHERE (POST_V1); procurement/robotics/twin OUT_OF_CURRENT_RELEASE_SCOPE/RESEARCH. None is CORE_PUBLIC_RELEASE.
- Blockchain/economy: staking/treasury/marketplace OUT_OF_CURRENT_RELEASE_SCOPE/DEFERRED (treasury DEFERRED); reward/reputation/governance RELATED/RESEARCH (requirements only, no code); chain RELATED/RESEARCH (catalogue entries, not chains); Genesis-independence EXACT/VERIFIED_IMPLEMENTED.
- Identity/wallet: user RELATED/PARTIAL; AI EXACT/VERIFIED_IMPLEMENTED; chain/wallet OUT_OF_CURRENT_RELEASE_SCOPE/BACKLOG (no wallet; masterSpec PQC claims SUPERSEDED by registry truth); grants RELATED/PARTIAL; recovery RELATED/BACKLOG; heirship NO CURRENT COVERAGE FOUND; wallet!=Genesis EXACT/VERIFIED_IMPLEMENTED.
- Reference projects: OpenClaw reference-only; Lobster superseded / ClawHub incorporated (discovery + packages PROVEN); ClickClack incorporated (realtime PROVEN, live peer deferred); ClawSweeper incorporated (steward PROVEN); CrabFleet/CrabBox incorporated with correction (remote-desktop + runners PROVEN); OctoPool incorporated (relay PROVEN); OmniAgent reference-only. All MIT STUDY_ONLY, no forks. Do NOT fork upheld.

## G. Counts (this audit round)

- Directives audited: 28 (master/inventory/rules) + 7 (env/machine) + 12 (service/execution) + ~45 (comms/supply/UB/Poietek/IDE/apps/chain/identity/refs) ≈ 92 rows.
- Classifications: EXACT 8, LIKELY 5, RELATED ~45, CONFLICT 1, SUPERSEDED 1 (masterSpec wallet claims), NEW 12, OUT_OF_CURRENT_RELEASE_SCOPE ~12, RESEARCH_ONLY ~8.
- Proposed action NONE throughout except §K registrations.
- Duplicates avoided: no second fabric/store/registry/router/platform; no mass-registration (960-record file sampled, not imported); no blind forks; no IN_PROGRESS-elsewhere contact; no BLOCKED/GATED bypass.

## H. Discrepancy found and resolved

`docs/masterSpec.ts:38,125` claims PQC wallet + Phase-1 chain/wallet Complete — CONFLICTS with registry truth (treasury DEFERRED, wallet BACKLOG). Registry wins: masterSpec treated as stale SPECIFICATION, SUPERSEDED by P16 programme truth. Recorded, not edited (owner decision required to normalize docs).

## K. Genuine gaps registered from this audit

1. Toolchain registry (versions/paths/availability/provenance) — NEW/BACKLOG.
2. Mixed-language project graph — NEW/RESEARCH.
3. Parent/Child/Grandchild network model — NEW/BACKLOG (never Genesis identities).
4. Service orchestrator lifecycle — NEW/BACKLOG.
(IDs, owners, dependencies in registry; validation + selector per loop.)
