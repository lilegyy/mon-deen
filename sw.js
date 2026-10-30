const VERSION = 'mon-deen-v4';
const BASE = new URL('./', self.location.href).href;
const ASSETS = [
  './', 'index.html', 'style.css', 'app.js', 'content.js', 'names.js', 'arabic.js', 'curriculum.js', 'dalail.js', 'modules.css', 'manifest.json',
  'assets/icon.svg', 'assets/icon-192.png', 'assets/icon-512.png', 'assets/apple-touch-icon.png',
  'assets/fonts/fonts.css', 'assets/fonts/dm-0.woff2', 'assets/fonts/dm-1.woff2',
  'assets/fonts/dm-2.woff2', 'assets/fonts/dm-3.woff2', 'assets/fonts/NotoNaskhArabic.ttf'
].map(path => new URL(path, BASE).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('mon-deen-') && key !== VERSION).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(new URL('index.html', BASE).href)));
    return;
  }
  if (ASSETS.includes(request.url)) event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
});
