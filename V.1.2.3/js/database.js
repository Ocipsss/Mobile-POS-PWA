/* js/database.js */
// v.1.3.0 - Update Schema: Metode Pembayaran & Status Tempo //

const db = new Dexie("SinarPagiDB");

// Gunakan .version(7) jika sebelumnya adalah v6
db.version(7).stores({
    // Produk: Data master barang
    products: '++id, name, code, category, price_modal, price_sell, qty, unit',
    
    // Kategori: Untuk pengelompokan produk
    categories: '++id, name',
    
    // Transaksi: Mencatat riwayat penjualan dengan detail pembayaran
    // Tambahan: paymentMethod, amountPaid, change, status
    transactions: '++id, date, total, items, memberId, paymentMethod, amountPaid, change, status',
    
    // Members: Data pelanggan
    members: '++id, name, phone, address',
    
    // Settings: Konfigurasi toko
    settings: 'id, storeName'
});

// Membuka database
db.open().then(() => {
    console.log("Database Sinar Pagi Berhasil Diinisialisasi (v7)");
}).catch((err) => {
    console.error("Gagal menginisialisasi database:", err);
});
