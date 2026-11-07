#!/usr/bin/env node
/**
 * Generate THIRD_PARTY_NOTICES.md from the CycloneDX SBOM.
 *
 * The SBOM is the inventory; this script only formats it. It never invents a
 * licence. Components without a declared licence are listed as UNKNOWN so the
 * gap is visible instead of hidden.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sbomPath = join(repoRoot, "release", "evidence", "sbom.cdx.json");
const outputPath = join(repoRoot, "THIRD_PARTY_NOTICES.md");
const sbomSource = relative(repoRoot, sbomPath).split("\\").join("/");

const rawSbom = readFileSync(sbomPath, "utf8").replace(/^\uFEFF/, "");
const sbom = JSON.parse(rawSbom);
const components = Array.isArray(sbom.components) ? sbom.components : [];

function licenceOf(component) {
  const entries = Array.isArray(component.licenses) ? component.licenses : [];
  const names = entries
    .map((entry) => entry?.license?.id ?? entry?.license?.name ?? entry?.expression ?? null)
    .filter(Boolean);
  return names.length ? [...new Set(names)].sort().join(", ") : "UNKNOWN";
}

const rows = components
  .map((component) => ({
    name: component.name ?? "UNKNOWN",
    version: component.version ?? "UNKNOWN",
    licence: licenceOf(component),
    scope: component.scope ?? "UNKNOWN",
    purl: component.purl ?? "",
  }))
  .sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));

const unknown = rows.filter((row) => row.licence === "UNKNOWN");
const licenceCounts = new Map();
for (const row of rows) {
  for (const licence of row.licence.split(", ")) {
    licenceCounts.set(licence, (licenceCounts.get(licence) ?? 0) + 1);
  }
}

const summary = [...licenceCounts.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([licence, count]) => `| ${licence} | ${count} |`)
  .join("\n");

const table = rows
  .map((row) => `| \`${row.name}\` | ${row.version} | ${row.licence} | ${row.scope} |`)
  .join("\n");

const content = `# Third-Party Notices

**Generated:** ${new Date().toISOString()}
**Source:** \`${sbomSource}\` (CycloneDX ${sbom.specVersion ?? "unknown"})
**Components:** ${rows.length}
**Unknown licences:** ${unknown.length}

This inventory is generated from the SBOM. It is not legal advice. Before
distribution, review every licence against your distribution model, preserve
required notices, and publish source where a copyleft licence requires it.

## Licence summary

| Licence | Components |
|---|---:|
${summary}

## Components

| Package | Version | Licence | Scope |
|---|---|---|---|
${table}

${
  unknown.length
    ? `## Components with no declared licence

${unknown.map((row) => `- \`${row.name}@${row.version}\``).join("\n")}

Resolve these before release. An unknown licence is not permission.
`
    : "## Components with no declared licence\n\nNone. Every component declares a licence.\n"
}
## Scope of this file

This file covers the JavaScript/Node dependencies recorded in the SBOM. It does
**not** cover:

- Python kernel dependencies are included from installed package metadata, with
  runtime and dev scope marked. Build tooling such as setuptools is not included.
- Container images in \`deploy/selfhost/\` — their licences are listed in
  \`deploy/selfhost/README.md\`.
- Fonts, icons, datasets, media, or other assets not present in the SBOM.
- Services used at runtime but not distributed.

Regenerate with:

\`\`\`sh
node scripts/release-sbom.mjs
\`\`\`
`;

writeFileSync(outputPath, content, "utf8");
console.log(
  JSON.stringify(
    {
      output: "THIRD_PARTY_NOTICES.md",
      components: rows.length,
      unknownLicences: unknown.length,
      licences: Object.fromEntries(licenceCounts),
    },
    null,
    2,
  ),
);
process.exitCode = unknown.length === 0 ? 0 : 2;
