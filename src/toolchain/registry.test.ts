import { describe, expect, it } from "vitest";
import {
  TOOL_KINDS,
  TOOL_LOOKUP,
  ToolchainError,
  UNAVAILABLE_REASONS,
  auditAgainstRegisteredScope,
  createToolchainRegistry,
  deriveAvailability,
  findTool,
  recordTool,
  requireSingleTool,
  summarizeInventory,
  toolsOfKind,
} from "./registry";
import type { ToolchainRegistry } from "./registry";

/**
 * Dimension-specific fixtures. Every entry declares its own facts explicitly, so
 * no partial override can inherit a default that changes meaning.
 */
const GCC = {
  toolId: "tool-gcc-13",
  kind: "COMPILER",
  name: "gcc",
  version: { state: "REPORTED", value: "13.2.0", provenance: "probe: gcc --version" },
  executablePath: { state: "REPORTED", value: "/usr/bin/gcc", verified: true, provenance: "probe: which gcc" },
  provenance: "observed on developer workstation 2026-09-26",
};

const CLANG = {
  toolId: "tool-clang-17",
  kind: "COMPILER",
  name: "clang",
  version: { state: "REPORTED", value: "17.0.6", provenance: "probe: clang --version" },
  executablePath: { state: "REPORTED", value: "/usr/bin/clang", verified: true, provenance: "probe: which clang" },
  provenance: "observed on developer workstation 2026-09-26",
};

const NODE = {
  toolId: "tool-node-22",
  kind: "RUNTIME",
  name: "node",
  version: { state: "REPORTED", value: "22.11.0", provenance: "probe: node --version" },
  executablePath: { state: "REPORTED", value: "C:/Program Files/nodejs/node.exe", verified: true, provenance: "probe: where node" },
  provenance: "observed on developer workstation 2026-09-26",
};

function registry(...tools: Array<Record<string, unknown>>): ToolchainRegistry {
  return tools.reduce((acc, tool) => recordTool(acc, tool), createToolchainRegistry(1));
}

describe("toolchain registry: registered vocabulary", () => {
  it("declares exactly the six registered tool kinds", () => {
    expect([...TOOL_KINDS]).toEqual(["COMPILER", "INTERPRETER", "SDK", "PACKAGE_MANAGER", "BUILD_SYSTEM", "RUNTIME"]);
  });

  it("keeps the four unavailable reasons and three lookup states distinct", () => {
    expect([...UNAVAILABLE_REASONS]).toEqual(["VERSION_UNKNOWN", "PATH_UNKNOWN", "PATH_UNVERIFIED", "NOT_INSTALLED"]);
    expect([...TOOL_LOOKUP]).toEqual(["FOUND", "NOT_FOUND", "AMBIGUOUS"]);
    expect(new Set(UNAVAILABLE_REASONS).size).toBe(UNAVAILABLE_REASONS.length);
  });
});

describe("toolchain registry: versioned inventory", () => {
  it("versions the inventory itself", () => {
    const reg = createToolchainRegistry(7);
    expect(reg.inventoryVersion).toBe(7);
    expect(reg.entries).toEqual([]);
  });

  it("records the inventory version an observation was made under", () => {
    const reg = registry(GCC);
    expect(reg.entries[0]!.observedUnderInventory).toBe(1);
  });

  it("rejects a non-positive inventory version", () => {
    expect(() => createToolchainRegistry(0)).toThrowError(
      expect.objectContaining({ code: "TOOLCHAIN_INVALID_INPUT" }),
    );
    expect(() => createToolchainRegistry(1.5)).toThrowError(ToolchainError);
  });

  it("carries all four facts the requirement names", () => {
    const entry = registry(GCC).entries[0]!;
    expect(entry.version).toBeDefined();
    expect(entry.executablePath).toBeDefined();
    expect(entry.availability).toBe("AVAILABLE");
    expect(entry.provenance).toBe("observed on developer workstation 2026-09-26");
    expect(entry.version.state === "REPORTED" && entry.version.provenance).toBeTruthy();
  });
});

describe("toolchain registry: generic capability refs do not satisfy this", () => {
  it("rejects a capability-shaped entry outright", () => {
    for (const key of ["capabilities", "toolUse", "structuredOutput", "supportsTools", "healthy", "costRank"]) {
      expect(() => registry({ ...GCC, [key]: true })).toThrowError(
        expect.objectContaining({ code: "TOOLCHAIN_GENERIC_REF_REJECTED" }),
      );
    }
  });

  it("rejects a bare capability ref with no version and no path", () => {
    expect(() =>
      registry({ toolId: "model-x", kind: "RUNTIME", name: "x", provenance: "card", capabilities: { toolUse: true } }),
    ).toThrowError(expect.objectContaining({ code: "TOOLCHAIN_GENERIC_REF_REJECTED" }));
  });

  it("audits a mixed list and separates concrete tools from generic refs", () => {
    const audit = auditAgainstRegisteredScope({
      tools: [
        GCC,
        { id: "model-y", capabilities: { toolUse: true, structuredOutput: true } },
        { toolId: "half", kind: "SDK", version: { state: "REPORTED", value: "1.0", provenance: "p" } },
      ],
    });
    expect(audit.concrete).toEqual(["tool-gcc-13"]);
    expect(audit.rejectedGenericRefs).toEqual(["(unnamed)", "half"]);
  });

  it("a capability flag is not a version and not a path", () => {
    const reg = registry(GCC);
    expect(reg.entries[0]!.version).not.toHaveProperty("toolUse");
    expect(reg.entries[0]!.executablePath.state).toBe("REPORTED");
  });
});

describe("toolchain registry: availability is derived, never asserted", () => {
  it("refuses an availability the caller supplies", () => {
    expect(() => registry({ ...GCC, availability: "AVAILABLE" })).toThrowError(
      expect.objectContaining({ code: "TOOLCHAIN_DERIVED_FIELD_REJECTED" }),
    );
  });

  it("is AVAILABLE only with a reported version and a verified path", () => {
    expect(deriveAvailability({ version: GCC.version as never, executablePath: GCC.executablePath as never })).toEqual({
      availability: "AVAILABLE",
    });
  });

  it("an unknown version is not an available tool", () => {
    const entry = registry({ ...GCC, version: { state: "UNKNOWN", reason: "probe not run" } }).entries[0]!;
    expect(entry.availability).toBe("UNAVAILABLE");
    expect(entry.unavailableReason).toBe("VERSION_UNKNOWN");
  });

  it("a claimed but unverified path is not availability", () => {
    const entry = registry({
      ...GCC,
      executablePath: { state: "REPORTED", value: "/usr/bin/gcc", verified: false, provenance: "config file claim" },
    }).entries[0]!;
    expect(entry.availability).toBe("UNAVAILABLE");
    expect(entry.unavailableReason).toBe("PATH_UNVERIFIED");
  });

  it("separates an unknown path from an unverified one", () => {
    const unknown = registry({ ...GCC, executablePath: { state: "UNKNOWN", reason: "not probed" } }).entries[0]!;
    expect(unknown.unavailableReason).toBe("PATH_UNKNOWN");
  });

  it("rejects an invented or 'latest' version", () => {
    for (const value of ["latest", "LATEST", "unknown", ""]) {
      expect(() =>
        registry({ ...GCC, version: { state: "REPORTED", value, provenance: "guess" } }),
      ).toThrowError(ToolchainError);
    }
  });

  it("requires provenance on a reported version, path and record", () => {
    expect(() => registry({ ...GCC, version: { state: "REPORTED", value: "13.2.0" } })).toThrowError(ToolchainError);
    expect(() => registry({ ...GCC, executablePath: { state: "REPORTED", value: "/x", verified: true } })).toThrowError(
      ToolchainError,
    );
    expect(() => registry({ ...GCC, provenance: "" })).toThrowError(ToolchainError);
  });

  it("requires a reason for an unknown fact", () => {
    expect(() => registry({ ...GCC, version: { state: "UNKNOWN" } })).toThrowError(ToolchainError);
    expect(() => registry({ ...GCC, executablePath: { state: "UNKNOWN" } })).toThrowError(ToolchainError);
  });

  it("requires an explicit verified boolean on a reported path", () => {
    expect(() => registry({ ...GCC, executablePath: { state: "REPORTED", value: "/x", provenance: "p" } })).toThrowError(
      ToolchainError,
    );
  });
});

describe("toolchain registry: names never resolve", () => {
  it("looks up by tool id", () => {
    const reg = registry(GCC, NODE);
    expect(findTool(reg, "tool-gcc-13").name).toBe("gcc");
  });

  it("refuses a name lookup by reporting not-found rather than matching on name", () => {
    const reg = registry(GCC);
    expect(() => findTool(reg, "gcc")).toThrowError(expect.objectContaining({ code: "TOOLCHAIN_NOT_FOUND" }));
  });

  it("reports two compilers as ambiguous instead of picking one", () => {
    const reg = registry(GCC, CLANG);
    expect(() => requireSingleTool(reg, "COMPILER")).toThrowError(
      expect.objectContaining({ code: "TOOLCHAIN_AMBIGUOUS" }),
    );
  });

  it("names both candidates in the ambiguity message", () => {
    const reg = registry(GCC, CLANG);
    try {
      requireSingleTool(reg, "COMPILER");
      throw new Error("expected an ambiguity error");
    } catch (error) {
      expect((error as Error).message).toContain("tool-gcc-13");
      expect((error as Error).message).toContain("tool-clang-17");
    }
  });

  it("resolves a single tool of a kind", () => {
    expect(requireSingleTool(registry(GCC, NODE), "RUNTIME").toolId).toBe("tool-node-22");
  });

  it("reports a kind with nothing recorded as not-found", () => {
    expect(() => requireSingleTool(registry(GCC), "SDK")).toThrowError(
      expect.objectContaining({ code: "TOOLCHAIN_NOT_FOUND" }),
    );
  });

  it("rejects an unknown kind", () => {
    expect(() => toolsOfKind(registry(GCC), "COMPILER2" as never)).toThrowError(
      expect.objectContaining({ code: "TOOLCHAIN_UNKNOWN_KIND" }),
    );
    expect(() => registry({ ...GCC, kind: "ASSEMBLER" })).toThrowError(
      expect.objectContaining({ code: "TOOLCHAIN_UNKNOWN_KIND" }),
    );
  });

  it("refuses a duplicate tool id", () => {
    const reg = registry(GCC);
    expect(() => recordTool(reg, GCC)).toThrowError(expect.objectContaining({ code: "TOOLCHAIN_DUPLICATE_TOOL_ID" }));
  });
});

describe("toolchain registry: absent is not unknown", () => {
  it("distinguishes never-recorded from recorded-but-unknown", () => {
    const reg = registry({ ...GCC, version: { state: "UNKNOWN", reason: "not probed" } });
    expect(reg.entries).toHaveLength(1);
    expect(findTool(reg, "tool-gcc-13").unavailableReason).toBe("VERSION_UNKNOWN");
    expect(() => findTool(reg, "tool-gcc-99")).toThrowError(expect.objectContaining({ code: "TOOLCHAIN_NOT_FOUND" }));
  });

  it("reports kinds with nothing recorded separately from unavailable counts", () => {
    const summary = summarizeInventory(registry(GCC));
    expect(summary.kindsWithNothingRecorded).toEqual(["INTERPRETER", "SDK", "PACKAGE_MANAGER", "BUILD_SYSTEM", "RUNTIME"]);
    expect(summary.total).toBe(1);
  });
});

describe("toolchain registry: strict input shape", () => {
  it("rejects unknown entry fields instead of dropping them", () => {
    expect(() => registry({ ...GCC, vendor: "acme" })).toThrowError(
      expect.objectContaining({ code: "TOOLCHAIN_UNKNOWN_FIELD" }),
    );
  });

  it("rejects unknown nested fact fields", () => {
    expect(() => registry({ ...GCC, version: { state: "REPORTED", value: "1.0", provenance: "p", confidence: 0.9 } })).toThrowError(
      expect.objectContaining({ code: "TOOLCHAIN_UNKNOWN_FIELD" }),
    );
  });

  it("rejects an unknown registry field", () => {
    const reg = { ...createToolchainRegistry(1), cache: true };
    expect(() => recordTool(reg, GCC)).toThrowError(expect.objectContaining({ code: "TOOLCHAIN_UNKNOWN_FIELD" }));
  });

  it("rejects malformed entries and facts", () => {
    expect(() => registry({ ...GCC, toolId: "" })).toThrowError(ToolchainError);
    expect(() => registry({ ...GCC, name: "" })).toThrowError(ToolchainError);
    expect(() => registry("gcc" as never)).toThrowError(ToolchainError);
    expect(() => registry({ ...GCC, version: "13.2.0" })).toThrowError(ToolchainError);
  });
});

describe("toolchain registry: boundaries", () => {
  it("is inventory only: no authorization and no provisioning", () => {
    const summary = summarizeInventory(registry(GCC, NODE));
    expect(summary.authorizesExecution).toBe(false);
    expect(summary.provisionsTools).toBe(false);
  });

  it("exposes no run, exec, install, download or repair surface", () => {
    const banned = ["run", "exec", "spawn", "execute", "install", "download", "fetch", "repair", "provision", "resolve"];
    for (const name of banned) {
      expect(registry(GCC)).not.toHaveProperty(name);
    }
  });

  it("emits no recommendation, score or verdict", () => {
    const summary = summarizeInventory(registry(GCC)) as unknown as Record<string, unknown>;
    for (const banned of ["score", "rating", "verdict", "recommend", "confidence", "percent", "quality"]) {
      expect(Object.keys(summary)).not.toContain(banned);
    }
  });

  it("reads no clock, filesystem or network: the same inputs give the same inventory", () => {
    expect(JSON.stringify(summarizeInventory(registry(GCC, NODE)))).toBe(
      JSON.stringify(summarizeInventory(registry(GCC, NODE))),
    );
  });

  it("is deterministic from scrambled input order", () => {
    const forward = summarizeInventory(registry(GCC, CLANG, NODE));
    const reversed = summarizeInventory(registry(NODE, CLANG, GCC));
    expect(forward).toEqual(reversed);
    expect(registry(GCC, NODE).entries.map((entry) => entry.toolId)).toEqual(
      registry(NODE, GCC).entries.map((entry) => entry.toolId),
    );
  });

  it("does not mutate the registry it was given", () => {
    const base = registry(GCC);
    const snapshot = JSON.stringify(base);
    recordTool(base, NODE);
    expect(JSON.stringify(base)).toBe(snapshot);
  });

  it("counts unavailable tools per reason rather than as one total", () => {
    const summary = summarizeInventory(
      registry(
        GCC,
        { ...CLANG, version: { state: "UNKNOWN", reason: "not probed" } },
        { ...NODE, executablePath: { state: "REPORTED", value: "/x", verified: false, provenance: "claim" } },
      ),
    );
    expect(summary.available).toBe(1);
    expect(summary.unavailable).toBe(2);
    expect(summary.unavailableByReason).toEqual({ VERSION_UNKNOWN: 1, PATH_UNVERIFIED: 1 });
  });
});
