const CACHE_NAME = 'sinar-pagi-v9'; // Versi diupdate ke v9 agar sinkron dengan DB kamu

// Daftar file yang WAJIB ada supaya aplikasi bisa dibuka saat offline
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/database.js',
    '/js/routes.js',
    '/lib/vue.js',
    '/lib/dexie.min.js',
    '/lib/unocss.js',
    '/lib/pico.min.css',
    '/lib/remixicon.css',
    '/manifest.json'
];

// 1. Install: Simpan semua aset ke memori HP
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Pre-caching aset aplikasi');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 2. Activate: Hapus cache versi lama agar tidak menuhi memori
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        })
    );
    self.skipWaiting();
});

// 3. Fetch: Strategi Cache-First (Buka dari HP dulu, baru cek internet)
self.addEventListener('fetch', (event) => {
    // Abaikan permintaan ke Firebase/Cloud agar tidak mengganggu sinkronisasi database
    if (event.request.url.includes('firebase') || event.request.url.includes('firestore')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Jika ada di cache, pakai itu. Jika tidak, ambil dari internet
            return cachedResponse || fetch(event.request).then((response) => {
                // Simpan aset baru secara otomatis ke cache
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            });
        }).catch(() => {
            // Jika benar-benar offline dan file tidak ada di cache
            console.warn('SW: File tidak ditemukan di cache maupun network');
        })
    );
});
