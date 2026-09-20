const CACHE = 'madi-studio-v1';
const CORE = [
  './',
  './index.html',
  './css/reimagined.css',
  './js/reimagined.js',
  './manifest.json',
  './assets/images/madi_favicon.png',
  './assets/icons/android/android-launchericon-192-192.png',
  './assets/icons/android/android-launchericon-512-512.png',
  './assets/audio/click.mp3',
  './assets/audio/start.mp3',
  './assets/audio/final_question.mp3',
  './assets/audio/cute-music.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then((cached) => {
      const networked = fetch(request).then((response) => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || networked;
    })
  );
});
