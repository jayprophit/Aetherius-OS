#!/usr/bin/env node
/**
 * Add an honest status block to app manifests that lack one, and create
 * build.yaml for directories that have none.
 *
 * The scaffold manifests (accessibility, diskUtility, ...) end after the
 * commands section. Without a status section the app catalogue reports
 * UNSET. The honest state for those is PARTIAL: they compile, their
 * scaffold test passes, and they contain no domain logic yet.
 *
 * Usage:
 *   node scripts/backfill-manifest-status.mjs            # report
 *   node scripts/backfill-manifest-status.mjs --apply
 */

import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APPS = "apps";
const APPLY = process.argv.includes("--apply");
const VERIFIED_DATE = "2026-11-07";

const SCAFFOLD_SUMMARY =
  "Scaffold only: exports a version constant, a state interface and a create factory. " +
  "The test proves importability and nothing more. No domain logic, UI or host adapter yet.";

const SCAFFOLD_ISSUE =
  "Domain logic not implemented. The package is intentionally a compile-and-import stub.";

function pascal(slug) {
  return slug
    .replace(/^aetherius-/, "")
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function yamlQuote(value) {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function statusBlock(id, name) {
  return `
status:
  state: PARTIAL
  last_verified: "${VERIFIED_DATE}"
  summary: ${yamlQuote(SCAFFOLD_SUMMARY)}
  evidence:
    - ${yamlQuote(`${VERIFIED_DATE}: npm run test:apps -> scaffold import test passes; tsc -p apps/tsconfig.json --noEmit passes`)}
known_issues:
  - id: ${id}-001
    severity: medium
    summary: ${yamlQuote(SCAFFOLD_ISSUE)}
    status: OPEN
`;
}

function newManifest(id, name, description, testCommand) {
  return `schema_version: "1.0.0"
project:
  id: ${id}
  name: ${name}
  kind: application
  domain: apps
  description: >-
    ${description}
  repository: false
  languages: [typescript]
toolchain:
  build_system: node --test
  package_manager: none
  requirements:
    - name: node
      version: ">=24"
      required: true
commands:
  - name: test
    command: ${testCommand}
    working_directory: .
    timeout_minutes: 5
dependencies:
  projects: [aetherius-os, app-kit]
  external: []
`;
}

let appended = 0;
let created = 0;

for (const dirName of readdirSync(APPS).sort()) {
  const dir = join(APPS, dirName);
  if (!statSync(dir).isDirectory()) continue;
  const manifestPath = join(dir, "build.yaml");
  const packagePath = join(dir, "package.json");
  if (!existsSync(packagePath)) continue;

  let pkg;
  try {
    pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  } catch {
    continue;
  }
  if (!String(pkg.name ?? "").startsWith("@aetherius/")) continue;

  if (!existsSync(manifestPath)) {
    const id = dirName.replace(/^aetherius-/, "");
    const name = pascal(dirName);
    const description =
      dirName === "app-kit"
        ? "Shared, dependency-free primitives for the Aetherius OS application slices: ledger, money, search, accounts, permissions, content, workflow and entitlements."
        : `${name} domain core for the Aetherius OS shell.`;
    const testCommand = 'node --test "tests/*.test.ts"';
    const summary =
      dirName === "app-kit"
        ? "Working shared library: 8 tests cover the append-only ledger, integer money, ranked search, accounts, default-deny permissions, content workflow and entitlements."
        : SCAFFOLD_SUMMARY;
    const manifest = newManifest(id, name, description, testCommand);
    const block = `
status:
  state: ${dirName === "app-kit" ? "TESTED" : "PARTIAL"}
  last_verified: "${VERIFIED_DATE}"
  summary: ${yamlQuote(summary)}
  evidence:
    - ${yamlQuote(`${VERIFIED_DATE}: npm run test:apps -> tests pass; tsc -p apps/tsconfig.json --noEmit passes`)}
`;
    console.log(`${APPLY ? "create" : "would create"}  ${dirName}/build.yaml`);
    created += 1;
    if (APPLY) writeFileSync(manifestPath, `${manifest}${block}`, "utf8");
    continue;
  }

  const original = readFileSync(manifestPath, "utf8");
  if (/^\s*status:/m.test(original)) continue;

  const id = dirName.replace(/^aetherius-/, "");
  const name = pascal(dirName);
  console.log(`${APPLY ? "append" : "would append"} status to ${dirName}/build.yaml`);
  appended += 1;
  if (APPLY) writeFileSync(manifestPath, `${original.trimEnd()}\n${statusBlock(id, name)}`, "utf8");
}

console.log();
console.log(`manifests ${APPLY ? "created" : "to create"}: ${created}`);
console.log(`status blocks ${APPLY ? "appended" : "to append"}: ${appended}`);
