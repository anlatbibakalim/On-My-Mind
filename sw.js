/* AKLIMDA Service Worker v2.0 - Çevrimdışı stratejiler */
const CACHE = 'aklimda-v2';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

/* Kurulum: uygulama kabuğunu önbelleğe al */
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

/* Aktifleşme: eski sürüm önbellekleri temizle */
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);

    // CDN kaynakları: stale-while-revalidate
    if (url.origin === 'https://cdnjs.cloudflare.com') {
        event.respondWith(
            caches.match(event.request).then(cached => {
                const fetched = fetch(event.request).then(res => {
                    if (res && res.status === 200) {
                        const clone = res.clone();
                        caches.open(CACHE).then(c => c.put(event.request, clone));
                    }
                    return res;
                }).catch(() => cached);
                return cached || fetched;
            })
        );
        return;
    }

    // Sayfa gezinmeleri: network-first, çevrimdışıysa cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Statik dosyalar: cache-first
    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
            if (res && res.status === 200 && res.type === 'basic') {
                const clone = res.clone();
                caches.open(CACHE).then(c => c.put(event.request, clone));
            }
            return res;
        }))
    );
});
