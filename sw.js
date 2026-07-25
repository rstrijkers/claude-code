// Caches this page so it can open with no network connection.
// The app's data (GPS, compass) comes from on-device sensors, not
// the network — this worker only needs to serve the page itself.
//
// CACHE_NAME is tied to the app version in orientation-instruments.html.
// Bump both together when shipping a change — a new cache name forces
// Safari to fetch the updated page instead of serving the stale cached
// copy, which otherwise can stick around indefinitely.

const CACHE_NAME = 'position-heading-v2.9.0';

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll([
        './',
        './orientation-instruments.html'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(n){ return n !== CACHE_NAME; })
             .map(function(n){ return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Cache-first: serve instantly from cache, and quietly refresh the
// cache in the background when a network connection is available.
self.addEventListener('fetch', function(event){
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cached){
      const fetchPromise = fetch(event.request).then(function(networkResponse){
        caches.open(CACHE_NAME).then(function(cache){
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
