const CACHE_NAME = 'villaser-cache-v21';

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
    // REGLA DE ORO: Ignorar las conexiones a Firebase y peticiones que no sean GET
    if (event.request.url.includes('firestore.googleapis.com') || 
        event.request.url.includes('firebase') || 
        event.request.method !== 'GET') {
        return; // Deja que el navegador hable con la nube libremente sin interceptarlo
    }

    // Para todo lo demás (Tus archivos HTML, CSS, JS e imágenes), usar caché local
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
