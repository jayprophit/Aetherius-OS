# Capability Registry Workflow (mandatory for new capabilities)

This is the standing procedure. Before generating a plan for any requested
capability, follow it. Prefer the smallest evidence-backed delta over new
architecture.

```text
INPUT (request, research, idea, transcript, handoff)
  ↓
SEARCH REGISTRY FIRST
  - searchRegistry() over names, aliases, descriptions
  - check existing REQ-* ids and requirement registry
  - check architecture docs and implementation paths
  - check related concepts and synonyms (STT ≠ new entry)
  ↓
CLASSIFY (exactly one)
  NEW                 genuinely absent concept
  EXISTING            already registered, point at it
  EXTENDS_EXISTING    new detail, subcomponent, or evidence for a registered id
  DUPLICATE           same concept under another name → alias, do not create
  CONFLICT            contradicts a registered entry → record conflict, do not overwrite
  RELOCATION          same capability, better parent → move with history
  EVIDENCE            implementation/test/doc proof for a registered id → attach, update status
  SUPERSEDES          replaces an entry → link superseded_by, never delete
  RESEARCH_ONLY       studied input, not a build target → research catalogue with provenance
  OUT_OF_SCOPE        not part of the programme → do not register
  ↓
UPDATE REGISTRY (YAML source, never the generated report)
  ↓
IMPLEMENT / RESEARCH / DOCUMENT the delta only
  ↓
COLLECT EVIDENCE (files, tests, benchmarks, runtime proof)
  ↓
UPDATE STATUS (evidence-backed; code exists ≠ complete)
  ↓
RECALCULATE (rollups derive from children; parents never hand-set)
  ↓
REGENERATE REPORT + run gates
```

## Commands

```powershell
# validate structure + paths + real-registry audit (runs in CI gates)
npm run capability:validate
# regenerate all reports after source edits (PowerShell):
$env:REGENERATE_CAPABILITY_REPORT="1"; npm run capability:validate
```

## Rules that have already bitten once

- Owner names the accountable PROJECT, not the repo. Implementation paths
  resolve in the owner repo first, then Aetherius-OS. A path is broken only
  when every available root lacks it.
- An ARCHITECTED requirement declares no implementation_refs and no test_refs.
  The auditor caught this overstatement twice; it will catch it again.
- Requirement state is live: REQ nodes take status from requirements.json at
  load. Never copy a status into YAML by hand for a mirrored entry.
- Generated sections (report .md files, generated YAML entries) are rewritten
  by tooling. Hand edits below the marker are discarded by design.
- Research inputs (videos, chats, handoffs, prior-art surveys) enter as
  RESEARCH nodes with provenance, or as aliases/evidence on existing nodes.
  Unresolvable sources are quarantined, never ingested.
- Percentages are derived. A parent is never 100% while a required child is
  incomplete. PARTIAL leaves without measurement read 50 and say so.
