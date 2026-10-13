/* Aklımda - Service Worker (v3.5.1)
   - Yerel dosyalar: ÖNCE AĞ (her zaman en yeni sürüm), internet yoksa önbellek
   - Yeni sürüm hemen devreye girer (skipWaiting + clients.claim), eski önbellekler silinir
   - Font Awesome (cdnjs): önbellek öncelikli
   - Hava/haber/yapay zekâ gibi dış istekler hiç yakalanmaz */
const VERSION = 'v3.5.1';
const CACHE = 'aklimda-' + VERSION;
const SHELL = [
    './', './index.html', './style.css', './app.js', './calculator.js', './kb.js', './kb.json', './manifest.json',
    './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon.svg', './favicon-32.png'
];
const CDN = 'https://cdnjs.cloudflare.com';

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        // Tek bir dosya eksik olsa bile kurulum başarısız olmasın; HTTP önbelleğini atla
        await Promise.all(SHELL.map(url => cache.add(new Request(url, { cache: 'reload' })).catch(() => null)));
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
                return Response.error();
            }
        })());
        return;
    }

    // Başka kaynaklar (API'ler): dokunma
    if (url.origin !== self.location.origin) return;

    // Yerel dosyalar: önce ağ (sürüm uyuşmazlığı olmaz), olmazsa önbellek
    event.respondWith((async () => {
        try {
            const res = await fetch(new Request(req.url, { cache: 'no-cache' }));
            if (res && res.ok) {
                // Hem sürüm parametreli (?v=...) hem de yalın adresle sakla; çevrimdışıyken ikisi de en yenisi olur
                const plain = req.url.split('?')[0];
                const a = res.clone(), b = res.clone();
                caches.open(CACHE).then(c => { c.put(req, a); if (plain !== req.url) c.put(plain, b); });
            }
            return res;
        } catch (e) {
            const cached = await caches.match(req, { ignoreSearch: true });
            if (cached) return cached;
            if (req.mode === 'navigate') {
                const page = (await caches.match('./index.html')) || (await caches.match('./'));
                if (page) return page;
            }
            return Response.error();
        }
    })());
});
