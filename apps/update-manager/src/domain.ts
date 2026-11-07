import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Update manager domain core.
 *
 * Tracks release channels, applies update plans (delta first, full build as
 * fallback), and can roll back to a previously installed version. Signed
 * releases are required for stable/beta channels; dev builds are unsigned
 * but are refused on stable. Every apply and rollback is ledger-audited.
 */

export type UpdateChannel = "dev" | "beta" | "stable";

export interface Release {
  id: string;
  version: string;
  semver: string;
  channel: UpdateChannel;
  sizeBytes: number;
  deltaFrom: string | null;
  signed: boolean;
  publishedAt: string;
}

export interface InstalledVersion {
  version: string;
  semver: string;
  channel: UpdateChannel;
  installedAt: string;
}

export interface UpdatePlan {
  id: string;
  fromSemver: string;
  toSemver: string;
  channel: UpdateChannel;
  kind: "delta" | "full";
  downloadBytes: number;
  reason: string;
}

export interface UpdateManagerOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

const CHANNELS: UpdateChannel[] = ["dev", "beta", "stable"];
const SEMVER = /^\d+\.\d+\.\d+$/;

function requireSemver(value: unknown, field: string): string {
  if (typeof value !== "string" || !SEMVER.test(value)) {
    throw new Error(`${field} must be a semantic version like "1.2.3"`);
  }
  return value;
}

function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

export class UpdateManager {
  private readonly releases = new Map<string, Release>();
  private installed: InstalledVersion | null = null;
  private readonly history: InstalledVersion[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: UpdateManagerOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addRelease(input: {
    version: string;
    semver: string;
    channel: UpdateChannel;
    sizeBytes: number;
    deltaFrom?: string | null;
    signed: boolean;
    publishedAt?: string;
  }): Release {
    requireSemver(input.semver, "semver");
    if (!CHANNELS.includes(input.channel)) {
      throw new Error(`channel must be one of: ${CHANNELS.join(", ")}`);
    }
    if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0) {
      throw new Error("sizeBytes must be a positive integer");
    }
    if (input.deltaFrom !== undefined && input.deltaFrom !== null) {
      requireSemver(input.deltaFrom, "deltaFrom");
    }
    const release: Release = {
      id: newId("rel"),
      version: input.version,
      semver: input.semver,
      channel: input.channel,
      sizeBytes: input.sizeBytes,
      deltaFrom: input.deltaFrom ?? null,
      signed: input.signed === true,
      publishedAt: input.publishedAt ?? nowIso(this.clock),
    };
    this.releases.set(release.id, release);
    this.ledger.append({
      type: "updates.release_added",
      actor: "updates",
      subject: release.id,
      data: { semver: release.semver, channel: release.channel },
    });
    return structuredClone(release);
  }

  install(releaseId: string): InstalledVersion {
    const release = this.releases.get(releaseId);
    if (!release) throw new Error(`no release: ${releaseId}`);
    if ((release.channel === "stable" || release.channel === "beta") && !release.signed) {
      throw new Error(`unsigned ${release.channel} releases cannot be installed`);
    }
    const installed: InstalledVersion = {
      version: release.version,
      semver: release.semver,
      channel: release.channel,
      installedAt: nowIso(this.clock),
    };
    this.installed = installed;
    this.history.push(structuredClone(installed));
    this.ledger.append({
      type: "updates.installed",
      actor: "updates",
      subject: release.id,
      data: { semver: release.semver, channel: release.channel },
    });
    return structuredClone(installed);
  }

  current(): InstalledVersion | null {
    return this.installed ? structuredClone(this.installed) : null;
  }

  plan(channel: UpdateChannel): UpdatePlan | null {
    if (!CHANNELS.includes(channel)) {
      throw new Error(`channel must be one of: ${CHANNELS.join(", ")}`);
    }
    const candidates = [...this.releases.values()]
      .filter((release) => release.channel === channel)
      .filter((release) => channel === "dev" || release.signed)
      .sort((a, b) => compareSemver(b.semver, a.semver));
    if (candidates.length === 0) return null;
    const latest = candidates[0];
    if (this.installed && compareSemver(latest.semver, this.installed.semver) <= 0) return null;
    const isDelta =
      latest.deltaFrom !== null &&
      this.installed !== null &&
      latest.deltaFrom === this.installed.semver;
    return {
      id: newId("plan"),
      fromSemver: this.installed?.semver ?? "0.0.0",
      toSemver: latest.semver,
      channel,
      kind: isDelta ? "delta" : "full",
      downloadBytes: isDelta ? Math.round(latest.sizeBytes * 0.3) : latest.sizeBytes,
      reason: isDelta
        ? `delta available from ${this.installed!.semver}`
        : "full build required",
    };
  }

  apply(plan: UpdatePlan): InstalledVersion {
    const release = [...this.releases.values()].find(
      (candidate) => candidate.channel === plan.channel && candidate.semver === plan.toSemver,
    );
    if (!release) throw new Error(`no release for plan ${plan.id}`);
    return this.install(release.id);
  }

  rollback(): InstalledVersion {
    if (this.history.length < 2) throw new Error("no previous version to roll back to");
    const previous = this.history[this.history.length - 2];
    this.installed = structuredClone(previous);
    this.history.push(structuredClone(previous));
    this.ledger.append({
      type: "updates.rolled_back",
      actor: "updates",
      subject: previous.semver,
      data: { semver: previous.semver },
    });
    return structuredClone(previous);
  }
}
