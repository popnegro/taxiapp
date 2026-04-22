const CACHE_NAME = 'taxigo-cache-v1';
const PRE_CACHE_RESOURCES = [
  '/',
  '/index.html',
  '/app/booking.html',
  '/app/bot.html',
  '/app/bubble.html',
  '/dashboard.html',
  '/assets/main.js',
  '/assets/main.css',
  '/manifest.json'
];

// Evento de instalación: cachear recursos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRE_CACHE_RESOURCES))
  );
});

// Evento de activación: limpieza de versiones antiguas de cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
});

// Estrategia de Cache: Cache First, fallback to Network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => cachedResponse || fetch(event.request))
  );
});