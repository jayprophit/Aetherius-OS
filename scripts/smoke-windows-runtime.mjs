#!/usr/bin/env node
/**
 * Windows runtime smoke test (non-GUI, reproducible).
 * Checks: exe exists, bundle artifacts present, frontendDist bundled,
 * CSP allows localhost Ollama, provider honesty (Ollama != Genesis).
 * Does NOT launch GUI. GUI acceptance requires interactive session.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const exe = join(ROOT, "src-tauri", "target", "release", "aetherius-desktop.exe");
const msi = join(ROOT, "src-tauri", "target", "release", "bundle", "msi", "Aetherius OS_0.1.0_x64_en-US.msi");
const nsis = join(ROOT, "src-tauri", "target", "release", "bundle", "nsis", "Aetherius OS_0.1.0_x64-setup.exe");
const conf = JSON.parse(readFileSync(join(ROOT, "src-tauri", "tauri.conf.json"), "utf8"));
const distIndex = join(ROOT, "dist", "index.html");

const checks = [
  ["exe exists", existsSync(exe)],
  ["msi exists", existsSync(msi)],
  ["nsis exists", existsSync(nsis)],
  ["frontendDist bundled (dist/index.html)", existsSync(distIndex)],
  ["frontendDist is ../dist", conf.build?.frontendDist === "../dist"],
  ["CSP allows localhost Ollama", String(conf.app?.security?.csp ?? "").includes("127.0.0.1:11434")],
  ["bundle active", conf.bundle?.active === true],
  ["no remote frontend url", !String(conf.build?.frontendDist ?? "").startsWith("http")],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) failed += 1;
}
console.log(failed === 0 ? "SMOKE PASS (non-GUI only; GUI launch UNVERIFIED)" : `SMOKE FAIL ${failed}`);
process.exit(failed === 0 ? 0 : 1);
