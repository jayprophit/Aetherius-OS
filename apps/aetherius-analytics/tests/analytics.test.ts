import { describe, it } from "node:test";
import assert from "node:assert";
import { Analytics } from "../src/domain.ts";

describe("Analytics", () => {
  it("creates dashboards and reports", () => {
    const analytics = new Analytics();
    const dashboard = analytics.createDashboard("Sales", ["revenue", "users"]);
    const report = analytics.createReport("Monthly", "pdf");
    assert.equal(dashboard.widgets.length, 2);
    assert.equal(analytics.listDashboards().length, 1);
    assert.equal(analytics.listReports().length, 1);
  });
});
