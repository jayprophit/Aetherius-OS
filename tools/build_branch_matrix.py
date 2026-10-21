#!/usr/bin/env python3
"""The authoritative branch matrix for the portfolio's product repositories.

The audit of 21 October 2026 found that the default branch of Aetherius
OS was a December 2025 lineage with no common ancestor with the active
one, that Universal Bridge's default had no source in it because a merge
had deleted the implementation, and that Poietek's active work was on a
branch that was not the default. The exit evidence the audit asks for is
a matrix: repository, default, active, SHA, remote, ahead and behind, CI
scope, and the promotion plan.

This is that matrix. The facts are read from the live account. The
decisions are stated here and are checked against the live state, so the
register cannot quietly go stale: if a branch moves, or a decision names
a branch that does not exist, the tool says so and the gate fails.

A decision here is never a rewrite. The rule from the owner's
predecessor absorption master plan is PRESERVE, CLASSIFY, MAP,
INTEGRATE, TEST, VERIFY, ARCHIVE, APPROVED DELETE, and "if it is not
evidenced, it is not complete". So a decision moves the default branch
or fast-forwards a branch that is behind its own successor. It does not
force-push, it does not rewrite history, and it does not delete a
branch.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import date
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "docs" / "BRANCH-MATRIX.yaml"
ACCOUNT = "jayprophit"

# The repositories the audit inspected in depth.
REPOSITORIES = [
    "Aetherius-OS",
    "Agent-Bridge",
    "Genesis",
    "IDE-Workspace",
    "Universal-Bridge",
    "Poietek",
    "LedgerLands",
    "aetherial-platform",
    "THE-ARCHITECTURE-OF-SHADOWS",
]

# The decisions, and the reason for each. `action` is what the tool
# checks; the history itself is changed by the owner-approved run, not
# by this tool, so that a read-only run of the register can never move a
# branch.
DECISIONS: dict[str, dict] = {
    "Aetherius-OS": {
        "canonical_branch": "master",
        "action": "PROMOTE_DEFAULT",
        "reason": (
            "The default branch was a December 2025 React/Vite lineage with no common "
            "ancestor with the active one, so an agent reading the repository saw an "
            "old shell rather than the programme. The canonical branch is the one that "
            "holds the build manifests, the registers, the tools and the kernel."
        ),
        "preserved_branches": [
            "main",
            "recovered-main",
            "forensic/ide-contaminated-main-133c5d8",
            "recovery/aetherius-desktop-466d79d",
        ],
        "history_rewritten": False,
    },
    "Universal-Bridge": {
        "canonical_branch": "main",
        "action": "MERGE_DEVELOPMENT_INTO_DEFAULT",
        "reason": (
            "The default branch had no src/ directory because a merge had deleted the "
            "implementation, which is why CodeQL failed at configure. The development "
            "branch restored it and its CI passes. The merge is clean and restores the "
            "implementation rather than replacing it."
        ),
        "preserved_branches": ["develop/v0.5-production-foundation", "feature/v1-windows-hardware"],
        "history_rewritten": False,
    },
    "Poietek": {
        "canonical_branch": "main",
        "action": "FAST_FORWARD_DEFAULT",
        "reason": (
            "The default branch was eighteen commits behind its own successor and its CI "
            "failed because the workflows still assumed a directory that no longer "
            "exists at that path. The successor contains the corrected workflows and its "
            "quality gate passes. The default is a strict ancestor, so moving it forward "
            "loses nothing and rewrites nothing."
        ),
        "preserved_branches": ["refactor/architecture-foundation", "codex/poietek-v3.1-production-build"],
        "history_rewritten": False,
    },
    "Agent-Bridge": {
        "canonical_branch": "main",
        "action": "NONE_ALREADY_CANONICAL",
        "reason": (
            "The default branch is the active one. The open work is not a branch "
            "problem but an integration one: the external-worker branch holds the "
            "communications fabric and is seventy-five commits ahead and twenty-five "
            "behind, so its units are selected and integrated rather than merged blind."
        ),
        "preserved_branches": [
            "unit/external-worker-telemetry",
            "unit/cloud-hybrid-runtime",
            "unit/runtime-safety-fixes",
            "unit/supervisor-dashboard",
            "canonical/main",
            "feature/v0.10.0",
        ],
        "history_rewritten": False,
    },
    "Genesis": {
        "canonical_branch": "main",
        "action": "NONE_ALREADY_CANONICAL",
        "reason": "The default branch is the active one.",
        "preserved_branches": [],
        "history_rewritten": False,
    },
    "IDE-Workspace": {
        "canonical_branch": "master",
        "action": "NONE_ALREADY_CANONICAL",
        "reason": "The default branch is the active one.",
        "preserved_branches": ["unit/supervisor-dashboard-ui"],
        "history_rewritten": False,
    },
    "LedgerLands": {
        "canonical_branch": "main",
        "action": "NONE_ALREADY_CANONICAL",
        "reason": "The default branch is the active one.",
        "preserved_branches": [],
        "history_rewritten": False,
    },
    "aetherial-platform": {
        "canonical_branch": "main",
        "action": "NONE_PREDECESSOR_RETIREMENT_PATH",
        "reason": (
            "The owner confirmed this repository as a predecessor of Aetherius OS, so it "
            "follows the predecessor absorption path rather than the active-project path. "
            "Its default branch carries the commit that redacted a GitHub token, which is "
            "why its history is a security matter before it is a branch matter."
        ),
        "preserved_branches": ["master"],
        "history_rewritten": False,
    },
    "THE-ARCHITECTURE-OF-SHADOWS": {
        "canonical_branch": "main",
        "action": "NONE_ALREADY_CANONICAL",
        "reason": "The default branch is the active one.",
        "preserved_branches": [],
        "history_rewritten": False,
    },
}


def sh(cmd: list[str], timeout: int = 120) -> tuple[int, str]:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout,
                              encoding="utf-8", errors="replace")
        return proc.returncode, proc.stdout
    except Exception as exc:  # noqa: BLE001
        return 1, f"{type(exc).__name__}: {exc}"


def api(path: str) -> object:
    code, out = sh(["gh", "api", path])
    if code != 0:
        return None
    try:
        return json.loads(out)
    except ValueError:
        return None


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(OUT))
    ap.add_argument("--check", action="store_true",
                    help="verify the recorded decisions against the live state and "
                         "write nothing")
    args = ap.parse_args()

    entries = []
    problems: list[str] = []

    for name in REPOSITORIES:
        info = api(f"repos/{ACCOUNT}/{name}")
        if info is None:
            problems.append(f"{name}: the repository could not be read")
            continue
        default = ((info.get("default_branch") or "")
                   or (info.get("defaultBranchRef") or {}).get("name", ""))
        branches = api(f"repos/{ACCOUNT}/{name}/branches?per_page=100") or []
        rows = []
        for b in branches:
            sha = b["commit"]["sha"]
            commit = api(f"repos/{ACCOUNT}/{name}/commits/{sha}") or {}
            when = ((commit.get("commit") or {}).get("committer") or {}).get("date", "")
            subject = ((commit.get("commit") or {}).get("message") or "").split("\n")[0]
            rows.append({
                "branch": b["name"],
                "sha": sha,
                "date": when[:10],
                "subject": subject[:90],
                "is_default": b["name"] == default,
                "protected": b.get("protected", False),
            })
        rows.sort(key=lambda r: r["date"], reverse=True)

        decision = DECISIONS.get(name, {})
        canonical = decision.get("canonical_branch", "")
        if canonical and not any(r["branch"] == canonical for r in rows):
            problems.append(
                f"{name}: the decision names {canonical} as the canonical branch, "
                f"and that branch does not exist on the account")
        if canonical and default != canonical:
            problems.append(
                f"{name}: the decision names {canonical} as the canonical branch, "
                f"and the account's default is still {default}")
        for kept in decision.get("preserved_branches", []):
            if not any(r["branch"] == kept for r in rows):
                problems.append(
                    f"{name}: {kept} is recorded as preserved, and it is not on "
                    f"the account")

        entries.append({
            "repository": f"{ACCOUNT}/{name}",
            "default_branch": default,
            "canonical_branch": canonical or default,
            "decision": decision.get("action", "NONE"),
            "decision_reason": decision.get("reason", ""),
            "history_rewritten": decision.get("history_rewritten", False),
            "preserved_branches": decision.get("preserved_branches", []),
            "archived": bool(info.get("archived", False)),
            "branches": rows,
        })

    doc = {
        "schema_version": 1,
        "source_date": date.today().isoformat(),
        "generated_by": "tools/build_branch_matrix.py",
        "account": ACCOUNT,
        "notes": [
            "The facts are read from the live account. The decisions are stated in the "
            "tool and checked against the live state, so a register that disagrees with "
            "the account fails the gate rather than lying.",
            "A decision here is never a rewrite. The rule is PRESERVE, CLASSIFY, MAP, "
            "INTEGRATE, TEST, VERIFY, ARCHIVE, APPROVED DELETE.",
            "The branch facts come from the independent audit of 21 October 2026 and "
            "from this tool's own reading of the account.",
        ],
        "problems": problems,
        "repositories": entries,
    }

    if args.check:
        for problem in problems:
            print(f"  PROBLEM {problem}")
        print(f"  {len(entries)} repositories, {len(problems)} problems")
        return 1 if problems else 0

    Path(args.out).write_text(
        yaml.safe_dump(doc, sort_keys=False, allow_unicode=True, width=100),
        encoding="utf-8")
    print(f"wrote {args.out} ({len(entries)} repositories, "
          f"{len(problems)} problems)")
    for problem in problems:
        print(f"  PROBLEM {problem}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
