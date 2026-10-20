#!/usr/bin/env python3
"""Promote the reconciliation projects into the workspace as real projects.

Ten of the owner's own repositories sat in Temp/Repository-Reconciliation,
where an earlier desktop-duplicate reconciliation had set them aside.
They are clean clones of the owner's GitHub repositories, on main, with
no uncommitted work, and they are not registered anywhere: no build
manifest, no registry entry, no todo.

A project that is not registered is a project nobody builds. This tool
gives each one a home and a manifest, registers it, and records the
work it still needs.

The manifest states what was measured. A project with no tests is
recorded as having no tests, because a manifest that flatters a project
is worse than no manifest.

Usage:
    python tools/promote_reconciliation_projects.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PROJECTS_ROOT = Path(r"C:\Users\jpowe\Desktop\Projects")
RECON = PROJECTS_ROOT / "Temp" / "Repository-Reconciliation"

# How each project is described and what it is for.
PROJECTS: dict[str, dict] = {
    "Aetherial": {
        "kind": "application",
        "domain": "aetherial",
        "description": "Multi-facet platform and application, described in the "
                       "repository as a Manus-style build. The largest first-party "
                       "codebase the owner holds, and the one with no tests at all.",
        "family": "platform",
    },
    "aetherial-platform": {
        "kind": "application",
        "domain": "aetherial-platform",
        "description": "The unified platform: commerce, e-learning, social media "
                       "and finance in one system, with contracts, a database "
                       "schema, a mobile app, a desktop app and container "
                       "deployment.",
        "family": "commerce,elearning,social_media,finance",
    },
    "Web-platform": {
        "kind": "application",
        "domain": "web-platform",
        "description": "The web platform the owner named first among the "
                       "families: e-commerce, e-learning, social media, job "
                       "hunting, posts, articles and blockchain.",
        "family": "commerce,elearning,social_media,blockchain",
    },
    "Niche_platform": {
        "kind": "application",
        "domain": "niche-platform",
        "description": "Next.js platform with its own database, documentation "
                       "and test suite.",
        "family": "platform",
    },
    "football-card-game": {
        "kind": "application",
        "domain": "football-card-game",
        "description": "Football card game in the style of chess, with an "
                       "AI coaching dashboard and a database schema.",
        "family": "apps",
    },
    "self-building-ai": {
        "kind": "application",
        "domain": "self-building-ai",
        "description": "Self-building AI project for autonomous development.",
        "family": "intelligence",
    },
    "QVA-merged": {
        "kind": "application",
        "domain": "qva-merged",
        "description": "Merged quantum computing system: quantum core, "
                       "blockchain, AI, backend and frontend.",
        "family": "intelligence,blockchain",
    },
    "Quantum-OS": {
        "kind": "application",
        "domain": "quantum-os",
        "description": "Quantum operating system. The repository holds icons "
                       "and a README; there is no source.",
        "family": "platform",
    },
    "Crossplatform---multiplatform": {
        "kind": "tool",
        "domain": "crossplatform",
        "description": "Cross-platform and multi-platform work. The repository "
                       "holds a README and a licence only.",
        "family": "tools",
    },
    "VirtualAssistant": {
        "kind": "application",
        "domain": "virtual-assistant",
        "description": "Virtual assistant. The repository holds a README and a "
                       "licence only.",
        "family": "intelligence",
    },
}


def git(path: Path, *args) -> str:
    r = subprocess.run(["git", "-C", str(path), *args], capture_output=True,
                       text=True, encoding="utf-8", errors="replace", timeout=180)
    return (r.stdout or "").strip()


def detect_build_system(root: Path) -> tuple[str, str, list[dict]]:
    """The build system, the package manager, and the tool requirements."""
    requirements: list[dict] = []
    build_system = "unknown"
    package_manager = "unknown"

    if (root / "package.json").exists():
        build_system = "node/npm"
        package_manager = "npm"
        requirements.append({"name": "node", "version": ">=20", "required": True,
                             "purpose": "the runtime that executes the package"})
        if (root / "package-lock.json").exists():
            requirements.append({"name": "npm ci", "version": ">=10",
                                 "required": True,
                                 "purpose": "reproducible install from the lock file"})
        pkg = json.loads((root / "package.json").read_text(encoding="utf-8",
                                                           errors="replace")
                         or "{}")
        scripts = pkg.get("scripts") or {}
        if "test" in scripts:
            requirements.append({"name": "the project's own test script",
                                 "version": scripts["test"][:80], "required": False,
                                 "purpose": "the repository's declared test command"})
    if (root / "requirements.txt").exists() or (root / "pyproject.toml").exists():
        if build_system == "unknown":
            build_system = "python/pytest"
            package_manager = "pip"
        requirements.append({"name": "python", "version": ">=3.10", "required": True,
                             "purpose": "the runtime that executes the package"})
        if (root / "requirements.txt").exists():
            requirements.append({"name": "pip", "version": ">=24", "required": True,
                                 "purpose": "installing the declared requirements"})
    if (root / "CMakeLists.txt").exists():
        build_system = "cmake"
        package_manager = "cmake"
        requirements.append({"name": "cmake", "version": ">=3.20", "required": True,
                             "purpose": "configuring the build tree"})
        requirements.append({"name": "a C++ toolchain", "version": ">=C++17",
                             "required": True, "purpose": "compiling the sources"})
    if (root / "Cargo.toml").exists():
        build_system = "cargo"
        package_manager = "cargo"
        requirements.append({"name": "cargo", "version": ">=1.70", "required": True,
                             "purpose": "building the crate"})
    if (root / "go.mod").exists():
        build_system = "go"
        package_manager = "go"
        requirements.append({"name": "go", "version": ">=1.21", "required": True,
                             "purpose": "building the module"})
    if not requirements:
        requirements.append({"name": "a toolchain", "version": "undetermined",
                             "required": True,
                             "purpose": "the repository declares no build system yet"})
    return build_system, package_manager, requirements


def detect_commands(root: Path) -> list[dict]:
    commands: list[dict] = []
    pkg_path = root / "package.json"
    if pkg_path.exists():
        try:
            scripts = json.loads(pkg_path.read_text(encoding="utf-8",
                                                    errors="replace") or "{}").get("scripts") or {}
        except json.JSONDecodeError:
            scripts = {}
        for name in ("build", "test", "lint", "typecheck"):
            if name in scripts:
                commands.append({
                    "name": name,
                    "command": f"npm run {name}",
                    "working_directory": ".",
                    "timeout_minutes": 20 if name != "test" else 30,
                })
    if (root / "tests").is_dir() or (root / "test").is_dir():
        commands.append({"name": "test", "command": "python -m pytest tests -q",
                         "working_directory": ".", "timeout_minutes": 20})
    if (root / "CMakeLists.txt").exists():
        commands.append({"name": "configure", "command": "cmake -S . -B build",
                         "working_directory": ".", "timeout_minutes": 10})
        commands.append({"name": "build", "command": "cmake --build build",
                         "working_directory": ".", "timeout_minutes": 30})
        commands.append({"name": "test", "command": "ctest --test-dir build --output-on-failure",
                         "working_directory": ".", "timeout_minutes": 20})
    if (root / "Cargo.toml").exists():
        commands.append({"name": "build", "command": "cargo build --release",
                         "working_directory": ".", "timeout_minutes": 30})
        commands.append({"name": "test", "command": "cargo test",
                         "working_directory": ".", "timeout_minutes": 30})
    if not commands:
        commands.append({
            "name": "inspect",
            "command": "echo 'no build system is declared by this repository'",
            "working_directory": ".",
            "timeout_minutes": 1,
        })
    return commands


def yaml_quote(s: str) -> str:
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def build_manifest(name: str, meta: dict, root: Path, assessment: dict | None) -> str:
    build_system, package_manager, requirements = detect_build_system(root)
    commands = detect_commands(root)
    branch = git(root, "rev-parse", "--abbrev-ref", "HEAD") or "main"
    remote = git(root, "remote", "get-url", "origin")
    head = git(root, "log", "-1", "--format=%H")
    head_date = git(root, "log", "-1", "--format=%ad", "--date=short")
    languages = sorted({p.suffix.lower().lstrip(".") for p in root.rglob("*")
                        if p.is_file() and p.suffix.lower() in
                        {".py", ".js", ".ts", ".tsx", ".jsx", ".c", ".h", ".cpp",
                         ".hpp", ".cs", ".java", ".rs", ".go", ".rb", ".php", ".swift",
                         ".kt", ".sh", ".sql", ".lua"}})

    own_lines = (assessment or {}).get("own_lines", 0)
    test_files = (assessment or {}).get("test_files", 0)

    if own_lines == 0:
        state = "NOT_STARTED"
        summary = ("The repository holds no source of its own. It is registered so "
                   "that it is visible and owned, and so that the work to build it "
                   "is tracked rather than forgotten.")
    elif test_files == 0:
        state = "PARTIAL"
        summary = (f"The project holds {own_lines} lines of its own source and no "
                   f"tests. Nothing about it has been demonstrated to work.")
    else:
        state = "PARTIAL"
        summary = (f"The project holds {own_lines} lines of its own source across "
                   f"{len(languages)} language(s) and {test_files} test file(s). "
                   f"The build has not been run as part of the workspace gate, so "
                   f"the recorded state is partial rather than verified.")

    evidence = [
        f"git remote get-url origin -> {remote}",
        f"git rev-parse --abbrev-ref HEAD -> {branch}",
        f"git log -1 --format=%H -> {head}",
        f"git log -1 --format=%ad --date=short -> {head_date}",
        f"Measured own source lines: {own_lines}. Measured test files: {test_files}.",
    ]

    known_issues = []
    if own_lines == 0:
        known_issues.append({
            "id": f"{meta['domain'].upper()}-SRC-001",
            "severity": "high",
            "summary": "The repository holds no source of its own.",
            "evidence": "Measured own source lines: 0.",
            "status": "OPEN",
        })
    if test_files == 0 and own_lines > 1000:
        known_issues.append({
            "id": f"{meta['domain'].upper()}-TST-001",
            "severity": "high",
            "summary": "There is no test suite, so the build gate proves nothing.",
            "evidence": f"Measured own source lines: {own_lines}, test files: 0.",
            "status": "OPEN",
        })
    if not (root / "LICENSE").exists() and not (root / "LICENCE").exists():
        known_issues.append({
            "id": f"{meta['domain'].upper()}-LIC-001",
            "severity": "medium",
            "summary": "No licence file. The owner chooses which licence applies.",
            "evidence": "No LICENSE or LICENCE file at the repository root.",
            "status": "OPEN",
        })

    out: list[str] = []
    out.append("# " + "=" * 76)
    out.append(f"# BUILD MANIFEST - {name}")
    out.append("# " + "=" * 76)
    out.append("# Authoritative record of how this project is built, tested and")
    out.append("# verified, and of what is still broken. Read by Aetherius-OS's")
    out.append("# build manifest registry and validated by")
    out.append("# src/programme/buildManifest.ts.")
    out.append("#")
    out.append("# Promoted from Temp/Repository-Reconciliation on "
               f"{date.today().isoformat()}, where an earlier desktop-duplicate")
    out.append("# reconciliation had set it aside. The manifest records what was")
    out.append("# measured at the time of promotion, not what the repository's own")
    out.append("# documentation claims.")
    out.append("# " + "=" * 76)
    out.append('schema_version: "1.0.0"')
    out.append("")
    out.append("project:")
    out.append(f"  id: {meta['domain']}")
    out.append(f"  name: {name}")
    out.append(f"  kind: {meta['kind']}")
    out.append(f"  domain: {meta['domain']}")
    out.append("  description: >-")
    for line in meta["description"].split(". "):
        out.append("    " + line.strip().rstrip(".") + ".")
    out.append("  repository: true")
    out.append(f"  branch: {branch}")
    out.append(f"  languages: [{', '.join(languages)}]" if languages
               else "  languages: []")
    out.append("")
    out.append("toolchain:")
    out.append(f"  build_system: {build_system}")
    out.append(f"  package_manager: {package_manager}")
    out.append("  requirements:")
    for r in requirements:
        out.append(f"    - name: {yaml_quote(r['name'])}")
        out.append(f"      version: {yaml_quote(r['version'])}")
        out.append(f"      required: {'true' if r['required'] else 'false'}")
        out.append(f"      purpose: {yaml_quote(r['purpose'])}")
    out.append("")
    out.append("commands:")
    for c in commands:
        out.append(f"  - name: {c['name']}")
        out.append(f"    command: {yaml_quote(c['command'])}")
        out.append("    working_directory: .")
        out.append(f"    timeout_minutes: {c['timeout_minutes']}")
    out.append("")
    out.append("dependencies:")
    out.append("  projects: []")
    out.append("  external: []")
    out.append("")
    out.append("status:")
    out.append(f"  state: {state}")
    out.append(f'  last_verified: "{date.today().isoformat()}"')
    out.append("  summary: >-")
    for chunk in _wrap(summary, 74):
        out.append("    " + chunk)
    out.append("  evidence:")
    for e in evidence:
        out.append(f"    - {yaml_quote(e)}")
    out.append("")
    if known_issues:
        out.append("known_issues:")
        for k in known_issues:
            out.append(f"  - id: {k['id']}")
            out.append(f"    severity: {k['severity']}")
            out.append("    summary: >-")
            for chunk in _wrap(k["summary"], 74):
                out.append("      " + chunk)
            out.append("    evidence: >-")
            for chunk in _wrap(k["evidence"], 74):
                out.append("      " + chunk)
            out.append(f"    status: {k['status']}")
        out.append("")
    out.append("notes:")
    out.append("  - >-")
    out.append(f"    Promoted into the workspace on {date.today().isoformat()} from")
    out.append("    Temp/Repository-Reconciliation, where a desktop-duplicate")
    out.append("    reconciliation had set it aside. The repository was a clean")
    out.append("    clone of the owner's GitHub remote on the branch named above,")
    out.append("    with no uncommitted work at the time of promotion.")
    out.append("  - >-")
    out.append("    The state recorded here is what was measured at promotion. It")
    out.append("    is a starting point, and the gate that will move it forward is")
    out.append("    the build command recorded in the commands section above.")
    return "\n".join(out) + "\n"


def _wrap(text: str, width: int) -> list[str]:
    words = text.split()
    lines, cur = [], ""
    for w in words:
        if len(cur) + len(w) + 1 > width:
            lines.append(cur)
            cur = w
        else:
            cur = (cur + " " + w).strip()
    if cur:
        lines.append(cur)
    return lines or [""]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    assessment = {}
    ap_path = REPO / "research" / "projects" / "assessment.json"
    if ap_path.exists():
        for r in json.loads(ap_path.read_text(encoding="utf-8")):
            assessment[r["name"]] = r

    if not RECON.is_dir():
        print(f"nothing to promote: {RECON} does not exist")
        return 0

    promoted = []
    for name, meta in PROJECTS.items():
        src = RECON / name
        if not src.is_dir():
            print(f"  skip {name}: not present in the reconciliation folder")
            continue
        dest = PROJECTS_ROOT / name
        if dest.exists():
            print(f"  skip {name}: already in the workspace")
            continue
        if args.dry_run:
            print(f"  would promote {name} -> {dest}")
            promoted.append(name)
            continue

        shutil.move(str(src), str(dest))
        manifest = build_manifest(name, meta, dest, assessment.get(name))
        (dest / "build.yaml").write_text(manifest, encoding="utf-8")
        promoted.append(name)
        print(f"  promoted {name} -> {dest} with build.yaml")

    if args.dry_run:
        return 0

    # The hygiene gate names every project, so it must name the new ones.
    hygiene = REPO / "docs" / "workspace-hygiene.test.ts"
    if hygiene.exists():
        text = hygiene.read_text(encoding="utf-8")
        m = re.search(r"const KNOWN_PROJECTS = \[(.*?)\] as const;", text, re.S)
        if m:
            existing = re.findall(r'"([^"]+)"', m.group(1))
            merged = sorted(set(existing) | set(promoted))
            body = "\n".join(f'  "{p}",' for p in merged)
            text = text[:m.start(1)] + "\n" + body + "\n" + text[m.end(1):]
            hygiene.write_text(text, encoding="utf-8")
            print(f"  named {len(merged)} projects in the hygiene gate")

    print(f"\npromoted {len(promoted)}: {', '.join(promoted)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
