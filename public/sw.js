const cacheName = "coffee-timer-shell-v1";
const shellAssets = [
  "/coffee_timer/",
  "/coffee_timer/manifest.webmanifest",
  "/coffee_timer/icon.svg",
  "/coffee_timer/maskable-icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(shellAssets)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          const copy = response.clone();

          if (response.ok && new URL(request.url).origin === self.location.origin) {
            caches.open(cacheName).then((cache) => cache.put(request, copy));
          }

          return response;
        })
        .catch(() => caches.match("/coffee_timer/"));
    }),
  );
});
