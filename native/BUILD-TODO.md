# Aetherius Full Build — 2026-09-21

## MASTER PROGRAMME (P0–P31, preserved 2026-09-21 — do NOT truncate to P0–P15)
P0 recovery → P1 baselines → P2 contracts → P3 host/runtime+RB → P4 organism/cognition → P5 bridge integration → P6 MAT → P7 IDE loopback → P8 UB/Poietek → P9 VM-B → P10 shell/services → P11 native OS → P12 apps/search → P13 quality → P14 E2E → P15 provenance/bench → P16–P31 RESERVED EXISTING CANONICAL PHASES REQUIRING SOURCE RECOVERY (do not invent; recover from BUILD-TODO.md/docs/git-history/handoffs). Recovery is a bounded doc unit; it does not preempt engineering.
### P16-P31-RECOVERY — PENDING (low): search BUILD-TODO.md, docs, .git history, milestones, handoffs, READMEs for exact P16..P31 names/requirements; record registry without renumbering.

## CONTINUOUS BUILD STATE (HARD LOOP CONTROLLER)
CONTINUOUS_BUILD_ACTIVE = YES
OVERALL_BUILD_COMPLETE = NO
RETURN_TO_OWNER_ALLOWED = NO
CURRENT_ACTIVE_PHASE = P10-PROVIDERS -> P12-ECOSYSTEM (transition)
CURRENT_ACTIVE_TODO = BRIDGE-HANG verdict recorded; NEXT = BRIDGE-GATE-COMPAT (session-scoped grants + test updates, landed together)
NEXT_EXECUTABLE_TODO = BRIDGE-GATE-COMPAT/1: design session-scoped workspace grants at session start (approval mode = owner pre-auth); then update failing runtime tests file-by-file; full-suite re-measure at end
LAST_VERIFIED_COMMIT = Aetherius-OS 2091cf5 (warnings gone; 86/86) + Genesis 0e5c475
LAST_REMOTE_VERIFIED_COMMIT = Aetherius-OS 2091cf5 + IDE d5db272 pushed; Agent-Bridge d7c1277 + Genesis 6 commits LOCAL (push blocked: env deny-rule on main)
### P13-WARN — DONE (bounded): removed exactly the 7 compiler-verified unused imports; 86/86 pass with zero warnings (remaining profiles note is pre-existing workspace nit).
### P4-PREDERR — DONE (bounded): only loop.hpp/loop.cpp + loop test consume the stage enum; resolve_prediction wired post-OBSERVE with digest evidence; refuted path proven (counterevidence==1); MSVC build + ctest PASS. PUSH BLOCKED: repo=Genesis branch=main SHA=d930d22 blocker=environment deny-rule on main (owner: run `git push origin main` in Projects/Genesis from a permitted shell). Missing set now exactly 7 _na: interoception, mental_state, drive, goal, plan, action, allostasis.
### P4-INTERO — DONE (bounded): InteroceptiveSnapshot (fill/pressure/error/tick + digest) populated pre-update at perceive position; late reactive homeostasis untouched; empty-fill + evaluated-level + digest assertions; MSVC build + ctest PASS. PUSH BLOCKED: repo=Genesis branch=main SHA=bac7aa1 (same owner push command). Missing set now exactly 6 _na: mental_state, drive, goal, plan, action, allostasis.
### P4-ALLOSTASIS — DONE (bounded): driver-owned bounded fill history (cap 8) + 4-step projection evaluated through existing controller; armed only when projection strictly worse than live level (action stays missing by design elsewhere); armed-before-breach proven on capacity-8 fixture (fill 0.75 nominal, projection 1.25 critical); MSVC build + ctest PASS. PUSH BLOCKED: repo=Genesis branch=main SHA=ea0bb8d (same owner push command). Missing set now exactly 5 _na: mental_state, drive, goal, plan, action.
### P4-DRIVE — DONE (bounded): loop-local Drive{name,urgency} selected from interoceptive levels + prediction_issued (critical/high conserve, no-prediction resolve-uncertainty, else consolidate; low_warning correctly non-threatening); precedes safety gate per agency pipeline; one adapt cycle (band-semantics + hypothesis-less fixture); MSVC build + ctest PASS. PUSH BLOCKED: repo=Genesis branch=main SHA=d26875a (same owner push command). Missing set now exactly 4 _na: mental_state, goal, plan, action.
### P4-GOAL — DONE (bounded): loop-local Goal{description,priority} committed from drive (conserve→reduce pressure, uncertainty→gather evidence, else consolidate traces; priority inherits urgency); planning-how stays later; MSVC build + ctest PASS. PUSH BLOCKED: repo=Genesis branch=main SHA=58376e2 (same owner push command). Missing set now exactly 3 _na: mental_state, plan, action (action: no actuator by design).
### P4-MENTAL — DONE (bounded): MentalState{admitted,inhibited,mean_confidence,uncertainty+digest} from ConsciousWorkspace::introspect over already-bound workspace (no ctor change, no invented affect; AffectRegulator binding honestly deferred); admitted==focus + bounded-uncertainty + digest assertions; MSVC build + ctest PASS. PUSH BLOCKED: repo=Genesis branch=main SHA=0e5c475 (same owner push command). Missing set now exactly 2 _na: plan (BLOCKED: needs action catalog/actuator repertoire — genuine architecture decision), action (missing by design: no actuator).
### P15-PROVBENCH — DONE (bounded): perf.rs floors (policy 20k evals, MAT 2k queries, storage 2k reads, each <10s; suite 0.07s); regression net for production bar
### P14-E2E-FAIL — DONE (bounded): found bridge gate was allow-stub; wired evaluate_capability_request/check_capability to shared default-deny engine (stable Subject identity, true singleton); tests 4/4 (deny-before-execution, grant-allows, subject-scoping, MAT unknown→found=false); adjacent binding+terminal 14/14 no regression. PUSH BLOCKED: repo=Agent-Bridge branch=main SHA=d7c1277 cmd=`git push origin main` blocker=environment deny-rule on main (owner: run from permitted shell). Local commit preserved.

## COMPLETED PHASES

### P0-P11: FOUNDATION COMPLETE
- **P0**: Repository recovery & reconciliation (DONE)
- **P1**: Canonical build baselines for all 7 repos (DONE)
- **P2**: Shared contracts (DONE)
- **P3-HOST**: Genesis runtime host (DONE)
- **P3-RB**: Rollback demonstration (DONE)
- **P4**: Genesis organism loop wiring (9 stages wired, 7 missing) — DONE
- **P5**: Agent Bridge integration (DONE)
- **P6**: MAT knowledge connector (DONE)
- **P7**: Genesis Presence + IDE integration (DONE)
- **P8**: Universal-Bridge + Poietek integration (DONE)
- **P9**: VM-B compute routing (DONE)
- **P10**: Aetherius hosted system shell (DONE)
- **P11-INT**: IDT/int3/PIC/PIT/200-tick proof (DONE, commit d9f7789)
- **P11-SCHED**: Cooperative round-robin scheduler with GPR+FXSAVE context switch (DONE, commit 1c1ab1d)
- **P11-USER**: GDT+TSS+SYSCALL/SYSRET + CPL3 user stub (commit a835e35)

### VERIFIED MILESTONES
- **P11-INT**: IDT/int3/PIC/PIT/200-tick proof (d9f7789)
- **P11-SCHED**: Cooperative scheduler with GPR+FXSAVE context switch, fixed stacks, CR4 FPU enable; tasks A/B alternate 3 rounds each, all_done=true, switches=9 (commit 1c1ab1d)
- **P11-USER**: GDT+TSS+SYSCALL/SYSRET + CPL3 user stub proven; QEMU PASS (commit a835e35)
- **Policy Engine**: RBAC/ABAC with PermissionId, RoleId, Subject, ResourceId, Grant, Condition, Role, Decision, EvalContext, PolicyEngine; host tests 16/16 PASS; MAT query service integrated (commit d9f7789)

### VERIFIED BENCHMARKS (Windows MSVC, x86_64-unknown-uefi)
- Genesis core: ~17.5k events/sec
- Genesis runtime: ~3.5k events/sec
- Memory: 10k-node build ~2.9s, 100 queries 0.16s
- Organism signals: 100k/8.4s = 11.9k/s
- UEFI boot: controlled halt after 200 ticks @ 100Hz

### VERIFIED SMOKE MARKERS
```
AETHERIUS-BOOT v0.1.0 x86_64-uefi
MEMMAP: regions=
ALLOC: total_frames=
INT: breakpoint OK
TIMER: irq_ticks=200 firmware_ticks=0 spins=200
TICKS: 200 ~= 2000ms @100Hz
SCHED: task A round 0-2
SCHED: task B round 0-2
SCHED: switches=9 all_done=true
AETHERIUS-HALT: controlled halt
```

### P10-PROVIDERS (IN_PROGRESS — 72/72 host tests)
- Provider framework with registry ✓
- Identity & Profile system ✓
- Policy Engine (RBAC/ABAC) ✓
- MAT query service ✓ (mat_query.rs 6/6)
- Policy → Agent Bridge integration ✓ (P10-PA 7be15dd)
- MAT query service → Genesis integration ✓ DONE (mat_genesis.rs 8/8: request/receive/real-data/contract/provenance/evidence/uncertainty/error)
- File/Storage provider ✓ DONE (storage.rs 10/10: allowed/denied read/write, missing, invalid, traversal, read-only, policy-unavailable, audit)
- Settings/Config provider ✓ DONE (settings.rs 8/8: defaults/user/app/env, validation, secrets-reject, privileged-policy, reset, migration)
- Search provider ✓ DONE (search.rs 3/3: adapters apps/files/MAT/settings/commands, rank, deny-filter)
- Notification provider ✓ DONE (notifications.rs 4/4: send/list/unread/expiry/recipient-isolation)
- Application registry ✓ DONE (appreg.rs 3/3: IDE/MAT/Poietek canonical, metadata, health)
- Plugin/Adapter framework ✓ DONE (plugins.rs 4/4: register/duplicate/dep/policy-gate)
- Media abstraction ✓ DONE (media.rs 2/2: provenance/permissions/kind-filter)
- Communication core ✓ DONE (comms.rs 3/3: open/post/presence/non-participant-deny)

### P10-CORE = DONE (81/81 host tests — P12 apps can use identity/policy/apps/files/settings/search/notify/Genesis/Bridge/MAT)
### P12-APPLICATION-ECOSYSTEM = IN_PROGRESS (first proof: football-card-game)
### P12-FCG — DONE (bounded): design inspected (16x8 pitch, 4 zones, chess-movement, 4 card types); reference impl EXISTS in Temp/Repository-Reconciliation/football-card-game (tsx+docs+blockchain-js+devops); registered in AppRegistry as 4th canonical app with shared-service endpoints (storage/settings/notify/search), no rebuild, no forced blockchain; 82/82 host tests
### P12-APPSEARCH — DONE (bounded): SearchProvider::index_applications wires AppRegistry → shared search; all 4 canonical apps discoverable with provenance; 83/83 host tests
### P12-IDE-DEBT — DONE (bounded): IDE Terminal.tsx pwd now canonical Projects path (IDE d5db272, tsc --noEmit clean); untracked .bridge/__pycache__ residue left uncommitted per directory policy
### P10-PROVIDERS (IN_PROGRESS — 72/72 host tests)
- Provider framework with registry ✓
- Identity & Profile system ✓
- Policy Engine (RBAC/ABAC) ✓
- MAT query service ✓ (mat_query.rs 6/6)
- Policy → Agent Bridge integration ✓ (P10-PA 7be15dd)
- MAT query service → Genesis integration ✓ DONE (mat_genesis.rs 8/8)
- File/Storage provider ✓ DONE (storage.rs 10/10)
- Settings/Config provider ✓ DONE (settings.rs 8/8)
- Search provider ✓ DONE (search.rs 3/3)
- Notification provider ✓ DONE (notifications.rs 4/4)
- Application registry ✓ DONE (appreg.rs 3/3)
- Plugin/Adapter framework (NEXT)
- Media abstraction
- Communication core

### P10-PA — DONE
Policy → Agent Bridge integration completed. Policy engine evaluation gate added before standard approval gate. All 10 acceptance criteria met:
1. Explicitly allowed capability succeeds
2. Explicitly denied capability never reaches execution
3. Default-deny behavior works
4. Role-based grant works
5. Attribute condition works
6. Revoked grant stops access
7. Device-trust condition honored
8. Audit receipt records policy decision
9. Policy-engine failure defaults safely
10. Existing Agent Bridge test suite does not regress

### MASTER HANDOFF COVERAGE — ADDED 2026-09-21 (from GENESIS/AGENT-BRIDGE/AETHERIUS/MAT docs)
Source: user master-prompt handoffs (Genesis master chat, Aetherius ecosystem handoffs, YouTube research).
Status vocabulary: EXISTS / PARTIAL / MISSING / DUPLICATE / LEGACY / CONFLICTING / EXPERIMENTAL / RESEARCH / DEFERRED.
- D-GENESIS-ROLES: role/capability templates (AI-employee conversion) — PARTIAL (policy roles exist; templates MISSING)
- D-GENESIS-EVAL: capability eval/benchmarks (reasoning/coding/tool/memory/safety) — MISSING
- D-GENESIS-EPISTEMIC: evidence classes ESTABLISHED/SUPPORTED/EXPERIMENTAL/HYPOTHESIS/etc + provenance — PARTIAL (MAT evidence_class+provenance DONE; Genesis-wide engine MISSING)
- D-BRIDGE-PROTOCOLS: MCP/A2A/OpenAPI/REST/JSON-RPC/GraphQL/WS/gRPC/IPC/device adapters — PARTIAL (P10-PA gate DONE; registry MISSING)
- D-MAT-EVIDENCE: measured/calculated/predicted/hypothesis/speculative + uncertainty — PARTIAL (native connector DONE; full MAT100% MISSING)
- D-P10-SERVICES: shared identity/policy/storage/search/notify/settings/appreg/media/comms — PARTIAL (7/10 native DONE; plugin/media/comms NEXT)
- D-P10-ENTITIES: Identity/Profile/Org/Post/Message/Product/Order/Course/Job/Event/Wallet/etc — DEFERRED (create as apps require)
- D-POLICY-ENGINE: RBAC/ABAC/PBAC/capabilities/least-privilege — PARTIAL (RBAC/ABAC DONE; PBAC/cap-tokens NEXT in P13)
- D-AUDIO-ROUTE: MIDI/MPC/VST3/AU/endpoints/BT/WiFi/latency/clock — DEFERRED to Universal-Bridge/Poietek
- D-P12-GROUPS: football-card-game as first external P12 proof — MISSING (after P10-CORE)
- D-P12-WORKFLOWS: learning→cert→CV→job; product→MAT→CAD→mfg — DEFERRED to P12
- D-P12-SIFDAT: legacy marketplace/course/job/reward schemas — RESEARCH
- D-P13-SECINFRA: sandbox/encryption/secret-isolation/audit/supply-chain/signed-builds — PARTIAL (audit receipts DONE; rest in P13)
- D-FUTURE-REWARD: points/token/treasury/staking/governance — DEFERRED (needs econ/legal gates)
- D-FUTURE-RND: pots/funding/milestones/verification — DEFERRED
- D-FUTURE-HEALTH: dashboard/genetics/wearables/3D-DNA — DEFERRED (high-risk validation required)
- D-FUTURE-RF: WiFi/CSI/RSSI sensing, presence — RESEARCH
- D-FUTURE-GAMES: CryptoMonopoly/MMO/procedural worlds — DEFERRED (shared infra first)
- P4-GAPS: 7 missing organism-loop stages — MISSING (tracked, after P10-CORE)
- P11-DEBT: uefi panic_impl, duplicate-def warnings — MISSING (bounded, non-blocking)
- P14-E2E: expand MAT→envelope→host to full user→Aetherius→Genesis→policy→Bridge→app loop — PARTIAL (1/1 PASS; expansion NEXT after P12 start)
- P15-BENCH: policy/MAT/Bridge/provider/search/storage/startup benches + Genesis capability eval — PARTIAL (baselines recorded; new benches NEXT)

### BRIDGE-HANG VERDICT 2026-09-21 (OBSERVE+DIAGNOSE, full evidence)
- NO infinite hang: `python -m unittest discover -s tests -t . -b` COMPLETES: 1066 tests / 404s / failures=41 errors=6 skipped=1. Historical "hang" = slowness + observer timeouts. Reframed: BRIDGE-SLOW (future: fast/slow lane split).
- SELF-CORRECTION: P14-E2E-FAIL "no regression (14/14)" claim OVERTURNED by full-suite evidence. ~30 failures caused by wiring the bridge gate to default-deny: runtime tests drive bridge.run() with fake models and no grants, so every write/edit/test/list is POLICY-DENIED. Targeted regression sampling was insufficient — full suite is the bar.
- PRE-EXISTING/ENV (not gate-caused): Ollama-dependent (fallback_skips_dead_model, ollama_protocol_detection, inventory_shape, models_sessions_schema, diagnostics ollama FAIL, unavailable_model_surfaced_honestly, live_rotation_granite_to_qwen), phase1 02 CERT artifact (baseline TBD), secret_hygiene .bridge (SUITE-CREATED residue taskcenter.json 11:47 during this run; removed; test is order-dependent by design).
- 6 ERRORs (dryrun_replay x2, execution_contract, phase1 12_worker, routing_review revise_then_approve, runtime_api idempotent_submit) need attribution next cycle from saved output.
- DECISION: KEEP Agent-Bridge d7c1277 local (hole stays closed; 4 new gate tests green). NEXT = BRIDGE-GATE-COMPAT: session-scoped workspace grants issued at session start (approval mode AUTO_SAFE etc. = owner pre-authorization) + update tests asserting pre-gate error kinds (ADMIN_REQUIRED, NO_PROGRESS_*, etc.); land gate+compat TOGETHER; re-measure full suite at end. Do NOT revert to allow-stub.

### KNOWN ISSUES
- Test execution on UEFI target blocked by `panic_impl` conflict (uefi vs std)
- `aether-boot` test fails due to `panic_impl` conflict between `uefi` and `std` crates
- Agent-Bridge full suite slow (~404s/1066 tests); 41F+6E (see verdict: ~30 gate-compat, ~10 env/pre-existing, 6 errors TBD)

### BLOCKERS
- None currently blocking main build. Test execution on UEFI requires separate test runner.

### REQ-p16-capability-graph — DONE 2026-09-26 (read-only capability view)
- `src/programme/capabilityGraph.ts`: `CapabilityView` (deterministic queries list/byId/byOwner/byRequirement/byAdapter/byTarget/byGrant/withEvidence/withoutEvidence), `validateCapabilityNode`, `lintView`, `composeCapabilityView`. Deep-copies on construct and on every read; validates all nodes; rejects duplicate capability ids.
- A VIEW, not a second registry and not a second execution fabric: no canonical capability records, no minted ids (`skill:<id>@<version>`, `app:<id>:<capability>`, `target:<id>`, `hardware:<id>`), no mutate/authorize/execute/install/provision/merge/delete/update surface. Authorization stays P25; execution stays REQ-desktop-capability-fabric, whose data is never read or written.
- Latency is measured evidence only (`latencyMs` + required `latencySource`); absent stays absent. Unrecognised `risk_class` becomes `unknown`, never `low`. `lintView` reports only dimensions supplied as known — unchecked is not missing, and nothing is dropped or auto-filled.
- SELF-CORRECTION: the targeted capability-graph test was reported failing 6 consecutive runs with "expected ['skill:review@1.0.0'] to deeply equal Array(2)". Cache-removal/`--force-rerun` hypotheses were WRONG — the vitest cache was never the cause. Actual root cause: the test fixture's second node overrode only `capabilityId`/`owner`, so it inherited every default ref array and matched all five dimension queries. Fixed by giving the app node its own refs and no evidence; 6/6 pass.
- Gates: `vitest run src/programme/capabilityGraph.test.ts` 6/6; full `npm test` 442/442 (47 files); `npm run typecheck` clean; `npm run build` clean (46 modules); `npm run registry:validate` 73/73. Lint gate NOT_APPLICABLE (package.json defines no lint script or config — absence, not a pass).
- Registry: REQ-p16-capability-graph RESEARCH -> PROVEN, work_state READY -> COMPLETE. Selector retargeted in `src/programme/programme.test.ts` and `src/state/state.test.ts`; NEXT_EXECUTABLE_TODO = REQ-p16-change-cohort-review. Push remains owner-gated; not pushed.

### REQ-p16-change-cohort-review — DONE 2026-09-26 (batch review over change cohorts)
- `src/steward/cohorts.ts`: `cohortStateId`, `validateCohort`, `planCohortBatches`, `summarizeCohort`, `CohortReviewStore` (kind `steward.cohort`, provenance `p16-change-cohort-review`). Exported from `src/steward/index.ts`; documented in `docs/change-cohort-review.md` and added to the `docs/steward.md` component table.
- REUSE, NOT DUPLICATION: member verdicts are read verbatim from stored `StewardReport.readiness`. Cohorts never call `evaluateReadiness` themselves — one verdict vocabulary, one producer. Members are `ReviewTarget`s keyed by the existing `reportStateId`.
- HONEST UNKNOWN: a member with no stored report is `unknown`, and a cohort containing one is `unknown` — omission is never upgraded to `ready`. Rollup precedence: any `not_ready` wins; else any `unknown`; else `ready`. So one blocking member outranks an unreported one.
- ADVISORY ONLY: every rollup carries `merge_authority: false`. Validation additionally rejects any input report whose readiness claims `merge_authority` — a report asserting authority it can never hold is hostile input, not a fact. No grant/merge/approve/authorize surface (tested on module exports, the store prototype, and rollup values).
- `CohortReviewStore` mirrors `StewardReportStore` discipline: integrity hashes, optimistic concurrency, append-by-revision with `createdAt` preserved, cohort-id drift rejected on update, and invalid cohorts fail before any state is written.
- SELF-CORRECTION: the first version fabricated `createdAt` via `new Date(0).toISOString()` when creating a cohort record. That invents evidence and violates the house honesty rule; the payload now carries a caller-supplied `generatedAt`, which is also validated. Also fixed an `??`/`||` precedence bug in the default batch size.
- SCOPE BOUNDARY: change fingerprinting, touched paths and impact analysis stay with `TouchEstimate` (src/workers/touch.ts) and the pending `REQ-p20-change-impact`. A cohort composes verdicts; it does not estimate changes. `src/programme/readiness.ts` (autonomy readiness) is a different P16 requirement and was not touched.
- Gates: `src/steward/cohorts.test.ts` 19/19; full `npm test` 461/461 (48 files, up from 442/47); `npm run typecheck` clean; `npm run build` clean; `npm run registry:validate` 73/73. Lint gate NOT_APPLICABLE (no lint script or config in package.json).
- Registry: REQ-p16-change-cohort-review RESEARCH -> PROVEN, work_state READY -> COMPLETE. Selector retargeted; NEXT_EXECUTABLE_TODO = REQ-p16-governance-proposals. Push remains owner-gated; not pushed.

### REQ-p16-governance-proposals — DONE 2026-09-26 (governance proposal fabric)
- `src/programme/proposals.ts` (sibling of `inventions.ts`, the other append-only P16 registry): `proposalIdFor`, `proposalVersionRef`, `proposalStateId`, `buildProposal`, `validateProposal`, `registerProposal`, `proposalDecision`, 8 deterministic queries, `supersessionChain`, `ProposalStore` (kind `governance.proposal`).
- SCOPE DISCIPLINE: the registered description names the chain "proposal to review to vote to funding to milestones to evidence to staged release". This unit implements the FIRST LINK only. Stage vocabulary is derived from the requirement's own chain (PROPOSED/REVIEW/VOTE) plus WITHDRAWN/SUPERSEDED — not invented from a prompt. FUNDING/MILESTONES/EVIDENCE/STAGED_RELEASE are named by the requirement but are NOT implemented and are NOT reachable states: they belong to REQ-p25-reward-treasury (DEFERRED), milestone tracking, REQ-p16-evidence-graph (COMPLETE) and REQ-p31-release-scope (OWNER_GATED).
- PROMOTION IS A TEMPLATE, NOT A REUSE, exactly as the requirement states. A skill candidate is promoted by a promotion policy; a governance proposal is only ever recorded. Nothing is promoted, applied, merged or deployed.
- PRESERVED DISTINCTIONS (all tested): PROPOSAL != DECISION; DECISION != AUTHORIZATION; APPROVAL != EXECUTION; PROPOSER ROLE != AUTHORITY; PROPOSAL RECORD != SIDE EFFECT; ABSENCE OF A DECISION != APPROVAL; STEWARD REPORT != GOVERNANCE DECISION; COHORT REVIEW != GOVERNANCE APPROVAL.
- NO AUTHORITY FIELDS BY ACCIDENT: a record carrying authorized/authorize/execute/merge_authority/canMerge/canDeploy/grantApproved/policyBypass/ownerOverride/approvalGranted/applied is REJECTED. A proposal that can express its own authority is a proposal that can grant it. The stage vocabulary contains no APPROVED, AUTHORIZED, APPLIED, PROMOTED, EXECUTED, GRANTED, FUNDED or RELEASED state.
- DECISIONS ARE REFERENCES: `decidedByRef` points at whoever actually decided; `SUPPORTED` means that mechanism recorded support, not approval and not permission to act. A decision is required at VOTE and forbidden at every other stage. `proposalDecision()` returns "NO_DECISION_RECORDED" when absent — absence is never read as approval. `decidedAt < createdAt` is rejected as a temporal conflict.
- NO VOTING ENGINE: no tally, ballot, voter set, quorum, delegation, staking or DAO consensus surface. The VOTE stage records a decision REFERENCE, never a count. Confirmed by search: none of this vocabulary existed anywhere in src/ before this unit.
- IMMUTABLE HISTORY: same id+version+content -> identical; different content -> conflict; higher version -> amendment registered with the prior version retained verbatim; lower version -> conflict. `createdAt` is part of compared content because a timestamp is evidence. Rejected/withdrawn/superseded proposals are never deleted.
- NO RAW SECRETS: credential keys rejected (mirroring `assertSecretReferenceShape` in src/state/types.ts) and free text scanned for credential assignments (mirroring `staticSafetyScan` intent in the completed P19 promotion module, whose patterns are private, so a small local subset is used rather than editing a completed requirement).
- NO FABRICATED TIMESTAMPS: `createdAt`/`decidedAt` are caller-supplied and ISO-validated. This module never calls a clock.
- P25 / OWNER GATES UNTOUCHED: authorization stays with `src/policy/ownerProfile.ts` (effectiveDecision, default-deny). A proposal may reference an owner-gated decision or request owner action but cannot convert OWNER_GATED -> COMPLETE; recording a proposal about REQ-p31-release-scope is not the owner deciding release scope, and this unit does not decide it.
- REQUIREMENT REGISTRY UNTOUCHED: no runtime mechanism in this repo mutates a requirement status/work_state, and none was added. Proposal Registry != Requirement Registry. Capability Graph stays a read-only view; EvidenceGraph is not written into (evidence stays opaque `evidenceRefs: string[]`, per repo convention).
- SELF-CORRECTIONS (both caught by the new tests, both real):
  - `proposalIdFor` used `/[^a-z0-9]+/` WITHOUT the `g` flag, so only the first non-alphanumeric run was replaced and slugs kept spaces ("gov-define-release scope"), which would then have failed id validation. Fixed to a global regex.
  - The deterministic-order comparator was declared as a FACTORY (`function byId(records) { return (a,b) => ... }`) but passed straight to `.sort()`. `sort` then received a function where a number was expected, `Number(fn)` = NaN, NaN is treated as 0, and the list was NEVER SORTED — silently returning insertion order. Replaced with a direct `compareProposals(a, b)` comparator. This is the same class of defect as the earlier operator-precedence error: a defaulting/ordering detail that is a correctness concern, not a style concern.
- Gates: `src/programme/proposals.test.ts` 32/32; related `src/programme src/steward` 141/141; full `npm test` 493/493 (49 files, up from 461/48); `npm run typecheck` clean; `npm run build` clean (46 modules); `npm run registry:validate` 105/105 (9 files, up from 73/8). Lint gate NOT_APPLICABLE — verified no lint script in package.json (scripts: dev, build, preview, typecheck, test, registry:validate) and no eslint/biome/oxlint/tslint/stylelint/prettier config anywhere outside node_modules/.git/dist. No linter was introduced.
- Registry: REQ-p16-governance-proposals RESEARCH -> PROVEN, work_state READY -> COMPLETE. Selector retargeted; NEXT_EXECUTABLE_TODO = REQ-p16-review-context-pack (the last remaining P16 READY item; the only other P16 entry is REQ-native-header-provenance, OWNER_GATED). Push remains owner-gated; not pushed.

### REQ-p16-review-context-pack — DONE 2026-09-26 (bounded reviewer context projection)
- `src/programme/reviewPack.ts`: `PACK_DIMENSIONS` (exactly the 7 registered join legs), `packIdFor`, `validateReviewContext`, `buildReviewContextPack`, `packChangedFiles`, `packTouchComparison`, `packRequirementContext`, `packUnresolved`, `DEFAULT_PACK_MAX_ITEMS`.
- JOIN, NOT NEW OWNER: the requirement says "parts exist separately, no joined pack". Every leg is projected from an existing authoritative source and referenced, never copied into new canonical records: diff from `WorkspaceDiff` (src/runners/sync.ts), touch from `TouchEstimate` (src/workers/touch.ts), verification from the existing `VerificationState` vocabulary (src/workflows/deliverable.ts), policy/capability as opaque refs into `CapabilityNode` (src/programme/capabilityGraph.ts), provenance as caller-declared structured `PackSource` records rather than flattened prose.
- PATH SAFETY REUSED, NOT DUPLICATED: changed paths are validated with the already-EXPORTED `assertSafePath` from src/runners/sync.ts. A third private copy of the traversal rule was deliberately avoided. (The repo does now contain two hand-copied implementations of this rule — sync.ts:31 and the private isSafePath in touch.ts:49 — which remains a pre-existing duplication outside this unit's scope.)
- THE IMPACT LEG IS HONESTLY UNAVAILABLE, AND THIS IS THE KEY FINDING: there is NO code-level dependency graph in this repository. registry/depgraph.json is SYSTEM-level (10 nodes: aetherius-os, agent-bridge, mat, ide, ... — no file/module/symbol ids); there is no depgraph.ts module at all, so no query function exists; and `EvidenceGraph` is an in-memory graph of caller-recorded facts that never reads depgraph.json, so it returns [] for any file path. `REQ-p20-change-impact` owns that gap and is still READY with ZERO implementation. Therefore impact is either REFERENCED (refs handed over by the owning mechanism) or UNAVAILABLE with an explicit reason. It is never computed and never approximated from name similarity.
- PRESERVED DISTINCTIONS (all tested): PACK != REVIEW VERDICT; PACK != MERGE AUTHORITY; PACK != CONTEXT FABRIC; PACK != EXECUTION; SELF-GENERATED PACK != INDEPENDENT REVIEW; EXPECTED TOUCH != ACTUAL TOUCH; MISSING CONTEXT != NEGATIVE FACT; NO ERROR != COMPLETE CONTEXT; SEMANTIC SIMILARITY != DEPENDENCY.
- NO REVIEW-AUTHORITY SURFACE: inputs carrying approved/verdict/authorized/authorize/merge_authority/canMerge/canDeploy/apply/applied/execute/executed/policyBypass/ownerOverride/independentReview are REJECTED. The only review-shaped exports are validateReviewContext and buildReviewContextPack — neither judges anything. The pack has no verdict field and no store: a projection that owned durable storage would become the second registry the requirement says does not yet exist.
- TESTS ARE OUTCOMES, NOT A SUMMARY: PACK_TEST_STATES = PASSED|FAILED|SKIPPED|BLOCKED|NOT_RUN. NOT_RUN is the honest unknown (selected but never executed is not a pass) and SKIPPED is never reported as PASSED. The pack records outcomes; it does not predict selection (Agent-Bridge REQ-p21-test-impact) and is not the workflow StepState machine. There is deliberately no "tests good" roll-up.
- AN UNEXPECTED PATH IS A REVIEW SIGNAL, NOT A DEFECT: touch reports overlap / expectedOnly / unexpected as three disjoint sets. TouchEstimate is consumed as given and never re-estimated.
- NO COMPLETENESS FLAG: unresolved[] surfaces named requirements with no supplied record and capability refs the projection cannot verify. A pack can be entirely valid and still be missing context, so there is no `complete` field to make.
- BOUNDED: maxItemsPerDimension (default 25, mirroring the context-layer convention) bounds each dimension and names what was cut in truncated[]. Requirement context is bounded BY REFERENCE, so a whole-registry dump is structurally impossible. No filesystem crawl, no shell, no model call, no authorization.
- SELF-CORRECTIONS: all three failures in the new test file were test-side errors, not implementation defects, and each was a repeat of a documented lesson:
  - A fixture expected one `unresolved` entry while legitimately resolving every supplied reference (MISSING CONTEXT != NEGATIVE FACT — the code was right, the expectation was wrong).
  - An expected key inventory hand-listed `changedFiles` before `changeKind`/`changeRef`; default `.sort()` is by char code, so uppercase sorts before lowercase. Canonical-order expectations must be derived, not eyeballed.
  - The banned-substring list included "review", which is nonsense for a module whose entire purpose is review context — the same over-broad-ban class as the earlier `authorizeCommand` false positive. Narrowed to review-EXECUTION/verdict surfaces and asserted the exact review-shaped export list instead. A boundary test that bans a substring the subject legitimately contains will be deleted rather than obeyed.
- Gates: `src/programme/reviewPack.test.ts` 32/32; related (programme, steward, workers, runners, context) 221/221; full `npm test` 525/525 (50 files, up from 493/49); `npm run typecheck` clean; `npm run build` clean (46 modules); `npm run registry:validate` 137/137 (10 files, up from 105/9). Lint gate NOT_APPLICABLE — re-verified: scripts are dev/build/preview/typecheck/test/registry:validate, and no eslint/biome/oxlint/tslint/stylelint/prettier config exists outside node_modules/.git/dist. No linter introduced.
- Registry: REQ-p16-review-context-pack RESEARCH -> PROVEN, work_state READY -> COMPLETE. P16 now has NO remaining READY items; the only non-complete P16 entry is REQ-native-header-provenance (OWNER_GATED). Selector retargeted; NEXT_EXECUTABLE_TODO = REQ-p18-superposition-lab (P18) — the programme has left P16. NO READY ITEMS != ALL WORK COMPLETE. Push remains owner-gated; not pushed.

### REQ-p18-superposition-lab — DONE 2026-09-26 (EXPERIMENTAL / STUDY_ONLY eval lane)
- `src/eval/superposition.ts`: `LAB_METRICS` (exactly the 7 registered metrics), `runVariant`, `compareSuperposition`, `labRuns`, `runDispersion`, `validateConfig`, `validateVariant`, `canonicalSuperposition`, `LAB_STUDY_ONLY`, `SOURCE_CLAIM_STATUS`. Per-metric provenance is `ANALYTIC | MEASURED | UNAVAILABLE`.
- SOURCE TRUTH ESTABLISHED BEFORE CODING (per the requirement being authoritative): the registered source is a RESEARCH_NOTE reference ("representation research", "research addendum post-checkpoint 2026-09-23") and NO primary source document exists anywhere in this repository. The paper named in earlier prompt history appears NOWHERE in the repo and is NOT a registered source, so its mechanism was deliberately NOT implemented. `SOURCE_CLAIM_STATUS = UNAVAILABLE_RESEARCH_NOTE_REFERENCE_ONLY` is carried as data in every comparison. SOURCE CLAIM != LOCAL RESULT.
- MECHANISM (analytical, attributed to standard representation-superposition mathematics, not to any paper): features stored in width dimensions; features <= width is dense with exactly zero interference; features > width packs ceil(features/width) per dimension so features share directions and interfere; each stored dimension is then rounded to `bits` bits. The studied interaction is packing x rounding. A `superposition: true` variant with features <= width is REJECTED because that is a dense baseline wearing a label and would manufacture a false independent variable.
- ENERGY IS ALWAYS UNAVAILABLE, NEVER ZERO. The only hardware measurement in this repository is src/providers/hardwareProbe.ts (FP32 CPU matmul latency); there is no energy measurement anywhere, so an energy number would be invented. `memory` is labelled ANALYTIC because width x bits / 8 is closed-form arithmetic, not a measurement of any allocator. UNKNOWN METRIC != ZERO.
- TERMINOLOGY: representation superposition is NOT quantum superposition, NOT MoE routing, NOT ensembling, NOT model merging, and NOT BitNet/ternary compute (a separate lane). The demo UI in components/ already uses "superposition"/"qubits" loosely; that prose is marketing copy, is not this mechanism, and this lab makes no quantum claim.
- FOUR REAL DEFECTS FOUND AND FIXED DURING IMPLEMENTATION (all caught by the new tests, not by review):
  1. CONTROL SET MADE THE EXPERIMENT INEXPRESSIBLE. `width` was in the controlled set alongside `features`, but superposition IS DEFINED by features > width, so pinning both meant the mechanism could not vary and every run was confounded. Width is now an independent variable; `features` (equal feature count = equally hard task) is the control.
  2. THE INTERFERENCE METRIC REWARDED DAMAGE. Sign-agreement decoding must break ties, and a coarse grid rounds a cancelled 0 to a small positive value, letting one of two tied features "win" — so interference FELL as precision was destroyed. Replaced with mean normalized reconstruction error, which is monotone in the damage. A regression test pins monotonicity across bit-widths.
  3. THE ACCURACY THRESHOLD SAT ON THE BOUNDARY. `error < 0.5` is exactly the catastrophic-cancellation value, and an odd-level quantizer has no zero, so a fully-cancelled feature could be nudged just inside the threshold and manufacture accuracy. Tightened to a documented `DECODE_TOLERANCE = 0.25`, strictly inside the sign-loss boundary.
  4. ENCODER/DECODER MISMATCH. Packing places features `d*perDimension + k` into dimension d, but the decoder read them back with `f % width`, so it compared the WRONG features and measured noise. Caught because interference came out as values like 0.49902 that are multiples of nothing. Now `floor(f/perDimension)`, with a regression test asserting interference is a multiple of 0.5/features.
- ALSO FIXED: `stored` was declared `number[][]` while holding one number per dimension — a real typecheck error (TS2345/TS2362/TS2367) that the tests could not catch because both readings coerce. 1-bit dimensions are now rejected: a single-bit dimension has no zero level, so a cancelling pair has no consistent encoding and "accuracy" there is a decoder artifact; the floor of 2 is far below the repo's own INT4 conventional precision.
- FLOATING-POINT HONESTY: an intermediate 1e-4 tolerance in the monotonicity test was masking the encoder/decoder bug. After the fix the metric is exact to double precision (verified at 1e-12), so the tolerance was reduced to 1e-9 — three orders above double-epsilon accumulation and nine orders below the 0.25 artifact it guards. A tolerance must be derived and documented, never widened to make a failing algorithm pass.
- REUSE, NOT DUPLICATION: reused the exported `stableStringify` from src/workflows/promotion.ts for canonical serialization, and adopted the causal harness's discipline (confound detection, exclusion of confounded runs, per-metric deltas). Did NOT reuse `Experiment`/`Trial` from src/eval/harness.ts: its TrialObservations are agent-task fields (successClaimed, toolCalls, wallMs, escalations) and do not fit a representation experiment; forcing them would have meant inventing agent metrics. Did NOT create a Superposition Benchmark Registry, a Lab Evidence Store, an Experiment Harness 2, or widen the shared `isValidMetric` provider vocabulary (latency/throughput/tool_success/...) to absorb representation metrics.
- SEEDED RNG IS THE FIRST IN THE REPO: there is no RNG abstraction and no seed field anywhere in src/ (the only Math.random is an id factory in src/workflows/runtime.ts). A fixed 32-bit LCG is introduced because the requirement's reproducibility rules demand an EXPLICIT seed, which is acceptable in a STUDY_ONLY lane. runIndex is required and folded into the stream so run N is not a repeat of run 0. All runs retained, no outlier discarded, dispersion reported.
- PRODUCTION UNTOUCHED (verified): routeCapabilityRequest (providers/capabilities.ts:113), routeWithLiveState (providers/live.ts:58), AdapterRegistry.find/invokeRoute (providers/invoke.ts:128,167), rankForPrecision (providers/hardware.ts:175), S0RulesBackend.decide (genesis/reflex.ts:257). No network, no download, no credential, no provider, no daemon, no service, no router, no registry. SUPERPOSITION LAB != MODEL FABRIC (REQ-p18-model-fabric stays BLOCKED on cloud credentials) != GENESIS != REFLEX.
- NO WINNER, NO COMPOSITE: per-metric deltas sorted by metric name; no winner/best/verdict/ranking/composite field. The only score-adjacent field is `noCompositeScore: true`, a negative assertion flag.
- Gates: `src/eval/superposition.test.ts` 36/36; related (eval, providers, programme, state) 245/245; full `npm test` 561/561 (51 files, up from 525/50); `npm run typecheck` clean (exit 0, verified after fixing TS2345/TS2362/TS2367); `npm run build` clean (46 modules); `npm run registry:validate` 137/137 (10 files). Lint gate NOT_APPLICABLE — scripts are dev/build/preview/typecheck/test/registry:validate and no eslint/biome/oxlint/tslint/stylelint/prettier config exists outside node_modules/.git/dist/native-target. No linter introduced.
- RELEASE EFFECT: NONE. docs/PUBLIC_RELEASE_READINESS.md already lists the superposition lab under EXPERIMENTAL, so no release gate is re-scored. Public release remains NOT YET RELEASE-PROVEN, scope UNDEFINED, REQ-p31-release-scope OWNER_GATED.
- Registry: REQ-p18-superposition-lab RESEARCH -> PROVEN, work_state READY -> COMPLETE. Selector retargeted; NEXT_EXECUTABLE_TODO = REQ-p18-training-compute (P18). Push remains owner-gated; not pushed.
