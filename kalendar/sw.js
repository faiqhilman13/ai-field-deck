/* Sehari Selembar service worker: works offline, refreshes in the background. */
const CACHE = 'sehari-v3';
const SHELL = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'themes/tearoff.css',
  'themes/tearoff.js',
  'themes/kuda.css',
  'themes/kuda.js',
  'themes/kopitiam.css',
  'themes/kopitiam.js',
  'themes/runcit.css',
  'themes/runcit.js',
  'themes/batik.css',
  'themes/batik.js',
  'themes/postcard.css',
  'themes/postcard.js',
  'themes/stamp.css',
  'themes/stamp.js',
  'themes/riso.css',
  'themes/riso.js',
  'themes/midnight.css',
  'themes/midnight.js',
  'data/holidays.js',
  'data/facts.js',
  'data/peribahasa.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate for the app and Google Fonts; everything else goes to the network.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const ours = url.origin === self.location.origin;
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!ours && !fonts) return;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: ours });
      const network = fetch(req)
        .then(res => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
