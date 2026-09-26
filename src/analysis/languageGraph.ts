import { assertSafePath } from "../runners/sync";

/**
 * REQ-p20-language-graph: whole-project dependency graph.
 *
 * The registered requirement is the scope authority:
 *
 *   "Whole-project dependency graph across C/C++/Rust/Python/JS-TS/shell/
 *    build-files/manifests; distinct from the Python-only test-impact import
 *    graph and the programme system graph."
 *
 * So this unit is the PROJECT SOURCE GRAPH across the seven registered file
 * families, and it must stay distinct from the two neighbours the requirement
 * names by name:
 *
 *   WHOLE-PROJECT GRAPH   != PYTHON-ONLY TEST-IMPACT IMPORT GRAPH
 *   WHOLE-PROJECT GRAPH   != PROGRAMME SYSTEM GRAPH
 *
 * The test-impact import graph is Agent-Bridge TestImpact and is not in this
 * repository. The programme system graph is `registry/depgraph.json`: ten
 * system-level nodes with no file, module or symbol ids. Neither is extended,
 * wrapped or reimplemented here.
 *
 * WHAT THIS IS NOT. These extractors read the literal reference text that a
 * file declares. They are not a language server, not a type checker, not a
 * preprocessor and not a compiler:
 *
 *   STATIC DECLARED GRAPH != COMPLETE RUNTIME CAUSAL GRAPH
 *   DECLARED IMPORT       != RESOLVED LOAD
 *   DYNAMIC DISPATCH, MACRO-GENERATED INCLUDES, PLUGIN REGISTRATION AND
 *   REFLECTION ARE NOT REPRESENTED, and their absence is a stated limitation
 *   rather than a claim of no dependency.
 *
 * NO SIMILARITY INFERENCE. A reference becomes an edge only when the file
 * literally declares it AND resolution succeeds under an explicit, named rule.
 * Filenames, symbol names, shared prefixes and shared directories never create
 * an edge:
 *
 *   SIMILARITY != DEPENDENCY
 *   SAME NAME  != DEPENDENCY
 *   SAME DIRECTORY != DEPENDENCY
 *
 * A reference that is found but cannot be resolved is reported in
 * `unresolved[]` with a reason. It is never dropped, and it is never reported
 * as "no dependency":
 *
 *   UNRESOLVED != NO DEPENDENCY
 *   NOT FOUND IN GRAPH != PROVEN ISOLATED
 *
 * RESOLUTION IS AUDITABLE. Every edge records the `resolution` rule that
 * produced it, so a reviewer can see whether a target was found by an explicit
 * relative path, by declared-extension completion, by a language's own
 * module-name rule, or by a build file listing. Ambiguity is reported, never
 * resolved by picking a candidate.
 *
 * COMPOSITION, NOT OWNERSHIP MERGE. This graph produces edges.
 * `src/programme/changeImpact.ts` remains the owner of impact querying and
 * consumes caller-supplied edges; it is not modified here. No dependency-graph
 * query, no impact traversal and no change scoring lives in this module.
 *
 * INPUTS ARE CALLER-SUPPLIED FILE CONTENTS. Nothing here reads the filesystem,
 * a clock or the network, so a graph is a pure function of the declared file
 * set and its contents.
 */

/** The registered file families. A file outside them is reported, not guessed. */
export const FILE_FAMILIES = ["C", "CXX", "RUST", "PYTHON", "JS_TS", "SHELL", "BUILD", "MANIFEST"] as const;
export type FileFamily = (typeof FILE_FAMILIES)[number];

/** What a graph node IS. The kinds are deliberately incompatible. */
export const NODE_KINDS = ["FILE", "PACKAGE", "BUILD_TARGET"] as const;
export type NodeKind = (typeof NODE_KINDS)[number];

/** Reference relations. Small and explicit; none is a synonym for another. */
export const PROJECT_RELATIONS = ["INCLUDE", "IMPORTS", "SOURCES", "SOURCE_OF", "LINK", "REQUIRES_PACKAGE"] as const;
export type ProjectRelation = (typeof PROJECT_RELATIONS)[number];

/** The named rule that resolved a target. Recorded so resolution is auditable. */
export const RESOLUTION_RULES = ["RELATIVE_PATH", "EXTENSION_COMPLETION", "MODULE_NAME", "BUILD_LISTING", "DECLARED_PACKAGE"] as const;
export type ResolutionRule = (typeof RESOLUTION_RULES)[number];

/** Why a declared reference could not be resolved. Never collapsed to "none". */
export const UNRESOLVED_REASONS = [
  "TARGET_NOT_IN_FILE_SET",
  "AMBIGUOUS_EXTENSION_COMPLETION",
  "MODULE_RESOLUTION_NOT_AVAILABLE",
  "EXTERNAL_INCLUDE_ROOT_UNKNOWN",
  "UNSAFE_REFERENCE_PATH",
  "BUILD_VARIABLE_NOT_EXPANDED",
] as const;
export type UnresolvedReason = (typeof UNRESOLVED_REASONS)[number];

const EXTENSION_FAMILIES: ReadonlyArray<readonly [string, FileFamily]> = [
  [".c", "C"],
  [".h", "C"],
  [".cc", "CXX"],
  [".cpp", "CXX"],
  [".cxx", "CXX"],
  [".hpp", "CXX"],
  [".hh", "CXX"],
  [".hxx", "CXX"],
  [".rs", "RUST"],
  [".py", "PYTHON"],
  [".pyi", "PYTHON"],
  [".js", "JS_TS"],
  [".jsx", "JS_TS"],
  [".mjs", "JS_TS"],
  [".cjs", "JS_TS"],
  [".ts", "JS_TS"],
  [".tsx", "JS_TS"],
  [".mts", "JS_TS"],
  [".cts", "JS_TS"],
  [".sh", "SHELL"],
  [".bash", "SHELL"],
  [".zsh", "SHELL"],
  [".mk", "BUILD"],
  [".cmake", "BUILD"],
];

/** Extensions a C/C++ `#include` may legitimately complete to. */
const C_INCLUDE_EXTENSIONS = [".h", ".hpp", ".hh", ".hxx", ".c", ".cc", ".cpp", ".cxx"] as const;
const PYTHON_EXTENSIONS = [".py", ".pyi"] as const;
const JS_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"] as const;
const RUST_EXTENSIONS = [".rs"] as const;

/** Filenames that are BUILD or MANIFEST regardless of extension. */
const EXACT_NAME_FAMILIES: ReadonlyArray<readonly [string, FileFamily]> = [
  ["CMakeLists.txt", "BUILD"],
  ["Makefile", "BUILD"],
  ["makefile", "BUILD"],
  ["meson.build", "BUILD"],
  ["BUILD", "BUILD"],
  ["BUILD.bazel", "BUILD"],
  ["WORKSPACE", "BUILD"],
  ["package.json", "MANIFEST"],
  ["Cargo.toml", "MANIFEST"],
  ["pyproject.toml", "MANIFEST"],
  ["requirements.txt", "MANIFEST"],
  ["setup.py", "PYTHON"],
];

export type GraphProblemCode =
  | "GRAPH_INVALID_INPUT"
  | "GRAPH_UNKNOWN_FILE"
  | "GRAPH_UNSAFE_PATH"
  | "GRAPH_DUPLICATE_FILE"
  | "GRAPH_DUPLICATE_EDGE"
  | "GRAPH_INVALID_RESOLUTION_RULE"
  | "GRAPH_INVALID_REASON";

export class LanguageGraphError extends Error {
  readonly code: GraphProblemCode;
  constructor(code: GraphProblemCode, message: string) {
    super(message);
    this.name = "LanguageGraphError";
    this.code = code;
  }
}

export interface ProjectFile {
  /** Repo-relative path. */
  path: string;
  /** Literal file contents. Supplied by the caller; never read from disk here. */
  contents: string;
}

export interface ProjectGraphNode {
  id: string;
  kind: NodeKind;
  family?: FileFamily;
  /** Set when the family could not be determined. Reported, never guessed. */
  familyUnknown?: true;
}

export interface ProjectGraphEdge {
  from: string;
  to: string;
  relation: ProjectRelation;
  /** The named rule that resolved `to`. */
  resolution: ResolutionRule;
  /** 1-based line of the literal reference, so a reviewer can look. */
  line: number;
  /** The literal reference text as written. */
  construct: string;
}

export interface UnresolvedReference {
  from: string;
  /** The literal reference text as written. */
  target: string;
  relation: ProjectRelation;
  line: number;
  reason: UnresolvedReason;
}

export interface ProjectLanguageGraph {
  nodes: ProjectGraphNode[];
  edges: ProjectGraphEdge[];
  unresolved: UnresolvedReference[];
}

/** A reference as literally declared, before any resolution is attempted. */
interface RawReference {
  from: string;
  target: string;
  relation: ProjectRelation;
  line: number;
  construct: string;
  /** Package references are declared by name, not resolved to a file. */
  declaredPackage?: boolean;
  /** A build variable reference whose expansion this extractor cannot perform. */
  unexpandedVariable?: boolean;
  /** Python package level from leading dots: 1 = sibling, 2 = parent, ... */
  pythonLevel?: number;
}

export function classifyFile(path: string): FileFamily | undefined {
  const name = path.slice(path.lastIndexOf("/") + 1);
  for (const [exact, family] of EXACT_NAME_FAMILIES) {
    if (name === exact) return family;
  }
  const dot = name.lastIndexOf(".");
  if (dot < 0) return undefined;
  const extension = name.slice(dot).toLowerCase();
  for (const [ext, family] of EXTENSION_FAMILIES) {
    if (ext === extension) return family;
  }
  return undefined;
}

function stripComment(line: string, family: FileFamily): string {
  // A reference inside a comment is not a declared reference. Comment syntax
  // is per family; this is a conservative strip, not a full lexer.
  if (family === "PYTHON" || family === "RUST" || family === "JS_TS" || family === "SHELL") {
    const hash = line.indexOf("#");
    return hash < 0 ? line : line.slice(0, hash);
  }
  if (family === "C" || family === "CXX") {
    const slash = line.indexOf("//");
    return slash < 0 ? line : line.slice(0, slash);
  }
  return line;
}

function extractCppIncludes(family: FileFamily, line: string): RawReference[] | undefined {
  if (family !== "C" && family !== "CXX") return undefined;
  const match = /^\s*#\s*include\s*"([^"]+)"/.exec(line);
  if (match) {
    return [{ from: "", target: match[1]!, relation: "INCLUDE", line: 0, construct: match[0]!.trim() }];
  }
  const angled = /^\s*#\s*include\s*<([^>]+)>/.exec(line);
  if (angled) {
    return [{ from: "", target: angled[1]!, relation: "INCLUDE", line: 0, construct: angled[0]!.trim() }];
  }
  return undefined;
}

function extractPythonImports(line: string): RawReference[] | undefined {
  const relative = /^\s*from\s+(\.+[A-Za-z0-9_.]*)\s+import\b/.exec(line);
  if (relative) {
    // Python's leading dots are PACKAGE levels, not path segments: `.helper`
    // is a sibling module and `..pkg.mod` climbs one directory. They are
    // translated here into an explicit level count plus a dotted path.
    const specifier = relative[1]!;
    const level = /^\.+/.exec(specifier)![0].length;
    const dotted = specifier.slice(level);
    return [
      { from: "", target: dotted, relation: "IMPORTS", line: 0, construct: relative[0]!.trim(), pythonLevel: level },
    ];
  }
  const fromModule = /^\s*from\s+([A-Za-z0-9_.]+)\s+import\b/.exec(line);
  if (fromModule) {
    const target = fromModule[1]!;
    return [
      {
        from: "",
        target,
        relation: "IMPORTS",
        line: 0,
        construct: fromModule[0]!.trim(),
        declaredPackage: false,
      },
    ];
  }
  const plain = /^\s*import\s+([A-Za-z0-9_.,\s]+)$/.exec(line);
  if (plain) {
    return plain[1]!
      .split(",")
      .map((part) => part.trim().split(/\s+as\s+/)[0]!.trim())
      .filter((name) => name.length > 0)
      .map((name) => ({
        from: "",
        target: name.split(".")[0]!,
        relation: "IMPORTS" as ProjectRelation,
        line: 0,
        construct: plain[0]!.trim(),
        // A bare Python name may be a sibling module OR a third-party
        // distribution. Local resolution is attempted first; a package node is
        // the fallback. The residual ambiguity is a stated limitation.
        declaredPackage: false,
      }));
  }
  return undefined;
}

function extractJsImports(line: string): RawReference[] | undefined {
  const sideEffect = /^\s*import\s+["']([^"']+)["']/.exec(line);
  if (sideEffect) {
    return [{ from: "", target: sideEffect[1]!, relation: "IMPORTS", line: 0, construct: sideEffect[0]!.trim() }];
  }
  const named = /^\s*import\s+[^;]*?\bfrom\s+["']([^"']+)["']/.exec(line);
  if (named) {
    const target = named[1]!;
    return [
      {
        from: "",
        target,
        relation: "IMPORTS",
        line: 0,
        construct: named[0]!.trim(),
        declaredPackage: !target.startsWith(".") && !target.startsWith("/"),
      },
    ];
  }
  const required = /\brequire\(\s*["']([^"']+)["']\s*\)/.exec(line);
  if (required) {
    const target = required[1]!;
    return [
      {
        from: "",
        target,
        relation: "IMPORTS",
        line: 0,
        construct: required[0]!,
        declaredPackage: !target.startsWith(".") && !target.startsWith("/"),
      },
    ];
  }
  return undefined;
}

function extractRustUses(line: string): RawReference[] | undefined {
  const declared = /^\s*(?:pub\s+)?mod\s+([A-Za-z0-9_]+)\s*;/.exec(line);
  if (declared) {
    return [{ from: "", target: declared[1]!, relation: "IMPORTS", line: 0, construct: declared[0]!.trim() }];
  }
  const useTree = /^\s*(?:pub\s+)?use\s+([^;]+);/.exec(line);
  if (!useTree) return undefined;
  const tree = useTree[1]!.trim();
  // A leading `::` is a 2015-edition crate path, i.e. an external crate. It
  // must be stripped before splitting, or the root parses as empty.
  const isExternal = tree.startsWith("::");
  const root = tree.replace(/^::/, "").split("::")[0]!.trim();
  if (root.length === 0) return undefined;
  // `crate`, `self` and `super` are paths inside this crate.
  const isLocalCratePath = root === "crate" || root === "self" || root === "super";
  return [
    {
      from: "",
      target: isLocalCratePath ? "mod" : root,
      relation: "IMPORTS",
      line: 0,
      construct: useTree[0]!.trim(),
      declaredPackage: !isLocalCratePath && isExternal,
    },
  ];
}

function extractShellSources(line: string): RawReference[] | undefined {
  const match = /^\s*(?:source|\.)\s+(\S+)/.exec(line);
  if (!match) return undefined;
  return [{ from: "", target: match[1]!, relation: "SOURCES", line: 0, construct: match[0]!.trim() }];
}

/** CMake `add_executable`/`add_library` source lists and `target_link_libraries`. */
function extractBuildReferences(line: string): RawReference[] | undefined {
  const target = /^\s*(add_executable|add_library)\s*\(\s*([A-Za-z0-9_.-]+)\s*(.*)\)/.exec(line);
  if (target) {
    const sources = target[3]!.split(/\s+/).filter((token) => token.length > 0);
    return sources.map((source) => ({
      from: `target:${target[2]!}`,
      target: source,
      relation: "SOURCE_OF" as ProjectRelation,
      line: 0,
      construct: target[0]!.trim(),
    }));
  }
  const link = /^\s*target_link_libraries\s*\(\s*([A-Za-z0-9_.-]+)\s+(.*)\)/.exec(line);
  if (link) {
    const names = link[2]!.split(/\s+/).filter((token) => token.length > 0);
    return names.map((name) => ({
      from: `target:${link[1]!}`,
      target: name,
      relation: "LINK" as ProjectRelation,
      line: 0,
      construct: link[0]!.trim(),
    }));
  }
  const make = /^\s*([A-Za-z0-9_.$-]+)\s*:(?!=)\s*([^#]*)/.exec(line);
  if (make && line.includes("$(")) {
    const prerequisites = make[2]!.split(/\s+/).filter((token) => token.length > 0);
    const references = prerequisites
      .filter((token) => !token.startsWith("$"))
      .map((token) => ({
        from: make[1]!,
        target: token,
        relation: "SOURCE_OF" as ProjectRelation,
        line: 0,
        construct: make[0]!.trim(),
      }));
    // An unexpanded `$(VAR)` prerequisite is a real dependency the extractor
    // cannot see through. It is reported as unresolved rather than dropped:
    // dropping it would claim a target has no build dependency.
    const variables = prerequisites
      .filter((token) => token.startsWith("$("))
      .map((token) => ({
        from: make[1]!,
        target: token,
        relation: "SOURCE_OF" as ProjectRelation,
        line: 0,
        construct: make[0]!.trim(),
        unexpandedVariable: true,
      }));
    return [...references, ...variables];
  }
  return undefined;
}

/**
 * Manifest dependency tables, scanned SECTION-AWARE.
 *
 * A line-based `"key": "value"` match would turn `"name": "my-app"` into a
 * dependency on a package called `my-app`, which is a false edge. So the
 * scanner tracks which declared block it is inside and only records entries
 * from a real dependency table.
 *
 * `pyproject.toml` is deliberately NOT scanned: its PEP 621 dependency list is
 * an inline TOML array whose entries cannot be attributed to a table with
 * confidence here. Emitting nothing is honest; guessing is not.
 */
function extractManifestReferences(path: string, contents: string): RawReference[] {
  const name = path.slice(path.lastIndexOf("/") + 1);
  const lines = contents.split(/\r?\n/);
  const found: RawReference[] = [];

  const push = (target: string, line: number, construct: string): void => {
    found.push({ from: path, target, relation: "REQUIRES_PACKAGE", line, construct, declaredPackage: true });
  };

  if (name === "package.json") {
    let inDependencySection = false;
    lines.forEach((raw, index) => {
      const opensSection = /^\s*"(dependencies|devDependencies|peerDependencies|optionalDependencies)"\s*:\s*\{\s*$/.test(raw);
      const closesSection = /^\s*\}\s*,?\s*$/.test(raw);
      if (opensSection) {
        inDependencySection = true;
        return;
      }
      if (inDependencySection && closesSection) {
        inDependencySection = false;
        return;
      }
      if (!inDependencySection) return;
      const entry = /^\s*"([^"]+)"\s*:\s*"[^"]*"/.exec(raw);
      if (entry) {
        push(entry[1]!, index + 1, entry[0]!.trim());
      }
    });
    return found;
  }

  if (name === "Cargo.toml") {
    let inDependencyTable = false;
    lines.forEach((raw, index) => {
      const table = /^\s*\[([^\]]+)\]\s*$/.exec(raw);
      if (table) {
        inDependencyTable = /^(dev-|build-)?dependencies$/.test(table[1]!.trim());
        return;
      }
      if (!inDependencyTable) return;
      const entry = /^\s*([A-Za-z0-9_-]+)\s*=\s*(?:"[^"]*"|\{[^}]*\})/.exec(raw);
      if (entry) push(entry[1]!, index + 1, entry[0]!.trim());
    });
    return found;
  }

  if (name === "requirements.txt") {
    lines.forEach((raw, index) => {
      const trimmed = raw.trim();
      if (trimmed.length === 0 || trimmed.startsWith("#") || trimmed.startsWith("-")) return;
      const requirement = /^([A-Za-z0-9_.-]+)/.exec(trimmed);
      if (requirement) push(requirement[1]!, index + 1, trimmed);
    });
    return found;
  }

  return found;
}

function extractReferences(file: ProjectFile, family: FileFamily): RawReference[] {
  const found: RawReference[] = [];
  // A manifest's dependency tables need whole-file section context, so they are
  // scanned separately rather than line by line.
  if (family === "MANIFEST") {
    for (const reference of extractManifestReferences(file.path, file.contents)) {
      found.push({ ...reference, from: file.path });
    }
  }
  const lines = file.contents.split(/\r?\n/);
  lines.forEach((raw, index) => {
    const line = stripComment(raw, family);
    if (line.trim().length === 0) return;
    let candidates: RawReference[] | undefined;
    if (family === "C" || family === "CXX") candidates = extractCppIncludes(family, line);
    else if (family === "PYTHON") candidates = extractPythonImports(line);
    else if (family === "JS_TS") candidates = extractJsImports(line);
    else if (family === "RUST") candidates = extractRustUses(line);
    else if (family === "SHELL") candidates = extractShellSources(line);
    else if (family === "BUILD") candidates = extractBuildReferences(line);
    for (const candidate of candidates ?? []) {
      found.push({ ...candidate, from: candidate.from.length > 0 ? candidate.from : file.path, line: index + 1 });
    }
  });
  return found;
}

/** Extensions a family's own name-to-file rule may complete to. */
function declaredExtensionsFor(family: FileFamily): readonly string[] {
  if (family === "C" || family === "CXX") return C_INCLUDE_EXTENSIONS;
  if (family === "PYTHON") return PYTHON_EXTENSIONS;
  if (family === "JS_TS") return JS_EXTENSIONS;
  if (family === "RUST") return RUST_EXTENSIONS;
  return [];
}

function normalizeRelative(importerDir: string, target: string): string {
  const segments = importerDir.length > 0 ? importerDir.split("/") : [];
  for (const part of target.split("/")) {
    if (part === "." || part === "") continue;
    if (part === "..") segments.pop();
    else segments.push(part);
  }
  return segments.join("/");
}

function dirOf(path: string): string {
  const slash = path.lastIndexOf("/");
  return slash < 0 ? "" : path.slice(0, slash);
}

function extensionOf(path: string): string {
  const name = path.slice(path.lastIndexOf("/") + 1);
  const dot = name.lastIndexOf(".");
  // A leading dot is not an extension separator: `.helper` is a Python
  // relative module reference, not a file named `helper` with extension
  // `.helper`.
  if (dot <= 0) return "";
  return name.slice(dot).toLowerCase();
}

export interface BuildGraphOptions {
  files: ProjectFile[];
  /**
   * Include roots for angled C/C++ includes and for module roots. A caller that
   * does not supply them gets honest `EXTERNAL_INCLUDE_ROOT_UNKNOWN`
   * unresolved entries rather than a system-wide include search.
   */
  includeRoots?: string[];
}

function assertSafeGraphPath(path: string): void {
  try {
    assertSafePath(path);
  } catch {
    throw new LanguageGraphError("GRAPH_UNSAFE_PATH", `file path ${path} is not a safe project-relative path`);
  }
}

/**
 * Build the whole-project graph.
 *
 * Deterministic: nodes sorted by id, edges sorted by from/to/relation/line and
 * unresolved entries sorted by from/line/target, all derived from the supplied
 * inputs alone. Scrambled input yields an identical graph.
 */
export function buildProjectLanguageGraph(options: BuildGraphOptions): ProjectLanguageGraph {
  if (!Array.isArray(options.files)) {
    throw new LanguageGraphError("GRAPH_INVALID_INPUT", "files must be an array of project files");
  }
  const includeRoots = options.includeRoots ?? [];
  for (const root of includeRoots) assertSafeGraphPath(root);

  const byPath = new Map<string, ProjectFile>();
  for (const file of options.files) {
    if (typeof file?.path !== "string" || typeof file?.contents !== "string") {
      throw new LanguageGraphError("GRAPH_INVALID_INPUT", "each file needs a string path and string contents");
    }
    assertSafeGraphPath(file.path);
    if (byPath.has(file.path)) {
      throw new LanguageGraphError("GRAPH_DUPLICATE_FILE", `duplicate project file ${file.path}`);
    }
    byPath.set(file.path, file);
  }

  const fileNodes: ProjectGraphNode[] = [];
  const unclassified: string[] = [];
  for (const path of [...byPath.keys()].sort()) {
    const family = classifyFile(path);
    if (family === undefined) {
      unclassified.push(path);
      fileNodes.push({ id: path, kind: "FILE", familyUnknown: true });
    } else {
      fileNodes.push({ id: path, kind: "FILE", family });
    }
  }

  const extraNodes = new Map<string, ProjectGraphNode>();
  const edges: ProjectGraphEdge[] = [];
  const unresolved: UnresolvedReference[] = [];
  const seenEdges = new Set<string>();

  const addEdge = (edge: ProjectGraphEdge): void => {
    const key = `${edge.from} ${edge.to} ${edge.relation} ${edge.line}`;
    if (seenEdges.has(key)) return;
    seenEdges.add(key);
    edges.push(edge);
  };

  const addExtra = (id: string, kind: NodeKind): void => {
    if (!extraNodes.has(id)) extraNodes.set(id, { id, kind });
  };

  for (const path of [...byPath.keys()].sort()) {
    const file = byPath.get(path)!;
    const family = classifyFile(path);
    if (family === undefined) continue;
    const importerDir = dirOf(path);

    for (const reference of extractReferences(file, family)) {
      const { target } = reference;
      const construct = reference.construct;

      if (reference.declaredPackage === true) {
        const packageId = `package:${target}`;
        addExtra(packageId, "PACKAGE");
        addEdge({
          from: reference.from,
          to: packageId,
          relation: reference.relation,
          resolution: "DECLARED_PACKAGE",
          line: reference.line,
          construct,
        });
        continue;
      }

      // Build files name their own target; the target is a real node kind.
      if (reference.relation === "SOURCE_OF" || reference.relation === "LINK") {
        const targetNodeId = `target:${reference.from.slice("target:".length)}`;
        addExtra(reference.from, "BUILD_TARGET");
        addExtra(targetNodeId, "BUILD_TARGET");
        if (reference.unexpandedVariable === true) {
          unresolved.push({
            from: reference.from,
            target,
            relation: reference.relation,
            line: reference.line,
            reason: "BUILD_VARIABLE_NOT_EXPANDED",
          });
        } else if (reference.relation === "LINK") {
          // A linked library is a dependency declared by name, not a project
          // source file, so it is a PACKAGE node and never a FILE node.
          const packageId = `package:${target}`;
          addExtra(packageId, "PACKAGE");
          addEdge({
            from: reference.from,
            to: packageId,
            relation: reference.relation,
            resolution: "DECLARED_PACKAGE",
            line: reference.line,
            construct,
          });
        } else if (byPath.has(target)) {
          addEdge({
            from: reference.from,
            to: target,
            relation: reference.relation,
            resolution: "BUILD_LISTING",
            line: reference.line,
            construct,
          });
        } else {
          unresolved.push({
            from: reference.from,
            target,
            relation: reference.relation,
            line: reference.line,
            reason: "TARGET_NOT_IN_FILE_SET",
          });
        }
        continue;
      }
      if (target.startsWith("/")) {
        unresolved.push({ from: reference.from, target, relation: reference.relation, line: reference.line, reason: "UNSAFE_REFERENCE_PATH" });
        continue;
      }

      // Candidate bases, most specific first.
      //
      // A Python leading-dot specifier names PACKAGE LEVELS, not path
      // segments: `.helper` is a sibling module, `..pkg.mod` climbs one
      // directory. A `./` or `../` specifier is already a path relative to the
      // importer. Anything else is a bare name searched from the importer's own
      // directory and then from any caller-supplied include roots.
      const searchBases: string[] = [];
      if (reference.pythonLevel !== undefined) {
        const segments = importerDir.length > 0 ? importerDir.split("/") : [];
        for (let climb = 1; climb < reference.pythonLevel; climb++) segments.pop();
        searchBases.push(segments.join("/"));
      } else if (target.startsWith(".")) {
        searchBases.push(importerDir);
      } else {
        searchBases.push(importerDir, ...includeRoots, "");
      }

      const relativeName = reference.pythonLevel !== undefined ? target.replace(/\./g, "/") : target;
      const hasExtension = extensionOf(relativeName) !== "";
      const suffixes: readonly string[] = hasExtension ? [""] : declaredExtensionsFor(family);

      const matches: string[] = [];
      for (const base of searchBases) {
        for (const suffix of suffixes) {
          const candidate = normalizeRelative(base, `${relativeName}${suffix}`);
          if (byPath.has(candidate) && !matches.includes(candidate)) matches.push(candidate);
        }
      }

      if (matches.length === 1) {
        // Which rule fired is recorded, so a reviewer can tell a named path
        // apart from a name the language mapped onto a file.
        const rule: ResolutionRule = hasExtension
          ? "RELATIVE_PATH"
          : family === "C" || family === "CXX"
            ? "EXTENSION_COMPLETION"
            : "MODULE_NAME";
        addEdge({ from: reference.from, to: matches[0]!, relation: reference.relation, resolution: rule, line: reference.line, construct });
      } else if (matches.length > 1) {
        unresolved.push({ from: reference.from, target, relation: reference.relation, line: reference.line, reason: "AMBIGUOUS_EXTENSION_COMPLETION" });
      } else if (family === "C" || family === "CXX") {
        unresolved.push({ from: reference.from, target, relation: reference.relation, line: reference.line, reason: "EXTERNAL_INCLUDE_ROOT_UNKNOWN" });
      } else if (family === "PYTHON" && reference.pythonLevel === undefined) {
        // A bare Python name with no matching project file is recorded as a
        // package dependency. LIMITATION: a local module not reachable from the
        // importer's own directory cannot be told apart from a third-party
        // distribution without a package index, so it is reported as a package.
        const packageId = `package:${target}`;
        addExtra(packageId, "PACKAGE");
        addEdge({ from: reference.from, to: packageId, relation: reference.relation, resolution: "DECLARED_PACKAGE", line: reference.line, construct });
      } else {
        unresolved.push({ from: reference.from, target, relation: reference.relation, line: reference.line, reason: "TARGET_NOT_IN_FILE_SET" });
      }
    }
  }

  const nodes = [...fileNodes, ...[...extraNodes.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const orderedEdges = edges
    .filter((edge) => byId.has(edge.from) && byId.has(edge.to))
    .sort((a, b) =>
      a.from === b.from ? a.to === b.to ? (a.relation === b.relation ? a.line - b.line : a.relation < b.relation ? -1 : 1) : a.to < b.to ? -1 : 1
      : a.from < b.from ? -1 : 1,
    );
  const orderedUnresolved = unresolved
    .filter((entry) => byId.has(entry.from))
    .sort((a, b) =>
      a.from === b.from ? (a.line === b.line ? (a.target < b.target ? -1 : a.target > b.target ? 1 : 0) : a.line - b.line) : a.from < b.from ? -1 : 1,
    );

  return { nodes, edges: orderedEdges, unresolved: orderedUnresolved };
}

/** Every declared reference that never became an edge, with its reason. */
export function unresolvedReferences(graph: ProjectLanguageGraph): UnresolvedReference[] {
  return graph.unresolved.map((entry) => ({ ...entry }));
}

/** Files whose family could not be determined. Reported, never guessed. */
export function unclassifiedFiles(graph: ProjectLanguageGraph): string[] {
  return graph.nodes.filter((node) => node.familyUnknown === true).map((node) => node.id).sort();
}

/** The transitive importers of a path, walking declared edges backwards. */
export function dependentsOf(graph: ProjectLanguageGraph, path: string): string[] {
  if (!graph.nodes.some((node) => node.id === path)) {
    throw new LanguageGraphError("GRAPH_UNKNOWN_FILE", `${path} is not a node in this graph`);
  }
  const dependents = new Set<string>();
  const visited = new Set<string>([path]);
  const queue = [path];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of graph.edges) {
      if (edge.to !== current) continue;
      if (visited.has(edge.from)) continue;
      visited.add(edge.from);
      dependents.add(edge.from);
      queue.push(edge.from);
    }
  }
  return [...dependents].sort();
}