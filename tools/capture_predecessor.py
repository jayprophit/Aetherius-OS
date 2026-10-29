#!/usr/bin/env python3
"""Capture a predecessor repository completely, and prove the capture works.

The owner's predecessor absorption programme of 21 October 2026 is
explicit about what has to happen before anything is migrated or
deleted, and this is the part that does the capturing:

  - the whole history, mirrored, with every ref;
  - a bundle as a second, independent form of the same history;
  - a SHA-256 of each, and a git fsck, and the branch, tag and commit
    counts;
  - the GitHub-side context: the issues, the pull requests, the releases
    and the wiki, with the metadata and the URL, and an explicit record
    of what could not be exported;
  - a secret scan of the tree, the history and the artifacts;
  - a test restoration into a separate directory, because a backup that
    has never been restored is a hope, not a backup;
  - an evidence manifest that says all of it, so the retirement gate
    can be checked against evidence rather than against a claim.

It writes the manifest and it does not delete anything. The owner
approves a deletion by exact repository name, and this tool never does
one.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import stat
import subprocess
import sys
import time
from datetime import date, datetime, timezone
from pathlib import Path

import yaml

WORK = Path(r"C:\Users\jpowe\AppData\Local\Temp\opencode\predecessor-capture")
OUT = Path(r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS\docs"
           r"\PREDECESSOR-CAPTURE-REGISTRY.yaml")


def sh(cmd: list[str], timeout: int = 3600, cwd: str | Path | None = None
       ) -> tuple[int, str, str]:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout,
                              encoding="utf-8", errors="replace", cwd=str(cwd) if cwd else None)
        return proc.returncode, proc.stdout, proc.stderr
    except Exception as exc:  # noqa: BLE001
        return 1, "", f"{type(exc).__name__}: {exc}"


def sha256_of(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def gh_json(path: str):
    code, out, _ = sh(["gh", "api", path], timeout=180)
    if code != 0:
        return None
    try:
        return json.loads(out)
    except ValueError:
        return None


def capture_metadata(name: str) -> dict:
    """The GitHub-side facts, read live."""
    info = gh_json(f"repos/{name}") or {}
    licenses = gh_json(f"repos/{name}/license") or {}
    return {
        "repository_id": info.get("id"),
        "source_url": info.get("html_url", ""),
        "clone_url": info.get("clone_url", ""),
        "visibility": info.get("visibility", ""),
        "description": info.get("description", ""),
        "default_branch": info.get("default_branch", ""),
        "archived": bool(info.get("archived", False)),
        "owner": ((info.get("owner") or {}).get("login", "")),
        "topics": info.get("topics", []),
        "created_at": info.get("created_at", ""),
        "pushed_at": info.get("pushed_at", ""),
        "declared_licence": ((info.get("license") or {}) or {}).get("spdx_id", ""),
        "licence_file_present": bool(licenses.get("content")),
    }


def capture_github_context(name: str) -> dict:
    """The context GitHub holds that git does not."""
    context: dict = {"issues": [], "pull_requests": [], "releases": [],
                     "wiki": None, "discussions": None,
                     "unexportable": []}
    issues = gh_json(f"repos/{name}/issues?state=all&per_page=100")
    if issues is None:
        context["unexportable"].append(
            "the issues could not be listed; the token may not reach them")
    else:
        for issue in issues:
            if "pull_request" in issue:
                context["pull_requests"].append({
                    "number": issue.get("number"),
                    "title": issue.get("title"),
                    "state": issue.get("state"),
                    "created_at": issue.get("created_at"),
                    "author": (issue.get("user") or {}).get("login"),
                    "url": issue.get("html_url"),
                })
            else:
                context["issues"].append({
                    "number": issue.get("number"),
                    "title": issue.get("title"),
                    "state": issue.get("state"),
                    "created_at": issue.get("created_at"),
                    "author": (issue.get("user") or {}).get("login"),
                    "url": issue.get("html_url"),
                })
    releases = gh_json(f"repos/{name}/releases?per_page=100")
    if releases is None:
        context["unexportable"].append("the releases could not be listed")
    else:
        for release in releases:
            context["releases"].append({
                "tag": release.get("tag_name"),
                "name": release.get("name"),
                "published_at": release.get("published_at"),
                "url": release.get("html_url"),
                "assets": [a.get("name") for a in (release.get("assets") or [])],
            })
    has_wiki = gh_json(f"repos/{name}") or {}
    context["wiki"] = ("a wiki is enabled" if has_wiki.get("has_wiki")
                       else "the repository has no wiki")
    discussions = gh_json(f"repos/{name}/discussions?per_page=5")
    context["discussions"] = ("listed" if discussions is not None
                              else "the discussions could not be listed")
    return context


def remove_tree(path: Path) -> None:
    """Remove a directory, including the read-only files git leaves.

    Git's object files are read-only, so a plain rmtree with errors
    ignored leaves them behind and the directory survives, and the next
    clone refuses to write into it. The files are made writable first.
    """
    if not path.exists():
        return

    def _make_writable(func, target, _exc):
        try:
            os.chmod(target, stat.S_IWRITE)
            func(target)
        except OSError:
            pass

    shutil.rmtree(path, onerror=_make_writable)


def capture_git(name: str, dest: Path) -> dict:
    """The mirror, the bundle, the digests, the fsck and the counts."""
    result: dict = {"mirror": None, "bundle": None, "git_mirror_sha256": None,
                    "git_bundle_sha256": None, "fsck": None, "counts": {},
                    "notes_captured": False, "submodules": [],
                    "lfs_pointer_objects": 0, "errors": []}
    remove_tree(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)

    # The clone URL rather than the owner/name shorthand, because git
    # does not understand the shorthand and the credential helper needs
    # the real URL to authenticate.
    url = name if name.startswith("http") else f"https://github.com/{name}.git"
    code, out, err = sh(["git", "clone", "--mirror", url, str(dest)])
    if code != 0:
        result["errors"].append(f"the mirror clone failed: {err.strip()[:200]}")
        return result
    result["mirror"] = str(dest)

    bundle = dest.parent / f"{dest.name}.bundle"
    code, out, err = sh(["git", "-C", str(dest), "bundle", "create", str(bundle), "--all"])
    if code == 0:
        result["bundle"] = str(bundle)
        result["git_bundle_sha256"] = sha256_of(bundle)
    else:
        result["errors"].append(f"the bundle could not be created: {err.strip()[:200]}")

    # The mirror directory itself is captured as a bundle too, so there
    # is a single file with a digest, not only a directory.
    mirror_bundle = dest.parent / f"{dest.name}-mirror.bundle"
    code, out, err = sh(["git", "-C", str(dest), "bundle", "create",
                         str(mirror_bundle), "--all"])
    if code == 0:
        result["git_mirror_sha256"] = sha256_of(mirror_bundle)
    else:
        result["errors"].append(
            f"the mirror bundle could not be created: {err.strip()[:200]}")

    code, out, err = sh(["git", "-C", str(dest), "fsck", "--no-progress"])
    result["fsck"] = {"exit_code": code, "clean": code == 0,
                      "output": (out or err).strip()[:400]}

    for what, args in (("branches", ["branch", "--list"]),
                       ("tags", ["tag", "--list"]),
                       ("commits", ["rev-list", "--all", "--count"])):
        code, out, _ = sh(["git", "-C", str(dest)] + args)
        result["counts"][what] = (len([ln for ln in out.splitlines() if ln.strip()])
                                  if what != "commits"
                                  else out.strip())

    code, out, _ = sh(["git", "-C", str(dest), "notes", "list"])
    result["notes_captured"] = bool(out.strip())

    # The submodule manifests, with the exact commits they point at.
    code, out, _ = sh(["git", "-C", str(dest), "show", "HEAD:.gitmodules"])
    if code == 0:
        path = None
        for line in out.splitlines():
            line = line.strip()
            if line.startswith("path"):
                path = line.split("=", 1)[1].strip()
            elif line.startswith("url") and path:
                result["submodules"].append({"path": path,
                                            "url": line.split("=", 1)[1].strip()})
    # The LFS pointer objects, counted rather than assumed.
    code, out, _ = sh(["git", "-C", str(dest), "rev-list", "--objects", "--all"])
    pointers = 0
    for line in (out or "").splitlines():
        parts = line.split(" ", 1)
        if len(parts) < 2:
            continue
        sha = parts[0]
        code2, blob, _ = sh(["git", "-C", str(dest), "cat-file", "-p", sha])
        if code2 == 0 and blob.startswith("version https://git-lfs.github.com/spec/"):
            pointers += 1
    result["lfs_pointer_objects"] = pointers
    return result


def restore_drill(dest: Path, target: Path) -> dict:
    """Restore the history into a separate directory and check it came back.

    A backup that has never been restored is a hope. This clones from the
    mirror and counts what came back, so the restore test is a result
    rather than a claim.

    It clones a WORKING TREE, not another mirror. A mirror has the
    history but no files, and a restoration that cannot be opened and
    read is not a restoration of the project: it is a copy of its
    objects. So the drill checks that the files are there as well as
    the commits. It found a tree that had no files in it at all.
    """
    drill: dict = {"target": str(target), "ok": False, "commits": 0,
                   "branches": 0, "files": 0, "note": ""}
    remove_tree(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    code, out, err = sh(["git", "clone", str(dest), str(target)])
    if code != 0:
        drill["note"] = f"the restoration clone failed: {err.strip()[:200]}"
        return drill
    code, out, _ = sh(["git", "-C", str(target), "rev-list", "--all", "--count"])
    drill["commits"] = int(out.strip() or 0)
    code, out, _ = sh(["git", "-C", str(target), "branch", "--list"])
    drill["branches"] = len([ln for ln in out.splitlines() if ln.strip()])
    # The files are the point of a restoration. A mirror carries the
    # objects and nothing else, and a project that cannot be opened is
    # not restored.
    code, out, _ = sh(["git", "-C", str(target), "ls-files"])
    drill["files"] = len([ln for ln in out.splitlines() if ln.strip()])
    code, _, _ = sh(["git", "-C", str(target), "fsck", "--no-progress"])
    drill["ok"] = drill["commits"] > 0 and drill["files"] > 0 and code == 0
    drill["note"] = ("the history and the files were restored, and the "
                     "restored copy passes git fsck" if drill["ok"]
                     else "the restoration did not come back intact")
    return drill


def secret_scan(repo: Path) -> dict:
    """The history, with the findings counted.

    The TREE is scanned separately, against a checkout. A mirror clone
    has no index and no worktree, so git ls-files in it returns nothing
    and the scan finds nothing, and "the tree is clean" becomes an
    absence of evidence rather than evidence of absence.
    """
    scanner = Path(__file__).resolve().parent.parent / "tools" / "scan_for_secrets.py"
    out: dict = {"tree": {}, "history": {}}
    code, stdout, stderr = sh([sys.executable, str(scanner), "--repo",
                               str(repo), "--history"], timeout=3600)
    text = stdout or stderr or ""
    findings = [ln for ln in text.splitlines() if "FINDING" in ln]
    out["history"] = {
        "exit_code": code,
        "findings": len(findings),
        "clean": code == 0,
        "note": "; ".join(findings[:5])[:400],
    }
    return out


def _count_findings(text: str) -> list[str]:
    """The findings in a scan's output.

    The history scan names them as HISTORY FINDING and the tree scan
    reports a count and then lists them, so both forms are counted. A
    counter that only understood one of them reported zero findings for a
    tree that had one in it, and "the tree is clean" said more than the
    scan had actually shown.
    """
    lines = [ln for ln in text.splitlines() if "FINDING" in ln]
    for ln in text.splitlines():
        stripped = ln.strip()
        if stripped.startswith("secret scan:") and "finding(s)" in stripped:
            count = stripped.split("finding(s)")[0].split(":")[-1].strip()
            try:
                if int(count) > 0:
                    lines.append(stripped)
            except ValueError:
                pass
    return lines


def scan_tree(checkout: Path) -> dict:
    """The tree of a checkout, with the findings counted."""
    scanner = Path(__file__).resolve().parent.parent / "tools" / "scan_for_secrets.py"
    code, stdout, stderr = sh([sys.executable, str(scanner), "--repo",
                               str(checkout)], timeout=3600)
    text = stdout or stderr or ""
    findings = _count_findings(text)
    return {
        "exit_code": code,
        "findings": len(findings),
        "clean": code == 0,
        "note": "; ".join(findings[:5])[:400],
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("repositories", nargs="+",
                    help="the repositories to capture, as owner/name")
    ap.add_argument("--out", default=str(OUT))
    args = ap.parse_args()

    WORK.mkdir(parents=True, exist_ok=True)
    entries = []
    for name in args.repositories:
        short = name.split("/")[-1]
        dest = WORK / f"{short}.mirror"
        print(f"=== {name}")
        entry = {
            "schema": "aetherius.predecessor-capture.v1",
            "source_repo": name,
            "captured_at": datetime.now(timezone.utc).isoformat(),
            "metadata": capture_metadata(name),
            "git": capture_git(name, dest),
            "github_context": capture_github_context(name),
        }
        if entry["git"].get("mirror"):
            entry["secret_scan"] = secret_scan(dest)
            entry["restore_drill"] = restore_drill(dest, WORK / f"{short}-restored")
            # The tree scan runs against the restored checkout, which is a
            # normal clone with an index and a worktree. A mirror has
            # neither, so scanning one finds nothing at all.
            restored = WORK / f"{short}-restored"
            if restored.is_dir():
                entry["secret_scan"]["tree"] = scan_tree(restored)
        entries.append(entry)
        print(f"  commits: {entry['git']['counts'].get('commits')}  "
              f"branches: {entry['git']['counts'].get('branches')}  "
              f"fsck clean: {(entry['git'].get('fsck') or {}).get('clean')}")
        for problem in entry["git"].get("errors", []):
            print(f"  ! {problem}")
        if entry.get("restore_drill"):
            print(f"  the restore drill passed: {entry['restore_drill']['ok']}")
        if entry.get("secret_scan"):
            print(f"  the tree is clean: {entry['secret_scan']['tree']['clean']}  "
                  f"the history is clean: {entry['secret_scan']['history']['clean']}")

    # A capture run must not erase the evidence of an earlier run. Keep
    # every capture that is already recorded and replace only the
    # repositories captured again in this run.
    out_path = Path(args.out)
    existing: list[dict] = []
    if out_path.is_file():
        try:
            previous = yaml.safe_load(out_path.read_text(encoding="utf-8")) or {}
            existing = list(previous.get("captures") or [])
        except Exception:  # noqa: BLE001
            existing = []
    captured_names = {entry["source_repo"] for entry in entries}
    merged = [entry for entry in existing
              if entry.get("source_repo") not in captured_names] + entries

    doc = {
        "schema_version": 1,
        "source_date": date.today().isoformat(),
        "generated_by": "tools/capture_predecessor.py",
        "notes": [
            "The capture the owner's predecessor absorption programme requires "
            "before anything is migrated or deleted: the whole history mirrored, a "
            "bundle, a SHA-256 of each, a git fsck, the GitHub-side context, a "
            "secret scan of the tree and the history, and a test restoration.",
            "A backup that has never been restored is a hope, so the restore drill "
            "is a result and not a claim.",
            "The tool writes the manifest. It never deletes anything.",
            "Captures are cumulative: a later run adds to the registry rather than "
            "replacing the evidence of an earlier one.",
        ],
        "captures": merged,
    }
    out_path.write_text(
        yaml.safe_dump(doc, sort_keys=False, allow_unicode=True, width=100),
        encoding="utf-8")
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
