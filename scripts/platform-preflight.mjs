#!/usr/bin/env node
/**
 * Cross-platform delivery preflight.
 *
 * Reports what this host can actually build. It never installs anything and
 * never treats a missing toolchain as a passing result.
 *
 *   node scripts/platform-preflight.mjs
 *   node scripts/platform-preflight.mjs --strict
 *   node scripts/platform-preflight.mjs --json
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const strict = process.argv.includes("--strict");
const jsonOnly = process.argv.includes("--json");

function probe(command, args = []) {
  try {
    const output = execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 15000,
    }).trim().split(/\r?\n/)[0];
    return { status: "AVAILABLE", detail: output };
  } catch (error) {
    return {
      status: "MISSING",
      detail: error?.code === "ENOENT" ? "not on PATH" : String(error?.message ?? error).split(/\r?\n/)[0],
    };
  }
}

function env(name) {
  const value = process.env[name];
  return value ? { status: "SET", detail: value } : { status: "MISSING", detail: `${name} is not set` };
}

function file(relative) {
  const path = join(ROOT, relative);
  return existsSync(path)
    ? { status: "PRESENT", detail: relative }
    : { status: "MISSING", detail: `${relative} does not exist` };
}

const checks = {
  host: {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
  },
  desktop: {
    node: { status: "AVAILABLE", detail: process.version },
    cargo: probe("cargo", ["--version"]),
    rustc: probe("rustc", ["--version"]),
    tauriConfig: file("src-tauri/tauri.conf.json"),
    cargoManifest: file("src-tauri/Cargo.toml"),
  },
  android: {
    javaHome: env("JAVA_HOME"),
    androidHome: env("ANDROID_HOME"),
    androidSdkRoot: env("ANDROID_SDK_ROOT"),
    ndkHome: env("NDK_HOME"),
    adb: probe("adb", ["version"]),
    generatedProject: file("src-tauri/gen/android"),
  },
  ios: {
    availableOnThisHost: process.platform === "darwin",
    xcodebuild:
      process.platform === "darwin"
        ? probe("xcodebuild", ["-version"])
        : { status: "NOT_APPLICABLE", detail: "iOS builds require macOS and Xcode" },
    generatedProject: file("src-tauri/gen/apple"),
  },
  vm: {
    docker: probe("docker", ["--version"]),
    compose: probe("docker", ["compose", "version"]),
    dockerfile: file("packaging/vm/Dockerfile"),
    composeFile: file("packaging/vm/docker-compose.yml"),
  },
  web: {
    dist: file("dist/index.html"),
    pwaManifest: file("public/manifest.webmanifest"),
    serviceWorkerSource: file("public/sw.js"),
  },
};

const desktopRequired = ["cargo", "rustc", "tauriConfig", "cargoManifest"];
const desktopBlocked = desktopRequired.filter((key) => checks.desktop[key].status === "MISSING");

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  strict,
  desktop: {
    status: desktopBlocked.length === 0 ? "BUILDABLE" : "BLOCKED",
    blockedBy: desktopBlocked,
    checks: checks.desktop,
  },
  android: {
    status:
      checks.android.javaHome.status === "SET" &&
      (checks.android.androidHome.status === "SET" || checks.android.androidSdkRoot.status === "SET") &&
      checks.android.adb.status === "AVAILABLE"
        ? "BUILDABLE"
        : "BLOCKED",
    checks: checks.android,
  },
  ios: {
    status:
      checks.ios.xcodebuild.status === "AVAILABLE" ? "BUILDABLE" : "BLOCKED",
    checks: checks.ios,
  },
  vm: {
    status:
      checks.vm.docker.status === "AVAILABLE" && checks.vm.compose.status === "AVAILABLE"
        ? "BUILDABLE"
        : "BLOCKED",
    checks: checks.vm,
  },
  web: {
    status: checks.web.dist.status === "PRESENT" ? "BUILDABLE" : "UNVERIFIED",
    checks: checks.web,
  },
  host: checks.host,
};

console.log(JSON.stringify(report, null, 2));

if (strict && desktopBlocked.length > 0) {
  console.error(`Desktop toolchain incomplete: ${desktopBlocked.join(", ")}`);
  process.exitCode = 1;
}
