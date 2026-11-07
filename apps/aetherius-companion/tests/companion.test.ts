import { describe, it } from "node:test";
import assert from "node:assert";
import { CompanionService } from "../src/domain.ts";

describe("CompanionService", () => {
  it("sends notifications", () => {
    const companion = new CompanionService();
    const notification = companion.send({ title: "Alert", body: "Low battery", priority: "high" });
    assert.equal(notification.priority, "high");
    assert.equal(companion.list().length, 1);
  });
});
