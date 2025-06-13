// Service Worker for Image Caching and Performance
const CACHE_NAME = 'londonise-images-v1';
const IMAGE_CACHE_NAME = 'londonise-images-cache';

// Cache strategy: Cache first for images, network first for HTML/CSS/JS
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // Handle image requests
    if (request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(url.pathname)) {
        event.respondWith(
            caches.open(IMAGE_CACHE_NAME).then(cache => {
                return cache.match(request).then(response => {
                    if (response) {
                        // Return cached image
                        return response;
                    }

                    // Fetch and cache new image
                    return fetch(request).then(fetchResponse => {
                        // Only cache successful responses
                        if (fetchResponse.status === 200) {
                            cache.put(request, fetchResponse.clone());
                        }
                        return fetchResponse;
                    }).catch(() => {
                        // Return a placeholder or fail gracefully
                        console.warn('Failed to fetch image:', request.url);
                    });
                });
            })
        );
    }
    // Handle other requests (HTML, CSS, JS) with network first strategy
    else {
        event.respondWith(
            fetch(request).then(response => {
                // Cache successful responses
                if (response.status === 200 && (
                    request.destination === 'document' ||
                    request.destination === 'style' ||
                    request.destination === 'script'
                )) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            }).catch(() => {
                // Fallback to cache for offline support
                return caches.match(request);
            })
        );
    }
});

// Handle background sync for failed image loads
self.addEventListener('sync', event => {
    if (event.tag === 'retry-failed-images') {
        event.waitUntil(retryFailedImages());
    }
});

function retryFailedImages() {
    // This would be implemented to retry loading failed images
    // when the network connection is restored
    console.log('Retrying failed image loads...');
    return Promise.resolve();
}

// Clean up old cached images to prevent storage bloat
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_CLEANUP') {
        event.waitUntil(
            caches.open(IMAGE_CACHE_NAME).then(cache => {
                return cache.keys().then(requests => {
                    // Keep only the 50 most recent images
                    if (requests.length > 50) {
                        const oldRequests = requests.slice(0, requests.length - 50);
                        return Promise.all(
                            oldRequests.map(request => cache.delete(request))
                        );
                    }
                });
            })
        );
    }
});
