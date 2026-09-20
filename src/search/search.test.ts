import { describe, expect, it } from "vitest";
import { searchAll, searchApps } from "./search";
import { createFilesProvider } from "../files/bridge";

describe("search seam", () => {
  it("finds registry applications", async () => {
    const hits = await searchApps("bridge");
    expect(hits.some((hit) => hit.ref === "app:agent-bridge")).toBe(true);
    expect(hits.every((hit) => hit.source === "applications")).toBe(true);
  });

  it("returns empty for blank queries", async () => {
    expect(await searchApps("   ")).toEqual([]);
  });

  it("joins MAT results only when the provider is available", async () => {
    const without = await searchAll("iron", null);
    expect(without.matJoined).toBe(false);

    const down = {
      check: async () => ({ state: "UNAVAILABLE" }),
      search: async () => {
        throw new Error("must not be called");
      },
    };
    const skipped = await searchAll("iron", down as never);
    expect(skipped.matJoined).toBe(false);

    const up = {
      check: async () => ({ state: "AVAILABLE" }),
      search: async () => ({
        results: [{ mat_id: "MAT:0026", record_name: "Iron", symbol: "Fe" }],
      }),
    };
    const joined = await searchAll("iron", up as never);
    expect(joined.matJoined).toBe(true);
    expect(joined.hits.some((hit) => hit.ref === "mat:MAT:0026")).toBe(true);
  });
});

describe("files seam", () => {
  it("is honestly unavailable without a bound session", async () => {
    const files = createFilesProvider();
    const report = await files.check();
    expect(report.state).toBe("UNAVAILABLE");
    expect(report.errorCode).toBe("NO_FILE_CAPABILITY");
    await expect(files.list()).rejects.toThrow(/no Agent Bridge workspace session/);
  });
});
