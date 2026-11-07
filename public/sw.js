/*
 * Aetherius OS service worker.
 *
 * The shell and the hashed production assets are precached from the manifest
 * emitted by the Vite build. Navigation is network-first so a deploy takes
 * effect promptly; hashed assets are cache-first because their names change
 * when their contents change.
 */

const CACHE = "aetherius-shell-v1";
const SHELL = [
  "./",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

async function precache() {
  const cache = await caches.open(CACHE);
  let buildFiles = [];
  let manifestAvailable = false;

  try {
    const response = await fetch("./sw-manifest.json", { cache: "no-store" });
    if (response.ok) {
      const manifest = await response.json();
      if (Array.isArray(manifest.files)) {
        buildFiles = manifest.files.filter(
          (file) => typeof file === "string" && file.startsWith("./"),
        );
      }
      manifestAvailable = true;
    }
  } catch {
    // A development server has no generated manifest. The shell still works.
  }

  const urls = [
    ...new Set([
      ...SHELL,
      ...(manifestAvailable ? ["./sw-manifest.json"] : []),
      ...buildFiles,
    ]),
  ];

  await cache.addAll(urls.map((url) => new Request(url, { cache: "reload" })));
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name !== CACHE).map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

async function networkFirst(request, cacheKey = request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(cacheKey, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(cacheKey);
    return cached ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (
    request.mode === "navigate" ||
    url.pathname.endsWith("/manifest.webmanifest") ||
    url.pathname.endsWith("/sw-manifest.json")
  ) {
    const cacheKey = request.mode === "navigate" ? "./" : request;
    event.respondWith(networkFirst(request, cacheKey));
    return;
  }

  event.respondWith(cacheFirst(request));
});
