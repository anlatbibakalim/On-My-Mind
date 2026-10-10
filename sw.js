/* Aklımda - Service Worker
   - Uygulama kabuğu önceden önbelleğe alınır (çevrimdışı açılış)
   - Sayfa: önce ağ, olmazsa önbellek
   - Yerel dosyalar: önbellekten sun, arka planda güncelle
   - Font Awesome (cdnjs): önbellek öncelikli
   - Hava/haber/AI istekleri hiç yakalanmaz (her zaman ağ) */
const VERSION = 'v3.2.0';
const CACHE = 'aklimda-' + VERSION;
const SHELL = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './calculator.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './icon-maskable-512.png',
    './apple-touch-icon.png',
    './favicon.svg',
    './favicon-32.png'
];
const CDN = 'https://cdnjs.cloudflare.com';

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        // Tek bir dosya eksik olsa bile kurulum başarısız olmasın
        await Promise.all(SHELL.map(url => cache.add(url).catch(() => null)));
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k.startsWith('aklimda-') && k !== CACHE).map(k => caches.delete(k)));
        await self.clients.claim();
    })());
});

self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // Font Awesome: önbellek öncelikli
    if (url.origin === CDN) {
        event.respondWith((async () => {
            const cached = await caches.match(req);
            if (cached) return cached;
            try {
                const res = await fetch(req);
                if (res && (res.ok || res.type === 'opaque')) {
                    const copy = res.clone();
                    caches.open(CACHE).then(c => c.put(req, copy));
                }
                return res;
            } catch (e) {
                return cached || Response.error();
            }
        })());
        return;
    }

    // Başka kaynaklar (API'ler): dokunma
    if (url.origin !== self.location.origin) return;

    // Sayfa gezintisi: önce ağ, sonra önbellek
    if (req.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const res = await fetch(req);
                const copy = res.clone();
                caches.open(CACHE).then(c => c.put('./index.html', copy));
                return res;
            } catch (e) {
                return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
            }
        })());
        return;
    }

    // Yerel dosyalar: önbellekten sun, arkadan yenile
    event.respondWith((async () => {
        const cached = await caches.match(req);
        const network = fetch(req).then(res => {
            if (res && res.ok) {
                const copy = res.clone();
                caches.open(CACHE).then(c => c.put(req, copy));
            }
            return res;
        }).catch(() => null);
        return cached || (await network) || Response.error();
    })());
});
