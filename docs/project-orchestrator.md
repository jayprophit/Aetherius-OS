# Genesis project orchestrator state

`REQ-p22-project-orchestrator` — P22, owner `genesis`, status PROVEN.

Implementation: `src/genesis/orchestrator.ts`
Tests: `src/genesis/orchestrator.test.ts` (33)

## Registered scope

The registry is the scope authority:

> Long-horizon coordination state (goals, requirement/task graphs,
> worker/worktree registries, touch sets, budgets, attention, integration/
> artifact/evidence graphs, project memory, recovery) composing Bridge task_dag +
> P19/P20 state without duplicating the workflow engine; registries never store
> permanent worker personalities.

Its classification is exact: *"fragments tested in task_dag/P19/P20, no unified
orchestrator"*. The fragments exist, are tested, and are owned elsewhere. The
missing piece is the **composition**.

```
FRAGMENTS EXIST, TESTED, AND OWNED ELSEWHERE
THE MISSING PIECE IS THE COMPOSITION
ORCHESTRATOR != WORKFLOW ENGINE
ORCHESTRATOR != FRAGMENT REIMPLEMENTATION
```

## The thirteen registered lanes

`COORDINATION_LANES` holds exactly the elements the requirement names, and
`LANE_OWNERS` records the canonical owner of each as repository truth has it:

| Lane | Owner |
| --- | --- |
| `GOALS` | `registry/programme.json` |
| `REQUIREMENT_GRAPH` | `src/programme/requirements.json` |
| `TASK_GRAPH` | `agent-bridge:task_dag` |
| `WORKER_REGISTRY` | `src/workers/profiles.ts` + `spineBranch.ts` |
| `WORKTREE_REGISTRY` | `src/runners/sync.ts` |
| `TOUCH_SETS` | `src/workers/touch.ts` |
| `BUDGETS` | `src/workers/profiles.ts ProfileBudget` |
| `ATTENTION` | **`UNASSIGNED`** |
| `INTEGRATION_GRAPH` | `changeImpact.ts` + `analysis/languageGraph.ts` |
| `ARTIFACT_GRAPH` | `REQ-p17-artifact-library` |
| `EVIDENCE_GRAPH` | `src/programme/evidenceGraph.ts` |
| `PROJECT_MEMORY` | `REQ-memory-integrity-boundary` (**OWNER_GATED**) |
| `RECOVERY` | `src/workflows/lifecycle.ts` |

Two of those deserve attention. `TASK_GRAPH` is owned by Bridge `task_dag`,
which is **not in this repository** — a fact, not an omission. And `ATTENTION`
has no established owner here, so it is declared `UNASSIGNED` rather than
pointed at something that does not own it.

## References, not copies

The state holds a `LaneLink` per lane: its state (`LINKED`, `GATED`,
`UNLINKED`), its declared owner, an optional caller-supplied `ref`, an optional
`gateRef`, and provenance. It does not read, copy, re-derive or reimplement a
goal, task graph, touch set, budget, evidence graph or recovery path.

```
A LINKED LANE IS A REFERENCE, NOT A COPY
A MISSING LINK IS NOT AN EMPTY ELEMENT
NO REFERENCE != PROVEN ABSENCE
```

Two guards enforce that. A `ref` that parses as embedded JSON content is
refused — somebody pasting a fragment into a link would make the orchestrator a
second owner of that content. And supplying an `owner` that disagrees with
`LANE_OWNERS` is refused, so a lane cannot be quietly re-pointed.

`assemble()` reports **every** registered lane whether or not it is linked, so an
absent link is visible as absent instead of vanishing from the report.

## Registries never store permanent worker personalities

A worker or worktree lane links a registry *reference*. It cannot hold a persona,
a name-as-identity, traits, a backstory or autobiographical content, because a
specialist name is a temporary worker, not a permanent identity. `personality`,
`persona`, `traits`, `backstory`, `biography`, `autobiography`, `identity`, `dna`,
`soul`, `consciousness`, `selfModel`, `preferences`, `quirks` and `catchphrase`
are rejected **at any nesting depth, including inside arrays** — a personality
smuggled in as nested metadata is still a personality.

```
WORKER REGISTRY != PERSONALITY
WORKER NAME != IDENTITY
SPECIALIST != PERMANENT CAST
REGISTRY != PERSONHOOD
```

The report asserts `storesWorkerPersonalities: false` rather than leaving it to
be assumed.

## Project memory is an owner decision, not an implementation

`REQ-memory-integrity-boundary` is **OWNER_GATED** on exactly the
worker-scratch-versus-Genesis-autobiographical-memory question. This unit
therefore cannot create autobiographical memory and does not: the lane
**requires a `gateRef`**, and is recorded as `GATED` with that gate visible
rather than quietly missing.

```
PROJECT MEMORY != SYNTHESISED HERE
NO OWNER DECISION != ASSUMED BOUNDARY
```

## It runs nothing

There is no engine here: no step execution, no run, execute, schedule, dispatch,
retry or queue surface, and no goal/task/budget/evidence content constructor.
`src/workflows/` keeps the workflow engine, `src/scheduler/` keeps scheduling,
and `src/genesis/workers.ts` keeps temporary-worker lifecycle. None is
duplicated, wrapped or shadowed. The report asserts `executesWorkflows: false`
and `copiesFragmentContent: false`.

In-memory and caller-constructed: no clock, no filesystem, no network. Lanes are
held in registered order regardless of link order, so the assembly report is
deterministic, and linking never mutates the state it was given.

## Defect found and fixed

The personality check originally ran **after** the unknown-field check, so a
smuggled `personality` key was misreported as `COORDINATION_UNKNOWN_FIELD` —
hiding what actually went wrong. Personality detection now outranks the
unknown-field check, so the error names the real problem. This is the same
lesson as the execution-checkpoint unit, now applied to a third contract.

## Gates

- `src/genesis/orchestrator.test.ts` — 33/33
- related (genesis, toolchain, workers, analysis, programme, state, runners,
  scheduler) — 519/519
- `npm run typecheck` — clean
- `npm run build` — clean, 46 modules
- `npm run registry:validate` — clean, 243
- lint — `NOT_APPLICABLE`; no lint script and no
  eslint/biome/oxlint/tslint/stylelint/prettier config in the repository. **Not
  a pass.**
- full suite — **not a clean pass**: 1056 tests, 1052 passed, 4 timeouts,
  **0 assertion failures**, in pre-existing filesystem-heavy tests this unit
  never touched. Re-running the *same two files* in isolation is fully green
  **65/65**, with "cycles and depth excess fail honestly" at 3930ms and "missing
  and failing tests block promotion" at 2218ms — both comfortably inside the 5s
  limit they exceeded under full-suite load. Open timing item; see
  `native/BUILD-TODO.md`.

Source: `RESEARCH_NOTE` "spine-branch research" provenance line, research addendum
2026-09-23. `RESEARCH_NOTE != CITATION`.
