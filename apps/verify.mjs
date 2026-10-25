#!/usr/bin/env node
/**
 * Run the test suite of every built Aetherius OS application slice.
 *
 * The root Vitest suite deliberately excludes apps/**; the slices are
 * dependency-free TypeScript run directly by Node 24's type stripping. This
 * runner discovers only the slices that declare one of our package names, so
 * an unrelated vendored app with its own package.json is not executed by
 * accident.
 *
 * Exit code is non-zero if any slice fails. A slice with no test script is
 * reported, not silently skipped.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const slices = [];

for (const entry of readdirSync(root).sort()) {
  const dir = join(root, entry);
  if (!statSync(dir).isDirectory()) continue;
  const packagePath = join(dir, "package.json");
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  } catch {
    continue;
  }
  if (!String(pkg.name ?? "").startsWith("@aetherius/")) continue;
  slices.push({ dir, name: pkg.name, test: pkg.scripts?.test });
}

if (slices.length === 0) {
  console.error("no @aetherius application slices found");
  process.exit(1);
}

const results = [];
for (const slice of slices) {
  const started = Date.now();
  process.stdout.write(`\n== ${slice.name} ==\n`);
  if (!slice.test) {
    console.error(`  no test script in ${slice.dir}`);
    results.push({ name: slice.name, ok: false, seconds: 0 });
    continue;
  }
  const run = spawnSync("npm test --silent", {
    cwd: slice.dir,
    stdio: "inherit",
    shell: true,
  });
  results.push({ name: slice.name, ok: run.status === 0, seconds: (Date.now() - started) / 1000 });
}

process.stdout.write("\n== summary ==\n");
for (const result of results) {
  process.stdout.write(
    `  ${result.ok ? "PASS" : "FAIL"}  ${result.name} (${result.seconds.toFixed(1)}s)\n`,
  );
}
const failed = results.filter((result) => !result.ok);
process.stdout.write(`  ${results.length - failed.length}/${results.length} slices passed\n`);
process.exit(failed.length === 0 ? 0 : 1);
