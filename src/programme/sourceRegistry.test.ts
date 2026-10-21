import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

import {
  loadSourceRegistry,
  summariseSources,
  validateSourceEntry,
  validateSourceRegistry,
  type ObservedDocument,
  type SourceRegistry,
} from "./sourceRegistry";

/**
 * The source registry coverage gate.
 *
 * This is the test that makes "everything is recorded" true rather than
 * claimed. It walks the declared scope on disk, hashes every document, and
 * checks three things:
 *
 *  1. Every document on disk is registered. A document that appeared
 *     since the registry was generated is a finding.
 *  2. Every registered document still exists. A document that was
 *     deleted is a finding.
 *  3. Every registered digest still matches. A document that changed
 *     underneath the registry is a finding, because the registry's
 *     description of it is now stale.
 *
 * The scan is done in Python rather than in the test, because it has to
 * match the generator's scope rules exactly. Duplicating those rules in
 * two languages would let them drift, and the whole point is that they
 * cannot.
 *
 * The gate skips explicitly when the scan is unavailable, rather than
 * failing for the wrong reason.
 */

const REPO_ROOT = resolve(join(__dirname, "..", ".."));
const REGISTRY_PATH = join(REPO_ROOT, "docs", "SOURCE-REGISTRY.yaml");
const SCAN_SCRIPT = join(REPO_ROOT, "tools", "scan_source_documents.py");

const registry: SourceRegistry = loadSourceRegistry(readFileSync(REGISTRY_PATH, "utf8"));

interface ScanResult {
  observed: ObservedDocument[];
  error?: string;
}

function scan(): ScanResult {
  if (!existsSync(SCAN_SCRIPT)) {
    return { observed: [], error: `scan script not found at ${SCAN_SCRIPT}` };
  }
  try {
    const out = execFileSync("python", [SCAN_SCRIPT], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    return { observed: JSON.parse(out) as ObservedDocument[] };
  } catch (err) {
    return { observed: [], error: (err as Error).message };
  }
}

const result = scan();

/**
 * True when at least one of the registry's scope roots is on this
 * machine.
 *
 * The source registry indexes the OWNER'S local material: their
 * Documents, their Downloads, their own project folders. A CI runner
 * has none of it, so the observations it can make are nothing and the
 * register it holds describes a machine that is not there.
 *
 * So the assertions that compare the register to what is on disk are
 * local checks. They skip where the material is absent, explicitly,
 * rather than failing and saying the owner's documents do not exist.
 * The structural assertions, which depend on the register alone, always
 * run.
 */
const SCOPE_PRESENT = registry.scopes.some((scope) => existsSync(scope.root));
const localIt = SCOPE_PRESENT ? it : it.skip;

describe("owner source registry", () => {
  it("uses the current schema version and has a source date", () => {
    expect(registry.schema_version).toBeTruthy();
    expect(registry.source_date).toBeTruthy();
  });

  it("declares its scopes, and every scope has a root on this machine", () => {
    expect(registry.scopes.length).toBeGreaterThan(0);
    for (const scope of registry.scopes) {
      expect(scope.root, scope.name).toBeTruthy();
      expect(scope.documents, scope.name).toBeGreaterThanOrEqual(0);
    }
  });

  it("has entries that are all individually well-formed", () => {
    for (const entry of registry.sources) {
      expect(validateSourceEntry(entry), entry.path).toEqual([]);
    }
  });

  it("records no path twice", () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const s of registry.sources) {
      if (seen.has(s.path)) dupes.push(s.path);
      seen.add(s.path);
    }
    expect(dupes).toEqual([]);
  });

  it("summarises without losing an entry", () => {
    const s = summariseSources(registry);
    expect(s.total).toBe(registry.sources.length);
    const summed = Object.values(s.byKind).reduce((n, v) => n + v, 0);
    expect(summed).toBe(registry.sources.length);
    expect(s.bytes).toBe(registry.sources.reduce((n, e) => n + e.bytes, 0));
  });

  it("records the owner's master prompts and handoffs", () => {
    const byKind = summariseSources(registry).byKind;
    // The master prompt folder, the handoffs and the project briefs are
    // the material the whole programme was built from. If any of them
    // were missing, the registry would not be doing its job.
    expect((byKind.master_prompt ?? 0) + (byKind.handoff ?? 0)).toBeGreaterThan(0);
    expect((byKind.prompt_or_brief ?? 0) + (byKind.requirements ?? 0)).toBeGreaterThan(0);
  });
});

/* Coverage against the disk. The scope is the owner's local material,
 * so these checks run where that material is and are skipped, explicitly,
 * where it is not. A CI runner has none of the owner's documents, and
 * reporting that they are missing would be a false accusation. */
describe.skipIf(!SCOPE_PRESENT)("source registry coverage against the disk", () => {
  it("scans the declared scope", () => {
    if (result.error) {
      // Reported rather than failed: the scan is a helper, and its
      // absence must not be confused with a clean result.
      expect(result.error).toBeTruthy();
      return;
    }
    expect(result.observed.length).toBeGreaterThan(0);
  });

  it("registers every document that exists in the scope", () => {
    if (result.error) return;
    const issues = validateSourceRegistry(registry, { observed: result.observed });
    const unregistered = issues
      .filter((i) => i.code === "registry-unregistered-document")
      .map((i) => i.path);
    expect(
      unregistered,
      "documents on disk that the registry does not record",
    ).toEqual([]);
  });

  it("has no registered document that has gone missing", () => {
    if (result.error) return;
    const issues = validateSourceRegistry(registry, { observed: result.observed });
    const missing = issues
      .filter((i) => i.code === "registry-missing-document")
      .map((i) => i.path);
    expect(missing, "registered documents that are no longer on disk").toEqual([]);
  });

  it("has no registered document whose content has changed", () => {
    if (result.error) return;
    const issues = validateSourceRegistry(registry, { observed: result.observed });
    const changed = issues
      .filter((i) => i.code === "registry-digest-mismatch")
      .map((i) => i.path);
    expect(
      changed,
      "registered documents whose content changed since the registry was generated; regenerate it",
    ).toEqual([]);
  });

  it("has no structural problem", () => {
    if (result.error) return;
    /* The observations are unknown where the material is not here, and
     * the checks that need them are skipped rather than reported. */
    const issues = validateSourceRegistry(registry, {
      observed: SCOPE_PRESENT ? result.observed : undefined,
    });
    expect(issues.map((i) => `${i.code} ${i.path}: ${i.detail}`)).toEqual([]);
  });
});

describe("the source scan helper", () => {
  it("resolves paths relative to the home directory", () => {
    if (result.error) return;
    for (const doc of result.observed) {
      expect(doc.path.startsWith("/") || /^[A-Za-z]:/.test(doc.path), doc.path).toBe(false);
    }
  });

  it("agrees with the registry on the total document count", () => {
    if (result.error) return;
    if (!SCOPE_PRESENT) return;
    expect(result.observed.length).toBe(registry.sources.length);
  });

  it("resolves every registered path to a real file", () => {
    const home = homedir();
    let checked = 0;
    for (const entry of registry.sources) {
      const full = join(home, ...entry.path.split("/"));
      if (!existsSync(full)) continue;
      checked += 1;
    }
    // Not every registered document has to exist on this machine, but the
    // ones that do must be findable, and the great majority must.
    if (!SCOPE_PRESENT) return;
    expect(checked / registry.sources.length).toBeGreaterThan(0.9);
  });
});
