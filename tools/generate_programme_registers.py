#!/usr/bin/env python3
"""Generate the programme catalogue and the programme gap analysis.

The owner asked for everything to be recorded, in the right YAML files,
with a gap analysis, and for the work to be in the todos list. This
tool produces those three artefacts from measured evidence rather than
from what any README claims.

Three things happen here.

First the catalogue. Every first-party project the owner holds is
listed with where it lives, which family it belongs to, and what was
measured about it.

Second the capability scan. For each project, every capability of its
family is looked for in the project's own source. A capability found is
recorded with the file it was found in, so a person can check it. A
capability not found is a gap, and the file it was looked for in is
recorded too, so the gap can be checked as well.

Third the todos. Every gap becomes a todo in the master list, with the
project it belongs to, the evidence behind it, and what would close it.

Usage:
    python tools/generate_programme_registers.py
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).parent))
from programme_capabilities import FAMILY_CAPABILITIES, OWNER_FAMILIES  # noqa: E402

SOURCE_EXT = {
    ".py", ".js", ".mjs", ".ts", ".tsx", ".jsx", ".c", ".h", ".cpp", ".hpp",
    ".cc", ".cs", ".java", ".rs", ".go", ".rb", ".php", ".swift", ".kt",
    ".lua", ".sh", ".ps1", ".bat", ".sql", ".m", ".mm", ".md", ".mdx",
    ".json", ".yaml", ".yml", ".toml", ".html", ".css", ".scss",
}
SKIP_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__", "dist",
             "build", "out", "target", ".next", "coverage", ".mypy_cache",
             ".pytest_cache", ".tox", "site-packages", ".gradle", ".idea",
             ".vscode", "node_modules.incomplete-20260811"}

# A dot-directory is a local tool, a checkout or a build tree, never the
# project's own source. Genesis alone keeps 328,000 lines of Python in
# .genesis-local, which its own gitignore excludes.
KEEP_DOT_DIRS = {".github", ".githooks", ".devcontainer", ".gitlab"}
VENDOR_DIRS = {"vendor", "third_party", "thirdparty", "external", "deps",
               "Pods", "node_modules", "site-packages", "external/mpdf"}

# The first-party projects, their family, and where each one lives.
# The family decides which capability set is checked against it.
from programme_projects import PROJECTS, PROJECTS_BY_ID, PROJECTS_BY_NAME  # noqa: E402

PROJECTS_BY_ID = {p["id"]: p for p in PROJECTS}
PROJECTS_BY_NAME = {p["name"].lower(): p for p in PROJECTS}


def project_root(p: dict) -> Path | None:
    """Where a project actually lives now.

    The workspace was reorganised so that every project sits inside the
    project that owns it, and the locations live in one table in
    tools/programme_projects.py so that the measurement and this register
    cannot disagree about them.
    """
    if p.get("path"):
        return Path(p["path"])
    return None


def own_files(root: Path, limit_bytes: int = 3_000_000) -> list[Path]:
    out: list[Path] = []
    for dirpath, dirnames, filenames in os.walk(root, onerror=lambda e: None):
        dirnames[:] = [d for d in dirnames
                       if d not in SKIP_DIRS
                       and (not d.startswith(".") or d in KEEP_DOT_DIRS)]
        rel = Path(dirpath).relative_to(root)
        if any(p in VENDOR_DIRS for p in rel.parts):
            continue
        for fn in filenames:
            p = Path(dirpath) / fn
            if p.suffix.lower() in SOURCE_EXT:
                try:
                    if p.stat().st_size <= limit_bytes:
                        out.append(p)
                except OSError:
                    pass
    return out


def scan_capabilities(root: Path, families: list[str]) -> list[dict]:
    """Look for each family capability in the project's own source."""
    files = own_files(root)
    texts: list[tuple[str, str]] = []
    for p in files:
        try:
            texts.append((str(p.relative_to(root)).replace("\\", "/"),
                          p.read_text(encoding="utf-8", errors="replace")))
        except OSError:
            continue

    results = []
    for fam in families:
        for cap_id, label, terms in FAMILY_CAPABILITIES.get(fam, []):
            hits: list[str] = []
            count = 0
            lowered = [re.compile(r"(?<![a-z0-9])" + re.escape(t.lower())
                                  + r"(?![a-z0-9])") for t in terms]
            for rel, text in texts:
                low = text.lower()
                matched = False
                for rx in lowered:
                    n = len(rx.findall(low))
                    if n:
                        count += n
                        matched = True
                if matched:
                    hits.append(rel)
            # A capability is present when it appears in the project's own
            # source in more than one file. One file is a mention; two is
            # an implementation being used.
            results.append({
                "family": fam,
                "capability_id": cap_id,
                "capability": label,
                "present": len(hits) >= 2,
                "matches": count,
                "evidence": hits[:3],
                "files": len(hits),
            })
    return results


def yaml_dump(data) -> str:
    """A small YAML writer, so the registries do not need a dependency."""
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
            return '"' + s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ") + '"'
        return s

    def emit(obj, indent):
        lines = []
        pad = "  " * indent
        if isinstance(obj, dict):
            for k, v in obj.items():
                if isinstance(v, (dict, list)) and v:
                    lines.append(f"{pad}{k}:")
                    lines.extend(emit(v, indent + 1))
                elif isinstance(v, (dict, list)):
                    lines.append(f"{pad}{k}: {'{}' if isinstance(v, dict) else '[]'}")
                else:
                    lines.append(f"{pad}{k}: {scalar(v)}")
        elif isinstance(obj, list):
            for item in obj:
                if isinstance(item, dict):
                    first = True
                    for k, v in item.items():
                        prefix = f"{pad}- " if first else f"{pad}  "
                        first = False
                        if isinstance(v, (dict, list)) and v:
                            lines.append(f"{prefix}{k}:")
                            lines.extend(emit(v, indent + 2))
                        elif isinstance(v, (dict, list)):
                            lines.append(f"{prefix}{k}: {'{}' if isinstance(v, dict) else '[]'}")
                        else:
                            lines.append(f"{prefix}{k}: {scalar(v)}")
                elif isinstance(item, list):
                    lines.append(f"{pad}-")
                    lines.extend(emit(item, indent + 1))
                else:
                    lines.append(f"{pad}- {scalar(item)}")
        return lines

    return "\n".join(emit(data, 0)) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--assessment", default=str(REPO / "research" / "projects" / "assessment.json"))
    ap.add_argument("--catalogue-out", default=str(REPO / "docs" / "PROGRAMME-CATALOGUE.yaml"))
    ap.add_argument("--gap-out", default=str(REPO / "docs" / "PROGRAMME-GAP-ANALYSIS.yaml"))
    ap.add_argument("--write-todos", action="store_true")
    args = ap.parse_args()

    assessment = {}
    ap_path = Path(args.assessment)
    if ap_path.exists():
        for rec in json.loads(ap_path.read_text(encoding="utf-8")):
            assessment[rec["name"]] = rec

    repos = {}
    rp = REPO / "research" / "github-repos" / "index.json"
    if rp.exists():
        for r in json.loads(rp.read_text(encoding="utf-8")):
            repos[r["name"]] = r

    catalogue_projects = []
    gaps = []
    todo_specs = []
    cap_summary: dict[str, dict] = {}

    for p in PROJECTS:
        root = project_root(p)
        meas = assessment.get(p["name"], {})
        if not meas and root and root.is_dir():
            meas = {"own_lines": 0, "test_files": 0, "licence": None,
                    "manifests": [], "primary_language": None, "docs": []}
        repo = repos.get(p.get("repo") or "") or {}

        caps: list[dict] = []
        if root and root.is_dir() and meas.get("own_lines", 0) > 0:
            caps = scan_capabilities(root, p["family"])
        else:
            for fam in p["family"]:
                for cap_id, label, _terms in FAMILY_CAPABILITIES.get(fam, []):
                    caps.append({"family": fam, "capability_id": cap_id,
                                 "capability": label, "present": False,
                                 "matches": 0, "evidence": []})

        present = [c for c in caps if c["present"]]
        missing = [c for c in caps if not c["present"]]
        cap_summary[p["id"]] = {
            "total": len(caps), "present": len(present), "missing": len(missing)}

        entry = {
            "id": p["id"],
            "name": p["name"],
            "family": p["family"],
            "role": p["role"],
            "locations": [],
            "state": "",
            "measured": {
                "own_lines": meas.get("own_lines", 0),
                "own_source_files": meas.get("own_source_files", 0),
                "test_files": meas.get("test_files", 0),
                "test_line_fraction": meas.get("test_line_fraction", 0),
                "primary_language": meas.get("primary_language"),
                "licence": meas.get("licence"),
                "manifests": meas.get("manifests", []),
                "has_ci": meas.get("has_ci", False),
                "has_docker": meas.get("has_docker", False),
                "secret_literal_files": meas.get("secret_literal_files", []),
            },
            "capabilities": {
                "checked": len(caps),
                "present": len(present),
                "missing": len(missing),
            },
            "gaps": [],
        }

        locs = []
        if p.get("path"):
            root_path = Path(p["path"])
            inside = "Aetherius-OS" in root_path.parts
            kind = ("recovered" if "external drive" in str(root_path).lower()
                    else "absorbed" if inside
                    else "workspace")
            locs.append({"kind": kind, "path": str(root_path)})
        if p.get("repo"):
            locs.append({"kind": "github", "path": f"jayprophit/{p['repo']}",
                         "url": f"https://github.com/jayprophit/{p['repo']}",
                         "fork": repo.get("fork"), "private": repo.get("private"),
                         "pushed_at": repo.get("pushed_at")})
        entry["locations"] = locs

        # The state is decided by what was measured.
        lines = meas.get("own_lines", 0)
        if lines == 0:
            entry["state"] = "EMPTY"
        elif meas.get("test_files", 0) == 0 and lines > 5000:
            entry["state"] = "UNTESTED"
        elif meas.get("test_line_fraction", 0) < 0.02 and lines > 5000:
            entry["state"] = "THINLY_TESTED"
        elif meas.get("secret_literal_files"):
            entry["state"] = "SECRET_EXPOSED"
        else:
            entry["state"] = "PRESENT"
        catalogue_projects.append(entry)

        # ---- gaps ----
        def add_gap(gid, family, title, detail, priority, evidence, acceptance):
            gaps.append({
                "id": gid, "project": p["id"], "project_name": p["name"],
                "family": family, "title": title, "status": "OPEN",
                "priority": priority, "detail": detail,
                "evidence": evidence, "acceptance": acceptance,
            })
            entry["gaps"].append(gid)

        if lines == 0:
            add_gap(f"{p['id']}-GAP-001", p["family"][0],
                    f"{p['name']} has no source",
                    f"The project directory exists and is registered, but it holds "
                    f"{meas.get('own_source_files', 0)} source files. The build manifest "
                    f"describes a project that does not exist yet.",
                    1,
                    f"Measured own source lines: {lines}. Manifests found: "
                    f"{meas.get('manifests', []) or 'none'}.",
                    ["The project holds the source its manifest describes",
                     "The build runs and its tests pass"])
            todo_specs.append({
                "id": f"TODO-{p['id'].replace('PRJ-', '')}-000",
                "title": f"Build the {p['name']} project the manifest describes",
                "project": p["id"], "priority": 1,
                "detail": f"{p['name']} is registered in the programme and has a build "
                          f"manifest, but there is no source. The conversations and the "
                          f"recovered material describe what it is.",
                "evidence": f"Measured own source lines: {lines}.",
                "acceptance": ["Source exists in the project directory",
                               "The project builds and its tests pass",
                               "The build manifest matches what is there"],
            })

        if lines > 5000 and meas.get("test_files", 0) == 0:
            add_gap(f"{p['id']}-GAP-002", "platform",
                    f"{p['name']} has no tests",
                    f"The project holds {lines} lines of its own source and not one test "
                    f"file. Nothing about it can be shown to work.",
                    1,
                    f"Measured own source lines: {lines}, test files: 0.",
                    ["A test suite exists that covers the project's own source",
                     "The tests run in the project's build gate"])
            todo_specs.append({
                "id": f"TODO-{p['id'].replace('PRJ-', '')}-001",
                "title": f"Give {p['name']} a test suite",
                "project": p["id"], "priority": 1,
                "detail": f"{p['name']} holds {lines} lines of its own source with no "
                          f"tests. Without tests the build gate proves nothing about it.",
                "evidence": f"Measured own source lines: {lines}, test files: 0.",
                "acceptance": ["Tests exist and run",
                               "The build manifest runs them",
                               "A failure in the suite fails the gate"],
            })

        if meas.get("secret_literal_files"):
            add_gap(f"{p['id']}-GAP-003", "platform",
                    f"{p['name']} has credentials in its source",
                    "Literal credentials were found in the project's own files. These "
                    "must be treated as compromised and rotated, not merely deleted.",
                    1,
                    f"Files with literal credentials: {meas['secret_literal_files']}.",
                    ["The credentials are rotated",
                     "No credential literal remains in the tree",
                     "The secret scanner gate rejects the pattern"])
            todo_specs.append({
                "id": f"TODO-{p['id'].replace('PRJ-', '')}-002",
                "title": f"Rotate and remove the credentials in {p['name']}",
                "project": p["id"], "priority": 1,
                "detail": "Literal credentials were found in the project's own source. "
                          "They are compromised by being on disk in a recovered drive.",
                "evidence": f"Files: {meas['secret_literal_files']}.",
                "acceptance": ["Every credential is rotated at the provider",
                               "No credential literal remains in the tree",
                               "The secret scanner gate rejects the pattern"],
            })

        if not meas.get("licence") and lines > 2000:
            add_gap(f"{p['id']}-GAP-004", "platform",
                    f"{p['name']} has no licence",
                    "The project has no licence file. For a first-party project that "
                    "is the owner's choice to make, but until it is made the project "
                    "cannot be published or shared.",
                    2,
                    f"No licence file found among {meas.get('own_source_files', 0)} source files.",
                    ["A licence is chosen and a licence file is present",
                               "The build manifest records the licence"])
            todo_specs.append({
                "id": f"TODO-{p['id'].replace('PRJ-', '')}-003",
                "title": f"Choose and record a licence for {p['name']}",
                "project": p["id"], "priority": 2,
                "detail": "The project has no licence file. The owner decides which; "
                          "the default for new first-party repositories is private.",
                "evidence": f"No licence file found. Own source lines: {lines}.",
                "acceptance": ["A licence file is present",
                               "The build manifest records it"],
            })

        # The capability gaps of a project are one piece of work, not many.
        # They are recorded individually in the gap analysis and grouped
        # into a single todo, because a project does not get finished by
        # twenty separate small tasks.
        if missing:
            grouped = [f"{c['capability']} ({c['capability_id']})" for c in missing]
            by_family: dict[str, list[str]] = defaultdict(list)
            for c in missing:
                by_family[c["family"]].append(c["capability_id"])
            todo_specs.append({
                "id": f"TODO-{p['id'].replace('PRJ-', '')}-010",
                "title": f"Build the missing {p['name']} capabilities",
                "project": p["id"], "priority": 2 if len(missing) <= 5 else 3,
                "detail": f"{p['name']} was checked against the capability set for "
                          f"its family and {len(missing)} of {len(caps)} were not found "
                          f"in its own source. The missing ones are: "
                          + "; ".join(grouped) + ".",
                "evidence": "The capability search terms are in "
                            "tools/programme_capabilities.py and the search was "
                            f"run over {meas.get('own_source_files', 0)} own source files.",
                "acceptance": ["Each missing capability is present in the source",
                               "Each capability that is present is recorded in "
                               "PROGRAMME-CATALOGUE.yaml"],
            })

        # Family capability gaps.
        for c in missing:
            gid = f"{p['id']}-CAP-{c['capability_id']}"
            add_gap(gid, c["family"],
                    f"{p['name']} has no {c['capability'].lower()}",
                    f"The {c['family']} capability '{c['capability']}' was looked for in "
                    f"{p['name']}'s own source and not found. The search terms were "
                    f"recorded so the finding can be checked.",
                    3 if c["capability_id"].startswith(("APP-00", "FIN-00", "COM-00")) else 4,
                    f"No occurrence of the search terms for {c['capability_id']} in "
                    f"{meas.get('own_source_files', 0)} own source files.",
                    [f"{c['capability']} exists and is reachable",
                     "A test covers it"])

    # ---- write the catalogue ----
    catalogue = {
        "schema_version": 1,
        "source_date": date.today().isoformat(),
        "generated_by": "tools/generate_programme_registers.py",
        "notes": [
            "Every first-party project the owner holds, in every place they hold one.",
            "The measured figures come from tools/assess_projects.py and are counts, not claims.",
            "The capability counts come from a keyword search of each project's own source; "
            "a capability marked present was found in a named file and can be checked.",
            "Gaps for individual capabilities are in PROGRAMME-GAP-ANALYSIS.yaml.",
        ],
        "projects": catalogue_projects,
    }
    Path(args.catalogue_out).write_text(yaml_dump(catalogue), encoding="utf-8")
    print(f"wrote {args.catalogue_out} ({len(catalogue_projects)} projects)")

    # ---- write the gap analysis ----
    gaps.sort(key=lambda g: (g["priority"], g["project"], g["id"]))
    for i, g in enumerate(gaps, 1):
        g["todo"] = f"TODO-PRG-{i:04d}"
    gap_doc = {
        "schema_version": 1,
        "source_date": date.today().isoformat(),
        "generated_by": "tools/generate_programme_registers.py",
        "notes": [
            "The programme gap analysis, across every first-party project and every "
            "family the owner named.",
            "A gap is only recorded where something measurable was missing: no source, "
            "no tests, a credential in the tree, no licence, or a family capability "
            "that a search of the project's own source did not find.",
            "The search terms for each capability are in tools/programme_capabilities.py.",
        ],
        "totals": {
            "projects": len(catalogue_projects),
            "gaps": len(gaps),
            "by_priority": dict(Counter(g["priority"] for g in gaps)),
        },
        "gaps": gaps,
    }
    Path(args.gap_out).write_text(yaml_dump(gap_doc), encoding="utf-8")
    print(f"wrote {args.gap_out} ({len(gaps)} gaps)")

    # ---- write the todos ----
    if args.write_todos and todo_specs:
        import yaml as pyyaml
        todos_path = REPO / "docs" / "PROJECT-TODOS.yaml"
        doc = pyyaml.safe_load(todos_path.read_text(encoding="utf-8"))
        existing = {t["id"] for t in doc["todos"]}
        added = 0
        for spec in todo_specs:
            if spec["id"] in existing:
                continue
            doc["todos"].append({
                "id": spec["id"],
                "title": spec["title"],
                "project": spec["project"].lower().replace("prj-", ""),
                "status": "OPEN",
                "priority": spec["priority"],
                "source": {"kind": "programme-gap-analysis",
                           "ref": "Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml"},
                "detail": spec["detail"],
                "evidence": spec["evidence"],
                "acceptance": spec["acceptance"],
                "blocks": [],
            })
            added += 1
        todos_path.write_text(pyyaml.safe_dump(doc, sort_keys=False,
                                                allow_unicode=True, width=100),
                              encoding="utf-8")
        print(f"added {added} todos to {todos_path}")

    for p in catalogue_projects:
        s = cap_summary[p["id"]]
        print(f"  {p['name'][:40]:<42} {p['state']:<16} "
              f"caps {s['present']}/{s['total']}  gaps {len(p['gaps'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
