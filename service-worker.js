const CACHE_NAME = 'cuponera-cache-v1';
const OFFLINE_URL = './offline.html';
const STATIC_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './styles.css',
  './app.js',
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
  // Solo manejar peticiones GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // ❌ Evitar cachear recursos de extensiones, archivos locales, etc.
  if (!url.protocol.startsWith('http')) return;

  // ✅ Manejar peticiones personalizadas de cupones
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

  // ✅ Cache-first strategy con validación de respuesta
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Solo cachear si la respuesta es válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    }).catch(() => caches.match(OFFLINE_URL))
  );
});

// 🎟️ Guardar cupones "localmente" en una caché especial
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
