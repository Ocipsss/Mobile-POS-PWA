// js/database.js //
const db = new Dexie("SinarPagiDB");

// Versi 9 - Struktur lengkap dengan index loyalty
db.version(9).stores({
    products: '++id, name, code, category, price_modal, price_sell, qty, unit',
    categories: '++id, name',
    transactions: '++id, date, total, memberId, paymentMethod, amountPaid, change, status',
    members: '++id, name, phone, address, total_spending, points', 
    settings: 'id, storeName'
});

// --- FUNGSI SINKRONISASI KELUAR (LOCAL -> CLOUD) ---
const syncToCloud = (table, id, data) => {
    if (typeof fdb !== 'undefined' && id !== undefined) {
        try {
            const ref = fdb.ref(table + '/' + id);
            if (data === null) {
                ref.remove();
            } else {
                // Membersihkan prototype Dexie agar tidak error di Firebase
                ref.set(JSON.parse(JSON.stringify(data)));
            }
        } catch (e) {
            console.warn("Cloud Sync Failed:", e.message);
        }
    }
};

// --- HOOKS DATABASE (SINKRONISASI OTOMATIS SAAT ADA PERUBAHAN) ---

// Products
db.products.hook('creating', (pk, obj) => { syncToCloud('products', pk || obj.id, obj); });
db.products.hook('updating', (mods, pk, obj) => { syncToCloud('products', pk, obj); });
db.products.hook('deleting', (pk) => { syncToCloud('products', pk, null); });

// Members
db.members.hook('creating', (pk, obj) => { syncToCloud('members', pk || obj.id, obj); });
db.members.hook('updating', (mods, pk, obj) => { syncToCloud('members', pk, obj); });
db.members.hook('deleting', (pk) => { syncToCloud('members', pk, null); });

// Categories
db.categories.hook('creating', (pk, obj) => { syncToCloud('categories', pk || obj.id, obj); });
db.categories.hook('updating', (mods, pk, obj) => { syncToCloud('categories', pk, obj); });
db.categories.hook('deleting', (pk) => { syncToCloud('categories', pk, null); });

// Transactions (Khusus Update menggunakan Timeout agar data final tersimpan dulu)
db.transactions.hook('creating', (pk, obj) => { syncToCloud('transactions', pk || obj.id, obj); });
db.transactions.hook('updating', (mods, pk, obj) => {
    setTimeout(() => {
        db.transactions.get(pk).then(updated => {
            if (updated) syncToCloud('transactions', pk, updated);
        });
    }, 100);
});
db.transactions.hook('deleting', (pk) => { syncToCloud('transactions', pk, null); });


// --- FUNGSI SINKRONISASI MASUK (CLOUD -> LOCAL) ---
const syncFromCloud = () => {
    if (typeof fdb === 'undefined') return;

    const tables = ['products', 'categories', 'transactions', 'members'];
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
            await db[tableName].delete(isNaN(id) ? id : Number(id));
        });
    });
};

// --- HELPER LABA RUGI (REVISI LOGIKA) ---
window.hitungLabaRugi = async (startDate, endDate) => {
    try {
        const semuaTransaksi = await db.transactions
            .where('date').between(startDate, endDate, true, true)
            .toArray();

        let stats = {
            totalOmzet: 0,
            totalModal: 0,
            totalLabaBersih: 0,
            count: semuaTransaksi.length
        };

        semuaTransaksi.forEach(tr => {
            stats.totalOmzet += Number(tr.total || 0);
            
            if (tr.items && Array.isArray(tr.items)) {
                tr.items.forEach(item => {
                    const qty = Number(item.qty || 0);
                    const modalSatuan = Number(item.price_modal || 0);
                    const jualSatuan = Number(item.price_sell || 0);

                    stats.totalModal += (modalSatuan * qty);

                    if (typeof item.profit !== 'undefined') {
                        stats.totalLabaBersih += Number(item.profit);
                    } else {
                        stats.totalLabaBersih += (jualSatuan - modalSatuan) * qty;
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

// --- EKSEKUSI JALANKAN DATABASE ---
db.open().then(() => {
    console.log("Database SinarPagiDB v9 Aktif");
    syncFromCloud(); 
}).catch(err => {
    console.error("Koneksi Database Gagal:", err);
});
