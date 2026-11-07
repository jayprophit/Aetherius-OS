import { describe, it } from "node:test";
import assert from "node:assert";
import { Vault } from "../src/domain.ts";

describe("Vault", () => {
  it("stores and retrieves credentials", () => {
    const vault = new Vault();
    const cred = vault.store({ service: "github", username: "user", secret: "token" });
    assert.equal(vault.retrieve(cred.id)?.service, "github");
  });

  it("lists all credentials", () => {
    const vault = new Vault();
    vault.store({ service: "a", username: "u1", secret: "s1" });
    vault.store({ service: "b", username: "u2", secret: "s2" });
    assert.equal(vault.list().length, 2);
  });
});
