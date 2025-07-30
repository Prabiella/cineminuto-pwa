const CACHE_NAME = 'cuponera-cache-v1';
const OFFLINE_URL = '/offline.html';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/styles.css',
  '/app.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  if (event.request.url.includes('/cupones/')) {
    event.respondWith(
      caches.open('cupones-guardados').then(cache =>
        cache.match(event.request).then(match =>
          match || new Response(JSON.stringify({ error: 'No encontrado' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 404
          })
        )
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(response =>
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        })
      )
    ).catch(() => caches.match(OFFLINE_URL))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SAVE_COUPON') {
    saveCoupon(event.data.payload);
  }
});

async function saveCoupon(data) {
  const cache = await caches.open('cupones-guardados');
  const fakeResponse = new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
  await cache.put(`/cupones/${data.id}`, fakeResponse);
}