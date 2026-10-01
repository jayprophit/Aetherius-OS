"""Append materialized REQ entries to the capability registry (idempotent).

Reads src/programme/requirements.json plus the hand-authored YAML header, and
appends one capability entry per requirement below the GENERATED marker.
Re-running replaces the generated section wholesale, so requirement edits
(status, evidence, new requirements) flow through without hand-merging.

Parent mapping: requirement_parents overrides, else default_requirement_parent
by owner. Status mapping is documented in docs/adr/0001 and mirrored in
capabilityRegistry.ts::mapRequirementStatus — keep all three in sync.
"""
from __future__ import annotations

import json
import pathlib
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent
YAML_PATH = REPO / "docs" / "SYSTEM-CAPABILITY-REGISTRY.yaml"
REQ_PATH = REPO / "src" / "programme" / "requirements.json"
MARKER = "# === GENERATED REQUIREMENT ENTRIES (do not hand-edit below) ==="

OWNER_REPO = {
    "aetherius-os": "Aetherius-OS",
    "genesis": "Genesis",
    "agent-bridge": "Agent-Bridge",
    "ide": "IDE-Workspace",
    "mat": "Materials-Atlas-Table-Codex---MAT",
    "poietek": "Poietek",
}


def q(value: object) -> str:
    """Single-line YAML-safe scalar."""
    text = str(value).replace("\\", "\\\\").replace('"', '\\"')
    return f'"{text}"'


def main() -> None:
    text = YAML_PATH.read_text(encoding="utf-8")
    head, _, _ = text.partition(MARKER)
    if MARKER not in text:
        sys.exit("marker missing: refusing to guess the insertion point")

    data = json.loads(REQ_PATH.read_text(encoding="utf-8"))
    reqs = data["requirements"]

    # read the mapping tables back out of the hand-authored header
    overrides: dict[str, str] = {}
    defaults: dict[str, str] = {}
    section = None
    for line in head.split("\n"):
        s = line.strip()
        if s == "requirement_parents:":
            section = overrides
            continue
        if s == "default_requirement_parent:":
            section = defaults
            continue
        if section is not None and ": " in s and not s.startswith("#"):
            key, _, val = s.partition(": ")
            section[key.strip()] = val.strip()
        elif section is not None and (not s or s.startswith("capabilities:")):
            if not s:
                continue
            section = None

    # sanity: overrides must name real requirements and real CAP parents
    req_ids = {r["id"] for r in reqs}
    cap_ids = set()
    for line in head.split("\n"):
        s = line.strip()
        if s.startswith("- id: CAP-"):
            cap_ids.add(s.split(":", 1)[1].strip())
    problems: list[str] = []
    for rid, parent in overrides.items():
        if rid not in req_ids:
            problems.append(f"override names unknown requirement {rid}")
        if parent not in cap_ids:
            problems.append(f"override {rid} names unknown parent {parent}")
    for owner, parent in defaults.items():
        if parent not in cap_ids:
            problems.append(f"default parent {parent} for {owner} unknown")
    if problems:
        print("parent mapping problems:")
        for p in problems:
            print("  -", p)
        sys.exit(1)

    lines = [MARKER, ""]
    for r in reqs:
        rid = r["id"]
        parent = overrides.get(rid, defaults.get(r["owner"], ""))
        if not parent:
            sys.exit(f"no parent for {rid} (owner {r['owner']})")
        repo = OWNER_REPO.get(r["owner"], "Aetherius-OS")
        lines.append(f"  - id: {rid}")
        lines.append(f"    name: {q(r['title'])}")
        lines.append("    type: requirement")
        lines.append(f"    description: {q(r.get('description', ''))}")
        lines.append(f"    domain: {r['owner']}")
        lines.append(f"    primary_parent: {parent}")
        deps = r.get("depends_on", [])
        if deps:
            dep_list = ", ".join(deps)
            lines.append("    relationships:")
            lines.append(f"      depends_on: [{dep_list}]")
        lines.append(f"    requirement_id: {rid}")
        lines.append("    required: true")
        lines.append(f"    phase: {r.get('phase', '')}")
        if r.get("priority") is not None:
            lines.append(f"    priority: {r['priority']}")
        lines.append("    status_from_requirement: true")
        impl = [f"{repo}/{p}" for p in r.get("implementation_refs", [])]
        tests = [f"{repo}/{p}" for p in r.get("test_refs", [])]
        if impl:
            lines.append("    implementation:")
            lines.append("      paths:")
            for p in impl:
                lines.append(f"        - {q(p)}")
        lines.append("    evidence:")
        if tests:
            lines.append("      tests:")
            for p in tests:
                lines.append(f"        - {q(p)}")
        lines.append("      notes:")
        for e in r.get("evidence", []):
            one_line = " ".join(str(e).split())
            lines.append(f"        - {q(one_line)}")
        prov = r.get("provenance", "")
        if prov:
            lines.append(f"    provenance_note: {q(' '.join(str(prov).split()))}")
        lines.append("    history:")
        lines.append("      - {date: 2026-10-01, action: imported, note: materialized from requirements.json}")
        lines.append("")

    YAML_PATH.write_text(head + "\n".join(lines), encoding="utf-8")
    print(f"wrote {len(reqs)} generated entries")


if __name__ == "__main__":
    main()
