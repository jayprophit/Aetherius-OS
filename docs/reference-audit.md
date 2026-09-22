# Reference-system capability audit (REFMAP follow-up, 2026-09-22)

Machine truth: `registry/reference-systems.json` (8 pinned systems) +
`registry/reference-capabilities.json` (31 capability records). This document
summarizes that data for humans; on any conflict the JSON wins. All eight are
MIT, audited read-only from GitHub metadata, trees, READMEs and SECURITY.md —
nothing cloned, installed or executed.

## Per-system synthesis

- **OpenClaw** (gateway, STUDY_ONLY): personal/team gateway, 20+ channels,
  swappable model plugins, device nodes, automation/VPS, documented
  auth-credential semantics. Breadth informs P21/P27; nothing adopted.
- **Lobster** (workflow shell, STUDY_ONLY): typed JSON pipelines, approval
  gates with resume, no-new-auth rule, token-saving macros. P19 already
  covers the mechanics; the no-new-auth stance independently confirms our
  skills-never-authorize rule.
- **ClawHub** (skill registry, STUDY_ONLY): publishing/versioning/merge,
  vector search, moderation, package catalog with trust metadata, pinned
  installs. Gaps taken: semantic discovery, package format (P19).
- **ClickClack** (team chat, STUDY_ONLY): Go+SQLite/Postgres service,
  WebSocket live updates over a durable log, bots/CLI/SDK, self-hostable.
  Gaps taken: realtime transport (P27).
- **ClawSweeper** (maintenance bot, STUDY_ONLY): scheduled/event review,
  durable reports, marker comments, guarded repair, readiness≠authority,
  maintainer commands. Gaps taken: steward automation family (P16).
- **CrabFleet** (remote desktop, STUDY_ONLY): CORRECTION — not a fleet
  controller. VNC connectors, relay, clipboard/file transfer. Gap taken:
  governed remote-desktop adapter (P21).
- **CrabBox** (remote runners, STUDY_ONLY): SSH/container targets, warm
  workspaces, diff sync, streaming. Trust model explicitly excludes
  adversarial tenants — our runners must ADD isolation. Gaps taken:
  sandbox runners + sync contract (P20).
- **OctoPool** (repo relay, STUDY_ONLY): Worker+D1 cache, pooled
  PATs/Apps, token-free-first, budget routing. Gap taken: authorized
  scoped relay-cache (P30), never a limit-evasion tool.

## Cross-system findings

- No reference justifies a duplicate scheduler, model router, skill
  registry, policy engine, identity system, worker controller or messaging
  store. All such collisions resolve to canonical owners.
- Skill trust comparison: immediate-install (naive) vs signed packages vs
  our staged/evaluated/promotion-governed pipeline — ours stays.
- Credential pattern comparison: pooled relay secrets (OctoPool),
  local-first gateway storage (OpenClaw), channel tokens (ClickClack) —
  all map to vault + scoped references, raw secrets never in model context.
- Identity comparison: none of the eight operate a persistent-organism
  model; Lobster macros, ClickClack bots and ClawHub packages map to
  skills/workflows/tools, never to Genesis personalities.

## Decisions

- System-level: all eight STUDY_ONLY. No forks, no dependencies, no REJECTs
  (nothing evaluated was hostile, merely out of scope or weaker).
- New programme requirements (all RESEARCH, priority 2): skill discovery,
  skill packages (P19); sandbox runners (P20); remote desktop, webhook
  ingestion link (P21); realtime transport (P27); repo relay (P30); steward
  automation (P16).
- Conflicts recorded: none requiring owner arbitration; owner decisions
  (one Genesis, default-deny, closed V1 vocabulary) override any weaker
  external trust semantics by standing rule.
