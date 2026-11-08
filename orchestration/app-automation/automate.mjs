#!/usr/bin/env node
/**
 * Launch and inspect detected applications, and emit bounded REA browser
 * commands for web automation.
 *
 *   node orchestration/app-automation/automate.mjs list
 *   node orchestration/app-automation/automate.mjs list --category browser
 *   node orchestration/app-automation/automate.mjs show --app firefox-developer-edition
 *   node orchestration/app-automation/automate.mjs open --app ollama --yes
 *   node orchestration/app-automation/automate.mjs browser --url https://example.com --scenario scenario.json
 */
import { existsSync, readFileSync } from "node:fs";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRegistry } from "./detect.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "orchestration", "app-automation", "registry.json");

export function validateUrl(raw) {
  let parsed;
  try {
    parsed = new URL(String(raw || ""));
  } catch {
    throw new Error("url is not a valid URL");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`url protocol must be http or https (got ${parsed.protocol})`);
  }
  return parsed.toString();
}

function findApp(id, registry) {
  const app = registry.apps.find((entry) => entry.id === id);
  if (!app) throw new Error(`unknown app id: ${id} (run: node orchestration/app-automation/automate.mjs list)`);
  return app;
}

function parse(argv) {
  const positional = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) flags[key] = true;
      else {
        flags[key] = next;
        index += 1;
      }
    } else {
      positional.push(token);
    }
  }
  return { positional, flags };
}

async function main() {
  const [command] = process.argv.slice(2);
  const { flags } = parse(process.argv.slice(3));
  const registry = loadRegistry(OUT);

  if (!command || command === "help" || command === "--help") {
    console.log("commands: list | show | open | browser");
    return;
  }

  if (command === "list") {
    const apps = registry.apps.filter((app) => !flags.category || app.category === flags.category);
    if (flags.category && apps.length === 0) throw new Error(`no apps in category ${flags.category}`);
    console.log(
      JSON.stringify(
        { count: apps.length, apps: apps.map((app) => ({ id: app.id, label: app.label, category: app.category, installed: app.installed, automation: app.automation })) },
        null,
        2
      )
    );
    return;
  }

  if (command === "show") {
    const app = findApp(flags.app, registry);
    console.log(JSON.stringify(app, null, 2));
    return;
  }

  if (command === "open") {
    const app = findApp(flags.app, registry);
    if (!flags.yes) {
      throw new Error(`refusing to launch without --yes. Dry-run: ${app.safe_dry_run}`);
    }
    if (!app.target || !existsSync(app.target)) throw new Error(`target not found: ${app.target}`);
    const extra = flags.arg ? [flags.arg] : [];
    const argList = [...(app.args ? [app.args] : []), ...extra];
    const cmdline = `"${app.target}" ${argList.join(" ")}`;
    console.log(`[app-automation] launching: ${cmdline}`);
    const child = spawn(app.target, [].concat(app.args || []).concat(extra).filter(Boolean), {
      cwd: app.working_dir && existsSync(app.working_dir) ? app.working_dir : ROOT,
      detached: true,
      stdio: "ignore",
      shell: false,
      windowsHide: false,
    });
    child.on("error", (error) => {
      console.error(`[app-automation] launch failed: ${error.message}`);
      process.exitCode = 1;
    });
    child.unref();
    console.log(JSON.stringify({ ok: true, app: app.id, pid: child.pid, pid_note: "GUI launched; stop it from the desktop." }));
    return;
  }

  if (command === "browser") {
    const url = validateUrl(flags.url);
    const scenario = flags.scenario;
    const evidence = flags.evidence ? resolve(flags.evidence) : join(ROOT, "rea-output", "browser-evidence.json");
    if (!evidence.startsWith(`${ROOT}${sep}`) || !evidence.toLowerCase().endsWith(".json")) {
      throw new Error("evidence must be a .json path inside the repository");
    }
    const reaArgs = scenario
      ? ["capture-browser-scenario", resolve(scenario), "--evidence_output", evidence]
      : ["capture-web-screenshot", url, "--evidence_output", evidence];
    const display = `rea ${reaArgs.join(" ")}`;
    if (!flags.yes) {
      console.log(JSON.stringify({ ok: true, mode: "dry-run", command: display, note: "add --yes to run REA" }, null, 2));
      return;
    }
    if (scenario && !existsSync(resolve(scenario))) throw new Error(`scenario not found: ${scenario}`);
    const { stdout, stderr } = await execFileAsync("rea", reaArgs, {
      cwd: ROOT,
      timeout: 300000,
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    });
    console.log(JSON.stringify({ ok: true, command: display, evidence: resolve(evidence), stdout: String(stdout).slice(0, 4000), stderr: String(stderr).slice(0, 2000) }, null, 2));
    return;
  }

  throw new Error(`unknown command: ${command}`);
}

if (resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`app-automation: ${error.message}`);
    process.exitCode = 1;
  });
}
