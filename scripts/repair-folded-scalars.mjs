#!/usr/bin/env node
/**
 * Reverse the quote-repair on folded scalar indicators.
 * `summary: ">-"` only ever appears where `summary: >-` was mangled;
 * no real summary is the two characters >-.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

let files = 0;
let lines = 0;
for (const dirName of readdirSync("apps").sort()) {
  const dir = join("apps", dirName);
  if (!statSync(dir).isDirectory()) continue;
  const path = join(dir, "build.yaml");
  if (!existsSync(path)) continue;
  const text = readFileSync(path, "utf8");
  const fixed = text.replace(/^(\s*summary:\s*)">-"$/gm, "$1>-");
  if (fixed !== text) {
    writeFileSync(path, fixed, "utf8");
    lines += (text.match(/summary: ">-"/g) ?? []).length;
    files += 1;
    console.log(`reverted folded scalar in ${dirName}/build.yaml`);
  }
}
console.log(`files: ${files}, lines: ${lines}`);
