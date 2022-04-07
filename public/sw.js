// implementation without workbox, just example, don't use it

importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const CACHE_STATIC = 'static-v4';
const CACHE_DYNAMIC = 'dynamic';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/promise.js',
  '/src/js/idb.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
];
const url = 'https://mypwa-a912b-default-rtdb.europe-west1.firebasedatabase.app/posts.json';

self.addEventListener('install', (event) => {
  console.log('[SW] installing sw...', event);

  // it won't finish the installation event before cahce is open
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      console.log('[SW] precaching app shell');
      cache.addAll(STATIC_FILES);
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

function isInArray(string, array) {
  let cachePath;
  if (string.indexOf(self.origin) === 0) {
    // request targets domain where we serve the page from (i.e. NOT a CDN)
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then((cache) => {
    return cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
      }
    });
  });
}

self.addEventListener('fetch', (event) => {
  if (new RegExp(url).test(event.request.url)) {
    event.respondWith(
      fetch(event.request).then((res) => {
        const clonedRes = res.clone();
        clearAllData('posts')
          .then(() => {
            return clonedRes.json();
          })
          .then((data) => {
            Object.values(data).forEach((posts) => {
              writeData('posts', posts);
            });
          });
        return res;
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    // Strategy: Cache only for static files
    event.respondWith(caches.match(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((res) => {
            return caches.open(CACHE_DYNAMIC).then((cache) => {
              // dynamic cache might be really big, so we can trim it
              // trimCache(CACHE_DYNAMIC, 3);
              cache.put(event.request.url, res.clone());
              return res;
            });
          })
          .catch(() => {
            return caches.open(CACHE_STATIC).then((cache) => {
              if (event.request.headers.get('accept').includes('text/html')) {
                return cache.match('/offline.html');
              }
            });
          });
      })
    );
  }
});

// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     caches.match(event.request).then((res) => {
//       if (res) {
//         return res;
//       }

//       return fetch(event.request)
//         .then((res) => {
//           return caches.open(CACHE_DYNAMIC).then((cache) => {
//             cache.put(event.request.url, res.clone());
//             return res;
//           });
//         })
//         .catch(() => {
//           return caches.open(CACHE_STATIC).then((cache) => {
//             return cache.match('/offline.html');
//           });
//         });
//     })
//   );
// });

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

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-new-post') {
    console.log('[SW] Backround Syncing New Post');
    event.waitUntil(
      readAllData('sync-posts').then((posts) => {
        posts.forEach((post) => {
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(post),
          })
            .then((res) => {
              if (res.ok) {
                clearOne('sync-posts', post.id);
              }
            })
            .catch((err) => {
              console.log('Error while sending data: ', err);
            });
        });
      })
    );
  }
});

self.addEventListener('notificationClick', (event) => {
  const notification = event.notification;
  const action = event.action;

  if (action === 'confirm') {
    console.log('Confirmed');
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll().then((devices) => {
        const device = devices.find((d) => d.visibilityState === 'visible');

        // open tab on tap on notification
        if (device) {
          device.navigate(notification.data.url);
          device.focus();
        } else {
          devices.openWindow(notification.data.url);
        }
      })
    );
  }
  notification.close();
});

self.addEventListener('notificationClose', (event) => {
  console.log('Notification was closed', event);
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'New',
    content: 'Test content',
    openUrl: '/',
  };

  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  const options = {
    body: data.content,
    data: { url: data.openUrl },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
