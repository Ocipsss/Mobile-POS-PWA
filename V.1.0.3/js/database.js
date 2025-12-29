// js/database.js
const db = new Dexie("SinarPagiDB");

// Definisikan struktur database yang disesuaikan dengan form kita
db.version(2).stores({
    // Tambahkan field code, price_modal, price_sell, dan qty agar tersimpan
    products: '++id, name, code, category, price_modal, price_sell, qty, unit',
    
    // Tambahkan tabel categories agar Halaman Kategori bisa menyimpan data
    categories: '++id, name',
    
    transactions: '++id, date, total, items',
    settings: 'id, storeName'
}).upgrade(tx => {
    // Fungsi upgrade otomatis jika Anda menaikkan versi (dari 1 ke 2)
});

console.log("Database Sinar Pagi Berhasil Diinisialisasi");
