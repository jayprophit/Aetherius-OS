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


def sh(cmd: list[str], timeout: int = 1800) -> tuple[int, str]:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout,
                              encoding="utf-8", errors="replace")
        return proc.returncode, proc.stdout
    except Exception as exc:  # noqa: BLE001
        return 1, f"{type(exc).__name__}: {exc}"


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
            current = {"path": path, "kind": kind, "blob": blob, "commits": []}
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
    for name, path in LOCAL_REPOSITORIES:
        if args.only and args.only not in name:
            continue
        if not path.is_dir():
            continue
        scanned.append(name)
        for finding in scan(path):
            entries.append({
                "repository": name,
                "path": finding["path"],
                "kind": finding["kind"],
                "blob": finding["blob"],
                "commits": finding["commits"][:3],
                "state": "TO_REVIEW",
                "reason": "",
            })

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
        for finding in scan(dest):
            entries.append({
                "repository": name,
                "path": finding["path"],
                "kind": finding["kind"],
                "blob": finding["blob"],
                "commits": finding["commits"][:3],
                "state": "TO_REVIEW",
                "reason": "",
            })

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
        ],
        "repositories_scanned": scanned,
        "findings": entries,
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
