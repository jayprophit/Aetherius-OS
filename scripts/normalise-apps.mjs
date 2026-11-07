#!/usr/bin/env node
/**
 * Normalise the application slices under apps/.
 *
 * The workspace grew by copying a scaffold into many folders. The scaffold
 * still contains its template tokens: the package name is `aetherius-$app`
 * or `$app`, and build.yaml contains `${app^}`. A package that does not
 * declare an @aetherius name is invisible to apps/verify.mjs, so 95 slices
 * were silently excluded from the application test run.
 *
 * This script is idempotent. It rewrites only files that still contain the
 * template tokens, and it derives every value from the directory name so a
 * second run changes nothing.
 *
 * Usage:
 *   node scripts/normalise-apps.mjs            # report only
 *   node scripts/normalise-apps.mjs --apply    # write changes
 */

import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APPS = "apps";
const APPLY = process.argv.includes("--apply");
const PLACEHOLDER_NAMES = new Set(["aetherius-$app", "$app"]);

const ACRONYMS = new Map(
  [
    "ai", "api", "ar", "crm", "csv", "cpu", "gpu", "http", "https", "ide", "json",
    "ml", "os", "pdf", "sql", "ui", "ux", "vr", "wav", "xml",
  ].map((word) => [word, word.toUpperCase()]),
);

function displayName(slug) {
  const words = slug.replace(/^aetherius-/, "").split("-").filter(Boolean);
  return words
    .map((word) => ACRONYMS.get(word) ?? `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function report(line) {
  console.log(`${APPLY ? "apply" : "check"}  ${line}`);
}

let packages = 0;
let manifests = 0;
const skipped = [];

for (const dirName of readdirSync(APPS).sort()) {
  const dir = join(APPS, dirName);
  if (!statSync(dir).isDirectory()) continue;
  const packagePath = join(dir, "package.json");
  const manifestPath = join(dir, "build.yaml");
  if (!existsSync(packagePath)) {
    if (existsSync(join(dir, "build.yaml"))) skipped.push(`${dirName} (no package.json)`);
    continue;
  }

  let pkg;
  try {
    pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  } catch {
    skipped.push(`${dirName} (unreadable package.json)`);
    continue;
  }

  if (!PLACEHOLDER_NAMES.has(pkg.name)) continue;

  const slug = dirName;
  const next = { ...pkg, name: `@aetherius/${slug}` };
  report(`package ${dirName}: ${pkg.name} -> ${next.name}`);
  packages += 1;
  if (APPLY) writeFileSync(packagePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");

  if (!existsSync(manifestPath)) continue;
  const original = readFileSync(manifestPath, "utf8");
  if (!original.includes("${app^}") && !original.includes("$app")) continue;

  const name = displayName(slug);
  let updated = original
    // Issue ids stay lowercase and stable: Notes-001 -> notes-001.
    .replaceAll("${app^}-", `${slug}-`)
    .replaceAll("${app^}", name)
    .replaceAll("aetherius-$app", slug)
    .replaceAll("$app", slug);

  if (updated !== original) {
    report(`manifest ${dirName}: replaced template tokens with "${name}"`);
    manifests += 1;
    if (APPLY) writeFileSync(manifestPath, updated, "utf8");
  }
}

console.log();
console.log(`packages ${APPLY ? "rewritten" : "to rewrite"}: ${packages}`);
console.log(`manifests ${APPLY ? "rewritten" : "to rewrite"}: ${manifests}`);
if (skipped.length > 0) {
  console.log(`skipped ${skipped.length}:`);
  for (const item of skipped) console.log(`  - ${item}`);
}
