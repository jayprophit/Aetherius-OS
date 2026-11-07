import { describe, it } from "node:test";
import assert from "node:assert";
import { Wallet } from "../src/domain.ts";

describe("Wallet", () => {
  it("adds and lists passes", () => {
    const wallet = new Wallet();
    const pass = wallet.addPass({ type: "boarding", issuer: "Airline" });
    assert.equal(wallet.listPasses().length, 1);
    assert.equal(pass.issuer, "Airline");
  });

  it("retrieves pass by id", () => {
    const wallet = new Wallet();
    const pass = wallet.addPass({ type: "loyalty", issuer: "Coffee" });
    assert.equal(wallet.getPass(pass.id)?.type, "loyalty");
  });
});
