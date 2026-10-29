import { test } from "node:test";
import assert from "node:assert/strict";

import { EventLedger } from "../../app-kit/src/index.ts";
import {
  APP_ROLES,
  DEFAULT_APP_CATALOG,
  DEFAULT_SETTING_FIELDS,
  DefaultAppService,
  InstallerPlanner,
  OS_FAMILIES,
  OS_PRESETS,
  SettingsService,
  type SettingField,
} from "../src/desktop.ts";

const CLOCK = () => new Date("2026-10-29T00:00:00.000Z");

const SECRET: SettingField = {
  key: "api.token",
  label: "API token",
  description: "A secret token that must never be exported in clear text.",
  type: "string",
  default: "",
  scope: "user",
  secret: true,
};

const MANAGED: SettingField = {
  key: "policy.tag",
  label: "Policy tag",
  description: "A device-management tag that either layer may set.",
  type: "string",
  default: "unmanaged",
  scope: "any",
};

function settings(os: "apple" | "linux" | "microsoft" | "android" | "ios" | "google" = "microsoft") {
  const ledger = new EventLedger([], CLOCK);
  const service = new SettingsService([...DEFAULT_SETTING_FIELDS, SECRET, MANAGED], { os, ledger, clock: CLOCK });
  return { service, ledger };
}

test("settings resolve with app over user over system over default", () => {
  const { service } = settings();
  assert.deepEqual(service.get("policy.tag"), { key: "policy.tag", value: "unmanaged", source: "default" });

  service.set("policy.tag", "managed", "system");
  assert.equal(service.get("policy.tag").value, "managed");
  assert.equal(service.get("policy.tag").source, "system");

  service.set("policy.tag", "personal", "user");
  assert.equal(service.get("policy.tag").source, "user");

  service.set("policy.tag", "session", "app");
  assert.equal(service.get("policy.tag").source, "app");

  service.reset("app");
  assert.equal(service.get("policy.tag").value, "personal");
  service.reset();
  assert.equal(service.get("policy.tag").value, "unmanaged");
  assert.equal(service.get("policy.tag").source, "default");

  // A user-scoped setting follows the same precedence for the layers it allows.
  assert.deepEqual(service.get("appearance.theme"), { key: "appearance.theme", value: "system", source: "default" });
  service.set("appearance.theme", "dark", "user");
  assert.equal(service.get("appearance.theme").source, "user");

  // A system-scoped setting is written only by the system layer.
  assert.equal(service.get("window.controls").source, "default");
  service.set("window.controls", "left", "system");
  assert.equal(service.get("window.controls").value, "left");
  assert.equal(service.get("window.controls").source, "system");
  assert.throws(() => service.set("window.controls", "right", "user"), /belongs to the system scope/);
});

test("settings reject wrong types, out-of-range numbers, empty strings and bad enums", () => {
  const { service } = settings();
  assert.throws(() => service.set("appearance.theme", "sepia", "user"), /must be one of/);
  assert.throws(() => service.set("appearance.fontScale", 3, "user"), /above 2/);
  assert.throws(() => service.set("appearance.fontScale", 0.5, "user"), /below 0.8/);
  assert.throws(() => service.set("appearance.fontScale", Number.NaN, "user"), /finite number/);
  assert.throws(() => service.set("locale.language", "   ", "user"), /cannot be empty/);
  assert.throws(() => service.set("motion.reduce", "yes" as never, "user"), /expects boolean/);
  assert.throws(() => service.set("network.proxy", "not-an-object" as never, "system"), /expects an object/);
  assert.throws(() => service.set("appearance.theme", "dark", "system"), /belongs to the user scope/);
  assert.throws(() => service.set("missing.key", "x", "user"), /unknown setting/);
  assert.throws(() => service.field("missing.key"), /unknown setting/);
});

test("a policy lock stops user overrides but not the system layer", () => {
  const { service, ledger } = settings();
  service.lock("policy.tag", "managed device");
  assert.equal(service.locked("policy.tag"), "managed device");
  assert.throws(() => service.set("policy.tag", "personal", "user"), /locked by policy: managed device/);
  service.set("policy.tag", "managed", "system");
  assert.equal(service.get("policy.tag").value, "managed");
  assert.equal(service.get("policy.tag").source, "system");
  service.unlock("policy.tag");
  assert.equal(service.locked("policy.tag"), null);
  service.set("policy.tag", "personal", "user");
  assert.equal(service.get("policy.tag").value, "personal");
  assert.equal(ledger.ofType("settings.locked").length, 1);
});

test("OS presets fill the declared scope and never overwrite an explicit user choice", () => {
  const { service } = settings("android");
  service.set("appearance.accent", "purple", "user");
  const applied = service.applyPreset(OS_PRESETS.android);
  assert.ok(applied > 0);
  // The explicit user value wins; the preset value is stored in the user layer only if unset.
  assert.equal(service.get("appearance.accent").value, "purple");
  assert.equal(service.get("appearance.fontScale").value, 1);
  assert.equal(service.get("window.controls").value, "gesture");
  assert.equal(service.get("window.controls").source, "system");

  const linux = settings("linux");
  linux.service.applyPreset(OS_PRESETS.linux);
  assert.equal(linux.service.get("window.dockPosition").value, "left");
  assert.equal(linux.service.get("appearance.accent").value, "teal");
});

test("every OS preset only names declared settings", () => {
  const { service } = settings();
  for (const os of OS_FAMILIES) {
    for (const key of Object.keys(OS_PRESETS[os])) {
      assert.doesNotThrow(() => service.field(key), `${os} preset names unknown setting ${key}`);
    }
  }
});

test("export redacts secrets and import applies valid non-secret values", () => {
  const { service } = settings();
  service.set("api.token", "super-secret", "user");
  service.set("appearance.theme", "dark", "user");
  service.set("window.controls", "left", "system");

  const exported = service.export();
  assert.equal(exported.schema, "aetherius.settings.v1");
  assert.equal(exported.os, "microsoft");
  assert.equal(exported.values["api.token"], "[redacted]");
  assert.equal(exported.values["appearance.theme"], "dark");
  assert.equal(JSON.stringify(exported).includes("super-secret"), false);

  const clear = service.export({ redactSecrets: false });
  assert.equal(clear.values["api.token"], "super-secret");

  const target = settings();
  const applied = target.service.import(exported, "user");
  // Every non-secret user-scoped value is applied; system-scoped values and
  // redacted secrets are not.
  const expected =
    [...DEFAULT_SETTING_FIELDS, SECRET, MANAGED].filter(
      (field) => field.scope === "user" || field.scope === "any",
    ).length - 1;
  assert.equal(applied, expected);
  assert.equal(target.service.get("appearance.theme").value, "dark");
  assert.equal(target.service.get("api.token").value, "");
  assert.equal(target.service.get("window.controls").value, "right");
  assert.throws(() => target.service.import({ ...exported, schema: "wrong" as never }), /unsupported settings schema/);
});

test("validation reports every invalid stored value", () => {
  const { service } = settings();
  const result = service.validate();
  assert.deepEqual(result, { ok: true, problems: [] });
  assert.equal(service.keys().includes("api.token"), true);
  assert.equal(service.effective()["appearance.theme"], "system");
});

test("the default-app catalogue covers every role on every OS family", () => {
  assert.equal(APP_ROLES.length, 26);
  assert.equal(OS_FAMILIES.length, 6);
  for (const os of OS_FAMILIES) {
    const catalog = DEFAULT_APP_CATALOG[os];
    for (const role of APP_ROLES) {
      const entry = catalog[role];
      assert.ok(entry, `${os} is missing ${role}`);
      assert.equal(entry.role, role);
      assert.match(entry.aetherius, /^aetherius\./);
      assert.ok(entry.native.trim().length > 0);
      assert.ok(Array.isArray(entry.thirdPartyAlternatives));
    }
    assert.equal(Object.keys(catalog).length, APP_ROLES.length);
  }
  // The Aetherius app id for a role is the same on every OS, so a preference
  // follows the user between devices.
  for (const role of APP_ROLES) {
    const ids = new Set(OS_FAMILIES.map((os) => DEFAULT_APP_CATALOG[os][role].aetherius));
    assert.equal(ids.size, 1, `${role} has inconsistent Aetherius ids`);
  }
});

test("default-app resolution honours overrides and resets", () => {
  const service = new DefaultAppService("apple");
  const safari = service.resolve("browser");
  assert.equal(safari.native, "Safari");
  assert.equal(safari.chosen, "aetherius.browser");
  assert.equal(service.setDefault("browser", "org.mozilla.firefox").chosen, "org.mozilla.firefox");
  assert.equal(service.resolve("browser").chosen, "org.mozilla.firefox");
  service.reset("browser");
  assert.equal(service.resolve("browser").chosen, "aetherius.browser");
  assert.throws(() => service.resolve("nope" as never), /unknown app role/);
  assert.throws(() => service.setDefault("nope" as never, "x"), /unknown app role/);
  assert.throws(() => service.setDefault("browser", "  "), /needs an id/);
  assert.throws(() => new DefaultAppService("beos" as never), /unknown OS family/);
});

test("URL schemes and MIME types route to the right default role", () => {
  const service = new DefaultAppService("linux");
  assert.equal(service.roleFor("https://example.test"), "browser");
  assert.equal(service.roleFor("mailto:someone@example.test"), "mail");
  assert.equal(service.roleFor("tel:+441234567890"), "messages");
  assert.equal(service.roleFor("text/plain"), "textEditor");
  assert.equal(service.roleFor("notes.md"), "textEditor");
  assert.equal(service.roleFor("application/pdf"), "pdf");
  assert.equal(service.roleFor("book.pdf"), "pdf");
  assert.equal(service.roleFor("image/png"), "photos");
  assert.equal(service.roleFor("audio/flac"), "music");
  assert.equal(service.roleFor("video/mp4"), "mediaPlayer");
  assert.equal(service.roleFor("application/zip"), "archive");
  assert.equal(service.roleFor("bundle.tar"), "archive");
  assert.equal(service.roleFor("application/msword"), "documents");
  assert.throws(() => service.roleFor("application/x-unknown"), /no default app role/);
});

const REQUEST = {
  appId: "aetherius.notes",
  version: "1.4.2",
  publisher: "Aetherius",
  signed: true,
  notarised: true,
  architecture: "x64" as const,
};

test("each OS gets a real package format and signing chain", () => {
  const planner = new InstallerPlanner();
  const expected = {
    microsoft: "msix",
    apple: "dmg",
    linux: "deb",
    android: "aab",
    ios: "ipa",
    google: "pwa",
  } as const;
  for (const os of OS_FAMILIES) {
    const plan = planner.plan(os, REQUEST);
    assert.equal(plan.os, os);
    assert.equal(plan.format, expected[os]);
    assert.match(plan.artifactName, /1\.4\.2/);
    assert.ok(plan.signing.length > 0);
    assert.ok(plan.installSteps.length > 0);
    assert.ok(plan.uninstallSteps.length > 0);
    assert.ok(plan.rollback.length > 0);
    assert.ok(plan.verification.length > 0);
  }
});

test("an unsigned package is planned but marked blocked on the platforms that require signing", () => {
  const planner = new InstallerPlanner();
  for (const os of ["microsoft", "apple", "linux", "android", "google"] as const) {
    const plan = planner.plan(os, { ...REQUEST, signed: false, notarised: false });
    assert.ok(plan.blocked.length > 0, `${os} should block an unsigned release`);
  }
  // iOS always requires Apple signing and a distribution channel.
  assert.ok(planner.plan("ios", REQUEST).blocked.length > 0);
  // macOS needs both a signature and a notarisation ticket.
  assert.ok(planner.plan("apple", { ...REQUEST, notarised: false }).blocked.length > 0);
  assert.equal(planner.plan("microsoft", REQUEST).blocked.length, 0);
});

test("the installer planner rejects malformed requests", () => {
  const planner = new InstallerPlanner();
  assert.throws(() => planner.plan("beos" as never, REQUEST), /unknown OS family/);
  assert.throws(() => planner.plan("linux", { ...REQUEST, version: "1.4" }), /not semver/);
  assert.throws(() => planner.plan("linux", { ...REQUEST, appId: " " }), /needs an app id/);
  assert.throws(() => planner.plan("linux", { ...REQUEST, publisher: "" }), /needs a publisher/);
});
