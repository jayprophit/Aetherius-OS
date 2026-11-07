import { describe, it } from "node:test";
import assert from "node:assert";
import { DataFlows } from "../src/domain.ts";

describe("DataFlows", () => {
  it("creates and lists flows", () => {
    const flows = new DataFlows();
    const flow = flows.create("Sales ETL", "database", "warehouse", "clean");
    assert.equal(flow.source, "database");
    assert.equal(flows.list().length, 1);
  });
});
