/* ==========================================================================
   Mock Test Viewer - Service Worker
   Offline-first caching for iPhone 15 & Safari iOS 17+
   ========================================================================== */

const CACHE_VERSION = 'v1.0.0';
const SHELL_CACHE_NAME = `mock-tests-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `mock-tests-runtime-${CACHE_VERSION}`;

// Precache list: all relative paths for GitHub Pages (/<repo>/) and root hosting
const PRECACHE_ASSETS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'db.js',
  'manifest.webmanifest',
  'icons/apple-touch-icon.png',
  'icons/favicon.svg',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

// External origins to runtime-cache so tests function completely offline
const RUNTIME_DOMAINS = [
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'u1.oliveboard.in'
];

/**
 * Checks if a URL matches one of our designated runtime cache domains
 * @param {URL} url
 * @returns {boolean}
 */
function isRuntimeCachable(url) {
  return RUNTIME_DOMAINS.some(domain => url.hostname === domain || url.hostname.endsWith('.' + domain));
}

/* ==========================================================================
   Lifecycle: Install & Precache
   ========================================================================== */
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing Service Worker version ${CACHE_VERSION}`);
  event.waitUntil(
    caches.open(SHELL_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell assets...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Precache successful. Skipping waiting.');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Precache failed:', err);
      })
  );
});

/* ==========================================================================
   Lifecycle: Activate & Clean Old Caches
   ========================================================================== */
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating Service Worker version ${CACHE_VERSION}`);
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old versions of our shell and runtime caches
            if (
              cacheName.startsWith('mock-tests-') &&
              cacheName !== SHELL_CACHE_NAME &&
              cacheName !== RUNTIME_CACHE_NAME
            ) {
              console.log('[SW] Purging outdated cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients for immediate offline control.');
        return self.clients.claim();
      })
  );
});

/* ==========================================================================
   Fetch Handling
   ========================================================================== */
self.addEventListener('fetch', (event) => {
  // Only handle standard GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const reqUrl = new URL(event.request.url);

  // 1. Navigation requests (HTML documents): Cache-first with network revalidate & offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Trigger background revalidation if online
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return networkResponse;
          })
          .catch(() => null);

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetchPromise.then((networkResponse) => {
          if (networkResponse) {
            return networkResponse;
          }
          // Offline fallback for navigation: match root or index.html
          return caches.match('./').then((rootRes) => rootRes || caches.match('index.html'));
        });
      })
    );
    return;
  }

  // 2. Runtime Caching for External Test Assets (FontAwesome, Google Fonts, Oliveboard Logo)
  if (isRuntimeCachable(reqUrl)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            // Support both standard OK and opaque cross-origin responses
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              const clone = networkResponse.clone();
              caches.open(RUNTIME_CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return networkResponse;
          })
          .catch((err) => {
            console.warn('[SW] Runtime asset fetch failed (device offline):', reqUrl.href);
            return new Response('', { status: 408, statusText: 'Offline Asset Unavailable' });
          });
      })
    );
    return;
  }

  // 3. Same-origin Static App Shell Assets: Cache-first with background revalidation
  if (reqUrl.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background when connected
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const clone = networkResponse.clone();
                caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(event.request, clone));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }
});

/* ==========================================================================
   Message Interface
   ========================================================================== */
self.addEventListener('message', (event) => {
  if (event.data) {
    if (event.data.type === 'GET_VERSION') {
      event.ports[0]?.postMessage({ version: CACHE_VERSION });
    } else if (event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  }
});
