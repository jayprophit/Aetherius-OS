import { describe, it } from "node:test";
import assert from "node:assert";
import { NetworkService } from "../src/domain.ts";

describe("NetworkService", () => {
  it("connects to networks", () => {
    const net = new NetworkService();
    const profile = net.connect("HomeWiFi", "Wi-Fi");
    assert.equal(profile.connected, true);
    assert.equal(net.list().length, 1);
  });
});
