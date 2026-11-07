#!/usr/bin/env node
/**
 * Repair unquoted summary values in manifests written by
 * backfill-manifest-status.mjs before the quoting fix.
 */

import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APPS = "apps";
let fixed = 0;

for (const dirName of readdirSync(APPS).sort()) {
  const dir = join(APPS, dirName);
  if (!statSync(dir).isDirectory()) continue;
  const path = join(dir, "build.yaml");
  if (!existsSync(path)) continue;
  let text = readFileSync(path, "utf8");
  const lines = text.split("\n");
  let changed = false;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(\s*summary:\s+)(.+)$/);
    if (match && !match[2].startsWith('"')) {
      lines[i] = `${match[1]}"${match[2].replace(/"/g, '\\"')}"`;
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(path, lines.join("\n"), "utf8");
    console.log(`quoted summary in ${dirName}/build.yaml`);
    fixed += 1;
  }
}
console.log(`fixed: ${fixed}`);
