# Phase D — the loop runs end to end

Date: 2026-10-01
State: five vertical scenarios green twice, through the real stack

The chain Genesis proposes -> P25 authorizes -> Agent Bridge executes ->
journal records -> world state verifies -> IDE presents now runs as one
continuous, tested loop. No stage is faked.

## What closed it

The missing seam was Genesis Action Proposal -> BridgeActionRequest. A
search proved no adapter existed, so the minimum was built where it belongs:
IDE-Workspace `workspace/integration/proposal_adapter.py`, consumer-side
glue. Agent Bridge must never accept proposal-shaped input (that would be a
second intake shape), and Genesis C++ has no HTTP. The adapter translates
fields, verifies the parameter digest against a documented canonical-JSON
convention, and refuses refused proposals, digest mismatches, `finish` verbs,
moves without destinations, and any authority-adjacent key at any depth.
Digests and Genesis routing ids never reach the wire; workspace, approval,
interactivity and owner_mode come from host options only. One stated
trade-off: a parameter literally named "approve" is refused fail-closed.

## The five scenarios (each run twice, all green)

| Scenario | Proof |
| --- | --- |
| ALLOW | proposal -> adapter -> intake AUTO_SAFE -> SUCCEEDED; file bytes verified; effect_achieved; journal + manifest + timeline agree; a canary file proves the injected model never ran |
| DENY | ASK + interactive, human denies -> DENIED, no file, blocked=true, while the session reports COMPLETED; outcome reads the journal, not the status |
| ASK | WAITING_APPROVAL with a real id -> approve -> SUCCEEDED; the same approval id reused is refused |
| ASK-NEGATIVE | interactive on a non-external runtime -> explicit 403 naming the missing switch, never a silent deny |
| MULTI-RESOURCE | move via adapter: source gone, destination written, both gated; adapter refuses a missing dest |
| ALL-DENIED | denial journalled, denied_actions=1, effect_achieved=false, blocked=true |

Adapter gates: 25 unit tests, 4/4 mutations caught (digest, banned scan,
disposition-invents-approval, refused-still-sent). IDE gates at commit
c881700: vitest 80, integration pytest 40 + 4 subtests, tsc clean, vite
build clean.

## What this does not prove

- The C++ emitter itself is proven by its own suite (Genesis 6fd5342, 6/6
  mutations); the scenarios build the exact dict it emits, including the
  digest convention. There is no C++-to-HTTP step because Genesis has no
  HTTP client, by design.
- One green run each (twice) is not reliability evidence. Repetition under
  the repeatability watch (leakage, replay, collisions, stale state, timing,
  reuse, ordering) is still open, as are the expanded workflow, the
  security/recovery/performance/privacy audits, worker-runtime ownership,
  abstraction, the five traceability dispositions, and packaging.
- No external leaderboard ranks are claimed or claimable; see
  docs/benchmark-baseline-2026-10-01.md for what was actually measured.
