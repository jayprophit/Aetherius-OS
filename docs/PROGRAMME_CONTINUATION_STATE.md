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

`REQ-p22-project-orchestrator` (P22, READY). **The programme has left P20** �
P20's aetherius-owned READY units are closed. A phase transition is not a stop
condition.

Selector order is deterministic: priority desc, dependents count desc, phase
number asc, id lexicographic asc. It is never overridden manually.

The selector has moved four times since `REQ-p20-execution-checkpoints` closed
(`language-graph`, `spine-branch`, `toolchain-registry`, `project-orchestrator`). Those were the
selector's calls, not checkpoint predictions — `CHECKPOINT PREDICTION !=
SELECTOR RESULT`. Read the exact registered requirement before implementing the
next one.

## Last completed requirement

`REQ-p20-spine-branch` — canonical spine, branch isolates, typed structured-output
merge-back, commit `8ce72d1`. **P19 is 20/20 COMPLETE; the programme is in P20.**

Closed immediately before it: `REQ-p20-language-graph` (`b888395`) and
`REQ-p20-execution-checkpoints` (`0161a86`).

Boundaries that still bind later units:

- a collision forecast is not prevention (`applySync` remains the reactive
  oracle);
- a checkpoint is not recovery proof, not authorization, not completion, not
  memory and not placement;
- the project language graph *produces* edges while change-impact remains the
  owner of impact querying;
- a branch merge-back is not completion, not merge authority, not recovery, and
  branch workers stay temporary.

## Commits (Aetherius-OS, local only — never pushed)

| Commit | Requirement |
| --- | --- |
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

1. `REQ-p22-project-orchestrator` (selected now). Read its exact registered
   requirement, owner and dependencies before implementing.

Closed so far in this stretch: `REQ-p20-change-impact`, `REQ-p20-collision-predictor`,
`REQ-p20-execution-checkpoints`, `REQ-p20-language-graph`, `REQ-p20-spine-branch`,
`REQ-p20-toolchain-registry`.
Their boundaries are recorded in `docs/change-impact.md`, `docs/collision-predictor.md`,
`docs/execution-checkpoints.md`, `docs/project-language-graph.md` and `docs/spine-branch.md`.

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

The full suite intermittently reports 3-6 failures on this machine.
Investigation established **timeouts only and 0 assertion failures**, always in
pre-existing filesystem-heavy tests this work never touches.

The failing *set* changes between runs, which is itself the evidence that this
is machine-load timing rather than a logic defect. Runs observed so far:

- `src/workflows/workflows.test.ts` — "cycles and depth excess fail honestly"
  (measured 11.9s, 3.5s, and 6.9s against a 5s per-test limit)
- `src/workflows/promotion.test.ts` — review/approval cases, and "raw secrets
  are critical findings leading to quarantine"
- `src/programme/proposals.test.ts` — "rejects a non-proposal record on load"
- `src/providers/invoke.test.ts` — "invocation evidence persists metadata only
  through P17 state"
- `src/scheduler/scheduler.test.ts` — "later ticks do not duplicate; next
  recurrence creates anew", and "restart loads persisted state and continues
  without duplication"
- `src/steward/integration.test.ts` — "event trigger -> activation -> durable
  steward report with event provenance"
- `src/workflows/workflows.test.ts` — "interrupted safe steps resume; unsafe
  steps require reconcile" in addition to "cycles and depth excess"

Re-running the affected files in isolation clears all of them; the
long-standing `workflows.test.ts` "cycles and depth excess" case is the slowest,
measured at 3341ms in isolation against 5831ms under full-suite load — the load
signature rather than a slow assertion. No timeout was raised, no test skipped,
no assertion weakened. If it persists, the fix is to raise `testTimeout` for
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

READY work still exists across P20 (6), P22 (4), P29 (4), P17 (4), P27 (3),
P25 (2), P26 (2), P31 (2), P23 (1) and P24 (1). **P19 being exhausted is
not a stop condition** — the programme continues into the next phase the
selector selects.

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
| Full test suite | 949 tests. **Not a claimed clean pass — see open timing item.** Last run: 946 passed / 3 timeouts / 0 assertion failures. |
| Toolchain-registry unit | 40/40 |
| Spine-branch unit | 34/34 |
| Language-graph unit | 58/58 |
| Execution-checkpoint unit | 43/43 |
| Related (toolchain, workers, analysis, programme, state, runners, providers) | 519/519 |
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

**No executable items in a phase is not the same as that phase being
complete.** Continue across phases per selector output.

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
