# Skill Discovery (REQ-p19-skill-discovery, P19)

Semantic discovery over the skill registry with moderation-aware ranking.
Registry mechanics stay first-party: discovery reads `SkillRegistry` only.
Reference: ClawHub v0.23.3 (MIT, STUDY_ONLY) — capability scope only.

## What is implemented

`src/workflows/discovery.ts` (`discoverSkills`): deterministic token-scored
keyword retrieval.

- Field weights: name 3, skill_id 2, capability 2, description 1 per query
  token; every hit reports `matchedOn` evidence.
- Moderation-aware ranking: VERIFIED before REGISTERED; DEPRECATED excluded
  by default (includable, ranked last, flagged); risk penalty
  low 0 / medium 1 / high 3 / critical 6, reported in `moderation` notes.
- Latest version per skill by default (`includeAllVersions` opt-in).
- Deterministic: score → status → skill_id → version tie-breaks.
- Empty queries and zero matches return `[]`, never the whole registry.

Tests: `src/workflows/discovery.test.ts` (7 tests).

## Explicitly deferred

Dense-embedding retrieval. This workstation has no local embedding runtime
(i7-870/16GB cannot host embedding models; Ollama daemon stopped; P18 live
model work is owner-gated) and no network embedding dependency will be
added. Keyword retrieval satisfies discovery now; embeddings are future work
gated on a real local model runtime, not claimed here.
