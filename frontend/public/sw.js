const CACHE_NAME = "medicare-cache-v1";
const OFFLINE_URL = "/index.html";

const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
];

// Install Event - Pre-cache shell and core pages
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching structural shell assets");
      return Promise.all(
        ASSETS_TO_CACHE.map((url) => {
          return cache.add(url).catch((err) => {
            console.error(`[Service Worker] Failed to cache ${url}:`, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Handle offline navigation and caching strategies
self.addEventListener("fetch", (event) => {
  // 1. Skip non-GET requests and API requests
  if (event.request.method !== "GET" || event.request.url.includes("/api/v1/")) {
    return;
  }

  // 2. Navigation request strategy (HTML pages)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log("[Service Worker] Navigation failed, loading offline shell");
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // 3. Static Assets strategy (Cache First, Fallback to Network)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Only cache valid standard local static responses
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic" &&
          (event.request.url.endsWith(".js") ||
            event.request.url.endsWith(".css") ||
            event.request.url.includes("/assets/"))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for missing static images or fonts
        return new Response("Offline resource unavailable", {
          status: 503,
          statusText: "Service Unavailable",
        });
      });
    })
  );
});
