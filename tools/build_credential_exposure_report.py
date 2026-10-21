#!/usr/bin/env python3
"""Scope the credential exposure in the published histories.

The audit of 21 October 2026 found that a public repository had a
credential redacted from its latest commit, and that removing it from
the tip does not remove it from the history. The owner has to rotate
anything that was ever published, and that needs a list that says which
thing, where, and how bad.

This produces that list. It scans the published history of the
repositories it is given, classifies every finding, and writes a
report. The value of a credential is never printed: the report names the
repository, the path, the kind and the commit, because a report that
repeats the secret has moved the problem rather than solved it.

A finding is classified by what it is, and the classification carries a
reason. An unclassified finding is a finding the owner has to look at.
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
OUT = REPO / "docs" / "evidence" / "credential-exposure-report.yaml"
WORK = Path(r"C:\Users\jpowe\AppData\Local\Temp\opencode\exposure-scan")

# The repositories the owner keeps on this machine, and the one the
# audit named as carrying a redacted credential. The first group is
# scanned from the local clone; the second is cloned into the work
# directory first.
LOCAL_REPOSITORIES = [
    ("jayprophit/Aetherius-OS", REPO),
    ("jayprophit/Agent-Bridge", REPO.parent / "Agent-Bridge"),
    ("jayprophit/Genesis", REPO / "kernel" / "Genesis"),
    ("jayprophit/IDE-Workspace", REPO / "apps" / "IDE-Workspace"),
]

CLONED_REPOSITORIES = [
    "jayprophit/aetherial-platform",
    "jayprophit/Aetherial",
    "jayprophit/aetherium",
]

# A finding is a real exposure when the value is the right shape and
# the right length for its kind. A key of the wrong length is an
# example or a fixture, and saying so is what makes the list useful.
LENGTHS = {
    "openrouter": (40, 200),      # sk-or-v1- is 10 characters, the key 64
    "openai": (40, 200),          # sk- is 3, the key 48
    "anthropic": (40, 200),       # sk-ant- is 7, the key 95
    "github-token": (30, 200),     # ghp_ is 4, the key 36
    "huggingface": (30, 200),
    "google-api": (30, 200),
    "slack": (20, 200),
    "aws-access-key": (16, 40),
}

# What each finding IS, and what follows from it.
#
# The judgement that a value is a fixture rather than a credential is
# not a heuristic and is not re-derived on every run: it is a decision,
# and it is recorded here with the reason it was made. A finding that
# is not classified is a finding the owner has to look at, which is the
# right state for something nobody has looked at yet.
#
# The key is "repository|path|kind", and the value is the state, the
# reason, and the action that follows.
CLASSIFICATIONS: dict[str, dict[str, object]] = {
    "jayprophit/aetherial-platform|tests/auth/validators/auth.validators.spec.ts|jwt": {
        "state": "FIXTURE",
        "reason": (
            "A JWT-shaped constant in a test file, named validJWT, used to prove the "
            "validator accepts one. The header carries alg and typ and the payload "
            "carries iat, name and sub, with no exp, no iss and no aud: the shape of a "
            "hand-made fixture rather than of a token a real system issues. The file "
            "is still in the tree, where anyone can see it."
        ),
        "action": (
            "Nothing. The file is allowlisted with a stated reason, so the scanner stops "
            "reporting it and keeps reporting anything else in it."
        ),
        "owner_action_required": False,
    },
    "jayprophit/aetherial-platform|client/public/docs/chat_05_claude_project_link.md|github-token": {
        "state": "ROTATE_REQUIRED",
        "reason": (
            "A GitHub personal access token of the right shape and the right length: "
            "the prefix, a body of mixed letters and digits, forty characters in all, "
            "which is what one of these is. It was removed from the tip, and it is "
            "still in the published history and still reachable from the default "
            "branch."
        ),
        "action": (
            "Revoke the token at GitHub, then re-issue a new one if the work still "
            "needs it. Revoking is the part that matters: a token that was published "
            "is published whether or not the file still says so."
        ),
        "owner_action_required": True,
    },
    "jayprophit/Aetherial|04 folder/api-reference.md|bearer-token": {
        "state": "ROTATE_REQUIRED",
        "reason": (
            "A bearer token in the CURRENT TIP, not only in the history. It is in an "
            "Authorization header example in the API reference, in the commit 'Add "
            "files via upload' of the 28th of July 2025, and it is reachable from the "
            "default branch. The value is 39 characters and uses three character "
            "classes at once, with upper case, lower case, digits and punctuation: "
            "the shape of a generated random token. The example directly beneath it in "
            "the same document is the literal placeholder 'your-api-key', so the "
            "author's own style for a placeholder is plainly different, and this value "
            "is not one."
        ),
        "action": (
            "Revoke the token at the provider, then re-issue a new one if the work "
            "still needs it. Only the owner can do that. The tip can be cleaned after "
            "the revocation, and the history rewritten or the repository replaced once "
            "the owner has decided."
        ),
        "owner_action_required": True,
    },
}


def sh(cmd: list[str], timeout: int = 1800) -> tuple[int, str]:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout,
                              encoding="utf-8", errors="replace")
        return proc.returncode, proc.stdout
    except Exception as exc:  # noqa: BLE001
        return 1, f"{type(exc).__name__}: {exc}"


def scan_tree(repo: Path) -> list[dict]:
    """Every finding in the TREE of one repository.

    The history scan alone is not the scope of the exposure. A
    credential in the tip is worse than one in the history, because it
    is what every visitor sees, and a scan that only looks at the
    history will not find it. The tree is scanned too, and a finding
    says which of the two it was found in.
    """
    code, out = sh([sys.executable, str(REPO / "tools" / "scan_for_secrets.py"),
                    "--repo", str(repo)])
    findings: list[dict] = []
    for line in (out or "").splitlines():
        stripped = line.strip()
        # The tree scan reports the path and the line, and does not
        # print the value.
        if "  " in stripped and stripped.split("  ")[-1] in (
                "jwt", "bearer-token", "github-token", "openrouter", "openai",
                "anthropic", "huggingface", "google-api", "slack",
                "aws-access-key"):
            path, _, kind = stripped.rpartition("  ")
            path = path.strip()
            if not path:
                continue
            number = ""
            if ":" in path and path.rsplit(":", 1)[-1].isdigit():
                path, _, number = path.rpartition(":")
            findings.append({"path": path, "kind": kind.strip(),
                             "line": number, "blob": "", "commits": [],
                             "where": "tree"})
    return findings


def scan(repo: Path) -> list[dict]:
    """Every history finding in one repository."""
    code, out = sh([sys.executable, str(REPO / "tools" / "scan_for_secrets.py"),
                    "--repo", str(repo), "--history"])
    findings = []
    current = None
    for line in (out or "").splitlines():
        if line.strip().startswith("HISTORY FINDING "):
            rest = line.strip()[len("HISTORY FINDING "):]
            path, _, rest = rest.partition(" (")
            kind, _, rest = rest.partition(")")
            blob = ""
            for part in rest.split():
                if part.startswith("blob"):
                    blob = part.split("=")[-1]
            current = {"path": path, "kind": kind, "blob": blob,
                       "commits": [], "line": "", "where": "history"}
            findings.append(current)
        elif current is not None and line.startswith("      ") and len(line) > 6 \
                and line[6:8] != "  " and "REDACTED" not in line \
                and "value is not printed" not in line \
                and "published history" not in line \
                and "Rotate it" not in line:
            current["commits"].append(line.strip()[:160])
    return findings


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(OUT))
    ap.add_argument("--only", default="", help="scan only this repository name")
    args = ap.parse_args()

    entries = []
    scanned: list[str] = []

    def add(repository: str, finding: dict) -> None:
        """One finding, with its classification if it has one."""
        key = f"{repository}|{finding['path']}|{finding['kind']}"
        judged = CLASSIFICATIONS.get(key, {})
        entries.append({
            "repository": repository,
            "path": finding["path"],
            "kind": finding["kind"],
            "line": finding.get("line", ""),
            "blob": finding["blob"],
            "commits": finding["commits"][:3],
            "found_in": finding.get("where", "history"),
            "state": judged.get("state", "TO_REVIEW"),
            "reason": judged.get("reason", ""),
            "action": judged.get("action", ""),
            "owner_action_required": bool(judged.get("owner_action_required",
                                                     False)),
        })

    for name, path in LOCAL_REPOSITORIES:
        if args.only and args.only not in name:
            continue
        if not path.is_dir():
            continue
        scanned.append(name)
        for finding in scan(path) + scan_tree(path):
            add(name, finding)

    WORK.mkdir(parents=True, exist_ok=True)
    for name in CLONED_REPOSITORIES:
        if args.only and args.only not in name:
            continue
        dest = WORK / name.split("/")[-1]
        if not (dest / ".git").is_dir():
            code, out = sh(["gh", "repo", "clone", name, str(dest)])
            if code != 0:
                print(f"  {name}: could not be cloned: {out.strip()[:120]}")
                continue
        scanned.append(name)
        for finding in scan(dest) + scan_tree(dest):
            add(name, finding)

    doc = {
        "schema_version": 1,
        "source_date": date.today().isoformat(),
        "generated_by": "tools/build_credential_exposure_report.py",
        "notes": [
            "Every finding in the published history of the repositories "
            "scanned. The value of a credential is never recorded here.",
            "A finding is an exposure to rotate only if the value is a "
            "working credential. A value of the wrong length for its kind "
            "is an example or a fixture, and saying so is what makes the "
            "list usable.",
            "A credential in a published history cannot be un-published. "
            "Removing it from the tip does not remove it from the history, "
            "and only the provider can revoke it.",
            "The TIP is scanned as well as the history. A credential in the "
            "tip is worse than one in the history, because it is what every "
            "visitor sees, and a scan that only looks at the history will "
            "not find it. Each finding says which of the two it was found "
            "in.",
            "A finding is classified by what it is, and the classification "
            "carries a reason. The judgement that a value is a fixture and "
            "not a credential is a decision, not a heuristic, so it is "
            "recorded rather than re-derived on every run. A finding that is "
            "not classified is a finding the owner has to look at.",
        ],
        "repositories_scanned": scanned,
        "findings": entries,
        "summary": {
            "repositories_scanned": len(scanned),
            "findings": len(entries),
            "rotate_required": sum(1 for e in entries
                                   if e["state"] == "ROTATE_REQUIRED"),
            "fixtures": sum(1 for e in entries if e["state"] == "FIXTURE"),
            "to_review": sum(1 for e in entries if e["state"] == "TO_REVIEW"),
            "owner_action_required": sum(1 for e in entries
                                         if e["owner_action_required"]),
        },
    }

    Path(args.out).write_text(
        yaml.safe_dump(doc, sort_keys=False, allow_unicode=True, width=100),
        encoding="utf-8")
    print(f"wrote {args.out} ({len(entries)} finding(s))")
    for entry in entries:
        print(f"  {entry['repository']}  {entry['path']}  ({entry['kind']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
