#!/usr/bin/env node
/**
 * Replace the scaffold's unsubstituted template tokens.
 *
 * Several slices were copied from a generator that emitted `{ pascal }`
 * instead of a concrete identifier. The result is not valid TypeScript and
 * the slice was invisible until the package names were normalised.
 *
 * Idempotent: only files containing a token are touched.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APPS = "apps";
const APPLY = process.argv.includes("--apply");

function words(name) {
  return name
    .replace(/^aetherius-/, "")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
}

function pascal(name) {
  return words(name)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join("");
}

function camel(name) {
  const value = pascal(name);
  return `${value[0].toLowerCase()}${value.slice(1)}`;
}

function title(name) {
  return words(name)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

const TOKENS = {
  pascal: (name) => pascal(name),
  camel: (name) => camel(name),
  kebab: (name) => name,
  title: (name) => title(name),
  app: (name) => name,
};

let files = 0;
let replacements = 0;
const seen = new Map();

for (const dirName of readdirSync(APPS).sort()) {
  const dir = join(APPS, dirName);
  if (!statSync(dir).isDirectory()) continue;
  for (const part of ["src", "tests"]) {
    const base = join(dir, part);
    let entries;
    try {
      entries = readdirSync(base, { recursive: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const file = join(base, entry);
      if (!/\.(ts|tsx)$/.test(file)) continue;
      let stat;
      try {
        stat = statSync(file);
      } catch {
        continue;
      }
      if (!stat.isFile()) continue;
      const original = readFileSync(file, "utf8");
      let updated = original;
      for (const [token, resolve] of Object.entries(TOKENS)) {
        const pattern = new RegExp(`\\{\\s*${token}\\s*\\}`, "g");
        const matches = updated.match(pattern);
        if (!matches) continue;
        replacements += matches.length;
        updated = updated.replaceAll(pattern, resolve(dirName));
      }
      if (updated === original) continue;
      files += 1;
      seen.set(dirName, (seen.get(dirName) ?? 0) + 1);
      if (APPLY) writeFileSync(file, updated, "utf8");
    }
  }
}

console.log(`${APPLY ? "rewrote" : "would rewrite"} ${files} file(s), ${replacements} token(s)`);
for (const [dir, count] of [...seen.entries()].sort()) {
  console.log(`  ${dir}: ${count} file(s)`);
}
