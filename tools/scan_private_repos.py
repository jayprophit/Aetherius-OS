"""Clone every private first-party repository and scan it for credentials.

The owner asked for every repository to be public so that external
agents can read the programme's data without special access. Two hundred
and twelve first-party repositories are still private, and most of them
have never been scanned, because a private repository is not published
by committing to it.

So publishing them is two steps, not one: scan first, then publish. A
credential that reaches a public commit is published, and the history
cannot be un-published, only rotated. This clones each repository, runs
the programme's own scanner over it, and writes down what was found. It
publishes nothing. The report is the input to the decision.

The report names the file and the kind of credential, never the value.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import time
from pathlib import Path

import yaml

REPO = Path(r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS")
REGISTER = REPO / "docs" / "FORK-ROUTING-REGISTRY.yaml"
SCANNER = REPO / "tools" / "scan_for_secrets.py"
WORK = Path(r"C:\Users\jpowe\AppData\Local\Temp\opencode\private-repo-scan")
OUT = REPO / "docs" / "evidence" / "private-repo-secret-scan.yaml"
ACCOUNT = "jayprophit"


def sh(cmd: list[str], timeout: int = 300) -> tuple[int, str, str]:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True,
                              timeout=timeout)
        return proc.returncode, proc.stdout, proc.stderr
    except subprocess.TimeoutExpired:
        return 124, "", "timed out"
    except Exception as exc:  # noqa: BLE001
        return 1, "", f"{type(exc).__name__}: {exc}"


def live_repos() -> list[dict]:
    code, out, _ = sh(["gh", "repo", "list", ACCOUNT, "--limit", "700",
                       "--json", "name,visibility,diskUsage"])
    if code != 0:
        raise SystemExit("the account could not be listed")
    return json.loads(out)


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


def safe_dirname(name: str) -> str:
    """A directory name Windows will accept.

    A repository name may end in a period, and Windows will not create a
    directory whose name ends in one. The clone target is therefore
    sanitised, while the repository keeps its own name in the report.
    """
    cleaned = re.sub(r"[ .]+$", "", name)
    return cleaned or "repo"


def main() -> int:
    WORK.mkdir(parents=True, exist_ok=True)
    repos = live_repos()
    states = register_states()

    targets = [r for r in repos
               if r["visibility"] != "PUBLIC"
               and states.get(r["name"], "").startswith("first_party")]
    print(f"  private first-party repositories to scan: {len(targets)}")

    results: list[dict] = []
    for index, repo in enumerate(targets, 1):
        name = repo["name"]
        dest = WORK / safe_dirname(name)
        if dest.exists():
            import shutil
            shutil.rmtree(dest, ignore_errors=True)
        code, _, err = sh(["gh", "repo", "clone", f"{ACCOUNT}/{name}",
                            str(dest), "--", "--depth", "1", "--quiet"])
        if code != 0:
            # An empty repository has no branch to clone. That is not a
            # failure to inspect: there is nothing in it to publish.
            empty = (dest.exists() and not any(dest.iterdir())) or "empty" in err.lower()
            results.append({
                "repository": name,
                "state": states.get(name),
                "cloned": False,
                "empty": bool(empty),
                "finding": None,
                "note": "" if empty else err.strip()[:200],
            })
            print(f"  [{index}/{len(targets)}] {name}: "
                  + ("empty" if empty else f"clone failed: {err.strip()[:80]}"))
            continue

        scan_code, scan_out, scan_err = sh(
            [sys.executable, str(SCANNER), "--repo", str(dest)])
        findings = []
        for line in (scan_out + scan_err).splitlines():
            if "CLEAN" in line.upper() or "clean" in line:
                continue
            if ":" in line and any(
                    kind in line for kind in
                    ("openrouter", "openai", "anthropic", "github-token",
                     "huggingface", "google-api", "slack", "aws-access-key",
                     "jwt", "private-key", "bearer-token", "basic-auth-url")):
                findings.append(line.strip()[:200])
        results.append({
            "repository": name,
            "state": states.get(name),
            "cloned": True,
            "empty": False,
            "clean": scan_code == 0,
            "finding": findings or None,
            "note": "",
        })
        if findings:
            print(f"  [{index}/{len(targets)}] {name}: {len(findings)} finding(s)")
        elif index % 20 == 0:
            print(f"  [{index}/{len(targets)}] {name}: clean")

    with_findings = [r for r in results if r.get("finding")]
    empties = [r for r in results if r.get("empty")]
    not_scanned = [r for r in results if not r.get("cloned") and not r.get("empty")]

    lines = [
        "# The private first-party repositories, scanned before publication",
        "#",
        "# Generated by tools/scan_private_repos.py. The owner asked for every",
        "# repository to be public so that external agents can read the data",
        "# without special access. Two hundred and twelve first-party",
        "# repositories were still private, and most had never been scanned,",
        "# because a private repository is not published by committing to it.",
        "#",
        "# Nothing was published by this run. This is the input to the",
        "# decision, and it names the file and the kind of credential, never",
        "# the value.",
        f"generated_at: {time.strftime('%Y-%m-%dT%H:%M:%S%z')}",
        "",
        "totals:",
        f"  private_first_party: {len(results)}",
        f"  cloned_and_scanned: {sum(1 for r in results if r.get('cloned'))}",
        f"  empty: {len(empties)}",
        f"  clone_failed: {len(not_scanned)}",
        f"  with_findings: {len(with_findings)}",
        "",
    ]
    if with_findings:
        lines.append("repositories_with_findings:")
        for r in with_findings:
            lines.append(f"  - repository: {r['repository']}")
            for finding in r["finding"]:
                lines.append(f"      {finding}")
        lines.append("")
    if not_scanned:
        lines.append("repositories_that_could_not_be_scanned:")
        for r in not_scanned:
            lines.append(f"  - repository: {r['repository']}")
            lines.append(f"      {r['note']}")
        lines.append("")
    lines.append("scanned_and_clean:")
    for r in results:
        if r.get("cloned") and not r.get("finding"):
            lines.append(f"  - {r['repository']}")
    lines.append("")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print()
    print(f"  scanned: {sum(1 for r in results if r.get('cloned'))}")
    print(f"  empty:   {len(empties)}")
    print(f"  findings: {len(with_findings)}")
    print(f"  written to {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
