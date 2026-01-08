// js/database.js //
const db = new Dexie("SinarPagiDB");

/**
 * Versi 17: Menambahkan tabel 'services' untuk manajemen jasa seduh/masak.
 * Menaikkan versi untuk menghindari UpgradeError pada IndexedDB.
 */
db.version(17).stores({
    products: '++id, name, code, category, price_modal, price_sell, qty, unit',
    categories: '++id, name',
    transactions: '++id, date, total, memberId, paymentMethod, amountPaid, change, status',
    members: 'id, name, phone, address, total_spending, points', 
    expenses: '++id, date, category, amount, note, paymentMethod, cashPart, qrisPart',
    digital_transactions: '++id, date, type, provider, nominal, adminFee, adminPaymentMethod, totalReceived, profit',
    settings: 'id, storeName',
    services: '++id, name, price' // Tabel Baru untuk Jasa Seduh
});

// --- FUNGSI SINKRONISASI KELUAR (LOCAL -> CLOUD) ---
const syncToCloud = (table, id, data) => {
    if (typeof fdb !== 'undefined' && id !== undefined && id !== null) {
        try {
            const ref = fdb.ref(table + '/' + id);
            if (data === null) {
                ref.remove();
            } else {
                // Pastikan data bersih dari reaktivitas Vue
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
    if (!confirm("Apakah Anda yakin ingin mengunggah SEMUA data lokal ke Firebase? Data di Cloud akan diperbarui.")) return;
    
    // Menambahkan 'services' ke daftar tabel yang diunggah
    const tables = ['products', 'categories', 'transactions', 'members', 'expenses', 'digital_transactions', 'services'];
    console.log("Memulai sinkronisasi massal...");
    
    try {
        for (const table of tables) {
            const items = await db[table].toArray();
            console.log(`Mengunggah ${items.length} data dari tabel ${table}...`);
            for (const item of items) {
                const pk = item.id || item.code; 
                await syncToCloud(table, pk, item);
            }
        }
        alert("Sinkronisasi Selesai!");
    } catch (err) {
        alert("Terjadi kesalahan saat upload: " + err.message);
    }
};

// --- HOOKS DATABASE (SINKRONISASI OTOMATIS) ---
const setupHooks = (tableName) => {
    db[tableName].hook('creating', (pk, obj) => { 
        setTimeout(() => {
            const finalId = pk || obj.id;
            if (finalId) syncToCloud(tableName, finalId, obj);
        }, 100);
    });
    db[tableName].hook('updating', (mods, pk, obj) => { syncToCloud(tableName, pk, obj); });
    db[tableName].hook('deleting', (pk) => { syncToCloud(tableName, pk, null); });
};

// Daftarkan semua tabel ke hooks (Termasuk services)
const allTables = ['products', 'categories', 'transactions', 'members', 'expenses', 'digital_transactions', 'services'];
allTables.forEach(setupHooks);

// --- FUNGSI SINKRONISASI MASUK (CLOUD -> LOCAL) ---
const syncFromCloud = () => {
    if (typeof fdb === 'undefined') return;

    allTables.forEach(tableName => {
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

        const digitalTrans = await db.digital_transactions
            .where('date').between(startDate, endDate, true, true)
            .toArray();

        const semuaPengeluaran = await db.expenses
            .where('date').between(startDate, endDate, true, true)
            .toArray();

        let stats = { 
            totalOmzet: 0, 
            totalModal: 0, 
            totalLabaKotor: 0,
            totalPengeluaran: 0,
            totalLabaBersih: 0, 
            count: semuaTransaksi.length + digitalTrans.length 
        };

        semuaTransaksi.forEach(tr => {
            stats.totalOmzet += Number(tr.total || 0);
            if (tr.items) {
                tr.items.forEach(item => {
                    const qty = Number(item.qty || 0);
                    const modal = Number(item.price_modal || 0);
                    const jual = Number(item.price_sell || 0);
                    
                    // Logika Jasa: extraCharge dianggap 100% laba kotor 
                    // karena tidak mengurangi stok fisik produk
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

        semuaPengeluaran.forEach(ex => {
            stats.totalPengeluaran += Number(ex.amount || 0);
        });

        stats.totalLabaBersih = stats.totalLabaKotor - stats.totalPengeluaran;

        return stats;
    } catch (err) {
        console.error("Gagal hitung laba:", err);
        return { totalOmzet: 0, totalModal: 0, totalLabaBersih: 0, count: 0 };
    }
};

// --- EKSEKUSI ---
db.open().then(() => {
    console.log("Database SinarPagiDB v17 Aktif (Service Table & Cloud Sync Integrated)");
    syncFromCloud(); 
}).catch(err => {
    console.error("Koneksi Database Gagal:", err);
    // Jika Error struktur (UpgradeError), reload bisa membantu atau hapus database jika dev
});
