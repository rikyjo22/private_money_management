// Service Worker Minimalis untuk aktivasi PWA
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Biarkan aplikasi mengambil data online secara normal ke Google Apps Script
  e.respondWith(fetch(e.request));
});