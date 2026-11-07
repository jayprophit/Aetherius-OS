import { describe, it } from "node:test";
import assert from "node:assert";
import { EngineeringService } from "../src/domain.ts";

describe("EngineeringService", () => {
  it("adds and lists parts", () => {
    const eng = new EngineeringService();
    const part = eng.addPart({ name: "Bracket", material: "Aluminum", quantity: 10 });
    assert.equal(eng.listParts().length, 1);
    assert.equal(part.material, "Aluminum");
  });
});
