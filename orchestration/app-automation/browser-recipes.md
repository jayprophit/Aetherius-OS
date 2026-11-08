# Browser recipes (REA)

All web automation runs through the installed REA 6.8.0 tool with a visible
browser session. Never script a GUI directly from a shell command. Every run
writes canonical Evidence JSON that the hive and vault can cite.

Core verbs (run in `C:\Users\jpowe\Desktop\Projects\Aetherius-OS`):

```powershell
rea doctor
rea capabilities
rea capture-web-screenshot <url> --evidence_output rea-output/screenshot.json
rea capture-browser-scenario <scenario.json> --evidence_output rea-output/evidence.json
```

## 1. Open a page and capture Evidence

```powershell
node orchestration\app-automation\automate.mjs browser --url https://example.com
node orchestration\app-automation\automate.mjs browser --url https://example.com --yes
```

`--yes` runs `rea capture-web-screenshot`. Without `--yes` only the exact
command is printed.

## 2. Paginated list: click next until done

Write `scenario.json` in the repository. The scenario is declarative JSON
that REA executes stepwise. The pattern is always: extract rows, click next,
wait for the row signature to change, stop when the next control is disabled
or the page count cap is reached.

```json
{
  "origin": "https://example.com",
  "steps": [
    { "action": "goto", "url": "https://example.com/items" },
    { "action": "extract", "selector": "table.results tbody tr", "as": "page1" },
    { "action": "click", "selector": ".pagination-next" },
    { "action": "waitFor", "selector": "table.results tbody tr", "timeout": 10000 },
    { "action": "extract", "selector": "table.results tbody tr", "as": "page2" }
  ]
}
```

Run it:

```powershell
node orchestration\app-automation\automate.mjs browser --url https://example.com --scenario scenario.json --yes
```

Pagination rules:

- Cap pages (for example 25) and activities. Never loop forever.
- Stop when the next button is disabled, missing, or the extracted row
  signature stops changing.
- Deduplicate rows by a stable key column before writing the final JSON.
- Record `pages visited`, `rows extracted`, and `stop reason` in the
  evidence metadata so the hive work log can cite the result.

## 3. Extract a table to JSON

Add an `extract` step with a CSS selector for rows and cells. Write the
joined output to `rea-output/table.json`. If the page uses a framework,
extract from the rendered DOM after `waitFor`, not from the HTML source.

## 4. Screenshot for review

```powershell
rea capture-web-screenshot https://example.com --evidence_output rea-output/screenshot.json
```

Screenshots are digested PNGs with a self-verifying artifact. Keep them in
`rea-output/` (not committed) and cite the evidence path in the hive task.

## 5. Login pages and authenticated sessions

- Authenticated sessions are created once by the owner in the visible
  browser profile. Agents must never create, export or store cookies,
  passwords, tokens or session files in this repository.
- If a scenario reaches a login wall, stop and hand the task to the owner.
  Record `work_log` status `blocked` with the exact URL and what was needed.

## 6. Full file and app access

- File access stays inside `C:\Users\jpowe\Desktop\Projects\Aetherius-OS`.
  Detection and launch never read or write outside it.
- App automation is launch-gated: `automate.mjs open --app <id> --yes` is the
  only launch path, and it requires an entry in
  `orchestration/app-automation/registry.json`.
- Launching an app is not verification. Verify by the app's own output,
  a CLI probe, or REA evidence of the built artifact.
