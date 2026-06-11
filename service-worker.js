const CACHE_NAME = 'redlos-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './features/shared/styles/nav.css',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/menu-log.svg',
  './icons/menu-battles.svg',
  './icons/menu-events.svg',
  './icons/menu-clans.svg',
  './icons/menu-friends.svg',
  './icons/menu-wrapped.svg',
  './icons/menu-profile.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  let requestUrl;
  try {
    requestUrl = new URL(event.request.url);
  } catch (e) {
    return;
  }

  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isHtmlRequest = event.request.mode === 'navigate' || event.request.destination === 'document' || requestUrl.pathname.endsWith('.html');
  // Our own JS/CSS must always reflect the latest deploy, so it can never be served cache-first.
  const isSameOriginCode = isSameOrigin && (
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    requestUrl.pathname.endsWith('.js') ||
    requestUrl.pathname.endsWith('.css')
  );

  // Network-first for HTML and our own code: fetch fresh, fall back to cache only when offline.
  if (isHtmlRequest || isSameOriginCode) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for everything else (icons, fonts, versioned CDN libraries).
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached ||
      fetch(event.request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          // Only cache http/https requests (avoid chrome-extension:// and other schemes)
          if (requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:') {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          }
        }
        return response;
      })
    )
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html');
      }
      return null;
    })
  );
});
