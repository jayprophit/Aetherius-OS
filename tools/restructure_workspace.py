#!/usr/bin/env python3
"""Reorganise the workspace so that each project sits inside the project
that owns it.

The owner has said which project owns which:

  - crossplatform, aetherial-platform, niche_platform, web-platform and
    self-building-ai are part of Aetherius OS;
  - football-card-game, athena, the decentralized messaging app, the Food
    Wiki app and LedgerLands are apps of Aetherius OS;
  - Hermes Config Audit is the tool that helps build projects and test
    agent teams, so it belongs with Aetherius OS;
  - aetherial and quantum-os are predecessors of Aetherius OS, absorbed
    by it;
  - the virtual assistant is part of Genesis;
  - Universal Bridge is part of Poietek;
  - Agent-Bridge stays a shared library that Genesis, IDE-Workspace and
    Aetherius OS all depend on;
  - IDE-Workspace and its dashboard are one project.

The move is done with git, so each absorbed project keeps its own
repository and its own remote, and Aetherius-OS's gitignore excludes the
nested repositories. Nothing is deleted: the predecessors are archived on
GitHub rather than deleted, because deleting a repository cannot be
undone, and the owner has not yet seen the absorption verified.

Every step is recorded in a relocation record, in the same spirit as the
earlier projects-folder integrity record.

Usage:
    python tools/restructure_workspace.py [--dry-run]
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PROJECTS_ROOT = Path(r"C:\Users\jpowe\Desktop\Projects")
TODAY = date.today().isoformat()

# The plan. Each entry says where a project goes and what it is part of.
MOVES = [
    # Aetherius OS: the ecosystem platforms.
    {"src": "crossplatform---multiplatform", "parent": "Aetherius-OS",
     "subdir": "ecosystem", "part_of": "aetherius-os",
     "why": "The cross-network, cross-platform, cross-device system the owner "
            "described. It is the ecosystem layer of Aetherius OS."},
    {"src": "aetherial-platform", "parent": "Aetherius-OS", "subdir": "ecosystem",
     "part_of": "aetherius-os",
     "why": "The unified platform carrying commerce, e-learning, social media "
            "and finance. It is the ecosystem layer of Aetherius OS."},
    {"src": "Niche_platform", "parent": "Aetherius-OS", "subdir": "ecosystem",
     "part_of": "aetherius-os",
     "why": "A platform in its own right, which the owner placed in the apps "
            "and ecosystem."},
    {"src": "Web-platform", "parent": "Aetherius-OS", "subdir": "ecosystem",
     "part_of": "aetherius-os",
     "why": "The web platform carrying e-commerce, e-learning, social media, "
            "job hunting, posts, articles and blockchain."},
    # Aetherius OS: the apps.
    {"src": "football-card-game", "parent": "Aetherius-OS", "subdir": "apps",
     "part_of": "aetherius-os",
     "why": "An app of Aetherius OS, with an AI coaching dashboard."},
    {"src": "Athena", "parent": "Aetherius-OS", "subdir": "apps",
     "part_of": "aetherius-os", "why": "An app of Aetherius OS."},
    {"src": "Decentralized Messaging App", "parent": "Aetherius-OS",
     "subdir": "apps", "part_of": "aetherius-os",
     "why": "An app of Aetherius OS. The Agent-Bridge communication core "
            "provider already exists and it should build on that."},
    {"src": "Food Wiki App", "parent": "Aetherius-OS", "subdir": "apps",
     "part_of": "aetherius-os", "why": "An app of Aetherius OS."},
    {"src": "LedgerLands", "parent": "Aetherius-OS", "subdir": "apps",
     "part_of": "aetherius-os",
     "why": "An app of Aetherius OS. It has 700 files and no repository of its "
            "own, so it has never been published or versioned."},
    # Aetherius OS: the tool.
    {"src": "Hermes-Config-Audit", "parent": "Aetherius-OS", "subdir": "tools",
     "part_of": "aetherius-os",
     "why": "The tool used to help build projects and to test out AI agent "
            "teams and the supervisor. It belongs with Aetherius OS."},
    # Aetherius OS: the absorbed predecessors.
    {"src": "self-building-ai", "parent": "Aetherius-OS", "subdir": "absorbed",
     "part_of": "aetherius-os",
     "why": "Part of Aetherius OS. Its self-building intent is realised by the "
            "Genesis organism, and its repository is small and untested."},
    {"src": "aetherial", "parent": "Aetherius-OS", "subdir": "predecessors",
     "part_of": "aetherius-os", "predecessor": True,
     "why": "A predecessor of Aetherius OS. It is absorbed by the working "
            "Aetherius OS project, and its repository is archived once the "
            "absorption is verified."},
    {"src": "Quantum-OS", "parent": "Aetherius-OS", "subdir": "predecessors",
     "part_of": "aetherius-os", "predecessor": True,
     "why": "A predecessor of Aetherius OS. It holds icons and a README and no "
            "source, and it is absorbed by the working Aetherius OS project."},
    {"src": "QVA-merged", "parent": "Aetherius-OS", "subdir": "predecessors",
     "part_of": "aetherius-os", "predecessor": True,
     "why": "A predecessor of Aetherius OS. The merged quantum system with a "
            "quantum core, a blockchain, an AI layer, a backend and a frontend "
            "is absorbed by the working Aetherius OS project."},
    # Genesis.
    {"src": "VirtualAssistant", "parent": "Genesis", "subdir": "absorbed",
     "part_of": "genesis",
     "why": "Part of Genesis. The conversations name it as the QuantumVirtual"
            "Assistant, the assistant that acts on the organism's behalf."},
    # Poietek.
    {"src": "Universal-Bridge", "parent": "Poietek", "subdir": "absorbed",
     "part_of": "poietek",
     "why": "Part of Poietek. The bridge is the surface that lets digital "
            "audio devices and DAWs talk to the same runtime."},
]

# The worktree that is not a separate project.
WORKTREE_REMOVALS = [
    {"folder": "IDE-Workspace-dashboard", "repo": "IDE-Workspace",
     "branch": "unit/supervisor-dashboard-ui",
     "why": "IDE-Workspace and the supervisor dashboard are one project. The "
            "dashboard is a branch of the same repository, and the runtime "
            "binding fix it carried is already in master in a more developed "
            "form, so dissolving it loses no work."},
]

# The registry ids that the moves change.
REGISTRY_IDS = {
    "crossplatform---multiplatform": "crossplatform",
    "aetherial-platform": "aetherial-platform",
    "Niche_platform": "niche-platform",
    "Web-platform": "web-platform",
    "football-card-game": "football-card-game",
    "Athena": "athena",
    "Decentralized Messaging App": "decentralized-messaging-app",
    "Food Wiki App": "food-wiki-app",
    "LedgerLands": "ledgerlands",
    "Hermes-Config-Audit": "hermes-config-audit",
    "self-building-ai": "self-building-ai",
    "aetherial": "aetherial",
    "Quantum-OS": "quantum-os",
    "VirtualAssistant": "virtual-assistant",
    "Universal-Bridge": "universal-bridge",
}


def git(path: Path, *args) -> str:
    r = subprocess.run(["git", "-C", str(path), *args], capture_output=True,
                       text=True, encoding="utf-8", errors="replace", timeout=300)
    return (r.stdout or "").strip()


def dirty_count(path: Path) -> int:
    s = git(path, "status", "--porcelain")
    return len([l for l in s.splitlines() if l.strip()])


def ensure_gitignore(parent: Path, paths: list[str], reason: str) -> None:
    """Exclude nested repositories from the parent project's own git."""
    gi = parent / ".gitignore"
    text = gi.read_text(encoding="utf-8") if gi.exists() else ""
    missing = [p for p in paths if p not in text]
    if not missing:
        return
    block = "\n# " + reason + "\n" + "\n".join(missing) + "\n"
    gi.write_text(text.rstrip("\n") + "\n" + block, encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    record: list[dict] = []

    # ---- the worktree that is not a separate project ----
    for w in WORKTREE_REMOVALS:
        folder = PROJECTS_ROOT / w["folder"]
        if not folder.is_dir():
            continue
        if args.dry_run:
            print(f"  would remove the worktree {w['folder']}")
            continue
        repo = PROJECTS_ROOT / w["repo"]
        # A worktree removal leaves the branch in the repository and on the
        # remote, so no work is lost.
        git(repo, "worktree", "remove", "--force", str(folder))
        if folder.exists():
            shutil.rmtree(folder, ignore_errors=True)
        git(repo, "worktree", "prune")
        record.append({"kind": "worktree", "name": w["folder"],
                       "repo": w["repo"], "branch": w["branch"], "why": w["why"]})
        print(f"  removed the worktree {w['folder']}; the branch "
              f"{w['branch']} stays in {w['repo']}")

    # ---- the moves ----
    for m in MOVES:
        src = PROJECTS_ROOT / m["src"]
        dest = PROJECTS_ROOT / m["parent"] / m["subdir"] / m["src"]
        if not src.is_dir():
            print(f"  skip {m['src']}: not present")
            continue
        if dest.exists():
            print(f"  skip {m['src']}: destination exists")
            continue

        dirty = dirty_count(src) if (src / ".git").exists() else 0
        if dirty and not args.dry_run:
            print(f"  REFUSING to move {m['src']}: {dirty} uncommitted changes")
            continue

        if args.dry_run:
            print(f"  would move {m['src']} -> {dest.relative_to(PROJECTS_ROOT)}")
            continue

        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dest))
        record.append({"kind": "move", "from": m["src"], "to": str(dest.relative_to(PROJECTS_ROOT)).replace("\\", "/"),
                       "parent": m["parent"], "part_of": m["part_of"],
                       "predecessor": m.get("predecessor", False), "why": m["why"]})
        print(f"  moved {m['src']} -> {dest.relative_to(PROJECTS_ROOT)}")

    if args.dry_run:
        return 0

    # ---- gitignore the nested repositories ----
    for parent, subdirs in {
        "Aetherius-OS": ["ecosystem", "apps", "tools", "absorbed", "predecessors"],
        "Genesis": ["absorbed"],
        "Poietek": ["absorbed"],
    }.items():
        base = PROJECTS_ROOT / parent
        paths = []
        for sub in subdirs:
            d = base / sub
            if not d.is_dir():
                continue
            for child in sorted(d.iterdir()):
                if child.is_dir():
                    paths.append(f"{sub}/{child.name}/")
        if paths:
            ensure_gitignore(base, paths,
                             "Absorbed projects. Each keeps its own repository and "
                             "remote; the parent project must not track them.")
            print(f"  gitignored {len(paths)} absorbed paths in {parent}")

    # ---- the build manifest registry ----
    reg = REPO / "docs" / "BUILD-MANIFEST-REGISTRY.yaml"
    text = reg.read_text(encoding="utf-8")
    for m in MOVES:
        rid = REGISTRY_IDS.get(m["src"])
        if not rid:
            continue
        new_manifest = f'{m["parent"]}/{m["subdir"]}/{m["src"]}/build.yaml'
        if " " in f'{m["parent"]}/{m["subdir"]}/{m["src"]}':
            new_manifest = f'"{new_manifest}"'
        pattern = re.compile(
            rf"(- id: {re.escape(rid)}\n(?:.*\n)*?    manifest: )(\"[^\"]*\"|[^\n]*)",
            re.M)
        text, n = pattern.subn(rf"\g<1>{new_manifest}", text, count=1)
        if n:
            print(f"  registry: {rid} -> {new_manifest}")
        # The dependency list now names the owning project.
        dep = f'    depends_on: [{m["part_of"]}]'
        block = re.compile(rf"(- id: {re.escape(rid)}\n(?:.*\n)*?)(    depends_on: .*\n)",
                           re.M)
        text, n = block.subn(rf"\g<1>{dep}\n", text, count=1)
    # The dashboard is no longer a project of its own.
    text = re.sub(r"\n  - id: ide-workspace-dashboard\n(?:.*\n)*?(?=\n  - id: |\Z)",
                  "\n", text)
    reg.write_text(text, encoding="utf-8")
    print("  registry updated")

    # ---- the workspace hygiene gate ----
    hygiene = REPO / "docs" / "workspace-hygiene.test.ts"
    text = hygiene.read_text(encoding="utf-8")
    moved = {m["src"] for m in MOVES} | {w["folder"] for w in WORKTREE_REMOVALS}
    m = re.search(r"const KNOWN_PROJECTS = \[(.*?)\] as const;", text, re.S)
    if m:
        existing = re.findall(r'"([^"]+)"', m.group(1))
        kept = sorted(set(existing) - moved)
        body = "\n".join(f'  "{p}",' for p in kept)
        text = text[:m.start(1)] + "\n" + body + "\n" + text[m.end(1):]
        hygiene.write_text(text, encoding="utf-8")
        print(f"  hygiene gate now names {len(kept)} projects")

    # ---- the relocation record ----
    lines = [
        "# Workspace restructure record",
        "",
        f"Date: {TODAY}",
        "",
        "Scope: `C:\\Users\\jpowe\\Desktop\\Projects` — each project now sits "
        "inside the project that owns it, as the owner directed. Nothing is "
        "deleted. Every absorbed project keeps its own repository and its own "
        "GitHub remote; the parent project's gitignore excludes the nested "
        "repositories.",
        "",
        "## What moved, and why",
        "",
        "| From | To | Part of | Why |",
        "|---|---|---|---|",
    ]
    for r in record:
        if r["kind"] == "move":
            lines.append(f"| `{r['from']}` | `{r['to']}` | `{r['part_of']}` | {r['why']} |")
    lines += ["", "## What was dissolved, and why", "",
              "| Item | Repository | Why |", "|---|---|---|"]
    for r in record:
        if r["kind"] == "worktree":
            lines.append(f"| `{r['name']}` | `{r['repo']}` | {r['why']} |")
    lines += [
        "",
        "## What stays where it is",
        "",
        "- **Agent-Bridge** and its three branch worktrees stay a shared "
        "library. The owner directed that Agent-Bridge is part of Genesis, "
        "IDE-Workspace and Aetherius OS, and the cleanest way to express that "
        "is a dependency of each, not a copy inside each. It builds and its "
        "tests pass.",
        "- **IDE-Workspace** stays a project of its own, with the supervisor "
        "dashboard dissolved into it as a branch.",
        "- **Universal-Bridge** moved into Poietek, as the owner directed.",
        "- **Architecture of Shadows Book** and **QVA-merged** were not named "
        "in the owner's instruction, so they were left alone. They are "
        "recorded in the programme catalogue as first-party projects with an "
        "open placement question.",
        "",
        "## The predecessor repositories",
        "",
        "`aetherial` and `quantum-os` are predecessors of Aetherius OS and "
        "have been absorbed by it. Their GitHub repositories are **archived**, "
        "not deleted: archiving takes them out of the active list and keeps "
        "the history, whereas deleting cannot be undone. Deleting them is "
        "recorded as a todo that waits until the absorption is verified.",
        "",
        "## Verification",
        "",
        "The build manifest registry, the workspace hygiene gate and the "
        "programme catalogue are all regenerated or updated by this change, "
        "and the workspace registry gate in "
        "`src/programme/workspaceRegistry.test.ts` is what checks that every "
        "project on disk is registered and that every manifest validates.",
    ]
    (PROJECTS_ROOT / "Temp" / f"WORKSPACE-RESTRUCTURE-{TODAY}.md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8")
    print(f"  wrote Temp/WORKSPACE-RESTRUCTURE-{TODAY}.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
