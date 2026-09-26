/**
 * REQ-p20-toolchain-registry: versioned toolchain inventory.
 *
 * The registered requirement is the scope authority:
 *
 *   "Versioned inventory of compilers, interpreters, SDKs, package managers,
 *    build systems and language runtimes with versions, executable paths,
 *    availability and provenance; generic tool capability refs do not satisfy
 *    this."
 *
 * So this is a CONCRETE, VERSIONED INVENTORY of six registered tool kinds,
 * where every tool carries four things the requirement names: a version, an
 * executable path, an availability, and provenance for each fact.
 *
 * GENERIC TOOL CAPABILITY REFS DO NOT SATISFY THIS. `src/providers/capabilities.ts`
 * is exactly that: a model card carrying boolean capability flags
 * (`toolUse`, `structuredOutput`, `coding`, ...). A boolean says a model *claims*
 * a capability. It says nothing about which compiler is installed, at which
 * version, at which path, or whether that path exists:
 *
 *   GENERIC TOOL CAPABILITY REF != TOOLCHAIN INVENTORY
 *   CAPABILITY FLAG != VERSION
 *   CAPABILITY FLAG != EXECUTABLE PATH
 *   "CLAIMS toolUse" != "gcc 13.2 is on disk at /usr/bin/gcc"
 *
 * An entry that carries capability-shaped booleans and no concrete version and
 * path is rejected, not stored.
 *
 * AVAILABILITY IS DERIVED, NEVER ASSERTED. A caller cannot declare a tool
 * AVAILABLE. Availability follows from evidence:
 *
 *   AVAILABLE iff version REPORTED and path REPORTED and path VERIFIED
 *
 * An unknown version is not a version, and a claimed path is a claim:
 *
 *   UNKNOWN VERSION != AVAILABLE TOOL
 *   UNKNOWN VERSION != "latest"
 *   CLAIMED PATH  != VERIFIED PATH
 *   NEVER INVENTED VERSION, NEVER "latest", NEVER A DEFAULT
 *
 * The four ways a tool is not available stay distinguishable, because they call
 * for different responses:
 *
 *   VERSION_UNKNOWN            the tool's version was not observed
 *   PATH_UNKNOWN              no executable path was observed
 *   PATH_UNVERIFIED           a path was reported but not verified to exist
 *   NOT_INSTALLED             nothing was observed at all
 *
 * ABSENT IS NOT UNKNOWN. A tool that was never recorded is NOT_FOUND, which is
 * a different fact from a recorded tool whose version is unknown:
 *
 *   NOT_FOUND != RECORDED_BUT_UNKNOWN
 *   NOT_FOUND != UNAVAILABLE
 *
 * NAMES NEVER RESOLVE. Resolution is by explicit `toolId`, or by asking for the
 * single tool of a kind. Two tools of the same kind are ambiguous, not a
 * coin flip:
 *
 *   SIMILARITY != RESOLUTION
 *   NAME != IDENTITY
 *   TWO CANDIDATES != PICK ONE
 *
 * The registry also refuses to guess which of several same-named tools is
 * meant, and never resolves by fuzzy or prefix matching.
 *
 * WHAT THIS IS NOT. An inventory entry is not permission to run anything:
 *
 *   INVENTORY != EXECUTION AUTHORITY
 *   TOOL PRESENT != AUTHORIZED TO EXECUTE
 *   INVENTORY != PROVISIONING
 *
 * It is not an installer, a downloader, or a resolver. Nothing here fetches,
 * installs, downloads, shells out, or repairs a missing tool. A missing tool is
 * reported UNAVAILABLE with a reason; the registry does not go and get it.
 *
 *   REGISTRY != DURABLE STORE
 *
 * The registry is in-memory and caller-constructed. There is no database, no
 * cache, no service, no scheduler and no server surface. The only executable
 * facts come from the caller, so the registry reads no clock, no filesystem and
 * no network.
 */

/** The six registered tool kinds. */
export const TOOL_KINDS = [
  "COMPILER",
  "INTERPRETER",
  "SDK",
  "PACKAGE_MANAGER",
  "BUILD_SYSTEM",
  "RUNTIME",
] as const;
export type ToolKind = (typeof TOOL_KINDS)[number];

/** Why a recorded tool is not available. Each calls for a different response. */
export const UNAVAILABLE_REASONS = [
  "VERSION_UNKNOWN",
  "PATH_UNKNOWN",
  "PATH_UNVERIFIED",
  "NOT_INSTALLED",
] as const;
export type UnavailableReason = (typeof UNAVAILABLE_REASONS)[number];

/** Lookup outcomes. Absent, unknown and unavailable are three different facts. */
export const TOOL_LOOKUP = ["FOUND", "NOT_FOUND", "AMBIGUOUS"] as const;
export type ToolLookup = (typeof TOOL_LOOKUP)[number];

/** A version, either observed with provenance or explicitly unknown. */
export type VersionFact =
  | { state: "REPORTED"; value: string; provenance: string }
  | { state: "UNKNOWN"; reason: string };

/** An executable path, observed with provenance and an explicit verified flag. */
export type PathFact =
  | { state: "REPORTED"; value: string; verified: boolean; provenance: string }
  | { state: "UNKNOWN"; reason: string };

export interface ToolEntry {
  /** Stable identity. The ONLY thing resolution matches on. */
  toolId: string;
  kind: ToolKind;
  /**
   * Display name as reported. Recorded for humans, never used for resolution.
   */
  name: string;
  version: VersionFact;
  executablePath: PathFact;
  /**
   * DERIVED, never asserted. See `deriveAvailability`.
   */
  availability: "AVAILABLE" | "UNAVAILABLE";
  /** Present exactly when availability is UNAVAILABLE. */
  unavailableReason?: UnavailableReason;
  /** Provenance for the record itself: who observed this and how. */
  provenance: string;
  /** The inventory version this observation was recorded under. */
  observedUnderInventory: number;
}

export interface ToolchainRegistry {
  /** The inventory is itself versioned. */
  inventoryVersion: number;
  entries: ToolEntry[];
}

export type ToolchainProblemCode =
  | "TOOLCHAIN_INVALID_INPUT"
  | "TOOLCHAIN_UNKNOWN_FIELD"
  | "TOOLCHAIN_GENERIC_REF_REJECTED"
  | "TOOLCHAIN_UNKNOWN_KIND"
  | "TOOLCHAIN_DUPLICATE_TOOL_ID"
  | "TOOLCHAIN_DERIVED_FIELD_REJECTED"
  | "TOOLCHAIN_AMBIGUOUS"
  | "TOOLCHAIN_NOT_FOUND";

export class ToolchainError extends Error {
  readonly code: ToolchainProblemCode;
  constructor(code: ToolchainProblemCode, message: string) {
    super(message);
    this.name = "ToolchainError";
    this.code = code;
  }
}

const TOOL_FIELDS = [
  "toolId",
  "kind",
  "name",
  "version",
  "executablePath",
  "availability",
  "unavailableReason",
  "provenance",
  "observedUnderInventory",
] as const;

const REGISTRY_FIELDS = ["inventoryVersion", "entries"] as const;

/**
 * Capability-shaped keys. An entry carrying these and no concrete version and
 * path is the generic ref the registered requirement refuses.
 */
const CAPABILITY_KEYS = [
  "capabilities",
  "toolUse",
  "structuredOutput",
  "coding",
  "reasoning",
  "vision",
  "audio",
  "supportsTools",
  "supportsStructuredOutput",
  "healthy",
  "costRank",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Derive availability from evidence. A caller cannot pass availability in; it is
 * computed here so an unobserved tool can never be recorded as available.
 */
export function deriveAvailability(input: {
  version: VersionFact;
  executablePath: PathFact;
}): { availability: "AVAILABLE" | "UNAVAILABLE"; unavailableReason?: UnavailableReason } {
  if (input.version.state === "UNKNOWN") return { availability: "UNAVAILABLE", unavailableReason: "VERSION_UNKNOWN" };
  if (input.executablePath.state === "UNKNOWN") return { availability: "UNAVAILABLE", unavailableReason: "PATH_UNKNOWN" };
  if (!input.executablePath.verified) return { availability: "UNAVAILABLE", unavailableReason: "PATH_UNVERIFIED" };
  return { availability: "AVAILABLE" };
}

function assertVersionFact(value: unknown, where: string): VersionFact {
  if (!isPlainObject(value)) throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", `${where} version must be an object`);
  const keys = Object.keys(value);
  for (const key of keys) {
    if (!["state", "value", "provenance", "reason"].includes(key)) {
      throw new ToolchainError("TOOLCHAIN_UNKNOWN_FIELD", `unknown version field ${key}`);
    }
  }
  if (value.state === "REPORTED") {
    if (typeof value.value !== "string" || value.value.length === 0) {
      throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", "a REPORTED version needs a non-empty value");
    }
    if (typeof value.provenance !== "string" || value.provenance.length === 0) {
      throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", "a REPORTED version requires provenance");
    }
    if (value.value.trim().toLowerCase() === "latest" || value.value.trim().toLowerCase() === "unknown") {
      throw new ToolchainError(
        "TOOLCHAIN_INVALID_INPUT",
        `version "${value.value}" is not an observed version: NEVER INVENTED VERSION, NEVER "latest"`,
      );
    }
    return { state: "REPORTED", value: value.value, provenance: value.provenance };
  }
  if (value.state === "UNKNOWN") {
    if (typeof value.reason !== "string" || value.reason.length === 0) {
      throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", "an UNKNOWN version requires a reason");
    }
    return { state: "UNKNOWN", reason: value.reason };
  }
  throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", `${where} version state must be REPORTED or UNKNOWN`);
}

function assertPathFact(value: unknown): PathFact {
  if (!isPlainObject(value)) {
    throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", "executablePath must be an object");
  }
  for (const key of Object.keys(value)) {
    if (!["state", "value", "verified", "provenance", "reason"].includes(key)) {
      throw new ToolchainError("TOOLCHAIN_UNKNOWN_FIELD", `unknown executablePath field ${key}`);
    }
  }
  if (value.state === "REPORTED") {
    if (typeof value.value !== "string" || value.value.length === 0) {
      throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", "a REPORTED path needs a non-empty value");
    }
    if (typeof value.verified !== "boolean") {
      throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", "a REPORTED path requires an explicit verified boolean");
    }
    if (typeof value.provenance !== "string" || value.provenance.length === 0) {
      throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", "a REPORTED path requires provenance");
    }
    return { state: "REPORTED", value: value.value, verified: value.verified, provenance: value.provenance };
  }
  if (value.state === "UNKNOWN") {
    if (typeof value.reason !== "string" || value.reason.length === 0) {
      throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", "an UNKNOWN path requires a reason");
    }
    return { state: "UNKNOWN", reason: value.reason };
  }
  throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", "executablePath state must be REPORTED or UNKNOWN");
}

export function createToolchainRegistry(inventoryVersion: number): ToolchainRegistry {
  if (!Number.isInteger(inventoryVersion) || inventoryVersion < 1) {
    throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", "inventoryVersion must be a positive integer");
  }
  return { inventoryVersion, entries: [] };
}

/**
 * Record one observed tool.
 *
 * `availability` is refused as an input: it is derived from the evidence so that
 * a caller cannot assert availability it did not observe.
 */
export function recordTool(
  registry: ToolchainRegistry,
  input: Record<string, unknown>,
): ToolchainRegistry {
  if (!isPlainObject(registry)) {
    throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", "registry must be an object");
  }
  for (const key of Object.keys(registry)) {
    if (!(REGISTRY_FIELDS as readonly string[]).includes(key)) {
      throw new ToolchainError("TOOLCHAIN_UNKNOWN_FIELD", `unknown registry field ${key}`);
    }
  }
  if (!isPlainObject(input)) {
    throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", "tool entry must be an object");
  }

  // The generic capability ref, refused by name.
  for (const key of Object.keys(input)) {
    if (CAPABILITY_KEYS.includes(key)) {
      throw new ToolchainError(
        "TOOLCHAIN_GENERIC_REF_REJECTED",
        `entry carries ${key}: a generic tool capability ref does not satisfy the toolchain inventory`,
      );
    }
  }
  if (input.availability !== undefined) {
    throw new ToolchainError(
      "TOOLCHAIN_DERIVED_FIELD_REJECTED",
      "availability is derived from evidence and must not be supplied",
    );
  }
  for (const key of Object.keys(input)) {
    if (!(TOOL_FIELDS as readonly string[]).includes(key)) {
      throw new ToolchainError("TOOLCHAIN_UNKNOWN_FIELD", `unknown tool entry field ${key}`);
    }
  }
  if (typeof input.toolId !== "string" || input.toolId.length === 0) {
    throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", "toolId must be a non-empty string");
  }
  if (!TOOL_KINDS.includes(input.kind as ToolKind)) {
    throw new ToolchainError("TOOLCHAIN_UNKNOWN_KIND", `unknown tool kind ${String(input.kind)}`);
  }
  if (typeof input.name !== "string" || input.name.length === 0) {
    throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", "name must be a non-empty string");
  }
  if (typeof input.provenance !== "string" || input.provenance.length === 0) {
    throw new ToolchainError("TOOLCHAIN_INVALID_INPUT", "every tool record requires provenance");
  }
  if (registry.entries.some((entry) => entry.toolId === input.toolId)) {
    throw new ToolchainError("TOOLCHAIN_DUPLICATE_TOOL_ID", `tool ${String(input.toolId)} is already recorded`);
  }

  const version = assertVersionFact(input.version, "tool entry");
  const executablePath = assertPathFact(input.executablePath);
  const derived = deriveAvailability({ version, executablePath });

  const entry: ToolEntry = {
    toolId: input.toolId,
    kind: input.kind as ToolKind,
    name: input.name,
    version,
    executablePath,
    availability: derived.availability,
    ...(derived.unavailableReason === undefined ? {} : { unavailableReason: derived.unavailableReason }),
    provenance: input.provenance,
    observedUnderInventory: registry.inventoryVersion,
  };

  return {
    inventoryVersion: registry.inventoryVersion,
    entries: [...registry.entries, entry].sort((a, b) => (a.toolId < b.toolId ? -1 : a.toolId > b.toolId ? 1 : 0)),
  };
}

/** Look up by explicit id. Names and kinds are never used to resolve. */
export function findTool(registry: ToolchainRegistry, toolId: string): ToolEntry {
  const entry = registry.entries.find((candidate) => candidate.toolId === toolId);
  if (entry === undefined) {
    throw new ToolchainError("TOOLCHAIN_NOT_FOUND", `tool ${toolId} is not in this inventory`);
  }
  return entry;
}

/** Every recorded tool of a kind, in canonical id order. */
export function toolsOfKind(registry: ToolchainRegistry, kind: ToolKind): ToolEntry[] {
  if (!TOOL_KINDS.includes(kind)) {
    throw new ToolchainError("TOOLCHAIN_UNKNOWN_KIND", `unknown tool kind ${String(kind)}`);
  }
  return registry.entries.filter((entry) => entry.kind === kind);
}

/**
 * The single tool of a kind, or an explicit ambiguity.
 *
 * Two compilers in one inventory is a real situation, not something to resolve
 * by guessing which one was meant.
 */
export function requireSingleTool(registry: ToolchainRegistry, kind: ToolKind): ToolEntry {
  const matches = toolsOfKind(registry, kind);
  if (matches.length === 0) {
    throw new ToolchainError("TOOLCHAIN_NOT_FOUND", `no ${kind} is recorded in this inventory`);
  }
  if (matches.length > 1) {
    throw new ToolchainError(
      "TOOLCHAIN_AMBIGUOUS",
      `${matches.length} ${kind} entries recorded (${matches.map((entry) => entry.toolId).join(", ")}); TWO CANDIDATES != PICK ONE`,
    );
  }
  return matches[0]!;
}

export interface InventorySummary {
  inventoryVersion: number;
  total: number;
  available: number;
  unavailable: number;
  /** One bucket per unavailable reason, so counts never collapse to a total. */
  unavailableByReason: Record<string, number>;
  /** Registered kinds with nothing recorded. Distinct from recorded-but-unavailable. */
  kindsWithNothingRecorded: ToolKind[];
  /** Inventory facts only. No authorization, no verdict, no recommendation. */
  authorizesExecution: false;
  provisionsTools: false;
}

export function summarizeInventory(registry: ToolchainRegistry): InventorySummary {
  const unavailableByReason: Record<string, number> = {};
  let available = 0;
  for (const entry of registry.entries) {
    if (entry.availability === "AVAILABLE") {
      available += 1;
      continue;
    }
    const reason = entry.unavailableReason ?? "NOT_INSTALLED";
    unavailableByReason[reason] = (unavailableByReason[reason] ?? 0) + 1;
  }
  return {
    inventoryVersion: registry.inventoryVersion,
    total: registry.entries.length,
    available,
    unavailable: registry.entries.length - available,
    unavailableByReason,
    kindsWithNothingRecorded: TOOL_KINDS.filter((kind) => toolsOfKind(registry, kind).length === 0),
    authorizesExecution: false,
    provisionsTools: false,
  };
}

/**
 * The one boundary this unit exists to enforce: a caller cannot satisfy the
 * inventory with a capability-shaped record. Returns the concrete tools that
 * genuinely satisfy the registered scope, and the generic refs that do not.
 */
export function auditAgainstRegisteredScope(input: Record<string, unknown>): {
  concrete: string[];
  rejectedGenericRefs: string[];
} {
  const concrete: string[] = [];
  const rejectedGenericRefs: string[] = [];
  for (const entry of Array.isArray(input.tools) ? (input.tools as unknown[]) : []) {
    if (!isPlainObject(entry)) continue;
    const id = typeof entry.toolId === "string" ? entry.toolId : "(unnamed)";
    const carriesCapabilityShape = CAPABILITY_KEYS.some((key) => key in entry);
    const carriesVersion = entry.version !== undefined;
    const carriesPath = entry.executablePath !== undefined;
    if (carriesCapabilityShape && !carriesVersion && !carriesPath) {
      rejectedGenericRefs.push(id);
    } else if (carriesVersion && carriesPath) {
      concrete.push(id);
    } else {
      rejectedGenericRefs.push(id);
    }
  }
  return { concrete: concrete.sort(), rejectedGenericRefs: rejectedGenericRefs.sort() };
}
