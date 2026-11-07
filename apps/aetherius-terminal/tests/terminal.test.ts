import { describe, it } from "node:test";
import assert from "node:assert";
import { Terminal } from "../src/domain.ts";

describe("Terminal", () => {
  it("executes commands and records history", () => {
    const term = new Terminal();
    const result = term.execute("echo hello");
    assert.equal(result.exitCode, 0);
    assert.ok(result.stdout.includes("echo hello"));
    assert.equal(term.getHistory().length, 1);
  });

  it("throws on empty command", () => {
    const term = new Terminal();
    assert.throws(() => term.execute("   "), /command cannot be empty/);
  });
});
