#!/usr/bin/env node
/**
 * Keep apps/tsconfig.json in sync with the slices on disk.
 *
 * A typecheck that only includes the slices someone remembered to list is a
 * false signal. This script adds every @aetherius package's src/ and tests/
 * directories, preserving existing entries and appending new ones in sorted
 * order. Idempotent.
 *
 * Usage:
 *   node scripts/sync-app-tsconfig.mjs            # report
 *   node scripts/sync-app-tsconfig.mjs --apply
 */

import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APPS = "apps";
const TSCONFIG = join(APPS, "tsconfig.json");
const APPLY = process.argv.includes("--apply");

const config = JSON.parse(readFileSync(TSCONFIG, "utf8"));
const existing = new Set(config.include ?? []);
const additions = [];

for (const name of readdirSync(APPS).sort()) {
  const dir = join(APPS, name);
  if (!statSync(dir).isDirectory()) continue;
  const packagePath = join(dir, "package.json");
  if (!existsSync(packagePath)) continue;
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  } catch {
    continue;
  }
  if (!String(pkg.name ?? "").startsWith("@aetherius/")) continue;
  for (const part of ["src", "tests"]) {
    if (!existsSync(join(dir, part))) continue;
    const entry = `${name}/${part}`;
    if (!existing.has(entry)) additions.push(entry);
  }
}

additions.sort();
console.log(`existing include entries: ${existing.size}`);
console.log(`new include entries: ${additions.length}`);
for (const entry of additions) console.log(`  + ${entry}`);

if (APPLY && additions.length > 0) {
  config.include = [...config.include, ...additions];
  writeFileSync(TSCONFIG, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  console.log("written");
} else if (additions.length === 0) {
  console.log("already in sync");
}
