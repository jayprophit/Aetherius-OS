#!/usr/bin/env node
/**
 * Generate a CycloneDX SBOM without shell redirection.
 *
 * Shell redirection on Windows can produce UTF-16 or a BOM, which breaks
 * downstream JSON parsers. This script captures npm's stdout and writes UTF-8
 * without a BOM, then regenerates the third-party notices from the result.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Release evidence lives outside dist/ so `vite build` cannot delete it.
const outDir = join(repoRoot, "release", "evidence");
const sbomPath = join(outDir, "sbom.cdx.json");

const npmCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
const useNpmCli = existsSync(npmCli);
const command = useNpmCli ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
const prefix = useNpmCli ? [npmCli] : [];

mkdirSync(outDir, { recursive: true });

const result = spawnSync(
  command,
  [...prefix, "sbom", "--sbom-format", "cyclonedx", "--sbom-type", "application"],
  {
    cwd: repoRoot,
    encoding: "utf8",
    shell: !useNpmCli && process.platform === "win32",
    timeout: 180_000,
  },
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "npm sbom failed");
  process.exit(result.status ?? 1);
}

const raw = (result.stdout ?? "").replace(/^\uFEFF/, "");
const sbom = JSON.parse(raw);
if (sbom.bomFormat !== "CycloneDX" || !Array.isArray(sbom.components)) {
  console.error("npm sbom did not produce a CycloneDX document with components");
  process.exit(1);
}

// The JS SBOM only covers Node packages. The compute kernel also ships Python
// dependencies, so append them from installed distribution metadata. Build
// tooling is intentionally excluded and documented in THIRD_PARTY_NOTICES.md.
const pythonCommand = process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");
const pythonSbom = spawnSync(pythonCommand, [join(repoRoot, "scripts", "collect-python-sbom.py")], {
  cwd: repoRoot,
  encoding: "utf8",
  timeout: 120_000,
});
if (pythonSbom.status !== 0) {
  console.error(pythonSbom.stderr || pythonSbom.stdout || "Python SBOM collection failed");
  process.exit(pythonSbom.status ?? 1);
}
const pythonComponents = JSON.parse((pythonSbom.stdout ?? "").replace(/^\uFEFF/, ""));
const knownPurls = new Set(sbom.components.map((component) => component.purl).filter(Boolean));
for (const component of pythonComponents) {
  if (component.purl && knownPurls.has(component.purl)) continue;
  sbom.components.push(component);
  if (component.purl) knownPurls.add(component.purl);
}

writeFileSync(sbomPath, `${JSON.stringify(sbom, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      output: "release/evidence/sbom.cdx.json",
      bomFormat: sbom.bomFormat,
      specVersion: sbom.specVersion,
      components: sbom.components.length,
      pythonComponents: pythonComponents.length,
    },
    null,
    2,
  ),
);

const notices = spawnSync(
  process.execPath,
  [join(repoRoot, "scripts", "generate-third-party-notices.mjs")],
  { cwd: repoRoot, encoding: "utf8", timeout: 120_000 },
);
process.stdout.write(notices.stdout ?? "");
process.stderr.write(notices.stderr ?? "");
process.exitCode = notices.status ?? 1;
