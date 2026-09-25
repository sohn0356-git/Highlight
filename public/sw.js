const CACHE = "mileage-app-v3";
const BASE = "/Highlight";
const ASSETS = [
  BASE + "/",
  BASE + "/login/",
  BASE + "/home/",
  BASE + "/qt/",
  BASE + "/missions/",
  BASE + "/urinae/",
  BASE + "/my/",
  BASE + "/icons/notification-icon.svg",
  BASE + "/icons/notification-badge.svg",
];

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
  var url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(function (res) {
        var copy = res.clone();
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

self.addEventListener("push", function (event) {
  var payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { body: event.data ? event.data.text() : "" };
  }
  var title = payload.title || "Highlight 알림";
  var options = {
    body: payload.body || "새 알림이 있어요",
    icon: BASE + "/icons/notification-icon.svg",
    badge: BASE + "/icons/notification-badge.svg",
    tag: payload.tag || "highlight-notification",
    data: { url: payload.url || BASE + "/home/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : BASE + "/home/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i += 1) {
        var client = clientList[i];
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
