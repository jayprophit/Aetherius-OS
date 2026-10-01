# ADR-0001: System Capability Registry architecture

Date: 2026-10-01
Status: accepted

## Context

BUILD61 requested a permanent, programme-wide capability registry. The
repository already had: requirements.json (110 execution requirements with
states, owners, evidence), evidenceTrace.ts (machine-checkable citations with
owner-roots resolution), select.ts (deterministic selector), registry/
programme and dependency truth, and reference-capabilities.json (EXTERNAL
systems only, STUDY_ONLY). A second competing registry would violate §23.

## Decisions

1. **Single YAML source at docs/SYSTEM-CAPABILITY-REGISTRY.yaml.**
   Rationale: docs/ holds authoritative design records; registry/ holds
   generated programme state. The capability registry is source, not state.
   YAML was explicitly preferred; the `yaml` devDependency parses it, so no
   hand-rolled parser exists to drift from the spec.

2. **REQ-* nodes materialize at load; CAP-* nodes are authored.**
   The requirements registry stays the single source of truth for requirement
   state. The loader maps status/work_state onto the capability lifecycle
   (PROVEN→VERIFIED, SPECIFIED→DESIGNED, RESEARCH→RESEARCH, PARTIAL→PARTIAL;
   IN_PROGRESS→PARTIAL, READY→DESIGNED, BLOCKED/OWNER_GATED→BLOCKED,
   DEFERRED→NOT_STARTED) and attaches hierarchy plus evidence paths. No
   requirement is duplicated; uncovered requirements fall back to
   owner-default parents so coverage is total by construction.

3. **Owner-roots path resolution.**
   Owner names the accountable project, not the repo. Implementation and test
   paths resolve in the owner repo first, then Aetherius-OS — the same
   convention evidenceTrace established and documented. Broken only when every
   available root lacks the path; unavailable roots skip, never fail.

4. **Progress is derived, estimates are labeled.**
   Leaf mapping per §10; PARTIAL leaves without measurement read 50 as
   `unmeasured-partial-estimate`; parents roll up children means;
   required-only variant excludes `required:false`; retired states are
   excluded. No hand-entered parent percentages exist anywhere.

5. **Reports are generated, sync-tested, per-project.**
   The full report plus one view per top-level domain generate from the same
   function; committed files must byte-match or gates fail. Per-project views
   satisfy "each project gets a registry" without creating competing truths.

6. **Research ingestion is classification, not import.**
   External inputs enter as RESEARCH nodes with provenance, as aliases, or as
   evidence — or are quarantined when unresolvable. Nothing researched becomes
   a requirement without a genuine, deduplicated gap.

## Consequences

- New capability work must pass the workflow (search → classify → delta).
- requirement_parents overrides need justification; defaults are coarse.
- The registry grows by evidence, not by handoff paragraph count.
