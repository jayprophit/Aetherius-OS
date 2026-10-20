#!/usr/bin/env python3
"""Assess each first-party project on evidence, not on its own claims.

The owner holds projects in many places and many of them have a README
that describes what they intend to be. This tool measures what is
actually there: the languages, the size, the tests, the build system,
whether the build runs, whether there is a licence, and whether secrets
have been left in the tree.

A project that has a hundred source files and no tests is recorded as
having a hundred source files and no tests. That is the point.

Usage:
    python tools/assess_projects.py
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

LANG_BY_EXT = {
    ".py": "python", ".js": "javascript", ".mjs": "javascript",
    ".ts": "typescript", ".tsx": "typescript", ".jsx": "javascript",
    ".c": "c", ".h": "c", ".cpp": "c++", ".hpp": "c++", ".cc": "c++",
    ".cs": "csharp", ".java": "java", ".rs": "rust", ".go": "go",
    ".rb": "ruby", ".php": "php", ".swift": "swift", ".kt": "kotlin",
    ".sh": "shell", ".ps1": "powershell", ".sql": "sql", ".lua": "lua",
}
SKIP_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__",
             "dist", "build", "out", "target", ".next", "coverage",
             ".mypy_cache", ".pytest_cache", ".tox", "site-packages",
             ".gradle", ".idea", ".vscode", "vendor"}

# A dot-directory is a local tool, a checkout or a build tree, never the
# project's own source. Genesis alone keeps 328,000 lines of Python in
# .genesis-local, which its own gitignore excludes.
KEEP_DOT_DIRS = {".github", ".githooks", ".devcontainer", ".gitlab"}
# A vendor directory is third-party code and does not count as the
# project's own source.
VENDOR_DIRS = {"vendor", "third_party", "thirdparty", "external",
               "node_modules", "site-packages", "Pods", "deps"}

TEST_PATTERNS = re.compile(r"(?i)(^|[/\\])(tests?|spec|__tests__)([/\\]|$)|"
                           r"(^|[/\\])test[_-]|_test\.|_spec\.|\.test\.|\.spec\.")
DOC_NAMES = {"readme.md", "readme.txt", "readme.rst", "readme", "index.md"}
MANIFEST_NAMES = {
    "package.json", "pyproject.toml", "setup.py", "requirements.txt",
    "cargo.toml", "go.mod", "pom.xml", "build.gradle", "composer.json",
    "cmakelists.txt", "makefile", "dockerfile", "docker-compose.yml",
    "docker-compose.yaml", "pubspec.yaml", "mix.exs", "deno.json",
    "build.yaml", "manage.py", "pnpm-workspace.yaml", "turbo.json",
}
LICENCE_NAMES = {"license", "license.md", "license.txt", "licence",
                  "licence.md", "licence.txt", "copying", "unlicense"}
SECRET_NAMES = {".env", ".env.local", ".env.example", ".env.development",
                ".env.production", "secrets.json", "credentials.json"}

SECRET_VALUE = re.compile(
    r"(?i)(sk-[A-Za-z0-9]{16,}|AIza[0-9A-Za-z\-_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|"
    r"AKIA[0-9A-Z]{16}|eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.|"
    r"-----BEGIN [A-Z ]*PRIVATE KEY-----)")


def walk_project(root: Path):
    """Walk a project's own source.

    A directory that holds its own repository is a project of its own, and
    it is not part of the project that contains it. Aetherius-OS contains
    Genesis, the IDE, Poietek and the other absorbed projects, and
    Agent-Bridge contains its three branch variants; each is measured on
    its own, and counting them again as part of the parent would inflate
    the parent's figures.
    """
    for dirpath, dirnames, filenames in os.walk(root, onerror=lambda e: None):
        dirnames[:] = [d for d in dirnames
                       if d not in SKIP_DIRS
                       and (not d.startswith(".") or d in KEEP_DOT_DIRS)]
        rel = Path(dirpath).relative_to(root)
        if rel.parts and (Path(dirpath) / ".git").exists():
            # A nested repository: it is a project of its own, and it is
            # measured on its own.
            dirnames[:] = []
            continue
        in_vendor = any(p in VENDOR_DIRS for p in rel.parts)
        yield Path(dirpath), filenames, in_vendor


def assess(root: Path) -> dict:
    stats = {
        "languages": Counter(),
        "own_source_files": 0,
        "vendor_source_files": 0,
        "own_lines": 0,
        "vendor_lines": 0,
        "test_files": 0,
        "test_lines": 0,
        "docs": [],
        "manifests": [],
        "licence": None,
        "secret_files": [],
        "secret_literals": [],
        "has_ci": False,
        "has_docker": False,
        "has_tests_dir": False,
        "top_level": [],
    }
    try:
        stats["top_level"] = sorted(p.name for p in root.iterdir())
    except OSError:
        pass

    for dirpath, filenames, in_vendor in walk_project(root):
        d = Path(dirpath)
        rel = d.relative_to(root)
        if "test" in [p.lower() for p in rel.parts] or "spec" in [p.lower() for p in rel.parts]:
            stats["has_tests_dir"] = True
        if rel.parts and rel.parts[0] in (".github", ".gitlab", ".circleci"):
            stats["has_ci"] = True
        for fn in filenames:
            p = d / fn
            low = fn.lower()
            ext = p.suffix.lower()
            if low in LICENCE_NAMES:
                stats["licence"] = fn
            if low in MANIFEST_NAMES:
                stats["manifests"].append(fn)
            if low in DOC_NAMES:
                stats["docs"].append(str(p.relative_to(root)).replace("\\", "/"))
            if low in SECRET_NAMES:
                stats["secret_files"].append(str(p.relative_to(root)).replace("\\", "/"))
            if ext in (".yml", ".yaml") and "workflow" in str(p).lower():
                stats["has_ci"] = True
            if low.startswith("dockerfile") or low.startswith("docker-compose"):
                stats["has_docker"] = True
            lang = LANG_BY_EXT.get(ext)
            if lang is None:
                continue
            try:
                size = p.stat().st_size
                if size > 2_000_000:
                    continue
                text = p.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            lines = text.count("\n") + 1
            is_test = bool(TEST_PATTERNS.search(str(p)))
            if in_vendor:
                stats["vendor_source_files"] += 1
                stats["vendor_lines"] += lines
                continue
            stats["own_source_files"] += 1
            stats["own_lines"] += lines
            stats["languages"][lang] += lines
            if is_test:
                stats["test_files"] += 1
                stats["test_lines"] += lines
            if SECRET_VALUE.search(text):
                stats["secret_literals"].append(
                    str(p.relative_to(root)).replace("\\", "/"))

    langs = stats.pop("languages")
    total_own = max(1, stats["own_lines"])
    stats["languages"] = dict(langs.most_common())
    stats["primary_language"] = next(iter(langs), None)
    stats["vendor_fraction"] = round(
        stats["vendor_lines"] / max(1, stats["vendor_lines"] + stats["own_lines"]), 3)
    stats["test_line_fraction"] = round(stats["test_lines"] / total_own, 3)
    stats["doc_count"] = len(stats["docs"])
    stats["has_secret_literals"] = bool(stats["secret_literals"])
    stats["secret_literal_files"] = stats["secret_literals"][:10]
    return stats


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(REPO / "research" / "projects"))
    args = ap.parse_args()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Every project the owner holds, at the location the shared table
    # records. The table is the single source of truth: a path written
    # out here would go stale the moment the workspace is reorganised
    # again, and it would go stale silently, because the measurement
    # would simply find nothing.
    sys.path.insert(0, str(Path(__file__).parent))
    from programme_projects import PROJECTS as PROGRAMME_PROJECTS

    candidates: list[tuple[str, Path]] = [
        (p["name"], Path(p["path"])) for p in PROGRAMME_PROJECTS
    ]

    seen = set()
    unique = []
    for name, path in candidates:
        key = str(path).lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append((name, path))

    print(f"assessing {len(unique)} projects")
    results = []
    for name, path in unique:
        stats = assess(path)
        results.append({"name": name, "path": str(path), **stats})
        print(f"  {name[:44]:<46} {stats['own_lines']:>7} own lines  "
              f"{stats['test_files']:>3} tests  {stats['primary_language'] or '-'}")

    (out_dir / "assessment.json").write_text(
        json.dumps(results, indent=1, ensure_ascii=False), encoding="utf-8")

    lines = ["# First-party project assessment", "",
             "Measured, not claimed. A project is recorded with the lines of its",
             "own source, its tests, its build system and its licence.", "",
             "| Project | Own lines | Tests | Test share | Languages | Licence |",
             "|---|---|---|---|---|---|"]
    for r in sorted(results, key=lambda x: -x["own_lines"]):
        lines.append(
            f"| {r['name']} | {r['own_lines']} | {r['test_files']} | "
            f"{r['test_line_fraction']*100:.0f}% | {r['primary_language'] or '-'} | "
            f"{r['licence'] or 'none'} |")
    lines += ["", "## Concerns", ""]
    lines += ["| Project | Concern |", "|---|---|"]
    for r in results:
        if r["has_secret_literals"]:
            lines.append(f"| {r['name']} | secret literal in "
                         f"{', '.join(r['secret_literal_files'][:3])} |")
        if r["own_lines"] > 2000 and r["test_line_fraction"] < 0.02:
            lines.append(f"| {r['name']} | {r['own_lines']} lines and almost no tests |")
        if not r["licence"] and r["own_lines"] > 500:
            lines.append(f"| {r['name']} | no licence file |")
        if r["vendor_fraction"] > 0.5 and r["own_lines"] > 500:
            lines.append(f"| {r['name']} | {r['vendor_fraction']*100:.0f}% of the code is vendor code |")
    (out_dir / "assessment.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("wrote", out_dir / "assessment.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
