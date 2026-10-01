/* sikodark radio — Service Worker v6 (simple y estable) */
const CACHE = 'sikodark-v6';
const ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  './apple-icon.png',
  './apple-touch-icon.png',
  './logo-notificacion.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  /* No cachear audio stream ni APIs externas */
  if (url.hostname.includes('zeno.fm')) return;
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) return;
  if (req.headers.has('range')) return;

  /* Estrategia: red primero, si falla usar caché */
  e.respondWith(
    fetch(req)
      .then(res => {
        const cp = res.clone();
        if (url.origin === location.origin && res.ok) {
          caches.open(CACHE).then(c => c.put(req, cp));
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
