import { describe, it } from "node:test";
import assert from "node:assert";
import { Business } from "../src/domain.ts";

describe("Business", () => {
  it("places and lists orders", () => {
    const biz = new Business();
    const order = biz.placeOrder("Widget", 10, 200);
    assert.equal(order.quantity, 10);
    assert.equal(biz.listOrders().length, 1);
  });
});
