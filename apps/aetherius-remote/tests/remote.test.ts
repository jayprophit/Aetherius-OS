import { describe, it } from "node:test";
import assert from "node:assert";
import { RemoteService } from "../src/domain.ts";

describe("RemoteService", () => {
  it("requests and lists sessions", () => {
    const remote = new RemoteService();
    const session = remote.request("host-1", "user-1");
    assert.equal(session.status, "pending");
    assert.equal(remote.list().length, 1);
  });
});
