# REQ-p22-selective-escalation — Selective Escalation Decisions (P22 proposes, P25 disposes)

Status: PROVEN / COMPLETE. Owner: genesis.

## Registered scope

Typed `EscalationDecision` (`can_continue`, missing/ambiguous/contradictory
info, resolvability routes, `requires_human`, confidence); cognition proposes,
P25 authority disposes; never auto-grants or bypasses approvals.

Prior state: only the `EscalationSignal` projection and untyped `"escalate"`
strings existed. No `EscalationDecision` existed anywhere.

## What was built

`src/genesis/escalation.ts` — `decideEscalation()` composes a typed decision
from the existing `escalationSignal()` output plus caller-supplied escalation
context. `src/genesis/escalation.test.ts` — 46 tests.

## Binding distinctions (tested)

- ABSTENTION != ESCALATION — built only from an abstained signal; a
  non-abstained case continues normally without a decision.
- ESCALATION != AUTHORIZATION — disposition is always `PROPOSED`, disposed by
  `P25`, `p25Disposition: PENDING`. Authority-shaped keys rejected by name.
- ESCALATION DECISION != ESCALATION EXECUTION — resolvers recommend only;
  execution-shaped residue rejected by name.
- LOW CONFIDENCE != AUTOMATIC HUMAN REQUIREMENT — `requires_human` derives
  solely from the closed human-only vocabulary; false at confidence 0.01.
- MISSING EVIDENCE + HIGH CONFIDENCE STILL BLOCKS — `can_continue` false
  with missing items at confidence 0.99.
- CONTRADICTION != AUTOMATIC RESOLUTION — both sourced claims preserved,
  no winner field, continuation blocked.
- UNAVAILABLE != DENIED — unavailable resolvers keep their blocker ref
  (e.g. REQ-p18-model-fabric); no silent reroute.
- CALIBRATION CAPABILITY EXISTS != EVERY SIGNAL CALIBRATED — `calibrated:
  true` requires a calibration evidence ref; nothing here duplicates
  temperature scaling or PAVA.
- ESCALATION CONFIDENCE != ERROR/UNSAFETY/ABSTAIN PROBABILITY — confidence
  means completeness of this decision only; foreign meanings rejected.

## Validation precedence

Authority / execution / persona / secret violations are diagnosed BEFORE
generic unknown-field errors, so a smuggled violation is reported as itself,
never as an extra key.

## Gates

- Targeted: 46/46. Related (genesis+programme+state): 396/396.
- Typecheck clean. Lint NOT_APPLICABLE.
- Full suite: 1146/1146 CLEAN PASS (68 files, 28.58s, zero timeouts).
- Build clean. Registry validation 243/243.
- Requirement mutation: id-anchored surgical edit, 3-line diff, JSON
  re-validated, no other requirement ID touched.
