#!/usr/bin/env python3
"""List every hand-authored document in the declared source scope.

Emits JSON on stdout: a list of {path, scope, exists, digest}. The
path is relative to the user's home directory, so the output is stable
across machines.

The scope rules here are the SAME rules the generator uses. They live in
one place, in Python, and both the generator and the test call into it:
the generator writes the registry, the test reads the disk through this
script. Duplicating the rules in two languages would let them drift, and
the whole point of the registry is that they cannot.

Usage:
    python tools/scan_source_documents.py
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
from pathlib import Path

HOME = Path.home()

def _is_third_party_archive(name: str) -> bool:
    """A directory that is somebody else's source code is not owner material."""
    lowered = name.lower()
    if "source code" in lowered or "sourcecode" in lowered:
        return True
    if re.match(r"^.*-[0-9a-f]{7,40}$", name):
        return True
    return False


SCOPE: list[tuple[str, Path]] = [
    ("documents-root", HOME / "Documents"),
    ("documents-master-prompt", HOME / "Documents" / "master prompt"),
    ("documents-master-prompt-project", HOME / "Documents" / "master prompt" / "project"),
    ("documents-opencde", HOME / "Documents" / "openCDE-agent"),
    ("downloads", HOME / "Downloads"),
]

EXCLUDED_DIRS = {
    "node_modules", ".git", ".venv", "venv", "__pycache__", ".pytest_cache",
    "site-packages", "dist-info", "dist", "build", "target", "out", ".cache",
    ".npm-cache-local", "AppData", "Temp", ".vscode", ".idea",
    "hermes-retired-20261020", "installs", "tools", "logs", "profiles",
    "environments", "skills", "plugins", "vendor", "rollout_summaries",
    "rollout-migrations", "rollout-slices", "computer-use", "generated_images",
    "attachments", "visualizations", "memories", "dictation-history",
    "transcription-history", "thread-writer-locks", "project-metadata-locks",
    "sandbox", "sandbox-bin", "sandbox-secrets", "code-review-plugin",
    "node_repl", "automation", "automations", "pet", "image-line", "fl studio",
    "vscode", "obsidian", "notion", "airtable", "box", "maps", "discord",
    "telegram", "slack",
}

DOCUMENT_EXTENSIONS = {".txt", ".md", ".markdown", ".text", ".rst", ".adoc"}
MAX_BYTES = 8_000_000


def scope_for(path: Path) -> str:
    best = ("", -1)
    for scope_name, root in SCOPE:
        try:
            path.relative_to(root)
        except ValueError:
            continue
        depth = len(root.parts)
        if depth > best[1]:
            best = (scope_name, depth)
    return best[0]


def digest_of(path: Path) -> str | None:
    try:
        h = hashlib.sha256()
        with path.open("rb") as fh:
            for chunk in iter(lambda: fh.read(1 << 16), b""):
                h.update(chunk)
        return "sha256:" + h.hexdigest()
    except OSError:
        return None


def main() -> int:
    seen: set[str] = set()
    out: list[dict] = []

    for _name, root in SCOPE:
        if not root.is_dir():
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [
                d for d in dirnames
                if d not in EXCLUDED_DIRS and not _is_third_party_archive(d)
            ]
            # A directory holding a .git entry is a clone of someone
            # else's work, not hand-authored material. Skip it: the owner
            # did not write it, and the registry is about what they wrote.
            if ".git" in dirnames:
                dirnames.remove(".git")
                dirnames[:] = [d for d in dirnames if not (Path(dirpath) / d / ".git").is_dir()]
            for fn in filenames:
                p = Path(dirpath) / fn
                if p.suffix.lower() not in DOCUMENT_EXTENSIONS:
                    continue
                try:
                    if p.stat().st_size > MAX_BYTES:
                        continue
                except OSError:
                    continue
                key = str(p).lower()
                if key in seen:
                    continue
                seen.add(key)
                try:
                    rel = str(p.relative_to(HOME)).replace("\\", "/")
                except ValueError:
                    rel = p.name
                out.append({
                    "path": rel,
                    "scope": scope_for(p),
                    "exists": True,
                    "digest": digest_of(p),
                })

    out.sort(key=lambda d: d["path"])
    json.dump(out, sys.stdout)
    return 0


if __name__ == "__main__":
    sys.exit(main())
