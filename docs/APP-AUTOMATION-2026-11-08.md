# App automation — 2026-11-08

**Status:** DETECTED and tested. Detection scans the real Windows Start Menu;
launching is owner-gated and was not exercised in this session.

## What was detected

- **284** Start-Menu shortcuts found across per-user and all-users Program
  folders; **275** resolved to an installed target.
- By category: utility 172, dev 46, audio 31, creative 11, browser 7, cad 3,
  agent 14.
- Browsers detected: Brave, Firefox Developer Edition (plus private-browsing
  shortcut), Google Chrome, Microsoft Edge, Opera GX.
- Agent apps detected: ChatGPT, Claude, Copilot, DeepSeek, Freebuff, Hermes,
  Kimi, OpenClaw variants, Qwen.

Full machine-readable catalog: `orchestration/app-automation/registry.json`.

## What is automated now

| Capability | Command |
| --- | --- |
| Detect and rebuild the catalog | `node orchestration\app-automation\detect.mjs` |
| List apps by category | `node orchestration\app-automation\automate.mjs list --category browser` |
| Inspect one app | `node orchestration\app-automation\automate.mjs show --app firefox-developer-edition` |
| Launch an app (owner-gated) | `node orchestration\app-automation\automate.mjs open --app ollama --yes` |
| Browser screenshot / scenario | `node orchestration\app-automation\automate.mjs browser --url https://example.com --yes` |

Browser automation and pagination use REA (`rea capture-browser-scenario`,
`rea capture-web-screenshot`). Recipes are in
`orchestration/app-automation/browser-recipes.md`. Authenticated sessions
must be created by the owner in the visible browser profile; no cookies,
passwords or tokens are stored in this repository.

## What is UNVERIFIED or launch-only

- **UNVERIFIED:** No GUI app was launched in this session. `open --yes` is
  implemented with `spawn` (no shell) and validated by tests, but a live
  launch was not observed.
- **Launch-only:** Most creative, CAD and audio apps are `launch-only` —
  they open so the owner can work, but the OS does not drive their GUIs.
- Browser `browser --yes` requires the `rea` CLI (6.8.0 installed) and was
  not run in this session.

## Security

- No secrets in the registry. Detection holds no tokens, cookies or keys.
- `validateUrl` allows only `http`/`https`. `open` refuses unknown app ids
  and requires `--yes` plus an existing target binary.
- File access stays inside this repository. Evidence writes to `rea-output/`.
