// ============================================================
// Service Worker — Djibouti My Love Quiz v47
// Stratégie : Cache-First → hors-ligne total après 1ère visite
// ============================================================

const CACHE = 'dml-v47';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32x32.png'
];

// ── INSTALL : précache les assets critiques ──────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE : purge les vieux caches ───────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH : Cache-First avec fallback réseau ─────────────────
self.addEventListener('fetch', e => {
  // Ignorer les requêtes non-GET et les fonts Google (CDN externe)
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request)
        .then(response => {
          // Mettre en cache uniquement les réponses valides same-origin
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Hors-ligne : renvoyer index.html pour la navigation
          if (e.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
