import { describe, it } from "node:test";
import assert from "node:assert";
import { DiagnosticsService } from "../src/domain.ts";

describe("DiagnosticsService", () => {
  it("runs diagnostics and lists results", () => {
    const diag = new DiagnosticsService();
    const result = diag.run("system");
    assert.equal(result.status, "ok");
    assert.equal(diag.list().length, 1);
  });
});
