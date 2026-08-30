const CACHE = "mileage-app-v1";
const BASE = "/Highlight";
const ASSETS = [BASE + "/", BASE + "/login/", BASE + "/home/", BASE + "/qt/", BASE + "/missions/", BASE + "/urinae/", BASE + "/my/"];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(function (res) {
        const copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
        return res;
      })
      .catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match(BASE + "/");
        });
      })
  );
});
