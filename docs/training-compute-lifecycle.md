# Training Compute Lifecycle Profile (REQ-p18-training-compute, P18)

Model **training-compute lifecycle metadata** used as **advisory routing
evidence**. Implementation: `src/providers/trainingLifecycle.ts`.

The registered requirement is the scope authority:

> Model lifecycle metadata (pretraining/post-training stage, compute class,
> attention/position-encoding tags) as advisory routing evidence; host
> inference signals are a different domain.

## The registered form: a lifecycle metadata profile

Not a training-run record. The four facts it carries are exactly the four the
requirement names:

| Fact | Shape |
| --- | --- |
| lifecycle stage | `pretraining` \| `post-training` |
| compute class | open, provenance-bearing claim |
| attention tags | open vocabulary, provenance-bearing |
| position-encoding tags | open vocabulary, provenance-bearing |

## What this deliberately does not contain, and why

The requirement asks for **no measured training compute**, so this record
has **no numeric measurement fields at all**: no FLOPs, no wall time, no
memory usage, no energy, no cost, no utilization, no token counts, no
step/epoch counts, no batch or sequence length.

Adding them would mean inventing numbers the requirement never requested and
that this repository cannot measure. The only hardware measurement here is
`src/providers/hardwareProbe.ts`, an FP32 CPU matmul latency probe — there is
no energy sensor, no allocator/RSS probe, and no training telemetry backend.
A record of training compute that carried no compute would be theatre.

```
TRAINING COMPUTE PROFILE != TRAINING RUNTIME
TRAINING METADATA     != MODEL TRAINING
TRAINING PLAN         != TRAINING EXECUTION
MODEL LIFECYCLE STAGE != HOST INFERENCE SIGNAL
```

The last line is the requirement's own boundary. **Host inference signals**
— `src/providers/hardware.ts`, `src/runners/targets.ts`,
`src/placement` — are a **different domain** and are not referenced, merged
or inferred here. The profile has no `hardwareRef`, `targetProfileId`,
`latencyMs`, `throughputOps`, `peakMemoryMB` or `precision` field, and a
test asserts their absence.

## Stage vocabulary: taken, not invented

`TRAINING_STAGES` is exactly `["pretraining", "post-training"]` — the two
terms the registered description itself uses. Finer stages (continue-pretrain,
finetune, instruction-tune, preference-tune, distill, quantize) are **not**
invented, because the requirement does not define them. An unknown stage must
stay unknown rather than be guessed into a finer bucket.

## Attribution: the rule that prevents fabrication

Every asserted fact carries a `LifecycleClaim`:

```ts
{ source: ClaimSource; evidenceRef?: string }
```

`ClaimSource` **reuses** the canonical `BenchmarkSource` vocabulary already
established in `src/providers/benchmarks.ts` (`LOCAL_MEASURED`,
`INTERNAL_TEST`, `VENDOR_REPORTED`, `THIRD_PARTY_REPORTED`, `HISTORICAL`,
`UNKNOWN`) rather than adding a fourth provenance dialect to this repository.
The question is the same in both places: where did this claim come from?

Three validation rules do the real work:

| Rule | Rejected |
| --- | --- |
| a **value requires a claim** | `unattributed-value` |
| a **claim requires a value** | `orphan-claim` |
| a claim **sourced `UNKNOWN` asserts nothing** | `unknown-claim` |

So a fabricated tag cannot be recorded unattributed, and provenance cannot be
left dangling to look busy.

## Unknown is not a negative fact

Mirroring the `ModelCard.tokenizerProfileId` precedent (*"Absent means
UNKNOWN — never inferred from vendor/model names"*):

- absent `stage` → unknown, **not** "no special stage"
- absent `computeClass` → unclassified, **not** "small"
- **empty** tag list → unknown, **not** "no attention mechanism" and **not**
  "no position encoding"
- a model ref is an **opaque reference**: nothing is inferred from a vendor or
  model name

`advisorySignals(...)` therefore returns an explicit `unclaimed: string[]`
listing which dimensions were never claimed, so absence is **visible** rather
than silently defaulted. A test registers a profile under
`"qwen2.5-coder-7b"` with no stage claim and asserts nothing is inferred from
the name.

## No invented compute-class vocabulary

The requirement names "compute class" but defines no scale. Rather than
invent `small`/`medium`/`large` and present them as canonical, `computeClass`
is an **open string** requiring provenance. A test registers
`"frontier-scale"` successfully to prove the vocabulary is not closed.

## Identity and versioning

- `profileId` is `tclp-<slug>`, matching `/^tclp-[a-z0-9][a-z0-9-]*$/`, so it
  **structurally cannot** masquerade as a model id, hardware profile id
  (`hardware:…`), run id, governance proposal id (`gov-…`) or review pack id
  (`rcp-…`).
- `version` is strict `x.y.z`, keyed as `profileId@version` — the exact
  convention already used by `DatasetRegistry` and `ScorerRegistry`.
- `TrainingLifecycleRegistry` follows the house profile-registry pattern:
  validate then refuse a duplicate key, deep-copy on register, deep-copy on
  every read, and `list()` deterministically ordered by id then version.
- A new version is a **new record**, never a silent overwrite of history.
- `canonicalProfile` key-sorts before serializing, so key-insertion order
  cannot leak; tag and evidence lists are sorted.

## Advisory only — routing is untouched

This is evidence a caller **may** consult. It is deliberately **not** wired
into routing:

- `routeCapabilityRequest` — `src/providers/capabilities.ts:113` — **not modified**
- `routeWithLiveState` — `src/providers/live.ts:58` — **not modified**

Nothing in the routing path calls `advisorySignals`. Turning advisory
lifecycle metadata into a hard routing requirement would change production
routing behaviour, which no advisory record is entitled to do.

```
ADVISORY EVIDENCE != ROUTING DECISION
MORE TRAINING COMPUTE != BETTER MODEL
PARAMETER COUNT     != TRAINING COMPUTE
```

`advisorySignals` returns no `winner`, `best`, `score`, `rank`, `eligible`,
`selected`, `route` or `decision` field, and carries `advisoryOnly: true`.

## Ownership: one owner per fact

The profile **references** the model via an opaque `modelRef`.
`ModelCard` is **not** modified and does not reference the profile — so there
is one owner per fact and no cyclic duplication. `ModelCard` remains the sole
owner of `capabilities`, `costRank`, `healthy` and `localRemote`.

No `TrainingEvidenceStore` is created: `evidenceRefs` are opaque references
in the existing `EvidenceGraph` style.

## Source honesty

The registered source is a `RESEARCH_NOTE` reference (*"model lifecycle
research"*). **No primary source document exists in this repository**, so no
citation is claimed and no paper result is reproduced. This is the same
finding as the superposition lab, and `SOURCE_CLAIM != AETHERIUS MEASUREMENT`
applies equally.

## Scope deliberately not implemented

Because the registered requirement is lifecycle *metadata*, none of the
following exists, and inventing any of it would be fabrication: training
execution, optimizers or schedulers, gradient handling, checkpointing,
distributed training (NCCL/FSDP/DeepSpeed/Horovod), Kubernetes, cloud
provisioning, FLOP estimation, benchmark integration, and any ranking of
models by compute. A test asserts no export name contains `optimizer`,
`backprop`, `gradient`, `checkpoint`, `provision`, `deploy`, `cluster`,
`kubernetes`, `distributed`, `flop`, `estimate`, `benchmark` or `route`.

Release effect: **none**. `docs/PUBLIC_RELEASE_READINESS.md` already lists the
superposition lab as EXPERIMENTAL, and this profile changes no release gate.
Public release remains `NOT YET RELEASE-PROVEN`, scope `UNDEFINED`,
`REQ-p31-release-scope` `OWNER_GATED`.

Tests: `src/providers/trainingLifecycle.test.ts` (30 tests: validation, the
two-term stage vocabulary with no invented finer stages, blank/duplicate tag
rejection, unknown claim sources, the three attribution rules, empty-tags-mean-
unknown, open compute-class claim, deterministic id generation replacing every
invalid span, id anti-masquerade, versioned duplicate refusal, invalid-record
rejection before storing, deep copy on write and read, deterministic ordering
from scrambled insertion, canonical key-sorted serialization, sorted tag and
evidence lists, advisory-only signals with an explicit unclaimed list, no
training-runtime surface, `ModelCard` not modified, no inference from a model
name, and the absence of every host-inference-signal field).
