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

workboxSW.precache([]);


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
