const CACHE_NAME = 'villaser-cache-v1';

// Aquí pones los archivos principales que quieres que carguen rápido
const urlsToCache = [
    './',
    './index.html',
    './script.js',      // ¡Corregido de app.js a script.js!
    './style.css',      // Recomendado para que mantenga el diseño offline
    './manifest.json',
    './icono.avif',
    './icono2.avif'     // Agregado porque lo pusiste en el manifest
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
