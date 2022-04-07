importScripts('workbox-sw.prod.v2.1.3.js');
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'google-fonts',
    cacheExpirations: {
      maxEntries: 3,
      maxAgeSeconds: 60 * 60 * 24 * 30,
    },
  })
);

workboxSW.router.registerRoute(
  /.*(?:firebasestorage\.googleapis)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'post-images',
    cacheExpirations: {
      maxEntries: 10,
    },
  })
);

workboxSW.router.registerRoute(
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'material-css',
  })
);

const url =
  'https://mypwa-a912b-default-rtdb.europe-west1.firebasedatabase.app/posts.json';

workboxSW.router.registerRoute(url, ({ event }) => {
  return fetch(event.request).then((res) => {
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
  });
});

const getOfflintRoute = (routeData) =>
  routeData.event.request.headers.get('accept').includes('text/html');

workboxSW.router.registerRoute(getOfflintRoute, ({ event }) => {
  return caches.match(event.request).then((response) => {
    if (response) {
      return response;
    }

    return fetch(event.request)
      .then((res) =>
        caches.open('dynamic').then((cache) => {
          cache.put(event.request.url, res.clone());
          return res;
        })
      )
      .catch(() => caches.match('/offline.html').then((res) => res));
  });
});

workboxSW.precache([
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "3f7602150ba44562e2f04ff26833eb4f"
  },
  {
    "url": "manifest.json",
    "revision": "2f4c8dc865513b0dae904ee62d7401ca"
  },
  {
    "url": "offline.html",
    "revision": "9362d1099086f45fddbd4108f7d95227"
  },
  {
    "url": "service-worker.js",
    "revision": "f70b65696cc3aea781ff28b55a7ae4c4"
  },
  {
    "url": "src/css/app.css",
    "revision": "a5e824c131b444b152772109bd336652"
  },
  {
    "url": "src/css/feed.css",
    "revision": "e15d0413ce60dbea0fabcfc7775a5e4b"
  },
  {
    "url": "src/css/help.css",
    "revision": "81922f16d60bd845fd801a889e6acbd7"
  },
  {
    "url": "src/js/app.js",
    "revision": "bc8ac460b6e1bb65531f00832d7aac1d"
  },
  {
    "url": "src/js/feed.js",
    "revision": "7df54bbfcffdcfd52f3f958f86ffe5ce"
  },
  {
    "url": "src/js/fetch.js",
    "revision": "a368dece9f9a713eea5f20964679bf1e"
  },
  {
    "url": "src/js/idb.js",
    "revision": "edfbee0bb03a5947b5a680c980ecdc9f"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "e68511951f1285c5cbf4aa510e8a2faf"
  },
  {
    "url": "src/js/promise.js",
    "revision": "b824449b966ea6229ca6d31b53abfcc1"
  },
  {
    "url": "src/js/utility.js",
    "revision": "53fcea4b87899cd0e9a16bc4afd8a561"
  },
  {
    "url": "sw-base.js",
    "revision": "fc3243c797ae4aeae6906dd1d417d4cc"
  },
  {
    "url": "sw.js",
    "revision": "66bc1959f16ce5c7887f20c785d7294b"
  },
  {
    "url": "workbox-sw.prod.v2.1.3.js",
    "revision": "a9890beda9e5f17e4c68f42324217941"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);


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
