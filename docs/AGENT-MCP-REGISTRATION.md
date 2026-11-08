# Agent MCP registration

**Date:** 2026-11-08
**Server:** `node orchestration/hive/mcp-server.mjs` — 29 tools
(`hive_*`, `knowledge_*`, `graphify_*`, `rea_*`, `supervisor_*`).

Every agent uses the same server, so Hermes, Kilo, Cline, Vibe, OpenClaw and
OpenCode share one task board, one work ledger, one Obsidian vault, one
Graphify graph and one REA toolchain.

## Registered (verified in this session)

| Agent | Status | Verified |
| --- | --- | --- |
| Hermes | `hermes mcp list` → `aetherius … enabled` | Connected; found 29 tools; saved to `~/AppData/Local/hermes/config.yaml` |
| OpenCode (this session) | `aetherius` MCP tools live | `hive_status`, `hive_work_summary`, `graphify_status`, `rea_capabilities` called |
| Cline | `cline mcp install` → `{"status":"installed"}` | Installed via `cline mcp install aetherius --transport stdio --yes --json` |
| OpenClaw | `~/.openclaw/openclaw.json` `mcp.servers.aetherius` written | Config written directly; `openclaw mcp list` timed out before connect check |

## Partial / blocked

| Agent | Reason |
| --- | --- |
| Mistral Vibe | `vibe mcp add` timed out (`initialize timed out`); config not saved. Retry with longer startup timeout: `vibe mcp add aetherius --transport stdio --startup-timeout-sec 120`. |
| Kilo | `kilo mcp` timed out before listing. Install path is `kilo mcp add aetherius` with the same node command; verify with `kilo mcp list`. |
| Freebuff | No MCP config surface found in the npm package. Use the repository fallback instead (below). |

## Repository fallback (all agents, including Freebuff and Vibe)

These files make the same capabilities available without CLI registration:

- `mcp.json` — standard `mcpServers` entry for the `aetherius` server.
- `.agents/aetherius.md` — brief: claim tasks, log work, free models only.

Freebuff reads `.agents` files when `--trust-agents` is given in CI. Vibe
reads the repository `mcp.json` shape via `vibe mcp add` from file.

## Commands used

```powershell
hermes mcp add aetherius --connect-timeout 60 --env HIVE_URL=http://127.0.0.1:7317 --command "C:\Program Files\nodejs\node.exe" --args "C:\Users\jpowe\Desktop\Projects\Aetherius-OS\orchestration\hive\mcp-server.mjs"
cline mcp install aetherius --transport stdio --yes --json -- "C:\Program Files\nodejs\node.exe" "C:\Users\jpowe\Desktop\Projects\Aetherius-OS\orchestration\hive\mcp-server.mjs"
opencode mcp add aetherius --global --env HIVE_URL=http://127.0.0.1:7317 -- "C:\Program Files\nodejs\node.exe" "C:\Users\jpowe\Desktop\Projects\Aetherius-OS\orchestration\hive\mcp-server.mjs"
```

## Per-agent Graphify skill

The project install already exists at `.opencode/skills/graphify/` with a
plugin and an `AGENTS.md` section. Hermes, Kilo, OpenClaw, Codex and
Gemini/Cursor need equivalent project directories (`.hermes/skills/graphify/`,
`.kilo/skills/graphify/`, etc.) — this was not completed in this session
because the first lane failed on the free-usage limit. The capability is
still reachable today through the `graphify_*` MCP tools and the `graphify`
CLI; the per-agent skill directories remain **UNVERIFIED**.
