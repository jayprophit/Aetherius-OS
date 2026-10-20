import { describe, expect, it } from "vitest";

import {
  BUILD_MANIFEST_SCHEMA_VERSION,
  BUILD_STATES,
  buildOrder,
  dependenciesOf,
  dependentsOf,
  entryFor,
  loadBuildManifest,
  loadBuildRegistry,
  summariseBuildStates,
  validateBuildManifest,
  validateBuildRegistry,
  type BuildManifest,
  type BuildRegistry,
} from "./buildManifest";

/**
 * Build manifest registry tests.
 *
 * The rule this module exists to enforce: a project that cannot say how it
 * is built is a project nobody can finish. So a manifest that is missing a
 * command, a status, or a toolchain is a finding, and a registry entry
 * whose manifest does not exist is a finding too.
 */

function manifest(overrides: Partial<BuildManifest> = {}): BuildManifest {
  return {
    schema_version: BUILD_MANIFEST_SCHEMA_VERSION,
    project: {
      id: "demo",
      name: "Demo",
      kind: "application",
      domain: "demo",
      description: "A demonstration project.",
      repository: true,
      branch: "main",
      languages: ["typescript"],
    },
    toolchain: {
      build_system: "npm/vite",
      package_manager: "npm",
      requirements: [{ name: "node", version: ">=18", required: true }],
    },
    commands: [
      { name: "install", command: "npm ci" },
      { name: "build", command: "npm run build", requires: ["install"] },
    ],
    dependencies: { projects: [], external: [] },
    status: {
      state: "VERIFIED",
      last_verified: "2026-10-20",
      summary: "Built and tested.",
      evidence: ["npm test -> 10 passed"],
    },
    known_issues: [],
    ...overrides,
  };
}

function registry(overrides: Partial<BuildRegistry> = {}): BuildRegistry {
  return {
    schema_version: BUILD_MANIFEST_SCHEMA_VERSION,
    source_date: "2026-10-20",
    projects_root: "..",
    projects: [
      {
        id: "alpha",
        name: "Alpha",
        manifest: "Alpha/build.yaml",
        role: "core",
        status: "VERIFIED",
        depends_on: [],
      },
      {
        id: "beta",
        name: "Beta",
        manifest: "Beta/build.yaml",
        role: "surface",
        status: "PARTIAL",
        depends_on: ["alpha"],
      },
    ],
    ...overrides,
  };
}

const noManifests: (path: string) => string | null = () => null;
const allPresent = () => true;

describe("build manifest validation", () => {
  it("accepts a well-formed manifest", () => {
    expect(validateBuildManifest(manifest())).toEqual([]);
  });

  it("rejects a wrong schema version", () => {
    expect(validateBuildManifest(manifest({ schema_version: "0.1.0" }))).toContain("schema-version");
  });

  it("requires a project id, name, kind, domain and description", () => {
    const problems = validateBuildManifest(
      manifest({
        project: {
          id: "",
          name: "",
          kind: "application",
          domain: "",
          description: "",
          repository: false,
          languages: [],
        },
      }),
    );
    expect(problems).toContain("project-id");
    expect(problems).toContain("project-name");
    expect(problems).toContain("project-domain");
    expect(problems).toContain("project-description");
    expect(problems).toContain("project-languages");
  });

  it("rejects an unknown project kind", () => {
    const m = manifest();
    (m.project as { kind: string }).kind = "microservice";
    expect(validateBuildManifest(m)).toContain("project-kind");
  });

  it("requires a build system and a named tool on every requirement", () => {
    const problems = validateBuildManifest(
      manifest({ toolchain: { build_system: "", requirements: [{ name: "" }] } }),
    );
    expect(problems).toContain("toolchain-build-system");
    expect(problems).toContain("toolchain-requirement");
  });

  it("allows an empty tool list for a project that has no toolchain", () => {
    const problems = validateBuildManifest(
      manifest({
        toolchain: { build_system: "none", requirements: [] },
        status: {
          state: "NOT_STARTED",
          last_verified: "2026-10-20",
          summary: "Nothing to build yet.",
          evidence: ["folder is empty"],
        },
      }),
    );
    expect(problems).toEqual([]);
  });

  it("requires a project that is not merely not-started to record how it is built", () => {
    const problems = validateBuildManifest(manifest({ commands: [] }));
    expect(problems).toContain("command-command");
  });

  it("allows a not-started project to record no commands at all", () => {
    const problems = validateBuildManifest(
      manifest({
        commands: [],
        status: {
          state: "NOT_STARTED",
          last_verified: "2026-10-20",
          summary: "Nothing to build yet.",
          evidence: ["folder is empty"],
        },
      }),
    );
    expect(problems).toEqual([]);
  });

  it("requires each command to have a name and a command line", () => {
    const problems = validateBuildManifest(
      manifest({ commands: [{ name: "", command: "npm ci" }] }),
    );
    expect(problems).toContain("command-name");
  });

  it("rejects a command that requires a command which does not exist", () => {
    const problems = validateBuildManifest(
      manifest({
        commands: [{ name: "build", command: "npm run build", requires: ["nonexistent"] }],
      }),
    );
    expect(problems).toContain("command-requires-unknown");
  });

  it("requires a status with a known state, a date, a summary and evidence", () => {
    const problems = validateBuildManifest(
      manifest({
        status: { state: "MAYBE" as never, last_verified: "not-a-date", summary: "", evidence: [] },
      }),
    );
    expect(problems).toContain("status-state");
    expect(problems).toContain("status-last-verified");
    expect(problems).toContain("status-summary");
    expect(problems).toContain("status-evidence");
  });

  it("rejects a known issue with an unknown severity or status", () => {
    const problems = validateBuildManifest(
      manifest({
        known_issues: [
          {
            id: "X-1",
            severity: "catastrophic" as never,
            summary: "s",
            evidence: "e",
            status: "MAYBE" as never,
          },
        ],
      }),
    );
    expect(problems).toContain("issue-severity");
    expect(problems).toContain("issue-status");
  });

  it("rejects duplicate known-issue ids", () => {
    const problems = validateBuildManifest(
      manifest({
        known_issues: [
          { id: "X-1", severity: "low", summary: "s", evidence: "e", status: "OPEN" },
          { id: "X-1", severity: "low", summary: "s", evidence: "e", status: "OPEN" },
        ],
      }),
    );
    expect(problems).toContain("issue-duplicate-id");
  });

  it("does not mutate the manifest it validates", () => {
    const m = manifest();
    const before = JSON.stringify(m);
    validateBuildManifest(m);
    expect(JSON.stringify(m)).toBe(before);
  });
});

describe("build registry validation", () => {
  it("accepts a registry whose manifests are all present and valid", () => {
    const issues = validateBuildRegistry(registry(), {
      readManifest: (p) => (p === "Alpha/build.yaml" ? YAML_OF("alpha") : YAML_OF("beta")),
      projectExists: allPresent,
    });
    expect(issues).toEqual([]);
  });

  it("reports a missing manifest rather than failing silently", () => {
    const issues = validateBuildRegistry(registry(), {
      readManifest: noManifests,
      projectExists: allPresent,
    });
    expect(issues.map((i) => i.code)).toContain("registry-manifest-missing");
    expect(issues.filter((i) => i.id === "alpha").length).toBe(1);
  });

  it("does not accuse a project of a broken manifest when the project is absent", () => {
    // A clean clone of Aetherius-OS has no sibling projects. Reporting every
    // cross-project manifest as broken would be a false accusation.
    const issues = validateBuildRegistry(registry(), {
      readManifest: noManifests,
      projectExists: () => false,
    });
    const missing = issues.filter((i) => i.code === "registry-manifest-missing");
    expect(missing).toHaveLength(2);
    for (const m of missing) {
      expect(m.detail).toContain("not present");
    }
  });

  it("reports a manifest whose project id does not match the registry entry", () => {
    const issues = validateBuildRegistry(registry(), {
      readManifest: (p) => YAML_OF(p === "Alpha/build.yaml" ? "wrong-id" : "beta"),
      projectExists: allPresent,
    });
    expect(issues.map((i) => i.code)).toContain("registry-manifest-id-mismatch");
  });

  it("reports a manifest that fails its own validation", () => {
    const issues = validateBuildRegistry(registry(), {
      readManifest: (p) =>
        p === "Alpha/build.yaml" ? "schema_version: '9.9.9'\n" : YAML_OF("beta"),
      projectExists: allPresent,
    });
    expect(issues.map((i) => i.code)).toContain("registry-manifest-invalid");
  });

  it("reports a manifest that is not valid YAML as unreadable, not as invalid", () => {
    const issues = validateBuildRegistry(registry(), {
      readManifest: (p) => (p === "Alpha/build.yaml" ? "a: [unclosed" : YAML_OF("beta")),
      projectExists: allPresent,
    });
    const unreadable = issues.filter((i) => i.code === "registry-manifest-unreadable");
    expect(unreadable).toHaveLength(1);
    expect(unreadable[0].id).toBe("alpha");
  });

  it("rejects duplicate project ids", () => {
    const r = registry();
    r.projects.push({ ...r.projects[0]! });
    const issues = validateBuildRegistry(r, { readManifest: noManifests, projectExists: () => false });
    expect(issues.map((i) => i.code)).toContain("registry-duplicate-id");
  });

  it("rejects a dependency on an unregistered project", () => {
    const r = registry();
    r.projects[1]!.depends_on = ["ghost"];
    const issues = validateBuildRegistry(r, { readManifest: noManifests, projectExists: () => false });
    expect(issues.map((i) => i.code)).toContain("registry-unknown-dependency");
  });

  it("rejects a dependency cycle", () => {
    const r = registry();
    r.projects[0]!.depends_on = ["beta"];
    const issues = validateBuildRegistry(r, { readManifest: noManifests, projectExists: () => false });
    expect(issues.map((i) => i.code)).toContain("registry-dependency-cycle");
  });

  it("rejects a project that depends on itself", () => {
    const r = registry();
    r.projects[0]!.depends_on = ["alpha"];
    const issues = validateBuildRegistry(r, { readManifest: noManifests, projectExists: () => false });
    expect(issues.map((i) => i.code)).toContain("registry-dependency-cycle");
  });

  it("rejects an unknown status on a registry entry", () => {
    const r = registry();
    (r.projects[0] as { status: string }).status = "MOSTLY_FINE";
    const issues = validateBuildRegistry(r, { readManifest: noManifests, projectExists: () => false });
    expect(issues.map((i) => i.code)).toContain("registry-status");
  });
});

describe("build registry queries", () => {
  it("finds an entry by id", () => {
    expect(entryFor(registry(), "beta")?.name).toBe("Beta");
    expect(entryFor(registry(), "ghost")).toBeNull();
  });

  it("lists direct dependents and dependencies", () => {
    expect(dependentsOf(registry(), "alpha")).toEqual(["beta"]);
    expect(dependenciesOf(registry(), "beta")).toEqual(["alpha"]);
  });

  it("summarises the workspace build state", () => {
    const s = summariseBuildStates(registry());
    expect(s.total).toBe(2);
    expect(s.byState.VERIFIED).toBe(1);
    expect(s.byState.PARTIAL).toBe(1);
    expect(s.verified).toEqual(["alpha"]);
    expect(s.partial).toEqual(["beta"]);
  });

  it("orders the build so dependencies come first", () => {
    expect(buildOrder(registry())).toEqual(["alpha", "beta"]);
  });

  it("still produces a complete order when a cycle exists", () => {
    const r = registry();
    r.projects[0]!.depends_on = ["beta"];
    const order = buildOrder(r);
    expect(order).toHaveLength(2);
    expect(new Set(order)).toEqual(new Set(["alpha", "beta"]));
  });
});

describe("build state vocabulary", () => {
  it("has no state outside the documented set", () => {
    expect([...BUILD_STATES].sort()).toEqual([
      "BROKEN",
      "NOT_STARTED",
      "PARTIAL",
      "RESEARCH",
      "VERIFIED",
    ]);
  });
});

// A minimal but valid manifest in YAML, for the registry tests.
function YAML_OF(id: string): string {
  return [
    'schema_version: "1.0.0"',
    "project:",
    `  id: ${id}`,
    `  name: ${id}`,
    "  kind: application",
    `  domain: ${id}`,
    "  description: A test project.",
    "  repository: true",
    "  languages: [typescript]",
    "toolchain:",
    "  build_system: npm/vite",
    "  requirements:",
    "    - name: node",
    "      required: true",
    "commands:",
    "  - name: build",
    "    command: npm run build",
    "dependencies:",
    "  projects: []",
    "  external: []",
    "status:",
    "  state: VERIFIED",
    '  last_verified: "2026-10-20"',
    "  summary: Fine.",
    "  evidence:",
    "    - built",
    "known_issues: []",
  ].join("\n");
}

describe("manifest and registry parsing", () => {
  it("parses a manifest from YAML", () => {
    const m = loadBuildManifest(YAML_OF("parsed"));
    expect(m.project.id).toBe("parsed");
    expect(m.commands).toHaveLength(1);
  });

  it("parses a registry from YAML", () => {
    const r = loadBuildRegistry(
      ["schema_version: \"1.0.0\"", 'source_date: "2026-10-20"', "projects_root: ..", "projects: []"].join("\n"),
    );
    expect(r.projects_root).toBe("..");
    expect(r.projects).toEqual([]);
  });
});
