import { describe, it } from "node:test";
import assert from "node:assert";
import { Campaigns } from "../src/domain.ts";

describe("Campaigns", () => {
  it("creates and lists campaigns", () => {
    const campaigns = new Campaigns();
    const campaign = campaigns.create("Summer Sale", "email");
    assert.equal(campaign.channel, "email");
    assert.equal(campaigns.list().length, 1);
  });
});
