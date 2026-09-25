# Human Release Validation Pack (HUMAN_REQUIRED — not self-passed)

All items below remain HUMAN_REQUIRED until real human evidence is
recorded against them. Automated tests, screenshots and checklists do
not satisfy these gates. Tester fills version/build/env/date/result.

## 0. Common fields (every check)

- Build under test (repo SHAs + versions), environment (OS/arch/RAM),
  tester, date, result (PASS/FAIL), evidence captured (logs, photos,
  recordings), notes.

## 1. Offline / degraded behaviour matrix

Prerequisite: release-scope build installed; network control available
(full / restricted / offline / provider-down).
Steps per cell (capability × network state: connected, restricted,
offline, backend NOT_INSTALLED):
1. Attempt the capability; record observed behaviour.
2. Compare against the capability promise (docs + honest
   NOT_INSTALLED/UNAVAILABLE states).
Expected: behaviour matches promise in every cell; no offline feature
depends on remote APIs without disclosure.
PASS: all cells match. FAIL: any mismatch, crash, or silent wrong result.

## 2. Platform support matrix (candidate platforms only)

Candidates: Windows (dev host), WSL; Linux/macOS only if release scope
adds them — unverified platforms are UNVERIFIED, never SUPPORTED.
Per platform: install result, launch, full test file for that repo,
core workflow (Bridge action → verify; IDE create/edit/save),
filesystem behaviour, permissions, networking, cleanup.
PASS: all rows green with evidence. FAIL: any row red or untested
but claimed.

## 3. IDE human UI validation

Prerequisite: built IDE shell + running Bridge.
Steps: launch; create project/file; edit; save; reopen (persistence);
Git status/diff/commit flow; build; run; trigger an error (read
message); restart mid-task (recovery); navigate all panels/tabs;
resize window; keyboard-only pass (Tab/Enter/Escape) over core flows.
Expected: every step completes with understandable feedback; errors
are readable and actionable; state survives restart where promised.
PASS/FAIL per step with evidence. Automated 48/48 + 42/42 smoke do
not satisfy this gate.

## 4. Accessibility audit

Prerequisite: same build as §3.
Steps: keyboard-only navigation incl. focus order and visible focus;
accessible names/labels on all controls (spot-check against code:
aria-labels exist on nav/sidebar/dock); error messaging readability;
200% scaling + window resize; theme/contrast basics; screen-reader
pass over shell/panels/dialogs where a reader is available.
PASS: no blocking barriers found, issues logged with severity.
FAIL: blocking barrier or missing names on core controls. No
compliance claim without evidence.

## 5. Privacy / telemetry sign-off

Prerequisite: list of all data flows from code (telemetry, logs,
remote model calls, cloud services, speech/audio, stored context,
user files, secrets, retention, deletion, exports, crash data).
Steps: for each flow mark local-only / optional-remote /
mandatory-remote / unknown; verify against user-facing disclosure
doc; confirm no silent telemetry or remote processing; confirm
secret handling (references only) and deletion/export paths.
PASS: every flow classified + disclosed + owner-signed. FAIL: any
unknown flow or undisclosed remote processing. Owner sign-off
required where product wording is concerned.

## Status ledger

| Gate | State |
|---|---|
| offline/degraded matrix | HUMAN_REQUIRED |
| platform matrix | HUMAN_REQUIRED |
| IDE UI | HUMAN_REQUIRED |
| accessibility | HUMAN_REQUIRED |
| privacy/telemetry | HUMAN_REQUIRED |
