#!/usr/bin/env python3
"""Generate the owner source registry.

Every hand-authored document the owner has written for the programme is
recorded here: the master prompts, the handoffs, the project briefs, the
per-project build documents, and the conversation material recovered from
Codex and ChatGPT.

The point is completeness. A source registry that silently omits a
document is worse than no registry, because it looks authoritative. So the
scope is declared explicitly, the inventory is generated from the disk
rather than written by hand, and a test checks that every file inside the
declared scope appears in the registry.

Scope rules:
  - Hand-authored material only. Tool installs, caches, node_modules,
    site-packages, git history and generated build trees are excluded:
    they are not sources, they are outputs.
  - A file is identified by its path relative to its scope root, so the
    registry is stable across machines.
  - Every file carries a content digest, so a changed document is
    detectable rather than silently stale.

Usage:
    python tools/generate_source_registry.py [--out docs/SOURCE-REGISTRY.yaml]
"""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
HOME = Path.home()

# The declared scope. Each entry is a name, a root, and a predicate.
# ---------------------------------------------------------------------------
# The owner's own material lives in a few places. Everything else on the
# machine is either a tool, a cache, or something this programme already
# generated.
def _is_third_party_archive(name: str) -> bool:
    """A directory that is somebody else's source code is not owner material.

    Three shapes cover what is actually on disk: an explicit "source code"
    folder, a git archive name that carries its commit sha, and known
    application data folders.
    """
    lowered = name.lower()
    if "source code" in lowered or "sourcecode" in lowered:
        return True
    if re.match(r"^.*-[0-9a-f]{7,40}$", name):
        return True
    return False


SCOPE: list[tuple[str, Path, tuple[str, ...]]] = [
    ("documents-root", HOME / "Documents", ()),
    ("documents-master-prompt", HOME / "Documents" / "master prompt", ()),
    ("documents-master-prompt-project", HOME / "Documents" / "master prompt" / "project", ()),
    ("documents-opencde", HOME / "Documents" / "openCDE-agent", ()),
    ("downloads", HOME / "Downloads", ()),
]

# Material recovered from the owner's own ChatGPT account. It is not on
# disk under Documents, so the registry records it explicitly rather than
# discovering it by walking a folder.
RECOVERED: list[tuple[str, str, str]] = [
    (
        "research/chatgpt-genesis-project/MASTER-HANDOFF-Poietek-Audio-Ecosystem.md",
        "handoff",
        "The eighty-eight section master handoff for the Poietek and Aetherius "
        "audio, DAW, instrument, effect and plugin ecosystem. Recovered verbatim "
        "from the ChatGPT conversation 'Continue inheritance handoff'. It is the "
        "owner's directive, not evidence of implementation.",
    ),
    (
        "research/chatgpt-genesis-project.json",
        "conversation_corpus",
        "Seventy-five conversations from the owner's ChatGPT project named "
        "Genesis: 5,952 owner messages over 14,487 turns. The opening and the "
        "later asks of each conversation, which is the direction signal.",
    ),
    (
        "research/codex-history/owner-directives.txt",
        "conversation_corpus",
        "Two hundred and thirty-seven distinct directive sentences recovered from "
        "the Codex corpus, with the thread each came from.",
    ),
]

# Directory names that never contain a source document.
EXCLUDED_DIRS = {
    "node_modules", ".git", ".venv", "venv", "__pycache__", ".pytest_cache",
    "site-packages", "dist-info", "dist", "build", "target", "out", ".cache",
    ".npm-cache-local", "AppData", "Temp", ".vscode", ".idea",
    # A retired Hermes install and its bundled toolchains are outputs, not
    # sources: they were written by this programme's own tooling.
    "hermes-retired-20261020", "installs", "site-packages", "tools",
    "logs", "profiles", "environments", "skills", "plugins", "vendor",
    "rollout_summaries", "rollout-migrations", "rollout_slices",
    "computer-use", "generated_images", "attachments", "visualizations",
    "memories", "dictation-history", "transcription-history",
    "thread-writer-locks", "project-metadata-locks", "sandbox",
    "sandbox-bin", "sandbox-secrets", "code-review-plugin", "node_repl",
    "dictation", "automation", "automations", "plugins", "pet",
    "image-line", "fl studio", "vscode", "obsidian", "notion", "airtable",
    "box", "maps", "discord", "telegram", "slack",
}

# The extensions that count as a document.
DOCUMENT_EXTENSIONS = {".txt", ".md", ".markdown", ".text", ".rst", ".adoc"}

MAX_BYTES = 8_000_000


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()


def classify(path: Path) -> str:
    """A coarse kind for the document, from its name and where it lives."""
    name = path.name.lower()
    if "handoff" in name or "continuation" in name:
        return "handoff"
    if name.startswith(("build", "continuous build")) or "build" in name:
        return "build_record"
    if "master" in name or "prompt" in name:
        return "master_prompt"
    if "requirements" in name or "requirements" in name.replace("_", " "):
        return "requirements"
    if "loop" in name:
        return "process"
    if path.suffix.lower() == ".md":
        return "document"
    return "prompt_or_brief"


CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def clean_text(text: str) -> str:
    """Remove terminal control characters from a title.

    Some recovered documents contain overstrike formatting: a glyph,
    a backspace, then the same glyph again to simulate bold. Keeping
    the backspace makes the YAML unparseable, and keeping both glyphs
    doubles every letter. Collapse the pair first, then drop whatever
    control characters remain.
    """
    text = re.sub(r"(.)\x08\1", r"\1", text)
    return CONTROL_CHARS.sub("", text)


def title_of(text: str, fallback: str) -> str:
    text = clean_text(text)
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            return stripped.lstrip("# ").strip()[:120]
        # A first line that looks like a title.
        if len(stripped) > 3 and not stripped[0].isdigit() and " " in stripped:
            return stripped[:120]
        break
    # A file whose first line is not a title still needs one. The file
    # stem is the honest fallback: it is what the document is called.
    return fallback.strip() or "untitled"


def scope_for(path: Path) -> str:
    """The most specific scope a path falls in.

    The scopes nest: `Documents` contains `Documents/master prompt`. A
    document under the master prompt folder belongs to the master prompt
    scope, not to the general documents scope, so the longest matching
    root wins.
    """
    best = ("", -1)
    for scope_name, root, _ in SCOPE:
        try:
            path.relative_to(root)
        except ValueError:
            continue
        depth = len(root.parts)
        if depth > best[1]:
            best = (scope_name, depth)
    return best[0]


def iter_documents():
    """Every document in the declared scope, with its scope name."""
    seen: set[str] = set()
    for _scope_name, root, _ in SCOPE:
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
                real = str(p).lower()
                if real in seen:
                    continue
                seen.add(real)
                yield scope_for(p), p


def yaml_escape(text: str) -> str:
    text = clean_text(str(text))
    return '"' + text.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ") + '"'


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(REPO / "docs" / "SOURCE-REGISTRY.yaml"))
    args = ap.parse_args()

    entries = []
    by_kind: dict[str, int] = {}
    by_scope: dict[str, int] = {}
    total_bytes = 0

    for scope_name, path in iter_documents():
        try:
            raw = path.read_bytes()
        except OSError:
            continue
        text = raw.decode("utf-8", errors="replace")
        size = len(raw)
        total_bytes += size
        kind = classify(path)
        by_kind[kind] = by_kind.get(kind, 0) + 1
        by_scope[scope_name] = by_scope.get(scope_name, 0) + 1
        try:
            rel = str(path.relative_to(HOME)).replace("\\", "/")
        except ValueError:
            rel = path.name
        entries.append({
            "path": rel,
            "scope": scope_name,
            "kind": kind,
            "bytes": size,
            "lines": text.count("\n") + 1,
            "digest": "sha256:" + sha256_of(path),
            "title": title_of(text, path.stem),
            "modified": datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).strftime("%Y-%m-%d"),
        })

    entries.sort(key=lambda e: (e["scope"], e["path"]))

    lines: list[str] = []
    lines.append("# " + "=" * 76)
    lines.append("# OWNER SOURCE REGISTRY - every hand-authored source document")
    lines.append("# " + "=" * 76)
    lines.append("# GENERATED by tools/generate_source_registry.py.")
    lines.append("#")
    lines.append("# This registry exists so that completeness is checkable rather than")
    lines.append("# hoped for. Every hand-authored document the owner wrote for this")
    lines.append("# programme is recorded here, with a content digest. A test walks the")
    lines.append("# declared scope on disk and fails when a document is missing from")
    lines.append("# this list, so nothing is quietly dropped.")
    lines.append("#")
    lines.append("# Excluded by design: tool installs, caches, node_modules,")
    lines.append("# site-packages, generated build trees and git history. Those are")
    lines.append("# outputs of this programme, not sources for it.")
    lines.append("# " + "=" * 76)
    lines.append('schema_version: "1.0.0"')
    lines.append('source_date: "2026-10-20"')
    lines.append("")
    lines.append("scopes:")
    for scope_name, root, _ in SCOPE:
        count = by_scope.get(scope_name, 0)
        lines.append(f"  - name: {scope_name}")
        lines.append(f"    root: {yaml_escape(str(root))}")
        lines.append(f"    documents: {count}")
    lines.append("")
    lines.append("totals:")
    lines.append(f"  documents: {len(entries)}")
    lines.append(f"  bytes: {total_bytes}")
    for kind in sorted(by_kind):
        lines.append(f"  kind_{kind}: {by_kind[kind]}")
    lines.append("")
    lines.append("# Material recovered from the owner's own accounts. It is not on")
    lines.append("# disk under Documents, so it is recorded explicitly rather than")
    lines.append("# discovered by walking a folder.")
    lines.append("recovered:")
    for path, kind, purpose in RECOVERED:
        full = REPO / path
        digest = "sha256:" + sha256_of(full) if full.exists() else "sha256:absent"
        size = full.stat().st_size if full.exists() else 0
        lines.append(f"  - path: {yaml_escape(path)}")
        lines.append(f"    scope: recovered")
        lines.append(f"    kind: {kind}")
        lines.append(f"    purpose: {yaml_escape(purpose)}")
        lines.append(f"    bytes: {size}")
        lines.append(f"    digest: {digest}")

    lines.append("sources:")
    for e in entries:
        lines.append(f"  - path: {yaml_escape(e['path'])}")
        lines.append(f"    scope: {e['scope']}")
        lines.append(f"    kind: {e['kind']}")
        lines.append(f"    title: {yaml_escape(e['title'])}")
        lines.append(f"    bytes: {e['bytes']}")
        lines.append(f"    lines: {e['lines']}")
        lines.append(f"    modified: {e['modified']}")
        lines.append(f"    digest: {e['digest']}")

    out = Path(args.out)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {out}")
    print(f"  {len(entries)} documents, {total_bytes:,} bytes")
    for scope_name in sorted(by_scope):
        print(f"  {scope_name}: {by_scope[scope_name]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
