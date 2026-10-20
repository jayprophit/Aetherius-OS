"""Build the obsolescence register.

The owner's instruction for the endgame: once the projects are finished
and ready for public release, the obsolete files, folders and data are
removed, and the reference data is kept so that it can be used later if
needed.

That instruction needs a register before it can be carried out, because
"obsolete" and "reference" are easy to confuse and the difference is
costly. A predecessor absorbed by a working project is obsolete. A
fork that informed the design is reference. An empty repository that
the owner keeps for learning is neither: the inheritance packet is
explicit that it must not be deleted merely for being empty.

Four states, and every item on the machine is in one of them:

  LIVE          working project, kept and built.
  REFERENCE     kept, because it can be used later. Third-party source,
                design references, the owner's learning repositories, and
                the material the owner has provided.
  OBSOLETE      superseded. A predecessor that a working project has
                absorbed, a duplicate of a live tree, generated output.
  UNREVIEWED    not yet classified. It is not assumed to be live.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

REPO = Path(r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS")
PROJECTS_ROOT = Path(r"C:\Users\jpowe\Desktop\Projects")
OUT = REPO / "docs" / "OBSOLESCENCE-REGISTRY.yaml"
REPORT = REPO / "docs" / "OBSOLESCENCE-REGISTRY.md"
GITHUB_INDEX = REPO / "research" / "github-repos" / "index.json"

# The projects the owner has directed, and what they now are.
LIVE_PROJECTS = {
    "aetherius-os": "Aetherius-OS",
    "genesis": "Genesis",
    "agent-bridge": "Agent-Bridge",
    "ide-workspace": "IDE-Workspace",
    "mat": "Materials-Atlas-Table-Codex---MAT",
    "poietek": "Poietek",
    "universal-bridge": "Universal-Bridge",
    "ledgerlands": "LedgerLands",
    "athena": "Athena",
    "food-wiki-app": "Food Wiki App",
    "decentralized-messaging-app": "Decentralized Messaging App",
    "hermes-config-audit": "Hermes-Config-Audit",
    "architecture-of-shadows-book": "Architecture of Shadows Book",
    "aetherial-platform": "aetherial-platform",
    "web-platform": "Web-platform",
    "niche-platform": "Niche_platform",
    "football-card-game": "football-card-game",
    "self-building-ai": "self-building-ai",
    "crossplatform": "Crossplatform---multiplatform",
    "virtual-assistant": "VirtualAssistant",
    "trading-bot": "Multi-Cross-Platform-Trading-Bot",
    "ai-digital-twin": "ai-digital-clone",
}

# The predecessors, absorbed by a working project. Their material is kept
# as reference; their repositories are archived rather than deleted.
OBSOLETE_PREDECESSORS = {
    "aetherial": "absorbed by Aetherius OS",
    "quantum-os": "absorbed by Aetherius OS",
    "qva-merged": "absorbed by Aetherius OS",
    "veyra": "absorbed by Aetherius OS, and its AI engine merged into Genesis",
    "aetherium": "absorbed by Aetherius OS",
}

# The folders on disk that are generated and never source.
GENERATED_DIRS = {
    "build", "build-verify", "build-host", "build-verify-*", "dist", "out",
    "target", "coverage", ".next", ".cache", "__pycache__", ".pytest_cache",
    ".mypy_cache", ".vite", "node_modules", ".venv", "venv", "site-packages",
    ".genesis-local", ".idea", ".vs", "obj", "bin",
}

# The owner's learning repositories. The inheritance packet is explicit:
# an empty repository may be a learning repository, and it must not be
# deleted merely for being empty.
LEARNING_MARKERS = (
    "cs50", "data-analysis-with-python", "deep-learning", "python-projects",
    "machine-code", "scratch", "spreadsheets", "npm", "maven", "gradle",
    "flask", "flutter", "linux", "docker", "ansible", "arduino",
    "react-native", "swift-ui", "native-app-development", "jetpack-compos",
    "power-bi", "webflow", "prompt-engineering", "github-markdown-syntax",
    "terroaform", "truffle-suite", "nfts", "blockchain", "cyber-security",
    "devops", "imba", "lau", "codespace-auth-temp", "ios", "hibernate",
    "html", "excel", "sql", "c", "c-plus-plus",
)


def git(path: Path, *args) -> str:
    r = subprocess.run(["git", "-C", str(path), *args], capture_output=True,
                       text=True, encoding="utf-8", errors="replace", timeout=600)
    return (r.stdout or "").strip()


def classify_repository(name: str, fork: bool, size_kb: int, licence: str | None,
                        archived: bool) -> tuple[str, str]:
    """What a repository on the account is."""
    lowered = name.lower()
    if lowered in OBSOLETE_PREDECESSORS:
        return "obsolete", OBSOLETE_PREDECESSORS[lowered]
    if lowered in LIVE_PROJECTS:
        return "live", "a working project of the programme"
    if fork:
        return "reference", "a fork: third-party prior art, kept for reference"
    if archived:
        # An archived repository that is empty, or that is a learning
        # repository, is still reference. The inheritance packet is
        # explicit that an empty repository may be a learning repository
        # and must not be deleted merely for being empty, and archiving
        # does not change what it is.
        if size_kb < 50 or any(marker in lowered for marker in LEARNING_MARKERS):
            return "reference", "archived, but kept: it may be a learning repository"
        return "obsolete", "archived, and not a working project"
    if any(marker in lowered for marker in LEARNING_MARKERS):
        return "reference", "a learning repository, kept"
    if size_kb < 50:
        return "reference", "an empty repository, kept: it may be a learning repository"
    return "unreviewed", "the owner's own repository, not yet placed in the programme"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(OUT))
    args = ap.parse_args()

    entries: list[dict] = []

    # ---- the repositories on the account ----
    if GITHUB_INDEX.exists():
        account = json.loads(GITHUB_INDEX.read_text(encoding="utf-8"))
        for r in account:
            state, why = classify_repository(
                r["name"], r["fork"], r.get("size_kb") or 0, r.get("spdx"),
                r.get("archived", False))
            entries.append({
                "kind": "repository",
                "name": r["name"],
                "state": state,
                "reason": why,
                "fork": r["fork"],
                "archived": r.get("archived", False),
                "licence": r.get("spdx"),
                "language": r.get("language"),
                "size_kb": r.get("size_kb", 0),
                "pushed_at": r.get("pushed_at"),
            })

    # ---- the folders on disk ----
    for child in sorted(PROJECTS_ROOT.iterdir()):
        if not child.is_dir():
            continue
        if child.name == "Temp":
            entries.append({
                "kind": "folder", "name": "Temp", "state": "reference",
                "reason": "the designated holding place for anything that needs to "
                          "wait outside its project",
                "path": str(child),
            })
            continue
        entries.append({
            "kind": "folder", "name": child.name, "state": "live",
            "reason": "a project of the programme", "path": str(child),
        })

    # ---- the generated output inside the projects ----
    generated: list[dict] = []
    for child in sorted(PROJECTS_ROOT.iterdir()):
        if not child.is_dir() or child.name == "Temp":
            continue
        for dirpath, dirnames, _files in __import__("os").walk(child):
            rel = Path(dirpath).relative_to(child)
            if len(rel.parts) > 4:
                dirnames[:] = []
                continue
            for d in list(dirnames):
                if d in GENERATED_DIRS or d.startswith("build-verify"):
                    target = Path(dirpath) / d
                    size = 0
                    for f in target.rglob("*"):
                        try:
                            if f.is_file():
                                size += f.stat().st_size
                        except OSError:
                            continue
                    generated.append({
                        "kind": "generated",
                        "name": str(target.relative_to(PROJECTS_ROOT)).replace("\\", "/"),
                        "state": "obsolete",
                        "reason": "generated output, rebuilt by the build",
                        "bytes": size,
                    })
                    dirnames.remove(d)
    entries.extend(generated)

    states = Counter(e["state"] for e in entries)
    by_reason: dict[str, list[dict]] = defaultdict(list)
    for e in entries:
        by_reason[e["state"]].append(e)

    document = {
        "schema_version": "1.0.0",
        "source_date": date.today().isoformat(),
        "generated_by": "tools/build_obsolescence_register.py",
        "notes": [
            "The endgame the owner has set: once the projects are finished and "
            "ready for public release, the obsolete files, folders and data are "
            "removed and the reference data is kept so it can be used later.",
            "This register is what that instruction needs before it can be "
            "carried out, because obsolete and reference are easy to confuse "
            "and the difference is costly.",
            "A predecessor absorbed by a working project is obsolete. A fork "
            "that informed the design is reference. An empty repository the "
            "owner keeps for learning is reference too, because the inheritance "
            "packet is explicit that it must not be deleted merely for being "
            "empty.",
            "Nothing is removed on the strength of this register. It says what "
            "is what; the removal is a separate, deliberate act.",
        ],
        "totals": {
            "entries": len(entries),
            "by_state": dict(states),
            "obsolete_repositories": len(by_reason["obsolete"]),
            "obsolete_generated": len([e for e in by_reason["obsolete"]
                                       if e["kind"] == "generated"]),
            "reference_repositories": len(by_reason["reference"]),
        },
        "entries": entries,
    }

    def scalar(v):
        if v is None:
            return "null"
        if isinstance(v, bool):
            return "true" if v else "false"
        if isinstance(v, (int, float)):
            return str(v)
        s = str(v)
        if s == "":
            return '""'
        if re.search(r"[:#\[\]{}&*!|>'\"%@`,\n]|^[\s-]|[\s]$", s) or \
                s.lower() in {"true", "false", "null", "yes", "no", "on", "off"}:
            return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'
        return s

    def emit(obj, indent):
        out = []
        pad = "  " * indent
        if isinstance(obj, dict):
            for k, v in obj.items():
                if isinstance(v, (dict, list)) and v:
                    out.append(f"{pad}{k}:")
                    out.extend(emit(v, indent + 1))
                elif isinstance(v, (dict, list)):
                    out.append(f"{pad}{k}: {'{}' if isinstance(v, dict) else '[]'}")
                else:
                    out.append(f"{pad}{k}: {scalar(v)}")
        elif isinstance(obj, list):
            for item in obj:
                if isinstance(item, dict):
                    first = True
                    for k, v in item.items():
                        prefix = f"{pad}- " if first else f"{pad}  "
                        first = False
                        if isinstance(v, (dict, list)) and v:
                            out.append(f"{prefix}{k}:")
                            out.extend(emit(v, indent + 2))
                        elif isinstance(v, (dict, list)):
                            out.append(f"{prefix}{k}: {'{}' if isinstance(v, dict) else '[]'}")
                        else:
                            out.append(f"{prefix}{k}: {scalar(v)}")
                else:
                    out.append(f"{pad}- {scalar(item)}")
        return out

    Path(args.out).write_text("\n".join(emit(document, 0)) + "\n", encoding="utf-8")
    print(f"  {len(entries)} entries: {dict(states)}")
    print(f"  wrote {args.out}")

    lines = ["# The obsolescence register", "",
             "What the endgame needs before it can be carried out: a record of "
             "what is obsolete and what is reference, because the two are easy to "
             "confuse and the difference is costly.", "",
             "| State | Entries |", "|---|---|"]
    for state, n in states.most_common():
        lines.append(f"| {state} | {n} |")
    lines += ["", "## The obsolete repositories", "",
              "Absorbed by a working project, or archived and not working. Their "
              "material is kept as reference; their repositories are archived, not "
              "deleted.", "", "| Repository | Why |", "|---|---|"]
    for e in by_reason["obsolete"]:
        if e["kind"] == "repository":
            lines.append(f"| {e['name']} | {e['reason']} |")
    lines += ["", "## The generated output", "",
              "Rebuilt by the build, and never source.", "",
              "| Path | Size |", "|---|---|"]
    for e in sorted(by_reason["obsolete"], key=lambda x: -(x.get("bytes") or 0)):
        if e["kind"] == "generated":
            lines.append(f"| `{e['name']}` | {(e.get('bytes') or 0)/1024/1024:.1f} MB |")
    lines += ["", "## The unreviewed", "",
              "The owner's own repositories that are not yet placed in the "
              "programme. They are not assumed to be live.", "",
              "| Repository | Size | Last push |", "|---|---|---|"]
    for e in by_reason.get("unreviewed", []):
        lines.append(f"| {e['name']} | {(e.get('size_kb') or 0)//1024} MB | "
                     f"{(e.get('pushed_at') or '')[:10]} |")
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"  wrote {REPORT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
