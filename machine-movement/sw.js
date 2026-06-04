const CACHE_NAME = "machine-movement-offline-v18";

const OFFLINE_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js",
  "./exceljs.min.js",
  "./template.xlsm",
  "./playnation.png",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const file of OFFLINE_FILES) {
        try {
          const response = await fetch(file, { cache: "reload" });
          if (response.ok) {
            await cache.put(file, response);
          } else {
            console.warn("Not cached:", file, response.status);
          }
        } catch (err) {
          console.warn("Failed to cache:", file, err);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
