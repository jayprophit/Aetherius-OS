import { describe, it } from "node:test";
import assert from "node:assert";
import { Calculator } from "../src/domain.ts";

describe("Calculator", () => {
  it("evaluates arithmetic", () => {
    const calc = new Calculator();
    assert.equal(calc.evaluate("2 + 2"), 4);
    assert.equal(calc.evaluate("10 / 2"), 5);
  });

  it("records history", () => {
    const calc = new Calculator();
    calc.evaluate("1 + 1");
    calc.evaluate("2 * 3");
    assert.equal(calc.getHistory().length, 2);
  });

  it("returns Error on invalid expression", () => {
    const calc = new Calculator();
    assert.equal(calc.evaluate("1 / 0"), "Error");
  });
});
