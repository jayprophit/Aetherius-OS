import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

import {
  BUILD_MANIFEST_SCHEMA_VERSION,
  loadBuildManifest,
  loadBuildRegistry,
  validateBuildManifest,
  validateBuildRegistry,
  type BuildManifest,
  type BuildRegistry,
} from "./buildManifest";

/**
 * The workspace registry gate.
 *
 * This is the test that makes the build manifest registry worth having. It
 * reads the real registry and the real per-project manifests, and checks
 * them against the real folders on disk. Three things follow:
 *
 *  1. A project folder that is not registered is a finding. The registry
 *     cannot silently fall behind the workspace.
 *  2. A registered project whose manifest is missing or malformed is a
 *     finding. The registry cannot claim a project builds when it does not
 *     say how.
 *  3. A known issue that points at a todo that does not exist is a finding.
 *     The two documents cannot drift apart.
 *
 * A clean clone of Aetherius-OS alone has no sibling projects. The disk
 * checks are skipped explicitly there rather than failing for the wrong
 * reason, exactly as the workspace hygiene guard does.
 */

const REPO_ROOT = resolve(join(__dirname, "..", ".."));
const DOCS = join(REPO_ROOT, "docs");
const PROJECTS_ROOT = resolve(join(REPO_ROOT, ".."));
const TEMP_DIR = "Temp";

const REGISTRY_PATH = join(DOCS, "BUILD-MANIFEST-REGISTRY.yaml");
const TODOS_PATH = join(DOCS, "PROJECT-TODOS.yaml");

const registry = loadBuildRegistry(readFileSync(REGISTRY_PATH, "utf8"));

/** Every project folder on disk. */
function projectFoldersOnDisk(): string[] {
  return readdirSync(PROJECTS_ROOT)
    .filter((e) => statSync(join(PROJECTS_ROOT, e)).isDirectory())
    .filter((e) => e !== TEMP_DIR)
    .sort();
}

/**
 * The folder a project occupies. A project id is not always the folder
 * name: `mat` lives in `Materials-Atlas-Table-Codex---MAT` and
 * `food-wiki-app` in `Food Wiki App`. The manifest path's first segment is
 * the authoritative answer, so that is what is used.
 */
function folderOf(id: string): string | null {
  const entry = registry.projects.find((p) => p.id === id);
  if (!entry) return null;
  const segment = entry.manifest.split("/")[0] ?? "";
  return segment.replace(/^"|"$/g, "") || null;
}

/** True when the project's folder is present on disk. */
function projectPresent(id: string): boolean {
  const folder = folderOf(id);
  return folder !== null && existsSync(join(PROJECTS_ROOT, folder));
}

/** True when at least one sibling project is present, i.e. not a bare clone. */
const HAS_SIBLINGS = existsSync(join(PROJECTS_ROOT, "Genesis"));

interface Todo {
  id: string;
  title: string;
  project: string;
  status: string;
  priority: number;
  source?: { kind?: string; ref?: string };
  detail?: string;
  evidence?: string;
  acceptance?: string[];
}

function loadTodos(): Todo[] {
  const doc = parseYaml(readFileSync(TODOS_PATH, "utf8")) as { todos?: Todo[] };
  return doc.todos ?? [];
}

describe("build manifest registry: the real file", () => {
  it("parses and uses the current schema version", () => {
    expect(registry.schema_version).toBe(BUILD_MANIFEST_SCHEMA_VERSION);
  });

  it("names a projects root", () => {
    expect(registry.projects_root).toBeTruthy();
  });

  it("has no structural problems", () => {
    const issues = validateBuildRegistry(registry, {
      readManifest: (p) => {
        const full = join(PROJECTS_ROOT, p);
        return existsSync(full) ? readFileSync(full, "utf8") : null;
      },
      projectExists: projectPresent,
    });
    expect(issues.map((i) => `${i.id}: ${i.code} ${i.detail}`)).toEqual([]);
  });

  it("registers every project folder that exists on disk", () => {
    if (!HAS_SIBLINGS) return;
    const registered = new Set(registry.projects.map((p) => p.id));
    // The registry identifies projects by id, and the id is not always the
    // folder name, so compare through the manifest path's first segment.
    const registeredFolders = new Set(
      registry.projects.map((p) => p.manifest.split("/")[0]!.replace(/^"|"$/g, "")),
    );
    const onDisk = projectFoldersOnDisk();
    const unregistered = onDisk.filter((f) => !registeredFolders.has(f) && !registered.has(f));
    expect(
      unregistered,
      `project folders on disk with no registry entry: ${unregistered.join(", ")}`,
    ).toEqual([]);
  });

  it("points every entry at a manifest that exists", () => {
    if (!HAS_SIBLINGS) return;
    for (const p of registry.projects) {
      const full = join(PROJECTS_ROOT, p.manifest);
      expect(existsSync(full), `${p.id} -> ${p.manifest}`).toBe(true);
    }
  });

  it("gives every project a build manifest that validates", () => {
    if (!HAS_SIBLINGS) return;
    for (const p of registry.projects) {
      const full = join(PROJECTS_ROOT, p.manifest);
      if (!existsSync(full)) continue;
      const manifest = loadBuildManifest(readFileSync(full, "utf8"));
      expect(
        validateBuildManifest(manifest),
        `${p.id} (${p.manifest})`,
      ).toEqual([]);
      expect(manifest.project.id, `${p.id} declares a different id`).toBe(p.id);
    }
  });

  it("records a status for every project", () => {
    for (const p of registry.projects) {
      expect(p.status, p.id).toBeTruthy();
      expect(p.role.length, p.id).toBeGreaterThan(10);
    }
  });
});

describe("project todos: the real file", () => {
  it("parses and every todo has an owner, a title and a priority", () => {
    const todos = loadTodos();
    expect(todos.length).toBeGreaterThan(0);
    for (const t of todos) {
      expect(t.id, "todo id").toBeTruthy();
      expect(t.title.length, `${t.id} title`).toBeGreaterThan(5);
      expect(t.project, `${t.id} project`).toBeTruthy();
      expect(t.priority, `${t.id} priority`).toBeGreaterThanOrEqual(1);
      expect(t.priority, `${t.id} priority`).toBeLessThanOrEqual(5);
    }
  });

  it("uses unique todo ids", () => {
    const ids = loadTodos().map((t) => t.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect([...new Set(dupes)]).toEqual([]);
  });

  it("gives every todo a source, so a task is never unattributed", () => {
    for (const t of loadTodos()) {
      expect(t.source?.kind, `${t.id} source kind`).toBeTruthy();
      expect(t.source?.ref, `${t.id} source ref`).toBeTruthy();
    }
  });

  it("names a project that exists in the registry", () => {
    const registered = new Set(registry.projects.map((p) => p.id));
    for (const t of loadTodos()) {
      expect(registered.has(t.project), `${t.id} names unknown project ${t.project}`).toBe(true);
    }
  });

  it("gives every open todo at least one acceptance criterion", () => {
    for (const t of loadTodos()) {
      if (t.status !== "OPEN") continue;
      expect(t.acceptance?.length, `${t.id} has no acceptance criterion`).toBeGreaterThan(0);
    }
  });

  it("resolves every depends_on to a todo that exists", () => {
    const ids = new Set(loadTodos().map((t) => t.id));
    for (const t of loadTodos()) {
      for (const d of (t as { depends_on?: string[] }).depends_on ?? []) {
        expect(ids.has(d), `${t.id} depends on unknown todo ${d}`).toBe(true);
      }
    }
  });
});

describe("known issues and todos agree", () => {
  it("resolves every known-issue todo_ref to a todo that exists", () => {
    if (!HAS_SIBLINGS) return;
    const ids = new Set(loadTodos().map((t) => t.id));
    for (const p of registry.projects) {
      const full = join(PROJECTS_ROOT, p.manifest);
      if (!existsSync(full)) continue;
      const manifest: BuildManifest = loadBuildManifest(readFileSync(full, "utf8"));
      for (const issue of manifest.known_issues ?? []) {
        if (!issue.todo_ref) continue;
        expect(
          ids.has(issue.todo_ref),
          `${p.id} known issue ${issue.id} points at unknown todo ${issue.todo_ref}`,
        ).toBe(true);
      }
    }
  });

  it("gives every open build-audit todo a matching known issue", () => {
    if (!HAS_SIBLINGS) return;
    const todos = loadTodos();
    for (const p of registry.projects) {
      const full = join(PROJECTS_ROOT, p.manifest);
      if (!existsSync(full)) continue;
      const manifest: BuildManifest = loadBuildManifest(readFileSync(full, "utf8"));
      const refs = new Set((manifest.known_issues ?? []).map((i) => i.todo_ref));
      // A todo sourced from a build audit is a statement that the project is
      // broken, so the project's manifest has to say so too. Todos sourced
      // from a gap analysis, a prior document or a conversation are
      // programme work, not build defects, and live in the manifest's notes
      // rather than in its known issues.
      const owned = todos.filter(
        (t) => t.project === p.id && t.status === "OPEN" && t.source?.kind === "build-audit",
      );
      const untraceable = owned.filter((t) => !refs.has(t.id));
      expect(
        untraceable.map((t) => t.id),
        `${p.id} has open build-audit todos that its build manifest does not mention`,
      ).toEqual([]);
    }
  });
});
