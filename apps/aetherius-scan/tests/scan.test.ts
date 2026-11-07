import { describe, it } from "node:test";
import assert from "node:assert";
import { Scan } from "../src/domain.ts";

describe("Scan", () => {
  it("captures and lists scans", () => {
    const scan = new Scan();
    const capture = scan.capture("Statue", "4k", "ply");
    assert.equal(capture.format, "ply");
    assert.equal(scan.list().length, 1);
  });
});
