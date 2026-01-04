// V.04-01-26
/*
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
*/
// end v.04-01-26 //

// v.04-01-26 new //
const CACHE_NAME = 'sinar-pagi-v10'; // Naikkan versi ke v10

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

// Install: Langsung aktifkan SW baru
self.addEventListener('install', (event) => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

// Activate: Bersihkan cache lama
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Strategi Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('firebase') || event.request.url.includes('firestore')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Update cache di latar belakang
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => null);

            // Kembalikan cache jika ada (Instant), jika tidak tunggu network
            return cachedResponse || fetchPromise;
        })
    );
});

// end v.04-01-26 new //