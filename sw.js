// Caches this page so it can open with no network connection.
// The app's data (GPS, compass) comes from on-device sensors, not
// the network — this worker only needs to serve the page itself.

const CACHE_NAME = 'position-heading-v1';

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
