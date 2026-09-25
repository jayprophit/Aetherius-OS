import { describe, expect, it } from "vitest";
import { budgetContext } from "./budget";
import type { TokenizerRuntime } from "./budget";

/** Labeled contract double only: deterministic splitter, never production evidence. */
function fixtureTokenizer(id = "fixture-splitter"): TokenizerRuntime {
  return {
    runtimeId: id,
    count: (text: string) => (text === "" ? 0 : text.split(/\s+/).length),
  };
}

describe("token context budget", () => {
  it("budgets L0-L7 layers in exact tokens with a runtime", () => {
    const report = budgetContext({
      advertisedLimit: 100,
      outputReserve: 10,
      layers: [
        { layer: "L0", text: "genesis prime" },
        { layer: "L5", text: "a b c" },
      ],
      tokenizer: fixtureTokenizer(),
    });
    expect(report.status).toBe("FITS");
    expect(report.layers).toEqual([
      { layer: "L0", tokens: 2 },
      { layer: "L5", tokens: 3 },
    ]);
    expect(report.rawLayerTotal).toBe(5);
    expect(report.effectiveTotal).toBe(5);
    expect(report.compiledUsed).toBe(false);
    expect(report.availableInput).toBe(90);
    expect(report.remaining).toBe(85);
    expect(report.tokenizerRuntimeId).toBe("fixture-splitter");
  });

  it("reports UNAVAILABLE without a runtime, never an estimate", () => {
    const report = budgetContext({
      advertisedLimit: 100,
      layers: [{ layer: "L0", text: "genesis prime with plenty of words here" }],
    });
    expect(report.status).toBe("UNAVAILABLE");
    expect(report.layers).toEqual([]);
    expect(report.rawLayerTotal).toBe(0);
    expect(report.reasons.join(" ")).toContain("never estimated");
  });

  it("rejects metadata profiles as runtimes", () => {
    expect(() =>
      budgetContext({
        advertisedLimit: 100,
        layers: [],
        tokenizer: { profileId: "tok", tokenizerType: "BPE" } as never,
      }),
    ).toThrowError(/executable TokenizerRuntime/);
  });

  it("famous names change nothing: still UNAVAILABLE without runtime", () => {
    const report = budgetContext({
      advertisedLimit: 100,
      layers: [{ layer: "L3", text: "llama-like model output" }],
    });
    expect(report.status).toBe("UNAVAILABLE");
  });

  it("counts compiled output separately without double-counting", () => {
    const report = budgetContext({
      advertisedLimit: 100,
      layers: [
        { layer: "L0", text: "a b" },
        { layer: "L5", text: "c d e f" },
      ],
      compiledText: "a b",
      tokenizer: fixtureTokenizer(),
    });
    expect(report.rawLayerTotal).toBe(6);
    expect(report.effectiveTotal).toBe(2);
    expect(report.compiledUsed).toBe(true);
  });

  it("reports overflow with the largest layers", () => {
    const report = budgetContext({
      advertisedLimit: 5,
      layers: [
        { layer: "L0", text: "a" },
        { layer: "L5", text: "b c d e f g" },
      ],
      tokenizer: fixtureTokenizer(),
    });
    expect(report.status).toBe("EXCEEDS");
    expect(report.overflow).toBe(2);
    expect(report.remaining).toBe(0);
    expect(report.reasons.join(" ")).toContain("L5=6");
  });

  it("handles sparse, empty and exact-fit layers", () => {
    const sparse = budgetContext({
      advertisedLimit: 10,
      layers: [{ layer: "L2", text: "" }],
      tokenizer: fixtureTokenizer(),
    });
    expect(sparse.layers).toEqual([{ layer: "L2", tokens: 0 }]);
    expect(sparse.status).toBe("FITS");
    const exact = budgetContext({
      advertisedLimit: 4,
      outputReserve: 1,
      layers: [{ layer: "L0", text: "a b c" }],
      tokenizer: fixtureTokenizer(),
    });
    expect(exact.status).toBe("FITS");
    expect(exact.remaining).toBe(0);
  });

  it("rejects malformed inputs", () => {
    const tok = fixtureTokenizer();
    expect(() => budgetContext({ advertisedLimit: 0, layers: [], tokenizer: tok })).toThrowError(/advertisedLimit/);
    expect(() => budgetContext({ advertisedLimit: 10, outputReserve: 11, layers: [], tokenizer: tok })).toThrowError(
      /outputReserve/,
    );
    expect(() => budgetContext({ advertisedLimit: 10, fixedOverhead: NaN, layers: [], tokenizer: tok })).toThrowError(
      /fixedOverhead/,
    );
    expect(() => budgetContext({ advertisedLimit: 10, layers: [{ layer: "L9" as never, text: "" }], tokenizer: tok })).toThrowError(
      /unknown context layer/,
    );
    expect(() =>
      budgetContext({ advertisedLimit: 10, layers: [{ layer: "L0", text: "x" }, { layer: "L0", text: "y" }], tokenizer: tok }),
    ).toThrowError(/duplicate/);
    expect(() =>
      budgetContext({ advertisedLimit: 10, layers: [], compiledText: 42 as never, tokenizer: tok }),
    ).toThrowError(/compiledText/);
  });

  it("rejects broken runtimes instead of trusting counts", () => {
    const bad: TokenizerRuntime = { runtimeId: "bad", count: () => NaN };
    expect(() =>
      budgetContext({ advertisedLimit: 10, layers: [{ layer: "L0", text: "x" }], tokenizer: bad }),
    ).toThrowError(/invalid count/);
  });

  it("is deterministic", () => {
    const input = {
      advertisedLimit: 50,
      outputReserve: 5,
      fixedOverhead: 2,
      layers: [
        { layer: "L5" as const, text: "some file content here" },
        { layer: "L0" as const, text: "genesis" },
      ],
      compiledText: "genesis file",
      tokenizer: fixtureTokenizer(),
    };
    expect(budgetContext(input)).toEqual(budgetContext(input));
  });

  it("contains no built-in word/char estimator", () => {
    // The module must not smuggle estimation: without a runtime even
    // trivial text is UNAVAILABLE.
    const report = budgetContext({ advertisedLimit: 1000000, layers: [{ layer: "L0", text: "hi" }] });
    expect(report.status).toBe("UNAVAILABLE");
    expect(report.rawLayerTotal).toBe(0);
  });
});
