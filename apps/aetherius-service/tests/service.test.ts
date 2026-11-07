import { describe, it } from "node:test";
import assert from "node:assert";
import { Service } from "../src/domain.ts";

describe("Service", () => {
  it("creates and lists tickets", () => {
    const service = new Service();
    const ticket = service.createTicket("Login broken", "high");
    assert.equal(ticket.priority, "high");
    assert.equal(service.list().length, 1);
  });
});
