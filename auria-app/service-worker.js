const CACHE_NAME = "auria-app-v12";
const APP_SHELL = [
  "./",
  "./index.html?v=12",
  "./style.css?v=12",
  "./app.js?v=12",
  "./config.js?v=12",
  "./data.js?v=12",
  "./calendar.js?v=12",
  "./manifest.json?v=12",
  "./assets/brand/auria-logo.png",
  "./assets/brand/auria-icon.svg",
  "./assets/images/icon-512-auria.png?v=12",
  "./assets/images/icon-192-auria.png?v=12",
  "./assets/images/icon-128-auria.png?v=12",
  "./assets/images/icon-favicon-auria.png?v=12",
  "./assets/images/treatment-kobido.jpg",
  "./assets/images/angels-profile.jpg",
  "./assets/images/consultation.jpg",
  "./assets/images/facial-muscles-preview.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
