# Estate deep analysis — 2026-10-25

Scope: `C:\Users\jpowe\Desktop\Projects`, read from the build manifests,
`Aetherius-OS/docs/PROJECT-TODOS.yaml`, the project registries and the actual
working trees. Nothing in this document is a projection: every number below was
measured on this host on 2026-10-25 unless it is explicitly attributed to an
earlier run.

## 1. What was wrong, and what was fixed

### 1.1 Genesis shard did not match its declared corpus

The 2026-10-24 `local_1m` run described the whole 59-book Gutenberg folder in
its plan, but its shard contained only the first 13 books in path order
(12,523,599 characters). The loss was real; the corpus claim was not.

Fixed in `Genesis/Genesis-Model/scripts/local_train.py`:

- every shard write now emits `shard_manifest.json` with per-file SHA-256,
  corpus digest, tokenizer digest and token count;
- `--reuse` / `--resume` refuse a shard whose corpus or tokenizer digest does
  not match the plan;
- a shard without a manifest is refused unless `--trust-shard` is passed
  explicitly.

The clean rerun (`runs/local_1m_clean`) used 57 files (the 59-book folder minus
the two held-out books), 40,190,580 bytes, 38,728,147 characters after newline
normalisation and 12,633,141 tokens. Decoding the shard and matching the head,
middle and tail of every source file found **0 missing documents**.

### 1.2 Parameter count was double-counted

`lm_head.weight is token_embedding.weight` (tied embeddings). Summing
`state_dict` tensors gives 1,741,952 because the same 524,288-element matrix is
stored under two names. `GenesisModel.num_parameters()` gives the true count:

- **1,217,664 unique parameters**
- 693,376 non-embedding + 524,288 embedding.

`EVIDENCE.md`, `GENESIS_STATUS.yaml`, `GAP_ANALYSIS.md` and
`MODEL_CARD_TEMPLATE.md` now use the unique count and explain the old number.

### 1.3 Genesis held-out evaluation was a sample, not held-out data

`scripts/eval_heldout.py` was extended to compare **content digests**, not file
names, and to refuse if a held-out file's digest appears in the training plan.
The clean checkpoint was evaluated on the full held-out text:

| Metric | Value |
|---|---|
| Held-out books | `pg1342` (Pride and Prejudice), `pg1399` (Anna Karenina) |
| Digest overlap with the 57-file plan | **none** (`overlaps: []`) |
| Scored tokens | 885,447 in 3,459 blocks |
| Loss | **3.467427** |
| Perplexity | **32.0542** |
| Bits per byte | **1.638118** |
| `pg1342` | 3.401453 / 30.0077 / 1.550229 |
| `pg1399` | 3.490284 / 32.7953 / 1.670540 |
| Decode throughput | 5.04 tok/s (32 tokens, 6.35 s) |

Report: `Genesis/Genesis-Model/docs/heldout_local_1m_clean.json`. This is a
baseline, not a quality claim: 1.22M parameters on classic literature learns
local style, not reasoning.

### 1.4 Aetherius worker cap was inert

`vite.config.ts` used `poolOptions.forks.maxForks`, an option Vitest 4 removed.
Vitest read it only to print a deprecation warning, so the suite ran at the
default (logical processors minus one: seven on four cores). The cap is now the
top-level `maxWorkers: 4` / `minWorkers: 1`, which Vitest 5 honours. The
manifest note in `build.yaml` was corrected rather than left claiming a limit
that did not exist.

### 1.5 Agent-Bridge fast gate waited on desktop applications

The `slow` marker covered only the 35–40 minute mutation proof. The fast gate
still launched Blender, FreeCAD, CuraEngine, OpenModelica, a real Chromium and
PowerShell/WMI hardware probes, and ran a live Ollama inference. On this host
that is not a repository gate: it is an environment proof.

Disposition (no test deleted or weakened):

- whole module slow: `test_actions_intake_mutations`,
  `test_approved_grant_mutations`, `test_desktop_e2e`, `test_ui_acceptance`;
- per-test slow: 3 Blender, 3 FreeCAD, 1 Cura, 1 OpenModelica, 5
  `TestBrowserReal`, 4 forced-refresh `test_device_runtime` tests;
- live Ollama inference is opt-in via `AETHERIUS_LIVE_OLLAMA=1`;
- `test_collision_oracle` was unmarked after measuring 15.39 s for the module,
  below the 45 s budget.

The first attempt at the final fast run then exposed a second live-inference
hole: `test_local_team_execution.py` and `test_model_lifecycle_leases.py` still
ran real Ollama work whenever the runtime was reachable. `test_integration_step_ran`
held the gate at 45% for more than eight minutes while three 3B inferences ran
through `run_parallel_branches`; the provider's release path was still polling
`/api/ps` when the process was sampled with `py-spy`. Those classes now require
`AETHERIUS_LIVE_OLLAMA=1` **and** carry the `slow` marker, and an unused live
`setUpClass` in `ContextScopingTests` was removed (no test read its summary).
After the change, fast collection is **2,320 of 2,370 tests (50 deselected)**.

Fast collection was **2,344 of 2,370 (26 deselected)** before that second fix;
the measured fast duration in this document is the post-fix run.
Refusal/safety tests that do not need an external process stayed in the fast
gate on purpose.

### 1.6 Root hygiene was already broken

`Aetherius-OS/docs/workspace-hygiene.test.ts` failed on a root-level
`GENESIS_AETHERIUS_MASTER_GAP_ANALYSIS_2026-10-25.md` (14,616 bytes, created
09:44). It is an earlier read-only audit and is stale in several places (it
still reports 1.74M parameters and 29 tests). It was preserved unchanged and
moved to `Temp/`, which the hygiene guard allows. This document itself lives in
`Aetherius-OS/docs/` rather than the Projects root for the same reason. After
the move the hygiene suite passes 14 of 14.

## 2. Estate status

Source: `Aetherius-OS/docs/BUILD-MANIFEST-REGISTRY.yaml` (40 projects).

| State | Count |
|---|---|
| VERIFIED | 7 |
| PARTIAL | 19 |
| NOT_STARTED | 14 |

Note: the registry records **programme state**, while a project's own
`build.yaml` records **verification state**. They can differ by design. For
example MAT's toolchain is `VERIFIED` in its manifest, but the registry keeps it
`PARTIAL` because the Codex app is still being worked on; `crossplatform`,
`virtual-assistant` and `quantum-os` are the reverse (registry `PARTIAL`,
manifest `NOT_STARTED`). The build report counts the registry state. This
document does not silently reconcile them.

### 2.1 Verified (7)

| Project | Manifest | Notes |
|---|---|---|
| Aetherius-OS | `Aetherius-OS/build.yaml` | Host IDE and programme registry; gate is `npm run verify` |
| Genesis (kernel) | `Aetherius-OS/kernel/Genesis/build.yaml` | C++/kernel project, separate from `Genesis/Genesis-Model` |
| IDE-Workspace | `Aetherius-OS/apps/IDE-Workspace/build.yaml` | |
| Poietek | `Aetherius-OS/apps/Poietek/build.yaml` | |
| Universal-Bridge | `Aetherius-OS/apps/Poietek/absorbed/Universal-Bridge/build.yaml` | |
| LedgerLands | `Aetherius-OS/apps/LedgerLands/build.yaml` | |
| Hermes-Config-Audit | `Aetherius-OS/tools/Hermes-Config-Audit/build.yaml` | |

### 2.2 Partial (19)

- **Agent-Bridge** and its three variants (`cloudhybrid`, `dashboard`,
  `runtimesafety`): gate cost, root-level one-off scripts, governance backlog.
- **MAT**: toolchain verified; the Codex desktop app is still active work.
- **Aetherius app slices** — commerce, learning, community: service + tests are
  built and registered; storefront/learner/chat UI, a real payment provider, a
  content editor and a real chat path are not.
- **Programme/ecosystem** — `aetherial-platform`, `niche-platform`,
  `web-platform`, `crossplatform`, `football-card-game`, `self-building-ai`,
  `aetherial`, `quantum-os`, `qva-merged`, `virtual-assistant`,
  `architecture-of-shadows-book`.

### 2.3 Not started (14)

`athena`, `decentralized-messaging-app`, `food-wiki-app`, `veyra`, `aetherium`,
`sovereign-financial-os`, `aetherion-engine`, `holonav-os`,
`quantum-ai-assistant`, `aetherius-health-library`,
`aetherius-os-worldclass-prototype`, `aetherius-os-prototype`,
`ai-digital-twin`, `trading-bot`.

`aetherion-engine` is **blocked, not merely unstarted**: no recovered scope or
design material exists in the estate. Building it would mean inventing a
product, so it stays `NOT_STARTED` until the owner supplies the definition.

## 3. Core project state

### Genesis

- `Genesis/Genesis-Model`: clean 20M-token run and full held-out evaluation are
  done; docs are updated. Remaining: full pytest count after the tokenizer
  change, resume test, tool-format validity, longer runs, real vision data,
  master-prompt/conversation-source registration.
- `Aetherius-OS/kernel/Genesis`: separate kernel project marked `VERIFIED`; not
  touched by the model work.

### Aetherius-OS

- Declared gate: `npm run verify` = secret scan, typecheck, app typecheck, host
  tests, app tests, build.
- Last recorded host suite: 1,804 passed / 1 skipped / 1,805 total.
- App slices: `node apps/verify.mjs` passed 4/4; build report and todo report
  sync tests pass 9/9.
- Remaining: app UI/payment/editor/chat, credential rotation, and the 14
  not-started projects.

### Agent-Bridge

- Fast gate is bounded and documented; the full gate still contains the
  35–40 minute mutation proof plus the external-application proofs.
- Remaining: AB-SCR-001 (root-level scripts), AB-GOV-001 (4,066 unknown
  requirements), AB-PRS-001 (63 reuse decisions), AB-PUSH-001 (push blocked by
  environment deny-rule), credential rotation.

## 4. Cross-cutting findings

1. **Claims must be tied to the bytes actually used.** The Genesis shard bug is
   the clearest example: the plan was true, the shard was not. Manifests and
   digests now make that class of error fail closed.
2. **A verification gate that launches desktop applications is not a gate.**
   Marker the environment proofs, keep the refusal tests fast, and schedule the
   rest.
3. **A config option that is silently ignored is worse than no option.** The
   Vitest cap looked correct and did nothing. Check the runner's own output for
   deprecation warnings when a limit matters.
4. **Status vocabulary is not uniform.** Registry state, manifest state and
   test state answer different questions. Reports must say which one they use.
5. **Uncommitted work is the norm in this estate.** All three core working trees
   carry uncommitted changes (Agent-Bridge 13 paths, Aetherius-OS 33,
   Genesis-Model 15 at the time of this scan); nothing was reset or discarded
   during this pass.

## 5. Verification log for this pass

| Check | Result |
|---|---|
| Genesis clean training | 2,441 steps, 19,996,672 tokens, `text_ce=3.4716`, 866.23 s, 28,474.9 tok/s, 783.8 MB peak VRAM |
| Genesis shard content | 57/57 documents present, 0 missing |
| Genesis held-out | 3.467427 loss, 32.0542 ppl, 1.638118 bpb, 0 digest overlaps |
| Genesis full pytest | 32 passed, exit code 0 (2026-10-25) |
| Aetherius `npm run verify` | pending in this pass |
| Aetherius secret scan | clean: 944 files, 5 allowlisted, 99.2 s (2026-10-25) |
| Aetherius workspace hygiene | 14/14 after moving the root-level audit doc to `Temp/` |
| Agent-Bridge fast gate | pending in this pass |
| Aetherius app slice verify | 4/4 slices passed (2026-10-25) |
| Build/todo report sync | 9/9 tests passed (2026-10-25) |

## 6. Recommended order from here

1. Close the three pending verification runs and record their measured numbers
   in the manifests (no estimated timings).
2. Finish the Aetherius app slices that already have services: UI, payment
   provider, content editor, chat. Those are product work, not verification.
3. Reduce Agent-Bridge's root-level script surface and record reuse decisions;
   the runtime itself is not the blocker.
4. Rotate the two owner-gated credentials at the providers; the code cannot do
   this.
5. Only then start new projects. `aetherion-engine` waits for an owner-supplied
   scope.
