const CACHE_NAME = 'apexbid-v1';
const ASSETS_TO_CACHE = [
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com'
];

// Install event - caches the app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching app shell');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate event - cleans up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch event - serves app from cache
self.addEventListener('fetch', (event) => {
    // We only care about GET requests for the app shell
    if (event.request.method !== 'GET') {
      return;
    }

    // Don't cache Firebase requests, let them be handled by Firestore's offline persistence
    if (event.request.url.includes('firebase') || event.request.url.includes('firestore')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache-first strategy
                return response || fetch(event.request).then((fetchResponse) => {
                    // Optionally cache new requests
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                });
            })
    );
});