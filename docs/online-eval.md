# Online Trace-Correlation Evaluation (REQ-p19-online-eval, P19)

A **joined** request-to-artifact trace with token/cost accounting and an
eval runner. Implementation: `src/eval/traceCorrelation.ts`.

The registered requirement is the scope authority:

> Full request-to-artifact trace correlation
> (reflex/context/model/skill/workflow/worker/policy/approval/action/
> verification) with token/cost accounting and an eval runner;
> vendor-neutral, no external observability dependency.

The registered evidence names the gap exactly: **"per-leg traces exist, no
joined evaluation."** So the join, the accounting and the runner were built —
and no individual trace leg was rebuilt.

## Vendor-neutral by construction

Correlation is built on this repository's **own `EventEnvelope`**
(`correlationId`, `causationId`, `occurredAt`). There is no
OpenTelemetry, Jaeger, Datadog, Zipkin or Prometheus dependency in
`package.json`, and none was added. Export names are tested to contain none
of them.

## The ten legs

`reflex` · `context` · `model` · `skill` · `workflow` · `worker` · `policy` ·
`approval` · `action` · `verification`

These are **trace legs, not event domains**. `EventDomain` has exactly five
members (`scheduler`/`realtime`/`workflow`/`steward`/`bridge`) and cannot
express ten legs, so it is **not widened**; an explicit, visible
`DOMAIN_TO_LEGS` mapping plus an `eventType`-prefix mapping is used instead.
An envelope that maps to nothing is reported as unmapped rather than assigned
a default leg.

## Correlation is not causation

- Only envelopes naming the **same `correlationId`** are joined.
- A `correlationId` is **never invented** for an envelope that lacks one.
- Causation edges come from **`causationId` only**. A correlation group with
  no causation reports an **empty chain** rather than a fabricated one, and
  an edge whose parent is not in the group is not asserted.

```
CORRELATION != CAUSATION
```

## Unrecorded is not "did not run"

Every one of the ten legs appears in the report. A leg with no envelope is
`UNRECORDED` **with a reason**, and there is deliberately no `SKIPPED` and no
`PASSED` state — a leg nobody recorded is not a leg that passed, and not a
leg that failed to run. Incomplete traces are **listed**, never dropped.

```
LEG UNRECORDED != LEG DID NOT RUN
LEG UNRECORDED != LEG PASSED
TRACE PRESENT   != TRACE COMPLETE
```

## Accounting never fabricates

Both `tokens` and `cost` are `OBSERVED` **only when a value and a named
source are both supplied**. An un-sourced number is not an observation.

- **There is no tokenizer runtime anywhere in this repository** — the only
  executable-tokenizer seam is the `TokenizerRuntime` interface in
  `src/context/budget.ts`, which nothing implements. So exact token counts
  are caller-supplied or **absent**, and are never estimated from a model
  name.
- An absent cost source is **not a zero cost**.
- `NaN`, `Infinity` and negative values are rejected rather than coerced.
- An observed cost keeps its source, so an *observed* amount stays distinct
  from an *invoiced* one.

```
NO TOKENIZER   != ZERO TOKENS
NO COST SOURCE != ZERO COST
OBSERVED COST  != INVOICED COST
```

## Aggregates never subtotal

`runTraceEvaluation` totals a dimension **only when every trace observed
it**. Summing over a subset would silently understate, so a partially
observed dimension is `null` — not a subtotal, and not zero.

The runner produces **no score, no rating, no rank, no winner, no grade, no
percent and no correlation figure**. It joins and accounts; nothing more.

```
ONLINE EVAL != TRAINING
ONLINE EVAL != AUTOMATIC SELF-MODIFICATION
```

## Boundaries

- No provider, store, registry, client, SDK or daemon of its own.
- No self-modification surface: nothing here changes a model, a prompt or a
  deployment.
- Events ordered by `occurredAt` then `eventId` with a **real comparator**.
- Unrecognised input keys are rejected rather than silently dropped.
- `EventDomain` is not widened and no `EVENT_DOMAINS` export is added.

## Source honesty

The registered source is a `RESEARCH_NOTE` reference (*"observability
research"*). **No primary source document exists in this repository**, so no
citation is claimed. `RESEARCH_NOTE != CITATION`.

## Release effect

**NONE.** No release gate is re-scored; public release remains
`NOT YET RELEASE-PROVEN`, scope `UNDEFINED`, `REQ-p31-release-scope`
`OWNER_GATED`.

Tests: `src/eval/traceCorrelation.test.ts` (25 tests).
