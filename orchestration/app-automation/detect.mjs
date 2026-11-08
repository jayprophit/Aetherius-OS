#!/usr/bin/env node
/**
 * Detect installed applications from the Windows Start Menu and build a
 * machine-readable registry of how each one can be used safely.
 *
 *   node orchestration/app-automation/detect.mjs --dry-run
 *   node orchestration/app-automation/detect.mjs
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "orchestration", "app-automation", "registry.json");

export const CATEGORIES = {
  browser: ["brave", "firefox", "chrome", "edge", "opera", "vivaldi", "arc"],
  dev: ["code", "visual studio", "cursor", "clion", "cmake", "android", "docker", "ubuntu", "wsl", "git", "github desktop", "godot", "unity", "arduino", "ollama", "lm studio", "python", "idle", "antigravity", "bionic", "devin", "manus", "teamviewer"],
  agent: ["hermes", "openclaw", "kilo", "cline", "vibe", "freebuff", "codex", "opencode", "kimi", "qwen", "deepseek", "chatgpt", "claude", "gemini", "copilot"],
  creative: ["blender", "freecad", "kicad", "inkscape", "gimp", "meshlab", "lasergrbl", "cura", "ultimaker"],
  audio: ["audacity", "cubase", "fl studio", "guitar", "halion", "kristal", "melodyne", "mpc", "native access", "reason", "steinberg", "halion", "groove"],
  cad: ["freecad", "kicad", "librecad", "camotics", "openscad", "solid", "fusion"],
  utility: ["7-zip", "cocosdashboard", "epic games", "cube", "qbittorrent", "vlc"],
  game: ["epic games", "steam", "minecraft", "roblox"],
};

export const AUTOMATION_MODES = ["cli", "browser", "file", "ui-automation", "launch-only"];

export function classify(name) {
  const lower = String(name || "").toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some((keyword) => lower.includes(keyword))) return category;
  }
  return "utility";
}

export function appId(name) {
  return String(name || "app")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "app";
}

export function automationFor(entry) {
  const lower = `${entry.label || ""} ${entry.target || ""}`.toLowerCase();
  if (CATEGORIES.browser.some((k) => lower.includes(k))) return ["browser", "launch-only"];
  if (["ollama", "docker", "godot", "unity", "blender", "freecad", "gimp", "inkscape"].some((k) => lower.includes(k))) return ["cli", "file", "launch-only"];
  if (["code", "cursor", "visual studio", "clion", "cmake", "arduino", "kicad", "audacity"].some((k) => lower.includes(k))) return ["file", "cli", "launch-only"];
  if (["hermes", "openclaw", "kilo", "cline", "vibe", "freebuff", "opencode"].some((k) => lower.includes(k))) return ["cli", "launch-only"];
  return ["launch-only"];
}

function startMenuRoots(env = process.env) {
  return [
    join(env.APPDATA || "", "Microsoft", "Windows", "Start Menu", "Programs"),
    join(env.ProgramData || "C:\\ProgramData", "Microsoft", "Windows", "Start Menu", "Programs"),
  ].filter(Boolean);
}

export function collectShortcuts(roots = startMenuRoots(), { readdir = readdirSync, stat = statSync } = {}) {
  const found = [];
  function walk(dir) {
    let entries;
    try {
      entries = readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".lnk")) {
        found.push(full);
      }
    }
  }
  for (const root of roots) if (existsSync(root)) walk(root);
  return found.sort();
}

export function parseShortcutText(text) {
  // One record per line: target<TAB>args<TAB>workingDir
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [target = "", args = "", workingDir = ""] = line.split("\t");
      return { target: target.trim(), args: args.trim(), workingDir: workingDir.trim() };
    });
}

async function resolveShortcuts(paths) {
  const { writeFileSync, unlinkSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const tmpFile = join(tmpdir(), `aetherius-shortcuts-${Date.now()}.txt`);
  writeFileSync(tmpFile, paths.join("\n"), "utf8");
  const ps = [
    "$w = New-Object -ComObject WScript.Shell",
    `$paths = Get-Content "${tmpFile.replace(/\\/g, "\\\\")}" -Encoding UTF8 | Where-Object { $_.Trim() }`,
    "foreach ($p in $paths) {",
    "  try {",
    "    $s = $w.CreateShortcut($p)",
    '    $t = $s.TargetPath -replace "\\t", " "',
    '    $a = $s.Arguments -replace "\\t", " "',
    '    $d = $s.WorkingDirectory -replace "\\t", " "',
    '    $row = $t + "`t" + $a + "`t" + $d',
    "    Write-Output $row",
    '  } catch { Write-Output "`t`t" }',
    "}",
  ].join("\n");
  try {
    const result = await execFileAsync("powershell", ["-NoProfile", "-Command", ps], {
      timeout: 120000,
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    });
    return result.stdout;
  } finally {
    try {
      unlinkSync(tmpFile);
    } catch {
      /* temp cleanup best-effort */
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const outFlag = args.indexOf("--out");
  const out = outFlag >= 0 ? resolve(args[outFlag + 1]) : OUT;

  const roots = startMenuRoots();
  const shortcuts = collectShortcuts(roots);
  const text = await resolveShortcuts(shortcuts);
  const resolved = parseShortcutText(text);

  const entries = [];
  const seenIds = new Map();
  shortcuts.forEach((shortcut, index) => {
    const r = resolved[index] || { target: "", args: "", workingDir: "" };
    const label = shortcut.split(sep).pop().replace(/\.lnk$/i, "").replace(/ - Shortcut$/i, "");
    const category = classify(label);
    let id = appId(label);
    // de-duplicate ids deterministically
    if (seenIds.has(id)) {
      seenIds.set(id, seenIds.get(id) + 1);
      id = `${id}-${seenIds.get(id)}`;
    } else {
      seenIds.set(id, 1);
    }
    const safe = `"${r.target}" ${r.args} | working dir: ${r.workingDir || "(default)"}`;
    entries.push({
      id,
      label,
      category,
      shortcut,
      target: r.target,
      args: r.args,
      working_dir: r.workingDir,
      installed: Boolean(r.target) && existsSync(r.target),
      automation: automationFor({ label, target: r.target }),
      safe_dry_run: safe,
      notes: r.target ? "" : "shortcut target could not be resolved",
      checked_at: new Date().toISOString(),
    });
  });

  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const apps = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id, "en"));

  const registry = {
    schema_version: "1.0.0",
    generated_at: new Date().toISOString(),
    policy: {
      free_only: true,
      no_secrets: true,
      launch_requires_owner_approval: true,
      browser_automation_engine: "rea capture-browser-scenario / rea capture-web-screenshot",
      allow_paid_apps: false,
    },
    start_menu_roots: roots,
    count: apps.length,
    apps,
  };

  if (dryRun) {
    console.log(JSON.stringify({ count: apps.length, sample: apps.slice(0, 8) }, null, 2));
    return;
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(registry, null, 2) + "\n");
  console.log(`wrote ${apps.length} apps -> ${out}`);
}

if (resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`detect: ${error.message}`);
    process.exitCode = 1;
  });
}

export function loadRegistry(path = OUT) {
  return JSON.parse(readFileSync(path, "utf8"));
}
