import os, json, re, sys
from pathlib import Path

ROOT = Path(r"C:\Users\jpowe\Desktop\Projects")
SKIP_DIRS = {"node_modules",".git","dist","build","target","__pycache__",".pytest_cache",
             ".vite",".next","out","bin","obj",".vs",".idea","vendor","dist-electron",
             ".sandbox","site-packages",".venv","venv",".npm-cache-local",".cache",
             "integration-archive","veyra-archive","_archive","raw",".mat-local",
             "dist-newstyle","cmake-build-debug","cmake-build-release"}
TEXT_EXT = {".txt",".md",".markdown",".text",".rst",".adoc",".log",".csv",".tsv"}

rows = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    for fn in filenames:
        p = Path(dirpath) / fn
        if p.suffix.lower() not in TEXT_EXT: continue
        try:
            size = p.stat().st_size
            if size > 4_000_000: continue
            text = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        rel = str(p.relative_to(ROOT)).replace("\\","/")
        # signal density: how much of it looks like headings / task markers
        heads = len(re.findall(r"(?m)^#{1,6}\s+\S", text))
        checks = len(re.findall(r"(?m)^\s*[-*]\s*\[[ xX]\]", text))
        todos = len(re.findall(r"(?i)\b(TODO|FIXME|NEXT_EXECUTABLE_TODO|pending|blocked|unimplemented|not implemented)\b", text))
        rows.append({
            "path": rel, "bytes": size, "lines": text.count("\n")+1,
            "headings": heads, "checkboxes": checks, "todo_words": todos,
            "head": " | ".join(l.strip() for l in text.splitlines()[:3] if l.strip())[:160],
        })

rows.sort(key=lambda r: (-(r["checkboxes"]*3 + r["todo_words"]*2 + r["headings"]), -r["bytes"]))
out = Path(r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS\research\text-document-inventory")
out.mkdir(parents=True, exist_ok=True)
(out / "inventory.json").write_text(json.dumps(rows, indent=1), encoding="utf-8")
print(f"TOTAL TEXT DOCS: {len(rows)}")
print(f"TOTAL BYTES: {sum(r['bytes'] for r in rows):,}")
print("\n== highest task-signal documents ==")
for r in rows[:45]:
    print(f"  ck={r['checkboxes']:<4} td={r['todo_words']:<4} h={r['headings']:<4} {r['bytes']:>8} {r['path']}")
