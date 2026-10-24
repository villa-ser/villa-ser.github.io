const CACHE_NAME = 'villaser-cache-v1';

// Aquí pones los archivos principales que quieres que carguen rápido
const urlsToCache = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './icono.avif'
];

// Instala el Service Worker y guarda en caché
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// Intercepta las peticiones de red (Requisito obligatorio para instalar PWA)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Devuelve lo que está en caché o hace la petición a internet
                return response || fetch(event.request);
            })
    );
});
