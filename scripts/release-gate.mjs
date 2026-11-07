#!/usr/bin/env node
/**
 * Fail-closed public-release gate.
 *
 * This script does not build, sign, install, or approve anything. It only
 * checks that the evidence a public release requires is present and honest.
 * A missing or negative check is a blocker, not a warning.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checks = [];

function add(id, passed, detail, evidence = null, severity = "blocker") {
  checks.push({ id, passed: Boolean(passed), detail, evidence, severity });
}

function readJson(relativePath) {
  const path = join(repoRoot, relativePath);
  if (!existsSync(path)) return { exists: false, path, value: null, error: null };
  try {
    return { exists: true, path, value: JSON.parse(readFileSync(path, "utf8")), error: null };
  } catch (error) {
    return { exists: true, path, value: null, error: String(error) };
  }
}

function firstExisting(paths) {
  return paths.find((path) => existsSync(join(repoRoot, path))) ?? null;
}

function readText(relativePath) {
  const path = join(repoRoot, relativePath);
  if (!existsSync(path)) return { exists: false, path, text: null };
  return { exists: true, path, text: readFileSync(path, "utf8") };
}

function hasPlaceholder(text) {
  if (!text) return true;
  const upper = text.toUpperCase();
  return ["TODO", "CHANGE_ME", "PLACEHOLDER", "TBD", "NOT PERFORMED"].some((token) =>
    upper.includes(token),
  );
}

// 1. Release scope is an owner decision, never inferred.
const scope = readJson("release/release-scope.json");
add(
  "release-scope",
  scope.exists &&
    scope.value?.status === "APPROVED" &&
    typeof scope.value?.version === "string" &&
    scope.value.version !== "0.0.0" &&
    Array.isArray(scope.value?.platforms) &&
    scope.value.platforms.length > 0 &&
    Array.isArray(scope.value?.inRelease) &&
    scope.value.inRelease.length > 0,
  scope.exists
    ? "release/release-scope.json must be APPROVED with a real version, platforms, and in-release list"
    : "release/release-scope.json is missing; scope is OWNER_GATED",
  "release/release-scope.json",
);

// 2. Package metadata must not still be a private development placeholder.
const pkg = readJson("package.json");
const version = pkg.value?.version;
add(
  "package-version",
  pkg.exists && typeof version === "string" && version !== "0.0.0" && pkg.value?.private === false,
  `package.json version=${version ?? "missing"} private=${pkg.value?.private ?? "missing"}; public release needs a real version and private=false`,
  "package.json",
);

// 3. Legal and disclosure documents. Existence alone is not evidence: an
// empty or placeholder document must not turn the gate green.
const license = firstExisting(["LICENSE", "LICENSE.md", "LICENSE.txt"]);
const licenseText = license ? readText(license).text : null;
add(
  "license",
  Boolean(license && licenseText && licenseText.length > 200 && !hasPlaceholder(licenseText)),
  "A real LICENSE file with the chosen terms is required; placeholders do not count",
  license,
);

const securityPolicy = firstExisting(["SECURITY.md", "docs/SECURITY.md"]);
const securityText = securityPolicy ? readText(securityPolicy).text : null;
add(
  "security-policy",
  Boolean(
    securityPolicy &&
      securityText &&
      securityText.length > 200 &&
      !hasPlaceholder(securityText) &&
      /(security@|mailto:|https:\/\/)/i.test(securityText),
  ),
  "A security policy with a real disclosure contact (email or HTTPS URL) is required",
  securityPolicy,
);

const privacy = firstExisting(["docs/PRIVACY.md", "docs/privacy-policy.md", "PRIVACY.md"]);
const privacyText = privacy ? readText(privacy).text : null;
add(
  "privacy-policy",
  Boolean(
    privacy &&
      privacyText &&
      privacyText.length > 500 &&
      !hasPlaceholder(privacyText) &&
      /(reviewed|approved)/i.test(privacyText),
  ),
  "A reviewed privacy policy (not a draft or placeholder) is required",
  privacy,
);

const notices = firstExisting(["THIRD_PARTY_NOTICES.md", "NOTICE", "NOTICE.md"]);
const noticesText = notices ? readText(notices).text : null;
const noticeCount = noticesText?.match(/Components:\**\s*(\d+)/i);
add(
  "third-party-notices",
  Boolean(
    notices &&
      noticesText &&
      !hasPlaceholder(noticesText) &&
      /Generated:/i.test(noticesText) &&
      noticeCount &&
      Number(noticeCount[1]) > 0,
  ),
  "A generated third-party notices file with a non-zero component count is required",
  notices,
);

add(
  "owner-inputs",
  existsSync(join(repoRoot, "docs/OWNER-REQUIRED-INPUTS.md")),
  "Owner-required inputs must be documented",
  "docs/OWNER-REQUIRED-INPUTS.md",
);

// 4. SBOM. Release evidence is deliberately outside dist/ so a build cannot
// delete it. Legacy dist paths are still accepted for older checkouts.
const sbomCandidates = [
  "release/evidence/sbom.cdx.json",
  "release/sbom.cdx.json",
  "dist/release/sbom.cdx.json",
  "dist/sbom.cdx.json",
];
const sbomPath = sbomCandidates.find((path) => existsSync(join(repoRoot, path))) ?? null;
const sbom = sbomPath ? readJson(sbomPath) : { exists: false, value: null };
const sbomValue = sbom.value;
add(
  "sbom",
  Boolean(
    sbomValue &&
      sbomValue.bomFormat === "CycloneDX" &&
      Array.isArray(sbomValue.components) &&
      sbomValue.components.length > 0,
  ),
  "A CycloneDX SBOM with components is required at release/evidence/sbom.cdx.json",
  sbomPath ?? "release/evidence/sbom.cdx.json",
);

// 5. Signed artifacts. A checksum is not a signature. Artifacts live in
// release/artifacts/ so `vite build` cannot delete them; dist/release/ is
// accepted as a legacy location.
const artifactExts = [".msix", ".deb", ".rpm", ".apk", ".aab", ".dmg", ".pkg", ".zip", ".AppImage", ".exe"];
const artifactDirs = ["release/artifacts", "dist/release"]
  .map((path) => join(repoRoot, path))
  .filter((path) => existsSync(path) && statSync(path).isDirectory());
const artifactEntries = artifactDirs.flatMap((dir) =>
  readdirSync(dir)
    .filter((name) => artifactExts.some((ext) => name.endsWith(ext)))
    .map((name) => ({ dir, name })),
);
const signedArtifacts = artifactEntries.filter(({ dir, name }) =>
  [".sig", ".asc", ".p7s", ".minisig"].some((ext) => existsSync(join(dir, `${name}${ext}`))),
);
add(
  "signed-artifacts",
  artifactEntries.length > 0 && signedArtifacts.length === artifactEntries.length,
  `artifacts=${artifactEntries.length} signed=${signedArtifacts.length}; every artifact needs a detached signature`,
  "release/artifacts/",
);

// 6. Independent security and accessibility audits.
const securityAudit = readJson("docs/evidence/security-audit.json");
add(
  "security-audit",
  securityAudit.exists &&
    securityAudit.value?.status === "PASS" &&
    securityAudit.value?.independent === true &&
    typeof securityAudit.value?.auditor === "string" &&
    securityAudit.value.auditor.length > 0 &&
    Array.isArray(securityAudit.value?.findings),
  "An independent penetration test with PASS status and named auditor is required",
  "docs/evidence/security-audit.json",
);

const accessibilityAudit = readJson("docs/evidence/accessibility-audit.json");
add(
  "accessibility-audit",
  accessibilityAudit.exists &&
    accessibilityAudit.value?.status === "PASS" &&
    accessibilityAudit.value?.standard === "WCAG 2.2 AA" &&
    accessibilityAudit.value?.independent === true &&
    typeof accessibilityAudit.value?.auditor === "string" &&
    accessibilityAudit.value.auditor.length > 0,
  "An independent WCAG 2.2 AA audit with PASS status and named auditor is required",
  "docs/evidence/accessibility-audit.json",
);

// 7. Installation, rollback, and performance evidence.
const install = readJson("docs/evidence/install-matrix.json");
add(
  "install-matrix",
  install.exists &&
    install.value?.status === "PASS" &&
    Array.isArray(install.value?.platforms) &&
    install.value.platforms.length > 0 &&
    install.value.platforms.every((p) => p?.install === "PASS" && p?.launch === "PASS"),
  "Install and launch must PASS on every declared platform",
  "docs/evidence/install-matrix.json",
);

const rollback = readJson("docs/evidence/rollback.json");
add(
  "rollback",
  rollback.exists && rollback.value?.status === "PASS" && Array.isArray(rollback.value?.results) && rollback.value.results.length > 0,
  "Rollback must be exercised and recorded as PASS",
  "docs/evidence/rollback.json",
);

const performance = readJson("docs/evidence/performance.json");
add(
  "performance",
  performance.exists && performance.value?.status === "PASS" && typeof performance.value?.p95Ms === "number",
  "Performance evidence with a measured p95 is required",
  "docs/evidence/performance.json",
);

// 8. Full acceptance fixtures, not structural-only.
const fixtures = readJson("tests/fixtures/fixture-results.json");
add(
  "full-acceptance-fixtures",
  fixtures.exists &&
    fixtures.value?.fullAcceptance === true &&
    fixtures.value?.passed === fixtures.value?.total &&
    typeof fixtures.value?.total === "number" &&
    fixtures.value.total >= 4,
  "Full acceptance fixtures (DOCX/XLSX/PPTX/PDF/media/CAD/BIM/MIDI/collaboration) must pass; structural-only results do not count",
  "tests/fixtures/fixture-results.json",
);

// 9. Five-star benchmark must be measured, not asserted.
const benchmark = readJson("tests/fixtures/benchmark-results.json");
add(
  "five-star-benchmark",
  benchmark.exists &&
    (benchmark.value?.overall === "FIVE_STAR" || benchmark.value?.overall === "5_STAR") &&
    benchmark.value?.weightedScore === 100,
  "Every benchmark dimension must independently measure 5/5; overall must be FIVE_STAR with score 100",
  "tests/fixtures/benchmark-results.json",
);

// 10. Kernel claims must stay honest. This can pass while the kernel is partial.
const kernelManifest = readJson("kernel/compute/manifest.json");
const claims = kernelManifest.value?.claims ?? {};
add(
  "kernel-honesty",
  kernelManifest.exists &&
    claims.ternary_hardware === false &&
    claims.quantum_hardware === false &&
    claims.bootable_general_purpose_os === false,
  "Kernel claims must not assert ternary hardware, quantum hardware, or a bootable general-purpose OS without evidence",
  "kernel/compute/manifest.json",
);

add(
  "kernel-status",
  kernelManifest.value?.status === "COMPLETE",
  `Kernel status is ${kernelManifest.value?.status ?? "missing"}; PARTIAL_COMPLETE is a warning unless the release scope includes the kernel`,
  "kernel/compute/manifest.json",
  "warning",
);

// 11. Self-host stack presence.
add(
  "selfhost-stack",
  existsSync(join(repoRoot, "deploy/selfhost/docker-compose.yml")),
  "The self-hosted deployment template must be present",
  "deploy/selfhost/docker-compose.yml",
);

const blockers = checks.filter((c) => c.severity === "blocker" && !c.passed);
const warnings = checks.filter((c) => c.severity === "warning" && !c.passed);
const passed = checks.filter((c) => c.passed).length;

const report = {
  schema_version: "1.0.0",
  generated_at: new Date().toISOString(),
  product: pkg.value?.name ?? "aetherius-os",
  version: version ?? null,
  verdict: blockers.length === 0 ? "RELEASABLE" : "NOT_RELEASABLE",
  passed,
  blockers: blockers.length,
  warnings: warnings.length,
  checks,
  note:
    "RELEASABLE requires every blocker to pass. This gate does not replace legal, security, accessibility, or store review.",
};

if (process.env.RELEASE_GATE_OUT) {
  const outPath = resolve(repoRoot, process.env.RELEASE_GATE_OUT);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify(report, null, 2));
process.exitCode = blockers.length === 0 ? 0 : 1;
