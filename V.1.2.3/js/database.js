// js/database.js //
const db = new Dexie("SinarPagiDB");

/**
 * Generator ID Unik (UID)
 * Menghasilkan ID unik seperti 'SP-kyd2l9z1-x9j2'
 * Ini memastikan HP A dan HP B tidak akan pernah membuat ID yang sama.
 */
window.generateUID = () => {
    return 'SP-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
};

/**
 * Versi 18: Migrasi ke Unique ID (String)
 * MENGHAPUS '++' pada products, transactions, dll agar Dexie tidak membuat ID angka otomatis.
 */
db.version(18).stores({
    products: 'id, name, code, category, price_modal, price_sell, qty, unit',
    categories: '++id, name', // Kategori tetap auto-increment karena resiko tabrakan rendah
    transactions: 'id, date, total, memberId, paymentMethod, amountPaid, change, status',
    members: 'id, name, phone, address, total_spending, points', 
    expenses: 'id, date, category, amount, note, paymentMethod, cashPart, qrisPart',
    digital_transactions: 'id, date, type, provider, nominal, adminFee, adminPaymentMethod, totalReceived, profit',
    settings: 'id, storeName',
    services: '++id, name, price' 
});

// --- FUNGSI SINKRONISASI KELUAR (LOCAL -> CLOUD) ---
const syncToCloud = (table, id, data) => {
    // Pastikan ID ada dan bukan auto-increment yang sedang diproses
    if (typeof fdb !== 'undefined' && id) {
        try {
            const ref = fdb.ref(table + '/' + id);
            if (data === null) {
                ref.remove();
            } else {
                const cleanData = JSON.parse(JSON.stringify(data));
                ref.set(cleanData);
            }
        } catch (e) {
            console.warn(`Cloud Sync Failed [${table}]:`, e.message);
        }
    }
};

// --- HOOKS DATABASE (SINKRONISASI OTOMATIS) ---
const setupHooks = (tableName) => {
    // Creating: Mengirim data ke cloud saat data baru dibuat di lokal
    db[tableName].hook('creating', (pk, obj) => { 
        // Untuk tabel dengan UID, ID sudah ada di dalam obj sebelum simpan
        const finalId = pk || obj.id;
        if (finalId) syncToCloud(tableName, finalId, obj);
    });
    
    // Updating: Mengirim perubahan ke cloud
    db[tableName].hook('updating', (mods, pk, obj) => { 
        // Merge perubahan ke objek asli untuk dikirim ke cloud
        const updatedObj = { ...obj, ...mods };
        syncToCloud(tableName, pk, updatedObj); 
    });
    
    // Deleting: Menghapus data di cloud saat data di lokal dihapus
    db[tableName].hook('deleting', (pk) => { 
        syncToCloud(tableName, pk, null); 
    });
};

const allTables = ['products', 'categories', 'transactions', 'members', 'expenses', 'digital_transactions', 'services'];
allTables.forEach(setupHooks);

// --- FUNGSI SINKRONISASI MASUK (CLOUD -> LOCAL) ---
const syncFromCloud = () => {
    if (typeof fdb === 'undefined') return;

    allTables.forEach(tableName => {
        const ref = fdb.ref(tableName);
        
        // Menangani data baru atau data yang ada saat startup
        ref.on('child_added', async (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Gunakan .put() agar jika ID sudah ada, data akan diupdate (bukan diduplikasi)
                await db[tableName].put(data); 
            }
        });

        // Menangani update data dari cloud
        ref.on('child_changed', async (snapshot) => {
            const data = snapshot.val();
            if (data) await db[tableName].put(data);
        });

        // Menangani penghapusan data dari cloud
        ref.on('child_removed', async (snapshot) => {
            const id = snapshot.key;
            // Cek apakah ID bersifat angka atau string
            const targetId = isNaN(id) ? id : Number(id);
            await db[tableName].delete(targetId);
        });
    });
};

// --- FUNGSI MIGRASI OTOMATIS (JALANKAN SEKALI DI HP A) ---
window.fixAllData = async () => {
    if (!confirm("Mulai migrasi ID ke sistem Anti-Tabrakan?")) return;
    
    console.log("Memulai proses migrasi...");
    const tablesToMigrate = ['products', 'transactions', 'members', 'expenses', 'digital_transactions'];
    
    for (const table of tablesToMigrate) {
        const items = await db[table].toArray();
        for (const item of items) {
            // Jika ID masih angka, ganti ke UID
            if (typeof item.id === 'number') {
                const oldId = item.id;
                const newId = window.generateUID();
                const newItem = { ...item, id: newId };
                
                await db[table].delete(oldId); // Hapus ID lama
                await db[table].add(newItem);    // Tambah dengan ID baru
                
                // Hapus jejak ID angka di Firebase
                if (typeof fdb !== 'undefined') fdb.ref(table + '/' + oldId).remove();
            }
        }
    }
    alert("Migrasi Selesai! Data Anda sekarang aman dari tabrakan antar HP.");
};

// --- HELPER LABA RUGI (TETAP SAMA) ---
window.hitungLabaRugi = async (startDate, endDate) => {
    try {
        const semuaTransaksi = await db.transactions.where('date').between(startDate, endDate, true, true).toArray();
        const digitalTrans = await db.digital_transactions.where('date').between(startDate, endDate, true, true).toArray();
        const semuaPengeluaran = await db.expenses.where('date').between(startDate, endDate, true, true).toArray();

        let stats = { totalOmzet: 0, totalModal: 0, totalLabaKotor: 0, totalPengeluaran: 0, totalLabaBersih: 0, count: semuaTransaksi.length + digitalTrans.length };

        semuaTransaksi.forEach(tr => {
            stats.totalOmzet += Number(tr.total || 0);
            if (tr.items) {
                tr.items.forEach(item => {
                    const qty = Number(item.qty || 0);
                    const modal = Number(item.price_modal || 0);
                    const jual = Number(item.price_sell || 0);
                    const extra = Number(item.extraCharge || 0);
                    stats.totalModal += (modal * qty);
                    stats.totalLabaKotor += ((jual - modal) + extra) * qty;
                });
            }
        });

        digitalTrans.forEach(dt => {
            stats.totalLabaKotor += Number(dt.profit || 0);
            stats.totalOmzet += Number(dt.adminFee || 0); 
        });

        semuaPengeluaran.forEach(ex => { stats.totalPengeluaran += Number(ex.amount || 0); });
        stats.totalLabaBersih = stats.totalLabaKotor - stats.totalPengeluaran;
        return stats;
    } catch (err) {
        console.error("Gagal hitung laba:", err);
        return { totalOmzet: 0, totalModal: 0, totalLabaBersih: 0, count: 0 };
    }
};

// --- EKSEKUSI ---
db.open().then(() => {
    console.log("Database SinarPagiDB v18 Aktif (Sistem Anti-Tabrakan Aktif)");
    syncFromCloud(); 
}).catch(err => {
    console.error("Koneksi Database Gagal:", err);
});
