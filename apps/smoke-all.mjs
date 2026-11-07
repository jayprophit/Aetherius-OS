/**
 * Smoke test — imports every first-party app slice's public entry point.
 * Verifies the app exists, compiles under Node type stripping, and exports something.
 */
import { readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appsRoot = __dirname;
const dirs = readdirSync(appsRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("aetherius-"))
  .map((d) => d.name)
  .sort();

const results = [];
for (const name of dirs) {
  let entry = join(appsRoot, name, "src", "index.ts");
  if (!existsSync(entry)) {
    // fall back to the first non-test TypeScript source (e.g. desktop.ts)
    const srcDir = join(appsRoot, name, "src");
    if (existsSync(srcDir)) {
      const candidate = readdirSync(srcDir).find((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
      if (candidate) entry = join(srcDir, candidate);
    }
  }
  if (!existsSync(entry)) {
    results.push({ app: name, status: "NO_ENTRY" });
    continue;
  }
  try {
    const mod = await import(pathToFileURL(entry).href);
    const keys = Object.keys(mod);
    results.push({ app: name, status: keys.length > 0 ? "PASS" : "EMPTY", exports: keys.length });
  } catch (error) {
    results.push({ app: name, status: "FAIL", error: String(error?.message ?? error) });
  }
}

const pass = results.filter((r) => r.status === "PASS").length;
const fail = results.filter((r) => r.status === "FAIL").length;
const empty = results.filter((r) => r.status === "EMPTY").length;
const noEntry = results.filter((r) => r.status === "NO_ENTRY").length;

console.log(JSON.stringify({ total: results.length, pass, fail, empty, noEntry, results }, null, 2));
if (fail > 0 || empty > 0 || noEntry > 0) process.exitCode = 1;
