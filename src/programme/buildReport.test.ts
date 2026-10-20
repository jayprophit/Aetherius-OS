import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
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

function manifestsFor(): Record<string, BuildManifest | null> {
  const out: Record<string, BuildManifest | null> = {};
  for (const entry of registry.projects) {
    const full = join(PROJECTS_ROOT, entry.manifest);
    if (!existsSync(full)) {
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
