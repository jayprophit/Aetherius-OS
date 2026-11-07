import { describe, it } from "node:test";
import assert from "node:assert";
import { InputService } from "../src/domain.ts";

describe("InputService", () => {
  it("registers input methods", () => {
    const input = new InputService();
    const method = input.register({ name: "On-screen keyboard", type: "keyboard", active: true });
    assert.equal(method.type, "keyboard");
    assert.equal(input.list().length, 1);
  });
});
