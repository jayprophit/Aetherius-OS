#!/usr/bin/env python3
"""Assess the recovered predecessor against the Genesis gap analysis.

The owner recovered a predecessor build and asked whether it helps with
Genesis. The honest answer needs evidence, because a predecessor is
full of files whose names promise more than their bodies deliver.

So every Python module in the predecessor is graded on what can be
verified, and the grade is not the file's own opinion of itself:

  - does it parse;
  - would it import, that is, is every name used in an annotation
    actually bound, since annotations are evaluated when the module
    loads;
  - is it reachable from the package's own imports, or is it an orphan;
  - does it carry real bodies, or is it a body of `pass`;
  - which Genesis capability axis it speaks to.

The result is a register. A module that describes a durable task queue
is evidence that the predecessor solved that problem, whatever the
predecessor's own reports claim about it.

Usage:
    python tools/assess_predecessor.py
"""

from __future__ import annotations

import argparse
import ast
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PREDECESSOR = Path(r"E:\external drive\AI Digital Twin\ai-digital-clone")

# The Genesis capability axes, matching the gap analysis registry.
AXES: dict[str, tuple[str, ...]] = {
    "model_integration": ("llm", "model", "ollama", "provider", "inference",
                          "chinese_llm", "unified_model"),
    "tool_execution": ("automation", "gateway", "serverless", "excel_api",
                       "iot_automation", "action_proposal"),
    "planning": ("workflow", "task", "cognitive_arch", "autopilot",
                 "reasoning", "orchestration"),
    "memory_context": ("memor", "self_improvement", "learning"),
    "multi_agent": ("multi_agent", "smart_meshing", "collaboration",
                    "federated", "orchestration_engine", "agent"),
    "identity_persistence": ("identity", "profile", "auth", "session"),
    "permissions_authority": ("authority", "permission", "policy",
                               "ethical", "ethics", "robot_laws", "safety"),
    "observability_audit": ("benchmark", "monitor", "feedback",
                            "optimization", "capability_truth"),
    "workspace_files": ("database_manager", "offline_config", "storage"),
    "browser_computer": ("scraper", "browser", "crawler", "research_scraping"),
    "knowledge_retrieval": ("rag", "retrieval", "knowledge", "search",
                            "scrap"),
    "lifecycle_recovery": ("offline_automation", "resilien", "recovery",
                           "consolidation"),
    "interface_presence": ("avatar", "desktop_app", "webapp", "ui", "web"),
}

# Words that mark a module as making a claim about itself rather than
# describing what it does.
SELF_PROMOTING = re.compile(
    r"(?i)\b(surpass|revolutionary|unprecedented|world[- ]class|best[- ]in[- ]class|"
    r"cutting[- ]edge|god[- ]level|ultimate|superior|advanced|perfect)\b")

# The package's own import chain, which is what makes a module reachable.
PACKAGE = "src/ai_digital_twin"


def annotation_names(tree: ast.AST) -> list[ast.Name]:
    """Every name that appears in an annotation.

    Annotations are evaluated when the module is loaded unless the file
    opts out with `from __future__ import annotations`, so an annotation
    naming a type that was never imported stops the module loading.
    """
    out: list[ast.Name] = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            ann = node.returns
            if ann is not None:
                out.extend(n for n in ast.walk(ann) if isinstance(n, ast.Name))
            for arg in list(node.args.args) + list(node.args.kwonlyargs) + \
                    list(node.args.posonlyargs):
                if arg.annotation is not None:
                    out.extend(n for n in ast.walk(arg.annotation)
                               if isinstance(n, ast.Name))
            if node.args.vararg and node.args.vararg.annotation is not None:
                out.extend(n for n in ast.walk(node.args.vararg.annotation)
                           if isinstance(n, ast.Name))
            if node.args.kwarg and node.args.kwarg.annotation is not None:
                out.extend(n for n in ast.walk(node.args.kwarg.annotation)
                           if isinstance(n, ast.Name))
        elif isinstance(node, ast.AnnAssign) and node.annotation is not None:
            out.extend(n for n in ast.walk(node.annotation) if isinstance(n, ast.Name))
    return out


def module_bindings(tree: ast.AST) -> set[str]:
    bound: set[str] = set(dir(__builtins__)) | {"__name__", "__file__", "__doc__"}
    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            for alias in node.names:
                bound.add(alias.asname or alias.name.split(".")[0])
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            bound.add(node.name)
        elif isinstance(node, ast.Assign):
            for target in node.targets:
                for n in ast.walk(target):
                    if isinstance(n, ast.Name):
                        bound.add(n.id)
        elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            bound.add(node.target.id)
        elif isinstance(node, (ast.For, ast.AsyncFor)):
            for n in ast.walk(node.target):
                if isinstance(n, ast.Name):
                    bound.add(n.id)
        elif isinstance(node, ast.withitem) and node.optional_vars is not None:
            for n in ast.walk(node.optional_vars):
                if isinstance(n, ast.Name):
                    bound.add(n.id)
        elif isinstance(node, ast.ExceptHandler) and node.name:
            bound.add(node.name)
        elif isinstance(node, (ast.Global, ast.Nonlocal)):
            bound.update(node.names)
    return bound


def has_future_annotations(tree: ast.AST) -> bool:
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.module == "__future__":
            if any(a.name == "annotations" for a in node.names):
                return True
    return False


def stub_bodies(tree: ast.AST) -> tuple[int, int]:
    """(functions with a real body, functions that are stubs)."""
    real = stub = 0
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            body = [b for b in node.body
                    if not (isinstance(b, ast.Expr) and isinstance(b.value, ast.Constant)
                            and isinstance(b.value.value, str))]
            if not body:
                stub += 1
            elif len(body) == 1 and isinstance(body[0], (ast.Pass, ast.Raise)):
                if isinstance(body[0], ast.Raise):
                    exc = body[0].exc
                    if isinstance(exc, ast.Call) and getattr(exc.func, "id", "") == "NotImplementedError":
                        stub += 1
                        continue
                stub += 1
            else:
                real += 1
    return real, stub


def assess_module(path: Path, root: Path) -> dict:
    rel = path.relative_to(root).as_posix()
    try:
        src = path.read_text(encoding="utf-8", errors="replace")
    except OSError as exc:
        return {"path": rel, "error": f"unreadable: {exc}"}

    rec: dict = {
        "path": rel,
        "bytes": len(src.encode("utf-8", errors="replace")),
        "lines": src.count("\n") + 1,
        "docstring": (src.strip()[:400].split("\n")[0] if src.strip() else ""),
        "self_promoting": bool(SELF_PROMOTING.search(src[:3000])),
    }
    try:
        tree = ast.parse(src)
    except SyntaxError as exc:
        rec.update({"parses": False, "error": f"syntax: {exc.msg} at line {exc.lineno}",
                    "grade": "broken"})
        return rec

    rec["parses"] = True
    bound = module_bindings(tree)
    if not has_future_annotations(tree):
        missing = sorted({n.id for n in annotation_names(tree)} - bound)
        if missing:
            rec["would_fail_to_import"] = True
            rec["missing_names"] = missing

    classes = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
    funcs = [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
    real, stub = stub_bodies(tree)
    rec.update({
        "classes": len(classes),
        "functions": len(funcs),
        "async_functions": sum(1 for f in funcs if isinstance(f, ast.AsyncFunctionDef)),
        "real_functions": real,
        "stub_functions": stub,
    })

    # Reachability: is the module named by some other module's import?
    rec["reachable"] = None  # filled in by the caller
    return rec


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", default=str(PREDECESSOR))
    ap.add_argument("--out", default=str(REPO / "research" / "predecessor"))
    args = ap.parse_args()

    root = Path(args.root)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    if not root.is_dir():
        print(f"predecessor not found at {root}")
        return 1

    modules = [p for p in root.rglob("*.py")
               if ".venv" not in p.parts and "__pycache__" not in p.parts]
    print(f"assessing {len(modules)} modules in {root}")

    records: list[dict] = []
    for p in modules:
        records.append(assess_module(p, root))

    # Reachability: collect every module name mentioned in an import.
    imported: set[str] = set()
    for p in modules:
        try:
            tree = ast.parse(p.read_text(encoding="utf-8", errors="replace"))
        except (OSError, SyntaxError):
            continue
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
                imported.add(node.module.replace(".", "/"))
            elif isinstance(node, ast.Import):
                for a in node.names:
                    imported.add(a.name.replace(".", "/"))

    for rec in records:
        stem = rec["path"][:-3]  # strip .py
        parts = stem.split("/")
        rec["reachable"] = any(
            parts[-1] in mod.split("/")[-1] or stem.endswith(mod)
            for mod in imported if mod
        )
        # Which Genesis axis does this module speak to?
        hay = rec["path"].lower()
        rec["axes"] = sorted({
            axis for axis, needles in AXES.items()
            if any(n in hay for n in needles)
        })

        # The grade. It is about what can be verified, not what is claimed.
        if not rec.get("parses"):
            rec["grade"] = "broken"
        elif rec.get("would_fail_to_import"):
            rec["grade"] = "does-not-import"
        elif rec.get("stub_functions", 0) > 0 and \
                rec.get("real_functions", 0) == 0:
            rec["grade"] = "stub"
        elif rec.get("real_functions", 0) >= 3 and rec.get("classes", 0) >= 1:
            rec["grade"] = "substantive"
        elif rec.get("real_functions", 0) >= 1:
            rec["grade"] = "thin"
        else:
            rec["grade"] = "empty"

    grades = Counter(r["grade"] for r in records)
    axis_files: dict[str, list[dict]] = defaultdict(list)
    for r in records:
        for a in r["axes"]:
            axis_files[a].append(r)

    (out_dir / "assessment.json").write_text(
        json.dumps(records, indent=1, ensure_ascii=False), encoding="utf-8")

    lines = [
        "# The predecessor, assessed",
        "",
        f"{len(records)} Python modules in `{root}`.",
        "",
        "The grade is what can be verified from the file, not what the file",
        "says about itself. A module that names a type it never imported is",
        "graded `does-not-import`, because that is what happens when the",
        "package loads.",
        "",
        "| Grade | Modules | Meaning |",
        "|---|---|---|",
        f"| substantive | {grades['substantive']} | classes and real function bodies |",
        f"| thin | {grades['thin']} | some real code, little structure |",
        f"| stub | {grades['stub']} | only `pass` and `NotImplementedError` |",
        f"| does-not-import | {grades['does-not-import']} | names a type it never bound |",
        f"| broken | {grades['broken']} | does not parse |",
        f"| empty | {grades['empty']} | nothing in it |",
        "",
        f"Of the {len(records)} modules, "
        f"{sum(1 for r in records if r.get('self_promoting'))} use superlative language "
        "about themselves in their opening.",
        "",
        "## Which Genesis axis each module speaks to",
        "",
    ]
    for axis, rs in sorted(axis_files.items(), key=lambda x: -len(x[1])):
        lines.append(f"### {axis} ({len(rs)})")
        lines.append("")
        for r in sorted(rs, key=lambda x: (-x.get("real_functions", 0), x["path"])):
            marks = []
            if r["grade"] == "does-not-import":
                marks.append("does not import")
            if r["grade"] == "broken":
                marks.append("does not parse")
            if r.get("self_promoting"):
                marks.append("self-promoting")
            note = f" — {', '.join(marks)}" if marks else ""
            lines.append(
                f"- `{r['path']}` — {r.get('classes', 0)} classes, "
                f"{r.get('real_functions', 0)} real functions{note}")
        lines.append("")

    broken = [r for r in records if r["grade"] in ("does-not-import", "broken")]
    if broken:
        lines += ["## The modules that cannot load", "",
                  "| Module | Grade | Detail |", "|---|---|---|"]
        for r in broken:
            detail = r.get("error") or (
                "unbound: " + ", ".join(r.get("missing_names", [])))
            lines.append(f"| `{r['path']}` | {r['grade']} | {detail} |")
        lines.append("")

    (out_dir / "assessment.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"  grades: {dict(grades)}")
    print(f"  wrote {out_dir / 'assessment.md'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
