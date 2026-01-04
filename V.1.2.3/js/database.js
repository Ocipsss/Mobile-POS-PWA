// js/database.js //
const db = new Dexie("SinarPagiDB");

// Versi 13: Update skema expenses untuk mendukung rincian cashPart & qrisPart
db.version(13).stores({
    products: '++id, name, code, category, price_modal, price_sell, qty, unit',
    categories: '++id, name',
    transactions: '++id, date, total, memberId, paymentMethod, amountPaid, change, status',
    members: 'id, name, phone, address, total_spending, points', 
    expenses: '++id, date, category, amount, note, paymentMethod, cashPart, qrisPart',
    settings: 'id, storeName'
});

// --- FUNGSI SINKRONISASI KELUAR (LOCAL -> CLOUD) ---
const syncToCloud = (table, id, data) => {
    if (typeof fdb !== 'undefined' && id !== undefined && id !== null) {
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

// --- FUNGSI PAKSA UNGGAH (DORONG DATA LAMA KE CLOUD) ---
window.forceUploadAll = async () => {
    if (!confirm("Apakah Anda yakin ingin mengunggah SEMUA data lokal ke Firebase? Data yang sudah ada di Cloud akan diperbarui.")) return;
    
    const tables = ['products', 'categories', 'transactions', 'members', 'expenses'];
    console.log("Memulai sinkronisasi massal...");
    
    try {
        for (const table of tables) {
            const items = await db[table].toArray();
            console.log(`Mengunggah ${items.length} data dari tabel ${table}...`);
            for (const item of items) {
                await syncToCloud(table, item.id, item);
            }
        }
        alert("Sinkronisasi Selesai! Semua data sekarang ada di Firebase.");
    } catch (err) {
        alert("Terjadi kesalahan saat upload: " + err.message);
    }
};

// --- HOOKS DATABASE (SINKRONISASI OTOMATIS) ---
const setupHooks = (tableName) => {
    db[tableName].hook('creating', (pk, obj) => { syncToCloud(tableName, pk || obj.id, obj); });
    db[tableName].hook('updating', (mods, pk, obj) => { syncToCloud(tableName, pk, obj); });
    db[tableName].hook('deleting', (pk) => { syncToCloud(tableName, pk, null); });
};

// Daftarkan semua tabel ke hooks
['products', 'categories', 'transactions', 'members', 'expenses'].forEach(setupHooks);

// --- FUNGSI SINKRONISASI MASUK (CLOUD -> LOCAL) ---
const syncFromCloud = () => {
    if (typeof fdb === 'undefined') return;

    const tables = ['products', 'categories', 'transactions', 'members', 'expenses'];
    tables.forEach(tableName => {
        const ref = fdb.ref(tableName);
        
        ref.on('child_added', async (snapshot) => {
            const data = snapshot.val();
            if (data) await db[tableName].put(data); 
        });

        ref.on('child_changed', async (snapshot) => {
            const data = snapshot.val();
            if (data) await db[tableName].put(data);
        });

        ref.on('child_removed', async (snapshot) => {
            const id = snapshot.key;
            const targetId = isNaN(id) ? id : Number(id);
            await db[tableName].delete(targetId);
        });
    });
};

// --- HELPER LABA RUGI ---
window.hitungLabaRugi = async (startDate, endDate) => {
    try {
        const semuaTransaksi = await db.transactions
            .where('date').between(startDate, endDate, true, true)
            .toArray();

        let stats = { totalOmzet: 0, totalModal: 0, totalLabaBersih: 0, count: semuaTransaksi.length };

        semuaTransaksi.forEach(tr => {
            stats.totalOmzet += Number(tr.total || 0);
            if (tr.items && Array.isArray(tr.items)) {
                tr.items.forEach(item => {
                    const qty = Number(item.qty || 0);
                    const modal = Number(item.price_modal || 0);
                    stats.totalModal += (modal * qty);
                    if (typeof item.profit !== 'undefined') {
                        stats.totalLabaBersih += Number(item.profit);
                    } else {
                        stats.totalLabaBersih += (Number(item.price_sell) - modal) * qty;
                    }
                });
            }
        });
        return stats;
    } catch (err) {
        console.error("Gagal hitung laba:", err);
        return { totalOmzet: 0, totalModal: 0, totalLabaBersih: 0, count: 0 };
    }
};

// --- EKSEKUSI ---
db.open().then(() => {
    console.log("Database SinarPagiDB v13 Aktif (Ready for Global Sync)");
    syncFromCloud(); 
}).catch(err => {
    console.error("Koneksi Database Gagal:", err);
});
