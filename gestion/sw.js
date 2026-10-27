const CACHE_NAME = 'villaser-cache-v10';

const urlsToCache = [
    './',
    './index.html',
    './script.js',
    './style.css',
    './manifest.json',
    './icono192.png',
    './icono512.png'
];

self.addEventListener('install', event => {
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
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
