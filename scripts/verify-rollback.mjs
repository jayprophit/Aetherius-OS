#!/usr/bin/env node
/**
 * Exercise a real web-bundle upgrade and rollback on one loopback origin.
 *
 * Two production builds are made from the same source with different build
 * stamps. Build A is served first, the shell's real settings key is written
 * to browser storage, then build B is activated on the same origin. Finally
 * build A is restored. At every step the drill checks that the expected bundle
 * is live, that the shell renders, and that browser storage survived.
 *
 * This is a deployment-level rollback drill, not a claim that a production
 * DNS/TLS/CDN rollback has been performed. There is no earlier public release,
 * so the previous bundle is a locally built artifact with a distinct stamp.
 */

import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const evidencePath = join(repoRoot, "docs", "evidence", "rollback.json");
const detailPath = join(repoRoot, "release", "evidence", "rollback-report.json");
const drillDir = join(tmpdir(), `aetherius-rollback-${process.pid}-${Date.now()}`);
const profileDir = join(drillDir, "chrome-profile");
const buildA = join(drillDir, "release-a");
const buildB = join(drillDir, "release-b");
const buildIdA = "0.1.0-rollback-a";
const buildIdB = "0.1.0-rollback-b";
const settingsKey = "aetherius.shell.settings.v1";
const drillKey = "aetherius.rollback.drill";
const drillValue = "survives-upgrade-and-rollback";
const settingsValue = {
  theme: "light",
  providerPollMs: 4242,
  bridgeEndpoint: "http://127.0.0.1:8471",
  matEndpoint: "http://127.0.0.1:8472",
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const results = [];
const consoleMessages = [];

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    join(process.env.PROGRAMFILES ?? "", "Google", "Chrome", "Application", "chrome.exe"),
    join(process.env["PROGRAMFILES(X86)"] ?? "", "Google", "Chrome", "Application", "chrome.exe"),
    join(process.env.LOCALAPPDATA ?? "", "Google", "Chrome", "Application", "chrome.exe"),
    join(process.env.PROGRAMFILES ?? "", "Microsoft", "Edge", "Application", "msedge.exe"),
    join(process.env["PROGRAMFILES(X86)"] ?? "", "Microsoft", "Edge", "Application", "msedge.exe"),
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function buildBundle(buildId, outDir) {
  const viteBin = join(repoRoot, "node_modules", "vite", "bin", "vite.js");
  if (!existsSync(viteBin)) {
    throw new Error(`Vite is not installed at ${viteBin}; run npm install first.`);
  }
  const result = spawnSync(
    process.execPath,
    [viteBin, "build", "--outDir", outDir, "--emptyOutDir", "--logLevel", "warn"],
    {
      cwd: repoRoot,
      env: { ...process.env, AETHERIUS_BUILD_ID: buildId },
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    },
  );
  if (result.status !== 0) {
    throw new Error(
      `vite build failed for ${buildId} (${result.status})\n${result.stdout ?? ""}\n${result.stderr ?? ""}`,
    );
  }
}

function describeBundle(dir) {
  const indexPath = join(dir, "index.html");
  const indexHtml = readFileSync(indexPath, "utf8");
  const scriptSrc = indexHtml.match(/<script[^>]+src="([^"]+\.js)"/)?.[1] ?? null;
  if (!scriptSrc) throw new Error(`No module script found in ${indexPath}`);
  const assetPath = resolve(dir, scriptSrc.replace(/^\/+/, ""));
  if (!assetPath.startsWith(`${resolve(dir)}${sep}`)) {
    throw new Error(`Script path escapes the release directory: ${scriptSrc}`);
  }
  return {
    indexHtmlSha256: sha256File(indexPath),
    scriptSrc,
    scriptFile: scriptSrc.replace(/^\/+/, ""),
    scriptSha256: sha256File(assetPath),
    files: [
      { path: "index.html", bytes: statSync(indexPath).size, sha256: sha256File(indexPath) },
      {
        path: scriptSrc.replace(/^\/+/, ""),
        bytes: statSync(assetPath).size,
        sha256: sha256File(assetPath),
      },
      { path: "manifest.webmanifest", bytes: statSync(join(dir, "manifest.webmanifest")).size },
      { path: "sw.js", bytes: statSync(join(dir, "sw.js")).size },
    ],
  };
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.addEventListener("message", (event) => {
      let message;
      try {
        message = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (message.id && this.pending.has(message.id)) {
        const { resolve: resolvePending, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) {
          reject(new Error(`${message.error.message} (${message.error.code})`));
        } else {
          resolvePending(message.result);
        }
        return;
      }
      if (message.method === "Runtime.consoleAPICalled") {
        const text = (message.params?.args ?? [])
          .map((arg) => arg.value ?? arg.description ?? arg.type)
          .join(" ");
        consoleMessages.push({ type: message.params?.type, text });
      }
      if (message.method === "Runtime.exceptionThrown") {
        consoleMessages.push({
          type: "exception",
          text: message.params?.exceptionDetails?.text ?? "uncaught exception",
        });
      }
    });
  }

  static connect(url, timeoutMs = 15000) {
    return new Promise((resolveConnect, reject) => {
      const socket = new WebSocket(url);
      const timer = setTimeout(() => {
        socket.close();
        reject(new Error(`Timed out connecting to ${url}`));
      }, timeoutMs);
      socket.addEventListener("open", () => {
        clearTimeout(timer);
        resolveConnect(new CdpClient(socket));
      });
      socket.addEventListener("error", () => {
        clearTimeout(timer);
        reject(new Error(`Could not connect to ${url}`));
      });
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolveSend, reject) => {
      this.pending.set(id, { resolve: resolveSend, reject });
      this.socket.send(JSON.stringify(payload));
    });
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(client, sessionId, expression) {
  const result = await client.send(
    "Runtime.evaluate",
    { expression, awaitPromise: true, returnByValue: true },
    sessionId,
  );
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Runtime.evaluate failed");
  }
  return result.result?.value;
}

async function waitFor(label, probe, timeoutMs = 20000) {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < timeoutMs) {
    try {
      const value = await probe();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw new Error(`${label} did not settle within ${timeoutMs}ms${lastError ? `: ${lastError.message}` : ""}`);
}

async function bootProbe(client, sessionId) {
  return evaluate(
    client,
    sessionId,
    `(() => ({
      ready: document.readyState,
      buildId: document.documentElement.dataset.aetheriusBuildId ?? null,
      rootChildren: document.getElementById("root")?.children.length ?? 0,
      script: document.querySelector('script[type="module"]')?.src ?? null,
      title: document.title,
      href: location.href,
      settings: localStorage.getItem(${JSON.stringify(settingsKey)}),
      drill: localStorage.getItem(${JSON.stringify(drillKey)})
    }))()`,
  );
}

async function activateBundle(client, sessionId, baseUrl, expectedBuildId, label) {
  await client.send("Page.navigate", { url: `${baseUrl}/?deploy=${encodeURIComponent(label)}` }, sessionId);
  const probe = await waitFor(
    `${label} boot`,
    async () => {
      const state = await bootProbe(client, sessionId);
      if (state.ready !== "complete" || state.rootChildren < 1) return null;
      if (state.buildId !== expectedBuildId) return null;
      return state;
    },
    30000,
  );
  const serviceWorkers = await evaluate(
    client,
    sessionId,
    `navigator.serviceWorker.getRegistrations().then((entries) => entries.length).catch(() => -1)`,
  ).catch(() => -1);
  return { ...probe, serviceWorkers };
}

function record(step, status, detail) {
  results.push({ step, status, ...detail });
}

function writeEvidence(value) {
  mkdirSync(dirname(evidencePath), { recursive: true });
  mkdirSync(dirname(detailPath), { recursive: true });
  writeFileSync(evidencePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  writeFileSync(detailPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function waitForDevTools(profile, timeoutMs = 15000) {
  const portFile = join(profile, "DevToolsActivePort");
  const content = await waitFor(
    "Chrome DevToolsActivePort",
    async () => (existsSync(portFile) ? readFileSync(portFile, "utf8").trim() : null),
    timeoutMs,
  );
  const [port, path] = content.split(/\r?\n/);
  if (!port || !path) throw new Error(`Unexpected DevToolsActivePort content: ${content}`);
  return `ws://127.0.0.1:${port}${path}`;
}

async function main() {
  if (!existsSync(join(repoRoot, "dist", "index.html"))) {
    console.log("note: dist/ is absent; the drill builds its own bundles");
  }
  const chromePath = findChrome();
  if (!chromePath) {
    throw new Error("No Chrome/Edge executable found. Set CHROME_PATH and retry.");
  }

  mkdirSync(drillDir, { recursive: true });
  console.log(`drill directory: ${drillDir}`);

  console.log(`building ${buildIdA}`);
  buildBundle(buildIdA, buildA);
  console.log(`building ${buildIdB}`);
  buildBundle(buildIdB, buildB);

  const releaseA = describeBundle(buildA);
  const releaseB = describeBundle(buildB);
  if (releaseA.scriptSha256 === releaseB.scriptSha256) {
    throw new Error("The two builds have identical JavaScript bundles; the drill cannot distinguish them");
  }

  let activeRoot = buildA;
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(url.pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filePath = resolve(activeRoot, relative);
    if (filePath !== activeRoot && !filePath.startsWith(`${activeRoot}${sep}`)) {
      response.statusCode = 403;
      response.end("forbidden");
      return;
    }
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      response.statusCode = 404;
      response.end("not found");
      return;
    }
    response.statusCode = 200;
    response.setHeader("Content-Type", MIME_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Service-Worker-Allowed", "/");
    createReadStream(filePath).pipe(response);
  });

  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  console.log(`serving on ${baseUrl}`);

  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      "--remote-allow-origins=*",
      `--user-data-dir=${profileDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-extensions",
      "--disable-gpu",
      "--disable-sync",
      "--metrics-recording-only",
      "--mute-audio",
      "--window-size=1280,800",
      "about:blank",
    ],
    { stdio: "ignore", windowsHide: true },
  );

  let client = null;
  try {
    const browserWs = await waitForDevTools(profileDir);
    client = await CdpClient.connect(browserWs);
    const { targetId } = await client.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await client.send("Target.attachToTarget", { targetId, flatten: true });
    await client.send("Page.enable", {}, sessionId);
    await client.send("Runtime.enable", {}, sessionId);

    const baseline = await activateBundle(client, sessionId, baseUrl, buildIdA, "baseline-a");
    await evaluate(
      client,
      sessionId,
      `(() => {
        localStorage.setItem(${JSON.stringify(settingsKey)}, ${JSON.stringify(JSON.stringify(settingsValue))});
        localStorage.setItem(${JSON.stringify(drillKey)}, ${JSON.stringify(drillValue)});
        return true;
      })()`,
    );
    const baselineStorage = await evaluate(
      client,
      sessionId,
      `(() => ({
        settings: localStorage.getItem(${JSON.stringify(settingsKey)}),
        drill: localStorage.getItem(${JSON.stringify(drillKey)})
      }))()`,
    );
    record("baseline", "PASS", {
      buildId: baseline.buildId,
      script: baseline.script,
      scriptSha256: releaseA.scriptSha256,
      indexHtmlSha256: releaseA.indexHtmlSha256,
      rootChildren: baseline.rootChildren,
      serviceWorkers: baseline.serviceWorkers,
      storageWritten: baselineStorage,
    });

    activeRoot = buildB;
    const upgraded = await activateBundle(client, sessionId, baseUrl, buildIdB, "upgrade-b");
    const upgradedStorage = {
      settings: upgraded.settings,
      drill: upgraded.drill,
    };
    if (upgradedStorage.drill !== drillValue) {
      throw new Error("Drill storage did not survive the upgrade");
    }
    const upgradedSettings = JSON.parse(upgradedStorage.settings ?? "null");
    if (upgradedSettings?.providerPollMs !== settingsValue.providerPollMs) {
      throw new Error("Shell settings did not survive the upgrade");
    }
    record("upgrade", "PASS", {
      fromBuildId: buildIdA,
      toBuildId: upgraded.buildId,
      script: upgraded.script,
      scriptSha256: releaseB.scriptSha256,
      indexHtmlSha256: releaseB.indexHtmlSha256,
      rootChildren: upgraded.rootChildren,
      serviceWorkers: upgraded.serviceWorkers,
      storagePreserved: upgradedStorage,
    });

    activeRoot = buildA;
    const rolledBack = await activateBundle(client, sessionId, baseUrl, buildIdA, "rollback-a");
    const rolledBackStorage = {
      settings: rolledBack.settings,
      drill: rolledBack.drill,
    };
    if (rolledBackStorage.drill !== drillValue) {
      throw new Error("Drill storage did not survive the rollback");
    }
    const rolledBackSettings = JSON.parse(rolledBackStorage.settings ?? "null");
    if (rolledBackSettings?.providerPollMs !== settingsValue.providerPollMs) {
      throw new Error("Shell settings did not survive the rollback");
    }
    if (rolledBack.script !== baseline.script) {
      throw new Error(`Rollback activated ${rolledBack.script}, expected ${baseline.script}`);
    }
    record("rollback", "PASS", {
      fromBuildId: buildIdB,
      toBuildId: rolledBack.buildId,
      script: rolledBack.script,
      scriptSha256: releaseA.scriptSha256,
      indexHtmlSha256: releaseA.indexHtmlSha256,
      matchesBaselineScript: true,
      rootChildren: rolledBack.rootChildren,
      serviceWorkers: rolledBack.serviceWorkers,
      storagePreserved: rolledBackStorage,
    });

    const unexpected = consoleMessages.filter(
      (message) => message.type === "exception" || message.type === "error",
    );
    const status = unexpected.length === 0 ? "PASS" : "FAIL";

    const evidence = {
      schema_version: "1.0.0",
      status,
      generatedAt: new Date().toISOString(),
      platform: "web-pwa-selfhost",
      release: "0.1.0",
      method:
        "Two production Vite builds with distinct build stamps were served on one loopback origin. The active release directory was switched to upgrade, then switched back to roll back. A headless Chrome instance verified the live build stamp, rendered root, service-worker registration, and origin-scoped browser storage at each step.",
      dataPreserved: true,
      dataKeys: [settingsKey, drillKey],
      browser: {
        executable: chromePath,
        protocol: "Chrome DevTools Protocol",
        headless: true,
      },
      builds: {
        a: { buildId: buildIdA, ...releaseA },
        b: { buildId: buildIdB, ...releaseB },
      },
      results,
      console: {
        totalMessages: consoleMessages.length,
        errorsOrExceptions: unexpected,
      },
      limitations: [
        "Loopback static server only; no production DNS, TLS, load balancer, or CDN was switched.",
        "No prior public release exists, so the previous bundle is a locally built artifact with a distinct build stamp.",
        "Browser storage persistence was tested in a fresh temporary Chrome profile; server-side data stores were not involved.",
      ],
    };
    writeEvidence(evidence);

    console.log(
      JSON.stringify(
        {
          status,
          baseline: results[0]?.buildId,
          upgrade: results[1]?.toBuildId,
          rollback: results[2]?.toBuildId,
          dataPreserved: true,
          consoleErrors: unexpected.length,
        },
        null,
        2,
      ),
    );
    process.exitCode = status === "PASS" ? 0 : 1;
  } finally {
    try {
      await client?.send("Browser.close");
    } catch {
      // The browser may already be gone.
    }
    client?.close();
    chrome.kill();
    await new Promise((resolveClose) => server.close(resolveClose));
    try {
      rmSync(drillDir, { recursive: true, force: true });
    } catch {
      // A locked Chrome profile is not worth failing the drill over.
    }
  }
}

main().catch((error) => {
  const evidence = {
    schema_version: "1.0.0",
    status: "FAIL",
    generatedAt: new Date().toISOString(),
    platform: "web-pwa-selfhost",
    release: "0.1.0",
    error: error.message,
    results,
    console: { totalMessages: consoleMessages.length, messages: consoleMessages.slice(-50) },
  };
  try {
    writeEvidence(evidence);
  } catch {
    // The original failure is more useful than a secondary write failure.
  }
  console.error(error);
  process.exit(1);
});
