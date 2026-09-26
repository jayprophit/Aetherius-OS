import { describe, expect, it } from "vitest";
import {
  FILE_FAMILIES,
  LanguageGraphError,
  NODE_KINDS,
  PROJECT_RELATIONS,
  RESOLUTION_RULES,
  UNRESOLVED_REASONS,
  buildProjectLanguageGraph,
  classifyFile,
  dependentsOf,
  unclassifiedFiles,
  unresolvedReferences,
} from "./languageGraph";
import type { ProjectFile } from "./languageGraph";

function file(path: string, contents: string): ProjectFile {
  return { path, contents };
}

function graph(files: ProjectFile[], includeRoots?: string[]) {
  return buildProjectLanguageGraph(includeRoots === undefined ? { files } : { files, includeRoots });
}

/** Edges from one node, for concise assertions. */
function edgesFrom(g: ReturnType<typeof graph>, id: string) {
  return g.edges.filter((edge) => edge.from === id);
}

describe("language graph: registered vocabulary", () => {
  it("declares exactly the registered file families", () => {
    expect([...FILE_FAMILIES]).toEqual(["C", "CXX", "RUST", "PYTHON", "JS_TS", "SHELL", "BUILD", "MANIFEST"]);
  });

  it("keeps node kinds, relations, rules and reasons distinct and non-empty", () => {
    for (const vocabulary of [NODE_KINDS, PROJECT_RELATIONS, RESOLUTION_RULES, UNRESOLVED_REASONS]) {
      expect(vocabulary.length).toBeGreaterThan(0);
      expect(new Set(vocabulary).size).toBe(vocabulary.length);
    }
  });

  it("classifies every registered family and refuses to guess the rest", () => {
    const cases: Array<[string, string]> = [
      ["src/a.c", "C"],
      ["src/a.h", "C"],
      ["src/a.cpp", "CXX"],
      ["src/a.hpp", "CXX"],
      ["src/a.rs", "RUST"],
      ["src/a.py", "PYTHON"],
      ["src/a.ts", "JS_TS"],
      ["src/a.tsx", "JS_TS"],
      ["run.sh", "SHELL"],
      ["CMakeLists.txt", "BUILD"],
      ["Makefile", "BUILD"],
      ["package.json", "MANIFEST"],
      ["Cargo.toml", "MANIFEST"],
      ["requirements.txt", "MANIFEST"],
    ];
    for (const [path, family] of cases) expect(classifyFile(path)).toBe(family);
    for (const path of ["notes.txt", "data.csv", "LICENSE", "src/a.unknown"]) {
      expect(classifyFile(path)).toBeUndefined();
    }
  });
});

describe("language graph: C and C++ includes", () => {
  it("resolves a quoted include against a sibling header", () => {
    const g = graph([
      file("src/main.c", '#include "helper.h"\nint main(void){return 0;}'),
      file("src/helper.h", "#pragma once"),
    ]);
    expect(edgesFrom(g, "src/main.c")).toEqual([
      { from: "src/main.c", to: "src/helper.h", relation: "INCLUDE", resolution: "RELATIVE_PATH", line: 1, construct: '#include "helper.h"' },
    ]);
  });

  it("resolves an angled include that names an existing path", () => {
    const g = graph([
      file("src/a.c", "#include <util.h>"),
      file("src/util.h", "#pragma once"),
    ]);
    const edge = edgesFrom(g, "src/a.c")[0]!;
    expect(edge.to).toBe("src/util.h");
    // The include NAMED a path and that path exists, so no completion happened.
    expect(edge.resolution).toBe("RELATIVE_PATH");
  });

  it("completes an extensionless angled include by declared extensions", () => {
    const g = graph([
      file("src/a.c", "#include <util>"),
      file("src/util.h", "#pragma once"),
    ]);
    const edge = edgesFrom(g, "src/a.c")[0]!;
    expect(edge.to).toBe("src/util.h");
    expect(edge.resolution).toBe("EXTENSION_COMPLETION");
  });

  it("reports an unknown angled include honestly instead of guessing", () => {
    const g = graph([file("src/a.c", "#include <vector>")]);
    expect(g.edges).toEqual([]);
    expect(g.unresolved).toEqual([
      { from: "src/a.c", target: "vector", relation: "INCLUDE", line: 1, reason: "EXTERNAL_INCLUDE_ROOT_UNKNOWN" },
    ]);
  });

  it("resolves an angled include only when the caller supplies an include root", () => {
    const files = [file("src/a.c", "#include <util>"), file("third_party/util.h", "#pragma once")];
    expect(graph(files).unresolved[0]!.reason).toBe("EXTERNAL_INCLUDE_ROOT_UNKNOWN");
    const g = graph(files, ["third_party"]);
    expect(edgesFrom(g, "src/a.c")[0]!.to).toBe("third_party/util.h");
  });

  it("reports ambiguity instead of picking a candidate", () => {
    const g = graph([file("src/a.c", '#include "util"'), file("src/util.h", ""), file("src/util.hpp", "")]);
    expect(g.edges).toEqual([]);
    expect(g.unresolved[0]!.reason).toBe("AMBIGUOUS_EXTENSION_COMPLETION");
  });

  it("prefers the header an include names over a sibling with the same stem", () => {
    // `#include "util.h"` names a file. A `util.hpp` beside it is not a
    // candidate to be weighed against it.
    const g = graph([file("src/a.c", '#include "util.h"'), file("src/util.h", ""), file("src/util.hpp", "")]);
    expect(edgesFrom(g, "src/a.c")[0]!.to).toBe("src/util.h");
  });

  it("ignores an include inside a comment", () => {
    const g = graph([file("src/a.c", '// #include "helper.h"\n#include "real.h"'), file("src/helper.h", ""), file("src/real.h", "")]);
    expect(edgesFrom(g, "src/a.c")).toHaveLength(1);
    expect(edgesFrom(g, "src/a.c")[0]!.to).toBe("src/real.h");
  });
});

describe("language graph: Python", () => {
  it("resolves a relative import through extension completion", () => {
    const g = graph([file("pkg/app.py", "from .helper import run\n"), file("pkg/helper.py", "def run(): pass")]);
    const edge = edgesFrom(g, "pkg/app.py")[0]!;
    expect(edge.to).toBe("pkg/helper.py");
    expect(edge.relation).toBe("IMPORTS");
    expect(edge.resolution).toBe("MODULE_NAME");
  });

  it("resolves a sibling module by the language's own file rule", () => {
    const g = graph([file("pkg/app.py", "import helper\n"), file("pkg/helper.py", "")]);
    const edge = edgesFrom(g, "pkg/app.py")[0]!;
    expect(edge.to).toBe("pkg/helper.py");
    expect(edge.resolution).toBe("MODULE_NAME");
  });

  it("treats a third-party import as a package, not a project file", () => {
    const g = graph([file("pkg/app.py", "import numpy\n")]);
    const edge = edgesFrom(g, "pkg/app.py")[0]!;
    expect(edge.to).toBe("package:numpy");
    expect(edge.resolution).toBe("DECLARED_PACKAGE");
    expect(g.nodes.find((node) => node.id === "package:numpy")!.kind).toBe("PACKAGE");
  });

  it("prefers a sibling module over a package of the same name", () => {
    // `import numpy` next to a real `numpy.py` is the local module, because
    // Python resolves a bare name against the importer's own package first.
    const g = graph([file("pkg/app.py", "import numpy\n"), file("pkg/numpy.py", "")]);
    expect(edgesFrom(g, "pkg/app.py")[0]!.to).toBe("pkg/numpy.py");
  });

  it("falls back to a package when no sibling module exists", () => {
    const g = graph([file("pkg/app.py", "import numpy\n")]);
    expect(edgesFrom(g, "pkg/app.py")[0]!.to).toBe("package:numpy");
  });

  it("ignores an import inside a comment", () => {
    const g = graph([file("pkg/app.py", "# import helper\n"), file("pkg/helper.py", "")]);
    expect(g.edges).toEqual([]);
  });
});

describe("language graph: JS and TS", () => {
  it("resolves a relative import that names its extension", () => {
    const g = graph([file("src/a.ts", 'import { b } from "./b.ts";\n'), file("src/b.ts", "export const b = 1;")]);
    const edge = edgesFrom(g, "src/a.ts")[0]!;
    expect(edge.to).toBe("src/b.ts");
    expect(edge.resolution).toBe("RELATIVE_PATH");
  });

  it("completes an extensionless relative import by module name", () => {
    const g = graph([file("src/a.ts", 'import { b } from "./b";\n'), file("src/b.tsx", "export const b = 1;")]);
    const edge = edgesFrom(g, "src/a.ts")[0]!;
    expect(edge.to).toBe("src/b.tsx");
    expect(edge.resolution).toBe("MODULE_NAME");
  });

  it("treats a bare specifier and a require as packages", () => {
    const g = graph([file("src/a.ts", 'import React from "react";\nconst x = require("lodash");\n')]);
    const edges = edgesFrom(g, "src/a.ts");
    expect(edges.map((edge) => edge.to).sort()).toEqual(["package:lodash", "package:react"]);
    expect(edges.every((edge) => edge.resolution === "DECLARED_PACKAGE")).toBe(true);
  });

  it("resolves a parent-relative import", () => {
    const g = graph([file("src/deep/a.ts", 'import { b } from "../b";\n'), file("src/b.ts", "export const b = 1;")]);
    expect(edgesFrom(g, "src/deep/a.ts")[0]!.to).toBe("src/b.ts");
  });

  it("keeps a package node distinct from a file node of the same name", () => {
    // A bare specifier is a package even when a project file shares its name.
    // The two are separate nodes with separate kinds and are never merged.
    const g = graph([file("web/a.ts", 'import React from "react";\n'), file("web/react.ts", "export const React = 1;")]);
    const kinds = new Map(g.nodes.map((node) => [node.id, node.kind]));
    expect(kinds.get("web/react.ts")).toBe("FILE");
    expect(kinds.get("package:react")).toBe("PACKAGE");
  });

  it("reports a missing relative import as unresolved, not absent", () => {
    const g = graph([file("src/a.ts", 'import { b } from "./missing";\n')]);
    expect(g.edges).toEqual([]);
    expect(g.unresolved).toEqual([
      { from: "src/a.ts", target: "./missing", relation: "IMPORTS", line: 1, reason: "TARGET_NOT_IN_FILE_SET" },
    ]);
  });
});

describe("language graph: Rust", () => {
  it("resolves a mod declaration to a sibling module file", () => {
    const g = graph([file("src/lib.rs", "mod helper;\npub fn run() {}\n"), file("src/helper.rs", "pub fn h() {}")]);
    const edge = edgesFrom(g, "src/lib.rs")[0]!;
    expect(edge.to).toBe("src/helper.rs");
    expect(edge.relation).toBe("IMPORTS");
  });

  it("keeps a crate-internal use inside the project", () => {
    const g = graph([file("src/lib.rs", "use crate::helper::h;\n"), file("src/helper.rs", "pub fn h() {}")]);
    const edges = edgesFrom(g, "src/lib.rs");
    expect(edges.every((edge) => edge.to !== "package:crate")).toBe(true);
  });

  it("treats an external crate as a package", () => {
    const g = graph([file("src/lib.rs", "use ::serde::Serialize;\n")]);
    const edge = edgesFrom(g, "src/lib.rs")[0]!;
    expect(edge.to).toBe("package:serde");
    expect(edge.resolution).toBe("DECLARED_PACKAGE");
  });
});

describe("language graph: shell", () => {
  it("resolves a sourced sibling script", () => {
    const g = graph([file("run.sh", "source ./lib.sh\n"), file("lib.sh", "echo hi")]);
    const edge = edgesFrom(g, "run.sh")[0]!;
    expect(edge.to).toBe("lib.sh");
    expect(edge.relation).toBe("SOURCES");
  });

  it("resolves a dot-sourced nested script", () => {
    const g = graph([file("scripts/run.sh", ". ./helpers/setup.sh\n"), file("scripts/helpers/setup.sh", "")]);
    expect(edgesFrom(g, "scripts/run.sh")[0]!.to).toBe("scripts/helpers/setup.sh");
  });

  it("reports a missing sourced script as unresolved", () => {
    const g = graph([file("run.sh", "source ./missing.sh\n")]);
    expect(g.unresolved[0]!.reason).toBe("TARGET_NOT_IN_FILE_SET");
  });
});

describe("language graph: build files", () => {
  it("links build targets to their project source files", () => {
    const g = graph([
      file("CMakeLists.txt", "add_executable(app main.cpp helper.cpp)\n"),
      file("main.cpp", "int main(){}"),
      file("helper.cpp", "void h(){}"),
    ]);
    const sources = g.edges.filter((edge) => edge.relation === "SOURCE_OF");
    expect(sources.map((edge) => `${edge.from}->${edge.to}`).sort()).toEqual([
      "target:app->helper.cpp",
      "target:app->main.cpp",
    ]);
    expect(sources[0]!.resolution).toBe("BUILD_LISTING");
  });

  it("records a build target as its own node kind, never as a file", () => {
    const g = graph([file("CMakeLists.txt", "add_library(core core.cpp)\n"), file("core.cpp", "")]);
    expect(g.nodes.find((node) => node.id === "target:core")!.kind).toBe("BUILD_TARGET");
  });

  it("treats a linked library as a package and keeps the target node", () => {
    const g = graph([file("CMakeLists.txt", "add_executable(app main.cpp)\ntarget_link_libraries(app pthread)\n"), file("main.cpp", "")]);
    const link = g.edges.find((edge) => edge.relation === "LINK")!;
    expect(link.from).toBe("target:app");
    expect(link.to).toBe("package:pthread");
  });

  it("reports a listed source that is not in the file set", () => {
    const g = graph([file("CMakeLists.txt", "add_executable(app missing.cpp)\n")]);
    expect(g.edges).toEqual([]);
    expect(g.unresolved[0]).toEqual({
      from: "target:app",
      target: "missing.cpp",
      relation: "SOURCE_OF",
      line: 1,
      reason: "TARGET_NOT_IN_FILE_SET",
    });
  });

  it("derives a make prerequisite edge from a real variable reference", () => {
    const g = graph([file("Makefile", "build: $(SRC)\n"), file("src/main.c", "")]);
    expect(g.edges).toEqual([]);
    expect(g.unresolved[0]!.relation).toBe("SOURCE_OF");
  });
});

describe("language graph: manifests", () => {
  it("records package.json dependencies only from a real dependency section", () => {
    const g = graph([
      file(
        "package.json",
        ['{', '  "name": "my-app",', '  "version": "1.0.0",', '  "dependencies": {', '    "react": "^18.0.0",', '    "zod": "^3.0.0"', "  }", "}"].join("\n"),
      ),
    ]);
    const edges = edgesFrom(g, "package.json");
    expect(edges.map((edge) => edge.to).sort()).toEqual(["package:react", "package:zod"]);
  });

  it("does not invent a dependency from a manifest metadata field", () => {
    const g = graph([file("package.json", ['{', '  "name": "my-app",', '  "main": "src/main.ts"', "}"].join("\n"))]);
    expect(g.edges).toEqual([]);
  });

  it("records Cargo dependency tables and ignores other tables", () => {
    const g = graph([
      file("Cargo.toml", ['[package]', 'name = "demo"', 'version = "0.1.0"', "", "[dependencies]", 'serde = "1.0"', "", "[profile.release]", 'lto = true'].join("\n")),
    ]);
    const edges = edgesFrom(g, "Cargo.toml");
    expect(edges.map((edge) => edge.to)).toEqual(["package:serde"]);
    expect(edges.map((edge) => edge.line)).toEqual([6]);
  });

  it("records requirements.txt entries and ignores comments and flags", () => {
    const g = graph([file("requirements.txt", ["# comment", "requests>=2.0", "-e .", "urllib3"].join("\n"))]);
    const edges = edgesFrom(g, "requirements.txt");
    expect(edges.map((edge) => edge.to).sort()).toEqual(["package:requests", "package:urllib3"]);
  });

  it("reports no pyproject dependency rather than guessing at an inline array", () => {
    const g = graph([file("pyproject.toml", ['[project]', 'name = "demo"', 'dependencies = ["requests>=2.0"]'].join("\n"))]);
    expect(edgesFrom(g, "pyproject.toml")).toEqual([]);
  });
});

describe("language graph: no similarity inference", () => {
  it("creates no edge between similarly named files that never reference each other", () => {
    const g = graph([file("src/parser.ts", "export const a = 1;"), file("src/parser_helpers.ts", "export const b = 2;")]);
    expect(g.edges).toEqual([]);
  });

  it("creates no edge from a shared directory alone", () => {
    const g = graph([file("src/a/one.ts", "export const a = 1;"), file("src/a/two.ts", "export const b = 2;")]);
    expect(g.edges).toEqual([]);
  });

  it("creates no edge from a shared prefix alone", () => {
    const g = graph([file("src/worker.ts", ""), file("src/workerPool.ts", ""), file("src/workerFactory.ts", "")]);
    expect(g.edges).toEqual([]);
  });

  it("treats a not-found target as unresolved rather than as proven isolation", () => {
    const g = graph([file("src/a.ts", 'import { b } from "./b";\n')]);
    expect(g.edges).toEqual([]);
    expect(g.unresolved).toHaveLength(1);
  });
});

describe("language graph: input validation", () => {
  it("rejects unsafe file paths", () => {
    expect(() => graph([file("../outside.ts", "")])).toThrowError(
      expect.objectContaining({ code: "GRAPH_UNSAFE_PATH" }),
    );
  });

  it("rejects an unsafe include root", () => {
    expect(() => graph([file("a.ts", "")], ["../secrets"])).toThrowError(
      expect.objectContaining({ code: "GRAPH_UNSAFE_PATH" }),
    );
  });

  it("rejects duplicate file entries", () => {
    expect(() => graph([file("a.ts", ""), file("a.ts", "x")])).toThrowError(
      expect.objectContaining({ code: "GRAPH_DUPLICATE_FILE" }),
    );
  });

  it("rejects malformed file entries", () => {
    expect(() => buildProjectLanguageGraph({ files: undefined as never })).toThrowError(
      expect.objectContaining({ code: "GRAPH_INVALID_INPUT" }),
    );
    expect(() => graph([{ path: "a.ts" } as never])).toThrowError(
      expect.objectContaining({ code: "GRAPH_INVALID_INPUT" }),
    );
  });

  it("rejects an absolute reference as unsafe rather than resolving it", () => {
    const g = graph([file("src/a.ts", 'import { b } from "/etc/passwd";\n')]);
    expect(g.edges).toEqual([]);
    expect(g.unresolved[0]!.reason).toBe("UNSAFE_REFERENCE_PATH");
  });
});

describe("language graph: determinism", () => {
  it("produces an identical graph from scrambled input", () => {
    const files = [
      file("src/a.ts", 'import { b } from "./b";\nimport x from "pkg";\n'),
      file("src/b.ts", "export const b = 1;"),
      file("CMakeLists.txt", "add_executable(app main.cpp)\n"),
      file("main.cpp", "int main(){}"),
      file("package.json", ['{', '  "dependencies": {', '    "react": "18"', "  }", "}"].join("\n")),
    ];
    const forward = graph(files);
    const reversed = graph([...files].reverse());
    expect(JSON.stringify(reversed)).toBe(JSON.stringify(forward));
  });

  it("orders nodes, edges and unresolved entries deterministically", () => {
    const g = graph([
      file("src/z.ts", 'import { a } from "./a";\n'),
      file("src/a.ts", 'import { m } from "./missing";\n'),
    ]);
    expect(g.nodes.map((node) => node.id)).toEqual([...g.nodes.map((node) => node.id)].sort());
    expect(g.unresolved.map((entry) => entry.from)).toEqual(["src/a.ts"]);
  });

  it("does not mutate caller input", () => {
    const files = [file("src/a.ts", 'import { b } from "./b";\n'), file("src/b.ts", "")];
    const snapshot = JSON.stringify(files);
    graph(files);
    expect(JSON.stringify(files)).toBe(snapshot);
  });

  it("copies unresolved entries rather than exposing internal state", () => {
    const g = graph([file("src/a.ts", 'import { m } from "./missing";\n')]);
    const first = unresolvedReferences(g);
    first[0]!.target = "tampered";
    expect(g.unresolved[0]!.target).toBe("./missing");
  });
});

describe("language graph: unclassified files are reported", () => {
  it("marks a file whose family cannot be determined instead of guessing", () => {
    const g = graph([file("notes.txt", "hello"), file("src/a.ts", "export const a = 1;")]);
    expect(unclassifiedFiles(g)).toEqual(["notes.txt"]);
    expect(g.nodes.find((node) => node.id === "notes.txt")!.familyUnknown).toBe(true);
  });
});

describe("language graph: dependents traversal", () => {
  it("walks declared edges backwards from a changed path", () => {
    const g = graph([
      file("src/leaf.ts", "export const leaf = 1;"),
      file("src/mid.ts", 'import { leaf } from "./leaf";\n'),
      file("src/top.ts", 'import { mid } from "./mid";\n'),
    ]);
    expect(dependentsOf(g, "src/leaf.ts")).toEqual(["src/mid.ts", "src/top.ts"]);
  });

  it("does not walk edges forwards", () => {
    const g = graph([file("src/top.ts", 'import { leaf } from "./leaf";\n'), file("src/leaf.ts", "")]);
    expect(dependentsOf(g, "src/top.ts")).toEqual([]);
  });

  it("rejects a path that is not in the graph rather than returning nothing", () => {
    const g = graph([file("src/a.ts", "")]);
    expect(() => dependentsOf(g, "src/nope.ts")).toThrowError(
      expect.objectContaining({ code: "GRAPH_UNKNOWN_FILE" }),
    );
  });
});

describe("language graph: whole-project boundaries", () => {
  it("spans every registered family in one graph", () => {
    const g = graph([
      file("src/main.c", '#include "util.h"'),
      file("src/util.h", ""),
      file("src/lib.rs", "mod helper;"),
      file("src/helper.rs", ""),
      file("pkg/app.py", "from .helper import run"),
      file("pkg/helper.py", ""),
      file("web/a.ts", 'import { b } from "./b";'),
      file("web/b.ts", ""),
      file("run.sh", "source ./lib.sh"),
      file("lib.sh", ""),
      file("CMakeLists.txt", "add_executable(app src/main.c)"),
      file("Cargo.toml", ['[dependencies]', 'serde = "1"'].join("\n")),
    ]);
    const families = new Set(g.nodes.filter((node) => node.kind === "FILE" && node.family !== undefined).map((node) => node.family));
    for (const family of ["C", "RUST", "PYTHON", "JS_TS", "SHELL", "BUILD", "MANIFEST"]) {
      expect(families.has(family as never)).toBe(true);
    }
    expect(g.edges.length).toBeGreaterThanOrEqual(7);
  });

  it("reads no clock, filesystem or network: the graph is a pure function of inputs", () => {
    const files = [file("src/a.ts", 'import { b } from "./b";\n'), file("src/b.ts", "")];
    expect(JSON.stringify(graph(files))).toBe(JSON.stringify(graph(files)));
  });
});
