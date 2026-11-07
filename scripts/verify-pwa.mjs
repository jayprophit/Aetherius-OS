#!/usr/bin/env node
/**
 * Verify the production build as an installable web/PWA and record real
 * launch/performance evidence.
 *
 * This checks the installability criteria (manifest, icons, service worker,
 * hashed precache) and serves the build from a local HTTP origin. It does not
 * automate the browser's user-driven install prompt, and it does not claim
 * wide-area or production capacity.
 */

import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { arch, cpus, platform, release, totalmem } from "node:os";
import { dirname, extname, join, resolve, sep } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(repoRoot, "dist");
const docsEvidenceDir = join(repoRoot, "docs", "evidence");
const releaseEvidenceDir = join(repoRoot, "release", "evidence");
const SAMPLE_COUNT = 200;
const WARMUP_COUNT = 10;
const LOOPBACK_P95_CEILING_MS = 250;

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

const checks = [];

function check(id, passed, detail) {
  checks.push({ id, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"} ${id}: ${detail}`);
}

function readJsonFile(path, label) {
  if (!existsSync(path)) {
    check(label, false, `${path} does not exist`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    check(label, false, `${path} is not valid JSON: ${error.message}`);
    return null;
  }
}

function pngSize(buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function percentile(values, percent) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((percent / 100) * sorted.length) - 1));
  return sorted[index];
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function writeEvidence(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  if (!existsSync(distDir)) {
    console.error("dist/ does not exist. Run `npm run build` first.");
    process.exit(1);
  }

  const indexHtml = readFileSync(join(distDir, "index.html"), "utf8");
  const manifestPath = join(distDir, "manifest.webmanifest");
  const manifest = readJsonFile(manifestPath, "manifest-exists");
  const serviceWorkerPath = join(distDir, "sw.js");
  const precachePath = join(distDir, "sw-manifest.json");
  const precache = readJsonFile(precachePath, "precache-manifest-exists");

  check(
    "index-manifest-link",
    /rel="manifest"\s+href="manifest\.webmanifest"/.test(indexHtml) ||
      /href="manifest\.webmanifest"\s+rel="manifest"/.test(indexHtml),
    "index.html links the web app manifest",
  );
  check(
    "index-theme-color",
    /name="theme-color"\s+content="#0b1020"/.test(indexHtml) ||
      /content="#0b1020"\s+name="theme-color"/.test(indexHtml),
    "index.html declares the theme colour",
  );
  check("index-root", indexHtml.includes('id="root"'), "index.html has the application root");

  if (manifest) {
    check("manifest-name", typeof manifest.name === "string" && manifest.name.length > 0, "manifest has a name");
    check(
      "manifest-short-name",
      typeof manifest.short_name === "string" && manifest.short_name.length > 0,
      "manifest has a short name",
    );
    check("manifest-start-url", typeof manifest.start_url === "string", "manifest has a start URL");
    check("manifest-scope", typeof manifest.scope === "string", "manifest has a scope");
    check(
      "manifest-display",
      ["standalone", "fullscreen", "minimal-ui"].includes(manifest.display),
      `manifest display is ${manifest.display ?? "missing"}`,
    );
    check(
      "manifest-theme-colors",
      typeof manifest.theme_color === "string" && typeof manifest.background_color === "string",
      "manifest declares theme and background colours",
    );

    const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
    const requiredSizes = ["192x192", "512x512"];
    for (const size of requiredSizes) {
      const icon = icons.find((entry) => entry?.sizes === size && entry?.type === "image/png");
      check(`manifest-icon-${size}`, Boolean(icon), `manifest declares a ${size} PNG icon`);
      if (icon) {
        const iconPath = resolve(distDir, icon.src);
        const iconExists = existsSync(iconPath);
        check(`icon-file-${size}`, iconExists, `${icon.src} exists in the build`);
        if (iconExists) {
          const dimensions = pngSize(readFileSync(iconPath));
          check(
            `icon-dimensions-${size}`,
            dimensions?.width === Number(size.split("x")[0]) && dimensions?.height === Number(size.split("x")[1]),
            `${icon.src} is ${dimensions?.width ?? "?"}x${dimensions?.height ?? "?"}`,
          );
        }
      }
    }

    const maskable = icons.find((entry) => entry?.sizes === "512x512" && entry?.purpose === "maskable");
    check("manifest-maskable-icon", Boolean(maskable), "manifest declares a maskable 512x512 icon");
  }

  const serviceWorker = existsSync(serviceWorkerPath) ? readFileSync(serviceWorkerPath, "utf8") : "";
  check("service-worker-exists", serviceWorker.length > 0, "sw.js exists in the build");
  check(
    "service-worker-fetch-handler",
    /addEventListener\(["']fetch["']/.test(serviceWorker),
    "service worker installs a fetch handler",
  );
  check(
    "service-worker-precache",
    /caches\.open/.test(serviceWorker) && /sw-manifest\.json/.test(serviceWorker),
    "service worker precaches the generated asset manifest",
  );

  if (precache) {
    const files = Array.isArray(precache.files) ? precache.files : [];
    check("precache-files", files.length > 0, `precache manifest lists ${files.length} files`);
    check(
      "precache-hashed-js",
      files.some((file) => /^\.\/assets\/.+\.js$/.test(file)),
      "precache manifest lists the hashed JavaScript bundle",
    );
  }

  const scriptMatch = indexHtml.match(/<script[^>]+src="([^"]+\.js)"/);
  const scriptPath = scriptMatch?.[1] ?? null;
  check("index-script", Boolean(scriptPath), `index.html references ${scriptPath ?? "no script"}`);

  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(url.pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filePath = resolve(distDir, relative);
    if (filePath !== distDir && !filePath.startsWith(`${distDir}${sep}`)) {
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
    createReadStream(filePath).pipe(response);
  });

  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const endpoints = [
    { path: "/", type: "text/html" },
    { path: "/manifest.webmanifest", type: "application/manifest+json" },
    { path: "/sw.js", type: "text/javascript" },
    { path: "/sw-manifest.json", type: "application/json" },
    { path: "/icons/icon-192.png", type: "image/png" },
    { path: "/icons/icon-512.png", type: "image/png" },
    { path: "/icons/icon-maskable-512.png", type: "image/png" },
    ...(scriptPath ? [{ path: scriptPath, type: "text/javascript" }] : []),
  ];

  const timings = new Map(endpoints.map((endpoint) => [endpoint.path, []]));
  const failures = [];

  try {
    for (const endpoint of endpoints) {
      for (let i = 0; i < WARMUP_COUNT; i += 1) {
        const response = await fetch(`${baseUrl}${endpoint.path}`);
        await response.arrayBuffer();
        if (!response.ok) failures.push(`${endpoint.path} warmup returned ${response.status}`);
      }
    }

    for (const endpoint of endpoints) {
      for (let i = 0; i < SAMPLE_COUNT; i += 1) {
        const started = performance.now();
        const response = await fetch(`${baseUrl}${endpoint.path}`);
        await response.arrayBuffer();
        const elapsed = performance.now() - started;
        timings.get(endpoint.path).push(elapsed);
        if (!response.ok) failures.push(`${endpoint.path} returned ${response.status}`);
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.startsWith(endpoint.type)) {
          failures.push(`${endpoint.path} content-type ${contentType || "missing"} does not start with ${endpoint.type}`);
        }
      }
    }
  } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
  }

  const allTimings = [...timings.values()].flat();
  const p95Ms = round(percentile(allTimings, 95));
  const p50Ms = round(percentile(allTimings, 50));
  const p99Ms = round(percentile(allTimings, 99));
  const endpointResults = endpoints.map((endpoint) => ({
    path: endpoint.path,
    expectedType: endpoint.type,
    samples: timings.get(endpoint.path).length,
    p50Ms: round(percentile(timings.get(endpoint.path), 50)),
    p95Ms: round(percentile(timings.get(endpoint.path), 95)),
    p99Ms: round(percentile(timings.get(endpoint.path), 99)),
  }));

  check("http-all-200", failures.length === 0, failures.length === 0 ? "every endpoint returned 200 with the expected content type" : failures.join("; "));
  check(
    "performance-p95",
    Number.isFinite(p95Ms) && p95Ms <= LOOPBACK_P95_CEILING_MS,
    `p95 ${p95Ms}ms over ${allTimings.length} loopback requests (ceiling ${LOOPBACK_P95_CEILING_MS}ms)`,
  );

  const generatedAt = new Date().toISOString();
  const hardware = {
    cpu: cpus()[0]?.model ?? "unknown",
    logicalCores: cpus().length,
    memoryGiB: Math.round((totalmem() / 1024 ** 3) * 10) / 10,
    platform: platform(),
    release: release(),
    arch: arch(),
  };
  const passed = checks.every((entry) => entry.passed);

  const performanceEvidence = {
    schema_version: "1.0.0",
    status: passed ? "PASS" : "FAIL",
    generatedAt,
    p95Ms,
    p50Ms,
    p99Ms,
    samples: allTimings.length,
    method:
      "Loopback HTTP GET of the production build served by a local static server; 10 warmups and 200 samples per endpoint. Bodies were fully consumed.",
    hardware,
    environment: {
      node: process.version,
      cwd: repoRoot,
      origin: "http://127.0.0.1 (ephemeral port)",
    },
    endpoints: endpointResults,
    thresholds: { loopbackP95CeilingMs: LOOPBACK_P95_CEILING_MS },
    notes:
      "Loopback baseline only. This does not measure wide-area network latency, production capacity, or client rendering time.",
    checks,
  };

  const installMatrix = {
    schema_version: "1.0.0",
    status: passed ? "PASS" : "FAIL",
    generatedAt,
    platforms: [
      {
        id: "web-pwa-selfhost",
        name: "Self-hosted web/PWA",
        install: passed ? "PASS" : "FAIL",
        launch: passed ? "PASS" : "FAIL",
        uninstall: "NOT_APPLICABLE",
        evidence: {
          installability: [
            "manifest name, short name, start URL, scope and standalone display",
            "192x192 and 512x512 PNG icons with verified dimensions",
            "maskable 512x512 icon",
            "service worker with a fetch handler",
            "generated precache manifest including the hashed JavaScript bundle",
            "served from a localhost secure context",
          ],
          launch: [
            "index.html, manifest, service worker, precache manifest and icons returned HTTP 200",
            "the hashed JavaScript bundle returned HTTP 200 with a JavaScript content type",
          ],
          command: "npm run verify:pwa",
          report: "release/evidence/pwa-report.json",
        },
        notes:
          "Installability criteria were verified programmatically. The browser's user-driven install prompt was not automated; no native package exists.",
      },
    ],
  };

  const pwaReport = {
    schema_version: "1.0.0",
    status: passed ? "PASS" : "FAIL",
    generatedAt,
    platform: "web-pwa-selfhost",
    checks,
    performance: performanceEvidence,
    installMatrix,
  };

  writeEvidence(join(docsEvidenceDir, "performance.json"), performanceEvidence);
  writeEvidence(join(docsEvidenceDir, "install-matrix.json"), installMatrix);
  writeEvidence(join(releaseEvidenceDir, "pwa-report.json"), pwaReport);

  console.log(JSON.stringify({ status: passed ? "PASS" : "FAIL", p95Ms, samples: allTimings.length }, null, 2));
  process.exitCode = passed ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
