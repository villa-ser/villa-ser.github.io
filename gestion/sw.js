const CACHE_NAME = 'villaser-cache-v2';

const urlsToCache = [
    './',
    './index.html',
    './script.js',
    './style.css',
    './manifest.json',
    './icono.avif',
    './icono2.avif'
];

self.addEventListener('install', event => {
    // Fuerzo la activación inmediata del SW para que el banner esté disponible rápido
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // Mapeo individual para evitar que un archivo faltante (ej. una imagen) bloquee la instalación completa del PWA
            return Promise.allSettled(
                urlsToCache.map(url => {
                    return cache.add(url).catch(error => {
                        console.log('Recurso omitido o no encontrado para caché:', url);
                    });
                })
            );
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Tomar control sobre las peticiones de inmediato
    return self.clients.claim(); 
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
