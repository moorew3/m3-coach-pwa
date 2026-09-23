// Kill-switch worker. This project is manifest-only (no offline app-shell cache),
// but earlier builds may have registered a service worker at this path, which can
// keep serving an old app shell to installed Android PWAs. This replacement worker
// evicts only its own Workbox-style asset caches and unregisters itself.
// It never touches localStorage, so saved workouts and logs are untouched.

function isOwnAssetCache(name) {
  const hasWorkboxBucket = /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name);
  return hasWorkboxBucket && name.endsWith(self.registration.scope);
}

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const own = cacheNames.filter(isOwnAssetCache);
        await Promise.allSettled(own.map((name) => caches.delete(name)));
        await self.clients.claim();
        const windowClients = await self.clients.matchAll({ type: "window" });
        await Promise.allSettled(windowClients.map((client) => client.navigate(client.url)));
      } finally {
        await self.registration.unregister();
      }
    })(),
  ),
);