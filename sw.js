const CACHE_NAME = 'duit-static-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './login.html',
  './manifest.json',
  './css/style.css',
  './css/login.css',
  './js/auth.js',
  './js/auth-guard.js',
  './js/settings.js',
  './js/i18n.js',
  './js/login.js',
  './js/script.js',
  './js/finance-page.js',
  './js/pwa.js',
  './icon/Duit.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html'))));
});
