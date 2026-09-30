import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Workspace hygiene: the Projects folder holds projects, and nothing else.
 *
 * The owner requirement: no project data or generated files may live outside
 * the project that owns them. Anything that does not belong to a project goes
 * to the designated Temp folder instead of accumulating beside the projects,
 * where it looks like project content and gets mistaken for it.
 *
 * This is a real guard, not a lint. The observed failures it prevents are
 * concrete: a `cl`/`gcc` build run with the Projects root as its working
 * directory dropped `a.obj` and `main.obj` there (the debug path recorded
 * inside the object files is the Projects root itself), a dev server started
 * in that directory created a root `node_modules` holding only a `.vite`
 * cache, a generated workstation audit left ~30 files of reports and system
 * backups as a root folder, and a stale 113 KB snapshot of Aetherius'
 * BUILD-TODO sat beside the projects while the canonical copy lived in
 * `Aetherius-OS/native/`.
 *
 * Those were moved to `Temp/` on 2026-09-30 with a record in
 * `Temp/PROJECTS-FOLDER-INTEGRITY-2026-09-30.md`. This test is what stops it
 * happening again unnoticed.
 *
 * A clean clone of Aetherius-OS alone has no sibling projects, so the layout
 * assertions skip explicitly there instead of failing for the wrong reason.
 * The classification logic below is repository-local and always runs.
 */

const PROJECTS_ROOT = resolve(join(".."));
const TEMP_DIR = "Temp";

/** The projects that legitimately live in the Projects folder. */
const KNOWN_PROJECTS = [
  "Aetherius-OS",
  "Agent-Bridge",
  "Architecture of Shadows Book",
  "Athena",
  "Decentralized Messaging App",
  "Food Wiki App",
  "Genesis",
  "IDE-Workspace",
  "LedgerLands",
  "Materials-Atlas-Table-Codex---MAT",
  "Poietek",
  "Universal-Bridge",
] as const;

/**
 * Non-project entries allowed at the Projects root, with the reason they are
 * not a misplaced project file. `opencode.json` is the user's own tool
 * configuration and must not be moved by a hygiene sweep.
 */
const ALLOWED_ROOT_FILES = new Map<string, string>([
  ["opencode.json", "user opencode configuration (MCP entry with cwd=Projects)"],
]);

const PROJECTS_PRESENT = KNOWN_PROJECTS.every((p) => existsSync(join(PROJECTS_ROOT, p)));
const needsLayout = PROJECTS_PRESENT ? it : it.skip;

/** Extensions that only ever appear as build output or dependency trees. */
const GENERATED_FILE = /\.(obj|o|a|lib|dll|exe|pdb|ilk|exp|pyc|pyo|class|jar|war|tsbuildinfo)$/i;
const GENERATED_DIR = /^(node_modules|__pycache__|\.pytest_cache|\.vite|target|dist|build|out|bin|obj|\.vs)$/i;

interface Stray {
  name: string;
  kind: "file" | "dir";
  reason: string;
}

function classify(name: string, isDir: boolean): Stray | null {
  if (isDir) {
    if (GENERATED_DIR.test(name)) return { name, kind: "dir", reason: "generated directory" };
    if (!KNOWN_PROJECTS.includes(name as never) && name !== TEMP_DIR) {
      return { name, kind: "dir", reason: "folder that is not a known project" };
    }
    return null;
  }
  if (ALLOWED_ROOT_FILES.has(name)) return null;
  if (GENERATED_FILE.test(name)) return { name, kind: "file", reason: "build/bytecode output" };
  if (/\.(md|txt|json|log|csv|tsv|ya?ml|toml|ini|cfg)$/i.test(name)) {
    return { name, kind: "file", reason: "document/data file that belongs inside a project" };
  }
  return { name, kind: "file", reason: "unknown file outside any project" };
}

function survey(): { strays: Stray[]; unexpectedRootFiles: string[] } {
  const strays: Stray[] = [];
  const unexpectedRootFiles: string[] = [];
  for (const entry of readdirSync(PROJECTS_ROOT)) {
    const isDir = statSync(join(PROJECTS_ROOT, entry)).isDirectory();
    if (!isDir && ALLOWED_ROOT_FILES.has(entry)) continue;
    if (!isDir && KNOWN_PROJECTS.includes(entry as never)) {
      unexpectedRootFiles.push(entry);
      continue;
    }
    const bad = classify(entry, isDir);
    if (bad) strays.push(bad);
  }
  return { strays, unexpectedRootFiles };
}

describe("workspace hygiene: the Projects folder holds projects and nothing else", () => {
  needsLayout("has no stray file or folder beside the projects", () => {
    const { strays } = survey();
    const detail = strays.map((s) => `${s.name} (${s.reason})`).join(", ");
    expect(
      strays.map((s) => s.name),
      `misplaced at the Projects root, move to ${TEMP_DIR}/: ${detail}`,
    ).toEqual([]);
  });

  needsLayout("has no project-named file masquerading as a project", () => {
    const { unexpectedRootFiles } = survey();
    expect(unexpectedRootFiles).toEqual([]);
  });

  needsLayout("keeps every known project in place", () => {
    const missing = KNOWN_PROJECTS.filter((p) => !existsSync(join(PROJECTS_ROOT, p)));
    expect(missing, `projects missing from the Projects root: ${missing.join(", ")}`).toEqual([]);
  });

  needsLayout("keeps the designated Temp folder available for relocated files", () => {
    expect(existsSync(join(PROJECTS_ROOT, TEMP_DIR))).toBe(true);
  });

  it("records what the user config exemption is and why", () => {
    // If opencode.json is ever removed from the allowlist the root sweep will
    // flag it; this pins the reason so the exemption is deliberate.
    expect(ALLOWED_ROOT_FILES.get("opencode.json")).toContain("user opencode configuration");
  });
});

describe("workspace hygiene: classification logic (repository-local)", () => {
  it("flags build output and bytecode at the root", () => {
    for (const name of ["a.obj", "main.obj", "module.pyc", "app.tsbuildinfo"]) {
      expect(classify(name, false)?.reason, name).toBeTruthy();
    }
  });

  it("flags generated and unknown directories at the root", () => {
    for (const name of ["node_modules", "__pycache__", ".pytest_cache", "target", "dist"]) {
      expect(classify(name, true)?.reason, name).toBe("generated directory");
    }
    expect(classify("some-audit-scratch", true)?.reason).toBe(
      "folder that is not a known project",
    );
  });

  it("flags documents and data files at the root", () => {
    for (const name of ["BUILD-TODO.md", "notes.txt", "inventory.json", "run.log"]) {
      expect(classify(name, false)?.reason, name).toContain("belongs inside a project");
    }
  });

  it("accepts the known projects, the Temp folder and the user config", () => {
    for (const name of KNOWN_PROJECTS) expect(classify(name, true), name).toBeNull();
    expect(classify(TEMP_DIR, true)).toBeNull();
    expect(classify("opencode.json", false)).toBeNull();
  });

  it("matches every project folder on disk, so a new project must be classified", () => {
    // A new project folder appearing at the root would otherwise be reported
    // as a stray. That is the intended friction: name it here.
    if (!PROJECTS_PRESENT) return;
    const onDisk = readdirSync(PROJECTS_ROOT)
      .filter((e) => statSync(join(PROJECTS_ROOT, e)).isDirectory())
      .filter((e) => e !== TEMP_DIR)
      .sort();
    expect(onDisk).toEqual([...KNOWN_PROJECTS].sort());
  });
});

describe("workspace hygiene: the relocation record exists and is honest", () => {
  const RECORD = join(PROJECTS_ROOT, TEMP_DIR, "PROJECTS-FOLDER-INTEGRITY-2026-09-30.md");
  const present = existsSync(RECORD);

  (present ? it : it.skip)("names every item that was moved out of the root", () => {
    const text = readFileSync(RECORD, "utf8");
    for (const item of ["a.obj", "main.obj", "node_modules", "_workstation-audit", "BUILD-TODO.md"]) {
      expect(text, item).toContain(item);
    }
  });

  (present ? it : it.skip)("explains why opencode.json was deliberately kept", () => {
    const text = readFileSync(RECORD, "utf8");
    expect(text).toContain("opencode.json");
    expect(text.toLowerCase()).toContain("tooling");
  });

  it("the record is filed under Temp, not beside the projects", () => {
    expect(basename(RECORD)).toBe("PROJECTS-FOLDER-INTEGRITY-2026-09-30.md");
  });
});
