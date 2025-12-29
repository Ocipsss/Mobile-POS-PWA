/* js/database.js */
// v.1.2.0 - Struktur Database Sinar Pagi (Relasi memberId) //

const db = new Dexie("SinarPagiDB");

db.version(6).stores({
    // Produk: ++id (auto increment)
    products: '++id, name, code, category, price_modal, price_sell, qty, unit',
    
    // Kategori: Untuk pengelompokan produk
    categories: '++id, name',
    
    // Transaksi: Mencatat history penjualan
    // Menggunakan memberId sebagai relasi ke tabel members
    transactions: '++id, date, total, items, memberId',
    
    // Members: Data pelanggan tetap
    members: '++id, name, phone, address',
    
    // Settings: Konfigurasi toko
    settings: 'id, storeName'
});

// Membuka database dan memberikan laporan di console
db.open().then(() => {
    console.log("Database Sinar Pagi Berhasil Diinisialisasi (v6)");
}).catch((err) => {
    console.error("Gagal menginisialisasi database:", err);
});

/* CATATAN: 
   Jika data member tidak muncul setelah replace, buka Eruda Console dan ketik:
   db.delete().then(() => location.reload()) 
   (Hanya lakukan ini jika Anda bersedia menghapus data lama untuk reset struktur)
*/