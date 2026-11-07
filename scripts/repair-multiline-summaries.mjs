#!/usr/bin/env node
/**
 * Repair multi-line plain scalars broken by the quote-repair script.
 *
 * `summary: "first line"` followed by indented continuation lines is
 * invalid YAML. Removing the quotes restores the original plain scalar.
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
  const linesArr = text.split("\n");
  let changed = false;
  for (let i = 0; i + 1 < linesArr.length; i++) {
    const line = linesArr[i];
    const match = line.match(/^(\s*(?:-\s*)?summary:\s+)"(.*)"\s*$/);
    if (!match) continue;
    const next = linesArr[i + 1];
    if (!/^\s+\S/.test(next)) continue;
    // A continuation line is indented deeper than the summary key and is not
    // itself a key: value pair.
    const indent = line.match(/^\s*/)[0].length;
    const nextIndent = next.match(/^\s*/)[0].length;
    if (nextIndent <= indent) continue;
    if (/^\s*[\w-]+\s*:/.test(next)) continue;
    if (/^\s*-\s/.test(next)) continue;
    linesArr[i] = line.replace(/"([^"]*)"$/, "$1");
    changed = true;
    lines += 1;
  }
  if (changed) {
    writeFileSync(path, linesArr.join("\n"), "utf8");
    files += 1;
    console.log(`unquoted multiline summary in ${dirName}/build.yaml`);
  }
}
console.log(`files: ${files}, lines: ${lines}`);
