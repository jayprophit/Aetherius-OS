import { test } from "node:test";
import assert from "node:assert/strict";

import { EventLedger } from "../../app-kit/src/index.ts";
import {
  AetheriusStore,
  DemoSignatureVerifier,
  compareSemver,
  parseSemver,
  satisfies,
  versionDigest,
  type AppVersion,
  type Artifact,
  type InstallOptions,
} from "../src/store.ts";

const CLOCK = () => new Date("2026-10-29T00:00:00.000Z");
const WINDOWS: InstallOptions = { platform: "windows", arch: "x64", channel: "stable" };

function artifact(platform: Artifact["platform"], digest: string, bytes = 1000): Artifact {
  return {
    platform,
    arch: "x64",
    format: platform === "windows" ? "msix" : platform === "macos" ? "dmg" : "deb",
    sha256: digest.repeat(64).slice(0, 64),
    bytes,
    url: null,
  };
}

function setup() {
  const ledger = new EventLedger([], CLOCK);
  const verifier = new DemoSignatureVerifier();
  verifier.trust("aetherius-release", "correct horse battery staple");
  const store = new AetheriusStore({ ledger, verifier, clock: CLOCK });
  const sign = (digest: string) => ({
    keyId: "aetherius-release",
    value: verifier.sign("aetherius-release", digest),
  });
  return { store, ledger, verifier, sign };
}

function publishStable(
  store: AetheriusStore,
  sign: (digest: string) => { keyId: string; value: string },
  appId: string,
  version: string,
  extra: Partial<Parameters<AetheriusStore["publish"]>[0]> = {},
): AppVersion {
  return store.publish({
    appId,
    name: appId,
    developer: "Aetherius",
    summary: "A test application",
    category: "utility",
    version,
    channel: "stable",
    artifacts: [artifact("windows", "a")],
    signature: sign,
    ...extra,
  });
}

test("semver parsing, ordering and ranges are deterministic", () => {
  assert.deepEqual(parseSemver("1.2.3-beta.1"), { major: 1, minor: 2, patch: 3, prerelease: ["beta", "1"] });
  assert.equal(compareSemver("1.2.3", "1.2.4"), -1);
  assert.equal(compareSemver("2.0.0", "1.99.99"), 1);
  assert.equal(compareSemver("1.0.0", "1.0.0-beta"), 1);
  assert.equal(satisfies("1.5.0", "^1.2.0"), true);
  assert.equal(satisfies("2.0.0", "^1.2.0"), false);
  assert.equal(satisfies("1.2.9", "~1.2.3"), true);
  assert.equal(satisfies("1.3.0", "~1.2.3"), false);
  assert.equal(satisfies("1.9.0", "1.x"), true);
  assert.equal(satisfies("2.0.0", "1.x"), false);
  assert.equal(satisfies("1.5.0", ">=1.0.0 <2.0.0"), true);
  assert.equal(satisfies("2.0.0", ">=1.0.0 <2.0.0"), false);
  assert.equal(satisfies("3.0.0", "1.x || 3.x"), true);
});

test("a stable release must be signed and a bad signature is refused", () => {
  const { store } = setup();
  assert.throws(
    () =>
      store.publish({
        appId: "com.example.unsigned",
        name: "Unsigned",
        developer: "Example",
        summary: "Unsigned",
        category: "utility",
        version: "1.0.0",
        channel: "stable",
        artifacts: [artifact("windows", "b")],
      }),
    /must be signed/,
  );
  assert.throws(
    () =>
      store.publish({
        appId: "com.example.badsig",
        name: "Bad",
        developer: "Example",
        summary: "Bad",
        category: "utility",
        version: "1.0.0",
        channel: "stable",
        artifacts: [artifact("windows", "c")],
        signature: { keyId: "aetherius-release", value: "0".repeat(64) },
      }),
    /signature is not valid/,
  );
});

test("a signed stable release is published, searchable and digest-stable", () => {
  const { store, sign } = setup();
  const version = publishStable(store, sign, "com.example.notes", "1.0.0");
  assert.equal(version.channel, "stable");
  assert.ok(version.signature);
  assert.equal(versionDigest(version), versionDigest({ ...version }));
  assert.equal(store.search({ text: "notes" }).length, 1);
  assert.equal(store.search({ text: "missing" }).length, 0);
  assert.equal(store.search({ platform: "windows" }).length, 1);
  assert.equal(store.search({ platform: "android" }).length, 0);
  assert.throws(
    () => publishStable(store, sign, "com.example.notes", "1.0.0"),
    /already published/,
  );
});

test("resolve picks the highest version that has a matching artifact", () => {
  const { store, sign } = setup();
  publishStable(store, sign, "com.example.player", "1.0.0");
  publishStable(store, sign, "com.example.player", "1.2.0");
  publishStable(store, sign, "com.example.player", "2.0.0", {
    artifacts: [artifact("macos", "d")],
  });
  assert.equal(store.resolve("com.example.player", "^1.0.0", WINDOWS).version, "1.2.0");
  assert.throws(() => store.resolve("com.example.player", "^1.0.0", { platform: "linux", arch: "x64" }), /no .* version/);
});

test("a dependency plan installs dependencies first and totals their size", () => {
  const { store, sign } = setup();
  publishStable(store, sign, "com.example.runtime", "1.0.0", {
    artifacts: [artifact("windows", "e", 400)],
  });
  publishStable(store, sign, "com.example.editor", "1.0.0", {
    artifacts: [artifact("windows", "f", 600)],
    dependencies: [{ appId: "com.example.runtime", range: "^1.0.0" }],
  });
  const plan = store.plan("com.example.editor", "^1.0.0", WINDOWS);
  assert.deepEqual(plan.steps.map((step) => step.appId), ["com.example.runtime", "com.example.editor"]);
  assert.equal(plan.totalBytes, 1000);
});

test("missing permissions and missing entitlements refuse the plan", () => {
  const { store, sign } = setup();
  publishStable(store, sign, "com.example.camera", "1.0.0", { permissions: ["camera", "microphone"] });
  assert.throws(
    () => store.plan("com.example.camera", "^1.0.0", { ...WINDOWS, grantedPermissions: ["camera"] }),
    /permission not granted: microphone/,
  );
  const plan = store.plan("com.example.camera", "^1.0.0", {
    ...WINDOWS,
    grantedPermissions: ["camera", "microphone"],
  });
  assert.deepEqual(plan.permissions, ["camera", "microphone"]);

  publishStable(store, sign, "com.example.paid", "1.0.0", { price: { amount: 499, currency: "USD" } });
  const verifier = new DemoSignatureVerifier();
  verifier.trust("aetherius-release", "correct horse battery staple");
  const paidStore = new AetheriusStore({ verifier, entitlements: { owns: () => false } });
  paidStore.publish({
    appId: "com.example.paid",
    name: "Paid",
    developer: "Aetherius",
    summary: "Paid app",
    category: "utility",
    version: "1.0.0",
    channel: "stable",
    artifacts: [artifact("windows", "1")],
    price: { amount: 499, currency: "USD" },
    signature: (digest) => ({ keyId: "aetherius-release", value: verifier.sign("aetherius-release", digest) }),
  });
  assert.throws(() => paidStore.plan("com.example.paid", "^1.0.0", WINDOWS), /entitlement required/);
});

test("disk space is checked before anything is installed", () => {
  const { store, sign } = setup();
  publishStable(store, sign, "com.example.large", "1.0.0", { artifacts: [artifact("windows", "2", 5000)] });
  assert.throws(
    () => store.plan("com.example.large", "^1.0.0", { ...WINDOWS, availableBytes: 4999 }),
    /not enough disk space/,
  );
});

test("install, update and rollback keep an auditable state history", () => {
  const { store, ledger, sign } = setup();
  publishStable(store, sign, "com.example.browser", "1.0.0", { artifacts: [artifact("windows", "3")] });
  publishStable(store, sign, "com.example.browser", "1.1.0", { artifacts: [artifact("windows", "4")] });

  store.install("com.example.browser", "1.0.0", WINDOWS);
  assert.equal(store.installedApp("com.example.browser")?.version, "1.0.0");

  const updated = store.install("com.example.browser", "^1.0.0", WINDOWS);
  assert.equal(updated.installed[0]?.version, "1.1.0");
  assert.equal(updated.installed[0]?.previousVersion, "1.0.0");

  const rolledBack = store.rollback("com.example.browser", WINDOWS);
  assert.equal(rolledBack.version, "1.0.0");
  assert.equal(store.verifyInstalled("com.example.browser").ok, true);
  assert.deepEqual(EventLedger.verify(ledger.all()), { ok: true });
  assert.equal(ledger.ofType("store.app.installed").length, 2);
  assert.equal(ledger.ofType("store.app.rolled_back").length, 1);
});

test("uninstall removes the record and verification fails afterwards", () => {
  const { store, sign } = setup();
  publishStable(store, sign, "com.example.mail", "1.0.0");
  store.install("com.example.mail", "^1.0.0", WINDOWS);
  assert.equal(store.uninstall("com.example.mail").version, "1.0.0");
  assert.equal(store.installedApp("com.example.mail"), undefined);
  assert.deepEqual(store.verifyInstalled("com.example.mail"), { ok: false, reasons: ["app is not installed"] });
});

test("revoking the signing key invalidates an installed stable package", () => {
  const { store, verifier, sign } = setup();
  publishStable(store, sign, "com.example.calendar", "1.0.0");
  store.install("com.example.calendar", "^1.0.0", WINDOWS);
  verifier.revoke("aetherius-release");
  const result = store.verifyInstalled("com.example.calendar");
  assert.equal(result.ok, false);
  assert.match(result.reasons.join(" "), /signature is not valid/);
});

test("dependency cycles are refused rather than installed", () => {
  const { store, sign } = setup();
  publishStable(store, sign, "com.example.a", "1.0.0", {
    dependencies: [{ appId: "com.example.b", range: "^1.0.0" }],
  });
  publishStable(store, sign, "com.example.b", "1.0.0", {
    dependencies: [{ appId: "com.example.a", range: "^1.0.0" }],
  });
  assert.throws(() => store.plan("com.example.a", "^1.0.0", WINDOWS), /dependency cycle/);
});
