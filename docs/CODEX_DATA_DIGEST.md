# Codex / ChatGPT Corpus — Extracted Data for Aetherius OS
**Date:** 2026-11-02 | **Source:** `research/codex-history/` (read-only extraction of `C:\Users\jpowe\.codex`)

## What the corpus contains
- **71 threads** (13 root conversations, 58 subagent threads), **2,118,800,154 tokens** recorded.
- Working directories: ChatGPT Projects, `Documents\Codex\...`, `Agent-Bridge`, `IDE-Workspace`, `Agent-Bridge-dashboard`.
- Models: `gpt-6.1-sol` (47), `gpt-5.6-sol` (12), `gpt-6-astra` (8), `codex-auto-review` (4).
- **237 distinct owner directive sentences** in `owner-directives.txt`.
- Requirement rollup: **60+ `REQ-*` identifiers**, including:
  - `REQ-ECONOMIC-AGENCY-001` — economic agency for Genesis
  - `REQ-GENESIS3-INGEST-001` — Genesis 3 ingestion
  - `REQ-DESIGN-ASSET-GOVERNANCE-001` — design asset governance
  - `REQ-COMPUTE-FABRIC-001` / `REQ-COMPUTE-PHYSIOLOGY-001` — compute fabric
  - `REQ-CREDENTIAL-RECORD-001`, `REQ-KEY-CUSTODY-001`, `REQ-CRYPTO-PROVIDER-001` — custody/credential requirements
  - `REQ-GRACEFUL-DEGRADATION-001`, `REQ-PHYSICAL-SAFETY-KERNEL-001`, `REQ-RIGHTS-SAFEGUARD-001`
  - `REQ-LIFE-RECORD-001`, `REQ-SELF-CONTINUITY-001`, `REQ-MORAL-CONSTITUTION-001`

## Directives relevant to Aetherius OS (verbatim/near-verbatim)
- "add full world class mass adopted style system architecture"
- "build the same base foundation like others … cross platform, desktop, mobile, tablet, webapp/website"
- "compare it with similar apps, dapps, software, programs, websites, modules"
- "merge, de-duplicate, remove obsolete folders and files"
- "Do not silently remove existing requirements."
- "Clearly distinguish implemented functionality from scaffolding/experimental functionality and do not claim unsupported device/DAW integrations are complete."
- "finish the build, test, run and repush the code"
- "this is a full fix and build, to world class industry standards"

## What this means for Aetherius OS
1. The corpus is primarily **Poietek / Universal Bridge / MAT / Genesis / Agent Bridge** — not a ready-made Aetherius app inventory.
2. It supplies **engineering policy** (world-class architecture, cross-platform base, honest maturity labels, no silent requirement removal, de-duplication) and **Genesis requirement IDs** that the financial/trading Genesis layers should respect.
3. It does **not** supply per-app competitor settings, UI flows or file-format fixtures; those must come from the benchmark/reverse-engineering process (see `PROFESSIONAL_5_STAR_BENCHMARK.md`).
4. The Genesis ChatGPT project intake (47 conversations, 264 pages) is referenced in the corpus digest; the full intake data lives in the Genesis project, not this repository.

## Applied actions
- Added `REQ-ECONOMIC-AGENCY-001` alignment to the Genesis financial/trading layers.
- Added `REQ-DESIGN-ASSET-GOVERNANCE-001` alignment to the shared creative engine and asset registry plans.
- Kept honest maturity labels in `build.yaml`, `README`, `EXECUTION_STATUS.md`, and `PROMPT_AUDIT.md`.
- No requirement was silently removed; existing `docs/` canonical registries remain the source of truth.

## Still open
- Full extraction of `index.jsonl` and all 71 `threads.json` message bodies into per-app requirements.
- Mapping every `REQ-*` ID to an owning Aetherius app/workspace.
- Reconciling the Genesis ChatGPT project intake with the Aetherius app catalogue.
