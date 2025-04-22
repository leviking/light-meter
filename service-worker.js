const CACHE = 'ev-pwa-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/camera.js',
  '/exif.js',
  '/styles.css',
  '/manifest.json',
  '/logo.svg',
  '/apple-touch-icon.png'
];

self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
);

self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  )
);

self.addEventListener('fetch', e =>
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)))
);

