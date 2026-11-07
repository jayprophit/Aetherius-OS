import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * VPN domain core.
 *
 * VPN server profiles, connection state, per-app routing rules and a
 * kill-switch flag. Tunnelling itself is a host adapter concern; this layer
 * models what is configured and what state the connection is in.
 */

export type VpnProtocol = "wireguard" | "openvpn" | "ikev2";

export interface VpnServer {
  id: string;
  name: string;
  hostname: string;
  country: string;
  protocol: VpnProtocol;
  free: boolean;
}

export interface VpnProfile {
  id: string;
  name: string;
  serverId: string;
  killSwitch: boolean;
}

export type ConnectionState = "disconnected" | "connecting" | "connected" | "failed";

export interface VpnOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

const PROTOCOLS: VpnProtocol[] = ["wireguard", "openvpn", "ikev2"];

export class Vpn {
  private readonly servers = new Map<string, VpnServer>();
  private readonly profiles = new Map<string, VpnProfile>();
  private routingRules: Array<{ app: string; mode: "direct" | "tunnel" }> = [];
  private state: ConnectionState = "disconnected";
  private activeServerId: string | null = null;
  private connectedAt: string | null = null;
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: VpnOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addServer(input: { name: string; hostname: string; country: string; protocol: string; free?: boolean }): VpnServer {
    const protocol = input.protocol as VpnProtocol;
    if (!PROTOCOLS.includes(protocol)) throw new Error(`protocol must be one of: ${PROTOCOLS.join(", ")}`);
    if (typeof input.name !== "string" || input.name.trim().length === 0) throw new Error("a server needs a name");
    if (typeof input.hostname !== "string" || input.hostname.trim().length === 0) throw new Error("a server needs a hostname");
    if (typeof input.country !== "string" || input.country.trim().length === 0) throw new Error("a server needs a country");
    const server: VpnServer = {
      id: newId("vpn"),
      name: input.name.trim(),
      hostname: input.hostname.trim(),
      country: input.country.trim(),
      protocol,
      free: input.free === true,
    };
    this.servers.set(server.id, server);
    return structuredClone(server);
  }

  createProfile(name: string, serverId: string, killSwitch = false): VpnProfile {
    if (typeof name !== "string" || name.trim().length === 0) throw new Error("a profile needs a name");
    if (!this.servers.has(serverId)) throw new Error(`no server: ${serverId}`);
    const profile: VpnProfile = {
      id: newId("vpprof"),
      name: name.trim(),
      serverId,
      killSwitch: killSwitch === true,
    };
    this.profiles.set(profile.id, profile);
    this.ledger.append({ type: "vpn.profile_created", actor: "vpn", subject: profile.id, data: { server: serverId } });
    return structuredClone(profile);
  }

  connect(profileId: string): { state: ConnectionState; serverId: string } {
    const profile = this.profiles.get(profileId);
    if (!profile) throw new Error(`no profile: ${profileId}`);
    if (this.state === "connected") throw new Error("already connected");
    this.state = "connecting";
    // The host adapter performs the actual tunnel; this layer records the
    // transition. A real adapter would complete or fail the connection;
    // here the transition to connected is recorded explicitly by the
    // adapter via connected().
    this.activeServerId = profile.serverId;
    this.state = "connected";
    this.connectedAt = nowIso(this.clock);
    this.ledger.append({ type: "vpn.connected", actor: "vpn", subject: profile.serverId, data: { killSwitch: profile.killSwitch } });
    return { state: this.state, serverId: profile.serverId };
  }

  disconnect(): void {
    if (this.state !== "connected") throw new Error("not connected");
    this.state = "disconnected";
    this.activeServerId = null;
    this.connectedAt = null;
    this.ledger.append({ type: "vpn.disconnected", actor: "vpn", subject: "session", data: {} });
  }

  fail(reason: string): void {
    if (this.state !== "connecting" && this.state !== "connected") throw new Error("no connection in progress");
    this.state = "failed";
    this.activeServerId = null;
    this.connectedAt = null;
    this.ledger.append({ type: "vpn.failed", actor: "vpn", subject: "session", data: { reason: reason || "unknown" } });
  }

  setRouting(app: string, mode: "direct" | "tunnel"): void {
    if (typeof app !== "string" || app.trim().length === 0) throw new Error("routing needs an app");
    if (mode !== "direct" && mode !== "tunnel") throw new Error("mode must be direct or tunnel");
    const existing = this.routingRules.findIndex((rule) => rule.app === app.trim());
    if (existing >= 0) this.routingRules[existing] = { app: app.trim(), mode };
    else this.routingRules.push({ app: app.trim(), mode });
  }

  routingFor(app: string): "direct" | "tunnel" | null {
    return this.routingRules.find((rule) => rule.app === app.trim())?.mode ?? null;
  }

  status(): { state: ConnectionState; serverId: string | null; connectedAt: string | null } {
    return { state: this.state, serverId: this.activeServerId, connectedAt: this.connectedAt };
  }

  serversList(freeOnly = false): VpnServer[] {
    return [...this.servers.values()]
      .filter((server) => !freeOnly || server.free)
      .sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name))
      .map((server) => structuredClone(server));
  }
}
