import { describe, it } from "node:test";
import assert from "node:assert";
import { CRM } from "../src/domain.ts";

describe("CRM", () => {
  it("creates and lists deals", () => {
    const crm = new CRM();
    const deal = crm.createDeal("Enterprise License", 50000);
    assert.equal(deal.amount, 50000);
    assert.equal(crm.listDeals().length, 1);
  });
});
