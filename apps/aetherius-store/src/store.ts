import { createHash } from "node:crypto";

import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";
import type { Money } from "../../app-kit/src/index.ts";

/**
 * Aetherius Store domain slice.
 *
 * This is a real catalogue and resolver, not a storefront claim. It owns
 * listing publication, semver resolution, dependency ordering, permission and
 * entitlement gates, install/update/rollback state and an audit trail.
 *
 * Signatures are a deterministic demonstration verifier. They are NOT a
 * production code-signing implementation and the README says so.
 */

export const STORE_VERSION = "0.1.0";

export type Platform = "windows" | "macos" | "linux" | "android" | "ios" | "web";
export type Channel = "dev" | "beta" | "stable";
export type Arch = "x64" | "arm64" | "universal" | "wasm";

export const PLATFORMS: readonly Platform[] = ["windows", "macos", "linux", "android", "ios", "web"];
export const CHANNELS: readonly Channel[] = ["dev", "beta", "stable"];
export const ARCHES: readonly Arch[] = ["x64", "arm64", "universal", "wasm"];

/* ------------------------------------------------------------------ semver */

export interface Semver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/;

export function parseSemver(text: string): Semver {
  const match = SEMVER.exec(text.trim());
  if (!match) throw new Error(`not a semantic version: ${text}`);
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split(".") : [],
  };
}

export function compareSemver(a: string | Semver, b: string | Semver): number {
  const left = typeof a === "string" ? parseSemver(a) : a;
  const right = typeof b === "string" ? parseSemver(b) : b;
  for (const key of ["major", "minor", "patch"] as const) {
    if (left[key] !== right[key]) return left[key] < right[key] ? -1 : 1;
  }
  // A release outranks any prerelease of the same core version.
  if (left.prerelease.length === 0 && right.prerelease.length > 0) return 1;
  if (right.prerelease.length === 0 && left.prerelease.length > 0) return -1;
  const length = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const l = left.prerelease[index];
    const r = right.prerelease[index];
    if (l === undefined) return -1;
    if (r === undefined) return 1;
    const ln = /^\d+$/.test(l);
    const rn = /^\d+$/.test(r);
    if (ln && rn && Number(l) !== Number(r)) return Number(l) < Number(r) ? -1 : 1;
    if (ln !== rn) return ln ? -1 : 1;
    if (l !== r) return l < r ? -1 : 1;
  }
  return 0;
}

/**
 * A small range grammar: exact, `*`, `^`, `~`, comparators and `||`.
 * A space-separated comparator list is an AND; `||` is an OR.
 */
export function satisfies(version: string, range: string): boolean {
  const candidate = parseSemver(version);
  return range
    .split("||")
    .map((part) => part.trim())
    .some((part) => part === "" || part === "*" || satisfiesAnd(candidate, part));
}

function satisfiesAnd(candidate: Semver, range: string): boolean {
  const parts = range.split(/\s+/).filter(Boolean);
  return parts.every((part) => satisfiesComparator(candidate, part));
}

function satisfiesComparator(candidate: Semver, comparator: string): boolean {
  const caret = comparator.startsWith("^");
  const tilde = comparator.startsWith("~");
  const operatorMatch = /^(>=|<=|>|<|=)?(.+)$/.exec(comparator);
  if (!operatorMatch) return false;
  const operator = operatorMatch[1] ?? "";
  const raw = operatorMatch[2]!.replace(/^[\^~]/, "");

  if (caret || tilde) {
    const base = parseSemver(raw);
    if (compareSemver(candidate, base) < 0) return false;
    if (caret) {
      const upper =
        base.major > 0
          ? `${base.major + 1}.0.0`
          : base.minor > 0
            ? `0.${base.minor + 1}.0`
            : `0.0.${base.patch + 1}`;
      return compareSemver(candidate, upper) < 0;
    }
    const upper = base.major > 0 || base.minor > 0
      ? `${base.major}.${base.minor + 1}.0`
      : `0.0.${base.patch + 1}`;
    return compareSemver(candidate, upper) < 0;
  }

  // Wildcards: 1.x, 1.2.x.
  if (/^[0-9]+\.x$/i.test(raw)) {
    const major = Number(raw.split(".")[0]);
    return candidate.major === major;
  }
  if (/^[0-9]+\.[0-9]+\.x$/i.test(raw)) {
    const [major, minor] = raw.split(".").map(Number);
    return candidate.major === major && candidate.minor === minor;
  }

  const target = parseSemver(raw);
  const comparison = compareSemver(candidate, target);
  if (operator === ">=") return comparison >= 0;
  if (operator === "<=") return comparison <= 0;
  if (operator === ">") return comparison > 0;
  if (operator === "<") return comparison < 0;
  return comparison === 0;
}

/* ----------------------------------------------------------------- catalog */

export interface Artifact {
  platform: Platform;
  arch: Arch;
  format: string;
  sha256: string;
  bytes: number;
  url: string | null;
}

export interface Dependency {
  appId: string;
  range: string;
}

export interface Signature {
  keyId: string;
  value: string;
}

export interface AppVersion {
  id: string;
  appId: string;
  version: string;
  channel: Channel;
  artifacts: Artifact[];
  dependencies: Dependency[];
  permissions: string[];
  price: Money;
  minOs: Partial<Record<Platform, string>>;
  publishedAt: string;
  notes: string[];
  signature: Signature | null;
}

export interface AppListing {
  id: string;
  name: string;
  developer: string;
  summary: string;
  category: string;
  tags: string[];
  versions: AppVersion[];
}

export interface PublishInput {
  appId: string;
  name: string;
  developer: string;
  summary: string;
  category: string;
  tags?: string[];
  version: string;
  channel: Channel;
  artifacts: Artifact[];
  dependencies?: Dependency[];
  permissions?: string[];
  price?: Money;
  minOs?: Partial<Record<Platform, string>>;
  notes?: string[];
  /** A fixed signature, or a callback that signs the computed version digest. */
  signature?: Signature | ((digest: string) => Signature) | null;
}

export interface SearchQuery {
  text?: string;
  category?: string;
  platform?: Platform;
  channel?: Channel;
}

const APP_ID = /^[a-z][a-z0-9-]*(?:\.[a-z0-9-]+)*$/;

export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
    .join(",")}}`;
}

export function versionDigest(version: AppVersion): string {
  const body: Record<string, unknown> = { ...version };
  delete body.signature;
  return createHash("sha256").update(canonical(body)).digest("hex");
}

/* --------------------------------------------------------------- signatures */

export interface SignatureVerifier {
  verify(keyId: string, digest: string, signature: string): boolean;
}

/**
 * A deterministic demonstration verifier. A real store must replace this with
 * platform code signing (Authenticode, notarisation, APK/IPA signing).
 */
export class DemoSignatureVerifier implements SignatureVerifier {
  private readonly keys = new Map<string, string>();

  trust(keyId: string, secret: string): void {
    if (!keyId.trim() || !secret.trim()) throw new Error("a signing key needs an id and a secret");
    this.keys.set(keyId, secret);
  }

  revoke(keyId: string): void {
    this.keys.delete(keyId);
  }

  sign(keyId: string, digest: string): string {
    const secret = this.keys.get(keyId);
    if (!secret) throw new Error(`no trusted signing key: ${keyId}`);
    return createHash("sha256").update(`${keyId}:${secret}:${digest}`).digest("hex");
  }

  verify(keyId: string, digest: string, signature: string): boolean {
    const secret = this.keys.get(keyId);
    if (!secret) return false;
    const expected = createHash("sha256").update(`${keyId}:${secret}:${digest}`).digest("hex");
    return expected.length === signature.length && timingSafeEqual(expected, signature);
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  let mismatch = a.length === b.length ? 0 : 1;
  const length = Math.min(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

/* ------------------------------------------------------------- installation */

export interface InstalledApp {
  appId: string;
  version: string;
  platform: Platform;
  arch: Arch;
  artifactSha256: string;
  installedAt: string;
  previousVersion: string | null;
  permissions: string[];
}

export interface InstallOptions {
  platform: Platform;
  arch: Arch;
  channel?: Channel;
  grantedPermissions?: readonly string[];
  availableBytes?: number;
  allowPrerelease?: boolean;
  /** Optional host OS version; compared only when both sides are semver. */
  hostVersion?: string;
}

export interface InstallStep {
  appId: string;
  version: string;
  artifact: Artifact;
  dependencies: string[];
}

export interface InstallPlan {
  root: string;
  steps: InstallStep[];
  totalBytes: number;
  permissions: string[];
  digest: string;
}

export interface StoreEntitlements {
  owns(appId: string): boolean;
}

export class OwnsEverything implements StoreEntitlements {
  owns(appId: string): boolean {
    void appId;
    return true;
  }
}

export interface StoreOptions {
  ledger?: EventLedger;
  clock?: () => Date;
  verifier?: SignatureVerifier;
  entitlements?: StoreEntitlements;
}

export class AetheriusStore {
  private readonly listings = new Map<string, AppListing>();
  private readonly installed = new Map<string, InstalledApp>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  private readonly verifier: SignatureVerifier;
  private readonly entitlements: StoreEntitlements;

  constructor(options: StoreOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.verifier = options.verifier ?? new DemoSignatureVerifier();
    this.entitlements = options.entitlements ?? new OwnsEverything();
  }

  publish(input: PublishInput): AppVersion {
    if (!APP_ID.test(input.appId)) throw new Error(`invalid app id: ${input.appId}`);
    if (!input.name.trim() || !input.developer.trim() || !input.summary.trim()) {
      throw new Error("a listing needs a name, a developer and a summary");
    }
    if (!input.category.trim()) throw new Error("a listing needs a category");
    parseSemver(input.version);
    if (!CHANNELS.includes(input.channel)) throw new Error(`unknown channel: ${input.channel}`);
    if (input.artifacts.length === 0) throw new Error("a version needs at least one artifact");

    const seen = new Set<string>();
    for (const artifact of input.artifacts) {
      if (!PLATFORMS.includes(artifact.platform)) throw new Error(`unknown platform: ${artifact.platform}`);
      if (!ARCHES.includes(artifact.arch)) throw new Error(`unknown architecture: ${artifact.arch}`);
      const key = `${artifact.platform}/${artifact.arch}/${artifact.format}`;
      if (seen.has(key)) throw new Error(`artifact is listed twice: ${key}`);
      seen.add(key);
      if (!/^[a-f0-9]{64}$/.test(artifact.sha256)) throw new Error(`artifact digest is not SHA-256: ${key}`);
      if (!Number.isSafeInteger(artifact.bytes) || artifact.bytes <= 0) throw new Error(`artifact size is invalid: ${key}`);
    }
    for (const dependency of input.dependencies ?? []) {
      if (!APP_ID.test(dependency.appId)) throw new Error(`invalid dependency id: ${dependency.appId}`);
      if (dependency.appId === input.appId) throw new Error("an app cannot depend on itself");
      parseRange(dependency.range);
    }

    const existing = this.listings.get(input.appId);
    if (existing?.versions.some((version) => version.version === input.version)) {
      throw new Error(`${input.appId} ${input.version} is already published`);
    }

    const version: AppVersion = {
      id: newId("ver"),
      appId: input.appId,
      version: input.version,
      channel: input.channel,
      artifacts: input.artifacts.map((artifact) => ({ ...artifact })),
      dependencies: (input.dependencies ?? []).map((dependency) => ({ ...dependency })),
      permissions: [...new Set(input.permissions ?? [])].sort(),
      price: input.price ?? { amount: 0, currency: "USD" },
      minOs: { ...(input.minOs ?? {}) },
      publishedAt: nowIso(this.clock),
      notes: [...(input.notes ?? [])],
      signature: typeof input.signature === "function" ? null : input.signature ? { ...input.signature } : null,
    };

    if (typeof input.signature === "function") {
      version.signature = input.signature(versionDigest(version));
    }

    if (version.channel === "stable") {
      if (!version.signature) throw new Error("a stable release must be signed");
      const ok = this.verifier.verify(version.signature.keyId, versionDigest(version), version.signature.value);
      if (!ok) throw new Error("the stable release signature is not valid");
    }

    const listing: AppListing = existing ?? {
      id: input.appId,
      name: input.name.trim(),
      developer: input.developer.trim(),
      summary: input.summary.trim(),
      category: input.category.trim(),
      tags: [...new Set(input.tags ?? [])].sort(),
      versions: [],
    };
    listing.versions.push(version);
    listing.versions.sort((a, b) => compareSemver(b.version, a.version));
    this.listings.set(input.appId, listing);
    this.ledger.append({
      type: "store.version.published",
      actor: input.developer.trim(),
      subject: input.appId,
      data: { version: version.version, channel: version.channel, digest: versionDigest(version) },
    });
    return structuredClone(version);
  }

  listing(appId: string): AppListing | undefined {
    const listing = this.listings.get(appId);
    return listing ? structuredClone(listing) : undefined;
  }

  search(query: SearchQuery = {}): AppListing[] {
    const text = (query.text ?? "").trim().toLowerCase();
    return [...this.listings.values()]
      .filter((listing) => query.category === undefined || listing.category === query.category)
      .filter((listing) => {
        if (query.platform === undefined) return true;
        return listing.versions.some((version) =>
          version.artifacts.some((artifact) => artifact.platform === query.platform),
        );
      })
      .filter((listing) => {
        if (query.channel === undefined) return true;
        return listing.versions.some((version) => version.channel === query.channel);
      })
      .filter((listing) => {
        if (!text) return true;
        const haystack = `${listing.name} ${listing.summary} ${listing.tags.join(" ")}`.toLowerCase();
        return text.split(/\s+/).every((token) => haystack.includes(token));
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((listing) => structuredClone(listing));
  }

  resolve(appId: string, range: string, options: InstallOptions): AppVersion {
    const listing = this.listings.get(appId);
    if (!listing) throw new Error(`no listing: ${appId}`);
    parseRange(range);
    const channel = options.channel ?? "stable";
    const candidates = listing.versions
      .filter((version) => version.channel === channel || (options.allowPrerelease === true && version.channel !== "stable"))
      .filter((version) => satisfies(version.version, range))
      .filter((version) => version.artifacts.some((artifact) => artifactMatches(artifact, options)))
      .filter((version) => this.platformSupported(version, options))
      .sort((a, b) => compareSemver(b.version, a.version));
    if (candidates.length === 0) {
      throw new Error(`no ${appId} version satisfies ${range} for ${options.platform}/${options.arch} on ${channel}`);
    }
    return structuredClone(candidates[0]!);
  }

  plan(appId: string, range: string, options: InstallOptions): InstallPlan {
    const steps: InstallStep[] = [];
    const visiting = new Set<string>();
    const done = new Set<string>();
    const permissions = new Set<string>();

    const visit = (id: string, wanted: string): void => {
      if (done.has(id)) return;
      if (visiting.has(id)) throw new Error(`dependency cycle at ${id}`);
      visiting.add(id);
      const version = this.resolve(id, wanted, options);
      const artifact = version.artifacts.find((candidate) => artifactMatches(candidate, options))!;
      for (const dependency of version.dependencies) visit(dependency.appId, dependency.range);
      visiting.delete(id);
      done.add(id);
      for (const permission of version.permissions) permissions.add(permission);
      steps.push({
        appId: id,
        version: version.version,
        artifact: { ...artifact },
        dependencies: version.dependencies.map((dependency) => dependency.appId),
      });
    };

    visit(appId, range);

    const totalBytes = steps.reduce((total, step) => total + step.artifact.bytes, 0);
    if (options.availableBytes !== undefined && totalBytes > options.availableBytes) {
      throw new Error(`not enough disk space: need ${totalBytes} bytes, have ${options.availableBytes}`);
    }

    const granted = new Set(options.grantedPermissions ?? []);
    const missing = [...permissions].filter((permission) => !granted.has(permission)).sort();
    if (missing.length > 0) {
      throw new Error(`permission not granted: ${missing.join(", ")}`);
    }

    for (const step of steps) {
      const version = this.versionOf(step.appId, step.version);
      if (version.channel === "stable") {
        if (!version.signature) throw new Error(`stable package is unsigned: ${step.appId}`);
        const ok = this.verifier.verify(version.signature.keyId, versionDigest(version), version.signature.value);
        if (!ok) throw new Error(`signature verification failed: ${step.appId}@${step.version}`);
      }
      if (version.price.amount > 0 && !this.entitlements.owns(step.appId)) {
        throw new Error(`entitlement required: ${step.appId}`);
      }
    }

    return {
      root: appId,
      steps,
      totalBytes,
      permissions: [...permissions].sort(),
      digest: createHash("sha256").update(canonical(steps)).digest("hex"),
    };
  }

  install(appId: string, range: string, options: InstallOptions): { plan: InstallPlan; installed: InstalledApp[] } {
    const plan = this.plan(appId, range, options);
    const now = nowIso(this.clock);
    const records: InstalledApp[] = [];
    for (const step of plan.steps) {
      const previous = this.installed.get(step.appId)?.version ?? null;
      const record: InstalledApp = {
        appId: step.appId,
        version: step.version,
        platform: options.platform,
        arch: options.arch,
        artifactSha256: step.artifact.sha256,
        installedAt: now,
        previousVersion: previous,
        permissions: [...this.versionOf(step.appId, step.version).permissions],
      };
      this.installed.set(step.appId, record);
      records.push(record);
      this.ledger.append({
        type: "store.app.installed",
        actor: "store",
        subject: step.appId,
        data: {
          version: step.version,
          platform: options.platform,
          arch: options.arch,
          previous,
          digest: step.artifact.sha256,
        },
      });
    }
    return { plan, installed: records.map((record) => ({ ...record })) };
  }

  uninstall(appId: string): InstalledApp {
    const record = this.installed.get(appId);
    if (!record) throw new Error(`app is not installed: ${appId}`);
    this.installed.delete(appId);
    this.ledger.append({
      type: "store.app.uninstalled",
      actor: "store",
      subject: appId,
      data: { version: record.version },
    });
    return { ...record };
  }

  rollback(appId: string, options: InstallOptions): InstalledApp {
    const record = this.installed.get(appId);
    if (!record) throw new Error(`app is not installed: ${appId}`);
    if (!record.previousVersion) throw new Error(`no previous version to roll back to: ${appId}`);
    const version = this.resolve(appId, record.previousVersion, { ...options, channel: "stable", allowPrerelease: true });
    const artifact = version.artifacts.find((candidate) => artifactMatches(candidate, options));
    if (!artifact) throw new Error(`the previous version has no artifact for this platform: ${appId}`);
    const restored: InstalledApp = {
      ...record,
      version: version.version,
      artifactSha256: artifact.sha256,
      installedAt: nowIso(this.clock),
      previousVersion: null,
      permissions: [...version.permissions],
    };
    this.installed.set(appId, restored);
    this.ledger.append({
      type: "store.app.rolled_back",
      actor: "store",
      subject: appId,
      data: { from: record.version, to: version.version },
    });
    return { ...restored };
  }

  installedApp(appId: string): InstalledApp | undefined {
    const record = this.installed.get(appId);
    return record ? { ...record } : undefined;
  }

  installedApps(): InstalledApp[] {
    return [...this.installed.values()]
      .sort((a, b) => a.appId.localeCompare(b.appId))
      .map((record) => ({ ...record }));
  }

  verifyInstalled(appId: string): { ok: boolean; reasons: string[] } {
    const record = this.installed.get(appId);
    if (!record) return { ok: false, reasons: ["app is not installed"] };
    const reasons: string[] = [];
    const listing = this.listings.get(appId);
    const version = listing?.versions.find((candidate) => candidate.version === record.version);
    if (!version) reasons.push("installed version is no longer in the catalogue");
    if (version) {
      const artifact = version.artifacts.find(
        (candidate) => candidate.platform === record.platform && candidate.arch === record.arch,
      );
      if (!artifact) reasons.push("the installed artifact is not in the catalogue");
      else if (artifact.sha256 !== record.artifactSha256) reasons.push("the installed digest does not match");
      if (version.channel === "stable") {
        if (!version.signature) reasons.push("the installed stable version is unsigned");
        else if (!this.verifier.verify(version.signature.keyId, versionDigest(version), version.signature.value)) {
          reasons.push("the installed signature is not valid");
        }
      }
    }
    return { ok: reasons.length === 0, reasons };
  }

  private versionOf(appId: string, version: string): AppVersion {
    const listing = this.listings.get(appId);
    const found = listing?.versions.find((candidate) => candidate.version === version);
    if (!found) throw new Error(`no published version ${appId}@${version}`);
    return structuredClone(found);
  }

  private platformSupported(version: AppVersion, options: InstallOptions): boolean {
    const minimum = version.minOs[options.platform];
    if (!minimum || !options.hostVersion) return true;
    // Host OS versions are not always semver (Windows 11, Android 14), so a
    // comparison is only made when both sides are semver-shaped.
    try {
      return compareSemver(options.hostVersion, minimum) >= 0;
    } catch {
      return true;
    }
  }
}

function artifactMatches(artifact: Artifact, options: InstallOptions): boolean {
  if (artifact.platform !== options.platform) return false;
  return artifact.arch === options.arch || artifact.arch === "universal";
}

function parseRange(range: string): void {
  const trimmed = range.trim();
  if (trimmed === "" || trimmed === "*") return;
  for (const part of trimmed.split("||")) {
    for (const comparator of part.trim().split(/\s+/).filter(Boolean)) {
      const raw = comparator.replace(/^(\^|~|>=|<=|>|<|=)/, "");
      if (/^[0-9]+\.x$/i.test(raw) || /^[0-9]+\.[0-9]+\.x$/i.test(raw)) continue;
      parseSemver(raw);
    }
  }
}
