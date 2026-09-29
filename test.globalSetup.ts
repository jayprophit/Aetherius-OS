import { readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";

/**
 * Global test setup: remove the temp directories this run created.
 *
 * Many suites build a real FileStateStore in a real temp directory. Those
 * directories were never cleaned up, so a machine that had been used for
 * development for a few weeks carried over a thousand of them
 * (%TEMP%\wf-*, %TEMP%\aetherius-*), which is both a leak and extra disk
 * contention for every parallel run.
 *
 * Safety rules, deliberately narrow:
 * - Only directories that appeared DURING this run are removed. Anything
 *   present at setup time is left untouched, so this can never delete a
 *   directory someone cares about.
 * - Only names matching the prefixes this suite is known to create.
 * - Failures are swallowed. Housekeeping must never fail a test run.
 */

const OWNED_PREFIXES = [
  "wf-",
  "wf-int-",
  "wf-sub-",
  "wf-pr-",
  "wf-rec-",
  "wf-rec2-",
  "wf-bad-",
  "wf-pin-",
  "aetherius-state-",
  "aetherius-run-",
  "aetherius-test-",
];

function ownedDirs(): Set<string> {
  const out = new Set<string>();
  let entries: string[] = [];
  try {
    entries = readdirSync(tmpdir());
  } catch {
    return out;
  }
  for (const name of entries) {
    if (!OWNED_PREFIXES.some((p) => name.startsWith(p))) continue;
    try {
      if (statSync(`${tmpdir()}/${name}`).isDirectory()) out.add(name);
    } catch {
      // Unreadable entry: not ours to reason about.
    }
  }
  return out;
}

let before = new Set<string>();

export function setup(): void {
  before = ownedDirs();
}

export function teardown(): void {
  const after = ownedDirs();
  let removed = 0;
  for (const name of after) {
    if (before.has(name)) continue;
    try {
      rmSync(`${tmpdir()}/${name}`, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
      removed += 1;
    } catch {
      // Best effort only.
    }
  }
  if (removed > 0) {
    console.log(`[temp] removed ${removed} test temp director${removed === 1 ? "y" : "ies"}`);
  }
}
