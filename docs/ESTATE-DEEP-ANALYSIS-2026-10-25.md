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

`aetherion-engine` is **design-seeded, still not implemented**. The owner's
scope definition (video, graphics, audio and game engine all-in-one) and
`apps/aetherion-engine/DESIGN_SEED.md` exist, including the corpus-derived
requirements added on 2026-10-27. There is no source code and no asset, so the
status stays `NOT_STARTED`; the earlier statement that no design material
existed is superseded.

## 3. Core project state

### Genesis

- `Genesis/Genesis-Model`: clean 20M-token run, full held-out evaluation and
  full pytest (32 passed, exit 0 on 2026-10-25) are done; docs are updated.
  The clean model is published publicly at `jayprophit/Genesis-Model`, `main`
  `f8484cb`. Remaining: resume test, tool-format validity, longer runs, real
  vision data, master-prompt/conversation-source registration.
- `Aetherius-OS/kernel/Genesis`: separate kernel project marked `VERIFIED`; not
  touched by the model work.

### Aetherius-OS

- Declared gate: `npm run verify` = secret scan, typecheck, app typecheck, host
  tests, app tests, build.
- Host suite: 1,804 passed / 1 skipped / 1,805 total (2026-10-27, 77.33 s);
  the same counts were recorded on 2026-10-25.
- App slices: `node apps/verify.mjs` passed 4/4; build report and todo report
  sync tests pass 9/9; source-registry tests pass 14/14.
- CI: the drift fix is committed and pushed to `origin/master` as `8724f3d`;
  GitHub Actions run `40464186852` is green (2026-10-27).
- Remaining: app UI/payment/editor/chat, credential rotation, and the 14
  not-started projects.

### Agent-Bridge

- Fast gate is bounded and documented; the full gate still contains the
  35–40 minute mutation proof plus the external-application proofs.
- Measured fast gate (2026-10-25): 2,301 passed, 18 skipped, 1 failed (MAT
  timeout, now slow-marked with a 300 s timeout), 50 deselected, 18 subtests
  passed in 2,158.66 s. A clean re-run is recorded in the 2026-10-27 update.
- `main` CI is green (run at 2026-10-25 11:53); `build.yaml` records
  `AB-TST-001` as FIXED and `TODO-AB-001` as DONE.
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
5. Only then start new projects. `aetherion-engine` has an owner-supplied scope
   and a design seed; it still needs an implementation decision and code.

## 7. 2026-10-27 update

This section records work completed after the 2026-10-25 pass. It does not
rewrite the earlier measurements.

### Genesis publication

- `jayprophit/Genesis-Model` is public; `main` is `f8484cb`.
- The publication was scanned for secrets before the push; the scan was clean.
- The local `genesis-native-v06` branch is intentionally not published.
- Full pytest on the clean tree: **32 passed, exit 0** (2026-10-25).

### Aetherius CI and corpus

- The report/source-registry drift is fixed: report tests 9/9 and source-registry
  tests 14/14 pass.
- The fix is committed and pushed to `origin/master` as **`8724f3d`**; GitHub
  Actions run **`40464186852`** is green (2026-10-27).
- The chat corpus was inventoried: **373 files, 1,112 conversation records,
  286,033,461 bytes**. Report:
  `docs/CHAT-CORPUS-INVENTORY-2026-10-27.md`. The ranking is keyword-based
  triage, not a semantic proof.

### aetherion-engine design seed

- `apps/aetherion-engine/DESIGN_SEED.md` now carries corpus-derived requirements
  A–H: asset pipeline, rendering, simulation/game systems, audio, video,
  platform, constraints, and source threads.
- The project remains **`NOT_STARTED`** with **0 source lines**. The seed is
  design input, not an implementation claim.
- The parent repository ignores `apps/aetherion-engine/` because each first-party
  project keeps its own repository. The design seed is published separately at
  `jayprophit/aetherion-engine` (public, `main` `ac28aca`), not in the Aetherius
  commit.

### Agent-Bridge

- The MAT unknown-symbol proof is slow-marked with a 300 s timeout; it parses
  1,714 YAML files (54 MB) and measured 198.3 s on 2026-10-25, so the original
  120 s limit failed on data volume, not a hang.
- The clean fast-gate re-run is measured on 2026-10-27: **2,297 passed, 18
  skipped, 55 deselected, 18 subtests passed in 1,114.05 s (18:34), exit 0**.
  It is recorded in `Agent-Bridge/build.yaml` and
  `Agent-Bridge/docs/BRIDGE_FAILURE_DISPOSITION.md`.
- The mutation proof now prints per-mutation progress; a capped check captured
  `[mutation-proof] 23 mutations`, `1/23 start: intake bypasses
  protocol.validate_action`, `1/23 done in 152.3s` and `2/23 start`. The
  documented full gate runs with `-s` so the lines are not captured.
- `main` CI is green (run `40211806596` on `57304d0`, 2026-10-25).

### OpenClaw live gateway

- The live gateway is the WSL distro `OpenClawGateway`, OpenClaw **2026.9.6**,
  systemd user service `openclaw-gateway.service`, port 18789. The Windows npm
  install is separate and does not own that port.
- A user-space Ollama **0.40.11** now runs inside the gateway distro because WSL
  cannot reach the Windows Ollama listener (firewall, no admin, Windows 10
  19045 has no mirrored networking).
- Local model: **`qwen3.5:2b-q4_K_M`**, 1.9 GB, capabilities completion, vision,
  tools and thinking. Runtime context **16,384** tokens; the GPU uses about
  3.0 GB of 4.0 GB.
- Measured: direct generation **25.32 tok/s**; a gateway turn returned `42` with
  no fallback; a tool turn called `read` once with zero failures and returned
  `DESKTOP-IONV32V` from `/etc/hostname`.
- Six hosted free-tier providers (OpenRouter, Google, Groq, Cerebras, Mistral,
  NVIDIA) are configured through env SecretRefs. They are **cold** until the
  owner sets `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`,
  `CEREBRAS_API_KEY`, `MISTRAL_API_KEY` and `NVIDIA_API_KEY`; the gateway stays
  healthy and reports six degraded secret owners. No provider key is stored.
- Full record: `docs/OPENCLAW-LOCAL-AND-FREE-MODELS-2026-10-27.md`.

### Verification added in this update

| Check | Result |
|---|---|
| Genesis public repository | `jayprophit/Genesis-Model`, `main` `f8484cb`, secret scan clean |
| aetherion-engine public repository | `jayprophit/aetherion-engine`, public, `main` `ac28aca`, 3 docs only |
| Aetherius CI | run `40464186852` green for `8724f3d` |
| OpenClaw direct local inference | 25.32 tok/s, tool call returned `get_weather({"city":"Lagos"})` |
| OpenClaw gateway plain turn | `42`, provider `ollama`, no fallback, no error |
| OpenClaw gateway tool turn | `read` once, 0 failures, `DESKTOP-IONV32V` |
| OpenClaw GPU at 16k | 3,052 MiB / 4,096 MiB |
| OpenClaw secret audit | 1 pre-existing plaintext gateway token, 6 expected unresolved refs, 0 stored provider keys |
| Agent-Bridge fast gate re-run | 2,297 passed, 18 skipped, 55 deselected, 18 subtests passed in 1,114.05 s (18:34), exit 0 |
| Agent-Bridge mutation-proof progress | `[mutation-proof] 23 mutations`, `1/23 start`, `1/23 done in 152.3s`, `2/23 start` (capped check, not the full proof) |
| Aetherius `npm run verify` re-run | exit 0: secret scan clean (970 files, 5 allowlisted), 1,804 passed / 1 skipped in 77.33 s, app slices 4/4, build 4.51 s |
| Aetherius first verify attempt | failed 2 provenance tests on a two-day-old `kernel/Genesis/.git/index.lock`; lock removed and the test's probe path reset, then the clean re-run passed |
