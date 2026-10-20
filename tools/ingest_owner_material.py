#!/usr/bin/env python3
"""Read the owner's material and extract what is actionable from it.

The owner has provided the programme's design material in a dozen
places: the master handoffs, the fork use case catalogue, the prompt
documents, the ChatGPT library files, and the reference trees.

The material is not filed and forgotten. It is read, and what it says is
extracted into machine-readable form: the decisions the owner has made,
the capabilities they have asked for, the repositories the catalogue
routes, and which of the programme's projects each source speaks to.

Three rules the tool keeps:

  - A credential store is recorded and never opened.
  - A third-party reference tree is inventoried and classified, and its
    text is not published.
  - The owner's own documents are read, and the statements they contain
    are recorded with the source they came from, so that a later
    decision can be traced back to the words that caused it.

Usage:
    python tools/ingest_owner_material.py
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SOURCES = REPO / "docs" / "OWNER-MATERIAL-SOURCES.yaml"
OUT = REPO / "research" / "owner-material"

TEXT_EXT = {".md", ".txt", ".csv", ".json", ".yaml", ".yml", ".html", ".py",
            ".ts", ".tsx", ".js", ".jsx", ".c", ".h", ".cpp", ".hpp", ".rs",
            ".go", ".java", ".cs", ".sh", ".ps1", ".toml", ".ini", ".cfg"}
CODE_EXT = {".py", ".ts", ".tsx", ".js", ".jsx", ".c", ".h", ".cpp", ".hpp",
            ".rs", ".go", ".java", ".cs"}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".bmp", ".ico"}
DOC_EXT = {".md", ".txt", ".pdf", ".docx", ".rst", ".org"}

# The programmes the material speaks to, and the words that find them.
PROJECTS: dict[str, tuple[str, ...]] = {
    "genesis": ("genesis", "the organism", "spiritual body"),
    "agent-bridge": ("agent bridge", "agent-bridge", "agentbridge"),
    "aetherius-os": ("aetherius os", "aetherius-os", "the ecosystem"),
    "ide-workspace": ("ide workspace", "ide-workspace", "the ide"),
    "mat": ("materials atlas", "mat ", "periodic table", "the codex"),
    "universal-bridge": ("universal bridge", "universal-bridge"),
    "poietek": ("poietek",),
    "athena": ("athena",),
    "ledgerlands": ("ledgerlands",),
    "aetherial": ("aetherial",),
    "aetherial-platform": ("aetherial-platform", "aetherial platform"),
    "web-platform": ("web-platform", "web platform"),
    "niche-platform": ("niche_platform", "niche platform"),
    "self-building-ai": ("self-building-ai", "self building ai"),
    "virtual-assistant": ("virtualassistant", "virtual assistant",
                           "quantumvirtualassistant"),
    "crossplatform": ("crossplatform", "cross platform", "multiplatform"),
    "food-wiki": ("food wiki", "fatawiki", "food-wiki"),
    "decentralized-messaging": ("decentralized messaging", "decentralised messaging"),
    "hermes": ("hermes",),
    "figma-agent": ("figma",),
}

# A statement the owner made that binds the programme.
DECISION = re.compile(
    r"(?im)^\s*(?:[-*]\s*|\d+[.)]\s*)?"
    r"(?:\*\*)?(must|never|always|do not|don't|shall|should|required|"
    r"important|critical|rule|rule:|principle|decision|law)(?:\*\*)?[:\s]"
    r"(.{12,220}?)\s*$")

# Something the owner asked to be built.
FEATURE = re.compile(
    r"(?i)\b(add|build|create|make|implement|generate|design|produce|write|"
    r"develop|enable|support|include|provide)\b[^.]{0,160}?\b"
    r"(feature|function|plugin|module|tool|capability|service|app|application|"
    r"screen|panel|page|workflow|system|engine|integration|api)\b")

# A repository the catalogue routes.
REPO_REF = re.compile(r"(?i)\b(jayprophit/[A-Za-z0-9._-]+)\b")


def read_text(path: Path, limit: int = 6_000_000) -> str:
    try:
        if path.stat().st_size > limit:
            with path.open("r", encoding="utf-8", errors="replace") as fh:
                return fh.read(limit)
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def inventory(path: Path) -> dict:
    """What a source holds."""
    info = {"files": 0, "bytes": 0, "kinds": Counter(), "extensions": Counter(),
            "documents": []}
    if path.is_file():
        info["files"] = 1
        info["bytes"] = path.stat().st_size
        ext = path.suffix.lower()
        info["extensions"][ext or "(none)"] += 1
        if ext in DOC_EXT or ext in TEXT_EXT:
            info["documents"].append(path.name)
        return info
    if not path.is_dir():
        return info
    for dirpath, dirnames, filenames in __import__("os").walk(path):
        dirnames[:] = [d for d in dirnames
                       if d not in {".git", "node_modules", "__pycache__",
                                    ".venv", "venv", "build", "dist", "out"}]
        for fn in filenames:
            p = Path(dirpath) / fn
            try:
                size = p.stat().st_size
            except OSError:
                continue
            info["files"] += 1
            info["bytes"] += size
            ext = p.suffix.lower() or "(none)"
            info["extensions"][ext] += 1
            if ext in CODE_EXT:
                info["kinds"]["code"] += 1
            elif ext in DOC_EXT:
                info["kinds"]["document"] += 1
            elif ext in TEXT_EXT:
                info["kinds"]["data"] += 1
            elif ext in IMAGE_EXT:
                info["kinds"]["image"] += 1
            else:
                info["kinds"]["other"] += 1
            if ext in DOC_EXT and len(info["documents"]) < 40:
                info["documents"].append(str(p.relative_to(path)).replace("\\", "/"))
    return info


def projects_in(text: str) -> list[str]:
    low = text.lower()
    found = []
    for name, terms in PROJECTS.items():
        if any(t in low for t in terms):
            found.append(name)
    return sorted(found)


def extract_statements(text: str) -> dict:
    decisions = []
    for m in DECISION.finditer(text):
        statement = " ".join(m.group(0).split())
        if statement not in decisions:
            decisions.append(statement[:240])
        if len(decisions) >= 40:
            break
    features = []
    for m in FEATURE.finditer(text):
        statement = " ".join(m.group(0).split())
        if len(statement) > 30 and statement not in features:
            features.append(statement[:240])
        if len(features) >= 30:
            break
    return {"decisions": decisions, "features": features}


def read_catalogue(path: Path) -> list[dict]:
    """The fork use case catalogue: one row per repository."""
    rows = []
    try:
        with path.open(encoding="utf-8", errors="replace", newline="") as fh:
            for row in csv.DictReader(fh):
                rows.append({k: (v or "").strip() for k, v in row.items() if k})
    except OSError:
        return []
    return rows


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(OUT))
    args = ap.parse_args()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    import yaml as pyyaml
    manifest = pyyaml.safe_load(SOURCES.read_text(encoding="utf-8"))
    sources = manifest.get("sources") or []

    records = []
    for src in sources:
        path = Path(src["path"])
        rec = {
            "id": src["id"],
            "kind": src["kind"],
            "title": src.get("title", src["id"]),
            "path": src["path"],
            "present": path.exists(),
            "read": src.get("read", "inventory"),
            "projects": [],
            "decisions": [],
            "features": [],
            "repositories": [],
        }
        if not path.exists():
            print(f"  {src['id']}: not present at {path}")
            records.append(rec)
            continue

        if rec["read"] == "never":
            # A credential store is recorded and never opened.
            rec["note"] = "Recorded and not opened."
            rec["files"] = 1
            rec["bytes"] = path.stat().st_size if path.is_file() else 0
            print(f"  {src['id']}: recorded, not opened")
            records.append(rec)
            continue

        info = inventory(path)
        rec["files"] = info["files"]
        rec["bytes"] = info["bytes"]
        rec["kinds"] = dict(info["kinds"])
        rec["extensions"] = dict(info["extensions"].most_common(12))
        rec["documents"] = info["documents"][:20]

        if src["kind"] == "catalogue":
            rows = read_catalogue(path)
            rec["rows"] = len(rows)
            rec["columns"] = list(rows[0].keys()) if rows else []
            if "migration_mode" in (rows[0].keys() if rows else []):
                rec["migration_modes"] = dict(Counter(r["migration_mode"] for r in rows))
                rec["categories"] = dict(Counter(r["category"] for r in rows))
                rec["dispositions"] = dict(Counter(
                    r.get("post_migration_disposition", "") for r in rows).most_common(12))
            rec["repositories"] = sorted({r["repository"] for r in rows
                                         if r.get("repository")})[:400]
            rec["routing"] = rows[:400]
            print(f"  {src['id']}: {len(rows)} catalogue rows")
            records.append(rec)
            continue

        if rec["read"] == "inventory":
            # A third-party tree is inventoried and classified, and its text
            # is not read into the registers.
            rec["classified"] = True
            rec["note"] = "Inventoried and classified. The text is not published."
            print(f"  {src['id']}: {info['files']} files inventoried")
            records.append(rec)
            continue

        # The owner's own document: read it.
        text = read_text(path)
        if not text:
            print(f"  {src['id']}: could not be read as text")
            records.append(rec)
            continue
        rec["characters"] = len(text)
        rec["projects"] = projects_in(text)
        extracted = extract_statements(text)
        rec["decisions"] = extracted["decisions"]
        rec["features"] = extracted["features"]
        rec["repositories"] = sorted(set(REPO_REF.findall(text)))[:60]
        print(f"  {src['id']}: {len(text):,} characters, "
              f"{len(rec['decisions'])} decisions, {len(rec['features'])} features, "
              f"{len(rec['projects'])} projects")
        records.append(rec)

    (out_dir / "index.json").write_text(
        json.dumps(records, indent=1, ensure_ascii=False), encoding="utf-8")

    # The digest.
    lines = ["# The owner's material", "",
             f"{len(records)} declared sources, "
             f"{sum(1 for r in records if r.get('present'))} present.", "",
             "| Source | Kind | Files | Size | Projects named |",
             "|---|---|---|---|---|"]
    for r in records:
        lines.append(f"| {r['id']} | {r['kind']} | {r.get('files', 0)} | "
                     f"{r.get('bytes', 0)/1024:.0f} KB | "
                     f"{', '.join(r.get('projects') or []) or '-'} |")
    lines += ["", "## The decisions the material states", ""]
    for r in records:
        if not r.get("decisions"):
            continue
        lines.append(f"### {r['id']} — {r['title']}")
        lines.append("")
        for d in r["decisions"][:12]:
            lines.append(f"- {d}")
        lines.append("")
    lines += ["", "## The capabilities the material asks for", ""]
    for r in records:
        if not r.get("features"):
            continue
        lines.append(f"### {r['id']} — {r['title']}")
        lines.append("")
        for f in r["features"][:10]:
            lines.append(f"- {f}")
        lines.append("")
    (out_dir / "digest.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nwrote {out_dir / 'digest.md'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
