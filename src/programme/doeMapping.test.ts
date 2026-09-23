import { describe, expect, it } from "vitest";
import { canonicalDoeMapping, validateDoeMapping } from "./doeMapping";
import type { DoeMapping } from "./doeMapping";

describe("DOE mapping", () => {
  it("canonical mapping validates clean with attribution", () => {
    const mapping = canonicalDoeMapping();
    expect(validateDoeMapping(mapping)).toEqual([]);
    expect(mapping.attribution).toContain("Saraev");
    expect(mapping.studyOnly).toBe(true);
    expect(mapping.entries.map((e) => e.layer).sort()).toEqual(
      ["directive", "execution", "host-governance", "orchestration"],
    );
  });

  it("layers map to first-party owners only", () => {
    const mapping = canonicalDoeMapping();
    const byLayer = new Map(mapping.entries.map((e) => [e.layer, e.owner]));
    expect(byLayer.get("directive")).toBe("P19");
    expect(byLayer.get("orchestration")).toBe("P22");
    expect(byLayer.get("execution")).toBe("P21");
    expect(byLayer.get("host-governance")).toBe("aetherius");
  });

  it("reference systems can never own a layer", () => {
    const mapping: DoeMapping = {
      ...canonicalDoeMapping(),
      entries: canonicalDoeMapping().entries.map((e) =>
        e.layer === "execution" ? { ...e, owner: "openclaw" } : e,
      ),
    };
    expect(validateDoeMapping(mapping)).toEqual(
      expect.arrayContaining([expect.stringContaining("non-canonical owner openclaw")]),
    );
  });

  it("duplicate, missing, unattributed and unmarked mappings fail", () => {
    const base = canonicalDoeMapping();
    const dup: DoeMapping = { ...base, entries: [...base.entries, base.entries[0]!] };
    expect(validateDoeMapping(dup)).toEqual(
      expect.arrayContaining([expect.stringContaining("mapped 2 times")]),
    );
    const missing: DoeMapping = { ...base, entries: base.entries.filter((e) => e.layer !== "directive") };
    expect(validateDoeMapping(missing)).toEqual(
      expect.arrayContaining([expect.stringContaining("DOE layer directive is unmapped")]),
    );
    expect(validateDoeMapping({ ...base, attribution: "  " })).toEqual(
      expect.arrayContaining([expect.stringContaining("attribution")]),
    );
    expect(validateDoeMapping({ ...base, studyOnly: false })).toEqual(
      expect.arrayContaining([expect.stringContaining("STUDY_ONLY")]),
    );
  });

  it("phases and notes are checked", () => {
    const base = canonicalDoeMapping();
    const badPhase: DoeMapping = {
      ...base,
      entries: base.entries.map((e) => (e.layer === "directive" ? { ...e, phases: ["P99"] } : e)),
    };
    expect(validateDoeMapping(badPhase)).toEqual(
      expect.arrayContaining([expect.stringContaining("non-canonical phase P99")]),
    );
    const noNote: DoeMapping = {
      ...base,
      entries: base.entries.map((e) => (e.layer === "directive" ? { ...e, notes: " " } : e)),
    };
    expect(validateDoeMapping(noNote)).toEqual(
      expect.arrayContaining([expect.stringContaining("needs a mapping note")]),
    );
  });
});
