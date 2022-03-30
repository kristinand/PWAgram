const CACHE_STATIC = 'static-v9';
const CACHE_DYNAMIC = 'dynamic-v8';

self.addEventListener('install', (event) => {
  console.log('[SW] installing sw...', event);

  // it won't finish the installation event before cahce is open
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      console.log('[SW] precaching app shell');
      cache.addAll([
        '/',
        '/index.html',
        '/offline.html',
        '/src/js/app.js',
        '/src/js/feed.js',
        '/src/js/promise.js',
        '/src/js/fetch.js',
        '/src/js/material.min.js',
        '/src/css/app.css',
        '/src/css/feed.css',
        '/src/images/main-image.jpg',
        'https://fonts.googleapis.com/css?family=Roboto:400,700',
        'https://fonts.googleapis.com/icon?family=Material+Icons',
        'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] activating sw...', event);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_STATIC && key !== CACHE_DYNAMIC) {
            console.log(`[SW] removing old cache ${key}`);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => {
      if (res) {
        return res;
      }

      return fetch(event.request)
        .then((res) => {
          return caches.open(CACHE_DYNAMIC).then((cache) => {
            cache.put(event.request.url, res.clone());
            return res;
          });
        })
        .catch(() => {
          return caches.open(CACHE_STATIC).then((cache) => {
            return cache.match('/offline.html');
          });
        });
    })
  );
});

// Strategy: Network with Cache Fallback with Dynamic Caching
// Not the best solution due to timeout problem when connection is slow

// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     fetch(event.request)
//       .then((res) => {
//         return caches.open(CACHE_DYNAMIC).then((cache) => {
//           cache.put(event.request.url, res.clone());
//           return res;
//         });
//       })
//       .catch(() => caches.match(event.request))
//   );
// });
