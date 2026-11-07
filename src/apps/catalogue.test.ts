import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { APP_CATALOGUE, listAetheriusSlices } from "./catalogue";

/**
 * The app catalogue sync gate.
 *
 * The catalogue is derived output. This test fails when the committed file
 * differs from what the generator produces, so neither the Settings
 * Applications panel nor any other consumer can drift from the slices on
 * disk. Regenerate with:
 *
 *   node scripts/generate-app-catalogue.mjs
 */

const REPO_ROOT = resolve(join(__dirname, "..", ".."));
const CATALOGUE_PATH = join(REPO_ROOT, "src", "apps", "catalogue.ts");
const GENERATOR = join(REPO_ROOT, "scripts", "generate-app-catalogue.mjs");

describe("app catalogue", () => {
  it("is byte-identical to the generator output", () => {
    expect(existsSync(CATALOGUE_PATH)).toBe(true);
    const generated = execFileSync("node", [GENERATOR, "--stdout"], {
      encoding: "utf8",
      cwd: REPO_ROOT,
    });
    expect(readFileSync(CATALOGUE_PATH, "utf8")).toBe(generated);
  });

  it("covers every directory under apps/, including absorbed products", () => {
    const directories = new Set(APP_CATALOGUE.map((entry) => entry.directory));
    expect(directories.size).toBe(143);
    expect(directories.has("LedgerLands")).toBe(true);
    expect(directories.has("Poietek")).toBe(true);
    expect(directories.has("football-card-game")).toBe(true);
    expect(directories.has("aetherion-engine")).toBe(true);
    expect(directories.has("genesis-layer")).toBe(true);
    expect(directories.has("IDE-Workspace")).toBe(true);
    expect(directories.has("Food Wiki App")).toBe(true);
  });

  it("marks exactly the @aetherius slices as slices", () => {
    const slices = listAetheriusSlices();
    expect(slices.length).toBe(135);
    for (const slice of slices) {
      expect(slice.packageName?.startsWith("@aetherius/")).toBe(true);
      expect(slice.testScript).toBeTruthy();
    }
  });

  it("records an honest status for every entry", () => {
    for (const entry of APP_CATALOGUE) {
      expect(entry.status).toBeTruthy();
    }
  });
});
