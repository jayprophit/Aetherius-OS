# Programme Continuation State

**Operational resumption aid only.** This file is NOT requirement truth,
dependency truth, evidence truth or selector truth. Those remain
authoritative in:

- `src/programme/requirements.json` (requirement state)
- `registry/programme.json`, `registry/depgraph.json` (programme + dependency truth)
- `registry/legacy-coverage.json` (legacy ledger)
- `native/BUILD-TODO.md` (chronological build evidence)
- `src/programme/select.ts` (deterministic selector)

**Exact resume instruction:**

> Resume the programme from the committed continuation checkpoint: rerun the
> deterministic selector, execute whatever it returns, and do not stop until a
> true stop condition. Do not ask whether to continue.

## Current selector result

`selected_task: null` — ZERO executable requirements remain registry-wide.
The selector returns null with counts, never an invented task. Per BUILD51
this is NOT a stop: the programme now runs in FULL-SYSTEM COMPLETION MODE
(audit, BUILD49 reconciliation, gap registration, integration/debug,
security, packaging) until a TRUE final stop condition exists. Do NOT
report; keep working.

Selector order is deterministic: priority desc, dependents count desc, phase
number asc, id lexicographic asc. It is never overridden manually.

The selector made twenty-three moves since `REQ-p20-execution-checkpoints`
closed (`language-graph`, `spine-branch`, `toolchain-registry`,
`project-orchestrator`, `reflex-calibration`, `selective-escalation`,
`world-model-lab`, `work-monitoring`, `service-orchestrator`, `reputation`,
`supply-chain`, `epistemic-graph`, `context-compiler`, `degraded-link`,
`multichannel-messaging`, `network-hierarchy`, `creative-ref-graph`,
`multimodal-consistency`, `ref-grounded-design`, `visual-qa`,
`deployment-profile`, `release-packaging`, then terminal null). Those were
the selector's calls, not checkpoint predictions — `CHECKPOINT PREDICTION
!= SELECTOR RESULT`.

## Last completed requirement

`REQ-p31-release-packaging` — release package records and lifecycle plans
(no execution), commit `1aab47b`. **P19 is 20/20 COMPLETE; P20's READY units
are closed; P22's executable units are all COMPLETE**
(memory-integrity-boundary stays OWNER_GATED); **P23's executable units are
all COMPLETE**; **P24's READY units are closed**; **P25's READY units are
closed** (reward-treasury stays DEFERRED); **P26's executable units are all
COMPLETE** (epistemic-graph implemented in MAT `de72b04`); **P27's READY
units are closed**; **P29's READY units are closed**; **P31's READY units
are closed**. Every remaining non-complete requirement is BLOCKED,
OWNER_GATED, HUMAN_REQUIRED, IN_PROGRESS_ELSEWHERE, DEPENDENCY_WAITING, or
DEFERRED — verified by the executable count reaching exactly zero.

Closed immediately before it: `REQ-p29-visual-qa` (Poietek `232cedb` +
bookkeeping `d00f364`), `REQ-p29-ref-grounded-design` (Poietek
`d6bd674` + bookkeeping `766a29c`), `REQ-p29-multimodal-consistency`
(Poietek `1a376c2` + bookkeeping `63d0a54`), `REQ-p29-creative-ref-graph`
(Poietek `1c55e2f` + bookkeeping `3ec7ef0`), `REQ-p27-network-hierarchy`
(`b0dfb69`), `REQ-p27-multichannel-messaging` (Bridge `1f82a01` +
bookkeeping `dc97e53`), `REQ-p27-degraded-link` (`7003d9f`),
`REQ-p26-context-compiler` (`8ce404b`), `REQ-epistemic-graph` (MAT `de72b04`
+ bookkeeping `2bd27fa`), `REQ-p25-supply-chain` (`a503c48`),
`REQ-p25-reputation` (`6a9796e`), `REQ-p24-service-orchestrator` (`36ba3fe`),
`REQ-p23-work-monitoring` (`7522e20`), `REQ-p22-world-model-lab` (`a8faad1`),
`REQ-p22-selective-escalation` (`fabdc4b`), `REQ-p22-reflex-calibration`
(`a504052`), `REQ-p22-project-orchestrator` (`e2ab7e3`),
`REQ-p20-toolchain-registry` (`eb8ce6e`) and `REQ-p20-spine-branch`
(`8ce72d1`).

Boundaries that still bind later units:

- a collision forecast is not prevention (`applySync` remains the reactive
  oracle);
- a checkpoint is not recovery proof, not authorization, not completion, not
  memory and not placement;
- the project language graph *produces* edges while change-impact remains the
  owner of impact querying;
- a branch merge-back is not completion, not merge authority, not recovery, and
  branch workers stay temporary;
- **escalation proposes, P25 disposes**: an EscalationDecision never carries
  authority, execution residue, persona, or secrets; `can_continue` and
  `requires_human` are derived, never supplied; requires_human follows only the
  closed human-only vocabulary (LOW CONFIDENCE != AUTOMATIC HUMAN REQUIREMENT);
  contradictions are preserved with no winner; unavailable resolvers keep their
  blocker; confidence means decision-completeness only;
- **the world-model lab scores traces, never the runtime**: no runtime import,
  call, or reimplementation; absent outcomes stay UNRESOLVED and never enter a
  rate; verdicts require evidence; frozen-input tests prove non-mutation;
  per-dimension quality with no composite figure; perf fields rejected;
- **work monitoring observes, owns nothing**: stateless subscribe/stream/alerts
  join composing summarize/inspect/transport; UNKNOWN stays UNKNOWN and never
  fires; no invented progress/ETA/telemetry; EVENT_AT != OBSERVED_AT; channel
  allowlists fail closed;
- **service orchestration plans, never actuates**: lifecycle stages as
  evidence-gated recorded transitions (no shell/network/timers); BLOCKED is a
  derived overlay, never stored; restart budgets enforced; references only
  (`apps:`/`toolchain:`/`repo:`), never raw commands;
- **reputation observes, grants nothing**: tallies count only verified +
  known-outcome + subject-attributed actions; cold subjects are UNKNOWN, never
  zero-rated; duplicate actionIds rejected; explicit integer tallies, no trust
  number; subjects opaque; evidence owned elsewhere;
- **supply-chain records evidence, decides nothing**: digests computed
  (sha256), SBOM completeness derived, signatures stay CLAIMED_UNVERIFIED (no
  backend, none faked), no SLSA conformance claimed; provenance digest binding
  checked by the module itself; per-domain counts without verdicts; release
  gates unchanged (their pass-conditions are unmet);
- **the epistemic graph traverses, never judges**: edges reference canonical
  claim IDs (never copied); SUPERSEDES derived from registry truth, never
  authored; contradictions coexist unreconciled; no truth scores, no
  auto-promotion, no similarity inference, no memory/vector/RAG/compiler;
- **the context compiler assembles, never invents**: resolved layers in,
  skill-ready units out; budgetContext called not cloned; explicit skillRef
  rules-into-skills; identity dedupe; required never displaced; no tokenizer
  fabrication, no model calls, no memory writes;
- **the degraded link stores, forwards, and tells the truth**: link-gated
  drain (OFFLINE/UNKNOWN hold, DEGRADED needs an explicit floor); SEND !=
  DELIVERY != PROCESSING; acks idempotent with unknown rejection; retry is
  eligibility never scheduling; fragment gaps named; digests verified,
  signatures claimed-only; compression real or refused; no invented
  guarantees, measurements, or timers;
- **the messaging fabric routes, never sends for real**: explicit selection
  only (no ranking/fallback/broadcast); consent and authorization refs gated;
  loopback records, real providers stay PROVIDER_REQUIRED; SAME TEXT != SAME
  MESSAGE; CONTENT != AUTHORITY; credential refs only;
- **the network hierarchy maps topology, never power**: 3 levels derived
  never stored; grants are membership only; revocation detaches never
  deletes; orphans reported never repaired; lineage keys rejected outright
  (never Genesis); no authority/inheritance fabrication; no transport or
  placement surfaces;
- **the creative ref graph references, never copies**: style/character/
  environment refs to scenes/shots; arrangement entities unrepresented;
  no authorship/licence inference; no scores/ranking/fetching/generation;
  no MAT/Aetherius graph duplication;
- **multimodal consistency detects, never judges**: character/style/
  environment agreement over declared refs; UNKNOWN never passes; conflicts
  preserved with all sides; no scores, no auto-repair, no model judgment;
- **ref-grounded design validates, never generates**: citations resolve with
  explicit deltas or report unresolved without verdicts; evaluation refs
  preserved uninterrupted; no QA scope absorbed, no scores, no auto-repair;
- **visual QA evaluates, never judges**: six registered dimensions with
  per-dimension PASS/FAIL/UNKNOWN; UNKNOWN stays UNKNOWN; EXPECTED vs
  OBSERVED explicit; no model judgement, no scores, no approval;
- **the deployment profile measures, never decides**: seven dimensions with
  own units and evidence; derived rates computed never asserted; no universal
  score anywhere; no actuation, authorization, or release-scope;
- **release packaging records, never executes**: manifest plus install/
  update/rollback/uninstall plans as validated records; scope by reference
  only; SBOM/signing composed; 0.0.0 refused; rollback points backward.

## Commits (Aetherius-OS, local only — never pushed)

| Commit | Requirement |
| --- | --- |
| `1aab47b` | REQ-p31-release-packaging |
| `1e83f2e` | REQ-p31-deployment-profile |
| `d00f364` | REQ-p29-visual-qa (bookkeeping; implementation in Poietek `232cedb`) |
| `766a29c` | REQ-p29-ref-grounded-design (bookkeeping; implementation in Poietek `d6bd674`) |
| `63d0a54` | REQ-p29-multimodal-consistency (bookkeeping; implementation in Poietek `1a376c2`) |
| `3ec7ef0` | REQ-p29-creative-ref-graph (bookkeeping; implementation in Poietek `1c55e2f`) |
| `b0dfb69` | REQ-p27-network-hierarchy |
| `dc97e53` | REQ-p27-multichannel-messaging (bookkeeping; implementation in Agent-Bridge `1f82a01`) |
| `7003d9f` | REQ-p27-degraded-link |
| `8ce404b` | REQ-p26-context-compiler |
| `2bd27fa` | REQ-epistemic-graph (bookkeeping; implementation in MAT `de72b04`) |
| `a503c48` | REQ-p25-supply-chain |
| `6a9796e` | REQ-p25-reputation |
| `36ba3fe` | REQ-p24-service-orchestrator |
| `7522e20` | REQ-p23-work-monitoring |
| `a8faad1` | REQ-p22-world-model-lab |
| `fabdc4b` | REQ-p22-selective-escalation |
| `a504052` | REQ-p22-reflex-calibration |
| `e2ab7e3` | REQ-p22-project-orchestrator |
| `eb8ce6e` | REQ-p20-toolchain-registry |
| `8ce72d1` | REQ-p20-spine-branch |
| `b888395` | REQ-p20-language-graph |
| `0161a86` | REQ-p20-execution-checkpoints |
| `82ab12c` | REQ-p20-collision-predictor |
| `0d18468` | REQ-p20-change-impact |
| `0a3776c` | REQ-p19-sealed-vault |
| `aeecdcb` | REQ-p19-online-eval |
| `55d6343` | REQ-p19-independent-review-gate |
| `ee65b82` | REQ-p19-e2e-completion |
| `2086622` | REQ-p19-context-position |
| `15f0d43` | REQ-p19-benchmark-freshness |
| `cb306ff` | REQ-p19-benchmark-contamination |
| `428192c` | REQ-p18-training-compute |
| `5a118b7` | REQ-p18-superposition-lab |
| `13dac73` | REQ-p16-review-context-pack |
| `515eb0b` | REQ-p16-governance-proposals |
| `b6c1acf` | REQ-p16-change-cohort-review |
| `5fe5158` | REQ-p16-capability-graph |
| `a6f43ad` | REQ-p16-autonomy-readiness |

## Next work, in selector order after the current one

1. FULL-SYSTEM COMPLETION MODE (active — zero executable requirements).
   Blocker re-evaluation done, no state changes: model-fabric + clean-room
   stay BLOCKED on fresh evidence (cloud creds still owner-supplied with
   local Ollama insufficient for failover proof; no isolated backend, docker
   absent). BUILD49 first reconciliation pass recorded in BUILD-TODO
   (classify-only: action-receipts candidate gap NOT registered pending owner
   scoping; inference/model families STUDY_ONLY; workspace/bare-metal as
    reference). Done since: attestation<->packaging integration proven
    (5 tests), focused security audit over new modules (clean), docs audit
    (clean), three consecutive clean full suites (1413/1413). Next:
    reliability/recovery evidence, performance audit, packaging evidence,
    deeper BUILD49 reconciliation. CLOSED last: release-packaging
    (`1aab47b`), deployment-profile (`1e83f2e`). Do NOT stop, do NOT report
    until a TRUE final stop condition exists.

Closed so far in this stretch: `REQ-p20-change-impact`, `REQ-p20-collision-predictor`,
`REQ-p20-execution-checkpoints`, `REQ-p20-language-graph`, `REQ-p20-spine-branch`,
`REQ-p20-toolchain-registry`, `REQ-p22-project-orchestrator`, `REQ-p22-reflex-calibration`,
`REQ-p22-selective-escalation`, `REQ-p22-world-model-lab`, `REQ-p23-work-monitoring`,
`REQ-p24-service-orchestrator`, `REQ-p25-reputation`, `REQ-p25-supply-chain`,
`REQ-epistemic-graph` (MAT `de72b04`), `REQ-p26-context-compiler`,
`REQ-p27-degraded-link`, `REQ-p27-multichannel-messaging` (Bridge `1f82a01`),
`REQ-p27-network-hierarchy`, `REQ-p29-creative-ref-graph` (Poietek `1c55e2f`),
`REQ-p29-multimodal-consistency` (Poietek `1a376c2`),
`REQ-p29-ref-grounded-design` (Poietek `d6bd674`),
`REQ-p29-visual-qa` (Poietek `232cedb`),
`REQ-p31-deployment-profile` (`1e83f2e`),
`REQ-p31-release-packaging` (`1aab47b`).
Their boundaries are recorded in `docs/change-impact.md`, `docs/collision-predictor.md`,
`docs/execution-checkpoints.md`, `docs/project-language-graph.md`, `docs/spine-branch.md`,
`docs/toolchain-registry.md`, `docs/project-orchestrator.md`, `docs/reflex-calibration.md`,
`docs/selective-escalation.md`, `docs/world-model-lab.md`, `docs/work-monitoring.md`,
`docs/service-orchestrator.md`, `docs/reputation.md`, `docs/supply-chain.md`,
`docs/epistemic-graph.md` (pointer: implementation lives in MAT),
`docs/context-compiler.md`, `docs/degraded-link.md`,
`docs/multichannel-messaging.md` (pointer: implementation lives in
Agent-Bridge), `docs/network-hierarchy.md`,
`docs/creative-ref-graph.md` (pointer: implementation lives in Poietek),
`docs/multimodal-consistency.md` (pointer: implementation lives in Poietek),
`docs/ref-grounded-design.md` (pointer: implementation lives in Poietek),
`docs/visual-qa.md` (pointer: implementation lives in Poietek),
`docs/deployment-profile.md` and `docs/release-packaging.md`.

`REQ-p20-change-impact` scope, already surveyed. This is the gap this
programme has repeatedly recorded as **ABSENT**, and it is finally
scheduled. Read the exact registered requirement before implementing, but the
verified starting position is:

- `registry/depgraph.json` is **system-level only** — roughly 10 nodes
  (`aetherius-os`, `agent-bridge`, `mat`, …) with no file, module or symbol
  ids.
- There is **no `depgraph.ts` module**, so no dependency query function exists.
- `EvidenceGraph` (`src/programme/evidenceGraph.ts`) is an in-memory graph of
  caller-recorded facts and **never reads** `depgraph.json`; it returns `[]`
  for any file path.
- `src/programme/reviewPack.ts` therefore reports its impact leg as
  `REFERENCED` or `UNAVAILABLE` **with a reason**, and must not be changed to
  fabricate impact data.

Standing constraints for this unit: `SYSTEM DEPGRAPH != CODE DEPENDENCY
GRAPH`, `EVIDENCE GRAPH != CHANGE IMPACT GRAPH`, and `SIMILARITY !=
DEPENDENCY` — a dependency relation may not be inferred from name similarity.

## Open item: full-suite test TIMING (not a logic failure)

The full suite intermittently reports 3-8 timeouts on this machine.
Investigation established **timeouts only and 0 assertion failures**, always in
pre-existing filesystem-heavy tests this work never touches.

The failing *set* changes between runs, which is itself the evidence that this
is machine-load timing rather than a logic defect. Runs observed so far:

- `src/workflows/workflows.test.ts` — "cycles and depth excess fail honestly"
  (measured 11.9s, 3.5s, 6.9s, and 13.8s against a 5s per-test limit), plus
  "interrupted safe steps resume", "approval inside child pauses parent", and
  "missing child fails at runtime" on the heaviest run
- `src/workflows/promotion.test.ts` — review/approval cases, "raw secrets
  are critical findings leading to quarantine", "missing and failing tests
  block promotion", "low-risk candidate promotes end to end"
- `src/programme/proposals.test.ts` — "rejects a non-proposal record on load"
- `src/providers/invoke.test.ts` — "invocation evidence persists metadata only
  through P17 state"
- `src/scheduler/scheduler.test.ts` — "later ticks do not duplicate; next
  recurrence creates anew", "restart loads persisted state", event-trigger and
  P19/1 integration cases

Re-running the affected files in isolation clears most of them (6 of 8 on the
heaviest observed run); the long-standing `workflows.test.ts` "cycles and depth
excess" case is the slowest, measured at 2309–3930ms in isolation against
5.8–13.8s under full-suite load — the load signature rather than a slow
assertion. **Latest full run (2026-09-27): 1146/1146 CLEAN PASS, 68 files,
28.58s, zero timeouts.** The item stays open because past runs flaked, not
because the current run did. No timeout was raised, no test skipped, no
assertion weakened. If it persists, the fix is to raise `testTimeout` for
those pre-existing slow tests or profile them — an owner decision, not an agent
workaround.

## Editing the requirement registry safely

`src/programme/requirements.json` repeats boilerplate strings — notably
`legacy audit: genuine uncovered delta, still relevant`, which appears in five
records. An anchor-based edit can therefore match the **wrong record** and
silently overwrite an unrelated requirement while reporting success.

- Anchor edits on the record's unique `"id"` line.
- Validate afterwards with `node -e "JSON.parse(...)"` or an equivalent parser.
- Confirm with `git diff` that only the intended record changed.
- Revert with `git checkout -- src/programme/requirements.json` if it did not.

This happened once and was caught exactly this way.

## Remaining executable work

READY work: ZERO executable units remain registry-wide. Everything else is
COMPLETE, BLOCKED, OWNER_GATED, HUMAN_REQUIRED, IN_PROGRESS_ELSEWHERE,
DEFERRED, or owner-gated P31 release-scope. FULL-SYSTEM COMPLETION MODE is
now active: audit, BUILD49 reconciliation, gap registration,
integration/debug, security, packaging — do NOT stop, do NOT report until a
TRUE final stop condition exists.

## Repository state

- Aetherius-OS: **ahead of `origin/master`, never pushed** (push is
  OWNER_GATED)
- Working tree: clean at the last checkpoint
- Registry: 107 requirements
- Known pre-existing owner file: `native/BUILD-TODO.md` — its
  unknown-authorship header must never be normalized or rewritten; only
  chronological appends.

## Baselines at last checkpoint

| Gate | State |
| --- | --- |
| Full test suite | **1497/1497 CLEAN (82 files, zero timeouts) — tenth consecutive clean run.** The one load-sensitive test carries a documented 20s budget (real `FileStateStore` disk I/O under 81 parallel workers); the global 5s default is unchanged. |
| Integration evidence (new) | attestation registry <-> release packaging seam proven with real records both sides (5 tests: VERIFIED/mismatch/ASSERTED/no-recompute/unknown) |
| Evidence traceability (new) | `REQ-p16-evidence-traceability` `1a2ada1`: 45 tests. TRUE BASELINE: 108 requirements, 93 COMPLETE, **70 COMPLETE claims with no resolvable test citation**, 1 using machine refs, exactly 4 dangling citations left reported. Open finding, deliberately not remediated. |
| Traceability remediation (new) | Ten batches, ledger closed: **84 of 108 machine-cited, 9 of 93 COMPLETE claims untraceable, each with a specific reason.** Started from 0/107 using the schema's declared-but-unused fields. Every citation verified by import; where a suite total was recorded it had to match disk exactly (19=7+12, 9=9, 38=18+16+4 at IDE commit d45e4f5). Six REQ declarations added to modules that named no id. The audit produced new tests (`src/relay/policy.test.ts`, 29 cases), exposed a ~1826-dir temp leak, and exposed a blind spot in itself (dot-style-only test detection hid Agent-Bridge's `tests/test_*.py`). Two automated classifications that were wrong were discarded, not published. The 9 residue: 6 name no suite, 2 are owner/repo mismatches (p23-*), 1 is policy-blocked (`mat-derived-matrices`, whose build scripts write read-only scientific data). |
| Full test suite | **1497/1497 CLEAN (82 files, zero timeouts) — tenth consecutive clean run.** The one load-sensitive test carries a documented 20s budget (real `FileStateStore` disk I/O under 81 parallel workers); the global 5s default is unchanged. |
| Test-suite temp leak (new) | `094b03b`: ~1826 leaked `%TEMP%` dirs found. `workflows.test.ts` now cleans all 8 of its own; `test.globalSetup.ts` removes only dirs created during the run, known prefixes only. Global timeout NOT raised, no assertion weakened — the previously timing-out test now passes under full load. |
| Ref-grounded-design unit (Poietek) | 10/10 targeted; typecheck:core clean; format:check clean; full Poietek suite 367/367 clean |
| Release-packaging unit | 19/19 |
| Deployment-profile unit | 23/23 |
| Visual-QA unit (Poietek) | 17/17 targeted; typecheck:core clean; format:check clean; full Poietek suite 384/384 clean |
| Ref-grounded-design unit (Poietek) | 10/10 targeted; typecheck:core clean; format:check clean; full Poietek suite 367/367 clean |
| Multimodal-consistency unit (Poietek) | 17/17 targeted; typecheck:core clean; format:check clean; full Poietek suite 357/357 clean |
| Creative-ref-graph unit (Poietek) | 19/19 targeted; typecheck:core clean; format:check clean; full Poietek suite 340/340 clean |
| Network-hierarchy unit | 32/32 |
| Multichannel-messaging unit (Bridge) | 28/28 targeted; 10/10 related; full Bridge suite 1193/1214 (21 pre-existing failures, proven independent) |
| Degraded-link unit | 31/31 |
| Context-compiler unit | 30/30 |
| Epistemic-graph unit (MAT) | 16/16 targeted; 29/29 related; full MAT suite 101/102 (1 pre-existing catalog failure, proven unrelated) |
| Supply-chain unit | 27/27 |
| Reputation unit | 24/24 |
| Service-orchestrator unit | 32/32 |
| Work-monitoring unit | 23/23 |
| World-model-lab unit | 21/21 |
| Selective-escalation unit | 46/46 |
| Reflex-calibration unit | 44/44 |
| Project-orchestrator unit | 33/33 |
| Toolchain-registry unit | 40/40 |
| Spine-branch unit | 34/34 |
| Language-graph unit | 58/58 |
| Execution-checkpoint unit | 43/43 |
| Related (release, supply, workflows, programme, state) | 431/431 |
| Registry validation | clean, 243 |
| Typecheck | clean (exit 0) |
| Vite build | clean, 46 modules |
| Lint | `NOT_APPLICABLE` — no lint script and no eslint/biome/oxlint/tslint/stylelint/prettier config exists outside `node_modules`/`.git`/`dist`/`native/target`. **This is not a lint pass.** |

**Gate order to run for every unit:** targeted tests → related tests → lint
(if present; otherwise `NOT_APPLICABLE`) → typecheck → full suite → build →
registry:validate → diff review → junk check → docs → BUILD-TODO → commit.

## Blockers and gates (do not bypass)

**BLOCKED**

- `REQ-p18-model-fabric` — cloud credentials unavailable
- `REQ-p20-clean-room` — no isolated backend

**OWNER_GATED** (do not execute; do not convert to COMPLETE)

- `REQ-native-header-provenance` (the only non-complete P16 item)
- `REQ-genesis-actuator`
- `REQ-memory-integrity-boundary`
- `REQ-regulated-evidence`
- `REQ-p31-release-scope`

**IN_PROGRESS_ELSEWHERE** (do not touch)

- `REQ-p17-owned-state`
- `REQ-desktop-capability-fabric`

**DEFERRED**

- `REQ-p25-reward-treasury`, `REQ-spawn-flake`

**HUMAN_REQUIRED** (do not self-pass; does not stop machine-executable work)

- offline/degraded matrix, platform support matrix, IDE UI validation,
  accessibility audit, privacy/telemetry sign-off

## Standing source-honesty findings

- **Superposition lab source status is LOCKED** at
  `UNAVAILABLE_RESEARCH_NOTE_REFERENCE_ONLY`. There is no primary source and
  no cited paper in this repository. Do not silently upgrade it.
  `PROMPT MEMORY != SOURCE`, `RESEARCH_NOTE != CITATION`.
- **`REQ-p20-change-impact` implementation is ABSENT** and verified so:
  `registry/depgraph.json` is system-level only (~10 nodes, no
  file/module/symbol ids), there is no `depgraph.ts`, and `EvidenceGraph`
  does not derive code dependencies. Do not implement it inside an unrelated
  requirement; let the selector schedule it.
  `SYSTEM DEPGRAPH != CODE DEPENDENCY GRAPH`.
- **`REQ-p26-context-compiler` is registered and READY but has ZERO
  implementation** — no compiler module exists in `src/`. Treat a compiler as
  an optional external reference; never pretend to have compiled anything.

## Phase state

- P16: 11 COMPLETE, 1 OWNER_GATED, 0 executable
- P18: 5 COMPLETE, 1 BLOCKED, 0 executable
- P19: **20 COMPLETE, 0 READY — P19 exhausted**
- P20: 11 COMPLETE, 1 BLOCKED, 0 executable
- P22: **9 COMPLETE, 0 READY — P22 exhausted except its OWNER_GATED
  `REQ-memory-integrity-boundary`**
- P23: **4 COMPLETE, 0 READY — P23 exhausted** (runtime-inspection,
  chat-work-depths, layout-system, work-monitoring; omniagent-reference-index
  is RESEARCH/COMPLETE, untouched)
- P24: **service-orchestrator COMPLETE; 0 READY — P24 exhausted**
  (owner-full-control already COMPLETE)
- P25: **reputation + supply-chain COMPLETE, 0 READY — P25 exhausted**
  (`REQ-p25-reward-treasury` DEFERRED, `REQ-owner-full-control` COMPLETE)
- P26: **epistemic-graph + context-compiler COMPLETE, 0 READY — P26
  exhausted** (epistemic-graph implemented in MAT `de72b04`)
- P27: **degraded-link + multichannel-messaging + network-hierarchy
  COMPLETE, 0 READY — P27 exhausted** (multichannel-messaging implemented in
  Bridge `1f82a01`)
- P29: **creative-ref-graph + multimodal-consistency + ref-grounded-design
  + visual-qa COMPLETE, 0 READY — P29 exhausted** (all implemented in
  Poietek: `1c55e2f`, `1a376c2`, `d6bd674`, `232cedb`)
- P31: `REQ-p31-deployment-profile` COMPLETE, `REQ-p31-release-packaging`
  COMPLETE — P31 executable units exhausted (release-scope stays
  OWNER_GATED)

**No executable items in a phase is not the same as that phase being
complete.** Continue across phases per selector output.

## Research batch (BUILD49, owner-supplied 2026-09-29 — preserved, not implemented)

Full index lives in `native/BUILD-TODO.md` ("2026-09-29 - RESEARCH BATCH
INDEX"). Families: A hyper-efficient long-context inference (MiMo-V3/
HySparse2, YOCO, DeepSeek V4.1 Flash) → P18/P19/P22/P26/P31; B hindsight
memory (Vectorize Hindsight, retain/recall/reflect) → P22/P26/P19/P31, never
Genesis canonical memory; C Spark-X2.5-4B hybrid attention (experimental
model candidate) → P18/P19/P31; D FreeToken MoE + E local inference stack
(layered MODEL/RUNTIME/SERVING/LIFECYCLE/APPLICATION split) → P18/P20/P30/
P31/VM-B; F Colibrì storage-backed MoE + G Fable llama.cpp optimisation
(specific bench, not universal); H Microsoft agents course (mostly STUDY;
action receipts candidate P21/P25/P31; computer-use API-first); I agentic
design (effect classes, governed pipeline, capability-on-demand, untrusted
boundary); J Grok-style workspace reference (P23/P20/P21/P30 surface, not
dependency); K AI-built OS / vibOS + bare-metal verification (QEMU/OVMF,
boot milestones CANDIDATE, USB safety; host toolchain != target OS).
Unresolved: "7 Jev Repos" video (no repo names supplied — do not invent).
Consolidated: GENESIS-ADAPTIVE-INFERENCE / MEMORY-LEARNING-LIFECYCLE /
INFERENCE-RUNTIME-FABRIC / GOVERNED-ACTION-FABRIC / WORKSPACE-COMPUTER-
RUNTIME / BARE-METAL-BUILD-VERIFICATION / MS-OPEN-AGENT-INTEROP. Rule:
REGISTERED REQUIREMENT OVERRIDES RESEARCH; RESEARCH != VERIFIED FACT;
reconcile (classify/dedupe/verify/map) at a future merge point, ingest
requirements ONLY for proven gaps. Nothing from this batch is implemented.

## Release status

`NOT YET RELEASE-PROVEN`, release scope `UNDEFINED`,
`REQ-p31-release-scope` OWNER_GATED. Update release gates only when real
release evidence changes them; otherwise record `RELEASE EFFECT = NONE`.

## Standing test-design lessons

Correct the test when the test is wrong — never distort production code:

- **Fixture inheritance**: a partial object override keeps the factory's
  other defaults. Check spreads before blaming a cache.
- **Boundary tests**: ban forbidden behaviour/API surface, not legitimate
  domain vocabulary. `"train"` may not be banned in a training module, nor
  `"review"` in a review module, nor `"authorize"` where a legitimate
  default-deny authorizer exists. A test that bans a substring its subject
  legitimately contains gets deleted, not obeyed.
- **Sorting**: pass a real comparator, never a comparator factory. Assert
  canonical order from **scrambled** input, and derive expected order from
  the documented comparator rather than intuition (default `.sort()` is by
  code unit, so `changeK` precedes `changed`).
- **Normalization**: use global replacement; test multiple invalid spans,
  repeated separators, leading/trailing runs.
- **Timestamps**: never `new Date(0)`, epoch placeholders or hidden wall
  clock. Caller supplies time.
- **Unknown**: do not fabricate unresolved entries to make a list non-empty.
- **Float tolerance**: a tolerance must reflect expected floating-point
  error, never absorb a bug. A loose tolerance hid a real indexing defect
  once; it was tightened to 1e-9 after the fix.
- **Encoder/decoder**: index mapping must be symmetric and hand-testable.
- **Experiment controls**: a control set must not remove the independent
  variable.
- **Metrics**: metric improvement ≠ mechanism improvement until pathological
  cases are tested.
- **Cross-reference queries**: constrain every dimension that changes the
  answer, not just the obvious one (a fairness lookup keyed only on benchmark
  let a `held-out` assessment vouch for a `train` trial).
- **Passing tests are not a substitute for typecheck.** Two real type errors
  shipped with 31/31 green tests; always run the gate.

## Ownership note

If the selector picks a requirement owned by another repository (MAT,
Agent-Bridge, IDE-Workspace, Genesis, Universal-Bridge, Poietek), implement
it **in the owner repository** and only do programme bookkeeping in
Aetherius-OS. A repository switch is **not** a stop condition. Precedent: the
MAT Claim Registry lives in MAT; Agent-Bridge capabilities live in
Agent-Bridge.
