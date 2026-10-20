#!/usr/bin/env python3
"""Join the owner's fork catalogue with the live account, and register it.

The owner has a fork use case migration catalogue: three hundred and
fifty repositories, each with the category it belongs to, the project
it serves, the use case, the integration mode, how confident the
analysis is and what happens to it afterwards.

The inheritance packet says every repository and fork should be
inspected and routed. The catalogue is the owner's routing. This tool
joins it with the live account, so that three things are visible at once:

  - the forks the owner has already routed, with the routing recorded;
  - the repositories on the account that the catalogue does not cover,
    classified into what they actually are rather than counted as
    findings;
  - the catalogue entries whose repository is no longer on the account,
    whose routing needs re-checking because the thing they were about
    has changed.

Usage:
    python tools/build_fork_routing.py
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
MATERIAL = REPO / "research" / "owner-material" / "index.json"
GITHUB_INDEX = REPO / "research" / "github-repos" / "index.json"
REGISTRY = REPO / "docs" / "BUILD-MANIFEST-REGISTRY.yaml"
OUT = REPO / "docs" / "FORK-ROUTING-REGISTRY.yaml"
REPORT = REPO / "docs" / "FORK-ROUTING-REGISTRY.md"

# The programme project each category belongs to. A category is a place
# in the programme, and the routing only means something when the place
# is named.
# The accounts the owner holds. A repository on any of them is his own.
OWNER_ACCOUNTS = {"jayprophit", "sifdat"}

CATEGORY_PROJECT = {
    "AETHERIUS_FIRST_PARTY_AUDIO_MEDIA": "poietek",
    "AETHERIUS_FIRST_PARTY_CREATIVE_CAD": "poietek",
    "AETHERIUS_STORAGE_DATA": "aetherius-os",
    "AETHERIUS_OS_CORE": "aetherius-os",
    "AETHERIUS_COMPUTE_AI_RUNTIME": "genesis",
    "AETHERIUS_IDE_AGENT_DEVELOPER": "ide-workspace",
    "GENESIS_BIO_NEURO_HEALTH": "aetherius-os",
    "GENESIS_AVATAR_VOICE_VIDEO": "genesis",
    "GENESIS_MEMORY_COGNITION": "genesis",
    "AETHERIUS_OBSERVABILITY_DEVOPS_BUILD": "aetherius-os",
    "GEO_RADIO_SENSOR": "aetherius-os",
    "MAT_SCIENCE_ENGINEERING": "mat",
    "CHIP_FPGA_QUANTUM": "genesis",
    "AETHERIUS_SECURITY_IDENTITY_PROVENANCE": "aetherius-os",
    "AETHERIUS_NETWORK_IOT_MESSAGING": "aetherius-os",
    "AETHERIUS_FIRST_PARTY_BUSINESS_APPS": "aetherius-os",
    "ROBOTICS_EMBODIMENT_SIMULATION": "genesis",
    "VERIFY_UPSTREAM": None,
}

# The repositories the owner's own words identify as learning
# repositories. The inheritance packet is explicit: an empty repository
# may be a learning repository, and it must not be deleted merely for
# being empty.
LEARNING = {
    "cs50-python", "cs50x", "data-analysis-with-python", "deep-learning",
    "python-projects", "html", "c", "c-plus-plus", "machine-code", "scratch",
    "excel", "sql", "spreadsheets", "npm", "maven", "gradle", "flask",
    "flutter", "linux", "docker", "ansible", "arduino", "react-native",
    "swift-ui", "native-app-development", "jetpack-compos", "power-bi",
    "webflow", "prompt-engineering", "github-markdown-syntax", "terroaform",
    "truffle-suite", "nfts", "blockchain", "cyber-security", "devops", "imba",
    "lau", "codespace-auth-temp", "jayprophit", "ios", "hirnate", "hibernate",
}

# A repository of a few kilobytes carries nothing.
EMPTY_BYTES = 50 * 1024


def quote(text: str) -> str:
    return '"' + str(text).replace("\\", "\\\\").replace('"', '\\"') + '"'


def yaml_dump(data) -> str:
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
            return quote(s)
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
                elif isinstance(item, list):
                    out.append(f"{pad}-")
                    out.extend(emit(item, indent + 1))
                else:
                    out.append(f"{pad}- {scalar(item)}")
        return out

    return "\n".join(emit(data, 0)) + "\n"


def programme_names() -> set[str]:
    """Every name the programme's own projects are known by.

    The registry's id and the repository's name are not always the same
    string: MAT is "Materials-Atlas-Table-Codex---MAT" on the account and
    "mat" in the registry. Both are collected.
    """
    names: set[str] = set()
    if not REGISTRY.exists():
        return names
    body = REGISTRY.read_text(encoding="utf-8")
    for m in re.finditer(r"^\s+- id: (\S+)\s*$", body, re.M):
        names.add(m.group(1).lower())
    for m in re.finditer(r'^\s+manifest:\s+"?([^"\n]+)"?\s*$', body, re.M):
        segments = m.group(1).split("/")
        # The project sits in the folder the manifest names, which for a
        # project inside another one is the last segment and not the
        # first: the manifest for Niche_platform is
        # Aetherius-OS/ecosystem/Niche_platform/build.yaml.
        for segment in (segments[0], segments[-2] if len(segments) >= 2 else ""):
            if segment:
                names.add(segment.lower())
    return names


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(OUT))
    args = ap.parse_args()

    if not MATERIAL.exists() or not GITHUB_INDEX.exists():
        print("  the catalogue or the repository index is missing; run the ingestion first")
        return 1

    material = json.loads(MATERIAL.read_text(encoding="utf-8"))
    catalogue = next((r for r in material if r["id"] == "OM-CATALOGUE-FORK-USE-CASE"), None)
    if not catalogue:
        print("  the fork catalogue is not in the material index")
        return 1
    rows = catalogue.get("routing") or []

    account = json.loads(GITHUB_INDEX.read_text(encoding="utf-8"))
    by_name: dict[str, dict] = {}
    for r in account:
        by_name[r["name"].lower()] = r
        if r.get("full_name"):
            by_name[r["full_name"].lower()] = r

    routed = []
    seen: set[str] = set()
    unmatched: list[str] = []
    for row in rows:
        name = (row.get("repository") or "").strip()
        if not name:
            continue
        key = name.lower()
        if key in seen:
            continue
        seen.add(key)
        live = by_name.get(key) or by_name.get(key.split("/")[-1])
        entry = {
            "repository": name,
            "on_account": live is not None,
            "category": row.get("category", ""),
            "project": CATEGORY_PROJECT.get(row.get("category", "")),
            "primary_destination": row.get("primary_destination", ""),
            "primary_use_case": row.get("primary_use_case", ""),
            "when_used": row.get("when_used", ""),
            "how_used": row.get("how_used", ""),
            "migration_mode": row.get("migration_mode", ""),
            "analysis_confidence": row.get("analysis_confidence", ""),
            "inventory_status": row.get("inventory_status", ""),
            "post_migration_disposition": row.get("post_migration_disposition", ""),
        }
        if live:
            entry["fork"] = live["fork"]
            entry["licence"] = live.get("spdx")
            entry["language"] = live.get("language")
            entry["pushed_at"] = live.get("pushed_at")
        else:
            unmatched.append(name)
        routed.append(entry)

    covered = {r["repository"].split("/")[-1].lower() for r in routed}
    programme = programme_names()
    uncovered = []
    for r in account:
        if r["name"].lower() in covered:
            continue
        lowered = r["name"].lower()
        size_kb = r.get("size_kb") or 0
        if r["fork"]:
            # A fork is somebody else's code. It is reference material,
            # and it is not the owner's to publish or to place.
            state = "third_party_fork"
        elif lowered in programme:
            state = "first_party_programme"
        elif size_kb < 50 or lowered in LEARNING:
            # The owner's own data, kept. An empty repository may be a
            # learning repository, and the inheritance packet is explicit
            # that it must not be deleted merely for being empty.
            state = "first_party_learning"
        else:
            state = "first_party_application"
        uncovered.append({
            "repository": r["name"],
            "fork": r["fork"],
            "archived": r.get("archived", False),
            "licence": r.get("spdx"),
            "language": r.get("language"),
            "size_kb": size_kb,
            "pushed_at": r.get("pushed_at"),
            "state": state,
        })

    modes = Counter(e["migration_mode"] for e in routed)
    categories = Counter(e["category"] for e in routed)
    by_project = Counter(e["project"] for e in routed if e["project"])
    states = Counter(u["state"] for u in uncovered)

    document = {
        "schema_version": "1.0.0",
        "source_date": date.today().isoformat(),
        "generated_by": "tools/build_fork_routing.py",
        "notes": [
            "The owner's fork use case migration catalogue, joined with the live "
            "account. The catalogue is the owner's own routing and is the "
            "authority for it; this file records it and shows what it does not "
            "yet cover.",
            "A fork that is not routed is not rejected. It is a fork whose "
            "destination has not been decided, and the gap analysis names it.",
            "The catalogue entries whose repository is no longer on the account "
            "are listed separately: their routing needs re-checking because the "
            "thing they were about has changed.",
            "The uncovered repositories are classified, not counted as findings. "
            "The catalogue routes third-party forks, so what it does not cover is "
            "mostly the owner's own work. Everything that is not a publicly "
            "known brand or a fork is the owner's own data.",
        ],
        "totals": {
            "catalogue_rows": len(rows),
            "routed": len(routed),
            "on_account": sum(1 for e in routed if e["on_account"]),
            "not_on_account": len(unmatched),
            "on_the_account": len(account),
            "not_covered_by_the_catalogue": len(uncovered),
            "uncovered_by_state": dict(states),
            "by_project": dict(by_project.most_common()),
            "by_migration_mode": dict(modes.most_common()),
            "by_category": dict(categories.most_common()),
        },
        "routed": routed,
        "not_on_the_account": unmatched,
        "not_covered_by_the_catalogue": uncovered,
    }

    Path(args.out).write_text(yaml_dump(document), encoding="utf-8")
    print(f"  routed {len(routed)}, {document['totals']['on_account']} on the account")
    print(f"  uncovered: {dict(states)}")

    lines = ["# Fork routing", "",
             f"{len(routed)} repositories routed by the owner's catalogue. "
             f"{len(uncovered)} of the account's repositories are not covered by it, "
             "and they are classified rather than counted as findings.", "",
             "## By the project the fork serves", "", "| Project | Forks |", "|---|---|"]
    for name, n in by_project.most_common():
        lines.append(f"| {name} | {n} |")
    lines += ["", "## By integration mode", "", "| Mode | Forks |", "|---|---|"]
    for name, n in modes.most_common():
        lines.append(f"| {name} | {n} |")
    lines += ["", "## What the catalogue does not cover", "",
              "The catalogue routes third-party forks, so most of what it does not "
              "cover is the owner's own work.", ""]
    for state, title in (
        ("third_party_fork", "Forks with no routing. These are the findings."),
        ("first_party_application", "The owner's own applications that are not yet "
                                    "placed in the programme."),
        ("first_party_programme", "The programme's own projects, registered in the "
                                  "build manifest registry."),
        ("first_party_learning", "The owner's learning repositories, which the "
                                "inheritance packet says must not be deleted "
                                "merely for being empty."),
    ):
        group = [r for r in uncovered if r["state"] == state]
        lines += [f"### {title} ({len(group)})", ""]
        if state == "owner_learning_repository":
            lines += [f"{len(group)} repositories, listed in the register rather "
                      "than here.", ""]
            continue
        lines += ["| Repository | Size | Language | Last push |", "|---|---|---|---|"]
        for r in sorted(group, key=lambda x: -(x["size_kb"] or 0))[:80]:
            lines.append(f"| {r['repository']} | {(r['size_kb'] or 0)//1024} MB | "
                         f"{r['language'] or '-'} | {(r['pushed_at'] or '')[:10]} |")
        lines.append("")
    lines += ["## The catalogue entries that are not on the account", "",
              "Their routing needs re-checking, because the thing they were about "
              "has changed.", ""]
    for name in unmatched[:80]:
        lines.append(f"- {name}")
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"  wrote {args.out} and {REPORT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
