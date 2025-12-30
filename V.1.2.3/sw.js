importScripts('lib/workbox-sw.js');

if (workbox) {
  console.log(`Workbox berhasil dimuat 🎉`);

  // 1. Tambahkan Pre-caching untuk file inti agar bisa dibuka Offline
  // Ini syarat penting agar tombol "Install" muncul di browser
  workbox.precaching.precacheAndRoute([
    { url: '/index.html', revision: '1.0.0' },
    { url: '/js/app.js', revision: '1.0.0' },
    // Masukkan file CSS utama kamu di sini jika ada
  ]);

  // 2. Cache Assets (Script, Style, Fonts)
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'script' || 
                   request.destination === 'style' || 
                   request.destination === 'font',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'assets-cache',
    })
  );

  // 3. Cache Gambar
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'image-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // Simpan 30 hari
        }),
      ],
    })
  );
} else {
  console.log(`Workbox gagal dimuat ❌`);
}
