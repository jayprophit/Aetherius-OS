#!/usr/bin/env python3
"""Generate the workspace application registry.

The owner has a large installed application set: 180 non-Windows Start
Menu shortcuts, plus tool folders on the Desktop for programming, CAD,
browsers and audio production. These are the applications Aetherius has to
be able to understand, control and build alongside.

This registry records what is actually installed, where it lives, and what
kind of thing it is, so that the capability analysis can be made against
the real machine rather than against a guess.

The inventory comes from the Start Menu shortcuts and the Windows
uninstall registry, cross-checked against each other, plus the Desktop
tool folders. A shortcut is the honest record of what the owner actually
launches; the uninstall registry is the honest record of what is
installed. Both are recorded, and the difference between them is
meaningful: a shortcut with no install record is a stale link, and an
install with no shortcut is something the owner has not chosen to
surface.

Usage:
    python tools/generate_application_registry.py [--out docs/APPLICATION-REGISTRY.yaml]
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DESKTOP = Path.home() / "Desktop"

# The owner's tool folders on the Desktop, and what each is for.
TOOL_FOLDERS = [
    ("Programming & Code", "programming", "Game and application development toolchains."),
    ("CAD", "cad", "Computer-aided design, modelling and manufacturing."),
    ("Browsers", "browser", "Web browsers and their developer builds."),
    ("Audio Production", "audio", "Audio production, engineering and mastering."),
]

# Where each application's target path places it, categorised. The order
# matters: the first match wins.
CATEGORY_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("ai_agent", (
        "antigravity", "claude", "codex", "opencode", "hermes", "deepseek", "devin",
        "kimi", "qwen", "manus", "chatgpt", "gemini", "copilot", "cursor", "windsurf",
        "aider", "openclaw", "trae", "cline",
    )),
    ("ide_editor", (
        "visual studio", "vscode", "clion", "pycharm", "webstorm", "goland", "rider",
        "eclipse", "netbeans", "neovim", "sublime", "zed", "notepad++", "cursor",
        "antigravity ide", "mixer", "hbuilder", "android studio", "intellij",
    )),
    ("browser", (
        "chrome", "firefox", "edge", "brave", "opera", "vivaldi", "zen", "tor browser",
        "waterfox", "librewolf",
    )),
    ("cad_manufacturing", (
        "freecad", "cura", "solidworks", "fusion", "autocad", "catia", "siemens",
        "inventor", "rhino", "sketchup", "blender", "openscad", "tinkercad",
    )),
    ("audio_music", (
        "cubase", "fl studio", "ableton", "reaper", "pro tools", "logic", "garageband",
        "halion", "kristal", "kontakt", "groove agent", "guitar combo", "asio4all",
        "izotope", "native access", "steinberg", "spotify", "audacity", "bandlab",
        "melodyne", "soundforge", "wavelab", "mp3tag", "reaper",
    )),
    ("game_engine", (
        "godot", "unity", "unreal", "cocos", "gamemaker", "construct", "love2d",
        "bevy", "raylib", "defold", "stride",
    )),
    ("container_runtime", ("docker", "podman", "rancher", "minikube", "wsl")),
    ("model_runtime", ("ollama", "lm studio", "llama", "vllm", "jan", "gpt4all", "kobold")),
    ("data_analytics", ("python", "anaconda", "miniconda", "julia", "rstudio", "tableau", "spss", "matlab")),
    ("scm_automation", ("git", "github desktop", "sourcetree", "tower", "fork", "sourcetree")),
    ("vcs_and_issue", ("git", "github desktop", "sourcetree")),
    ("library_manager", ("steinberg library manager", "native access", "activation manager")),
    ("utility", ("cpu-z", "ccleaner", "7-zip", "everything", "powertoys", "obs", "discord", "telegram", "slack", "zoom", "teams")),
]


def categorise(name: str, target: str) -> str:
    haystack = f"{name} {target}".lower()
    for category, needles in CATEGORY_RULES:
        for needle in needles:
            if needle in haystack:
                return category
    return "other"


def shortcut_targets() -> list[dict]:
    """Every Start Menu shortcut, with its target."""
    roots = [
        Path(os.environ.get("APPDATA", "")) / "Microsoft/Windows/Start Menu/Programs",
        Path(os.environ.get("ProgramData", "")) / "Microsoft/Windows/Start Menu/Programs",
    ]
    found: dict[str, dict] = {}
    for root in roots:
        if not root.is_dir():
            continue
        for dirpath, _dirnames, filenames in os.walk(root):
            for fn in filenames:
                if not fn.lower().endswith(".lnk"):
                    continue
                lnk = Path(dirpath) / fn
                target = ""
                try:
                    out = subprocess.run(
                        ["powershell", "-NoProfile", "-Command",
                         f"$s=(New-Object -ComObject WScript.Shell).CreateShortcut('{lnk}');"
                         "Write-Output $s.TargetPath"],
                        capture_output=True, text=True, timeout=20,
                    )
                    target = out.stdout.strip()
                except Exception:
                    target = ""
                if not target or "Windows" in target and "Apps" not in target:
                    continue
                name = lnk.stem
                key = name.lower()
                entry = found.get(key)
                if entry is None:
                    found[key] = {
                        "name": name,
                        "target": target,
                        "category": categorise(name, target),
                    }
                elif not entry["target"]:
                    entry["target"] = target
    return list(found.values())


def installed_apps() -> list[dict]:
    """The Windows uninstall registry: what is actually installed."""
    ps = (
        "$paths = @('HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',"
        "'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',"
        "'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*');"
        "Get-ItemProperty $paths -ErrorAction SilentlyContinue |"
        "Where-Object { $_.DisplayName } |"
        "Select-Object DisplayName, DisplayVersion, Publisher, InstallLocation |"
        "ConvertTo-Json -Compress"
    )
    try:
        out = subprocess.run(["powershell", "-NoProfile", "-Command", ps],
                             capture_output=True, text=True, timeout=180)
        data = json.loads(out.stdout or "[]")
    except Exception:
        return []
    if isinstance(data, dict):
        data = [data]
    apps = []
    for d in data:
        name = str(d.get("DisplayName") or "").strip()
        if not name:
            continue
        apps.append({
            "name": name,
            "version": str(d.get("DisplayVersion") or ""),
            "publisher": str(d.get("Publisher") or ""),
            "install_location": str(d.get("InstallLocation") or ""),
            "category": categorise(name, str(d.get("InstallLocation") or "")),
        })
    apps.sort(key=lambda a: a["name"].lower())
    return apps


def tool_folders() -> list[dict]:
    """The owner's Desktop tool folders and their contents."""
    out = []
    for folder, kind, purpose in TOOL_FOLDERS:
        p = DESKTOP / folder
        if not p.is_dir():
            continue
        entries = []
        for item in sorted(p.iterdir(), key=lambda i: i.name.lower()):
            if item.is_dir():
                count = sum(1 for _ in item.rglob("*") if _.is_file())
                entries.append({"name": item.name, "kind": "directory", "files": count})
            else:
                entries.append({"name": item.name, "kind": "file", "bytes": item.stat().st_size})
        out.append({
            "name": folder,
            "kind": kind,
            "purpose": purpose,
            "path": str(p),
            "entries": entries,
        })
    return out


def yaml_escape(text: str) -> str:
    return '"' + str(text).replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ") + '"'


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default=str(REPO / "docs" / "APPLICATION-REGISTRY.yaml"))
    args = ap.parse_args()

    shortcuts = shortcut_targets()
    apps = installed_apps()
    folders = tool_folders()

    shortcut_names = {s["name"].lower() for s in shortcuts}
    by_category: dict[str, int] = {}
    for s in shortcuts:
        by_category[s["category"]] = by_category.get(s["category"], 0) + 1

    lines: list[str] = []
    lines.append("# " + "=" * 76)
    lines.append("# WORKSPACE APPLICATION REGISTRY")
    lines.append("# " + "=" * 76)
    lines.append("# GENERATED by tools/generate_application_registry.py.")
    lines.append("#")
    lines.append("# What is installed on this machine, what the owner has chosen to")
    lines.append("# surface, and where the tool folders are. Aetherius has to be able to")
    lines.append("# understand and control these, so the capability analysis is made")
    lines.append("# against this list rather than against a guess about what a modern")
    lines.append("# workstation contains.")
    lines.append("#")
    lines.append("# Two views of the same machine, deliberately kept separate:")
    lines.append("#   shortcuts - what the owner actually launches")
    lines.append("#   installed - what the machine actually has")
    lines.append("# A shortcut with no install record is a stale link; an install with no")
    lines.append("# shortcut is something not yet surfaced.")
    lines.append("# " + "=" * 76)
    lines.append('schema_version: "1.0.0"')
    lines.append(f'source_date: "{datetime.now(tz=timezone.utc).strftime("%Y-%m-%d")}"')
    lines.append("")
    lines.append("totals:")
    lines.append(f"  shortcuts: {len(shortcuts)}")
    lines.append(f"  installed: {len(apps)}")
    lines.append(f"  tool_folders: {len(folders)}")
    lines.append("")
    lines.append("shortcuts_by_category:")
    for cat in sorted(by_category):
        lines.append(f"  {cat}: {by_category[cat]}")
    lines.append("")
    lines.append("tool_folders:")
    for f in folders:
        lines.append(f"  - name: {yaml_escape(f['name'])}")
        lines.append(f"    kind: {f['kind']}")
        lines.append(f"    purpose: {yaml_escape(f['purpose'])}")
        lines.append(f"    path: {yaml_escape(f['path'])}")
        lines.append("    entries:")
        for e in f["entries"]:
            if e["kind"] == "directory":
                lines.append(f"      - name: {yaml_escape(e['name'])}")
                lines.append("        kind: directory")
                lines.append(f"        files: {e['files']}")
            else:
                lines.append(f"      - name: {yaml_escape(e['name'])}")
                lines.append("        kind: file")
                lines.append(f"        bytes: {e['bytes']}")
    lines.append("")
    lines.append("shortcuts:")
    for s in sorted(shortcuts, key=lambda x: x["name"].lower()):
        lines.append(f"  - name: {yaml_escape(s['name'])}")
        lines.append(f"    target: {yaml_escape(s['target'])}")
        lines.append(f"    category: {s['category']}")
    lines.append("")
    lines.append("installed:")
    for a in apps:
        lines.append(f"  - name: {yaml_escape(a['name'])}")
        if a["version"]:
            lines.append(f"    version: {yaml_escape(a['version'])}")
        if a["publisher"]:
            lines.append(f"    publisher: {yaml_escape(a['publisher'])}")
        lines.append(f"    category: {a['category']}")
        if a["install_location"]:
            lines.append(f"    install_location: {yaml_escape(a['install_location'])}")

    out = Path(args.out)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {out}")
    print(f"  {len(shortcuts)} shortcuts, {len(apps)} installed apps, {len(folders)} tool folders")
    for cat in sorted(by_category):
        print(f"  {cat}: {by_category[cat]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
