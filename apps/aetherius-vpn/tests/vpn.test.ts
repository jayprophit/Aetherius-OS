import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { Vpn } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("Vpn", () => {
  it("connects through a profile and disconnects cleanly", () => {
    const vpn = new Vpn({ clock: CLOCK });
    const server = vpn.addServer({ name: "London 01", hostname: "lon01.example.com", country: "UK", protocol: "wireguard", free: true });
    const profile = vpn.createProfile("Home", server.id, true);
    const connected = vpn.connect(profile.id);
    assert.equal(connected.state, "connected");
    assert.equal(vpn.status().serverId, server.id);
    assert.throws(() => vpn.connect(profile.id), /already connected/);
    vpn.disconnect();
    assert.equal(vpn.status().state, "disconnected");
    assert.throws(() => vpn.disconnect(), /not connected/);
  });

  it("routes traffic per application", () => {
    const vpn = new Vpn({ clock: CLOCK });
    vpn.setRouting("browser", "tunnel");
    vpn.setRouting("files", "direct");
    assert.equal(vpn.routingFor("browser"), "tunnel");
    assert.equal(vpn.routingFor("files"), "direct");
    assert.equal(vpn.routingFor("unconfigured"), null);
    vpn.setRouting("browser", "direct");
    assert.equal(vpn.routingFor("browser"), "direct");
    assert.throws(() => vpn.setRouting("x", "sideways" as never), /mode must be/);
  });

  it("records failures and filters free servers", () => {
    const vpn = new Vpn({ clock: CLOCK });
    const free = vpn.addServer({ name: "Free NL", hostname: "nl.example.com", country: "NL", protocol: "openvpn", free: true });
    vpn.addServer({ name: "Paid DE", hostname: "de.example.com", country: "DE", protocol: "wireguard" });
    assert.equal(vpn.serversList(true).length, 1);
    assert.equal(vpn.serversList(true)[0].name, "Free NL");
    assert.deepEqual(vpn.serversList().map((s) => s.name), ["Paid DE", "Free NL"]);
    const profile = vpn.createProfile("Work", free.id);
    vpn.connect(profile.id);
    vpn.fail("handshake timeout");
    assert.equal(vpn.status().state, "failed");
    assert.throws(() => vpn.addServer({ name: "x", hostname: "", country: "X", protocol: "wireguard" }), /needs a hostname/);
    assert.throws(() => vpn.createProfile("bad", "missing"), /no server/);
  });
});
