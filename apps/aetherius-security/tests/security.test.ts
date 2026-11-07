import { describe, it } from "node:test";
import assert from "node:assert";
import { SecurityScanner } from "../src/domain.ts";

describe("SecurityScanner", () => {
  it("performs a quick scan", () => {
    const scanner = new SecurityScanner();
    const result = scanner.quickScan();
    assert.equal(result.status, "clean");
    assert.ok(result.details.length > 0);
  });

  it("records scan results", () => {
    const scanner = new SecurityScanner();
    scanner.quickScan();
    scanner.quickScan();
    assert.equal(scanner.getResults().length, 2);
  });
});
