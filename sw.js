// EduScan PH — Service Worker v3 (Bulletproof Offline)
const CACHE_NAME = 'eduscan-ph-v3'; // Bumped to v3 to force update!

// CRITICAL: We explicitly list index.html here so it is guaranteed 
// to be downloaded and saved the exact millisecond the app installs.
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192-any.png',
  '/icon-192-maskable.png',
  '/icon-512-any.png',
  '/icon-512-maskable.png',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'
];

// ── INSTALL: Force download all core files immediately ────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// ── ACTIVATE: Clean up old caches and take control ────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // Take control of all tabs
  );
});

// ── FETCH: Network First, fallback to Cache (Foolproof) ───────────────────
self.addEventListener('fetch', event => {
  // Ignore non-GET requests (like your POST sync requests to Google Sheets)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // If we have internet, fetch from network and update the cache
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // NO INTERNET: Try to serve from cache
        return caches.match(event.request).then(cachedResponse => {
          // If the exact file isn't cached, fallback to index.html so the app shell still loads
          return cachedResponse || caches.match('/index.html');
        });
      })
  );
});