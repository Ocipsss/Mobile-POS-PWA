importScripts('lib/workbox-sw.js');

if (workbox) {
  console.log(`Workbox berhasil dimuat 🎉`);

  // Cache halaman utama dan library inti
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'script' || 
                   request.destination === 'style' || 
                   request.destination === 'font',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'assets-cache',
    })
  );

  // Cache gambar di folder assets
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'image-cache',
    })
  );
} else {
  console.log(`Workbox gagal dimuat ❌`);
}
