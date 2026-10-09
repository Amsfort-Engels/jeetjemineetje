// Offline support: the app shell and word list are cached on first visit.
// Word list: network first (so Els's updates arrive), cache as fallback.
// Everything else: cache first. Bump VERSION on every release.

const PREFIX = 'jeetjemineetje-';
const VERSION = `${PREFIX}v7`;
const SHELL = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest', 'icon.svg',
  'js/app.js', 'js/data.js', 'js/leitner.js', 'js/answer.js', 'js/vragen.js', 'js/uitroepen.js', 'js/speech.js',
  'data/woorden.csv',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

// Cache storage is shared by every site on amsfort-engels.github.io,
// so only clean up our own old versions (and the pre-v3 names 'jm-v1', 'jm-v2').
const isOurs = k => k.startsWith(PREFIX) || /^jm-v\d+$/.test(k);

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => isOurs(k) && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname.includes('/data/')) {
    // Only a good response replaces the cached word list. A 404 or 503 must
    // never overwrite the copy that lets students practise offline.
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const res = await fetch(e.request);
        if (res.ok) {
          e.waitUntil(cache.put(e.request, res.clone()));
          return res;
        }
        return (await cache.match(e.request)) || res;
      } catch {
        return cache.match(e.request);
      }
    })());
    return;
  }

  e.respondWith(caches.open(VERSION).then(c => c.match(e.request)).then(hit => hit || fetch(e.request)));
});
