import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { loadBuildManifest, loadBuildRegistry, type BuildManifest } from "./buildManifest";
import { generateBuildReport } from "./buildReport";

/**
 * The build manifest report sync gate.
 *
 * The report is derived output. This test fails when the committed report
 * differs from what the generator produces, so the report can never drift
 * away from the sources it claims to describe. Regenerate with:
 *
 *   REGENERATE_BUILD_REPORT=1 npm test
 *
 * The same pattern the system capability registry uses, and for the same
 * reason: a report that is edited by hand stops describing the truth.
 */

const REPO_ROOT = resolve(join(__dirname, "..", ".."));
const DOCS = join(REPO_ROOT, "docs");
const PROJECTS_ROOT = resolve(join(REPO_ROOT, ".."));

const REGISTRY_PATH = join(DOCS, "BUILD-MANIFEST-REGISTRY.yaml");
const REPORT_PATH = join(DOCS, "BUILD-MANIFEST-REGISTRY.md");

const registry = loadBuildRegistry(readFileSync(REGISTRY_PATH, "utf8"));

/**
 * The manifests this repository can describe.
 *
 * A report that lives in a repository has to be reproducible from that
 * repository, or the byte-equality gate means nothing: a report
 * generated on the owner's machine, where thirty sibling repositories
 * are cloned, differs from the same report generated on a clean
 * checkout, and the gate would fail for a reason that has nothing to do
 * with the report.
 *
 * So the detail covers the projects whose manifests THIS repository
 * tracks, and the summary covers every project the registry knows
 * about, because the registry is committed here. The rest live in their
 * own repositories and are reported there.
 */
function manifestsFor(): Record<string, BuildManifest | null> {
  const out: Record<string, BuildManifest | null> = {};
  const tracked = new Set(
    execFileSync("git", ["-C", REPO_ROOT, "ls-files"], {
      encoding: "utf8",
    })
      .split("\n")
      .filter((line) => line.trim() !== ""),
  );
  const repoName = basename(REPO_ROOT);
  for (const entry of registry.projects) {
    const full = join(PROJECTS_ROOT, entry.manifest);
    const relative = entry.manifest.split("/").slice(1).join("/");
    const inThisRepository =
      entry.manifest.startsWith(`${repoName}/`) && tracked.has(relative);
    if (!inThisRepository || !existsSync(full)) {
      out[entry.id] = null;
      continue;
    }
    try {
      out[entry.id] = loadBuildManifest(readFileSync(full, "utf8"));
    } catch {
      out[entry.id] = null;
    }
  }
  return out;
}

describe("build manifest report", () => {
  it("is byte-identical to the generator output", () => {
    const generated = generateBuildReport({ registry, manifests: manifestsFor() });
    if (process.env.REGENERATE_BUILD_REPORT === "1") {
      writeFileSync(REPORT_PATH, generated, "utf8");
      expect(true).toBe(true);
      return;
    }
    expect(
      existsSync(REPORT_PATH),
      `${REPORT_PATH} does not exist; regenerate with REGENERATE_BUILD_REPORT=1`,
    ).toBe(true);
    expect(readFileSync(REPORT_PATH, "utf8")).toBe(generated);
  });

  it("is deterministic: the same inputs produce the same bytes", () => {
    const a = generateBuildReport({ registry, manifests: manifestsFor() });
    const b = generateBuildReport({ registry, manifests: manifestsFor() });
    expect(a).toBe(b);
  });

  it("names every registered project", () => {
    const report = generateBuildReport({ registry, manifests: manifestsFor() });
    for (const entry of registry.projects) {
      expect(report, entry.id).toContain(entry.id);
    }
  });
});
