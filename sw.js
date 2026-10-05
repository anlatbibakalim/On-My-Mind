const CACHE = 'aklimda-v3';
const ASSETS = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    if (url.origin === 'https://cdnjs.cloudflare.com') {
        e.respondWith(caches.match(e.request).then(cached => {
            const fetched = fetch(e.request).then(res => {
                if (res && res.status === 200) {
                    const cl = res.clone();
                    caches.open(CACHE).then(c => c.put(e.request, cl));
                }
                return res;
            }).catch(() => cached);
            return cached || fetched;
        }));
        return;
    }
    if (e.request.mode === 'navigate') {
        e.respondWith(fetch(e.request).catch(() => caches.match('./index.html')));
        return;
    }
    e.respondWith(caches.match(e.request).then(c => c || fetch(e.request)));
});
