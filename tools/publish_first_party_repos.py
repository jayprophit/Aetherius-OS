"""Publish the first-party repositories that the scan found clean.

The owner asked for every repository to be public so that external agents
can read the programme's data without special access, and for the
ownership rule to hold: all data apart from publicly known brands and
forks is the owner's. The scan decides which ones are safe to publish;
this carries that decision out.

Two rules keep this honest:

  - Only a repository the scan found clean is published. A repository
    with a finding is left private and reported, because a credential
    that reaches a public commit cannot be un-published, only rotated.
  - A repository that is already public, or that is a third-party fork,
    is never touched. The third-party forks are already public, and the
    rule that keeps them out of the owner's data is the rule that says
    they are not his to change.

Usage:
    python tools/publish_first_party_repos.py --dry-run
    python tools/publish_first_party_repos.py
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import yaml

REPO = Path(r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS")
REGISTER = REPO / "docs" / "FORK-ROUTING-REGISTRY.yaml"
SCAN_REPORT = REPO / "docs" / "evidence" / "private-repo-secret-scan.yaml"
ACCOUNT = "jayprophit"


def sh(cmd: list[str], timeout: int = 180) -> tuple[int, str, str]:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True,
                              timeout=timeout)
        return proc.returncode, proc.stdout, proc.stderr
    except Exception as exc:  # noqa: BLE001
        return 1, "", f"{type(exc).__name__}: {exc}"


def parse_scan_report() -> tuple[set[str], set[str]]:
    """The clean repositories and the ones with findings."""
    if not SCAN_REPORT.exists():
        raise SystemExit(
            f"there is no scan report at {SCAN_REPORT}. The scan runs first, "
            "because publishing is not something to do before looking."
        )
    clean: set[str] = set()
    findings: set[str] = set()
    section = None
    for line in SCAN_REPORT.read_text(encoding="utf-8").splitlines():
        if line.startswith("repositories_with_findings:"):
            section = "findings"
            continue
        if line.startswith("scanned_and_clean:"):
            section = "clean"
            continue
        if line and not line.startswith(" ") and line.endswith(":"):
            section = None
            continue
        if section == "findings" and line.strip().startswith("- repository:"):
            findings.add(line.split(":", 1)[1].strip())
        elif section == "clean" and line.strip().startswith("- "):
            clean.add(line.strip()[2:].strip())
    return clean, findings


def register_states() -> dict[str, str]:
    doc = yaml.safe_load(REGISTER.read_text(encoding="utf-8"))
    states: dict[str, str] = {}
    for entry in list(doc.get("routed") or []) + list(
            doc.get("not_covered_by_the_catalogue") or []):
        repo = str(entry.get("repository", ""))
        name = repo.split("/")[-1] if "/" in repo else repo
        if name:
            states[name] = entry.get("state") or (
                "third_party_fork" if entry.get("fork") else "unclassified")
    return states


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true",
                    help="report what would be published and change nothing")
    args = ap.parse_args()

    clean, findings = parse_scan_report()
    states = register_states()

    code, out, err = sh(["gh", "repo", "list", ACCOUNT, "--limit", "700",
                         "--json", "name,visibility"])
    if code != 0:
        raise SystemExit(f"the account could not be listed: {err.strip()}")
    live = {r["name"]: r["visibility"] for r in json.loads(out)}

    publish: list[str] = []
    skipped: list[tuple[str, str]] = []
    for name, visibility in sorted(live.items()):
        if visibility == "PUBLIC":
            continue
        state = states.get(name, "unclassified")
        if not state.startswith("first_party"):
            skipped.append((name, f"{state} is not the owner's data"))
            continue
        if name in findings:
            skipped.append((name, "the scan found a credential"))
            continue
        if name not in clean:
            skipped.append((name, "the scan did not cover it"))
            continue
        publish.append(name)

    print(f"  the scan found {len(clean)} clean and {len(findings)} with findings")
    print(f"  {len(publish)} first-party repositories are to be published")
    if skipped:
        print("  held back:")
        for name, why in skipped:
            print(f"    {name}: {why}")
    if args.dry_run:
        print("  this was a dry run, so nothing was changed")
        return 0

    published = 0
    failed: list[tuple[str, str]] = []
    for name in publish:
        # The flag is not optional. GitHub requires a caller to say
        # explicitly that making a repository public is intended, which
        # is the same discipline the scan and the register already impose:
        # look before you publish.
        code, _, err = sh(["gh", "repo", "edit", f"{ACCOUNT}/{name}",
                           "--visibility", "public",
                           "--accept-visibility-change-consequences"])
        if code == 0:
            published += 1
        else:
            failed.append((name, err.strip()[:160]))

    print()
    print(f"  published: {published}")
    if failed:
        print("  could not be published:")
        for name, why in failed:
            print(f"    {name}: {why}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
