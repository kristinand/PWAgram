/// <reference lib="WebWorker" />

import { ICard } from 'types';

// import * as idb from './lib/idb';
import {
  readAllData,
  clearOne,
  writeData,
  clearAllData,
} from './utils/indexedDBFunctions';

const mySelf = self as Window & typeof globalThis & ServiceWorkerGlobalScope;

const CACHE_STATIC = 'static';
const CACHE_DYNAMIC = 'dynamic';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/public/bundle.js',
  '/public/assets/material.min.js',
  '/public/assets/css/app.css',
  '/public/assets/css/feed.css',
  '/public/assets/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
];
const url =
  'https://mypwa-a912b-default-rtdb.europe-west1.firebasedatabase.app/posts.json';

mySelf.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] installing sw...', event);

  // it won't finish the installation event before cahce is open
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      console.log('[SW] precaching app shell');
      cache.addAll(STATIC_FILES);
    })
  );
});

mySelf.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] activating sw...', event);
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_STATIC && key !== CACHE_DYNAMIC) {
            console.log(`[SW] removing old cache ${key}`);
            return caches.delete(key);
          }
        })
      )
    )
  );
  return mySelf.clients.claim();
});

function isInArray(string: string, array: any[]) {
  let cachePath;
  if (string.indexOf(mySelf.origin) === 0) {
    // request targets domain where we serve the page from (i.e. NOT a CDN)
    cachePath = string.substring(mySelf.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

// function trimCache(cacheName: string, maxItems: number) {
//   caches.open(cacheName).then((cache) =>
//     cache.keys().then((keys) => {
//       if (keys.length > maxItems) {
//         cache.delete(keys[0]).then(() => trimCache(cacheName, maxItems));
//       }
//     })
//   );
// }

mySelf.addEventListener('fetch', (event: FetchEvent) => {
  if (new RegExp(url).test(event.request.url)) {
    event.respondWith(
      fetch(event.request).then((res) => {
        const clonedRes = res.clone();
        clearAllData('posts')
          .then(() => clonedRes.json())
          .then((data: { [key: string]: ICard }) => {
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
          .then((res) =>
            caches.open(CACHE_DYNAMIC).then((cache) => {
              // dynamic cache might be really big, so we can trim it
              // trimCache(CACHE_DYNAMIC, 3);
              cache.put(event.request.url, res.clone());
              return res;
            })
          )
          .catch(() =>
            caches.open(CACHE_STATIC).then((cache) => {
              if (event.request.headers.get('accept').includes('text/html')) {
                return cache.match('/offline.html');
              }
            })
          );
      })
    );
  }
});

//  .addEventListener('fetch', (event) => {
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

// https://developer.mozilla.org/en-US/docs/Web/API/SyncEvent
interface SyncEvent extends ExtendableEvent {
  tag: string;
  lastChance: boolean;
}

mySelf.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-new-post') {
    console.log('[SW] Backround Syncing New Post');
    event.waitUntil(
      readAllData('sync-posts').then((posts: ICard[]) => {
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
