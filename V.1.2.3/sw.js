const CACHE_NAME = 'sinar-pagi-v1';

// Instalasi: Lewati masa tunggu agar SW langsung aktif
self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log('SW: Service Worker Installed');
});

// Aktivasi: Bersihkan cache lama jika ada
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
    console.log('SW: Service Worker Activated');
});

// Fetch: Strategi Network-First agar data cloud selalu update
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
