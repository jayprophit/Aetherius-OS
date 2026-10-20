#!/usr/bin/env python3
"""Catalogue every project the owner has, from every place they hold one.

The owner has projects in at least four places: the GitHub account, the
Projects folder on the desktop, the recovered predecessor material on
the external drive, and the directories inside the conversations. None
of them knows about the others.

This tool finds them all and puts them in one register, so that a
question like "is there already something that does X" has an answer.

A directory counts as a project when it holds source files, a package
manifest, a build file, or a README of its own. A directory of
photographs is not a project. The owner, the word for a person with a
sub-account or a role, is not a project either.

Usage:
    python tools/catalogue_programme.py
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

ROOTS = [
    r"E:\external drive",
    r"E:\downloads\Recovered-From-F\Spreadsheets-Data\os",
    r"E:\downloads\Recovered-From-F\Spreadsheets-Data\New folder",
    r"E:\downloads\Recovered-From-F\Pictures\os",
    r"E:\downloads\Recovered-From-F\Documents\os",
    r"E:\downloads\Recovered-From-F\Documents\New folder",
    r"E:\downloads\Recovered-From-F\Audio\os",
    r"E:\downloads\Recovered-From-F\Archives\os",
    r"E:\downloads\Recovered-From-F\Archives\zip files",
    r"E:\downloads\Documents\Telegram Desktop",
    r"E:\downloads\Archives",
    r"C:\Users\jpowe\Desktop\Projects",
]

SOURCE_EXT = {
    ".py", ".js", ".ts", ".tsx", ".jsx", ".c", ".h", ".cpp", ".hpp", ".cc", ".cs",
    ".java", ".rs", ".go", ".rb", ".php", ".swift", ".kt", ".lua", ".sh", ".ps1",
    ".bat", ".m", ".mm", ".pl", ".jl", ".vue", ".svelte", ".ipynb", ".php",
}
MANIFEST = {
    "package.json", "pyproject.toml", "setup.py", "requirements.txt",
    "cargo.toml", "go.mod", "pom.xml", "build.gradle", "composer.json",
    "cmakelists.txt", "makefile", "dockerfile", "docker-compose.yml",
    "docker-compose.yaml", "pubspec.yaml", "mix.exs", "deno.json",
    "build.yaml", "project.clj",
}
DOC_NAMES = {"readme", "readme.md", "readme.txt", "index.md", "readme.rst"}

# Families, with the words that put a project in one.
FAMILIES: dict[str, tuple[str, ...]] = {
    "platform": ("aetherius", "genesis", "os", "platform", "kernel", "ide",
                 "workspace", "bridge", "runtime", "shell"),
    "intelligence": ("genesis", "agent", "ai", "llm", "twin", "cognitive",
                     "intelligence", "reasoning", "agentic"),
    "creative": ("poietek", "audio", "music", "daw", "midi", "plugin", "synth",
                 "sampler", "mixer", "studio", "recording", "score", "piano"),
    "knowledge": ("mat", "materials", "atlas", "codex", "knowledge", "wiki",
                  "library", "encyclopedia", "docs"),
    "finance": ("finance", "banking", "payment", "trading", "invest", "ledger",
                "wallet", "crypto", "blockchain", "defi", "token", "coin",
                "sovereign", "tax", "invoice", "expense"),
    "commerce": ("ecommerce", "e-commerce", "shop", "store", "marketplace",
                 "commerce", "retail", "cart", "checkout", "product",
                 "wholesale", "catalog", "catalogue"),
    "elearning": ("learndash", "learning", "course", "lesson", "quiz",
                  "education", "lms", "tutorial", "student", "academy",
                  "curriculum", "sfwd"),
    "social_media": ("social", "community", "forum", "feed", "profile",
                     "buddypress", "gamipress", "mycred", "peepso"),
    "communication": ("chat", "messaging", "telegram", "discord", "email",
                      "voice", "video", "notification", "sms"),
    "databases": ("database", "db", "sql", "postgres", "mysql", "mongo",
                  "sqlite", "redis", "schema", "migration", "storage",
                  "cloud_storage"),
    "cloud_services": ("cloud", "aws", "azure", "gcp", "serverless", "kubernetes",
                       "docker", "container", "terraform", "cdn", "gateway",
                       "microservice"),
    "local_services": ("local", "offline", "self-hosted", "ollama", "onprem",
                       "local_models", "airgap"),
    "tools": ("tool", "utility", "cli", "script", "automation", "scraper",
              "analyser", "analyzer", "generator", "converter", "editor",
              "player", "tracker", "manager", "monitor", "bot"),
    "quantum": ("quantum", "qvm", "ternary", "qubit", "holonav"),
}

# The owner named these families directly.
OWNER_FAMILIES = {
    "apps", "blockchain", "finance", "commerce", "elearning",
    "social_media", "communication", "databases", "cloud_services",
    "local_services",
}


def families_for(name: str, description: str = "") -> list[str]:
    hay = f"{name} {description}".lower().replace("_", " ").replace("-", " ")
    out = []
    for fam, words in FAMILIES.items():
        for w in words:
            if re.search(rf"(?<![a-z]){re.escape(w)}(?![a-z])", hay):
                out.append(fam)
                break
    return out


def looks_like_project(dirpath: Path) -> tuple[bool, dict]:
    """A project directory holds source, or a manifest, or its own README."""
    stats = {"source_files": 0, "manifests": [], "readme": False,
             "total_files": 0, "bytes": 0, "languages": Counter()}
    try:
        entries = list(dirpath.iterdir())
    except OSError:
        return False, stats
    for e in entries:
        try:
            if e.is_file():
                stats["total_files"] += 1
                stats["bytes"] += e.stat().st_size
                n = e.name.lower()
                if e.suffix.lower() in SOURCE_EXT:
                    stats["source_files"] += 1
                    stats["languages"][e.suffix.lower()] += 1
                if n in MANIFEST:
                    stats["manifests"].append(e.name)
                if n in DOC_NAMES or n.startswith("readme"):
                    stats["readme"] = True
            elif e.is_dir():
                stats["total_files"] += 1
        except OSError:
            continue
    ok = bool(stats["manifests"]) or stats["source_files"] >= 3 or (
        stats["readme"] and stats["source_files"] >= 1)
    return ok, stats


def scan_local_projects() -> list[dict]:
    found: list[dict] = []
    seen: set[str] = set()
    for r in ROOTS:
        root = Path(r)
        if not root.is_dir():
            continue
        for dirpath, dirnames, filenames in os_walk(root):
            d = Path(dirpath)
            # Only the directory itself and its immediate children are
            # candidates, otherwise every subfolder is a project.
            ok, stats = looks_like_project(d)
            if not ok:
                continue
            key = f"{d}".lower()
            if key in seen:
                continue
            seen.add(key)
            found.append({
                "name": d.name,
                "path": str(d),
                "kind": "local_project",
                "source_files": stats["source_files"],
                "manifests": stats["manifests"],
                "readme": stats["readme"],
                "bytes": stats["bytes"],
                "languages": sorted(stats["languages"]),
            })
            dirnames[:] = []
    return found


def os_walk(root: Path):
    import os
    for dirpath, dirnames, filenames in os.walk(root, onerror=lambda e: None):
        dirnames[:] = [d for d in dirnames
                       if d not in {".venv", "node_modules", "__pycache__",
                                    ".git", "$RECYCLE.BIN", ".mypy_cache",
                                    "site-packages", ".pytest_cache"}]
        yield dirpath, dirnames, filenames


def load_repos() -> list[dict]:
    p = REPO / "research" / "github-repos" / "index.json"
    if not p.exists():
        return []
    return json.loads(p.read_text(encoding="utf-8"))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(REPO / "research" / "catalogue"))
    args = ap.parse_args()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    print("scanning local project directories", flush=True)
    local = scan_local_projects()
    print(f"  {len(local)} local project directories", flush=True)

    repos = load_repos()
    print(f"  {len(repos)} GitHub repositories", flush=True)

    entries: list[dict] = []
    for r in repos:
        if r["empty"] and not r.get("description"):
            continue
        entries.append({
            "name": r["name"],
            "kind": "github_repo",
            "fork": r["fork"],
            "private": r["private"],
            "description": r["description"],
            "language": r["language"],
            "topics": r["topics"],
            "licence": r["spdx"],
            "size_kb": r["size_kb"],
            "pushed_at": r["pushed_at"],
            "upstream": r["upstream"],
            "domains": r.get("domains", []),
            "path": r["full_name"],
            "readme_bytes": r.get("readme_bytes", 0),
        })
    for l in local:
        entries.append({**l, "description": "", "families": []})

    for e in entries:
        desc = e.get("description") or ""
        fams = set(families_for(e["name"], desc))
        if e.get("fork"):
            fams.add("prior_art")
        e["families"] = sorted(fams)

    # A name can appear both as a repository and as a local directory.
    by_name: dict[str, list[dict]] = defaultdict(list)
    for e in entries:
        by_name[e["name"].lower()].append(e)
    linked = 0
    for name, group in by_name.items():
        if len(group) > 1:
            kinds = {g["kind"] for g in group}
            if kinds == {"github_repo", "local_project"}:
                linked += 1
                for g in group:
                    g["linked"] = True

    (out_dir / "catalogue.json").write_text(
        json.dumps(entries, indent=1, ensure_ascii=False), encoding="utf-8")

    fam_counts: Counter[str] = Counter()
    for e in entries:
        for f in e["families"]:
            fam_counts[f] += 1

    lines = ["# Programme catalogue", "",
             "Every project the owner holds, found in every place they hold",
             "one: the GitHub account, the desktop Projects folder, and the",
             "recovered predecessor material.", "",
             f"{len(entries)} entries: "
             f"{sum(1 for e in entries if e['kind'] == 'github_repo')} repositories, "
             f"{sum(1 for e in entries if e['kind'] == 'local_project')} local directories.",
             "",
             f"{linked} names exist as both a repository and a local directory.",
             "",
             "## By family", "", "| Family | Entries |", "|---|---|"]
    for fam, n in fam_counts.most_common():
        lines.append(f"| {fam} | {n} |")

    for fam in sorted(OWNER_FAMILIES | set(fam_counts)):
        group = [e for e in entries if fam in e["families"]]
        if not group:
            lines += ["", f"## {fam}", "", "Nothing found in this family yet.", ""]
            continue
        own = [e for e in group if not e.get("fork")]
        lines += ["", f"## {fam}", "",
                  f"{len(group)} entries, {len(own)} of them the owner's own.", ""]
        for e in sorted(own, key=lambda x: x["name"].lower())[:60]:
            desc = (e.get("description") or "").replace("|", "/")[:70]
            extra = []
            if e["kind"] == "github_repo":
                extra.append(f"{e.get('language') or '-'}")
                if e.get("licence"):
                    extra.append(e["licence"])
            else:
                extra.append(f"{e.get('source_files', 0)} source files")
                if e.get("manifests"):
                    extra.append(", ".join(e["manifests"][:2]))
            if e.get("linked"):
                extra.append("also local")
            lines.append(f"- **{e['name']}** — {desc}  ")
            lines.append(f"    {' · '.join(str(x) for x in extra)}")

    (out_dir / "catalogue.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"  wrote {out_dir / 'catalogue.md'}")
    print(f"  families: {dict(fam_counts.most_common(8))}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
